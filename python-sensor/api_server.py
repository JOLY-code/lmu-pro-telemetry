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
import shutil

from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi import File, UploadFile, HTTPException, Query
from pydantic import BaseModel

# Import des scripts Python purs
from live_telemetry import LiveTelemetryThread 
from telemetry_data import LMUTelemetryPipeline
from setup_manager import LMU_SetupManager
from RaceEngineerLogic import RaceEngineerLogic
from audio_spotter import AudioSpotter
from live_spotter import LiveSpotterEngine
from xml_parser import XMLHistoryParser 
from bop_manager import BoPManager
from community_reference_manager import CommunityReferenceManager

# ==========================================================
# ISOLATION MATÉRIELLE
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

app = FastAPI(title="LMU Track Engineer API")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
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

    def update_external_data():
        # Mise à jour BoP (Le manager lit le titre de l'article en ligne avant de télécharger)
        bop = BoPManager()
        if bop.fetch_latest_bop_pdf():
            bop.parse_bop_pdf()
        
        # Mise à jour Laptimes (Le manager lit le "Last updated: [...] CEST" avant de télécharger)
        from community_reference_manager import CommunityReferenceManager
        comm = CommunityReferenceManager()
        comm.fetch_and_parse()

    threading.Thread(target=update_external_data, daemon=True).start()

@app.on_event("shutdown")
def shutdown_event():
    print("[API] Arrêt des processus sécurisés...")
    spotter_engine.stop()
    audio_engine.stop()
    telemetry_engine.stop()

# ==========================================================
# ROUTES TEMPS RÉEL (LiveTelemetryThread & LMUTelemetryPipeline)
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

@app.get("/api/community-reference")
def get_community_reference():
    """Renvoie les données d'Ohne Speed (Temps Alien, Barèmes de Pace, Fuel)."""
    comm_path = os.path.join(".", "community_reference.json")
    if os.path.exists(comm_path):
        with open(comm_path, "r", encoding="utf-8") as f:
            return {"status": "success", "data": json.load(f)}
    return {"status": "error", "message": "Aucune donnée de référence locale."}

@app.get("/api/test-audio")
def test_audio():
    audio_engine.say("Box, box. Radio check, loud and clear.", "test", cooldown=0)
    return {"status": "success"}

@app.get("/api/bop")
def get_bop_data():
    """Renvoie la base de données BoP complète."""
    bop_path = os.path.join(".", "bop_database.json")
    if os.path.exists(bop_path):
        with open(bop_path, "r", encoding="utf-8") as f:
            return {"status": "success", "data": json.load(f)}
    return {"status": "error", "message": "Aucune donnée BoP locale trouvée."}

@app.get("/api/sessions/latest")
def get_latest_session_info():
    pipeline = LMUTelemetryPipeline(log_directory=".")
    context = pipeline.extract_session_context()
    if not context: return {"status": "empty", "message": "Aucune session trouvée dans DuckDB."}
    return {"status": "success", "session": context}

@app.get("/api/diagnostic")
def run_ai_diagnostic():
    print("[API] Lancement du diagnostic par l'IA...")
    pipeline = LMUTelemetryPipeline(log_directory=".")
    df_telemetry = pipeline.extract_stint_data()
    session_context = pipeline.extract_session_context()
    df_competitors = pipeline.extract_competitors_data()
    
    if df_telemetry is None: return {"status": "error", "message": "Aucune donnée"}

    df_spatial = pipeline.build_spatial_telemetry(df_telemetry)
    sm = LMU_SetupManager(setups_directory=".")
    engineer = RaceEngineerLogic(sm)
    success = engineer.analyze_and_optimize(df_telemetry, session_context, df_competitors)
    
    if success:
        return {
            "status": "success", "report": engineer.diagnostic_report, "new_setup": sm.current_setup,
            "telemetry": df_spatial.to_dict(orient='records'),
            "laps": df_telemetry[['Lap', 'LapTime', 'Sector1', 'Sector2', 'Sector3', 'Valid']].drop_duplicates().to_dict(orient='records')
        }
    return {"status": "error", "message": "Échec de l'analyse."}
        
# ==========================================================
# ROUTES HISTORIQUE (XMLHistoryParser)
# ==========================================================

@app.get("/api/analytics/overall")
def get_overall_analytics():
    parser = XMLHistoryParser(log_directory=".")
    try:
        kpis = parser.extract_lifetime_kpis()
        return {"status": "success", "data": kpis}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/sessions/history")
def get_sessions_history():
    parser = XMLHistoryParser(log_directory=".")
    try:
        history = parser.get_all_sessions_history()
        return {"status": "success", "data": history}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/sessions/details")
def get_session_details(file: str = Query(...), type: str = Query(...)):
    try:
        # CORRECTION ICI : On remet le "." classique au lieu du LMU_LOG_DIR qui faisait crasher
        parser = XMLHistoryParser(log_directory=".") 
        details = parser.get_session_details(file, type)
        if details:
            return {"status": "success", "data": details}
        return {"status": "error", "message": "Détails introuvables."}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

@app.get("/api/sessions/standings")
def get_session_standings(file: str, type: str):
    """Renvoie le classement complet de la course trié par classe."""
    parser = XMLHistoryParser(log_directory=".")
    try:
        standings = parser.get_session_standings(file, type)
        if standings: return {"status": "success", "data": standings}
        return {"status": "error", "message": "Aucun classement trouvé."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/sessions/charts")
def get_session_charts(file: str, type: str):
    """Renvoie les données formatées pour les graphiques de course (Position, Gaps, LapTimes)."""
    parser = XMLHistoryParser(log_directory=".")
    try:
        charts_data = parser.get_race_charts_data(file, type)
        if charts_data: return {"status": "success", "data": charts_data}
        return {"status": "error", "message": "Aucune donnée de graphique trouvée."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/sessions/stats")
def get_session_stats(file: str, type: str):
    """Renvoie les Race Stats détaillées (Pace, Strategy, Incidents) par catégorie."""
    parser = XMLHistoryParser(log_directory=".")
    try:
        stats = parser.get_race_stats_data(file, type)
        if stats: return {"status": "success", "data": stats}
        return {"status": "error", "message": "Aucune stat trouvée."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/sessions/director")
def get_session_director(file: str, type: str):
    """Renvoie l'intégralité du log de course (Incidents, TrackLimits, Damage)."""
    parser = XMLHistoryParser(log_directory=".")
    try:
        data = parser.get_race_director_data(file, type)
        if data: return {"status": "success", "data": data}
        return {"status": "error", "message": "Aucun événement trouvé."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/sessions/yourcharts")
def get_session_yourcharts(file: str, type: str):
    """Renvoie les données graphiques personnelles du joueur courant (Matheo JOLY)."""
    parser = XMLHistoryParser(log_directory=".")
    try:
        data = parser.get_your_charts_data(file, type)
        if data: return {"status": "success", "data": data}
        return {"status": "error", "message": "Aucune donnée personnelle."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

class NoteSaveRequest(BaseModel):
    file: str
    notes: str

@app.get("/api/sessions/chat")
def get_session_chat(file: str, type: str):
    parser = XMLHistoryParser(log_directory=".")
    try:
        data = parser.get_session_chat(file, type)
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/sessions/notes")
def get_session_notes(file: str):
    parser = XMLHistoryParser(log_directory=".")
    try:
        data = parser.get_personal_notes(file)
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/sessions/notes/save")
def save_session_notes(req: NoteSaveRequest):
    parser = XMLHistoryParser(log_directory=".")
    try:
        success = parser.save_personal_notes(req.file, req.notes)
        if success: return {"status": "success", "message": "Notes saved."}
        return {"status": "error", "message": "Failed to save."}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/upload-xml")
async def upload_xml_results(file: UploadFile = File(...)):
    if not file.filename.endswith('.xml'):
        raise HTTPException(status_code=400, detail="Format invalide.")
    
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    parser = XMLHistoryParser(log_directory=".")
    success = parser.import_xml_results(temp_path)
    if os.path.exists(temp_path): os.remove(temp_path)
        
    if success: return {"status": "success", "message": "Session importée avec succès !"}
    return {"status": "error", "message": "Erreur de parsing."}

@app.delete("/api/sessions/delete")
def delete_session(file: str):
    import gc
    if ".." in file or "/" in file or "\\" in file: return {"status": "error", "message": "Invalide."}
    file_path = os.path.join(".", file)
    try:
        if os.path.exists(file_path) and file.endswith(".duckdb"):
            gc.collect() 
            time.sleep(0.1) 
            os.remove(file_path)
            if os.path.exists(file_path + ".wal"): os.remove(file_path + ".wal")
            if os.path.exists(file_path + ".lock"): os.remove(file_path + ".lock")
            return {"status": "success", "message": "Session supprimée."}
        return {"status": "error", "message": "Fichier introuvable."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
# ==========================================================
# ROUTE 3 : RACE CONTROL (Scraping 100% RÉEL des Sessions LMU)
# ==========================================================
@app.get("/api/schedule")
def get_online_schedule():
    """
    Aspire le code HTML du site RaceControl.gg et extrait la totalité 
    des sessions quotidiennes (Daily Races) avec précision.
    """
    print("[API] Aspiration des données en direct sur RaceControl.gg...")
    try:
        import cloudscraper
        from bs4 import BeautifulSoup
        from datetime import datetime, timedelta
        
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
            # 1. Extraction du Titre
            title_elem = card.find('h4')
            if not title_elem: continue
            title = title_elem.text.strip()
            t_lower = title.lower()

            # --- FILTRE STRICT ANTI-RFACTOR 2 ---
            if "radical" in t_lower or "open wheel" in t_lower:
                continue
            
            # 2. Catégorie et Rang de Sécurité
            tier_tag = card.find('span', class_='tier-badge')
            category = tier_tag.text.replace('\n', '').strip().capitalize() if tier_tag else "Beginner"
            cat_lower = category.lower()

            # --- DÉFINITION CHIRURGICALE DES TEMPS DE COURSE ---
            if "intermediate" in cat_lower:
                rank, dr, sr, prac, qual, race_time = "Silver", "1.5X", "1.2X", "2 Minutes", "8 Minutes", "30 Minutes"
            elif "advanced" in cat_lower:
                rank, dr, sr, prac, qual, race_time = "Gold", "2.0X", "1.5X", "2 Minutes", "10 Minutes", "40 Minutes"
            else: # Beginner par défaut
                rank, dr, sr, prac, qual, race_time = "Bronze", "1.0X", "1.0X", "3 Minutes", "7 Minutes", "20 Minutes"

            # La durée courte (ex: 20m) affichée dans la liste
            length_short = race_time.replace(' Minutes', 'm').replace(' Minute', 'm')
            
            # 3. Extraction du Circuit
            track = "Unknown Track"
            headers = card.find_all('div', class_='race-header')
            for h in headers:
                spans = h.find_all('span')
                if len(spans) >= 2 and 'track' in spans[0].text.lower(): 
                    track = spans[1].text.strip()
            
            # 4. Reconnaissance Multiclasse WEC
            classes = []
            t_upper = title.upper()
            if "GTE" in t_upper: classes.append("GTE")
            if "GT3" in t_upper: classes.append("GT3")
            if "LMP2" in t_upper: classes.append("LMP2")
            if "LMP3" in t_upper: classes.append("LMP3")
            if "PROTOTYPE" in t_upper: classes.extend(["LMP3", "LMP2"])
            if "WEC" in t_upper or "HYPER" in t_upper: classes.extend(["GT3", "HYPER"])
            if "ELMS" in t_upper: classes.extend(["GT3", "LMP3", "LMP2"])
            if not classes: classes.append("GT3") # Sécurité
            
            setup_type_short = "Fixed" if "Fixed" in title else "Open"
            setup_type_full = "FIXED SETUP" if "Fixed" in title else "OPEN SETUP"
            
            # 5. EXTRACTION DES HORAIRES
            marquee = card.find('div', class_='marquee-content')
            session_times_list = []
            raw_time_badges = []
            
            if marquee:
                for badge in marquee.find_all('span', class_='badge'):
                    time_str = badge.text.strip()
                    parts = time_str.split(' at ')
                    if len(parts) == 2:
                        date_val, time_val = parts[0].strip(), parts[1].strip().upper()
                        raw_time_badges.append((date_val, time_val))
                        try:
                            # Utilisation stricte de %p en minuscule pour Windows
                            t_obj = datetime.strptime(time_val.replace(' ', ''), "%I:%M%p")
                            session_times_list.append(t_obj.strftime("%H:%M"))
                        except:
                            session_times_list.append(time_val)

            # 6. CRÉATION DE CHAQUE COURSE INDIVIDUELLE
            for date_val, time_val in raw_time_badges:
                try:
                    t_obj = datetime.strptime(time_val.replace(' ', ''), "%I:%M%p")
                    
                    # ASTUCE CRUCIALE : On ignore la date écrite sur le site (qui peut être bloquée au 14 Août).
                    # On force la course à utiliser la date d'AUJOURD'HUI.
                    race_dt = now.replace(hour=t_obj.hour, minute=t_obj.minute, second=0, microsecond=0)
                    
                    # Gère les courses qui se passent après minuit
                    if race_dt < now - timedelta(hours=4):
                        race_dt += timedelta(days=1)
                    
                    ts = race_dt.timestamp()
                    
                    # On garde les courses qui ne sont pas terminées depuis plus de 30 mins
                    if ts >= now.timestamp() - 1800:
                        upcoming.append({
                            "id": f"{i}_{ts}",
                            "title": title,
                            "rank": rank,
                            "category": category,
                            "date": race_dt.strftime("%d %b"), # On affiche la vraie date d'aujourd'hui
                            "time": time_val,
                            "length": length_short, # Affiche 20m, 30m, 40m
                            "track": track,
                            "classes": list(set(classes)),
                            "type": setup_type_short,
                            "timestamp": ts,
                            "details": {
                                "safety_rank": rank,
                                "setup_type": setup_type_full,
                                "practice": prac,
                                "qualifying": qual,
                                "race": race_time, # Affiche 20 Minutes, 30 Minutes, 40 Minutes
                                "grid": "20" if rank == "Bronze" else "38",
                                "dr": dr,
                                "sr": sr,
                                "tyres": "8",
                                "warmers": "ENABLED" if rank != "Bronze" else "DISABLED",
                                "damage": "REALISTIC",
                                "fuel": "REALISTIC",
                                "track_limits": "REALISTIC",
                                "assists": "LOW" if rank == "Bronze" else "NONE",
                                "mode": "SOLO",
                                "session_times": session_times_list
                            }
                        })
                except Exception as parse_e:
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


@app.get("/api/setups/apply")
def apply_setup(track: str):
    sm = LMU_SetupManager(setups_directory=".")
    sm.export_optimized_setup(track_name=track)
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)