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
        
        # L'UPDATE ULTIME : 100% du config.json extrait avec correction des tableaux de freins et fautes de frappe
        query = """
            SELECT 
                "Lap", "Lap Time" as LapTime, "Valid", "Lap Dist" as LapDist,
                "Sector1", "Sector2", "Sector3", "Ground Speed" as TopSpeed,
                
                "TyresPressure"[1] AS TirePressFL, "TyresPressure"[2] AS TirePressFR, 
                "TyresPressure"[3] AS TirePressRL, "TyresPressure"[4] AS TirePressRR,
                
                "TyresCarcassTemp"[1] AS TireCarcassFL, "TyresCarcassTemp"[2] AS TireCarcassFR,
                "TyresCarcassTemp"[3] AS TireCarcassRL, "TyresCarcassTemp"[4] AS TireCarcassRR,

                "TyresRubberTemp"[1] AS TireRubberFL, "TyresRubberTemp"[2] AS TireRubberFR,
                "TyresRubberTemp"[3] AS TireRubberRL, "TyresRubberTemp"[4] AS TireRubberRR,
                
                "TyresRimTemp"[1] AS TireRimFL, "TyresRimTemp"[2] AS TireRimFR,
                "TyresRimTemp"[3] AS TireRimRL, "TyresRimTemp"[4] AS TireRimRR,
                
                "TyresTempLeft"[1] AS TireTempFL_I, "TyresTempLeft"[2] AS TireTempFR_I, 
                "TyresTempLeft"[3] AS TireTempRL_I, "TyresTempLeft"[4] AS TireTempRR_I,
                
                "TyresTempCentre"[1] AS TireTempFL_M, "TyresTempCentre"[2] AS TireTempFR_M, 
                "TyresTempCentre"[3] AS TireTempRL_M, "TyresTempCentre"[4] AS TireTempRR_M,
                
                "TyresTempRight"[1] AS TireTempFL_O, "TyresTempRight"[2] AS TireTempFR_O, 
                "TyresTempRight"[3] AS TireTempRL_O, "TyresTempRight"[4] AS TireTempRR_O,
                
                "Tyres Wear"[1] AS TireWearFL, "Tyres Wear"[2] AS TireWearFR, 
                "Tyres Wear"[3] AS TireWearRL, "Tyres Wear"[4] AS TireWearRR,
                
                "Susp Pos"[1] AS SuspPosFL, "Susp Pos"[2] AS SuspPosFR, 
                "Susp Pos"[3] AS SuspPosRL, "Susp Pos"[4] AS SuspPosRR,
                
                "RideHeights"[1] AS RideHeightFL, "RideHeights"[2] AS RideHeightFR, 
                "RideHeights"[3] AS RideHeightRL, "RideHeights"[4] AS RideHeightRR,
                
                "Wheel Speed"[1] AS WheelSpeedFL, "Wheel Speed"[2] AS WheelSpeedFR, 
                "Wheel Speed"[3] AS WheelSpeedRL, "Wheel Speed"[4] AS WheelSpeedRR,
                
                "Brakes Temp"[1] AS BrakeTempFL, "Brakes Temp"[2] AS BrakeTempFR,
                "Brakes Temp"[3] AS BrakeTempRL, "Brakes Temp"[4] AS BrakeTempRR,
                
                "Brakes Air Temp"[1] AS BrakeAirTempFL, "Brakes Air Temp"[2] AS BrakeAirTempFR,
                "Brakes Air Temp"[3] AS BrakeAirTempRL, "Brakes Air Temp"[4] AS BrakeAirTempRR,
                
                "Brakes Force"[1] AS BrakeForceFL, "Brakes Force"[2] AS BrakeForceFR,
                "Brakes Force"[3] AS BrakeForceRL, "Brakes Force"[4] AS BrakeForceRR,
                
                "Brake Tickness"[1] AS BrakeThickFL, "Brake Tickness"[2] AS BrakeThickFR,
                "Brake Tickness"[3] AS BrakeThickRL, "Brake Tickness"[4] AS BrakeThickRR,
                
                "FrontRideHeight", "RearRideHeight", "FrontWingHeight", 
                "G Force Lat" as LatAccel, "G Force Long" as LongAccel, "G Force Vert" as VertAccel,
                "FrontDownForce", "ReadDownForce" as RearDownForce, "Drag", "Brake Bias Rear" as BrakeBias,
                "Front3rdDeflection", "Rear3rdDeflection",
                
                "Steered Angle" as SteeringAngle, "Yaw Rate" as YawRate, "Steering Shaft Torque" as SteeringTorque,
                "FFB Output" as FFB, "Path Lateral" as PathLateral, "Track Edge" as TrackEdge,
                
                "Throttle Pos" as Throttle, "Throttle Pos Unfiltered" as UnfilteredThrottle, "FilteredThrottle",
                "Brake Pos" as Brake, "Brake Pos Unfiltered" as UnfilteredBrake, "FilteredBrake",
                "Clutch Pos" as Clutch, "Clutch Pos Unfiltered", "Clutch RPM",
                
                "Gear", "Fuel Level" as FuelLevel, "Virtual Energy", "SoC", "Regen Rate" as RegenRate,
                
                "Engine RPM" as EngineRPM, "Engine Max RPM" as EngineMaxRPM,
                "Engine Water Temp" AS EngineWaterTemp, "Engine Oil Temp" AS EngineOilTemp,
                "Turbo Boost Pressure" AS TurboBoost,
                
                "Wind Speed" as WindSpeed, "Wind Heading" as WindHeading,
                "Ambient Temperature" as AmbientTemp, "Track Temperature" as TrackTemp,
                "GPS Latitude" as GPS_Lat, "GPS Longitude" as GPS_Lon, 
                "GPS Speed", "GPS Time", "Lateral Acceleration", "Longitudinal Acceleration",
                "OverheatingState", "Steering Pos", "Steering Pos Unfiltered", 
                "Time Behind Next", "Total Dist",

                "ABS", "ABSLevel", "AntiStall Activated", "Best LapTime", "Best Sector1", "Best Sector2",
                "Brake Migration", "CloudDarkness", "Current LapTime", "Current Sector", "Current Sector1", "Current Sector2",
                "Finish Status", "FrontFlapActivated", "FuelMixtureMap", "LaunchControlActive", "Headlights State", "In Pits",
                "Last Sector1", "Last Sector2", "LastImpactMagnitude", "Minimum Path Wetness", "OffpathWetness",
                "RearFlapActivated", "RearFlapLegalStatus", "Sector1 Flag", "Sector2 Flag", "Sector3 Flag",
                "Speed Limiter", "SurfaceTypes", "TC", "TCCut", "TCLevel", "TCSlipAngle", "TyresCompound",
                "WheelsDetached", "Yellow Flag State"
            FROM laps_telemetry
            WHERE "Valid" = 1 AND "Lap Time" > 0
            ORDER BY "Lap" ASC, "Lap Dist" ASC
        """
        try:
            df = con.execute(query).df()
            con.close()
            if df.empty: return None
            
            # --- CALCULS MATHÉMATIQUES MANQUANTS DANS LMU ---
            # 1. Glissement Pneu (Slip Ratio) : (WheelSpeed / GroundSpeed) - 1
            df['WheelSlipFL'] = (df['WheelSpeedFL'] / df['TopSpeed'].clip(lower=1.0)) - 1
            df['WheelSlipFR'] = (df['WheelSpeedFR'] / df['TopSpeed'].clip(lower=1.0)) - 1
            df['WheelSlipRL'] = (df['WheelSpeedRL'] / df['TopSpeed'].clip(lower=1.0)) - 1
            df['WheelSlipRR'] = (df['WheelSpeedRR'] / df['TopSpeed'].clip(lower=1.0)) - 1
            
            # 2. Vraie consommation de carburant (FuelLevel précédent - FuelLevel actuel)
            df['FuelConsumed'] = -df['FuelLevel'].diff().fillna(0)
            df.loc[df['FuelConsumed'] < 0, 'FuelConsumed'] = 0 # Ignore les ravitaillements
            
            max_acceptable_time = df['LapTime'].min() * 1.05
            return df[df['LapTime'] <= max_acceptable_time]
        except duckdb.Error as e:
            import traceback
            traceback.print_exc()
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
            # Récupération stricte du statut du serveur (FixedSetup ou non)
            query = "SELECT TrackName, SessionType, SessionDurationMinutes, AmbientTemp, TrackTemp, RainPathLevel, VehicleName, VehicleClass, IsFixedSetup FROM session_info LIMIT 1"
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

    def get_track_map_data(self):
        """
        Extrait les coordonnées GPS et les pédales du meilleur tour de la session native.
        Idéal pour tracer le circuit en 2D/3D dans React.
        """
        db_file = self._get_latest_duckdb()
        if not db_file: return None
        con = duckdb.connect(database=db_file, read_only=True)
        try:
            best_lap_query = """
                SELECT Lap 
                FROM laps_telemetry 
                WHERE Valid = 1 AND "Lap Time" > 0 
                ORDER BY "Lap Time" ASC 
                LIMIT 1
            """
            best_lap_df = con.execute(best_lap_query).df()
            if best_lap_df.empty: return None
            best_lap = int(best_lap_df.iloc[0]['Lap'])

            query = f"""
                SELECT 
                    "Lap Dist" as dist,
                    "GPS Longitude" as x,
                    "GPS Latitude" as y,
                    "Ground Speed" as speed,
                    "Brake Pos" as brake,
                    "Throttle Pos" as throttle
                FROM laps_telemetry
                WHERE Lap = {best_lap}
                ORDER BY "Lap Dist" ASC
            """
            track_data = con.execute(query).df()
            if track_data.empty: return None

            track_data['dist_rounded'] = (track_data['dist'] / 5.0).round() * 5.0
            track_data_clean = track_data.groupby('dist_rounded').mean().reset_index()

            return {
                "lap": best_lap,
                "points": track_data_clean.to_dict(orient='records')
            }
        except Exception as e:
            import traceback
            traceback.print_exc()
            return None
        finally:
            con.close()