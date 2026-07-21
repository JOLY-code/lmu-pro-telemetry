import time
import mmap
import ctypes
import threading

# ==============================================================================
# MAPPING EXHAUSTIF DE LA STRUCTURE C++ (rFactor 2 / LMU Engine)
# LA VUE OMNISCIENTE (PHYSIQUE + CHRONOMÉTRAGE LIVE)
# ==============================================================================

class rF2VehicleTelemetry(ctypes.Structure):
    """Structure C++ stricte de la PHYSIQUE d'un véhicule"""
    _fields_ = [
        ("mID", ctypes.c_int32),
        ("mEngineRPM", ctypes.c_double),
        ("mEngineWaterTemp", ctypes.c_double),
        ("mEngineOilTemp", ctypes.c_double),
        ("mClutchRPM", ctypes.c_double),
        ("mUnfilteredThrottle", ctypes.c_double),
        ("mUnfilteredBrake", ctypes.c_double),
        ("mFilteredThrottle", ctypes.c_double),   
        ("mFilteredBrake", ctypes.c_double),
        ("mSteeringWheelAngle", ctypes.c_double),
        ("mSteeringShaftTorque", ctypes.c_double), 
        ("mFrontDownforce", ctypes.c_double),      
        ("mRearDownforce", ctypes.c_double),       
        ("mDrag", ctypes.c_double),                
        ("mElectricBoostMotorRPM", ctypes.c_double), 
        ("mElectricBoostMotorTorque", ctypes.c_double),
        ("mBatteryCharge", ctypes.c_double),
        ("mSuspensionDeflection", ctypes.c_double * 4),
        ("mRideHeight", ctypes.c_double * 4),
        ("mTireTemp", ctypes.c_double * 4 * 3),
        ("mBrakeTemp", ctypes.c_double * 4),
        ("mTireWear", ctypes.c_double * 4),
        ("mAeroDamage", ctypes.c_double),
        ("mEngineDamage", ctypes.c_double),
        ("mGForce", ctypes.c_double * 3),
        ("mPos", ctypes.c_double * 3),
        ("mIsPlayer", ctypes.c_int8),
        ("mGear", ctypes.c_int32),
        ("mFuel", ctypes.c_double),
        ("mEngineMaxRPM", ctypes.c_double),
        ("mTirePressure", ctypes.c_double * 4),
        ("mWheelRotation", ctypes.c_double * 4),
        ("mLocalVel", ctypes.c_double * 3),
        ("mTireLoad", ctypes.c_double * 4),     
        ("mGripFract", ctypes.c_double * 4),    
        ("mSuspensionVelocity", ctypes.c_double * 4),
        ("mBrakeBias", ctypes.c_double),
    ]

class rF2TelemetryArray(ctypes.Structure):
    _fields_ = [
        ("mVersionUpdateBegin", ctypes.c_int32),
        ("mVersionUpdateEnd", ctypes.c_int32),
        ("mBytesUpdated", ctypes.c_int32),
        ("mNumVehicles", ctypes.c_int32),
        ("mVehicles", rF2VehicleTelemetry * 128),
    ]

class rF2VehicleScoring(ctypes.Structure):
    """Structure de CHRONOMÉTRAGE LIVE d'un véhicule."""
    _fields_ = [
        ("mID", ctypes.c_int32),
        ("mDriverName", ctypes.c_char * 32),
        ("mVehicleName", ctypes.c_char * 64),
        ("mTotalLaps", ctypes.c_int16),
        ("mSector", ctypes.c_int8),
        ("mFinishStatus", ctypes.c_int8),
        ("mLapDist", ctypes.c_double),
        ("mPathLateral", ctypes.c_double),
        ("mTrackEdge", ctypes.c_double),
        ("mBestSector1", ctypes.c_double),
        ("mBestSector2", ctypes.c_double),
        ("mBestLapTime", ctypes.c_double),
        ("mLastSector1", ctypes.c_double),
        ("mLastSector2", ctypes.c_double),
        ("mLastLapTime", ctypes.c_double),
        ("mCurSector1", ctypes.c_double),
        ("mCurSector2", ctypes.c_double),
        ("mNumPitstops", ctypes.c_int16),
        ("mPenalties", ctypes.c_int16),
        ("mIsPlayer", ctypes.c_int8),
        ("mInPits", ctypes.c_int8),
        ("mPlace", ctypes.c_int8),
        ("mClass", ctypes.c_char * 32),
        ("mFrontTireCompoundName", ctypes.c_char * 18), 
        ("mRearTireCompoundName", ctypes.c_char * 18),
    ]

class rF2ScoringInfo(ctypes.Structure):
    """Structure C++ de la course AVEC LE TABLEAU DES JOUEURS"""
    _fields_ = [
        ("mTrackName", ctypes.c_char * 64),
        ("mSession", ctypes.c_int32),
        ("mCurrentET", ctypes.c_double),
        ("mEndET", ctypes.c_double),
        ("mTrackTemp", ctypes.c_double),
        ("mAmbientTemp", ctypes.c_double),
        ("mRaining", ctypes.c_double),
        ("mYellowFlagState", ctypes.c_int8),
        ("mBlueFlag", ctypes.c_int8),
        ("mInPits", ctypes.c_int8),
        ("mPenalties", ctypes.c_int32),
        ("mNumVehicles", ctypes.c_int32),
        ("mVehicles", rF2VehicleScoring * 128),
    ]

# ==============================================================================
# LE THREAD DE LECTURE (SÉCURISÉ ANTI-CHEAT)
# ==============================================================================

class LiveTelemetryThread(threading.Thread):
    def __init__(self):
        super().__init__()
        self.running = True
        self.telemetry_mmap = None
        self.scoring_mmap = None
        self.latest_data = None # Remplace le pyqtSignal pour stocker la donnée brute

    def _connect_to_lmu_memory(self):
        try:
            self.telemetry_mmap = mmap.mmap(0, ctypes.sizeof(rF2TelemetryArray), "$rFactor2SMMP_Telemetry$", access=mmap.ACCESS_READ)
            self.scoring_mmap = mmap.mmap(0, ctypes.sizeof(rF2ScoringInfo), "$rFactor2SMMP_Scoring$", access=mmap.ACCESS_READ)
            return True
        except FileNotFoundError:
            return False

    def run(self):
        print("[SONDE] Tentative de connexion (Mode Read-Only Anti-Cheat)...")
        while self.running and not self._connect_to_lmu_memory():
            time.sleep(2)
        print("[SONDE] Connecté à LMU. Acquisition Omnisciente active.")

        while self.running:
            try:
                self.telemetry_mmap.seek(0)
                telemetry_array = rF2TelemetryArray.from_buffer_copy(self.telemetry_mmap.read(ctypes.sizeof(rF2TelemetryArray)))
                
                self.scoring_mmap.seek(0)
                scoring_data = rF2ScoringInfo.from_buffer_copy(self.scoring_mmap.read(ctypes.sizeof(rF2ScoringInfo)))

                my_phys = None
                my_score = None
                competitors = []
                
                # 1. Extraction du Live Timing (Scoring)
                for i in range(scoring_data.mNumVehicles):
                    score_car = scoring_data.mVehicles[i]
                    if score_car.mIsPlayer == 1:
                        my_score = score_car
                    else:
                        competitors.append({
                            'id': score_car.mID,
                            'name': score_car.mDriverName.decode('utf-8', errors='ignore'),
                            'class': score_car.mClass.decode('utf-8', errors='ignore'),
                            'position': score_car.mPlace,
                            'last_lap': score_car.mLastLapTime,
                            'lap_dist': score_car.mLapDist,
                            'in_pits': score_car.mInPits,
                            'front_tire': score_car.mFrontTireCompoundName.decode('utf-8', errors='ignore')
                        })

                # 2. Extraction de la Physique (Telemetry)
                for i in range(telemetry_array.mNumVehicles):
                    phys_car = telemetry_array.mVehicles[i]
                    if phys_car.mIsPlayer == 1:
                        my_phys = phys_car
                        break

                # 3. Packaging global E-Sport
                if my_phys and my_score:
                    live_data = {
                        # Direction de course
                        'Time': scoring_data.mCurrentET, 'TrackTemp': scoring_data.mTrackTemp,
                        'RainIntensity': scoring_data.mRaining, 'YellowFlag': scoring_data.mYellowFlagState,
                        'BlueFlag': scoring_data.mBlueFlag,
                        
                        # Ton Live Timing
                        'MyPosition': my_score.mPlace, 'MyLapDist': my_score.mLapDist,
                        'MyLastLap': my_score.mLastLapTime,
                        
                        # Ta Physique & Électronique
                        'Speed': my_phys.mEngineRPM * 0.03, 
                        'Throttle': my_phys.mUnfilteredThrottle * 100.0,
                        'FilteredThrottle': my_phys.mFilteredThrottle * 100.0, 
                        'Brake': my_phys.mUnfilteredBrake * 100.0,
                        'FilteredBrake': my_phys.mFilteredBrake * 100.0, 
                        'Steering': my_phys.mSteeringWheelAngle * 57.2958,
                        
                        # Aéro & Moteur
                        'FrontDownforceN': my_phys.mFrontDownforce,
                        'RearDownforceN': my_phys.mRearDownforce,
                        'DragN': my_phys.mDrag,
                        'Gear': my_phys.mGear, 
                        'FuelLevel': my_phys.mFuel, 
                        'BatteryCharge': my_phys.mBatteryCharge * 100.0,
                        'BrakeBias': my_phys.mBrakeBias,

                        # --- LES 4 ROUES (FL=0, FR=1, RL=2, RR=3) ---
                        # Pressions (en kPa)
                        'TirePressFL': my_phys.mTirePressure[0],
                        'TirePressFR': my_phys.mTirePressure[1],
                        'TirePressRL': my_phys.mTirePressure[2],
                        'TirePressRR': my_phys.mTirePressure[3],
                        
                        # Températures des freins
                        'BrakeTempFL': my_phys.mBrakeTemp[0],
                        'BrakeTempFR': my_phys.mBrakeTemp[1],
                        'BrakeTempRL': my_phys.mBrakeTemp[2],
                        'BrakeTempRR': my_phys.mBrakeTemp[3],

                        # Usure (%)
                        'TireWearFL': my_phys.mTireWear[0] * 100.0,
                        'TireWearFR': my_phys.mTireWear[1] * 100.0,
                        'TireWearRL': my_phys.mTireWear[2] * 100.0,
                        'TireWearRR': my_phys.mTireWear[3] * 100.0,
                        
                        'CompetitorsCount': len(competitors)
                    }
                    
                    self.latest_data = live_data
                
            except Exception:
                pass
                
            time.sleep(1 / 60.0)

    def stop(self):
        self.running = False
        if self.telemetry_mmap: self.telemetry_mmap.close()
        if self.scoring_mmap: self.scoring_mmap.close()
        self.join()