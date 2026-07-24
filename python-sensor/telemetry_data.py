import pandas as pd
import duckdb
import os
import glob

class LMUTelemetryPipeline:
    """
    Pipeline de traitement des données de télémétrie issues de la base DuckDB de LMU.
    Centralise 100% des requêtes SQL.
    """
    def __init__(self, log_directory):
        self.log_directory = log_directory

    def _get_latest_duckdb(self):
        search_pattern = os.path.join(self.log_directory, "*.duckdb")
        files = glob.glob(search_pattern)
        if not files: return None
        return max(files, key=os.path.getmtime)

    def extract_stint_data(self):
        db_file = self._get_latest_duckdb()
        if not db_file: return None
        con = duckdb.connect(database=db_file, read_only=True)
        
        query = """
            SELECT 
                Lap, LapTime, Valid, Sector1, Sector2, Sector3,
                LapDist, PosX, PosY, PosZ,
                TireTempFL_I, TireTempFL_M, TireTempFL_O,
                TireTempFR_I, TireTempFR_M, TireTempFR_O,
                TireTempRL_I, TireTempRL_M, TireTempRL_O,
                TireTempRR_I, TireTempRR_M, TireTempRR_O,
                TirePressFL, TirePressFR, TirePressRL, TirePressRR,
                TopSpeed, RideHeightFront, RideHeightRear, SuspensionVelocityFL,
                SteeringAngle, LatAccel, Throttle, Brake, Gear,
                WheelSpeedFL, WheelSpeedRL, WheelSlipRL, WheelSlipRR,
                EngineRPM, TimeAtLimiter, FuelConsumed
            FROM laps_telemetry
            WHERE Valid = 1 AND LapTime > 0
            ORDER BY Lap ASC
        """
        try:
            df_stint = con.execute(query).df()
            con.close()
            if df_stint.empty: return None
            max_acceptable_time = df_stint['LapTime'].min() * 1.05
            return df_stint[df_stint['LapTime'] <= max_acceptable_time]
        except duckdb.Error:
            con.close()
            return None
    
    def extract_competitors_data(self):
        db_file = self._get_latest_duckdb()
        if not db_file: return None
        con = duckdb.connect(database=db_file, read_only=True)
        try:
            query = "SELECT DriverName, CarClass, Lap, LapTime, Sector1, Sector2, Sector3 FROM laps WHERE Valid = 1 AND LapTime > 0 ORDER BY LapTime ASC"
            df_competitors = con.execute(query).df()
            con.close()
            if not df_competitors.empty:
                return df_competitors.loc[df_competitors.groupby('DriverName')['LapTime'].idxmin()]
            return None
        except duckdb.Error:
            con.close()
            return None
    
    def extract_session_context(self):
        db_file = self._get_latest_duckdb()
        if not db_file: return None
        con = duckdb.connect(database=db_file, read_only=True)
        try:
            # Ajout de VehicleName et VehicleClass pour l'identification de l'IA
            query = "SELECT TrackName, SessionType, SessionDurationMinutes, AmbientTemp, TrackTemp, RainPathLevel, VehicleName, VehicleClass FROM session_info LIMIT 1"
            df_session = con.execute(query).df()
            con.close()
            if not df_session.empty:
                return df_session.iloc[0].to_dict()
            return None
        except duckdb.Error:
            con.close()
            return None

    def extract_pitstop_history(self):
        """Extrait l'historique complet des arrêts aux stands de tous les joueurs."""
        db_file = self._get_latest_duckdb()
        if not db_file: return None
        con = duckdb.connect(database=db_file, read_only=True)
        try:
            query = "SELECT DriverName, CarClass, Lap, PitTime, FuelAdded, TiresChanged FROM laps WHERE PitTime > 0 ORDER BY Lap ASC"
            df_pitstops = con.execute(query).df()
            con.close()
            if not df_pitstops.empty:
                return df_pitstops
            return None
        except duckdb.Error:
            con.close()
            return None

    def build_spatial_telemetry(self, df_telemetry):
        """Aligne le dernier tour sur le tour de référence via l'axe de la distance."""
        if df_telemetry is None or df_telemetry.empty or 'LapDist' not in df_telemetry.columns:
            return df_telemetry
            
        # 1. Identifier le meilleur tour (Référence) et le dernier tour (Le tien)
        best_lap_num = df_telemetry.loc[df_telemetry['LapTime'].idxmin(), 'Lap']
        last_lap_num = df_telemetry['Lap'].max()
        
        df_ref = df_telemetry[df_telemetry['Lap'] == best_lap_num].copy()
        df_my = df_telemetry[df_telemetry['Lap'] == last_lap_num].copy()
        
        # 2. Création de l'axe spatial (Résolution d'1 mètre)
        df_ref['Dist_m'] = df_ref['LapDist'].round().astype(int)
        df_my['Dist_m'] = df_my['LapDist'].round().astype(int)
        
        df_ref_agg = df_ref.groupby('Dist_m').mean(numeric_only=True).reset_index()
        df_my_agg = df_my.groupby('Dist_m').mean(numeric_only=True).reset_index()
        
        # 3. Fusion des deux traces sur la même distance
        df_merged = pd.merge(df_my_agg, df_ref_agg, on='Dist_m', suffixes=('', '_ref'), how='left')
        
        # 4. CALCUL PHYSIQUE DU DELTA TIME : dt = dx / v
        # Conversion de la vitesse de km/h en m/s (On limite à 1.0 m/s minimum pour éviter les divisions par zéro)
        df_merged['Time_My_sec'] = 1.0 / (df_merged['TopSpeed'] / 3.6).clip(lower=1.0) 
        df_merged['Time_Ref_sec'] = 1.0 / (df_merged['TopSpeed_ref'] / 3.6).clip(lower=1.0)
        
        # Somme cumulée du temps sur le tour
        df_merged['Cumulative_My'] = df_merged['Time_My_sec'].cumsum()
        df_merged['Cumulative_Ref'] = df_merged['Time_Ref_sec'].cumsum()
        
        # Delta = Mon Temps - Temps de Réf (Négatif = je suis en avance)
        df_merged['delta'] = df_merged['Cumulative_My'] - df_merged['Cumulative_Ref']

        return df_merged