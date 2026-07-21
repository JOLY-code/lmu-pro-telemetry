import time
import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import threading

# Import des scripts Python purs
from live_telemetry import LiveTelemetryThread 
from telemetry_data import LMUTelemetryPipeline
from setup_manager import LMU_SetupManager
from RaceEngineerLogic import RaceEngineerLogic

app = FastAPI(title="LMU Track Engineer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

telemetry_engine = LiveTelemetryThread()

@app.on_event("startup")
def startup_event():
    print("[API] Démarrage de la sonde télémétrique LMU en tâche de fond...")
    threading.Thread(target=telemetry_engine.run, daemon=True).start()

@app.on_event("shutdown")
def shutdown_event():
    print("[API] Arrêt des processus sécurisés...")
    telemetry_engine.stop()

# ==========================================================
# ROUTE 1 : TEMPS RÉEL (WebSocket à 60Hz pour le Dashboard)
# ==========================================================
@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    print("[WS] Interface React connectée avec succès.")
    try:
        while True:
            if telemetry_engine.latest_data:
                await websocket.send_json(telemetry_engine.latest_data)
            await asyncio.sleep(1/60.0)
    except WebSocketDisconnect:
        print("[WS] Interface React déconnectée.")

# ==========================================================
# ROUTES 2 : ANALYSE & DUCKDB (Pour les vues Data et Setup)
# ==========================================================
@app.get("/api/sessions/latest")
def get_latest_session_info():
    pipeline = LMUTelemetryPipeline(log_directory=".")
    context = pipeline.extract_session_context()
    if not context:
        return {"status": "empty", "message": "Aucune session trouvée dans DuckDB."}
    return {"status": "success", "session": context}

@app.get("/api/diagnostic")
def run_ai_diagnostic():
    print("[API] Lancement du diagnostic par l'IA...")
    pipeline = LMUTelemetryPipeline(log_directory=".")
    df_telemetry = pipeline.extract_stint_data()
    session_context = pipeline.extract_session_context()
    df_competitors = pipeline.extract_competitors_data()
    
    if df_telemetry is None:
        return {"status": "error", "message": "Aucune donnée de télémétrie dans DuckDB"}

    sm = LMU_SetupManager(setups_directory=".")
    engineer = RaceEngineerLogic(sm)
    success = engineer.analyze_and_optimize(df_telemetry, session_context, df_competitors)
    
    if success:
        return {
            "status": "success", 
            "report": engineer.diagnostic_report,
            "new_setup": sm.current_setup,
            "telemetry": df_telemetry.to_dict(orient='records'), 
            "laps": df_telemetry[['Lap', 'LapTime', 'Sector1', 'Sector2', 'Sector3', 'Valid']].drop_duplicates().to_dict(orient='records')
        }
    else:
        return {"status": "error", "message": "Échec de l'analyse."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)