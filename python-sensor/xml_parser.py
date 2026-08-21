import pandas as pd
import duckdb
import os
import glob
import hashlib
import datetime
import traceback

class XMLHistoryParser:
    """Module Data Engineer dédié EXCLUSIVEMENT à l'historique XML."""
    def __init__(self, log_directory="."):
        self.log_directory = log_directory

    # ==========================================
    # FONCTIONS BOUCLIERS (Anti-Crash)
    # ==========================================
    def _safe_str(self, node, tag, default="Unknown"):
        if node is None: return default
        elem = node.find(tag)
        if elem is not None and elem.text is not None:
            return str(elem.text).strip()
        return default

    def _safe_int(self, node, tag, default=0):
        if node is None: return default
        elem = node.find(tag)
        if elem is not None and elem.text is not None:
            try: return int(float(elem.text))
            except: return default
        return default

    def _safe_float(self, node, tag, default=0.0):
        if node is None: return default
        elem = node.find(tag)
        if elem is not None and elem.text is not None:
            try: return float(elem.text)
            except: return default
        return default

    # ==========================================
    # IMPORTATION MASSIVE
    # ==========================================
    def import_xml_results(self, xml_filepath):
        import xml.etree.ElementTree as ET
        try:
            tree = ET.parse(xml_filepath)
            root = tree.getroot()
            
            file_id = hashlib.md5(xml_filepath.encode('utf-8')).hexdigest()[:10]
            db_file = os.path.join(self.log_directory, f"imported_session_{file_id}.duckdb")
            
            con = duckdb.connect(database=db_file)
            con.execute("DROP TABLE IF EXISTS sessions")
            con.execute("DROP TABLE IF EXISTS session_drivers")
            con.execute("DROP TABLE IF EXISTS laps")
            con.execute("DROP TABLE IF EXISTS stream_events")
            
            con.execute("""
                CREATE TABLE sessions (
                    FileID VARCHAR, SessionType VARCHAR, TrackVenue VARCHAR, TrackLength FLOAT,
                    SessionDate VARCHAR, DurationMinutes INT,
                    Setting VARCHAR, ServerName VARCHAR, ClientFuelVisible INT, PlayerFile VARCHAR,
                    TrackCourse VARCHAR, TrackEvent VARCHAR, TrackData VARCHAR, GameVersion VARCHAR,
                    Dedicated INT, ConnectionType VARCHAR, RaceLaps INT, RaceTime INT,
                    MechFailRate INT, DamageMult INT, FuelMult INT, TireMult INT,
                    VehiclesAllowed VARCHAR, ParcFerme INT, FixedSetups INT, FreeSettings BIGINT,
                    FixedUpgrades INT, TireWarmers INT, SessionLaps BIGINT, FormationAndStart INT,
                    MostLapsCompleted INT
                )
            """)
            con.execute("""
                CREATE TABLE session_drivers (
                    FileID VARCHAR, SessionType VARCHAR, DriverName VARCHAR, isPlayer INT, 
                    VehName VARCHAR, CarClass VARCHAR, 
                    GridPos INT, Position INT, ClassPosition INT, 
                    BestLapTime FLOAT, FinishTime FLOAT, LapsCompleted INT, Pitstops INT, FinishStatus VARCHAR,
                    Connected INT, VehFile VARCHAR, UpgradeCode VARCHAR, Category VARCHAR,
                    CarType VARCHAR, CarNumber VARCHAR, TeamName VARCHAR, ServerScored INT,
                    ClassGridPos INT, LapRankIncludingDiscos INT, DNFReason VARCHAR, ControlAndAids VARCHAR
                )
            """)
            con.execute("""
                CREATE TABLE laps (
                    FileID VARCHAR, SessionType VARCHAR, DriverName VARCHAR, CarClass VARCHAR, 
                    Lap INT, LapTime FLOAT, Sector1 FLOAT, Sector2 FLOAT, Sector3 FLOAT, 
                    TopSpeed FLOAT, FuelLevel FLOAT, FuelUsed FLOAT, VELevel FLOAT, VirtualEnergyUsed FLOAT,
                    WearFL FLOAT, WearFR FLOAT, WearRL FLOAT, WearRR FLOAT,
                    FrontTire VARCHAR, RearTire VARCHAR, Pit INT,
                    Pos INT, ElapsedTime FLOAT, FL_Tire VARCHAR, FR_Tire VARCHAR, RL_Tire VARCHAR, RR_Tire VARCHAR
                )
            """)
            con.execute("""
                CREATE TABLE stream_events (
                    FileID VARCHAR, SessionType VARCHAR, EventType VARCHAR, 
                    EventTime FLOAT, DriverName VARCHAR, RawText VARCHAR,
                    DriverID VARCHAR, Lap INT, WarningPoints FLOAT, CurrentPoints FLOAT,
                    Resolution VARCHAR, Sector VARCHAR, SectorClass VARCHAR, Point INT
                )
            """)

            g_setting = self._safe_str(root, './/Setting')
            g_server = self._safe_str(root, './/ServerName', default="")
            g_fuel_vis = self._safe_int(root, './/ClientFuelVisible')
            g_plr_file = self._safe_str(root, './/PlayerFile')
            g_track_venue = self._safe_str(root, './/TrackVenue')
            g_track_course = self._safe_str(root, './/TrackCourse')
            g_track_event = self._safe_str(root, './/TrackEvent')
            g_track_data = self._safe_str(root, './/TrackData')
            g_track_length = self._safe_float(root, './/TrackLength')
            g_game_ver = self._safe_str(root, './/GameVersion')
            g_dedicated = self._safe_int(root, './/Dedicated')
            g_conn_type = self._safe_str(root, './/ConnectionType')
            g_race_laps = self._safe_int(root, './/RaceLaps')
            g_race_time = self._safe_int(root, './/RaceTime')
            g_mech_fail = self._safe_int(root, './/MechFailRate')
            g_dmg_mult = self._safe_int(root, './/DamageMult')
            g_fuel_mult = self._safe_int(root, './/FuelMult')
            g_tire_mult = self._safe_int(root, './/TireMult')
            g_veh_allowed = self._safe_str(root, './/VehiclesAllowed')
            g_parc_ferme = self._safe_int(root, './/ParcFerme')
            g_fixed_setups = self._safe_int(root, './/FixedSetups')
            g_free_settings = self._safe_int(root, './/FreeSettings')
            g_fixed_upgrades = self._safe_int(root, './/FixedUpgrades')
            g_tire_warmers = self._safe_int(root, './/TireWarmers')
            g_timestring = self._safe_str(root, './/TimeString', default="Unknown Date")
            
            session_tags = ['Practice', 'Practice1', 'Practice2', 'Practice3', 'Qualify', 'Qualify1', 'Qualify2', 'Warmup', 'Race', 'Race1', 'Race2']
            
            for s_type in session_tags:
                session_node = root.find(f'.//{s_type}')
                if session_node is not None:
                    # --- NOUVEAU : Fallback automatique sur l'heure globale ---
                    session_date = self._safe_str(session_node, 'TimeString', default=g_timestring)
                    duration_minutes = self._safe_int(session_node, 'Minutes')
                    if duration_minutes == 0: duration_minutes = self._safe_int(session_node, 'RaceTime')
                    
                    s_laps = self._safe_int(session_node, 'Laps')
                    s_form = self._safe_int(session_node, 'FormationAndStart')
                    s_most_laps = self._safe_int(session_node, 'MostLapsCompleted')
                        
                    con.execute("""
                        INSERT INTO sessions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, [
                        file_id, s_type, g_track_venue, g_track_length, session_date, duration_minutes,
                        g_setting, g_server, g_fuel_vis, g_plr_file, g_track_course, g_track_event, g_track_data,
                        g_game_ver, g_dedicated, g_conn_type, g_race_laps, g_race_time, g_mech_fail, g_dmg_mult,
                        g_fuel_mult, g_tire_mult, g_veh_allowed, g_parc_ferme, g_fixed_setups, g_free_settings,
                        g_fixed_upgrades, g_tire_warmers, s_laps, s_form, s_most_laps
                    ])
                                
                    for driver in session_node.findall('.//Driver'):
                        d_name = self._safe_str(driver, 'Name')
                        d_isPlayer = self._safe_int(driver, 'isPlayer')
                        d_veh = self._safe_str(driver, 'VehName')
                        d_class = self._safe_str(driver, 'CarClass')
                        
                        grid_pos = self._safe_int(driver, 'GridPos')
                        pos = self._safe_int(driver, 'Position')
                        c_pos = self._safe_int(driver, 'ClassPosition')
                        best_lap = self._safe_float(driver, 'BestLapTime')
                        finish_time = self._safe_float(driver, 'FinishTime')
                        laps_comp = self._safe_int(driver, 'Laps')
                        pits = self._safe_int(driver, 'Pitstops')
                        status = self._safe_str(driver, 'FinishStatus')

                        # Nouvelles balises pilotes exhaustives
                        d_conn = self._safe_int(driver, 'Connected', default=1)
                        d_vehfile = self._safe_str(driver, 'VehFile')
                        d_upg = self._safe_str(driver, 'UpgradeCode')
                        d_cat = self._safe_str(driver, 'Category')
                        d_cartype = self._safe_str(driver, 'CarType')
                        d_num = self._safe_str(driver, 'CarNumber')
                        d_team = self._safe_str(driver, 'TeamName')
                        d_scored = self._safe_int(driver, 'ServerScored', default=1)
                        d_cgrid = self._safe_int(driver, 'ClassGridPos')
                        d_laprank = self._safe_int(driver, 'LapRankIncludingDiscos')
                        d_dnf_reason = self._safe_str(driver, 'DNFReason', default="")
                        d_aids = self._safe_str(driver, 'ControlAndAids', default="")
                        
                        con.execute("""
                            INSERT INTO session_drivers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, [
                            file_id, s_type, d_name, d_isPlayer, d_veh, d_class, grid_pos, pos, c_pos, best_lap, finish_time, laps_comp, pits, status,
                            d_conn, d_vehfile, d_upg, d_cat, d_cartype, d_num, d_team, d_scored, d_cgrid, d_laprank, d_dnf_reason, d_aids
                        ])
                        
                        for lap in driver.findall('Lap'):
                            lap_num = int(lap.get('num', 0))
                            try: lap_time = float(lap.text) if lap.text and lap.text != '--.----' else 0.0
                            except: lap_time = 0.0
                            
                            # --- NOUVEAU : Bouclier anti-crash pour les valeurs "--.---" de LMU ---
                            def _get_f(key, default=0.0):
                                val = lap.get(key)
                                if not val or val == '--.---': return default
                                try: return float(val)
                                except: return default
                            
                            s1, s2, s3 = _get_f('s1'), _get_f('s2'), _get_f('s3')
                            topspeed = _get_f('topspeed')
                            fuel_level, fuel_used = _get_f('fuel'), _get_f('fuelUsed')
                            ve_level, ve_used = _get_f('ve'), _get_f('veUsed') * 100.0
                            
                            w_fl = _get_f('twfl', 1.0) * 100.0
                            w_fr = _get_f('twfr', 1.0) * 100.0
                            w_rl = _get_f('twrl', 1.0) * 100.0
                            w_rr = _get_f('twrr', 1.0) * 100.0
                            
                            f_comp = lap.get('fcompound', 'Unknown').split(',')[-1] if lap.get('fcompound') else "Unknown"
                            r_comp = lap.get('rcompound', 'Unknown').split(',')[-1] if lap.get('rcompound') else "Unknown"
                            is_pit = 1 if lap.get('pit') == '1' else 0
                            
                            try: l_pos = int(lap.get('p', pos))
                            except: l_pos = pos
                            
                            l_et = _get_f('et')
                            l_fl_tire = lap.get('FL', 'Unknown').split(',')[-1] if lap.get('FL') else f_comp
                            l_fr_tire = lap.get('FR', 'Unknown').split(',')[-1] if lap.get('FR') else f_comp
                            l_rl_tire = lap.get('RL', 'Unknown').split(',')[-1] if lap.get('RL') else r_comp
                            l_rr_tire = lap.get('RR', 'Unknown').split(',')[-1] if lap.get('RR') else r_comp
                            
                            con.execute("""
                                INSERT INTO laps VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """, [
                                file_id, s_type, d_name, d_class, lap_num, lap_time, s1, s2, s3, topspeed, fuel_level, fuel_used, ve_level, ve_used, 
                                w_fl, w_fr, w_rl, w_rr, f_comp, r_comp, is_pit, l_pos, l_et, l_fl_tire, l_fr_tire, l_rl_tire, l_rr_tire
                            ])
                    
                    stream_node = session_node.find('Stream')
                    if stream_node is not None:
                        for event in stream_node:
                            tag = event.tag
                            et_time = float(event.get('et', 0.0)) if event.get('et') else 0.0
                            d_name = event.get('Driver', "Unknown")
                            raw_text = event.text if event.text else ""
                            
                            # Nouvelles balises d'événements étendues
                            e_id = event.get('ID', "")
                            e_lap = int(event.get('Lap', 0)) if event.get('Lap') else 0
                            e_wpoints = float(event.get('WarningPoints', 0.0)) if event.get('WarningPoints') else 0.0
                            e_cpoints = float(event.get('CurrentPoints', 0.0)) if event.get('CurrentPoints') else 0.0
                            e_res = event.get('Resolution', "")
                            e_sec = event.get('Sector', "")
                            e_class = event.get('Class', "")
                            e_point = int(event.get('point', 0)) if event.get('point') else 0

                            con.execute("""
                                INSERT INTO stream_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """, [
                                file_id, s_type, tag, et_time, d_name, raw_text,
                                e_id, e_lap, e_wpoints, e_cpoints, e_res, e_sec, e_class, e_point
                            ])

            con.commit()
            con.close()
            print(f"[XML IMPORT] ARCHITECTURE BIG DATA TERMINEE. Import parfait.")
            return True
        except Exception as e:
            traceback.print_exc() 
            return False

    # ==========================================
    # LECTURE DE L'HISTORIQUE (VUE LISTE & ANALYTICS)
    # ==========================================
    def get_all_sessions_history(self):
        import datetime
        import os
        import glob
        import duckdb
        import pandas as pd
        
        search_pattern = os.path.join(self.log_directory, "imported_session_*.duckdb")
        files = glob.glob(search_pattern)
        history = []
        
        for f in files:
            con = None
            try:
                con = duckdb.connect(database=f, read_only=True)
                
                # --- SÉLECTION DU CARTYPE ET FILTRE STRICT SUR JOLY ---
                query = """
                    SELECT s.TrackVenue, s.SessionType, s.DurationMinutes, s.SessionDate, s.FileID, s.FuelMult, s.TireMult,
                           d.VehName, d.CarClass, d.CarType, d.BestLapTime, d.LapsCompleted, d.GridPos, d.ClassPosition, d.DriverName
                    FROM sessions s
                    JOIN session_drivers d ON s.FileID = d.FileID AND s.SessionType = d.SessionType
                    WHERE UPPER(d.DriverName) LIKE '%JOLY%'
                """
                df = con.execute(query).df()
                
                if not df.empty:
                    for _, row in df.iterrows():
                        try:
                            dt_obj = datetime.datetime.strptime(str(row['SessionDate']), "%Y/%m/%d %H:%M:%S")
                            date_str = dt_obj.strftime("%d %b %Y, %I:%M %p")
                        except:
                            date_str = str(row['SessionDate'])
                            
                        # MULTIPLICATEURS SERVEUR (Pour normaliser la data en 1X)
                        f_mult = float(row['FuelMult']) if pd.notna(row['FuelMult']) and row['FuelMult'] > 0 else 1.0
                        t_mult = float(row['TireMult']) if pd.notna(row['TireMult']) and row['TireMult'] > 0 else 1.0

                        wear_fl, wear_fr, wear_rl, wear_rr = 0.0, 0.0, 0.0, 0.0
                        avg_fuel_used, avg_ve_used, avg_top_speed, max_top_speed = 0.0, 0.0, 0.0, 0.0
                        starting_tire = "Medium"
                        
                        laps_df = con.execute("""
                            SELECT FrontTire, WearFL, WearFR, WearRL, WearRR, FuelUsed, VirtualEnergyUsed, TopSpeed, LapTime
                            FROM laps 
                            WHERE FileID=? AND UPPER(SessionType)=UPPER(?) AND DriverName=?
                            ORDER BY Lap ASC
                        """, [row['FileID'], row['SessionType'], row['DriverName']]).df()
                        
                        if not laps_df.empty:
                            starting_tire = str(laps_df.iloc[0]['FrontTire'])
                            
                            # 1. CALCUL ULTRA-PRÉCIS DE L'USURE (Différence entre chaque tour)
                            v_laps = laps_df[laps_df['LapTime'] > 0].copy()
                            if len(v_laps) > 1:
                                # On regarde combien de gomme a été perdue depuis le tour précédent
                                v_laps['DropFL'] = -v_laps['WearFL'].diff()
                                v_laps['DropFR'] = -v_laps['WearFR'].diff()
                                v_laps['DropRL'] = -v_laps['WearRL'].diff()
                                v_laps['DropRR'] = -v_laps['WearRR'].diff()
                                
                                # Filtre intelligent : On ignore les drops négatifs (arrêts aux stands) ou > 20% (bug LMU)
                                valid_drops = v_laps[(v_laps['DropFL'] >= 0) & (v_laps['DropFL'] < 20)]
                                if not valid_drops.empty:
                                    wear_fl = float(valid_drops['DropFL'].mean()) / t_mult
                                    wear_fr = float(valid_drops['DropFR'].mean()) / t_mult
                                    wear_rl = float(valid_drops['DropRL'].mean()) / t_mult
                                    wear_rr = float(valid_drops['DropRR'].mean()) / t_mult

                            # 2. Conso et Vitesse
                            v_fuel = laps_df[(laps_df['FuelUsed'] > 0) & (laps_df['LapTime'] > 0)]
                            if not v_fuel.empty: avg_fuel_used = (float(v_fuel['FuelUsed'].mean()) * 100.0) / f_mult
                            
                            v_ve = laps_df[(laps_df['VirtualEnergyUsed'] > 0) & (laps_df['LapTime'] > 0)]
                            if not v_ve.empty: avg_ve_used = float(v_ve['VirtualEnergyUsed'].mean()) / f_mult
                            
                            v_ts = laps_df[(laps_df['TopSpeed'] > 0) & (laps_df['LapTime'] > 0)]
                            if not v_ts.empty:
                                avg_top_speed = float(v_ts['TopSpeed'].mean())
                                max_top_speed = float(v_ts['TopSpeed'].max())

                        # --- EXTRACTION DE LA COMMUNAUTÉ ---
                        comm_wear_fl, comm_wear_fr, comm_wear_rl, comm_wear_rr = 0.0, 0.0, 0.0, 0.0
                        comm_avg_fuel, comm_avg_ve, comm_avg_ts, comm_max_ts = 0.0, 0.0, 0.0, 0.0
                        comm_laps_total = 0

                        # Usure mathématique parfaite de la communauté (Requête SQL Window Functions)
                        comm_wear_query = """
                            SELECT 
                                AVG(DropFL) as AvgWearFL, AVG(DropFR) as AvgWearFR,
                                AVG(DropRL) as AvgWearRL, AVG(DropRR) as AvgWearRR,
                                COUNT(*) as CommLaps
                            FROM (
                                SELECT 
                                    LAG(WearFL) OVER (PARTITION BY DriverName ORDER BY Lap) - WearFL as DropFL,
                                    LAG(WearFR) OVER (PARTITION BY DriverName ORDER BY Lap) - WearFR as DropFR,
                                    LAG(WearRL) OVER (PARTITION BY DriverName ORDER BY Lap) - WearRL as DropRL,
                                    LAG(WearRR) OVER (PARTITION BY DriverName ORDER BY Lap) - WearRR as DropRR,
                                    LapTime
                                FROM laps
                                WHERE FileID=? AND UPPER(SessionType)=UPPER(?) AND DriverName!=? AND CarClass=?
                            )
                            WHERE DropFL >= 0 AND DropFL < 20 AND LapTime > 0
                        """
                        comm_wear_df = con.execute(comm_wear_query, [row['FileID'], row['SessionType'], row['DriverName'], row['CarClass']]).df()
                        
                        if not comm_wear_df.empty and pd.notna(comm_wear_df['AvgWearFL'].iloc[0]):
                            comm_laps_total = int(comm_wear_df['CommLaps'].iloc[0])
                            # SÉCURITÉ : Vérifier que t_mult > 0 pour éviter la division par zéro !
                            safe_t_mult = t_mult if t_mult > 0 else 1.0
                            comm_wear_fl = float(comm_wear_df['AvgWearFL'].iloc[0]) / safe_t_mult
                            comm_wear_fr = float(comm_wear_df['AvgWearFR'].iloc[0]) / safe_t_mult
                            comm_wear_rl = float(comm_wear_df['AvgWearRL'].iloc[0]) / safe_t_mult
                            comm_wear_rr = float(comm_wear_df['AvgWearRR'].iloc[0]) / safe_t_mult

                        # Conso et Vitesse de la communauté
                        comm_perf_query = """
                            SELECT 
                                AVG(CASE WHEN FuelUsed > 0 AND LapTime > 0 THEN FuelUsed ELSE NULL END) as AvgFuel,
                                AVG(CASE WHEN VirtualEnergyUsed > 0 AND LapTime > 0 THEN VirtualEnergyUsed ELSE NULL END) as AvgVE,
                                AVG(CASE WHEN TopSpeed > 0 AND LapTime > 0 THEN TopSpeed ELSE NULL END) as AvgTopSpeed,
                                MAX(TopSpeed) as MaxTopSpeed
                            FROM laps 
                            WHERE FileID=? AND UPPER(SessionType)=UPPER(?) AND DriverName!=? AND CarClass=?
                        """
                        comm_perf_df = con.execute(comm_perf_query, [row['FileID'], row['SessionType'], row['DriverName'], row['CarClass']]).df()
                        
                        # SÉCURITÉ : Vérifier que f_mult > 0 pour éviter la division par zéro !
                        safe_f_mult = f_mult if f_mult > 0 else 1.0

                        if not comm_perf_df.empty:
                            comm_avg_fuel = (float(comm_perf_df['AvgFuel'].dropna().mean()) * 100.0) / safe_f_mult if not comm_perf_df['AvgFuel'].dropna().empty else 0.0
                            comm_avg_ve = float(comm_perf_df['AvgVE'].dropna().mean()) / safe_f_mult if not comm_perf_df['AvgVE'].dropna().empty else 0.0
                            comm_avg_ts = float(comm_perf_df['AvgTopSpeed'].dropna().mean()) if not comm_perf_df['AvgTopSpeed'].dropna().empty else 0.0
                            comm_max_ts = float(comm_perf_df['MaxTopSpeed'].dropna().max()) if not comm_perf_df['MaxTopSpeed'].dropna().empty else 0.0

                        history.append({
                            "track": row['TrackVenue'],
                            "car": row['VehName'],
                            "class": row['CarClass'],
                            "carType": str(row['CarType']) if 'CarType' in row and pd.notna(row['CarType']) else "",
                            "type": str(row['SessionType']).capitalize(),
                            "grid": int(row['GridPos']) if pd.notna(row['GridPos']) else 0,
                            "finish": int(row['ClassPosition']) if pd.notna(row['ClassPosition']) else 0,
                            "laps": int(row['LapsCompleted']) if pd.notna(row['LapsCompleted']) else 0,
                            "best": f"{int(row['BestLapTime']//60)}:{row['BestLapTime']%60:06.3f}" if pd.notna(row['BestLapTime']) and row['BestLapTime'] > 0 else "--:--.---",
                            "duration": int(row['DurationMinutes']) if pd.notna(row['DurationMinutes']) else 0,
                            "date": date_str,
                            "file": os.path.basename(f),
                            "startingTires": starting_tire,
                            "wearFL": wear_fl,
                            "wearFR": wear_fr,
                            "wearRL": wear_rl,
                            "wearRR": wear_rr,
                            "fuelUsed": avg_fuel_used,
                            "veUsed": avg_ve_used,
                            "topSpeed": avg_top_speed,
                            "maxTopSpeed": max_top_speed,
                            "commLaps": comm_laps_total,
                            "commWearFL": comm_wear_fl,
                            "commWearFR": comm_wear_fr,
                            "commWearRL": comm_wear_rl,
                            "commWearRR": comm_wear_rr,
                            "commFuelUsed": comm_avg_fuel,
                            "commVeUsed": comm_avg_ve,
                            "commTopSpeed": comm_avg_ts,
                            "commMaxTopSpeed": comm_max_ts
                        })
            except Exception:
                pass
            finally:
                if con is not None: con.close()
                    
        history.sort(key=lambda x: os.path.getmtime(os.path.join(self.log_directory, x['file'])), reverse=True)
        return history

    # ==========================================
    # LECTURE DETAILLEE (VUE OVERVIEW)
    # ==========================================
    def get_session_details(self, filename, session_type):
        """Récupère et calcule toutes les données pour la vue Overview de React."""
        db_file = os.path.join(self.log_directory, filename)
        if not os.path.exists(db_file): return None
        
        con = duckdb.connect(database=db_file, read_only=True)
        try:
            df_info = con.execute("SELECT * FROM session_drivers WHERE UPPER(DriverName) LIKE '%JOLY%' AND UPPER(SessionType) = UPPER(?)", [session_type]).df()
            df_sess = con.execute("SELECT * FROM sessions WHERE UPPER(SessionType) = UPPER(?)", [session_type]).df()
            if df_info.empty or df_sess.empty: return None
            
            info = df_info.iloc[0]
            sess = df_sess.iloc[0]
            player_name = info['DriverName']
            player_class = info['CarClass']
            
            try:
                dt_obj = datetime.datetime.strptime(sess['SessionDate'], "%Y/%m/%d %H:%M:%S")
                date_str = dt_obj.strftime("%b %d, %Y at %I:%M %p")
            except:
                date_str = sess['SessionDate']
            
            def format_time(seconds):
                try:
                    sec = float(seconds)
                    if pd.isna(sec) or sec <= 0: return "--:--.---"
                    m = int(sec // 60)
                    s = sec % 60
                    return f"{m}:{s:06.3f}"
                except:
                    return "--:--.---"

            # 1. RÉCUPÉRATION DU "ALIEN PACE" : Le meilleur tour absolu de la catégorie dans la session !
            alien_lap_df = con.execute("SELECT MIN(BestLapTime) as AlienPace FROM session_drivers WHERE CarClass = ? AND FileID = ? AND BestLapTime > 0", [player_class, info['FileID']]).df()
            alien_pace_val = alien_lap_df['AlienPace'].iloc[0] if not alien_lap_df.empty else 0.0
            alien_pace = float(alien_pace_val) if pd.notna(alien_pace_val) else 0.0

            # 2. RÉCUPÉRATION DE TOUS TES TOURS
            laps_df = con.execute("SELECT * FROM laps WHERE DriverName = ? AND UPPER(SessionType) = UPPER(?) AND LapTime > 0", [player_name, session_type]).df()
            player_best = float(info['BestLapTime']) if pd.notna(info['BestLapTime']) else 0.0

            # 3. CRÉATION DES 4 CATÉGORIES DE TOURS
            all_laps = laps_df[laps_df['LapTime'] > 0]
            valid_laps = all_laps[all_laps['Pit'] == 0]
            race_pace_laps = valid_laps[valid_laps['LapTime'] <= (player_best * 1.07)] if player_best > 0 else valid_laps

            # Fonction d'aide pour générer les stats d'un bouton
            def calc_pace(df_subset, override_time=None):
                avg_t = float(df_subset['LapTime'].mean()) if override_time is None and not df_subset.empty else override_time
                if pd.isna(avg_t) or avg_t == 0: avg_t = 0.0
                delta = (avg_t - alien_pace) if alien_pace > 0 and avg_t > 0 else 0.0
                pct = (avg_t / alien_pace * 100) if alien_pace > 0 and avg_t > 0 else 100.0
                return {
                    "time": format_time(avg_t),
                    "delta": f"+{delta:.3f}s" if delta > 0 else f"{delta:.3f}s",
                    "percentRaw": pct,
                    "laps": len(df_subset) if override_time is None else 1
                }

            # On compile les données pour les 4 boutons de l'interface
            pace_data = {
                "racePace": calc_pace(race_pace_laps),
                "validLaps": calc_pace(valid_laps),
                "allLaps": calc_pace(all_laps),
                "bestLap": calc_pace(all_laps, override_time=player_best)
            }

            # --- Reste des KPI standard (basés sur le Race Pace) ---
            best_s1 = race_pace_laps['Sector1'].replace(0, pd.NA).min() if not race_pace_laps.empty else 0
            best_s2 = race_pace_laps['Sector2'].replace(0, pd.NA).min() if not race_pace_laps.empty else 0
            best_s3 = race_pace_laps['Sector3'].replace(0, pd.NA).min() if not race_pace_laps.empty else 0
            optimum_lap = best_s1 + best_s2 + best_s3
            
            top_speed = float(race_pace_laps['TopSpeed'].max()) if not race_pace_laps.empty else 0.0
            consistency_val = float(race_pace_laps['LapTime'].max() - race_pace_laps['LapTime'].min()) if not race_pace_laps.empty else 0.0
            avg_fuel = float(race_pace_laps['FuelUsed'].mean()) if not race_pace_laps.empty else 0.0
            avg_ve = float(race_pace_laps['VirtualEnergyUsed'].mean()) if 'VirtualEnergyUsed' in race_pace_laps.columns and not race_pace_laps.empty else 0.0
            
            track_length_km = sess['TrackLength'] / 1000 if pd.notna(sess['TrackLength']) and sess['TrackLength'] > 0 else 4.54
            fuel_ratio = (avg_fuel * 75.0) / track_length_km if track_length_km > 0 else 0.0

            classes_df = con.execute("SELECT DISTINCT CarClass FROM session_drivers WHERE UPPER(SessionType) = UPPER(?)", [session_type]).df()
            car_classes = classes_df['CarClass'].tolist() if not classes_df.empty else [player_class]
            
            last_lap = con.execute("SELECT WearFL, WearFR, WearRL, WearRR FROM laps WHERE DriverName = ? AND UPPER(SessionType) = UPPER(?) ORDER BY Lap DESC LIMIT 1", [player_name, session_type]).df()
            first_lap = con.execute("SELECT FrontTire FROM laps WHERE DriverName = ? AND UPPER(SessionType) = UPPER(?) ORDER BY Lap ASC LIMIT 1", [player_name, session_type]).df()
            
            most_worn_name = "--"
            start_tire = first_lap.iloc[0]['FrontTire'] if not first_lap.empty else "Medium"
            if not last_lap.empty:
                wears = {'Front Left': 100 - last_lap.iloc[0]['WearFL'], 'Front Right': 100 - last_lap.iloc[0]['WearFR'],
                         'Rear Left': 100 - last_lap.iloc[0]['WearRL'], 'Rear Right': 100 - last_lap.iloc[0]['WearRR']}
                most_worn_name = max(wears, key=wears.get)
            
            grid_pos = int(info['GridPos']) if pd.notna(info['GridPos']) else 0
            
            return {
                "track": sess['TrackVenue'],
                "date": date_str,
                "car": info['VehName'],
                "class": info['CarClass'],
                "type": "RACE (MULTIPLAYER)" if str(info['SessionType']).upper() == "RACE" else str(info['SessionType']).upper(),
                "gridPos": str(grid_pos) if grid_pos > 0 else '--',
                "finishPos": str(int(info['ClassPosition'])) if pd.notna(info['ClassPosition']) else '--',
                "finishStatus": info['FinishStatus'],
                "bestLap": format_time(info['BestLapTime']),
                "totalTime": format_time(info['FinishTime']),
                "laps": str(int(info['LapsCompleted'])) if pd.notna(info['LapsCompleted']) else '--',
                "startingTires": start_tire,
                "fuelRatio": f"{fuel_ratio:.2f}", 
                "trackLength": f"{track_length_km:.2f} km" if pd.notna(sess['TrackLength']) else '--',
                "pitstops": str(int(info['Pitstops'])) if pd.notna(info['Pitstops']) else '--',
                "carClasses": car_classes,
                "consistency": format_time(consistency_val),
                "optimumLap": format_time(optimum_lap),
                "averageLap": pace_data['racePace']['time'], # Par défaut on affiche Race Pace en haut
                "bestS1": f"0:{best_s1:06.3f}" if pd.notna(best_s1) and best_s1 > 0 else "--",
                "bestS2": f"0:{best_s2:06.3f}" if pd.notna(best_s2) and best_s2 > 0 else "--",
                "bestS3": f"0:{best_s3:06.3f}" if pd.notna(best_s3) and best_s3 > 0 else "--",
                "topSpeed": f"{top_speed:.1f} km/h",
                "avgVirtualEnergy": f"{avg_ve:.2f}%" if avg_ve > 0 else "N/A",
                "mostWornTyre": most_worn_name,
                "alienPace": format_time(alien_pace),
                "paceData": pace_data, # <--- ON ENVOIE LES 4 BOUTONS ICI
                "validLapsCount": len(race_pace_laps)
            }
        except Exception as e:
            import traceback
            traceback.print_exc()
            return None
        finally:
            con.close()

    # ==========================================
    # LECTURE DU CLASSEMENT (VUE STANDINGS)
    # ==========================================
    def get_session_standings(self, filename, session_type):
        """Récupère le classement de fin de course, calcule les Gaps et les changements de positions."""
        db_file = os.path.join(self.log_directory, filename)
        if not os.path.exists(db_file): return None
        
        con = duckdb.connect(database=db_file, read_only=True)
        try:
            query = """
                SELECT DriverName, isPlayer, VehName, CarClass, GridPos, Position, 
                       ClassPosition, BestLapTime, FinishTime, LapsCompleted, 
                       Pitstops, FinishStatus
                FROM session_drivers
                WHERE UPPER(SessionType) = UPPER(?)
                ORDER BY CarClass ASC, ClassPosition ASC
            """
            df = con.execute(query, [session_type]).df()
            if df.empty: return {}
            
            def format_time(seconds):
                try:
                    sec = float(seconds)
                    if pd.isna(sec) or sec <= 0: return "--:--.---"
                    m = int(sec // 60)
                    s = sec % 60
                    return f"{m}:{s:06.3f}"
                except: return "--:--.---"
            
            standings = {}
            # On groupe les pilotes par catégorie (Hypercar, GT3, etc.)
            for car_class, group in df.groupby('CarClass'):
                
                # 1. On recrée la grille de départ spécifique à CETTE catégorie
                group = group.sort_values(by=['GridPos'])
                group['ClassGridPos'] = range(1, len(group) + 1)
                
                # 2. On trie le résultat final par la position d'arrivée
                group = group.sort_values(by=['ClassPosition'])
                
                class_standings = []
                leader = group.iloc[0]
                leader_laps = int(leader['LapsCompleted']) if pd.notna(leader['LapsCompleted']) else 0
                leader_time = float(leader['FinishTime']) if pd.notna(leader['FinishTime']) else 0.0
                
                for _, row in group.iterrows():
                    laps = int(row['LapsCompleted']) if pd.notna(row['LapsCompleted']) else 0
                    f_time = float(row['FinishTime']) if pd.notna(row['FinishTime']) else 0.0
                    status = str(row['FinishStatus'])
                    pos = int(row['ClassPosition'])
                    c_grid = int(row['ClassGridPos'])
                    
                    # Différence de position (Grille - Arrivée)
                    pos_change = c_grid - pos
                    
                    # Calcul de l'écart (Gap)
                    gap = ""
                    if pos == 1 and "DNF" not in status.upper() and status != "None":
                        gap = "LEADER"
                    elif "DNF" in status.upper() or status == "None":
                        gap = "DNF"
                    elif laps < leader_laps:
                        laps_down = leader_laps - laps
                        gap = f"+{laps_down} Lap{'s' if laps_down > 1 else ''}"
                    else:
                        diff = f_time - leader_time
                        if diff > 0:
                            gap = f"+{diff:.3f}"
                        else:
                            gap = "--"
                            
                    display_finish = format_time(f_time) if "DNF" not in status.upper() and status != "None" and laps > 0 else "--:--.---"
                    
                    class_standings.append({
                        "pos": pos,
                        "posChange": pos_change,
                        "grid": c_grid,
                        "driver": str(row['DriverName']),
                        "isPlayer": int(row['isPlayer']) == 1,
                        "car": str(row['VehName']),
                        "bestLap": format_time(row['BestLapTime']),
                        "finishTime": display_finish,
                        "laps": laps,
                        "pitstops": int(row['Pitstops']) if pd.notna(row['Pitstops']) else 0,
                        "gap": gap,
                        "status": "DNF" if "DNF" in status.upper() or status == "None" else "Finished"
                    })
                    
                standings[str(car_class)] = class_standings
            return standings
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return None
        finally:
            con.close()

    # ==========================================
    # LECTURE DES GRAPHIQUES (RACE CHARTS)
    # ==========================================
    def get_race_charts_data(self, filename, session_type):
        db_file = os.path.join(self.log_directory, filename)
        if not os.path.exists(db_file): return None
        con = duckdb.connect(database=db_file, read_only=True)
        try:
            # On cherche spécifiquement JOLY, car isPlayer=1 cible 30 humains en ligne
            df_player = con.execute("SELECT DriverName FROM session_drivers WHERE UPPER(DriverName) LIKE '%JOLY%' AND FileID = (SELECT FileID FROM sessions LIMIT 1)").df()
            player_name = str(df_player.iloc[0]['DriverName']) if not df_player.empty else ""

            query = "SELECT DriverName, CarClass, Lap, LapTime, Sector1, Sector2, Sector3, Pit FROM laps WHERE UPPER(SessionType) = UPPER(?) AND LapTime > 0 ORDER BY Lap ASC"
            laps_df = con.execute(query, [session_type]).df()
            if laps_df.empty: return None

            charts_data = {}
            for car_class, group in laps_df.groupby('CarClass'):
                group = group.sort_values(['DriverName', 'Lap'])
                group['CumTime'] = group.groupby('DriverName')['LapTime'].cumsum()
                group['Smoothed'] = group.groupby('DriverName')['LapTime'].transform(lambda x: x.rolling(window=3, min_periods=1).mean())

                # Stats par pilote (Idéal, BoxPlot, Distribution)
                driver_stats = []
                scatter_data = []
                box_data = []
                best_class_lap = float(group['LapTime'].min())
                
                for driver, d_group in group.groupby('DriverName'):
                    d_best = float(d_group['LapTime'].min())
                    # Temps idéal = Somme des meilleurs secteurs
                    d_ideal = d_group['Sector1'].replace(0, pd.NA).min() + d_group['Sector2'].replace(0, pd.NA).min() + d_group['Sector3'].replace(0, pd.NA).min()
                    if pd.isna(d_ideal): d_ideal = d_best
                    
                    driver_stats.append({
                        "driver": str(driver),
                        "bestLap": d_best,
                        "idealLap": float(d_ideal),
                        "gapToBest": d_best - best_class_lap
                    })
                    
                    # Filtre des tours valides (107% et sans Pitstop) pour le BoxPlot et Distribution
                    d_valid = d_group[(d_group['Pit'] == 0) & (d_group['LapTime'] <= d_best * 1.07)]
                    laps_arr = d_valid['LapTime'].tolist()
                    
                    for lap_val in laps_arr:
                        scatter_data.append({"driver": str(driver), "time": float(lap_val)})
                        
                    if len(laps_arr) > 0:
                        s = pd.Series(laps_arr)
                        box_data.append({
                            "driver": str(driver), "min": float(s.min()), "q1": float(s.quantile(0.25)),
                            "median": float(s.median()), "q3": float(s.quantile(0.75)), "max": float(s.max()), "mean": float(s.mean())
                        })

                driver_stats = sorted(driver_stats, key=lambda x: x['gapToBest'])
                box_data = sorted(box_data, key=lambda x: x['mean'])

                # Données tour par tour (Lignes)
                max_lap = int(group['Lap'].max())
                lap_records = []
                drivers_in_class = list(group['DriverName'].unique())
                
                for lap_num in range(1, max_lap + 1):
                    lap_data = group[group['Lap'] == lap_num].copy()
                    if lap_data.empty: continue
                    lap_data = lap_data.sort_values('CumTime')
                    lap_data['Position'] = range(1, len(lap_data) + 1)
                    leader_time = lap_data.iloc[0]['CumTime']
                    record = {'lap': lap_num}
                    for _, row in lap_data.iterrows():
                        driver = str(row['DriverName'])
                        record[f"{driver}_pos"] = int(row['Position'])
                        record[f"{driver}_gap"] = float(row['CumTime'] - leader_time)
                        record[f"{driver}_time"] = float(row['LapTime'])
                        record[f"{driver}_smoothed"] = float(row['Smoothed'])
                    lap_records.append(record)
                
                charts_data[str(car_class)] = {
                    "lapData": lap_records, "driverStats": driver_stats, 
                    "scatterData": scatter_data, "boxData": box_data, "drivers": drivers_in_class
                }
            return {"player": player_name, "classes": charts_data}
        except Exception:
            import traceback
            traceback.print_exc()
            return None
        finally:
            con.close()

    # ==========================================
    # LECTURE DES STATISTIQUES (RACE STATS)
    # ==========================================
    def get_race_stats_data(self, filename, session_type):
        import re
        db_file = os.path.join(self.log_directory, filename)
        if not os.path.exists(db_file): return None
        con = duckdb.connect(database=db_file, read_only=True)
        try:
            df_drivers = con.execute("SELECT * FROM session_drivers WHERE UPPER(SessionType) = UPPER(?)", [session_type]).df()
            df_laps = con.execute("SELECT * FROM laps WHERE UPPER(SessionType) = UPPER(?) AND LapTime > 0", [session_type]).df()
            df_events = con.execute("SELECT * FROM stream_events WHERE UPPER(SessionType) = UPPER(?)", [session_type]).df()
            if df_drivers.empty: return None

            stats_by_class = {}
            def format_time(sec):
                if pd.isna(sec) or sec <= 0: return "--:--.---"
                return f"{int(sec//60)}:{sec%60:06.3f}"

            car_map = dict(zip(df_drivers['DriverName'], df_drivers['VehName']))

            for car_class, d_group in df_drivers.groupby('CarClass'):
                class_drivers = d_group['DriverName'].tolist()
                l_group = df_laps[df_laps['DriverName'].isin(class_drivers)].copy() if not df_laps.empty else pd.DataFrame()
                
                pace = {"fastest": {}, "consistent": {}, "topSpeed": {}, "s1": {}, "s2": {}, "s3": {}}
                if not l_group.empty:
                    best_lap_idx = l_group['LapTime'].idxmin()
                    best_lap_row = l_group.loc[best_lap_idx]
                    pace["fastest"] = {"val": format_time(best_lap_row['LapTime']), "lap": int(best_lap_row['Lap']), "driver": best_lap_row['DriverName'], "car": car_map.get(best_lap_row['DriverName'], "")}
                    
                    threshold = best_lap_row['LapTime'] * 1.07
                    valid_laps = l_group[(l_group['LapTime'] <= threshold) & (l_group['Pit'] == 0) & (l_group['Lap'] > 1)]
                    if not valid_laps.empty:
                        std_devs = valid_laps.groupby('DriverName')['LapTime'].std().dropna()
                        if not std_devs.empty:
                            cons_driver = std_devs.idxmin()
                            pace["consistent"] = {"val": f"{std_devs.min():.2f}s", "driver": cons_driver, "car": car_map.get(cons_driver, "")}
                    
                    for sec, key in [('s1', 'Sector1'), ('s2', 'Sector2'), ('s3', 'Sector3')]:
                        s_valid = l_group[l_group[key] > 0]
                        if not s_valid.empty:
                            best_s_row = s_valid.loc[s_valid[key].idxmin()]
                            pace[sec] = {"val": format_time(best_s_row[key]), "lap": int(best_s_row['Lap']), "driver": best_s_row['DriverName'], "car": car_map.get(best_s_row['DriverName'], "")}
                            
                    best_spd_row = l_group.loc[l_group['TopSpeed'].idxmax()]
                    pace["topSpeed"] = {"val": f"{best_spd_row['TopSpeed']:.1f} km/h", "lap": int(best_spd_row['Lap']), "driver": best_spd_row['DriverName'], "car": car_map.get(best_spd_row['DriverName'], "")}

                racing = {"gained": {}, "lost": {}, "recovery": {}, "overtakes": {}, "lapsLed": {}, "trackLimits": {}}
                
                # --- CALCUL DYNAMIQUE DES POSITIONS ---
                d_group_sorted = d_group.sort_values(by=['GridPos']).copy()
                d_group_sorted['ClassGridPosCalc'] = range(1, len(d_group_sorted) + 1)
                d_group_sorted['ClassPosChange'] = d_group_sorted['ClassGridPosCalc'] - d_group_sorted['ClassPosition']
                valid_class_gains = d_group_sorted[d_group_sorted['GridPos'] > 0]
                
                if not valid_class_gains.empty:
                    best_gain = valid_class_gains.loc[valid_class_gains['ClassPosChange'].idxmax()]
                    worst_loss = valid_class_gains.loc[valid_class_gains['ClassPosChange'].idxmin()]
                    racing["gained"] = {"val": f"+{int(best_gain['ClassPosChange'])}", "driver": best_gain['DriverName'], "car": best_gain['VehName']}
                    racing["lost"] = {"val": f"{int(worst_loss['ClassPosChange'])}", "driver": worst_loss['DriverName'], "car": worst_loss['VehName']}

                d_group_sorted['OverallPosChange'] = d_group_sorted['GridPos'] - d_group_sorted['Position']
                valid_overall = d_group_sorted[(d_group_sorted['GridPos'] > 0) & (d_group_sorted['Position'] > 0)]
                if not valid_overall.empty:
                    best_rec = valid_overall.loc[valid_overall['OverallPosChange'].idxmax()]
                    racing["recovery"] = {"val": f"+{int(best_rec['OverallPosChange'])}", "sub": f"P{int(best_rec['GridPos'])} → P{int(best_rec['Position'])}", "driver": best_rec['DriverName'], "car": best_rec['VehName']}

                # --- CALCUL DYNAMIQUE DES DEPASSEMENTS (VIA TEMPS CUMULÉ) ---
                if not l_group.empty:
                    l_group['CumTime'] = l_group.groupby('DriverName')['LapTime'].cumsum()
                    overtakes_count = {d: 0 for d in class_drivers}
                    last_pos = {}
                    led_counts = {}
                    
                    for lap_num in sorted(l_group['Lap'].unique()):
                        lap_data = l_group[l_group['Lap'] == lap_num].copy()
                        if lap_data.empty: continue
                        
                        lap_data = lap_data.sort_values('CumTime')
                        lap_data['DynamicPos'] = range(1, len(lap_data) + 1)
                        
                        leader = lap_data.iloc[0]['DriverName']
                        led_counts[leader] = led_counts.get(leader, 0) + 1
                        
                        for _, row in lap_data.iterrows():
                            d = row['DriverName']
                            curr_pos = int(row['DynamicPos'])
                            if d in last_pos and curr_pos < last_pos[d]: 
                                overtakes_count[d] += (last_pos[d] - curr_pos)
                            last_pos[d] = curr_pos
                            
                    best_overtaker = max(overtakes_count, key=overtakes_count.get) if overtakes_count else None
                    if best_overtaker and overtakes_count[best_overtaker] > 0:
                        racing["overtakes"] = {"val": overtakes_count[best_overtaker], "driver": best_overtaker, "car": car_map.get(best_overtaker, "")}
                        
                    if led_counts:
                        best_leader = max(led_counts, key=led_counts.get)
                        racing["lapsLed"] = {"val": led_counts[best_leader], "driver": best_leader, "car": car_map.get(best_leader, "")}

                if not df_events.empty:
                    tl_events = df_events[(df_events['EventType'] == 'TrackLimits') & (df_events['DriverName'].isin(class_drivers))]
                    if not tl_events.empty:
                        tl_counts = tl_events['DriverName'].value_counts()
                        racing["trackLimits"] = {"val": int(tl_counts.max()), "driver": tl_counts.idxmax(), "car": car_map.get(tl_counts.idxmax(), "")}

                strategy = {"pitstops": {}, "carUsed": {}, "fuelSaver": {}, "tyreSaver": {}}
                best_pit = d_group_sorted.loc[d_group_sorted['Pitstops'].idxmax()]
                strategy["pitstops"] = {"val": int(best_pit['Pitstops']), "driver": best_pit['DriverName'], "car": best_pit['VehName']}
                
                car_counts = d_group_sorted['VehName'].value_counts()
                strategy["carUsed"] = {"val": car_counts.index[0], "sub": f"{car_counts.iloc[0]} drivers"}
                
                if not l_group.empty:
                    fuel_avg = l_group.groupby('DriverName')['FuelUsed'].mean()
                    if not fuel_avg.empty: 
                        best_fuel = fuel_avg.idxmin()
                        strategy["fuelSaver"] = {"val": f"{(fuel_avg.min() * 15.5):.1f} L/lap", "driver": best_fuel, "car": car_map.get(best_fuel, "")}
                    
                    # Le pneu le plus épargné à la fin de la course
                    idx_last_laps = l_group.groupby('DriverName')['Lap'].idxmax()
                    last_laps = l_group.loc[idx_last_laps].copy()
                    last_laps['AvgTyre'] = (last_laps['WearFL'] + last_laps['WearFR'] + last_laps['WearRL'] + last_laps['WearRR']) / 4
                    if not last_laps.empty:
                        best_tyre_row = last_laps.loc[last_laps['AvgTyre'].idxmax()]
                        strategy["tyreSaver"] = {"val": f"{best_tyre_row['AvgTyre']:.1f}%", "driver": best_tyre_row['DriverName'], "car": car_map.get(best_tyre_row['DriverName'], "")}

                incidents_data = {"total": 0, "topRivalry": {}, "biggestCrash": {}, "rivalries": [], "clumsiness": [], "severity": [], "timeline": []}
                
                if not df_events.empty:
                    inc_events = df_events[df_events['EventType'] == 'Incident']
                    contact_pairs = {}
                    clumsy_drivers = {}
                    severity_drivers = {}
                    timeline_bins = {}

                    pattern = re.compile(r"^([^()]+)(?:\(\d+\))?\s+reported contact \(([\d\.]+)\)\s+with\s+(?:another vehicle\s+([^()]+)(?:\(\d+\))?|(.+))$")
                    
                    for _, row in inc_events.iterrows():
                        match = pattern.match(str(row['RawText']).strip())
                        if match:
                            d1, impact_str, d2, obj = match.groups()
                            d1 = d1.strip()
                            if d1 not in class_drivers: continue
                                
                            impact = float(impact_str)
                            time_sec = float(row['EventTime'])
                            
                            t_bin = int(time_sec // 60) * 60
                            timeline_bins[t_bin] = timeline_bins.get(t_bin, 0) + impact

                            if d1 not in severity_drivers: severity_drivers[d1] = {"impacts": [], "scrapes": 0}
                            severity_drivers[d1]["impacts"].append(impact)
                            severity_drivers[d1]["scrapes"] += 1

                            if d2: 
                                d2 = d2.strip()
                                if d2 in class_drivers: 
                                    pair = tuple(sorted([d1, d2]))
                                    contact_pairs[pair] = contact_pairs.get(pair, 0) + 1
                                    incidents_data["total"] += 1
                            elif obj: 
                                obj = obj.strip()
                                if d1 not in clumsy_drivers: clumsy_drivers[d1] = {"count": 0, "objects": set()}
                                clumsy_drivers[d1]["count"] += 1
                                clumsy_drivers[d1]["objects"].add(obj)
                                
                    sorted_rivals = sorted(contact_pairs.items(), key=lambda x: x[1], reverse=True)
                    for pair, count in sorted_rivals:
                        incidents_data["rivalries"].append({"d1": pair[0][0], "car1": car_map.get(pair[0][0], ""), "d2": pair[0][1], "car2": car_map.get(pair[0][1], ""), "count": count})
                        
                    if sorted_rivals:
                        top_r = sorted_rivals[0]
                        incidents_data["topRivalry"] = {"val": f"{top_r[1]}", "d1": top_r[0][0][0], "car1": car_map.get(top_r[0][0][0], ""), "d2": top_r[0][0][1], "car2": car_map.get(top_r[0][0][1], "")}

                    for d, info in sorted(clumsy_drivers.items(), key=lambda x: x[1]["count"], reverse=True):
                        incidents_data["clumsiness"].append({"driver": d, "car": car_map.get(d, ""), "count": info["count"], "objects": ", ".join(info["objects"])})
                        
                    max_impact_global = 0
                    biggest_crash_driver = ""
                    biggest_crash_lap = 0
                    
                    for d, info in severity_drivers.items():
                        max_i = max(info["impacts"])
                        avg_i = sum(info["impacts"]) / len(info["impacts"])
                        tot_i = sum(info["impacts"])
                        if max_i > max_impact_global:
                            max_impact_global = max_i
                            biggest_crash_driver = d
                            try:
                                crash_time = inc_events[(inc_events['RawText'].str.contains(d)) & (inc_events['RawText'].str.contains(str(max_i)))]['EventTime'].iloc[0]
                                if not l_group.empty:
                                    lap_row = l_group[(l_group['DriverName'] == d) & (l_group['CumTime'] >= crash_time)]
                                    if not lap_row.empty: biggest_crash_lap = int(lap_row.iloc[0]['Lap'])
                            except: pass
                            
                        heavy = sum(1 for i in info["impacts"] if i > 1500)
                        incidents_data["severity"].append({
                            "driver": d, "car": car_map.get(d, ""), "heavy": heavy, "max": max_i, "avg": avg_i, "total": tot_i, "scrapes": info["scrapes"]
                        })
                        
                    incidents_data["severity"] = sorted(incidents_data["severity"], key=lambda x: x["max"], reverse=True)
                    if biggest_crash_driver:
                        incidents_data["biggestCrash"] = {"val": f"{max_impact_global:.1f}", "driver": biggest_crash_driver, "car": car_map.get(biggest_crash_driver, ""), "lap": biggest_crash_lap}

                    max_time = int(df_events['EventTime'].max() // 60) * 60 if not df_events.empty else 0
                    for t in range(0, max_time + 60, 60):
                        m = t // 60
                        bin_data = timeline_bins.get(t, 0)
                        incidents_data["timeline"].append({"time": f"{m}:00", "impact": bin_data})

                stats_by_class[str(car_class)] = {"pace": pace, "racing": racing, "strategy": strategy, "incidents": incidents_data}

            return stats_by_class
        except Exception as e:
            import traceback
            traceback.print_exc()
            return None
        finally:
            con.close()

    # ==========================================
    # LECTURE DE LA BOITE NOIRE (RACE DIRECTOR)
    # ==========================================
    def get_race_director_data(self, filename, session_type):
        """Récupère l'intégralité des événements du Stream XML."""
        import re
        db_file = os.path.join(self.log_directory, filename)
        if not os.path.exists(db_file): return None
        con = duckdb.connect(database=db_file, read_only=True)
        try:
            df_events = con.execute("SELECT * FROM stream_events WHERE UPPER(SessionType) = UPPER(?) ORDER BY EventTime ASC", [session_type]).df()
            if df_events.empty: return None

            director_events = []
            summary = {"incidents": 0, "trackLimits": 0, "sectorBests": 0, "penalties": 0, "damage": 0, "driverChanges": 0}

            regex_incident = re.compile(r"^([^()]+)(?:\(\d+\))?\s+reported contact \(([\d\.]+)\)(?:\s+with\s+(?:another vehicle\s+([^()]+)(?:\(\d+\))?|(.+)))?$")
            regex_damage = re.compile(r"^([^()]+)(?:\(\d+\))?\s+reports new (.+) damage$")
            regex_sector = re.compile(r"^([^()]+)(?:\(\d+\))?\s+set new best for [sS]ector (\d+)$")

            for _, row in df_events.iterrows():
                tag = str(row['EventType'])
                raw_text = str(row['RawText']).strip()
                time_sec = float(row['EventTime'])
                driver_attr = str(row['DriverName']) if pd.notna(row['DriverName']) else ""

                m = int(time_sec // 60)
                s = int(time_sec % 60)
                time_str = f"{m}:{s:02d}"

                event_obj = {
                    "time": time_str,
                    "raw": raw_text,
                    "driver": driver_attr,
                    "type": tag,
                    "text": raw_text,
                    "badge": ""
                }

                if tag == 'Incident':
                    match = regex_incident.match(raw_text)
                    if match:
                        d1, force, d2, obj = match.groups()
                        d1 = d1.strip()
                        event_obj["driver"] = d1
                        event_obj["type"] = "Incident"
                        if d2: event_obj["text"] = f"{d1} reported contact with {d2.strip()}"
                        else: event_obj["text"] = f"{d1} hit {str(obj).strip()}"
                        event_obj["badge"] = f"{int(float(force))}N"
                        summary["incidents"] += 1
                        director_events.append(event_obj)
                
                elif tag == 'TrackLimits':
                    event_obj["type"] = "TrackLimit"
                    event_obj["text"] = f"{driver_attr} — {raw_text}"
                    event_obj["badge"] = raw_text
                    summary["trackLimits"] += 1
                    director_events.append(event_obj)
                    
                elif tag == 'Sector':
                    match_dam = regex_damage.match(raw_text)
                    match_sec = regex_sector.match(raw_text)
                    
                    if match_dam:
                        d1, part = match_dam.groups()
                        event_obj["driver"] = d1.strip()
                        event_obj["type"] = "Damage"
                        event_obj["text"] = f"{d1.strip()} reports new {part} damage"
                        event_obj["badge"] = part
                        summary["damage"] += 1
                        director_events.append(event_obj)
                    elif match_sec:
                        d1, sec_num = match_sec.groups()
                        event_obj["driver"] = d1.strip()
                        event_obj["type"] = "SectorBest"
                        event_obj["text"] = f"{d1.strip()} set new best for Sector {sec_num}"
                        event_obj["badge"] = f"Sector {sec_num}"
                        summary["sectorBests"] += 1
                        director_events.append(event_obj)
                        
                elif tag == 'Penalty':
                    d_name = raw_text.split(" received")[0].strip() if " received" in raw_text else raw_text.split(" ")[0].strip()
                    event_obj["driver"] = d_name
                    event_obj["type"] = "Penalty"
                    event_obj["text"] = raw_text
                    event_obj["badge"] = "Penalty"
                    summary["penalties"] += 1
                    director_events.append(event_obj)

            return {"summary": summary, "events": director_events}
        except Exception:
            import traceback
            traceback.print_exc()
            return None
        finally:
            con.close()

    # ==========================================
    # LECTURE DE TES GRAPHIQUES (YOUR CHARTS)
    # ==========================================
    # ==========================================
    # LECTURE DE TES GRAPHIQUES (YOUR CHARTS)
    # ==========================================
    def get_your_charts_data(self, filename, session_type):
        """Récupère exclusivement tes données (JOLY) pour générer tes graphiques personnels."""
        db_file = os.path.join(self.log_directory, filename)
        if not os.path.exists(db_file): return None
        con = duckdb.connect(database=db_file, read_only=True)
        try:
            df_player = con.execute("SELECT DriverName, CarClass FROM session_drivers WHERE UPPER(DriverName) LIKE '%JOLY%' AND UPPER(SessionType) = UPPER(?)", [session_type]).df()
            if df_player.empty: return None
            player_name = str(df_player.iloc[0]['DriverName'])
            player_class = str(df_player.iloc[0]['CarClass'])

            df_leader = con.execute("SELECT DriverName FROM session_drivers WHERE CarClass = ? AND UPPER(SessionType) = UPPER(?) ORDER BY ClassPosition ASC LIMIT 1", [player_class, session_type]).df()
            class_leader = str(df_leader.iloc[0]['DriverName']) if not df_leader.empty else "Leader"

            # ON SÉLECTIONNE LES COLONNES FRONT_TIRE ET REAR_TIRE
            laps_query = "SELECT DriverName, Lap, LapTime, Pit, Sector1, Sector2, Sector3, TopSpeed, FuelLevel, FuelUsed, VELevel, VirtualEnergyUsed, WearFL, WearFR, WearRL, WearRR, FrontTire, RearTire FROM laps WHERE CarClass = ? AND UPPER(SessionType) = UPPER(?) AND LapTime > 0 ORDER BY Lap ASC"
            class_laps = con.execute(laps_query, [player_class, session_type]).df()
            if class_laps.empty: return None

            class_laps['CumTime'] = class_laps.groupby('DriverName')['LapTime'].cumsum()
            your_data = []
            max_lap = int(class_laps['Lap'].max())
            
            for lap_num in range(1, max_lap + 1):
                lap_df = class_laps[class_laps['Lap'] == lap_num].copy()
                if lap_df.empty: continue
                
                lap_df = lap_df.sort_values('CumTime')
                lap_df['DynamicPos'] = range(1, len(lap_df) + 1)
                leader_cum_time = lap_df.iloc[0]['CumTime']
                
                player_lap = lap_df[lap_df['DriverName'] == player_name]
                if player_lap.empty: continue
                p_row = player_lap.iloc[0]
                
                your_data.append({
                    "lap": lap_num,
                    "pos": int(p_row['DynamicPos']),
                    "gapToLeader": round(float(p_row['CumTime'] - leader_cum_time), 3),
                    "lapTime": round(float(p_row['LapTime']), 3),
                    "s1": round(float(p_row['Sector1']), 3),
                    "s2": round(float(p_row['Sector2']), 3),
                    "s3": round(float(p_row['Sector3']), 3),
                    "topSpeed": round(float(p_row['TopSpeed']), 1),
                    
                    "fuelRemaining": round(float(p_row['FuelLevel']) * 100, 2),
                    "fuelUsed": round(float(p_row['FuelUsed']) * 100, 2),
                    "veRemaining": round(float(p_row['VELevel']) * 100, 2),
                    "veUsed": round(float(p_row['VirtualEnergyUsed']), 2),
                    
                    "wearFL": round(float(p_row['WearFL']), 2),
                    "wearFR": round(float(p_row['WearFR']), 2),
                    "wearRL": round(float(p_row['WearRL']), 2),
                    "wearRR": round(float(p_row['WearRR']), 2),
                    "pit": int(p_row['Pit']) == 1,
                    
                    # AJOUT DES PNEUS ICI
                    "frontTire": str(p_row['FrontTire']),
                    "rearTire": str(p_row['RearTire'])
                })
                
            return {
                "leader": class_leader,
                "data": your_data
            }
        except Exception:
            import traceback
            traceback.print_exc()
            return None
        finally:
            con.close()

    # ==========================================
    # CHAT ET NOTES PERSONNELLES
    # ==========================================
    def get_session_chat(self, filename, session_type):
        """Récupère l'historique du Chat de la session."""
        db_file = os.path.join(self.log_directory, filename)
        if not os.path.exists(db_file): return None
        con = duckdb.connect(database=db_file, read_only=True)
        try:
            # On cherche les événements 'ChatMessage'
            df_chat = con.execute("SELECT EventTime, RawText FROM stream_events WHERE UPPER(SessionType) = UPPER(?) AND EventType = 'ChatMessage' ORDER BY EventTime ASC", [session_type]).df()
            chat_messages = []
            
            for _, row in df_chat.iterrows():
                time_sec = float(row['EventTime'])
                m = int(time_sec // 60)
                s = int(time_sec % 60)
                time_str = f"{m:02d}:{s:02d}"
                
                raw = str(row['RawText'])
                # Les messages LMU sont formatés ainsi : "Nom du Pilote : message"
                parts = raw.split(':', 1)
                if len(parts) == 2:
                    chat_messages.append({"time": time_str, "driver": parts[0].strip(), "message": parts[1].strip()})
                else:
                    chat_messages.append({"time": time_str, "driver": "System", "message": raw})
                    
            return chat_messages
        except Exception:
            import traceback
            traceback.print_exc()
            return []
        finally:
            con.close()

    def get_personal_notes(self, filename):
        """Récupère les notes personnelles associées à ce fichier."""
        db_file = os.path.join(self.log_directory, filename)
        if not os.path.exists(db_file): return ""
        con = duckdb.connect(database=db_file, read_only=False) # Mode écriture autorisé pour créer la table
        try:
            # Création de la table si elle n'existe pas (pour les anciens fichiers)
            con.execute("CREATE TABLE IF NOT EXISTS personal_notes (NoteText VARCHAR)")
            df = con.execute("SELECT NoteText FROM personal_notes LIMIT 1").df()
            if not df.empty:
                return str(df.iloc[0]['NoteText'])
            return ""
        except Exception:
            return ""
        finally:
            con.close()

    def save_personal_notes(self, filename, notes_text):
        """Sauvegarde les notes dans la base de données de la session."""
        db_file = os.path.join(self.log_directory, filename)
        if not os.path.exists(db_file): return False
        con = duckdb.connect(database=db_file, read_only=False)
        try:
            con.execute("CREATE TABLE IF NOT EXISTS personal_notes (NoteText VARCHAR)")
            con.execute("DELETE FROM personal_notes") # On efface l'ancienne note
            con.execute("INSERT INTO personal_notes VALUES (?)", [notes_text]) # On insère la nouvelle
            con.commit()
            return True
        except Exception:
            import traceback
            traceback.print_exc()
            return False
        finally:
            con.close()


    def extract_lifetime_kpis(self):
        search_pattern = os.path.join(self.log_directory, "imported_session_*.duckdb")
        files = glob.glob(search_pattern)
        
        tracks = set()
        combos = set()
        stats = {
            "total_sessions": 0, "practice_sessions": 0, "qualy_sessions": 0,
            "race_sessions": 0, "unique_tracks": 0, "unique_combos": 0
        }
        
        for f in files:
            con = None
            try:
                con = duckdb.connect(database=f, read_only=True)
                query = """
                    SELECT s.TrackVenue, s.SessionType, d.VehName 
                    FROM sessions s 
                    JOIN session_drivers d ON s.FileID = d.FileID AND s.SessionType = d.SessionType 
                    WHERE UPPER(d.DriverName) LIKE '%JOLY%'
                """
                df = con.execute(query).df()
                
                if not df.empty:
                    for _, row in df.iterrows():
                        stats["total_sessions"] += 1
                        track = row['TrackVenue']
                        car = row['VehName']
                        stype = str(row['SessionType']).lower()
                        tracks.add(track)
                        combos.add(f"{track}_{car}")
                        if "practice" in stype: stats["practice_sessions"] += 1
                        elif "qualify" in stype: stats["qualy_sessions"] += 1
                        elif "race" in stype: stats["race_sessions"] += 1
            except Exception: pass
            finally:
                if con is not None: con.close()
                
        stats["unique_tracks"] = len(tracks)
        stats["unique_combos"] = len(combos)
        return stats