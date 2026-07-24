import time
import asyncio
import json
import threading
import multiprocessing # NOUVEAU
import ctypes        # NOUVEAU
import os            # NOUVEAU

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Import des scripts Python purs
from live_telemetry import LiveTelemetryThread 
from telemetry_data import LMUTelemetryPipeline
from setup_manager import LMU_SetupManager
from RaceEngineerLogic import RaceEngineerLogic
from audio_spotter import AudioSpotter
from live_spotter import LiveSpotterEngine

# ==========================================================
# ISOLATION MATÉRIELLE (PROTECTION DES FPS DE LMU)
# ==========================================================
def isolate_process():
    """
    Force le processus Python à s'exécuter UNIQUEMENT sur les 2 derniers cœurs
    du processeur (E-Cores) pour sanctuariser le Core 0 dédié au jeu.
    """
    try:
        num_cores = multiprocessing.cpu_count()
        if num_cores >= 4:
            # Création d'un masque binaire pour cibler les 2 derniers cœurs logiques
            # Ex pour 8 cœurs: on cible les cœurs 6 et 7.
            mask = (1 << (num_cores - 1)) | (1 << (num_cores - 2))
            
            # Application directe via l'API Windows (Kernel32)
            pid = ctypes.windll.kernel32.GetCurrentProcess()
            ctypes.windll.kernel32.SetProcessAffinityMask(pid, mask)
            
            print(f"[SYSTEM] Isolation réussie. Backend restreint aux derniers cœurs (Masque: {mask})")
    except Exception as e:
        print(f"[SYSTEM] Avertissement: Impossible d'isoler le CPU ({e})")

# On applique l'isolation dès le lancement du fichier
isolate_process()

# ==========================================================

app = FastAPI(title="LMU Track Engineer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialisation des Threads
telemetry_engine = LiveTelemetryThread()
audio_engine = AudioSpotter()
spotter_engine = LiveSpotterEngine(telemetry_engine, audio_engine)

@app.on_event("startup")
def startup_event():
    print("[API] Démarrage de la sonde télémétrique LMU en tâche de fond...")
    threading.Thread(target=telemetry_engine.run, daemon=True).start()
    
    # Démarrage de l'ingénieur audio et tactique
    audio_engine.start()
    spotter_engine.start()

@app.on_event("shutdown")
def shutdown_event():
    print("[API] Arrêt des processus sécurisés...")
    spotter_engine.stop()
    audio_engine.stop()
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

    # --- TRAITEMENT SPATIAL ---
    df_spatial = pipeline.build_spatial_telemetry(df_telemetry)

    sm = LMU_SetupManager(setups_directory=".")
    engineer = RaceEngineerLogic(sm)
    success = engineer.analyze_and_optimize(df_telemetry, session_context, df_competitors)
    
    if success:
        return {
            "status": "success", 
            "report": engineer.diagnostic_report,
            "new_setup": sm.current_setup,
            "telemetry": df_spatial.to_dict(orient='records'), # On envoie le DataFrame fusionné
            "laps": df_telemetry[['Lap', 'LapTime', 'Sector1', 'Sector2', 'Sector3', 'Valid']].drop_duplicates().to_dict(orient='records')
        }
    else:
        return {"status": "error", "message": "Échec de l'analyse."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)