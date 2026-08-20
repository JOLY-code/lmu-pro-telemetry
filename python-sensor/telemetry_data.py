import pandas as pd
import duckdb
import os
import glob

class LMUTelemetryPipeline:
    """
    Pipeline dédié UNIQUEMENT au Temps Réel et à l'Ingénieur de Piste.
    Ignore strictement les fichiers d'historique XML.
    """
    def __init__(self, log_directory="."):
        self.log_directory = log_directory

    def _get_latest_duckdb(self):
        search_pattern = os.path.join(self.log_directory, "*.duckdb")
        files = glob.glob(search_pattern)
        # SÉCURITÉ : On ignore les bases de données d'historique créées par le parseur XML
        files = [f for f in files if "imported_session_" not in f and "lmu_session_imported" not in f]
        if not files: return None
        return max(files, key=os.path.getmtime)

    def extract_stint_data(self):
        db_file = self._get_latest_duckdb()
        if not db_file: return None
        con = duckdb.connect(database=db_file, read_only=True)
        
        query = """
            SELECT 
                "Lap", "Lap Time", "Valid", "Sector1", "Sector2", "Sector3", "Lap Dist",
                "TyresTempLeft", "TyresTempCentre", "TyresTempRight", "TyresCarcassTemp",
                "TyresPressure", "Tyres Wear",
                "Ground Speed", "FrontRideHeight", "RearRideHeight",
                "Susp Pos", "Steered Angle", "Yaw Rate", "G Force Lat", "G Force Long",
                "Throttle Pos", "Brake Pos", "Gear", "Fuel Level",
                "Virtual Energy", "SoC", "Brake Thickness", "Wheel Speed",
                "GPS Latitude" as GPS_Lat, "GPS Longitude" as GPS_Lon
            FROM laps_telemetry
            WHERE "Valid" = 1 AND "Lap Time" > 0
            ORDER BY "Lap" ASC, "Lap Dist" ASC
        """
        try:
            df = con.execute(query).df()
            con.close()
            if df.empty: return None
            
            df.rename(columns={
                'Lap Time': 'LapTime', 'Lap Dist': 'LapDist', 'Ground Speed': 'TopSpeed',
                'G Force Lat': 'LatAccel', 'G Force Long': 'LongAccel', 'Steered Angle': 'SteeringAngle',
                'Yaw Rate': 'YawRate', 'Throttle Pos': 'Throttle', 'Brake Pos': 'Brake',
                'Fuel Level': 'FuelConsumed', 'Susp Pos': 'SuspensionPos'
            }, inplace=True, errors='ignore')
            
            max_acceptable_time = df['LapTime'].min() * 1.05
            return df[df['LapTime'] <= max_acceptable_time]
        except duckdb.Error as e:
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
            query = "SELECT TrackName, SessionType, SessionDurationMinutes, AmbientTemp, TrackTemp, RainPathLevel, VehicleName, VehicleClass FROM session_info LIMIT 1"
            df_session = con.execute(query).df()
            con.close()
            if not df_session.empty: return df_session.iloc[0].to_dict()
            return None
        except duckdb.Error:
            con.close()
            return None

    def extract_pitstop_history(self):
        db_file = self._get_latest_duckdb()
        if not db_file: return None
        con = duckdb.connect(database=db_file, read_only=True)
        try:
            query = "SELECT DriverName, CarClass, Lap, PitTime, FuelAdded, TiresChanged FROM laps WHERE PitTime > 0 ORDER BY Lap ASC"
            df_pitstops = con.execute(query).df()
            con.close()
            if not df_pitstops.empty: return df_pitstops
            return None
        except duckdb.Error:
            con.close()
            return None

    def build_spatial_telemetry(self, df_telemetry):
        if df_telemetry is None or df_telemetry.empty or 'LapDist' not in df_telemetry.columns: return df_telemetry
        best_lap_num = df_telemetry.loc[df_telemetry['LapTime'].idxmin(), 'Lap']
        last_lap_num = df_telemetry['Lap'].max()
        df_ref = df_telemetry[df_telemetry['Lap'] == best_lap_num].copy()
        df_my = df_telemetry[df_telemetry['Lap'] == last_lap_num].copy()
        df_ref['Dist_m'] = df_ref['LapDist'].round().astype(int)
        df_my['Dist_m'] = df_my['LapDist'].round().astype(int)
        df_ref_agg = df_ref.groupby('Dist_m').mean(numeric_only=True).reset_index()
        df_my_agg = df_my.groupby('Dist_m').mean(numeric_only=True).reset_index()
        df_merged = pd.merge(df_my_agg, df_ref_agg, on='Dist_m', suffixes=('', '_ref'), how='left')
        df_merged['Time_My_sec'] = 1.0 / (df_merged['TopSpeed'] / 3.6).clip(lower=1.0) 
        df_merged['Time_Ref_sec'] = 1.0 / (df_merged['TopSpeed_ref'] / 3.6).clip(lower=1.0)
        df_merged['Cumulative_My'] = df_merged['Time_My_sec'].cumsum()
        df_merged['Cumulative_Ref'] = df_merged['Time_Ref_sec'].cumsum()
        df_merged['delta'] = df_merged['Cumulative_My'] - df_merged['Cumulative_Ref']
        return df_merged