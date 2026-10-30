import time
import mmap
import ctypes
import threading
import math

# ==============================================================================
# ALIGNEMENT STRICT AVEC rF2 / LMU InternalsPlugin.hpp (Version 08)
# ==============================================================================

class TelemVect3(ctypes.Structure):
    _fields_ = [("x", ctypes.c_double), ("y", ctypes.c_double), ("z", ctypes.c_double)]

class TelemWheelV01(ctypes.Structure):
    _fields_ = [
        ("mSuspensionDeflection", ctypes.c_double),
        ("mRideHeight", ctypes.c_double),
        ("mSuspForce", ctypes.c_double),
        ("mBrakeTemp", ctypes.c_double),
        ("mBrakePressure", ctypes.c_double),
        ("mRotation", ctypes.c_double),
        ("mLateralPatchVel", ctypes.c_double),
        ("mLongitudinalPatchVel", ctypes.c_double),
        ("mLateralGroundVel", ctypes.c_double),
        ("mLongitudinalGroundVel", ctypes.c_double),
        ("mCamber", ctypes.c_double),
        ("mLateralForce", ctypes.c_double),
        ("mLongitudinalForce", ctypes.c_double),
        ("mTireLoad", ctypes.c_double),
        ("mGripFract", ctypes.c_double),
        ("mPressure", ctypes.c_double),
        ("mTemperature", ctypes.c_double * 3), 
        ("mWear", ctypes.c_double),
        ("mTerrainName", ctypes.c_char * 16),
        ("mSurfaceType", ctypes.c_uint8),
        ("mFlat", ctypes.c_bool),
        ("mDetached", ctypes.c_bool),
        ("mStaticUndeflectedRadius", ctypes.c_uint8),
        ("mVerticalTireDeflection", ctypes.c_double),
        ("mWheelYLocation", ctypes.c_double),
        ("mToe", ctypes.c_double),
        ("mTireCarcassTemperature", ctypes.c_double), 
        ("mTireInnerLayerTemperature", ctypes.c_double * 3),
        ("mOptimalTemp", ctypes.c_float),
        ("mCompoundIndex", ctypes.c_uint8),
        ("mCompoundType", ctypes.c_uint8),
        ("mExpansion", ctypes.c_uint8 * 18)
    ]

class TelemInfoV01(ctypes.Structure):
    _fields_ = [
        ("mID", ctypes.c_int32),
        ("mDeltaTime", ctypes.c_double),
        ("mElapsedTime", ctypes.c_double),
        ("mLapNumber", ctypes.c_int32),
        ("mLapStartET", ctypes.c_double),
        ("mVehicleName", ctypes.c_char * 64),
        ("mTrackName", ctypes.c_char * 64),
        ("mPos", TelemVect3),
        ("mLocalVel", TelemVect3),
        ("mLocalAccel", TelemVect3),
        ("mOri", TelemVect3 * 3),
        ("mLocalRot", TelemVect3),
        ("mLocalRotAccel", TelemVect3),
        ("mGear", ctypes.c_int32),
        ("mEngineRPM", ctypes.c_double),
        ("mEngineWaterTemp", ctypes.c_double),
        ("mEngineOilTemp", ctypes.c_double),
        ("mClutchRPM", ctypes.c_double),
        ("mUnfilteredThrottle", ctypes.c_double),
        ("mUnfilteredBrake", ctypes.c_double),
        ("mUnfilteredSteering", ctypes.c_double),
        ("mUnfilteredClutch", ctypes.c_double),
        ("mFilteredThrottle", ctypes.c_double),
        ("mFilteredBrake", ctypes.c_double),
        ("mFilteredSteering", ctypes.c_double),
        ("mFilteredClutch", ctypes.c_double),
        ("mSteeringShaftTorque", ctypes.c_double),
        ("mFront3rdDeflection", ctypes.c_double),
        ("mRear3rdDeflection", ctypes.c_double),
        ("mFrontWingHeight", ctypes.c_double),
        ("mFrontRideHeight", ctypes.c_double),
        ("mRearRideHeight", ctypes.c_double),
        ("mDrag", ctypes.c_double),
        ("mFrontDownforce", ctypes.c_double),
        ("mRearDownforce", ctypes.c_double),
        ("mFuel", ctypes.c_double),
        ("mEngineMaxRPM", ctypes.c_double),
        ("mScheduledStops", ctypes.c_uint8),
        ("mOverheating", ctypes.c_bool),
        ("mDetached", ctypes.c_bool),
        ("mHeadlights", ctypes.c_bool),
        ("mDentSeverity", ctypes.c_uint8 * 8),
        ("mLastImpactET", ctypes.c_double),
        ("mLastImpactMagnitude", ctypes.c_double),
        ("mLastImpactPos", TelemVect3),
        ("mEngineTorque", ctypes.c_double),
        ("mCurrentSector", ctypes.c_int32),
        ("mSpeedLimiter", ctypes.c_uint8),
        ("mMaxGears", ctypes.c_uint8),
        ("mFrontTireCompoundIndex", ctypes.c_uint8),
        ("mRearTireCompoundIndex", ctypes.c_uint8),
        ("mFuelCapacity", ctypes.c_double),
        ("mFrontFlapActivated", ctypes.c_uint8),
        ("mRearFlapActivated", ctypes.c_uint8),
        ("mRearFlapLegalStatus", ctypes.c_uint8),
        ("mIgnitionStarter", ctypes.c_uint8),
        ("mFrontTireCompoundName", ctypes.c_char * 18),
        ("mRearTireCompoundName", ctypes.c_char * 18),
        ("mSpeedLimiterAvailable", ctypes.c_uint8),
        ("mAntiStallActivated", ctypes.c_uint8),
        ("mUnused", ctypes.c_uint8 * 2),
        ("mVisualSteeringWheelRange", ctypes.c_float),
        ("mRearBrakeBias", ctypes.c_double),
        ("mTurboBoostPressure", ctypes.c_double),
        ("mPhysicsToGraphicsOffset", ctypes.c_float * 3),
        ("mPhysicalSteeringWheelRange", ctypes.c_float),
        ("mDeltaBest", ctypes.c_double),
        ("mBatteryChargeFraction", ctypes.c_double),
        ("mElectricBoostMotorTorque", ctypes.c_double),
        ("mElectricBoostMotorRPM", ctypes.c_double),
        ("mElectricBoostMotorTemperature", ctypes.c_double),
        ("mElectricBoostWaterTemperature", ctypes.c_double),
        ("mElectricBoostMotorState", ctypes.c_uint8),
        ("mLapInvalidated", ctypes.c_bool),
        ("mABSActive", ctypes.c_bool),
        ("mTCActive", ctypes.c_bool),
        ("mSpeedLimiterActive", ctypes.c_bool),
        ("mWiperState", ctypes.c_uint8),
        ("mTC", ctypes.c_uint8),
        ("mTCMax", ctypes.c_uint8),
        ("mTCSlip", ctypes.c_uint8),
        ("mTCSlipMax", ctypes.c_uint8),
        ("mTCCut", ctypes.c_uint8),
        ("mTCCutMax", ctypes.c_uint8),
        ("mABS", ctypes.c_uint8),
        ("mABSMax", ctypes.c_uint8),
        ("mMotorMap", ctypes.c_uint8),
        ("mMotorMapMax", ctypes.c_uint8),
        ("mMigration", ctypes.c_uint8),
        ("mMigrationMax", ctypes.c_uint8),
        ("mFrontAntiSway", ctypes.c_uint8),
        ("mFrontAntiSwayMax", ctypes.c_uint8),
        ("mRearAntiSway", ctypes.c_uint8),
        ("mRearAntiSwayMax", ctypes.c_uint8),
        ("mLiftAndCoastProgress", ctypes.c_uint8),
        ("mTrackLimitsSteps", ctypes.c_uint8),
        ("mRegen", ctypes.c_float),
        ("mSoC", ctypes.c_float),
        ("mVirtualEnergy", ctypes.c_float),
        ("mTimeGapCarAhead", ctypes.c_float),
        ("mTimeGapCarBehind", ctypes.c_float),
        ("mTimeGapPlaceAhead", ctypes.c_float),
        ("mTimeGapPlaceBehind", ctypes.c_float),
        ("mVehicleModel", ctypes.c_char * 30),
        ("mVehicleClass", ctypes.c_uint8),
        ("mVehicleChampionship", ctypes.c_uint8),
        ("mExpansion", ctypes.c_uint8 * 20),
        ("mWheel", TelemWheelV01 * 4) 
    ]

class rF2TelemetryArray(ctypes.Structure):
    _pack_ = 4
    _fields_ = [
        ("mVersionUpdateBegin", ctypes.c_int32),
        ("mVersionUpdateEnd", ctypes.c_int32),
        ("mBytesUpdated", ctypes.c_int32),
        ("mNumVehicles", ctypes.c_int32),
        ("mVehicles", TelemInfoV01 * 128)
    ]

class rF2VehicleScoring(ctypes.Structure):
    _pack_ = 4
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
        ("mNumPenalties", ctypes.c_int16),
        ("mIsPlayer", ctypes.c_bool),
        ("mControl", ctypes.c_int8),
        ("mInPits", ctypes.c_bool),
        ("mPlace", ctypes.c_uint8),
        ("mVehicleClass", ctypes.c_char * 32),
        ("mTimeBehindNext", ctypes.c_double),
        ("mLapsBehindNext", ctypes.c_int32),
        ("mTimeBehindLeader", ctypes.c_double),
        ("mLapsBehindLeader", ctypes.c_int32),
        ("mLapStartET", ctypes.c_double),
        ("mPos", TelemVect3),
        ("mLocalVel", TelemVect3),
        ("mLocalAccel", TelemVect3),
        ("mOri", TelemVect3 * 3),
        ("mLocalRot", TelemVect3),
        ("mLocalRotAccel", TelemVect3),
        ("mHeadlights", ctypes.c_uint8),
        ("mPitState", ctypes.c_uint8),
        ("mServerScored", ctypes.c_uint8),
        ("mIndividualPhase", ctypes.c_uint8),
        ("mQualification", ctypes.c_int32),
        ("mTimeIntoLap", ctypes.c_double),
        ("mEstimatedLapTime", ctypes.c_double),
        ("mPitGroup", ctypes.c_char * 24),
        ("mFlag", ctypes.c_uint8),
        ("mUnderYellow", ctypes.c_bool),
        ("mCountLapFlag", ctypes.c_uint8),
        ("mInGarageStall", ctypes.c_bool),
        ("mUpgradePack", ctypes.c_uint8 * 16),
        ("mPitLapDist", ctypes.c_float),
        ("mBestLapSector1", ctypes.c_float),
        ("mBestLapSector2", ctypes.c_float),
        ("mSteamID", ctypes.c_uint64),
        ("mVehFilename", ctypes.c_char * 32),
        ("mAttackMode", ctypes.c_int16),
        ("mFuelFraction", ctypes.c_uint8),
        ("mDRSState", ctypes.c_bool),
        ("mExpansion", ctypes.c_uint8 * 4)
    ]

class rF2ScoringInfo(ctypes.Structure):
    _pack_ = 4
    _fields_ = [
        ("mTrackName", ctypes.c_char * 64),
        ("mSession", ctypes.c_int32),
        ("mCurrentET", ctypes.c_double),
        ("mEndET", ctypes.c_double),
        ("mMaxLaps", ctypes.c_int32),
        ("mLapDist", ctypes.c_double),
        ("mResultsStream", ctypes.c_uint8 * 8), 
        ("mNumVehicles", ctypes.c_int32),
        ("mGamePhase", ctypes.c_uint8),
        ("mYellowFlagState", ctypes.c_int8),
        ("mSectorFlag", ctypes.c_int8 * 3),
        ("mStartLight", ctypes.c_uint8),
        ("mNumRedLights", ctypes.c_uint8),
        ("mInRealtime", ctypes.c_bool),
        ("mPlayerName", ctypes.c_char * 32),
        ("mPlrFileName", ctypes.c_char * 64),
        ("mDarkCloud", ctypes.c_double),
        ("mRaining", ctypes.c_double),
        ("mAmbientTemp", ctypes.c_double),
        ("mTrackTemp", ctypes.c_double),
        ("mWind", TelemVect3),
        ("mMinPathWetness", ctypes.c_double),
        ("mMaxPathWetness", ctypes.c_double),
        ("mGameMode", ctypes.c_uint8),
        ("mIsPasswordProtected", ctypes.c_bool),
        ("mServerPort", ctypes.c_uint16),
        ("mServerPublicIP", ctypes.c_uint32),
        ("mMaxPlayers", ctypes.c_int32),
        ("mServerName", ctypes.c_char * 32),
        ("mStartET", ctypes.c_float),
        ("mAvgPathWetness", ctypes.c_double),
        ("mSessionTimeRemaining", ctypes.c_float),
        ("mTimeOfDay", ctypes.c_float),
        ("mIsFixedSetup", ctypes.c_bool),
        ("mTrackGripLevel", ctypes.c_uint8),
        ("mCloudCoverage", ctypes.c_uint8),
        ("mTrackLimitsStepsPerPenalty", ctypes.c_uint8),
        ("mTrackLimitsStepsPerPoint", ctypes.c_uint8),
        ("mExpansion", ctypes.c_uint8 * 187),
        ("mVehicles", rF2VehicleScoring * 128)
    ]

# ==============================================================================
# LE THREAD DE LECTURE
# ==============================================================================

class LiveTelemetryThread(threading.Thread):
    def __init__(self):
        super().__init__()
        self.running = True
        self.telemetry_mmap = None
        self.scoring_mmap = None
        self.latest_data = None

    def _connect_to_lmu_memory(self):
        try:
            self.telemetry_mmap = mmap.mmap(0, ctypes.sizeof(rF2TelemetryArray), "$rFactor2SMMP_Telemetry$", access=mmap.ACCESS_READ)
            self.scoring_mmap = mmap.mmap(0, ctypes.sizeof(rF2ScoringInfo), "$rFactor2SMMP_Scoring$", access=mmap.ACCESS_READ)
            return True
        except FileNotFoundError:
            try:
                self.telemetry_mmap = mmap.mmap(0, 65536, "LMU_Data", access=mmap.ACCESS_READ)
                return True
            except FileNotFoundError:
                return False

    def run(self):
        print("[SONDE] Tentative de connexion (Mode Read-Only Anti-Cheat)...")
        while self.running and not self._connect_to_lmu_memory():
            time.sleep(2)
        print("[SONDE] Connecté à LMU. Acquisition Omnisciente et Sécurisée active.")

        while self.running:
            try:
                self.telemetry_mmap.seek(0)
                raw_telemetry = self.telemetry_mmap.read(ctypes.sizeof(rF2TelemetryArray))
                telemetry_array = rF2TelemetryArray.from_buffer_copy(raw_telemetry)
                
                if telemetry_array.mVersionUpdateBegin != telemetry_array.mVersionUpdateEnd:
                    continue 
                
                self.scoring_mmap.seek(0)
                raw_scoring = self.scoring_mmap.read(ctypes.sizeof(rF2ScoringInfo))
                scoring_data = rF2ScoringInfo.from_buffer_copy(raw_scoring)

                my_phys = None
                my_score = None
                competitors = []
                
                for i in range(scoring_data.mNumVehicles):
                    score_car = scoring_data.mVehicles[i]
                    if score_car.mIsPlayer:
                        my_score = score_car
                    elif score_car.mLapDist > 0:
                        competitors.append({
                            'id': score_car.mID,
                            'name': score_car.mDriverName.decode('utf-8', errors='ignore'),
                            'class': score_car.mVehicleClass.decode('utf-8', errors='ignore'),
                            'position': score_car.mPlace,
                            'last_lap': score_car.mLastLapTime,
                            'lap_dist': score_car.mLapDist,
                            'in_pits': score_car.mInPits,
                            'pos_x': score_car.mPos.x, 
                            'pos_z': score_car.mPos.z  
                        })

                if my_score:
                    for i in range(telemetry_array.mNumVehicles):
                        phys_car = telemetry_array.mVehicles[i]
                        if phys_car.mID == my_score.mID:
                            my_phys = phys_car
                            break

                if my_phys and my_score:
                    # Calcul du vent réel
                    wind_speed = math.sqrt(scoring_data.mWind.x**2 + scoring_data.mWind.y**2 + scoring_data.mWind.z**2)
                    
                    # Le vrai calcul des dégâts globaux aéro (Moyenne des 8 panneaux de carrosserie)
                    aero_damage = sum(my_phys.mDentSeverity) / 8.0
                    
                    # Vérifier si une roue est arrachée
                    wheels_detached = int(my_phys.mDetached) + sum([w.mDetached for w in my_phys.mWheel])

                    live_data = {
                        
                        # --- INFOS SESSION ---
                        'SessionPhase': scoring_data.mGamePhase,
                        'TrackName': scoring_data.mTrackName.decode('utf-8', errors='ignore').split('-')[0].strip(),
                        'FuelCapacity': my_phys.mFuelCapacity,
                        'ScheduledStops': my_phys.mScheduledStops,

                        # --- ENVIRONNEMENT ---
                        'Time': scoring_data.mCurrentET, 
                        'TrackTemp': scoring_data.mTrackTemp,
                        'AmbientTemp': scoring_data.mAmbientTemp,
                        'RainIntensity': scoring_data.mRaining, 
                        'Minimum Path Wetness': scoring_data.mMinPathWetness, 
                        'OffpathWetness': scoring_data.mMaxPathWetness, 
                        'WindSpeed': wind_speed,
                        'TrackGripLevel': scoring_data.mTrackGripLevel, # Dépôt de gomme en direct
                        'DarkCloud': scoring_data.mDarkCloud,
                        'Headlights': my_phys.mHeadlights,
                        
                        # --- GESTION COURSE ---
                        'YellowFlag': scoring_data.mYellowFlagState,
                        'SectorFlag': list(scoring_data.mSectorFlag), # Tableau de 3 secteurs
                        'Penalties': my_score.mNumPenalties, 
                        'In Pits': my_score.mInPits,
                        
                        # --- IDENTIFICATION ---
                        'MyPosition': my_score.mPlace, 
                        'MyLapDist': my_score.mLapDist,
                        'MyLastLap': my_score.mLastLapTime,
                        'MyClass': my_score.mVehicleClass.decode('utf-8', errors='ignore'), 
                        'MyPosX': my_score.mPos.x,
                        'MyPosZ': my_score.mPos.z,
                        'TimeGapAhead': my_phys.mTimeGapCarAhead,   # Écart avec voiture devant
                        'TimeGapBehind': my_phys.mTimeGapCarBehind, # Écart avec voiture derrière
                        'TimeGapPlaceAhead': my_phys.mTimeGapPlaceAhead, # Écart avec adversaire direct de MA catégorie
                        'LapInvalidated': my_phys.mLapInvalidated,  # Flag de tour annulé
                        'TrackLimitsWarnings': my_phys.mTrackLimitsSteps, # Compteur d'avertissements FIA
                        
                        # --- INPUTS PILOTE ---
                        'Speed': math.sqrt(my_phys.mLocalVel.x**2 + my_phys.mLocalVel.y**2 + my_phys.mLocalVel.z**2) * 3.6,
                        'Throttle': my_phys.mUnfilteredThrottle * 100.0,
                        'FilteredThrottle': my_phys.mFilteredThrottle * 100.0, 
                        'Brake': my_phys.mUnfilteredBrake * 100.0,
                        'FilteredBrake': my_phys.mFilteredBrake * 100.0, 
                        'Steering': my_phys.mUnfilteredSteering * 57.2958,
                        'Clutch': my_phys.mUnfilteredClutch * 100.0,
                        
                        # --- ELECTRONIQUE ---
                        'ABS_Active': my_phys.mABSActive,
                        'TC_Active': my_phys.mTCActive,
                        'Speed Limiter': my_phys.mSpeedLimiter,
                        'BrakeBias': my_phys.mRearBrakeBias * 100.0,
                        
                        # --- AÉRO ET CHÂSSIS ---
                        'FrontDownforceN': my_phys.mFrontDownforce,
                        'RearDownforceN': my_phys.mRearDownforce,
                        'DragN': my_phys.mDrag,
                        'Front3rdDeflection': my_phys.mFront3rdDeflection,
                        'Rear3rdDeflection': my_phys.mRear3rdDeflection,
                        'SteeringTorque': my_phys.mSteeringShaftTorque,
                        
                        # --- G-Forces ---
                        'GForceLat': my_phys.mLocalAccel.x / 9.80665,
                        'GForceVert': my_phys.mLocalAccel.y / 9.80665,
                        'GForceLon': -my_phys.mLocalAccel.z / 9.80665,
                        
                        # --- MOTEUR ET ÉNERGIE ---
                        'Gear': my_phys.mGear, 
                        'FuelLevel': my_phys.mFuel, 
                        'VirtualEnergy': my_phys.mVirtualEnergy * 100.0, 
                        'SoC': my_phys.mSoC * 100.0,                     
                        'EngineWaterTemp': my_phys.mEngineWaterTemp,
                        'EngineOilTemp': my_phys.mEngineOilTemp,
                        
                        # --- DÉGÂTS ---
                        'EngineDamage': my_phys.mOverheating,
                        'AeroDamage': aero_damage,
                        'WheelsDetached': wheels_detached,

                        # --- ROUES, FREINS & SUSPENSIONS (Les 4 coins extraits) ---
                        'FrontTireCompound': my_phys.mFrontTireCompoundName.decode('utf-8', errors='ignore'),
                        'RearTireCompound': my_phys.mRearTireCompoundName.decode('utf-8', errors='ignore'),

                        'RideHeightFL': my_phys.mWheel[0].mRideHeight,
                        'RideHeightFR': my_phys.mWheel[1].mRideHeight,
                        'RideHeightRL': my_phys.mWheel[2].mRideHeight,
                        'RideHeightRR': my_phys.mWheel[3].mRideHeight,

                        'SuspDeflectFL': my_phys.mWheel[0].mSuspensionDeflection,
                        'SuspDeflectFR': my_phys.mWheel[1].mSuspensionDeflection,
                        'SuspDeflectRL': my_phys.mWheel[2].mSuspensionDeflection,
                        'SuspDeflectRR': my_phys.mWheel[3].mSuspensionDeflection,
                        
                        'TirePressFL': my_phys.mWheel[0].mPressure,
                        'TirePressFR': my_phys.mWheel[1].mPressure,
                        'TirePressRL': my_phys.mWheel[2].mPressure,
                        'TirePressRR': my_phys.mWheel[3].mPressure,
                        
                        'BrakeTempFL': my_phys.mWheel[0].mBrakeTemp,
                        'BrakeTempFR': my_phys.mWheel[1].mBrakeTemp,
                        'BrakeTempRL': my_phys.mWheel[2].mBrakeTemp,
                        'BrakeTempRR': my_phys.mWheel[3].mBrakeTemp,
                        
                        'TireTempFL': my_phys.mWheel[0].mTemperature[1],
                        'TireTempFR': my_phys.mWheel[1].mTemperature[1],
                        'TireTempRL': my_phys.mWheel[2].mTemperature[1],
                        'TireTempRR': my_phys.mWheel[3].mTemperature[1],
                        
                        'TireCarcassFL': my_phys.mWheel[0].mTireCarcassTemperature,
                        'TireCarcassFR': my_phys.mWheel[1].mTireCarcassTemperature,
                        'TireCarcassRL': my_phys.mWheel[2].mTireCarcassTemperature,
                        'TireCarcassRR': my_phys.mWheel[3].mTireCarcassTemperature,
                        
                        'TireWearFL': my_phys.mWheel[0].mWear * 100.0,
                        'TireWearFR': my_phys.mWheel[1].mWear * 100.0,
                        'TireWearRL': my_phys.mWheel[2].mWear * 100.0,
                        'TireWearRR': my_phys.mWheel[3].mWear * 100.0,
                        
                        'TireFlatFL': my_phys.mWheel[0].mFlat,
                        'TireFlatFR': my_phys.mWheel[1].mFlat,
                        'TireFlatRL': my_phys.mWheel[2].mFlat,
                        'TireFlatRR': my_phys.mWheel[3].mFlat,
                        
                        'GripFractFL': my_phys.mWheel[0].mGripFract,
                        'GripFractFR': my_phys.mWheel[1].mGripFract,
                        'GripFractRL': my_phys.mWheel[2].mGripFract,
                        'GripFractRR': my_phys.mWheel[3].mGripFract,
                        
                        'TireLoadFL': my_phys.mWheel[0].mTireLoad,
                        'TireLoadFR': my_phys.mWheel[1].mTireLoad,
                        'TireLoadRL': my_phys.mWheel[2].mTireLoad,
                        'TireLoadRR': my_phys.mWheel[3].mTireLoad,
                        
                        'CompetitorsCount': len(competitors),
                        'CompetitorsLive': competitors
                    }
                    self.latest_data = live_data
                
            except Exception as e:
                pass
                
            time.sleep(1 / 60.0)

    def stop(self):
        self.running = False
        if self.telemetry_mmap: self.telemetry_mmap.close()
        if self.scoring_mmap: self.scoring_mmap.close()
        self.join()