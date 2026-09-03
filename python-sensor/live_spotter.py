import time
import threading
import math

class LiveSpotterEngine(threading.Thread):
    def __init__(self, telemetry_engine, audio_spotter):
        super().__init__()
        self.telemetry = telemetry_engine
        self.audio = audio_spotter
        self.running = True
        self.session_start_time = time.time()
        
        # --- MACHINES D'ÉTATS ---
        self.pit_entry_learned = False
        self.pit_entry_dist = 0.0
        self.warned_pit_limiter = False
        self.last_yellow_flag = 0
        self.last_damage = 0.0
        self.last_engine_damage = 0.0
        self.last_penalties = 0
        self.rain_warned = False
        
        # --- CERVEAU STRATÉGIQUE ---
        self.strategy_announced = False
        self.comm_db = {}
        comm_path = os.path.join(".", "community_reference.json")
        if os.path.exists(comm_path):
            try:
                with open(comm_path, "r", encoding="utf-8") as f:
                    self.comm_db = json.load(f)
            except: pass

        self.last_lap_distance = 0.0
        self.laps_completed = 0
        self.fuel_at_lap_start = -1.0
        self.fuel_history = [] 

        self.abs_abuse_counter = 0
        self.tc_abuse_counter = 0
        self.bottoming_counter = 0
        self.aqua_planing_counter = 0

    def run(self):
        print("[SPOTTER] Ingénieur de Piste PRO-AM activé. Surveillance totale en cours...")
        while self.running:
            data = self.telemetry.latest_data
            if not data:
                time.sleep(0.1)
                continue
                
            # 1. CORE TRACKING
            self._announce_pre_race_strategy(data)
            self._track_lap_progress(data)
            self._analyze_flags(data)
            self._analyze_pit_entry(data)
            self._analyze_traffic_and_strategy(data)
            
            # 2. CAR HEALTH & DAMAGE
            self._analyze_damage(data)
            self._analyze_engine_and_temps(data)
            
            # 3. CHASSIS, TIRES & ELECTRONICS
            self._analyze_weather_and_grip(data)
            self._analyze_electronics(data)
            self._analyze_tires_and_brakes(data)
            self._analyze_chassis(data)
            
            time.sleep(0.1) 

    # =========================================================================
    # 1. CORE TRACKING & STRATEGY
    # =========================================================================

    def _track_lap_progress(self, data):
        current_dist = data.get('MyLapDist', 0)
        current_fuel = data.get('FuelLevel', 0)
        
        if self.last_lap_distance > 3000 and current_dist < 100:
            self.laps_completed += 1
            if self.fuel_at_lap_start > 0:
                usage = self.fuel_at_lap_start - current_fuel
                if usage > 0:
                    self.fuel_history.append(usage)
                    if len(self.fuel_history) > 5: 
                        self.fuel_history.pop(0)
                        
                    avg_usage = sum(self.fuel_history) / len(self.fuel_history)
                    laps_left = current_fuel / avg_usage
                    
                    if laps_left < 2.5:
                        self.audio.say("Fuel level critical. Box this lap.", "fuel_box", cooldown=180)
                    elif laps_left < 5.0:
                        self.audio.say("Start lift and coast to save energy.", "fuel_save", cooldown=300)
            
            if self.laps_completed % 10 == 0:
                self.audio.say("Fuel load is dropping. Consider moving brake bias forward.", "bias_migration", cooldown=1800)

            self.fuel_at_lap_start = current_fuel

        if self.fuel_at_lap_start == -1.0:
            self.fuel_at_lap_start = current_fuel
            
        self.last_lap_distance = current_dist

    def _analyze_flags(self, data):
        yellow = data.get('YellowFlag', 0)
        penalties = data.get('Penalties', 0)
        
        if yellow > 0 and self.last_yellow_flag == 0:
            my_dist = data.get('MyLapDist', 0)
            hazard_distance = None
            for comp in data.get('CompetitorsLive', []):
                gap = comp['lap_dist'] - my_dist
                if 10 < gap < 1500 and comp.get('last_lap', 100) > 0: 
                    hazard_distance = gap
                    break

            if hazard_distance:
                self.audio.say(f"Yellow flag. Incident ahead in {int(hazard_distance)} meters. Be ready to brake.", "yellow_flag_precise", cooldown=45)
            else:
                self.audio.say("Yellow flag in sector. Keep your eyes open.", "yellow_flag_global", cooldown=45)

        self.last_yellow_flag = yellow

        if penalties > self.last_penalties:
            self.audio.say("Race control gave us a penalty. We need to serve it within 3 laps.", "penalty", cooldown=300)
        self.last_penalties = penalties

    def _analyze_pit_entry(self, data):
        my_dist = data.get('MyLapDist', 0)
        speed_limiter = data.get('Speed Limiter', 0)
        in_pits = data.get('In Pits', 0)
        
        if not self.pit_entry_learned:
            for comp in data.get('CompetitorsLive', []):
                if comp['in_pits'] == 1 and comp['lap_dist'] > 100:
                    self.pit_entry_dist = comp['lap_dist']
                    self.pit_entry_learned = True
                    break

        if self.pit_entry_learned:
            dist_to_pits = self.pit_entry_dist - my_dist
            if 10 < dist_to_pits < 120 and not self.warned_pit_limiter:
                self.audio.say("Pit limiter in 100 meters. Speed down.", "pit_limiter", cooldown=60)
                self.warned_pit_limiter = True
                
            if dist_to_pits < -50 or dist_to_pits > 1000:
                self.warned_pit_limiter = False

        if in_pits == 1 and speed_limiter == 0 and not self.warned_pit_limiter:
            self.audio.say("You are in the pitlane. Speed limiter is OFF! Turn it on!", "pit_limiter_danger", cooldown=10)
            self.warned_pit_limiter = True

    def _analyze_traffic_and_strategy(self, data):
        if time.time() - self.session_start_time < 5.0: return
        
        my_dist = data.get('MyLapDist', 0)
        my_speed = data.get('Speed', 0)
        my_class = data.get('MyClass', 'Unknown')
        my_x = data.get('MyPosX', 0.0)
        my_z = data.get('MyPosZ', 0.0)
        
        if my_speed > 80:
            cars_alongside = 0
            for comp in data.get('CompetitorsLive', []):
                gap_dist = comp['lap_dist'] - my_dist
                comp_class = comp.get('class', 'Unknown')
                
                comp_x = comp.get('pos_x', 0.0)
                comp_z = comp.get('pos_z', 0.0)
                euclidean_dist = math.sqrt((comp_x - my_x)**2 + (comp_z - my_z)**2)
                
                if abs(gap_dist) < 4.0 and 1.5 < euclidean_dist < 6.0:
                    cars_alongside += 1
                
                if my_class != comp_class and comp_class != 'Unknown':
                    if gap_dist > 0 and gap_dist < 150 and any(p in my_class for p in ["Hyper", "LMP"]):
                        if "GT" in comp_class:
                            self.audio.say("Slower class car ahead. Prepare to lap them safely.", "lap_traffic", cooldown=45)
                    elif gap_dist < 0 and gap_dist > -150 and "GT" in my_class:
                        if any(p in comp_class for p in ["Hyper", "LMP"]):
                            self.audio.say("Faster class prototype approaching behind. Hold your line.", "prototype_behind", cooldown=45)
                else:
                    if -60 < gap_dist < -15: 
                        self.audio.say("Traffic close behind, hold your line.", "traffic_behind", cooldown=45)
                    elif 10 < gap_dist < 300 and comp.get('in_pits', 0) == 1:
                        self.audio.say("Car ahead is pitting. Push now for the undercut.", "undercut", cooldown=600)
                    
            if cars_alongside >= 2:
                self.audio.say("Three wide! Three wide! Hold your line!", "three_wide", cooldown=10)

    def _announce_pre_race_strategy(self, data):
        if getattr(self, 'strategy_announced', False): return
        
        track = data.get('TrackName', '')
        my_class = data.get('MyClass', '')
        if not track or not my_class or track == 'Unknown Track': return
        
        phase = data.get('SessionPhase', 0)
        # Phase 0 = Dans le Garage, Phase 4 = Sur la grille de départ
        if phase > 4: return 
        
        race_mins = 20 # Durée par défaut
        try:
            # L'IA interroge silencieusement notre propre serveur pour connaître la durée de la course !
            res = requests.get("http://127.0.0.1:8000/api/schedule", timeout=2).json()
            if res.get('status') == 'success':
                events = res['data'].get('nextUp', []) + res['data'].get('upcoming', [])
                for ev in events:
                    t_clean = ''.join(e for e in track.lower() if e.isalnum())
                    e_clean = ''.join(e for e in ev['track'].lower() if e.isalnum())
                    if t_clean in e_clean or e_clean in t_clean:
                        match = re.search(r'\d+', ev['length'])
                        if match: 
                            race_mins = int(match.group())
                            break
        except: pass
        
        expected_laps = 0
        c_class = "LMGT3" if "GT3" in my_class else "HYPERCAR" if "HYPER" in my_class else "LMGTE" if "GTE" in my_class else "LMP2WEC" if "P2" in my_class else ""
        
        # Lecture du JSON pour connaître le nombre de tours E-sport
        if hasattr(self, 'comm_db') and self.comm_db and c_class in self.comm_db:
            cat_data = self.comm_db[c_class]
            t_key = next((k for k in cat_data.keys() if track.lower().replace(" ","") in k.lower().replace(" ","")), None)
            if t_key and "fuel_stints" in cat_data[t_key]:
                exact_key = f"{race_mins}_min"
                expected_laps = cat_data[t_key]["fuel_stints"].get(exact_key, 0)
        
        if expected_laps == 0:
            expected_laps = int((race_mins * 60) / 115) 
            
        capacity = data.get('FuelCapacity', 100.0)
        
        # Consommations moyennes théoriques (en Litres)
        fpl = 3.5
        if "HYPER" in my_class: fpl = 2.5
        elif "GTE" in my_class: fpl = 4.0
        elif "P2" in my_class: fpl = 3.8
        elif "P3" in my_class: fpl = 3.0
        
        # +1.5 tours de marge de sécurité
        total_fuel_needed = (expected_laps + 1.5) * fpl
        
        if total_fuel_needed <= capacity:
            msg = f"Engineer connected. We are preparing for a {race_mins} minutes race. Expecting {expected_laps} laps. No pit stop required. Put {int(total_fuel_needed)} liters of fuel in the car."
        else:
            laps_per_stint = int(capacity / fpl)
            pit_lap = laps_per_stint - 1
            laps_left_after_pit = expected_laps - pit_lap
            fuel_to_add = (laps_left_after_pit + 1.5) * fpl
            msg = f"Engineer connected. {race_mins} minutes race. We need to pit. Start with a full tank. Plan to pit on lap {pit_lap}, and add {int(fuel_to_add)} liters."
            
        self.audio.say(msg, "strategy_brief", cooldown=99999)
        self.strategy_announced = True

    # =========================================================================
    # 2. CAR HEALTH & WEATHER
    # =========================================================================

    def _analyze_damage(self, data):
        damage = data.get('AeroDamage', 0.0)
        wheels_detached = data.get('WheelsDetached', 0)
        
        if wheels_detached > 0:
            self.audio.say("Major crash detected. Wheel detached. Park the car safely.", "wheel_lost", cooldown=600)
        elif damage > self.last_damage + 0.02: 
            self.audio.say("We see damage on the telemetry. Car will lose aero balance, adapt your driving.", "damage", cooldown=60)
            
        self.last_damage = damage

    def _analyze_engine_and_temps(self, data):
        water_temp = data.get('EngineWaterTemp', 90.0) 
        engine_dmg = data.get('EngineDamage', False)
        
        if water_temp > 110.0:
            self.audio.say("Engine temperatures are critical. Pull out of the slipstream to cool the car.", "engine_hot", cooldown=180)
            
        if engine_dmg and not self.last_engine_damage:
            self.audio.say("Engine is taking damage from overheating. Watch your downshifts.", "engine_dmg", cooldown=120)
        self.last_engine_damage = engine_dmg

    def _analyze_weather_and_grip(self, data):
        rain = data.get('RainIntensity', 0.0)
        min_wetness = data.get('Minimum Path Wetness', 0.0)
        off_wetness = data.get('OffpathWetness', 0.0)
        track_temp = data.get('TrackTemp', 30.0)
        speed = data.get('Speed', 0)
        raw_throttle = data.get('Throttle', 0)
        filtered_throttle = data.get('FilteredThrottle', 0)
        gear = data.get('Gear', 1)
        
        if rain > 0.05 and not self.rain_warned:
            self.audio.say("Track is getting wet. Move your brake bias to the rear and smooth your inputs.", "rain_start", cooldown=180)
            self.rain_warned = True
        elif rain < 0.01:
            self.rain_warned = False

        if rain == 0 and off_wetness > 0.3 and min_wetness < 0.1:
            self.audio.say("Racing line is drying. Move off-line on the straights to cool your wet tires.", "cool_wets", cooldown=300)

        if track_temp < 15.0:
            self.audio.say("Track temperature is dropping fast. Mechanical grip will be lower.", "track_cold", cooldown=1800)

        if rain > 0.2 and gear > 4 and raw_throttle > 80 and (raw_throttle - filtered_throttle) > 40:
            self.aqua_planing_counter += 1
            if self.aqua_planing_counter > 10: 
                self.audio.say("Aquaplaning detected. Lift off the throttle over standing water.", "aquaplaning", cooldown=120)
                self.aqua_planing_counter = 0
        else:
            self.aqua_planing_counter = max(0, self.aqua_planing_counter - 1)

    # =========================================================================
    # 3. CHASSIS, TIRES & ELECTRONICS
    # =========================================================================

    def _analyze_electronics(self, data):
        speed = data.get('Speed', 0)
        wetness = data.get('Minimum Path Wetness', 0.0)
        my_class = data.get('MyClass', 'Unknown').lower()
        
        has_abs = "gt3" in my_class
        abs_active = data.get('ABS_Active', False)
        tc_active = data.get('TC_Active', False)

        if has_abs and abs_active and speed > 50:
            self.abs_abuse_counter += 1
            if self.abs_abuse_counter > 20: 
                self.audio.say("Heavy ABS intervention. You are overdriving the entry, move brake bias rearwards.", "abs_alert", cooldown=300)
                self.abs_abuse_counter = 0
        else:
            self.abs_abuse_counter = max(0, self.abs_abuse_counter - 1)

        tc_limit = 30 if wetness > 0.1 else 15
        if tc_active and speed < 160:
            self.tc_abuse_counter += 1
            if self.tc_abuse_counter > tc_limit:
                self.audio.say("Traction control is cutting too much power. Smooth your throttle application.", "tc_alert", cooldown=300)
                self.tc_abuse_counter = 0
        else:
            self.tc_abuse_counter = max(0, self.tc_abuse_counter - 1)

    def _analyze_tires_and_brakes(self, data):
        speed = data.get('Speed', 0)
        if speed < 60: return

        b_fl = data.get('BrakeTempFL', 300)
        b_fr = data.get('BrakeTempFR', 300)
        p_fl = data.get('TirePressFL', 180)
        p_fr = data.get('TirePressFR', 180)
        p_rl = data.get('TirePressRL', 180)
        p_rr = data.get('TirePressRR', 180)
        t_fl = data.get('TireTempFL', 80) 
        w_fl = data.get('TireWearFL', 0)

        if self.laps_completed <= 1 and t_fl < 65:
            self.audio.say("Tires are cold. Brake early and avoid kerbs.", "tires_cold", cooldown=180)

        if p_fl < 80 or p_fr < 80 or p_rl < 80 or p_rr < 80:
            self.audio.say("Puncture detected! Puncture! Slow down and box immediately.", "puncture", cooldown=60)

        if self.laps_completed < 2: return

        if b_fl > 650:
            self.audio.say("Front brakes are overheating. Open brake ducts at the next pit stop.", "brakes_hot", cooldown=600)
        elif b_fl < 150:
            self.audio.say("Front brakes are too cold. Close the brake ducts to gain aero and temperature.", "brakes_cold", cooldown=600)
        
        if abs(b_fl - b_fr) > 150: 
            self.audio.say("Brake temperature delta is massive. Car will pull to one side under braking.", "brakes_asym", cooldown=600)

        if 80 <= p_fl < 165: 
            self.audio.say("Tire pressures are critically low. We are losing mechanical grip.", "press_low", cooldown=600)
        elif p_fl > 195:
            self.audio.say("Tire pressures are too high. The tire is ballooning, be careful on traction.", "press_high", cooldown=600)

        if w_fl > 30.0:
            self.audio.say("Front left tire wear is critical. You are losing rubber fast.", "tire_wear_critical", cooldown=600)
        elif w_fl > 15.0:
            self.audio.say("Tire degradation is increasing. Move brake bias rearwards to protect the front.", "tire_wear_warn", cooldown=1800)

    def _analyze_chassis(self, data):
        rh_fl = data.get('RideHeightFL', 0.050)
        rh_fr = data.get('RideHeightFR', 0.050)
        vert_g = data.get('GForceVert', 0.0) 
        speed = data.get('Speed', 0)
        steering_torque = data.get('SteeringTorque', 10.0)
        steering_angle = data.get('Steering', 0.0)

        # 1. Impacts verticaux (Sausage kerbs)
        if vert_g > 3.0 or vert_g < -1.0: 
            self.audio.say("Heavy vertical impact. Stay off those kerbs to save the floor.", "kerb_strike", cooldown=120)

        # 2. Bottoming (On lit désormais la gauche ET la droite)
        if speed > 240 and (rh_fl < 0.015 or rh_fr < 0.015): 
            self.bottoming_counter += 1
            if self.bottoming_counter > 20: 
                self.audio.say("Car is bottoming out on the straights. We are losing top speed.", "bottoming", cooldown=600)
                self.bottoming_counter = 0
        else:
            self.bottoming_counter = max(0, self.bottoming_counter - 1)
            
        # 3. Sous-virage terminal
        if abs(steering_angle) > 90 and abs(steering_torque) < 2.0 and speed > 80:
            self.audio.say("You are overdriving the front tires. Less steering angle to find the grip.", "understeer_torque", cooldown=120)

    def stop(self):
        self.running = False
        self.join()