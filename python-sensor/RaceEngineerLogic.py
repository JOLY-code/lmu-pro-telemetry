import pandas as pd

class RaceEngineerLogic:
    """
    Moteur d'inférence d'ingénierie de course avancé.
    Gère désormais l'aéro, les pneus, le freinage et la balance mécanique.
    """
    def __init__(self, setup_manager):
        self.sm = setup_manager
        self.diagnostic_report = []

        # --- BASE DE DONNÉES DES SIGNATURES MÉCANIQUES (WEC / ELMS) ---
        self.car_database = {
            # === LMGT3 ===
            'Porsche 911 LMGT3 R (992) 2026': {
                'layout': 'Rear-Engine Flat-6', 'trait': 'Traction absolue, freinage redoutable.', 'weakness': 'Sous-virage on-throttle si l avant se déleste.'
            },
            'Ford Mustang LMGT3 Evo': {
                'layout': 'Front-Engine V8', 'trait': 'Couple massif à bas régime.', 'weakness': 'Surchauffe et destruction des pneus arrière en sortie.'
            },
            'Aston Martin Vantage AMR LMGT3 Evo': {
                'layout': 'Front-Engine V8', 'trait': 'Plateforme très stable en endurance.', 'weakness': 'Paresse directionnelle initiale.'
            },
            'Lamborghini Huracán LMGT3 Evo 2': {
                'layout': 'Mid-Engine V10', 'trait': 'Vitesse de pointe et stabilité.', 'weakness': 'Sous-virage prononcé au point de corde.'
            },
            'BMW M4 LMGT3 Evo': {
                'layout': 'Front-Engine Straight-6 Turbo', 'trait': 'Stabilité aéro à haute vitesse.', 'weakness': 'Empattement long, paresseux en épingle.'
            },
            'Chevrolet Corvette Z06 LMGT3.R': {
                'layout': 'Mid-Engine V8', 'trait': 'Changements de direction très vifs.', 'weakness': 'Risque de snap-oversteer (survirage brutal).'
            },
            'Ferrari 296 LMGT3 Evo': {
                'layout': 'Mid-Engine V6 Turbo', 'trait': 'Appui aéro massif.', 'weakness': 'Sensible à la hauteur de caisse (Bottoming).'
            },
            'Lexus RC F LMGT3': {
                'layout': 'Front-Engine V8', 'trait': 'Adhérence mécanique exceptionnelle.', 'weakness': 'Forte traînée aéro (drag).'
            },
            'McLaren 720S LMGT3 Evo': {
                'layout': 'Mid-Engine V8 Turbo', 'trait': 'Châssis rigide type prototype.', 'weakness': 'Suspension punitive sur les vibreurs.'
            },
            'Mercedes-AMG LMGT3': {
                'layout': 'Front-Mid Engine V8', 'trait': 'Véhicule ultra-polyvalent.', 'weakness': 'Sous-virage aéro dans les grandes courbes.'
            },

            # === GTE ===
            'Aston Martin Vantage GTE': {
                'layout': 'Front-Engine V8 Turbo', 'trait': 'Couple moteur massif, plateforme très stable.', 'weakness': 'Dégradation accélérée des pneus arrière sous forte charge.'
            },
            'Chevrolet Corvette C8.R': {
                'layout': 'Mid-Engine V8', 'trait': 'Châssis hyper-rigide, freinage redoutable.', 'weakness': 'Instabilité brutale sur les vibreurs prononcés.'
            },
            'Ferrari 488 GTE Evo': {
                'layout': 'Mid-Engine V8 Turbo', 'trait': 'Aérodynamique redoutable, train avant incisif.', 'weakness': 'Survirage brutal (snap oversteer) à la limite absolue.'
            },
            'Porsche 911 RSR-19': {
                'layout': 'Mid-Engine Flat-6', 'trait': 'Usure pneumatique excellente, diffuseur géant.', 'weakness': 'Léger sous-virage aéro si le Rake est insuffisant.'
            },

            # === HYPERCAR ===
            'Alpine A424': {
                'layout': 'LMDh Rear-MGU V6 Turbo', 'trait': 'Équilibre et accessibilité.', 'weakness': 'Sous-virage en milieu de courbe lente.'
            },
            'Aston Martin Valkyrie AMR LMH Hypercar': {
                'layout': 'LMH Non-Hybrid V12', 'trait': 'Linéarité moteur, train avant pur.', 'weakness': 'Usure freins carbone (absence de régénération MGU).'
            },
            'BMW M Hybrid V8 Evo (2026)': {
                'layout': 'LMDh Rear-MGU V8 Bi-Turbo', 'trait': 'Constance thermique exemplaire.', 'weakness': 'Train avant sensible aux transferts brusques.'
            },
            'BMW M Hybrid V8': {
                'layout': 'LMDh Rear-MGU V8 Bi-Turbo', 'trait': 'Constance thermique exemplaire.', 'weakness': 'Train avant sensible aux transferts brusques.'
            },
            'Cadillac V-Series.R': {
                'layout': 'LMDh Rear-MGU V8 Atmo', 'trait': 'Rigidité structurelle, linéarité V8.', 'weakness': 'Sous-virage chronique, rebond sur les vibreurs.'
            },
            'Ferrari 499P': {
                'layout': 'LMH Front-MGU V6 Bi-Turbo', 'trait': 'Train avant vissé au sol.', 'weakness': 'Traction steer agressif au-dessus de 190 km/h.'
            },
            'Genesis GMR-001 LMDh': {
                'layout': 'LMDh Rear-MGU', 'trait': 'Aéro moderne.', 'weakness': 'Répartition des masses complexe.'
            },
            'Glickenhaus SCG 007': {
                'layout': 'LMH Non-Hybrid V8 Bi-Turbo', 'trait': 'Excellente réponse au trailbraking.', 'weakness': 'Électronique (TC) très basique, sous-virage naturel.'
            },
            'Isotta Fraschini Tipo 6-C': {
                'layout': 'LMH Front-MGU V6 Turbo', 'trait': 'Motricité intégrale agressive.', 'weakness': 'Gestion du transfert de charge hybride.'
            },
            'Lamborghini SC63': {
                'layout': 'LMDh Rear-MGU V8 Bi-Turbo', 'trait': 'Moteur viscéral et explosif.', 'weakness': 'Survirage de puissance sévère à la relance.'
            },
            'Peugeot 9X8 2023': {
                'layout': 'LMH Front-MGU (Wingless)', 'trait': 'Rotation basse vitesse (Boost 150 km/h).', 'weakness': 'Sous-virage aérodynamique à haute vélocité.'
            },
            'Peugeot 9X8 2024': {
                'layout': 'LMH Front-MGU (Winged)', 'trait': 'Stabilité arrière restaurée.', 'weakness': 'Perte d\'agilité dans les épingles lentes.'
            },
            'Porsche 963': {
                'layout': 'LMDh Rear-MGU V8 Bi-Turbo', 'trait': 'Stabilité impériale à haute vitesse.', 'weakness': 'Paresse dans la rotation (yaw) à basse vitesse.'
            },
            'Toyota GR010 Hybrid': {
                'layout': 'LMH Front-MGU V6 Bi-Turbo', 'trait': 'Train avant incisif, référence globale.', 'weakness': 'Instabilité arrière en transfert d\'appui moyen.'
            },
            'Toyota TR010 Hybrid (2026)': {
                'layout': 'LMH Front-MGU V6 Bi-Turbo', 'trait': 'Aéro perfectionnée.', 'weakness': 'Gestion de la dégradation des gommes arrière.'
            },
            'Vanwall Vandervell 680': {
                'layout': 'LMH Non-Hybrid V8 Atmo', 'trait': 'Excellente VMax brute.', 'weakness': 'Train arrière extrêmement vif et instable.'
            },

            # === LMP2 ===
            'Oreca 07 Gibson': {
                'layout': 'LMP2 Mid-Engine V8', 'trait': 'Appui aérodynamique monotype massif.', 'weakness': 'Dépendance absolue au Rake et à la barre anti-roulis.'
            },
            'Oreca 07 Gibson ELMS': {
                'layout': 'LMP2 Mid-Engine V8', 'trait': 'Appui aérodynamique monotype massif.', 'weakness': 'Dépendance absolue au Rake et à la barre anti-roulis.'
            },

            # === LMP3 ===
            'Duqueine D09': {
                'layout': 'LMP3 Mid-Engine V6 Bi-Turbo', 'trait': 'Plateforme neutre, pardonne le trailbraking.', 'weakness': 'Léger manque de vivacité au point de corde.'
            },
            'Ginetta G61-LT-P3': {
                'layout': 'LMP3 Mid-Engine V6 Bi-Turbo', 'trait': 'Rotation agressive, train arrière mobile.', 'weakness': 'Instabilité punitive au relâchement des freins.'
            },
            'Ligier JS P325': {
                'layout': 'LMP3 Mid-Engine V6 Bi-Turbo', 'trait': 'Stabilité aéro à haute vitesse.', 'weakness': 'Sous-virage prononcé à basse vitesse.'
            },
            'Adess AD25': {
                'layout': 'LMP3 Mid-Engine V6 Bi-Turbo', 'trait': 'VMax potentielle.', 'weakness': 'Déficit de performance aérodynamique globale.'
            }
        }

        # --- BASE DE DONNÉES TOPOLOGIQUE DES CIRCUITS (WEC) ---
        self.track_database = {
            'low_drag': ['Le Mans', 'Monza', 'Daytona', 'Sarthe'],
            'bumpy': ['Sebring', 'Imola'],
            'technical_abrasive': ['Bahrain', 'Portimao', 'Algarve', 'Barcelona', 'Catalunya'],
            'high_speed_flow': ['Spa', 'COTA', 'Americas', 'Paul Ricard', 'Silverstone', 'Lusail', 'Fuji']
        }

        self.current_car_model = "Unknown"
        self.current_car_class = "Unknown"

    def log(self, message):
        self.diagnostic_report.append(message)
        print(f"[ENGINEER/RADIO] {message}")

    def analyze_and_optimize(self, df_telemetry, session_context=None, df_competitors=None):
        """Processus complet d'analyse d'un relais avec conscience de l'environnement ET des adversaires."""
        if df_telemetry is None or df_telemetry.empty:
            self.log("Box, box. Données insuffisantes, fais un tour de plus.")
            return False

        self.log("Copie. Analyse de la télémétrie en cours...")
        
        # 1. Gestion du contexte, météo et IDENTIFICATION VÉHICULE
        if session_context:
            circuit = session_context.get('TrackName', 'Inconnu')
            duree = session_context.get('SessionDurationMinutes', 40)
            pluie = session_context.get('RainPathLevel', 0.0)
            track_temp = session_context.get('TrackTemp', 30.0)
            
            # Reconnaissance de ta monture
            self.current_car_model = session_context.get('VehicleName', 'Unknown')
            self.current_car_class = session_context.get('VehicleClass', 'Unknown')
            
            self.log(f"📍 Contexte : {circuit} | Météo : Air {session_context.get('AmbientTemp')}°C / Piste {track_temp}°C")
            self.log(f"🏎️ Véhicule identifié : {self.current_car_model} ({self.current_car_class})")

            if pluie > 0.1:
                self.log("⚠️ Piste humide détectée. L'IA recommande d'activer le protocole Pluie (Rain Setup).")
                
            self._adapt_setup_to_session_format(race_duration_minutes=duree)
            self.calculate_race_strategy(df_telemetry, duree, tank_capacity_liters=110.0)
        else:
            self.log("⚠️ Attention radio : Contexte de session introuvable.")
            track_temp = 30.0
            self._adapt_setup_to_session_format(race_duration_minutes=40)

        # 2. Analyse Châssis Standard
        avg_data = df_telemetry.mean()
        self._analyze_mechanical_balance(df_telemetry)
        self._analyze_braking(df_telemetry)
        self._analyze_tire_temperatures(avg_data)
        self._analyze_aero_platform(avg_data, df_telemetry)
        self._analyze_dampers(df_telemetry)
        self._analyze_differential(df_telemetry)
        self._analyze_gearbox(df_telemetry)
        self._analyze_driver_plateau(df_telemetry, current_position=5, target_position=1)
        self._analyze_hybrid_deployment(df_telemetry)
        self._analyze_wear_and_damage(df_telemetry)
        self._analyze_electronics(df_telemetry)
        self._optimize_cold_pressures(df_telemetry, track_temp)
        self._analyze_track_specifics(circuit, df_telemetry)

        # --- AIGUILLAGE DYNAMIQUE SELON LA CLASSE ET LE MODÈLE ---
        car_name_lower = self.current_car_model.lower()
        car_class_lower = self.current_car_class.lower()

        is_lmgt3 = "gt3" in car_class_lower or any(marque in car_name_lower for marque in ["mustang", "911", "huracan", "m4", "z06", "296", "lexus", "720s", "amg"]) and not "gte" in car_name_lower
        is_gte = "gte" in car_class_lower or any(marque in car_name_lower for marque in ["rsr", "c8.r", "488", "vantage gte"])
        is_hypercar = "hypercar" in car_class_lower or "lmh" in car_class_lower or "lmdh" in car_class_lower or any(marque in car_name_lower for marque in ["a424", "valkyrie", "hybrid v8", "cadillac", "v-series", "499p", "gmr-001", "scg 007", "tipo 6", "sc63", "9x8", "963", "gr010", "tr010", "vandervell"])
        is_lmp2 = "p2" in car_class_lower or "oreca" in car_name_lower
        is_lmp3 = "p3" in car_class_lower or any(marque in car_name_lower for marque in ["duqueine", "d09", "ginetta", "g61", "ligier", "js p325", "adess", "ad25"])

        if is_lmgt3:
            self._analyze_lmgt3_specifics(df_telemetry)
        elif is_hypercar:
            self._analyze_hypercar_specifics(df_telemetry)
        elif is_lmp2:
            self._analyze_lmp2_specifics(df_telemetry)
        elif is_lmp3:
            self._analyze_lmp3_specifics(df_telemetry)

        # 3. ANALYSE DES ADVERSAIRES
        if df_competitors is not None and not df_competitors.empty:
            self.analyze_race_pace_vs_competitors(df_telemetry, df_competitors)

        self.log("Setup prêt. Les modifications sont chargées pour ton prochain relais.")
        return True

    def _analyze_mechanical_balance(self, df):
        """
        Analyse de l'équilibre de la voiture (Sous-virage vs Survirage).
        Dans LMU, si l'angle de braquage (Steering) est extrême mais que la force G latérale plafonne, 
        c'est du sous-virage (la voiture tire tout droit).
        """
        if 'SteeringAngle' in df.columns and 'LatAccel' in df.columns:
            max_steer = df['SteeringAngle'].max()
            max_g = df['LatAccel'].max()
            
            # Algorithme simplifié : Si on tourne trop le volant pour peu de G latéraux
            if max_steer > 90 and max_g < 1.5:
                self.log("Diagnostic : Sous-virage important détecté en milieu de courbe.")
                self.log("Action : Assouplissement de la barre anti-roulis avant (Front ARB) pour donner du grip au train avant.")
                self.sm.modify_parameter('Suspension', 'FrontAntiSway', delta=-2.0)
            
            # Si la dérive du train arrière (Yaw) est trop forte
            elif df.get('YawRate', pd.Series([0])).max() > 40:
                self.log("Diagnostic : Survirage critique (Train arrière instable).")
                self.log("Action : Assouplissement de la barre anti-roulis arrière (Rear ARB).")
                self.sm.modify_parameter('Suspension', 'RearAntiSway', delta=-2.0)

    def _analyze_braking(self, df):
        """
        Analyse des blocages de roues au freinage pour ajuster la répartition (Brake Bias).
        """
        if 'WheelSpeedFL' in df.columns:
            # Si la vitesse de rotation de la roue avant tombe à 0 alors que la voiture roule encore
            front_lock = len(df[(df['WheelSpeedFL'] < 5) & (df['TopSpeed'] > 50)])
            rear_lock = len(df[(df['WheelSpeedRL'] < 5) & (df['TopSpeed'] > 50)])

            if front_lock > rear_lock + 10:
                self.log("Diagnostic : Tu bloques l'avant au gros freinage.")
                self.log("Action : Recul de la répartition de freinage (Brake Bias -1%).")
                self.sm.modify_parameter('Brakes', 'BrakeBias', delta=-1.0)
            
            elif rear_lock > front_lock + 10:
                self.log("Diagnostic : Danger, blocage du train arrière. Risque de tête-à-queue.")
                self.log("Action : Avancée de la répartition de freinage (Brake Bias +1%).")
                self.sm.modify_parameter('Brakes', 'BrakeBias', delta=+1.0)

    def _analyze_dampers(self, df):
        """
        Analyse de l'amortissement (Dampers).
        Gère l'absorption des vibreurs (Fast) et le transfert de masse (Slow).
        """
        if 'SuspensionVelocityFL' in df.columns and 'RideHeightFront' in df.columns:
            
            # 1. Gestion des vibreurs et aspérités (Fast Bump)
            max_susp_vel = df['SuspensionVelocityFL'].max()
            
            if max_susp_vel > 0.4: # Seuil théorique de choc violent (m/s)
                self.log("Diagnostic : Choc violent et rebond sur les vibreurs détecté.")
                self.log("Action : Assouplissement de la compression rapide (Fast Bump) à l'avant pour absorber le choc.")
                self.sm.modify_parameter('Suspension', 'FrontFastBump', delta=-1.0)
                
            # 2. Gestion du transfert de masse (Slow Rebound)
            # Si la hauteur de caisse varie trop en dehors des vibreurs, la voiture "flotte"
            elif df['RideHeightFront'].var() > 2.5: 
                self.log("Diagnostic : Oscillation de la plateforme aéro (la voiture flotte en courbe).")
                self.log("Action : Durcissement de la détente lente (Slow Rebound) pour stabiliser le châssis.")
                self.sm.modify_parameter('Suspension', 'FrontSlowRebound', delta=+1.0)    

    def _analyze_differential(self, df):
        """
        Analyse de la motricité et de la rotation via le différentiel.
        """
        if 'WheelSlipRL' in df.columns and 'Throttle' in df.columns:
            
            # Isolement des moments de forte accélération en sortie de virage
            heavy_throttle = df[df['Throttle'] > 80]
            if not heavy_throttle.empty:
                # Calcul de la différence de patinage entre les deux roues arrière
                slip_diff = abs(heavy_throttle['WheelSlipRL'] - heavy_throttle['WheelSlipRR']).max()
                
                # Cas A : Une roue patine dans le vide (grosse perte de temps et usure pneu)
                if slip_diff > 0.15: 
                    self.log("Diagnostic : Perte de motricité sur la roue intérieure en sortie de virage.")
                    self.log("Action : Verrouillage du différentiel (Augmentation de la précharge / Preload).")
                    self.sm.modify_parameter('Drivetrain', 'Preload', delta=+5.0)
                    
                # Cas B : La voiture refuse de tourner quand on remet les gaz (Sous-virage "on-throttle")
                elif slip_diff < 0.02 and heavy_throttle['SteeringAngle'].max() > 45:
                    self.log("Diagnostic : La voiture pousse tout droit à la réaccélération (Différentiel trop verrouillé).")
                    self.log("Action : Ouverture du différentiel (Augmentation du Power Ramp Angle).")
                    self.sm.modify_parameter('Drivetrain', 'PowerRampAngle', delta=+5.0)

    def _analyze_gearbox(self, df):
        """
        Analyse de l'étagement de la boîte de vitesses (Final Drive).
        Objectif : Optimiser l'accélération tout en atteignant la VMax en fin de ligne droite.
        """
        if 'EngineRPM' in df.columns and 'TimeAtLimiter' in df.columns:
            max_rpm_reached = df['EngineRPM'].max()
            
            # Note : 8500 RPM est une valeur d'exemple, l'API LMU fournit le Redline (rupteur) réel
            estimated_redline = 8500 
            
            # Cas 1 : La voiture reste bloquée au rupteur en ligne droite (perte de vitesse)
            if df['TimeAtLimiter'].max() > 1.0: 
                self.log("Diagnostic : Le moteur sature au rupteur trop longtemps en ligne droite.")
                self.log("Action : Allongement du rapport final (Final Drive) pour augmenter la Vitesse de Pointe.")
                self.sm.modify_parameter('Drivetrain', 'FinalDrive', delta=-1)
                
            # Cas 2 : Le moteur s'essouffle et n'atteint pas son plein potentiel
            elif max_rpm_reached < (estimated_redline - 400):
                self.log("Diagnostic : Le 6ème ou 7ème rapport est trop long, perte d'accélération.")
                self.log("Action : Raccourcissement du rapport final pour plus de nervosité et de reprise.")
                self.sm.modify_parameter('Drivetrain', 'FinalDrive', delta=+1)

    def calculate_race_strategy(self, df, race_duration_minutes, tank_capacity_liters):
        """
        Calcul prédictif complet : Carburant de départ, Arrêts, Lift & Coast et Usure Pneus.
        """
        self.log("--- STRATÉGIE DE COURSE (FUEL & TYRES) ---")
        
        if 'FuelConsumed' not in df.columns or 'LapTime' not in df.columns:
            self.log("Erreur : Impossible de calculer la stratégie. Données manquantes.")
            return

        avg_lap_time_s = df['LapTime'].mean()
        avg_fuel_per_lap = df['FuelConsumed'].mean()
        
        # Projections
        total_race_seconds = race_duration_minutes * 60
        estimated_total_laps = int(total_race_seconds / avg_lap_time_s) + 1
        total_fuel_needed = (estimated_total_laps * avg_fuel_per_lap) + (1.5 * avg_fuel_per_lap) # 1.5 tour de sécurité
        
        # Calcul des relais
        max_laps_per_stint = int(tank_capacity_liters / avg_fuel_per_lap)
        number_of_pitstops = int(total_fuel_needed / tank_capacity_liters)
        
        # Le point le plus important pour les sprints : Le carburant de départ
        starting_fuel = min(total_fuel_needed, tank_capacity_liters)
        
        # Le carburant restant pour le dernier relais
        fuel_for_last_stint = total_fuel_needed - (number_of_pitstops * tank_capacity_liters)

        self.log(f"Projection d'arrivée : {estimated_total_laps} tours.")
        self.log(f"Consommation relevée : {avg_fuel_per_lap:.2f} L/tour.")
        self.log(f"-> ORDRE GRILLE DE DÉPART : Embarque exactement {starting_fuel:.1f} Litres.")
        
        # Logique d'arrêts et de pneus
        if number_of_pitstops == 0:
            self.log("-> STRATÉGIE PITS : Zéro arrêt. Full Push jusqu'au drapeau à damier.")
            # En sprint court, on prévient si les pneus vont chauffer
            if race_duration_minutes < 30:
                self.log("-> STRATÉGIE PNEUS : Softs recommandés. Utilise le grip maximum dès le tour de chauffe.")
        else:
            self.log(f"-> STRATÉGIE PITS : {number_of_pitstops} arrêt(s) aux stands prévu(s).")
            
            # Logique Lift & Coast pour annuler un arrêt si c'est très serré
            if 0 < fuel_for_last_stint < (tank_capacity_liters * 0.10):
                self.log(f"⚠️ ALERTE ÉCO : Il te manque {fuel_for_last_stint:.1f}L pour annuler ton dernier arrêt !")
                self.log("-> ORDRE EN PISTE : LIFT & COAST. Lève le pied avant le freinage pour sauter l'arrêt.")
            
            # Gestion des pneus en endurance
            if race_duration_minutes >= 120:
                self.log("-> STRATÉGIE PNEUS : Mediums/Hards. Envisage un 'Double Relais' (Double Stint) sur le même train de pneus si l'usure à la fin de ton premier relais est inférieure à 40%.")

        self.log("------------------------------------------")

    def _analyze_driver_plateau(self, df, current_position, target_position):
        """
        Détecte si le pilote stagne et s'il faut sacrifier un peu de stabilité 
        pour de la vitesse pure (uniquement s'il n'est pas à la place visée).
        """
        variance = df['LapTime'].var()
        
        # Si le pilote est très régulier (variance faible) mais pas à sa place
        if variance < 0.3 and current_position > target_position:
            self.log("Diagnostic : Tes chronos sont ultra réguliers, mais on manque de rythme pur pour remonter.")
            self.log("Action : Ajout d'appui aérodynamique avant pour te donner un train avant plus incisif (plus de vitesse en courbe).")
            
            # On applique une modification, mais AVEC des limites strictes pour ne pas rendre la voiture instable
            # Exemple : On refuse de descendre l'aileron arrière en dessous de la valeur 3 (pour ne pas perdre l'arrière)
            self.sm.modify_parameter('Aero', 'FrontWingSetting', delta=+1.0, limit_max=5.0)
            self.sm.modify_parameter('Aero', 'RearWingSetting', delta=-1.0, limit_min=3.0)
            
            self.log("⚠️ Attention radio : Le train avant va être plus mordant. Garde tes repères de freinage mais attaque l'apex plus fort.")

    def analyze_race_pace_vs_competitors(self, df_my_stint, df_competitors):
        """
        Analyse ton rythme moyen par rapport aux autres joueurs de la même classe (Hypercar / LMGT3).
        """
        if df_my_stint is None or df_competitors is None or df_competitors.empty:
            return

        self.log("--- ANALYSE DU RYTHME VS ADVERSAIRES ---")
        
        my_avg_pace = df_my_stint['LapTime'].mean()
        
        # On extrait le meilleur temps du leader absolu
        leader_best_lap = df_competitors['LapTime'].min()
        leader_name = df_competitors.loc[df_competitors['LapTime'].idxmin()]['DriverName']
        
        # On calcule le delta
        delta_to_leader = my_avg_pace - leader_best_lap
        
        self.log(f"Leader actuel : {leader_name} ({leader_best_lap:.2f} s)")
        self.log(f"Ton rythme moyen : {my_avg_pace:.2f} s")
        
        if delta_to_leader < 1.0:
            self.log("✅ Diagnostic Stratégique : Rythme de course exceptionnel. Tu roules dans les temps du leader.")
            self.log("Ordre : Ne change rien au setup. Conserve tes pneus et pousse à l'undercut.")
        elif delta_to_leader < 3.0:
            self.log(f"⚠️ Diagnostic Stratégique : Tu perds {delta_to_leader:.1f}s au tour sur le leader.")
            self.log("Ordre : Vérifie les secteurs où tu perds du temps dans la page 'Vos Sessions'.")
        else:
            self.log(f"🚨 Diagnostic Stratégique : Tu es à +{delta_to_leader:.1f}s du leader. Setup non compétitif ou pilotage en sur-régime.")
            self.log("Ordre : On va assouplir la voiture pour te redonner de la confiance.")
            # L'IA prend l'initiative d'assouplir les barres anti-roulis pour rendre la voiture plus docile
            self.sm.modify_parameter('Suspension', 'FrontAntiSway', delta=-3.0)
            self.sm.modify_parameter('Suspension', 'RearAntiSway', delta=-3.0)
        
    def _adapt_setup_to_session_format(self, race_duration_minutes):
        """
        Modifie la fiabilité et l'aéro du setup en fonction du type de course.
        """
        self.log(f"--- ADAPTATION AU FORMAT DE COURSE : {race_duration_minutes} MIN ---")
        
        # Format Sprint / Daily Race (<= 60 minutes)
        if race_duration_minutes <= 60:
            self.log("Mode SPRINT activé : Priorité à la performance pure. Le poids et la traînée sont les ennemis.")
            self.log("Action : Fermeture partielle des radiateurs et écopes de freins (Gain de VMax).")
            # Les limites min empêchent de fermer à 100% pour éviter de casser le moteur
            self.sm.modify_parameter('Engine', 'RadiatorIntake', delta=-1.0, limit_min=2.0)
            self.sm.modify_parameter('Brakes', 'BrakeDuctSize', delta=-1.0, limit_min=1.0)
            
        # Format Endurance (> 60 minutes)
        else:
            self.log("Mode ENDURANCE activé : Priorité à la fiabilité et à la préservation du matériel.")
            self.log("Action : Ouverture du refroidissement (pour survivre dans le trafic) et sécurisation du fond plat.")
            self.sm.modify_parameter('Engine', 'RadiatorIntake', delta=+1.0, limit_max=5.0)
            self.sm.modify_parameter('Brakes', 'BrakeDuctSize', delta=+1.0, limit_max=5.0)
            # On monte la caisse de 1mm pour éviter d'user la planche (Plank Wear) sur 6 heures de course
            self.sm.modify_parameter('Aero', 'FrontRideHeight', delta=+1.0)
            self.sm.modify_parameter('Aero', 'RearRideHeight', delta=+1.0)

    def _analyze_hybrid_deployment(self, df):
        """
        Analyse de l'utilisation de l'énergie électrique (Hypercar ERS).
        Vérifie si le pilote vide sa batterie trop vite ou ne l'utilise pas assez.
        """
        if 'BatteryCharge' in df.columns:
            min_battery = df['BatteryCharge'].min()
            max_battery = df['BatteryCharge'].max()
            
            # Si la batterie ne descend jamais en dessous de 80%, le pilote perd de la puissance gratuite
            if min_battery > 80.0:
                self.log("Diagnostic (ERS) : Tu n'utilises pas ton système hybride. Ta batterie reste pleine.")
                self.log("Action : Modifie ton mapping ERS sur le volant pour un mode plus agressif (Build/Attack).")
                
            # Si la batterie plafonne à moins de 20%, le pilote "clippe" en ligne droite (plus d'énergie)
            elif max_battery < 20.0:
                self.log("Diagnostic (ERS) : Batterie constamment vide. Tu 'clippes' en fin de ligne droite (perte de VMax).")
                self.log("Action : Baisse ton mode de déploiement (sélectionne Balanced ou No Deploy dans les parties sinueuses).")

    def _analyze_wear_and_damage(self, df):
        """
        Surveille l'intégrité de la voiture (Dégâts Aéro et Usure Pneus extrême).
        """
        if 'AeroDamage' in df.columns and df['AeroDamage'].max() > 0.05:
            degats_pct = df['AeroDamage'].max() * 100
            self.log(f"🚨 ALERTE DÉGÂTS : Perte d'appui aéro détectée ({degats_pct:.1f}%).")
            self.log("Action : La voiture va fortement sous-virer à haute vitesse. Anticipe tes freinages et ajoute de l'aileron au prochain arrêt.")
            # Optionnel : L'IA pourrait compenser les dégâts en modifiant le setup
            self.sm.modify_parameter('Aero', 'FrontWingSetting', delta=+1.0)
            
        if 'TireWearFL' in df.columns:
            wear_fl = df['TireWearFL'].max()
            if wear_fl > 30.0:
                self.log(f"⚠️ Usure critique Pneu Avant Gauche : {wear_fl:.1f}%.")
                self.log("Action : Déplace la répartition de freinage (Brake Bias) vers l'arrière pour soulager l'avant sous peine de crevaison.")
                self.sm.modify_parameter('Brakes', 'BrakeBias', delta=-1.0)

    def process_live_telemetry(self, live_data):
        """
        SPOTTER EN DIRECT : S'exécute à 60Hz.
        Analyse les données à la milliseconde pour prévenir le pilote d'un danger immédiat.
        C'est cette fonction qui sera branchée à la synthèse vocale (TTS) plus tard.
        """
        alerts = []
        
        # 1. Gestion de la sécurité
        if live_data.get('YellowFlag', 0) > 0:
            alerts.append("🟨 DRAPEAU JAUNE. Lève le pied, danger en piste.")
            
        if live_data.get('BlueFlag', 0) > 0:
            alerts.append("🟦 DRAPEAU BLEU. Laisse passer la voiture plus rapide.")
            
        # 2. Dégâts instantanés (Alerte crash en direct)
        if live_data.get('AeroDamage', 0.0) > 0.02:
            alerts.append("💥 CONTACT DÉTECTÉ. Vérifie ta direction.")
            
        # 3. Trafic et Radar de proximité
        competitors = live_data.get('CompetitorsCount', 0)
        if competitors > 0:
            # Plus tard, avec un peu de maths sur les coordonnées X/Z, 
            # on pourra faire : "Voiture à gauche", "Clear à droite"
            pass
            
        return alerts
    
    def _analyze_electronics(self, df):
        """
        Analyse des aides à la conduite (TC et ABS).
        Vital pour les LMGT3, les Hypercars, et les sessions sous la pluie.
        """
        if 'UnfilteredBrake' in df.columns and 'FilteredBrake' in df.columns:
            # On calcule l'écart moyen entre ce que le pilote demande et ce que l'ABS autorise
            abs_intervention = (df['UnfilteredBrake'] - df['FilteredBrake']).mean()
            
            if abs_intervention > 10.0:
                self.log("Diagnostic (Électronique) : L'ABS s'active excessivement sur tes gros freinages.")
                self.log("Action : Baisse ton réglage d'ABS au volant, ou recule la répartition (Brake Bias) pour soulager les pneus avant.")

        if 'UnfilteredThrottle' in df.columns and 'FilteredThrottle' in df.columns:
            # On vérifie si le TC coupe l'accélération en sortie de courbe
            tc_intervention = (df['UnfilteredThrottle'] - df['FilteredThrottle']).mean()
            
            if tc_intervention > 10.0:
                self.log("Diagnostic (Électronique) : Le Traction Control (TC) bride énormément tes sorties de courbe.")
                self.log("Action : Ton train arrière manque d'adhérence mécanique. Assouplis la barre anti-roulis arrière (Rear ARB) ou baisse le niveau de TC au volant.")

    def _optimize_cold_pressures(self, df, current_track_temp):
        """
        Ajuste les pressions à froid dans le fichier .svm en se basant sur les pressions à chaud 
        mesurées en piste et la température actuelle du circuit.
        """
        self.log("--- OPTIMISATION THERMODYNAMIQUE DES PNEUS ---")
        
        # On isole les tours lancés valides (On ignore le tour de sortie où les pneus sont froids)
        valid_laps = df[(df['Valid'] == 1) & (df['Lap'] > 1)]
        if valid_laps.empty:
            self.log("Pas assez de tours lancés valides pour calibrer les pressions avec précision.")
            return

        # Moyenne des pressions à chaud relevées en piste
        avg_hot = valid_laps.mean()
        
        # Cible optimale de fonctionnement dans LMU (165 kPa est le sweet spot absolu pour LMGT3/LMP2)
        target_hot_pressure = 165.0 

        tires = {
            'TirePressFL': 'FrontLeftPressure',
            'TirePressFR': 'FrontRightPressure',
            'TirePressRL': 'RearLeftPressure',
            'TirePressRR': 'RearRightPressure'
        }

        # Calcul du delta météo : On part du principe que le setup de base a été fait pour une piste à 30°C
        baseline_temp = 30.0
        temp_delta = current_track_temp - baseline_temp
        
        # Loi empirique LMU : La pression à froid perd ~0.3 kPa pour chaque degré de piste en plus
        weather_correction_kpa = -0.3 * temp_delta

        for telemetry_key, setup_key in tires.items():
            if telemetry_key in avg_hot:
                actual_hot = avg_hot[telemetry_key]
                
                # 1. Delta pour atteindre la cible mécanique
                delta_to_target = target_hot_pressure - actual_hot
                
                # 2. Ajout de la compensation environnementale (Météo)
                total_correction_kpa = delta_to_target + weather_correction_kpa
                
                # On ne corrige que si la différence est significative (> 0.5 kPa) pour éviter le sur-ajustement
                if abs(total_correction_kpa) > 0.5:
                    self.log(f"[{setup_key}] Pression à chaud relevée: {actual_hot:.1f} kPa (Cible: {target_hot_pressure} kPa).")
                    self.log(f"[{setup_key}] Correction Setup appliquée: {total_correction_kpa:+.1f} kPa.")
                    
                    # Envoi de l'ordre de modification au Setup Manager
                    self.sm.modify_parameter('Tires', setup_key, delta=total_correction_kpa)
                else:
                    self.log(f"[{setup_key}] Pression optimale confirmée ({actual_hot:.1f} kPa).")

    def _analyze_aero_platform(self, avg_data, df):
        """
        Analyse de la hauteur de caisse et du fond plat (Rake).
        Garantit que la voiture ne frotte pas excessivement à haute vitesse (perte de VMax).
        """
        if 'RideHeightFront' in df.columns and 'RideHeightRear' in df.columns:
            min_front_rh = df['RideHeightFront'].min()
            
            # Si l'avant touche le sol (Talonage / Bottoming)
            if min_front_rh < 0.2:
                self.log("Diagnostic : La planche frotte violemment le sol à haute vitesse (Bottoming).")
                self.log("Action : Augmentation de la hauteur de caisse avant, ou durcissement des ressorts (Front Packers).")
                self.sm.modify_parameter('Aero', 'FrontRideHeight', delta=+1.0)
                
            # Maintien de l'inclinaison (Rake) pour l'appui du diffuseur
            avg_rake = avg_data['RideHeightRear'] - avg_data['RideHeightFront']
            if avg_rake < 1.0:
                self.log("Diagnostic : La voiture est trop plate (manque de Rake). Le diffuseur perd de son efficacité.")
                self.sm.modify_parameter('Aero', 'RearRideHeight', delta=+1.0)

    def _analyze_tire_temperatures(self, avg_data):
        """
        Analyse la répartition thermique (Inner, Middle, Outer) pour régler le Carrossage (Camber).
        Cible théorique : L'intérieur (I) doit être environ 5 à 10°C plus chaud que l'extérieur (O).
        """
        self.log("--- ANALYSE DE LA GÉOMÉTRIE (CARROSSAGE) ---")
        
        # Pneu Avant Gauche (Exemple représentatif pour le train avant)
        if 'TireTempFL_I' in avg_data and 'TireTempFL_O' in avg_data:
            temp_in_fl = avg_data['TireTempFL_I']
            temp_out_fl = avg_data['TireTempFL_O']
            spread_front = temp_in_fl - temp_out_fl
            
            if spread_front > 12.0:
                self.log(f"Diagnostic : Surchauffe interne massive à l'avant (Delta: {spread_front:.1f}°C).")
                self.log("Action : Tu as trop de carrossage négatif. Réduction du Camber avant pour remettre le pneu à plat au freinage.")
                self.sm.modify_parameter('Suspension', 'FrontLeftCamber', delta=+0.5)  # Se rapproche de 0
                self.sm.modify_parameter('Suspension', 'FrontRightCamber', delta=+0.5)
            elif spread_front < 2.0:
                self.log(f"Diagnostic : L'extérieur du pneu avant chauffe trop (Delta: {spread_front:.1f}°C).")
                self.log("Action : Manque de carrossage négatif. La voiture s'écrase sur le flanc extérieur en virage. Augmentation du Camber.")
                self.sm.modify_parameter('Suspension', 'FrontLeftCamber', delta=-0.5) # Plus négatif
                self.sm.modify_parameter('Suspension', 'FrontRightCamber', delta=-0.5)

        # Pneu Arrière Gauche (Exemple représentatif pour le train arrière)
        if 'TireTempRL_I' in avg_data and 'TireTempRL_O' in avg_data:
            temp_in_rl = avg_data['TireTempRL_I']
            temp_out_rl = avg_data['TireTempRL_O']
            spread_rear = temp_in_rl - temp_out_rl
            
            # L'arrière nécessite généralement moins de carrossage que l'avant pour maximiser la motricité
            if spread_rear > 8.0:
                self.log("Diagnostic : Trop de carrossage arrière. Perte de surface de contact à l'accélération.")
                self.sm.modify_parameter('Suspension', 'RearLeftCamber', delta=+0.5)
                self.sm.modify_parameter('Suspension', 'RearRightCamber', delta=+0.5)

    def _analyze_lmgt3_specifics(self, df):
        """
        Analyse comportementale ciblée pour l'ensemble du plateau LMGT3,
        basée sur la version la plus récente de chaque constructeur.
        """
        self.log("--- ANALYSE DYNAMIQUE SPÉCIFIQUE LMGT3 ---")
        car = self.current_car_model

        # 1. FORD MUSTANG LMGT3 EVO (V8, Front Engine)
        if "Mustang" in car:
            if 'TireTempRL_M' in df.columns and 'TireTempRR_M' in df.columns:
                max_rear_temp = max(df['TireTempRL_M'].max(), df['TireTempRR_M'].max())
                if max_rear_temp > 95.0:
                    self.log("Diagnostic (Mustang) : Ton V8 détruit les gommes arrière en sortie de courbe lente.")
                    self.log("Action : Assouplissement de la barre anti-roulis (ARB) arrière pour laisser la voiture s'asseoir sur ses gommes.")
                    self.sm.modify_parameter('Chassis', 'RearAntiSway', delta=-1.0)

        # 2. PORSCHE 911 LMGT3 R 2026 (Flat-6, Rear Engine)
        elif "911" in car or "Porsche" in car:
            if 'TopSpeed' in df.columns:
                self.log("Diagnostic (Porsche 911) : Profite du moteur en porte-à-faux arrière. Tu as une motricité absolue.")
                self.log("Conseil : Si l'arrière est fuyant au freinage, augmente l'aileron arrière, la VMax sera peu impactée par rapport aux autres.")

        # 3. LAMBORGHINI HURACÁN LMGT3 EVO 2 (V10, Mid Engine)
        elif "Huracan" in car or "Huracán" in car or "Lamborghini" in car:
            if 'SteeringAngle' in df.columns and 'Throttle' in df.columns:
                heavy_steering = df[df['SteeringAngle'] > 60]
                if not heavy_steering.empty and heavy_steering['Throttle'].mean() > 40:
                    self.log("Diagnostic (Huracán) : Sous-virage naturel détecté au point de corde sous légère accélération.")
                    self.log("Action : Réduction de l'angle de rampe de puissance du différentiel (Power Ramp Angle) pour forcer la rotation.")
                    self.sm.modify_parameter('Drivetrain', 'PowerRampAngle', delta=-5.0)

        # 4. ASTON MARTIN VANTAGE AMR LMGT3 EVO (Front-Engine V8)
        elif "Vantage" in car or "Aston" in car:
            if 'LatAccel' in df.columns:
                if df['LatAccel'].max() < 1.3:
                    self.log("Diagnostic (Vantage) : Plateforme stable mais paresseuse à l'inscription (manque de turn-in).")
                    self.log("Action : Augmentation du pincement négatif (Toe-out) à l'avant pour un train avant plus incisif.")
                    self.sm.modify_parameter('Chassis', 'FrontToeIn', delta=-0.05)

        # 5. BMW M4 LMGT3 EVO (Straight-6, Front Engine)
        elif "M4" in car or "BMW" in car:
            if 'SteeringAngle' in df.columns and 'Speed' in df.columns:
                slow_corners = df[(df['Speed'] < 100) & (df['SteeringAngle'] > 70)]
                if not slow_corners.empty:
                    self.log("Diagnostic (BMW M4) : Empattement long, la voiture peine à pivoter dans les épingles.")
                    self.log("Action : Augmentation de la hauteur de caisse arrière (Rake) pour déplacer le centre de pression vers l'avant.")
                    self.sm.modify_parameter('Aero', 'RearRideHeight', delta=+2.0)

        # 6. CHEVROLET CORVETTE Z06 LMGT3.R (Mid-Engine V8)
        elif "Corvette" in car or "Z06" in car:
            if 'WheelSlipRL' in df.columns and 'Throttle' in df.columns:
                heavy_throttle = df[df['Throttle'] > 80]
                if not heavy_throttle.empty and heavy_throttle['WheelSlipRL'].max() > 0.1:
                    self.log("Diagnostic (Corvette) : L'arrière décroche brutalement (snap oversteer) à la reprise des gaz.")
                    self.log("Action : Durcissement de la détente lente (Slow Rebound) arrière pour ralentir le transfert de masse latéral.")
                    self.sm.modify_parameter('Suspension', 'RearSlowRebound', delta=+1.0)

        # 7. FERRARI 296 LMGT3 EVO (Mid-Engine V6 Turbo)
        elif "296" in car or "Ferrari" in car:
            if 'RideHeightFront' in df.columns:
                if df['RideHeightFront'].min() < 0.15:
                    self.log("Diagnostic (Ferrari 296) : Très sensible au fond plat. L'aéro décroche si tu frottes trop fort.")
                    self.log("Action : Durcissement des butées avant (Front Packers) pour stabiliser la plateforme aéro.")
                    self.sm.modify_parameter('Suspension', 'FrontPackers', delta=+1.0)

        # 8. LEXUS RC F LMGT3 (Front-Engine V8)
        elif "Lexus" in car or "RC F" in car:
            if 'TopSpeed' in df.columns:
                self.log("Diagnostic (Lexus) : Forte traînée aéro, déficit de VMax en ligne droite.")
                self.log("Conseil : Privilégie un appui aéro réduit (aileron plus plat). Le grip mécanique natif de la Lexus compensera en courbe.")
                self.sm.modify_parameter('Aero', 'RearWingSetting', delta=-1.0)

        # 9. MCLAREN 720S LMGT3 EVO (Mid-Engine V8 Turbo)
        elif "720S" in car or "McLaren" in car:
            if 'SuspensionVelocityFL' in df.columns:
                if df['SuspensionVelocityFL'].max() > 0.3:
                    self.log("Diagnostic (McLaren) : Châssis très rigide, tu perds le contact sur les gros vibreurs.")
                    self.log("Action : Assouplissement de la compression lente et rapide (Bump) pour mieux absorber les chocs.")
                    self.sm.modify_parameter('Suspension', 'FrontFastBump', delta=-1.0)

        # 10. MERCEDES-AMG LMGT3 (Front-Mid Engine V8)
        elif "AMG" in car or "Mercedes" in car:
            if 'SteeringAngle' in df.columns and 'Speed' in df.columns:
                fast_sweepers = df[(df['Speed'] > 180) & (df['SteeringAngle'] > 45)]
                if not fast_sweepers.empty:
                    self.log("Diagnostic (Mercedes-AMG) : Tendance au sous-virage aérodynamique dans les courbes rapides.")
                    self.log("Action : Ajout d'appui aéro sur le train avant (ou baisse de la hauteur de caisse avant).")
                    self.sm.modify_parameter('Aero', 'FrontRideHeight', delta=-1.0)

        # RÈGLE GÉNÉRALE LMGT3 (Inertie & Trailbraking)
        if 'Brake' in df.columns and 'Throttle' in df.columns and 'LatAccel' in df.columns:
            coasting = df[(df['Brake'] == 0) & (df['Throttle'] == 0) & (abs(df['LatAccel']) > 1.0)]
            if len(coasting) > 20: 
                self.log("Conseil Pilotage (LMGT3) : Tu as des phases de 'coasting' (roue libre) trop longues en courbe.")
                self.log("Explication : L'inertie de la GT3 déleste violemment l'arrière. Assure une transition millimétrée entre le relâchement du frein (Trailbraking) et la reprise des gaz au point de corde.")

    def _analyze_hypercar_specifics(self, df):
        """
        Analyse comportementale ciblée pour la catégorie Reine (LMH / LMDh),
        intègre le déploiement hybride et les spécificités structurelles de 2026.
        """
        self.log("--- ANALYSE DYNAMIQUE SPÉCIFIQUE HYPERCAR ---")
        car = self.current_car_model

        # 1. PEUGEOT 9X8 (Différenciation Wingless 2023 vs Winged 2024)
        if "9X8" in car:
            if "2023" in car:
                self.log("Diagnostic (9X8 2023 Wingless) : Tout ton appui provient du fond plat. Le talon d'Achille est le sous-virage à haute vitesse.")
                self.log("Action : Le Rake (assiette plongeante) doit être maximal. Baisse l'avant et remonte l'arrière pour activer le diffuseur géant.")
                self.sm.modify_parameter('Aero', 'RearRideHeight', delta=+2.0)
            else:
                self.log("Diagnostic (9X8 2024 Winged) : Centre de pression reculé grâce à l'aileron. La voiture a perdu en rotation lente.")
                self.log("Action : Assouplissement de la barre anti-roulis (ARB) avant pour redonner du pouvoir directionnel dans les épingles.")
                self.sm.modify_parameter('Chassis', 'FrontAntiSway', delta=-1.0)

        # 2. LMH FRONT-MGU (Traction intégrale à haute vitesse)
        # S'applique à Toyota (GR010/TR010), Ferrari 499P, Isotta
        elif any(m in car for m in ["GR010", "TR010", "499P", "Tipo 6"]):
            if 'Speed' in df.columns and 'LatAccel' in df.columns and 'SteeringAngle' in df.columns:
                # Détection du "Traction Steer" quand le MGU avant s'active (autour de 190 km/h)
                mgu_deploy_zones = df[(df['Speed'] > 185) & (df['Speed'] < 200) & (abs(df['LatAccel']) > 1.2)]
                if not mgu_deploy_zones.empty and mgu_deploy_zones['SteeringAngle'].var() > 10:
                    self.log(f"Diagnostic ({car}) : Instabilité directionnelle détectée lors de l'activation du MGU avant (~190 km/h).")
                    self.log("Conseil Pilotage : L'électrification du train avant génère un 'Traction Steer' brutal. Ouvre légèrement ton angle de volant juste avant les 190 km/h en sortie de courbe rapide.")

        # 3. LMDh REAR-MGU (Propulsion hybride brutale)
        # S'applique à Porsche, Cadillac, BMW, Alpine, Lambo, Genesis
        elif any(m in car for m in ["963", "V-Series.R", "Cadillac", "Hybrid V8", "A424", "SC63", "GMR-001"]):
            if 'WheelSlipRL' in df.columns and 'Throttle' in df.columns:
                # Contrairement aux LMH, le MGU LMDh s'active à 0 km/h. Risque massif de patinage en 1ère/2ème.
                power_oversteer = df[(df['Throttle'] > 70) & (df['Speed'] < 120) & (df['WheelSlipRL'] > 0.08)]
                if not power_oversteer.empty:
                    self.log(f"Diagnostic ({car}) : Sur-couple du MGU arrière détecté en sortie de courbe lente.")
                    self.log("Action : Durcissement des ressorts arrière (Springs) pour mieux asseoir la puissance électrique au sol.")
                    self.sm.modify_parameter('Suspension', 'RearSpringRate', delta=+1.0)
            
            # Quirk spécifique : Châssis Dallara (Cadillac / BMW) très rigides
            if any(m in car for m in ["Cadillac", "V-Series.R", "Hybrid V8"]):
                if df['RideHeightFront'].min() < 0.15:
                    self.log("Diagnostic (Châssis Dallara) : La rigidité structurelle te fait rebondir de manière punitive sur les vibreurs.")
                    self.log("Action : Assouplissement extrême de l'hydraulique en compression rapide (Fast Bump).")
                    self.sm.modify_parameter('Dampers', 'FrontFastBump', delta=-2.0)

        # 4. LMH NON-HYBRID (100% Thermique et Freinage Mécanique)
        # S'applique à Valkyrie, Glickenhaus, Vanwall
        elif any(m in car for m in ["Valkyrie", "SCG 007", "Vandervell"]):
            self.log(f"Diagnostic ({car}) : Aucune régénération MGU pour t'aider au freinage. Tes disques en carbone encaissent 100% de l'inertie.")
            if 'BrakeTempFL' in df.columns:
                max_brake_temp = df['BrakeTempFL'].max()
                if max_brake_temp > 600:
                    self.log("Action (Urgent) : Surchauffe critique des freins détectée. Ouverture maximale des écopes de freins (Brake Ducts) requise.")
                    self.sm.modify_parameter('Brakes', 'FrontBrakeDuct', delta=+2.0)
                else:
                    self.log("Conseil Pilotage : Abuse du 'Trailbraking' (Freinage dégressif). Tu n'as pas de moteur avant lourd, le nez est vif si tu gardes du frein jusqu'à l'Apex.")

    def _analyze_lmp3_specifics(self, df):
        """
        Analyse comportementale ciblée pour la catégorie LMP3.
        Focus absolu sur l'absence d'ABS et l'équilibre mécanique des 4 châssis.
        """
        self.log("--- ANALYSE DYNAMIQUE SPÉCIFIQUE LMP3 ---")
        car = self.current_car_model

        # 1. RÈGLE GÉNÉRALE LMP3 : GESTION DE L'ABSENCE D'ABS
        if 'Brake' in df.columns and 'WheelSpeedFL' in df.columns and 'TopSpeed' in df.columns:
            # Détection de roues bloquées : Vitesse voiture > 80km/h mais rotation roue avant < 10km/h
            front_lockups = df[(df['TopSpeed'] > 80) & (df['Brake'] > 70) & (df['WheelSpeedFL'] < 10)]
            if len(front_lockups) > 5:
                self.log("🚨 ALERTE PILOTAGE (LMP3) : Tu bloques violemment les roues avant au freinage (Aucun ABS pour te sauver).")
                self.log("Action : L'IA recule la répartition de freinage (Brake Bias) vers l'arrière pour protéger tes pneus d'un 'Flat Spot'.")
                self.sm.modify_parameter('Brakes', 'BrakeBias', delta=-1.5)

        # 2. GINETTA G61-LT-P3 : Le châssis survireur
        if "Ginetta" in car or "G61" in car:
            if 'YawRate' in df.columns and 'Brake' in df.columns:
                # Détection d'instabilité du train arrière en entrée de courbe (Trailbraking)
                trailbrake_oversteer = df[(df['Brake'] > 5) & (df['Brake'] < 40) & (abs(df['YawRate']) > 45)]
                if not trailbrake_oversteer.empty:
                    self.log("Diagnostic (Ginetta) : Le train arrière est trop mobile au relâchement du frein.")
                    self.log("Action : Augmentation de la barre anti-roulis arrière (Rear ARB) pour stabiliser la plateforme en entrée de virage.")
                    self.sm.modify_parameter('Chassis', 'RearAntiSway', delta=+1.0)

        # 3. LIGIER JS P325 : Le châssis sous-vireur à basse vitesse
        elif "Ligier" in car or "P325" in car:
            if 'Speed' in df.columns and 'SteeringAngle' in df.columns:
                slow_understeer = df[(df['Speed'] < 110) & (df['SteeringAngle'] > 80)]
                if not slow_understeer.empty:
                    self.log("Diagnostic (Ligier) : Excellente aéro, mais le châssis refuse de pivoter à basse vitesse.")
                    self.log("Action : Assouplissement des ressorts avant (Front Springs) pour forcer le nez à s'inscrire.")
                    self.sm.modify_parameter('Suspension', 'FrontSpringRate', delta=-1.0)

        # 4. DUQUEINE D09 : La référence équilibrée
        elif "Duqueine" in car or "D09" in car:
            if 'TopSpeed' in df.columns:
                self.log("Diagnostic (Duqueine) : Plateforme naturellement très neutre et saine.")
                self.log("Conseil : Si tu manques de rotation, n'hésite pas à adoucir l'angle du différentiel (Power Ramp Angle), le châssis l'encaissera parfaitement.")

        # 5. ADESS AD25 : Le déficit de charge
        elif "Adess" in car or "AD25" in car:
            if 'TopSpeed' in df.columns:
                self.log("Diagnostic (Adess) : Le châssis accuse un léger déficit aérodynamique global.")
                self.log("Action : Baisse drastique de l'aileron arrière pour compenser le manque de grip par une VMax agressive.")
                self.sm.modify_parameter('Aero', 'RearWingSetting', delta=-2.0, limit_min=1.0)

    def _analyze_lmp2_specifics(self, df):
        """
        Analyse comportementale ciblée pour la catégorie LMP2 (Oreca 07).
        La LMP2 dépend intégralement de son appui aérodynamique (Downforce) et du Rake.
        """
        self.log("--- ANALYSE DYNAMIQUE SPÉCIFIQUE LMP2 (ORECA 07) ---")

        # 1. OPTIMISATION DU DIFFUSEUR (RAKE)
        if 'RideHeightFront' in df.columns and 'RideHeightRear' in df.columns and 'TopSpeed' in df.columns:
            # On vérifie la posture de la voiture à pleine charge aéro (> 220 km/h)
            high_speed = df[df['TopSpeed'] > 220]
            if not high_speed.empty:
                avg_front_rh = high_speed['RideHeightFront'].mean()
                avg_rear_rh = high_speed['RideHeightRear'].mean()
                
                # Si l'arrière s'écrase trop (perte du Rake) à haute vitesse, l'extracteur "décroche"
                if (avg_rear_rh - avg_front_rh) < 0.010: # Moins de 10mm de Rake en appui
                    self.log("Diagnostic (Oreca 07) : Ton train arrière s'écrase trop à haute vitesse. Tu perds l'effet de sol (Stall).")
                    self.log("Action : Augmentation de la hauteur de caisse statique à l'arrière ou durcissement du 3ème ressort (Third Spring).")
                    self.sm.modify_parameter('Aero', 'RearRideHeight', delta=+2.0)

        # 2. PROTECTION DES PNEUS EN APPUI LATÉRAL (BARRES ANTI-ROULIS)
        if 'TireTempFL_O' in df.columns and 'TireTempFR_O' in df.columns and 'LatAccel' in df.columns:
            # La LMP2 passe si vite en courbe qu'elle peut détruire l'extérieur du pneu en appui
            heavy_lateral = df[abs(df['LatAccel']) > 2.0]
            if not heavy_lateral.empty:
                temp_fl_out = heavy_lateral['TireTempFL_O'].mean()
                temp_fr_out = heavy_lateral['TireTempFR_O'].mean()
                
                if max(temp_fl_out, temp_fr_out) > 100.0:
                    self.log("Diagnostic (Oreca 07) : La carcasse extérieure de tes pneus avant surchauffe dans les courbes rapides.")
                    self.log("Action : Assouplissement de la barre anti-roulis avant (Front ARB) pour réduire la force latérale transférée au pneu extérieur.")
                    self.sm.modify_parameter('Chassis', 'FrontAntiSway', delta=-2.0)

        # 3. CONSEIL PILOTAGE (AÉRO)
        if 'Brake' in df.columns and 'LatAccel' in df.columns:
            self.log("Conseil Pilotage (LMP2) : Fais confiance à l'aérodynamique. La voiture a plus de grip à 200 km/h qu'à 80 km/h. Évite de sur-freiner à l'entrée des courbes rapides.")

    def _analyze_gte_specifics(self, df):
        """
        Analyse comportementale ciblée pour la catégorie GTE.
        Focus sur l'absence d'ABS (Threshold Braking) et l'aérodynamique avancée.
        """
        self.log("--- ANALYSE DYNAMIQUE SPÉCIFIQUE GTE ---")
        car = self.current_car_model

        # 1. RÈGLE GÉNÉRALE GTE : CONTRÔLE DU BLOCAGE (NO ABS)
        if 'Brake' in df.columns and 'WheelSpeedFL' in df.columns and 'TopSpeed' in df.columns:
            # GTE = 0 ABS. On traque les blocages de roues avant.
            front_lockups = df[(df['TopSpeed'] > 100) & (df['Brake'] > 75) & (df['WheelSpeedFL'] < 20)]
            if len(front_lockups) > 3:
                self.log("🚨 ALERTE FREINAGE (GTE) : Tu attaques la pédale de frein trop fort. Aucun ABS ne te protège, tes roues avant bloquent.")
                self.log("Action : Recul immédiat de la répartition de freinage (Brake Bias) vers l'arrière pour protéger tes pneus.")
                self.sm.modify_parameter('Brakes', 'BrakeBias', delta=-1.0)
            
            # Analyse de la courbe de freinage (Threshold Braking)
            hard_braking = df[df['Brake'] > 90]
            if not hard_braking.empty and hard_braking['Brake'].mean() > 95:
                self.log("Conseil Pilotage : N'écrase pas la pédale à 100% en GTE. Trouve le seuil d'adhérence (Threshold) autour de 85-90% de pression max.")

        # 2. PORSCHE 911 RSR-19 (Mid-Engine)
        if "RSR" in car or "911 RSR" in car:
            if 'RideHeightFront' in df.columns and 'RideHeightRear' in df.columns:
                avg_front = df['RideHeightFront'].mean()
                avg_rear = df['RideHeightRear'].mean()
                if (avg_rear - avg_front) < 0.015:
                    self.log("Diagnostic (911 RSR) : Ton Rake est trop plat. Le diffuseur géant de la RSR n'est pas nourri en air.")
                    self.log("Action : Augmentation de la hauteur de caisse arrière pour créer plus d'appui aérodynamique.")
                    self.sm.modify_parameter('Aero', 'RearRideHeight', delta=+2.0)

        # 3. FERRARI 488 GTE EVO (V8 Turbo)
        elif "488" in car or "Ferrari" in car:
            if 'WheelSlipRL' in df.columns and 'SteeringAngle' in df.columns:
                snap_oversteer = df[(df['WheelSlipRL'] > 0.15) & (abs(df['SteeringAngle']) > 30)]
                if not snap_oversteer.empty:
                    self.log("Diagnostic (488 GTE) : Survirage brutal détecté (Snap Oversteer) en courbe rapide.")
                    self.log("Action : Assouplissement de la barre anti-roulis arrière (Rear ARB) pour calmer le train arrière à la limite.")
                    self.sm.modify_parameter('Chassis', 'RearAntiSway', delta=-2.0)

        # 4. CHEVROLET CORVETTE C8.R (Mid-Engine V8)
        elif "C8.R" in car or "Corvette" in car:
            if 'SuspensionVelocityFL' in df.columns:
                kerb_strikes = df[df['SuspensionVelocityFL'] > 0.4]
                if not kerb_strikes.empty:
                    self.log("Diagnostic (C8.R) : La rigidité du châssis américain encaisse très mal ces vibreurs. Tu perds le grip mécanique.")
                    self.log("Action : Ouverture radicale de la compression rapide (Fast Bump) pour absorber les chocs.")
                    self.sm.modify_parameter('Dampers', 'FrontFastBump', delta=-2.0)

        # 5. ASTON MARTIN VANTAGE GTE (Front-Engine V8 Turbo)
        elif "Vantage GTE" in car or "Aston" in car:
            if 'TireTempRL_M' in df.columns and 'Throttle' in df.columns:
                if df['TireTempRL_M'].max() > 95.0:
                    self.log("Diagnostic (Vantage GTE) : Le couple du V8 avant surchauffe les gommes arrière à la relance.")
                    self.log("Action : Durcissement du différentiel à l'accélération (Power) pour éviter qu'une roue ne patine dans le vide.")
                    self.sm.modify_parameter('Drivetrain', 'Power', delta=+5.0)

    def _analyze_track_specifics(self, track_name, df):
        """
        Analyse croisée entre la télémétrie et la topologie spécifique du circuit.
        Applique les philosophies aéro et mécaniques dictées par l'ingénierie WEC.
        """
        self.log(f"--- ANALYSE TOPOGRAPHIQUE ({track_name}) ---")
        track_lower = track_name.lower()

        # 1. CIRCUITS À TRÈS FAIBLE TRAÎNÉE (Le Mans, Monza, Daytona)
        if any(t.lower() in track_lower for t in self.track_database['low_drag']):
            self.log("Diagnostic Piste : Circuit à très faible traînée (Low Drag). Priorité absolue à la VMax.")
            
            # Aplani le Rake (Baisser l'arrière) pour cacher le diffuseur
            self.sm.modify_parameter('Aero', 'RearRideHeight', delta=-2.0)
            self.sm.modify_parameter('Aero', 'RearWingSetting', delta=-2.0, limit_min=1.0)
            
            # Pincement (Toe) proche de zéro pour réduire la friction
            self.sm.modify_parameter('Chassis', 'RearToeIn', delta=-0.05)
            self.sm.modify_parameter('Chassis', 'FrontToeIn', delta=+0.05)

            if "daytona" in track_lower:
                self.log("Action (Roval) : Asymétrie pour le banking. Durcissement des ressorts droits.")
                self.sm.modify_parameter('Suspension', 'FrontRightSpringRate', delta=+2.0)
                self.sm.modify_parameter('Suspension', 'RearRightSpringRate', delta=+2.0)

        # 2. CIRCUITS TRÈS BOSSELÉS ET ATYPIQUES (Sebring, Imola)
        elif any(t.lower() in track_lower for t in self.track_database['bumpy']):
            self.log("Diagnostic Piste : Surface très bosselée / Vibreurs agressifs détectés.")
            
            if "sebring" in track_lower:
                self.log("Action (Sebring) : Rehaussement de la caisse pour éviter le talonnage destructeur sur les plaques de béton.")
                self.sm.modify_parameter('Aero', 'FrontRideHeight', delta=+2.0)
                self.sm.modify_parameter('Aero', 'RearRideHeight', delta=+2.0)
                self.log("Action : Assouplissement du rebond arrière (Rebound) pour garder les roues collées au sol.")
                self.sm.modify_parameter('Dampers', 'RearSlowRebound', delta=-2.0)
            
            elif "imola" in track_lower:
                self.log("Action (Imola) : Assouplissement des ressorts pour avaler les hauts vibreurs de la Variante Alta.")
                self.sm.modify_parameter('Suspension', 'FrontSpringRate', delta=-1.0)
                self.sm.modify_parameter('Suspension', 'RearSpringRate', delta=-1.0)

        # 3. CIRCUITS TECHNIQUES ET ABRASIFS (Bahreïn, Portimão, Barcelone)
        elif any(t.lower() in track_lower for t in self.track_database['technical_abrasive']):
            self.log("Diagnostic Piste : Tracé technique avec freinage en appui et forte dégradation des pneus.")
            
            if "bahrain" in track_lower or "bahreïn" in track_lower:
                self.log("Action (Bahreïn) : Tueur de pneus arrière (T9-T10). Déplacement de la répartition de freinage vers l'avant et libération du différentiel en décélération.")
                self.sm.modify_parameter('Brakes', 'BrakeBias', delta=+1.0)
                self.sm.modify_parameter('Drivetrain', 'Coast', delta=-2.0)
            
            elif "portimao" in track_lower or "algarve" in track_lower:
                self.log("Action (Portimão) : Dénivelés aveugles. Assouplissement de la compression hydraulique avant pour mordre dans les pentes.")
                self.sm.modify_parameter('Dampers', 'FrontSlowBump', delta=-1.0)
                self.sm.modify_parameter('Dampers', 'FrontFastBump', delta=-1.0)
            
            elif "barcelona" in track_lower or "catalunya" in track_lower:
                self.log("Action (Barcelone) : Le long T3 détruit le pneu avant gauche. Réduction du carrossage négatif (Camber) AVG et augmentation de l'appui global.")
                self.sm.modify_parameter('Suspension', 'FrontLeftCamber', delta=+0.5)
                self.sm.modify_parameter('Aero', 'FrontWingSetting', delta=+1.0)
                self.sm.modify_parameter('Aero', 'RearWingSetting', delta=+1.0)

        # 4. CIRCUITS FLUIDES À HAUTE VITESSE (Spa, COTA, Paul Ricard, Silverstone)
        elif any(t.lower() in track_lower for t in self.track_database['high_speed_flow']):
            self.log("Diagnostic Piste : Profil fluide à très haute force G latérale. Compromis aéro nécessaire.")
            
            if "spa" in track_lower:
                self.log("Action (Spa) : Durcissement de la suspension avant pour éviter de s'écraser (Bottom out) dans la compression de l'Eau Rouge.")
                self.sm.modify_parameter('Suspension', 'FrontSpringRate', delta=+2.0)
                self.sm.modify_parameter('Aero', 'RearWingSetting', delta=-1.0) # Aileron modéré pour Kemmel
            
            elif "cota" in track_lower or "americas" in track_lower:
                self.log("Action (COTA) : Réglage de grand compromis. ARB avant très rigide pour les Esses (S1), ARB arrière souple pour la motricité (S3).")
                self.sm.modify_parameter('Chassis', 'FrontAntiSway', delta=+2.0)
                self.sm.modify_parameter('Chassis', 'RearAntiSway', delta=-1.0)
            
            elif "paul ricard" in track_lower:
                self.log("Action (Paul Ricard) : Verrouillage de l'essieu arrière à haute vitesse pour sécuriser l'entrée de Signes.")
                self.sm.modify_parameter('Drivetrain', 'Preload', delta=+2.0)
            
            elif "silverstone" in track_lower or "lusail" in track_lower:
                self.log("Action (Silverstone / Lusail) : High Downforce. Augmentation drastique du Rake et des carrossages négatifs pour l'énorme force G latérale.")
                self.sm.modify_parameter('Aero', 'RearRideHeight', delta=+3.0)
                self.sm.modify_parameter('Suspension', 'FrontLeftCamber', delta=-0.5)
                self.sm.modify_parameter('Suspension', 'FrontRightCamber', delta=-0.5)