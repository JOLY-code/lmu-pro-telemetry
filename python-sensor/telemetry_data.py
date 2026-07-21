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
                TireTempFL_I, TireTempFL_M, TireTempFL_O,
                TireTempFR_I, TireTempFR_M, TireTempFR_O,
                TireTempRL_I, TireTempRL_M, TireTempRL_O,
                TireTempRR_I, TireTempRR_M, TireTempRR_O,
                TirePressFL, TirePressFR, TirePressRL, TirePressRR,
                TopSpeed, RideHeightFront, RideHeightRear, SuspensionVelocityFL,
                SteeringAngle, LatAccel, Throttle,
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
            query = "SELECT TrackName, SessionType, SessionDurationMinutes, AmbientTemp, TrackTemp, RainPathLevel FROM session_info LIMIT 1"
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