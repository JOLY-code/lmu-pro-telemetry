import duckdb
import pandas as pd
import numpy as np
import os
import uuid

def generate_relational_lmu_telemetry(db_name="lmu_telemetry.duckdb"):
    """
    Génère une base de données relationnelle type MoTeC/Track Titan.
    Sépare la Session, les Pilotes, les Tours et la Télémétrie Haute Fréquence (GPS).
    """
    if os.path.exists(db_name):
        os.remove(db_name)
        
    con = duckdb.connect(db_name)
    print(f"[DATABASE] Création de la base relationnelle : {db_name}")

    # ID de Session Unique (Généré au lancement de la piste)
    session_id = str(uuid.uuid4())

    # --- 1. TABLE SESSION ---
    con.execute("""
        CREATE TABLE sessions (
            SessionID VARCHAR PRIMARY KEY,
            TrackName VARCHAR,
            TrackLengthMeters FLOAT,
            SessionType VARCHAR,
            AmbientTemp FLOAT,
            TrackTemp FLOAT
        )
    """)
    con.execute(f"INSERT INTO sessions VALUES ('{session_id}', 'Algarve International Circuit', 4653.0, 'Race', 22.5, 31.0)")

    # --- 2. TABLE DRIVERS (Pour identifier la Référence et le Joueur) ---
    con.execute("""
        CREATE TABLE drivers (
            SessionID VARCHAR,
            DriverID VARCHAR,
            DriverName VARCHAR,
            CarModel VARCHAR,
            IsPlayer BOOLEAN
        )
    """)
    con.execute(f"INSERT INTO drivers VALUES ('{session_id}', 'D_PLAYER1', 'Vous', 'BMW M4 GT3', TRUE)")
    con.execute(f"INSERT INTO drivers VALUES ('{session_id}', 'D_LEADER', 'Max Verstappen (Ref)', 'BMW M4 GT3', FALSE)")

    # --- 3. TABLE LAPS (Résumés des tours) ---
    con.execute("""
        CREATE TABLE laps (
            LapID VARCHAR PRIMARY KEY,
            SessionID VARCHAR,
            DriverID VARCHAR,
            LapNumber INTEGER,
            LapTime FLOAT,
            Sector1 FLOAT,
            Sector2 FLOAT,
            Sector3 FLOAT,
            IsValid BOOLEAN
        )
    """)
    # Insertion du tour du joueur
    lap_id_player = str(uuid.uuid4())
    con.execute(f"INSERT INTO laps VALUES ('{lap_id_player}', '{session_id}', 'D_PLAYER1', 2, 108.016, 35.5, 42.1, 30.4, TRUE)")
    
    # Insertion du tour de la référence (Plus rapide)
    lap_id_ref = str(uuid.uuid4())
    con.execute(f"INSERT INTO laps VALUES ('{lap_id_ref}', '{session_id}', 'D_LEADER', 2, 102.182, 34.1, 39.8, 28.2, TRUE)")

    # --- 4. TABLE TELEMETRY_60HZ (La vraie data GPS et Capteurs) ---
    print("[DATABASE] Génération de la télémétrie 60Hz (Trajectoires GPS)...")
    
    # Simulation de 1000 points de données (GPS X,Y) pour le joueur
    t = np.linspace(0, 108.016, 1000)
    df_telemetry_player = pd.DataFrame({
        'LapID': lap_id_player,
        'Time_s': t,
        'PosX': np.cos(t / 10) * 100 - 5, # Trajectoire large
        'PosY': np.sin(t / 10) * 100 - 5,
        'SpeedKmh': 200 + np.sin(t) * 50,
        'Throttle': np.clip(np.sin(t)*100 + 50, 0, 100),
        'Brake': np.clip(np.cos(t)*100, 0, 100),
        'Steering': np.sin(t * 2) * 45
    })

    # Simulation pour la référence (Trajectoire plus serrée, plus rapide)
    t_ref = np.linspace(0, 102.182, 1000)
    df_telemetry_ref = pd.DataFrame({
        'LapID': lap_id_ref,
        'Time_s': t_ref,
        'PosX': np.cos(t_ref / 10) * 100, # Trajectoire à la corde (idéale)
        'PosY': np.sin(t_ref / 10) * 100,
        'SpeedKmh': 210 + np.sin(t_ref) * 55,
        'Throttle': np.clip(np.sin(t_ref)*100 + 60, 0, 100),
        'Brake': np.clip(np.cos(t_ref)*100, 0, 100),
        'Steering': np.sin(t_ref * 2) * 40
    })

    df_high_freq = pd.concat([df_telemetry_player, df_telemetry_ref])
    con.execute("CREATE TABLE telemetry_60hz AS SELECT * FROM df_high_freq")

    print("[DATABASE] Architecture complète prête. Vous pouvez requêter la diff Player vs Leader.")
    con.close()
    return db_name

if __name__ == "__main__":
    generate_relational_lmu_telemetry()