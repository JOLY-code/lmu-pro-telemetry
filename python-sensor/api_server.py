import time
import asyncio
import json
import threading
import multiprocessing
import ctypes
import os
import urllib.request
import cloudscraper
import re

from bs4 import BeautifulSoup
from datetime import datetime, timedelta
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
    try:
        num_cores = multiprocessing.cpu_count()
        if num_cores >= 4:
            mask = (1 << (num_cores - 1)) | (1 << (num_cores - 2))
            pid = ctypes.windll.kernel32.GetCurrentProcess()
            ctypes.windll.kernel32.SetProcessAffinityMask(pid, mask)
            print(f"[SYSTEM] Isolation réussie. Backend restreint aux derniers cœurs (Masque: {mask})")
    except Exception as e:
        print(f"[SYSTEM] Avertissement: Impossible d'isoler le CPU ({e})")

isolate_process()

# ==========================================================

app = FastAPI(title="LMU Track Engineer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

telemetry_engine = LiveTelemetryThread()
audio_engine = AudioSpotter()
spotter_engine = LiveSpotterEngine(telemetry_engine, audio_engine)

@app.on_event("startup")
def startup_event():
    print("[API] Démarrage de la sonde télémétrique LMU en tâche de fond...")
    threading.Thread(target=telemetry_engine.run, daemon=True).start()
    audio_engine.start()
    spotter_engine.start()

@app.on_event("shutdown")
def shutdown_event():
    print("[API] Arrêt des processus sécurisés...")
    spotter_engine.stop()
    audio_engine.stop()
    telemetry_engine.stop()

# ==========================================================
# ROUTE 1 : TEMPS RÉEL (WebSocket à 60Hz)
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
# ROUTES 2 : ANALYSE & DUCKDB
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

    df_spatial = pipeline.build_spatial_telemetry(df_telemetry)
    sm = LMU_SetupManager(setups_directory=".")
    engineer = RaceEngineerLogic(sm)
    success = engineer.analyze_and_optimize(df_telemetry, session_context, df_competitors)
    
    if success:
        return {
            "status": "success", 
            "report": engineer.diagnostic_report,
            "new_setup": sm.current_setup,
            "telemetry": df_spatial.to_dict(orient='records'),
            "laps": df_telemetry[['Lap', 'LapTime', 'Sector1', 'Sector2', 'Sector3', 'Valid']].drop_duplicates().to_dict(orient='records')
        }
    else:
        return {"status": "error", "message": "Échec de l'analyse."}

# ==========================================================
# ROUTE 3 : RACE CONTROL (Scraping 100% RÉEL des Sessions LMU)
# ==========================================================
@app.get("/api/schedule")
def get_online_schedule():
    """
    Aspire le code HTML du site RaceControl.gg et extrait la totalité 
    des sessions planifiées pour la journée avec une précision absolue.
    """
    print("[API] Aspiration des données en direct sur RaceControl.gg...")
    try:
        import cloudscraper
        from bs4 import BeautifulSoup
        from datetime import datetime
        
        scraper = cloudscraper.create_scraper(browser={'browser': 'chrome', 'platform': 'windows', 'desktop': True})
        response = scraper.get("https://www.racecontrol.gg/")
        
        if response.status_code != 200:
            return {"status": "error", "message": f"Bloqué par Cloudflare (Code {response.status_code})"}

        soup = BeautifulSoup(response.text, 'html.parser')
        upcoming = []
        now = datetime.now()
        
        # Le site LMU range les courses dans des cartes spécifiques
        cards = soup.find_all('div', class_='scheduled-race-card')
        
        for i, card in enumerate(cards):
            # 1. Extraction du Titre et de l'URL
            title_elem = card.find('h4')
            if not title_elem: continue
            title = title_elem.text.strip()
            
            # 2. Catégorie et Rang de Sécurité
            tier_tag = card.find('span', class_='tier-badge')
            category = tier_tag.text.replace('\n', '').strip().capitalize() if tier_tag else "Beginner"
            
            rank = "Bronze"
            if "Intermediate" in category: rank = "Silver"
            elif "Advanced" in category: rank = "Gold"
            
            # 3. Durée et Circuit
            length = "20m"
            track = "Unknown Track"
            headers = card.find_all('div', class_='race-header')
            for h in headers:
                spans = h.find_all('span')
                if len(spans) >= 2:
                    lbl = spans[0].text.strip().lower()
                    val = spans[1].text.strip()
                    if 'duration' in lbl: length = val.replace(' minutes', 'm').replace(' minute', 'm')
                    elif 'track' in lbl: track = val
            
            # 4. Reconnaissance Multiclasse WEC
            classes = []
            t_upper = title.upper()
            if "GTE" in t_upper: classes.append("GTE")
            if "GT3" in t_upper: classes.append("GT3")
            if "LMP2" in t_upper: classes.append("LMP2")
            if "LMP3" in t_upper: classes.append("LMP3")
            if "PROTOTYPE" in t_upper: classes.extend(["LMP3", "LMP2"])
            if "WEC" in t_upper or "HYPER" in t_upper: classes.extend(["GT3", "HYPER"])
            if not classes: classes.append("GT3") # Sécurité
            
            setup_type = "Fixed" if "Fixed" in title else "Open"
            setup_type_full = "FIXED SETUP" if "Fixed" in title else "OPEN SETUP"
            
            # 5. GÉNÉRATION DES DÉTAILS SPÉCIFIQUES À LA CATÉGORIE
            if "Intermediate" in category:
                dr, sr, prac, qual, grid, warmers, assists = "1.5X", "1.2X", "2 Minutes", "8 Minutes", "38", "DISABLED", "LOW"
            elif "Advanced" in category:
                dr, sr, prac, qual, grid, warmers, assists = "2.0X", "1.5X", "2 Minutes", "8 Minutes", "38", "DISABLED", "NONE"
            else: # Beginner
                dr, sr, prac, qual, grid, warmers, assists = "1.0X", "1.0X", "3 Minutes", "7 Minutes", "20", "ENABLED", "LOW"

            # 6. L'EXTRACTION MASSIVE DES HORAIRES
            marquee = card.find('div', class_='marquee-content')
            raw_time_badges = []
            session_times_list = []
            
            if marquee:
                time_badges = marquee.find_all('span', class_='badge')
                for badge in time_badges:
                    time_str = badge.text.strip() # Extrait brut : "14 Aug at 3:10pm"
                    parts = time_str.split(' at ')
                    
                    if len(parts) == 2:
                        date_val = parts[0].strip()
                        time_val = parts[1].strip().upper()
                        raw_time_badges.append((date_val, time_val))
                        
                        # Création de la liste des horaires pour le grand panneau de détails
                        try:
                            # CORRECTION ICI: %p en minuscule
                            t_obj = datetime.strptime(time_val, "%I:%M%p")
                            session_times_list.append(t_obj.strftime("%H:%M"))
                        except:
                            session_times_list.append(time_val)

            # 7. CRÉATION DE CHAQUE COURSE INDIVIDUELLE
            for date_val, time_val in raw_time_badges:
                try:
                    # CORRECTION ICI : On utilise la vraie date extraite du HTML (ex: "14 Aug") + l'année actuelle
                    full_date_str = f"{date_val} {now.year} {time_val}"
                    race_dt = datetime.strptime(full_date_str, "%d %b %Y %I:%M%p")
                    ts = race_dt.timestamp()
                    
                    # On ne garde que les courses qui ne sont pas terminées depuis longtemps (marge de 30 mins)
                    if ts >= now.timestamp() - 1800:
                        upcoming.append({
                            "id": f"{i}_{ts}",
                            "title": title,
                            "rank": rank,
                            "category": category,
                            "date": date_val,
                            "time": time_val, # Format AM/PM
                            "length": length,
                            "track": track,
                            "classes": list(set(classes)),
                            "type": setup_type,
                            "timestamp": ts,
                            "details": {
                                "safety_rank": rank,
                                "setup_type": setup_type_full,
                                "practice": prac,
                                "qualifying": qual,
                                "race": length.replace('m', ' Minutes').replace('h', ' Hours'),
                                "grid": grid,
                                "dr": dr,
                                "sr": sr,
                                "tyres": "8",
                                "warmers": warmers,
                                "damage": "REALISTIC",
                                "fuel": "REALISTIC",
                                "track_limits": "REALISTIC",
                                "assists": assists,
                                "mode": "SOLO",
                                "session_times": session_times_list
                            }
                        })
                except Exception as parse_e:
                    print(f"[API] Erreur de formatage sur {time_val} : {parse_e}")
                    pass

        # Si l'extraction a fonctionné
        if len(upcoming) > 0:
            upcoming.sort(key=lambda x: x["timestamp"])
            
            # Élimination des doublons parfaits
            unique_upcoming = []
            seen = set()
            for u in upcoming:
                identifier = f"{u['title']}_{u['time']}_{u['date']}"
                if identifier not in seen:
                    seen.add(identifier)
                    unique_upcoming.append(u)

            data = {
                "nextUp": unique_upcoming[:2],       
                "upcoming": unique_upcoming[2:60]    
            }
            print(f"[API] Extraction terminée : {len(unique_upcoming)} sessions réelles trouvées.")
            return {"status": "success", "data": data}
            
        else:
            return {"status": "error", "message": "Aucune session trouvée dans le code source HTML."}
            
    except Exception as e:
        print(f"[API ERROR] Scraping: {e}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)