import time
import threading

class LiveSpotterEngine(threading.Thread):
    def __init__(self, telemetry_engine, audio_spotter):
        super().__init__()
        self.telemetry = telemetry_engine
        self.audio = audio_spotter
        self.running = True
        self.session_start_time = time.time() # NOUVEAU: Délai d'activation dicté par l'audit
        
        # --- MACHINES D'ÉTATS ---
        self.pit_entry_learned = False
        self.pit_entry_dist = 0.0
        self.warned_pit_limiter = False
        self.last_yellow_flag = 0
        self.last_damage = 0.0
        self.last_engine_damage = 0.0
        self.last_penalties = 0
        self.rain_warned = False
        
        self.last_lap_distance = 0.0
        self.laps_completed = 0
        self.fuel_at_lap_start = -1.0
        self.fuel_history = [] # NOUVEAU: Fenêtre glissante pour l'essence

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
            
            # Boucle d'analyse tactique à 10Hz
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
                    # MODÈLE MATHÉMATIQUE : Fenêtre glissante de l'Audit
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
        
        # Détection d'un nouveau drapeau jaune
        if yellow > 0 and self.last_yellow_flag == 0:
            my_dist = data.get('MyLapDist', 0)
            hazard_distance = None
            
            # Recherche de la voiture crashée ou à l'arrêt
            for comp in data.get('CompetitorsLive', []):
                gap = comp['lap_dist'] - my_dist
                # Si la voiture est devant nous (entre 10m et 1500m)
                if 10 < gap < 1500 and comp.get('last_lap', 100) > 0: 
                    hazard_distance = gap
                    break

            if hazard_distance:
                # Alerte précise avec la distance mathématique
                self.audio.say(f"Yellow flag. Incident ahead in {int(hazard_distance)} meters. Be ready to brake.", "yellow_flag_precise", cooldown=45)
            else:
                # Alerte globale si l'ordinateur ne trouve pas la voiture
                self.audio.say("Yellow flag in sector. Keep your eyes open.", "yellow_flag_global", cooldown=45)

        self.last_yellow_flag = yellow

        if penalties > self.last_penalties:
            self.audio.say("Race control gave us a penalty. We need to serve it within 3 laps.", "penalty", cooldown=300)
        self.last_penalties = penalties

    def _analyze_pit_entry(self, data):
        my_dist = data.get('MyLapDist', 0)
        
        if not self.pit_entry_learned:
            for comp in data.get('CompetitorsLive', []):
                if comp['in_pits'] == 1 and comp['lap_dist'] > 100:
                    self.pit_entry_dist = comp['lap_dist']
                    self.pit_entry_learned = True
                    print(f"[SPOTTER] Entrée des stands localisée à {self.pit_entry_dist:.1f}m")
                    break

        if self.pit_entry_learned:
            dist_to_pits = self.pit_entry_dist - my_dist
            if 10 < dist_to_pits < 120 and not self.warned_pit_limiter:
                self.audio.say("Pit limiter in 100 meters. Speed down.", "pit_limiter", cooldown=60)
                self.warned_pit_limiter = True
                
            if dist_to_pits < -50 or dist_to_pits > 1000:
                self.warned_pit_limiter = False

    def _analyze_traffic_and_strategy(self, data):
        import math
        
        # Délai d'activation de 5 secondes au départ pour éviter la cacophonie (Exigence Audit)
        if time.time() - self.session_start_time < 5.0:
            return
        
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
                
                # MODÈLE MATHÉMATIQUE : Calcul Euclidien 3D pour le Three-Wide
                comp_x = comp.get('pos_x', 0.0)
                comp_z = comp.get('pos_z', 0.0)
                euclidean_dist = math.sqrt((comp_x - my_x)**2 + (comp_z - my_z)**2)
                
                if abs(gap_dist) < 4.0 and 1.5 < euclidean_dist < 6.0:
                    cars_alongside += 1
                
                # LOGIQUE MULTICLASSE (Analyse des drapeaux bleus prédictifs)
                if my_class != comp_class and comp_class != 'Unknown':
                    # Si on est en Hypercar/LMP2 et qu'une GT est devant
                    if gap_dist > 0 and gap_dist < 150 and any(p in my_class for p in ["Hyper", "LMP"]):
                        if "GT" in comp_class:
                            self.audio.say("Slower class car ahead. Prepare to lap them safely.", "lap_traffic", cooldown=45)
                    # Si on est en GT et qu'un prototype arrive derrière
                    elif gap_dist < 0 and gap_dist > -150 and "GT" in my_class:
                        if any(p in comp_class for p in ["Hyper", "LMP"]):
                            self.audio.say("Faster class prototype approaching behind. Hold your line.", "prototype_behind", cooldown=45)
                
                # LOGIQUE STANDARD (Même classe)
                else:
                    if -60 < gap_dist < -15: 
                        self.audio.say("Traffic close behind, hold your line.", "traffic_behind", cooldown=45)
                    elif 10 < gap_dist < 300 and comp.get('in_pits', 0) == 1:
                        self.audio.say("Car ahead is pitting. Push now for the undercut.", "undercut", cooldown=600)
                    
            if cars_alongside >= 2:
                self.audio.say("Three wide! Three wide! Hold your line!", "three_wide", cooldown=10)
                
    # =========================================================================
    # 2. CAR HEALTH & WEATHER
    # =========================================================================

    def _analyze_damage(self, data):
        damage = data.get('AeroDamage', 0.0)
        if damage > self.last_damage + 0.02: 
            self.audio.say("We see damage on the telemetry. Car will lose aero balance, adapt your driving.", "damage", cooldown=60)
        self.last_damage = damage

    def _analyze_engine_and_temps(self, data):
        # Sécurisation des données via get() avec fallback
        water_temp = data.get('EngineWaterTemp', 90.0) 
        engine_dmg = data.get('EngineDamage', 0.0)
        
        # Surchauffe due au Dirty Air (Aspiration prolongée)
        if water_temp > 110.0:
            self.audio.say("Engine temperatures are critical. Pull out of the slipstream to cool the car.", "engine_hot", cooldown=180)
            
        # Alerte de casse moteur
        if engine_dmg > self.last_engine_damage + 0.05:
            self.audio.say("Engine is taking damage. Watch your downshifts and temperatures.", "engine_dmg", cooldown=120)
        self.last_engine_damage = engine_dmg

    def _analyze_weather_and_grip(self, data):
        rain = data.get('RainIntensity', 0.0)
        track_temp = data.get('TrackTemp', 30.0)
        speed = data.get('Speed', 0)
        raw_throttle = data.get('Throttle', 0)
        filtered_throttle = data.get('FilteredThrottle', 0)
        gear = data.get('Gear', 1)
        
        # 1. Alerte pluie
        if rain > 0.05 and not self.rain_warned:
            self.audio.say("Track is getting wet. Move your brake bias to the rear and smooth your inputs.", "rain_start", cooldown=180)
            self.rain_warned = True
        elif rain < 0.01:
            self.rain_warned = False

        # 2. Refroidissement de la piste (Fin de journée / Nuit)
        # Nécessite de stocker self.last_track_temp dans l'init, mais on compare à des seuils bruts pour faire simple
        if track_temp < 15.0:
            self.audio.say("Track temperature is dropping fast. Mechanical grip will be lower.", "track_cold", cooldown=1800) # Cooldown 30 minutes

        # 3. Détection d'Aquaplaning
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
        raw_brake = data.get('Brake', 0)
        filtered_brake = data.get('FilteredBrake', 0)
        raw_throttle = data.get('Throttle', 0)
        filtered_throttle = data.get('FilteredThrottle', 0)
        speed = data.get('Speed', 0)
        rain = data.get('RainIntensity', 0.0)

        # Multiplicateur de tolérance : Sous la pluie, l'ordi intervient plus, on augmente le seuil avant de spammer
        tolerance = 2.0 if rain > 0.1 else 1.0

        # ABS ABUSE
        if raw_brake > 80 and (raw_brake - filtered_brake) > (20 * tolerance) and speed > 50:
            self.abs_abuse_counter += 1
            if self.abs_abuse_counter > 20: 
                self.audio.say("Heavy ABS intervention. Try shifting brake bias to the rear for the next stint.", "abs_alert", cooldown=300)
                self.abs_abuse_counter = 0
        else:
            self.abs_abuse_counter = max(0, self.abs_abuse_counter - 1)

        # TC ABUSE (Sortie de courbe lente)
        if raw_throttle > 80 and (raw_throttle - filtered_throttle) > (25 * tolerance) and speed < 120:
            self.tc_abuse_counter += 1
            if self.tc_abuse_counter > 20:
                self.audio.say("Traction control is cutting a lot of power. Be smoother on exit, or lower the TC angle.", "tc_alert", cooldown=300)
                self.tc_abuse_counter = 0
        else:
            self.tc_abuse_counter = max(0, self.tc_abuse_counter - 1)

    def _analyze_tires_and_brakes(self, data):
        speed = data.get('Speed', 0)
        if speed < 60: return 

        b_fl = data.get('BrakeTempFL', 300)
        b_fr = data.get('BrakeTempFR', 300)
        
        # Pression des 4 pneus (Sécurisé avec fallback à 180)
        p_fl = data.get('TirePressFL', 180)
        p_fr = data.get('TirePressFR', 180)
        p_rl = data.get('TirePressRL', 180)
        p_rr = data.get('TirePressRR', 180)
        t_fl = data.get('TireTempFL', 80) 

        # 1. Alerte pneus froids en sortie de stand
        if self.laps_completed <= 1 and t_fl < 65:
            self.audio.say("Tires are cold. Brake early and avoid kerbs.", "tires_cold", cooldown=180)

        # 2. DÉTECTION DE CREVAISON (PUNCTURE) - PRIORITÉ ABSOLUE
        # Si un pneu tombe subitement sous 80 kPa en roulant vite
        if p_fl < 80 or p_fr < 80 or p_rl < 80 or p_rr < 80:
            self.audio.say("Puncture detected! Puncture! Slow down and box immediately.", "puncture", cooldown=60)

        if self.laps_completed < 2: return

        # 3. Surchauffe freins et asymétrie
        if b_fl > 650:
            self.audio.say("Front brakes are overheating. Open brake ducts at the next pit stop.", "brakes_hot", cooldown=600)
        elif b_fl < 150:
            self.audio.say("Front brakes are too cold. Close the brake ducts to gain aero and temperature.", "brakes_cold", cooldown=600)
        
        if abs(b_fl - b_fr) > 150: 
            self.audio.say("Brake temperature delta is massive. Car will pull to one side under braking.", "brakes_asym", cooldown=600)

        # 4. Pressions anormales
        if 80 <= p_fl < 165: # Entre 80 et 165 (sous 80 c'est la crevaison)
            self.audio.say("Tire pressures are critically low. We are losing mechanical grip.", "press_low", cooldown=600)
        elif p_fl > 195:
            self.audio.say("Tire pressures are too high. The tire is ballooning, be careful on traction.", "press_high", cooldown=600)

    def _analyze_chassis(self, data):
        rh_fl = data.get('RideHeightFL', 0.050)
        speed = data.get('Speed', 0)

        # Détection du Bottoming (La planche frotte violemment l'asphalte à haute vitesse)
        if speed > 240 and rh_fl < 0.015: 
            self.bottoming_counter += 1
            if self.bottoming_counter > 20: 
                self.audio.say("Car is bottoming out on the straights. We are losing top speed. Raise the front ride height or stiffen the packers.", "bottoming", cooldown=600)
                self.bottoming_counter = 0
        else:
            self.bottoming_counter = max(0, self.bottoming_counter - 1)

    def stop(self):
        self.running = False
        self.join()