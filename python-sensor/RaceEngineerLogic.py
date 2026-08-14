import pandas as pd
import numpy as np
import scipy.fftpack

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
            circuit = "Unknown"
            self._adapt_setup_to_session_format(race_duration_minutes=40)

        # 2. Analyse Châssis Standard
        avg_data = df_telemetry.mean()
        self._analyze_mechanical_balance(df_telemetry)
        self._analyze_driver_traces(df_telemetry)
        self._analyze_braking_and_slip_ratio(df_telemetry) # Remplacement par la version avec Slip Ratio
        self._analyze_tire_temperatures(avg_data)
        self._analyze_aero_platform(avg_data, df_telemetry)
        self._analyze_dampers(df_telemetry)
        self._analyze_differential(df_telemetry)
        self._analyze_gearbox(df_telemetry)
        self._analyze_driver_plateau(df_telemetry, current_position=5, target_position=1)
        self._analyze_hybrid_deployment(df_telemetry)
        self._analyze_wear_and_damage(df_telemetry)
        self._analyze_electronics(df_telemetry)
        self._optimize_cold_pressures(df_telemetry, session_context)
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
        MODÈLE MATHÉMATIQUE 1 : Le Cercle de Friction (Traction Circle).
        Vérifie si le pilote sature l'enveloppe d'adhérence combinée du pneu.
        """
        if 'LatAccel' in df.columns and 'LongAccel' in df.columns and 'SteeringAngle' in df.columns:
            # Calcul du vecteur G combiné (Théorème de Pythagore sur les forces)
            df['G_Combined'] = np.sqrt(df['LatAccel']**2 + df['LongAccel']**2)
            
            max_g_comb = df['G_Combined'].max()
            max_steer = df['SteeringAngle'].max()
            
            self.log(f"📊 Donnée Physique : Pic de G-Force combinée = {max_g_comb:.2f} G")
            
            # Détection de Sous-Virage (Understeer) : Fort angle de volant, mais faible force G latérale
            # Le train avant sature et glisse au lieu de tourner.
            if max_steer > 80 and df['LatAccel'].max() < (max_g_comb * 0.85):
                self.log("Diagnostic Cinématique : Sous-virage terminal détecté (Angle de glissement avant saturé).")
                self.log("Action : Assouplissement de la barre anti-roulis avant (Front ARB) pour augmenter l'adhérence mécanique.")
                self.sm.modify_parameter('SUSPENSION', 'FrontAntiSwaySetting', delta=-1)
            
            # Détection de Sur-Virage (Oversteer) au freinage (Trailbraking)
            elif 'YawRate' in df.columns:
                trailbraking_zones = df[(df['Brake'] > 5) & (df['Brake'] < 50)]
                if not trailbraking_zones.empty and trailbraking_zones['YawRate'].max() > 45:
                    self.log("Diagnostic Cinématique : Taux de lacet (Yaw) excessif en phase de Trailbraking.")
                    self.log("Action : Le train arrière s'allège trop vite. Durcissement de la détente lente arrière (Rear Slow Rebound).")
                    self.sm.modify_parameter('REARLEFT', 'SlowReboundSetting', delta=+1)
                    self.sm.modify_parameter('REARRIGHT', 'SlowReboundSetting', delta=+1)

    def _analyze_braking_and_slip_ratio(self, df):
        """MODÈLE MATHÉMATIQUE 2 : Slip Ratio et Phases de Coasting"""
        # 1. Analyse du Coasting (Roue libre = Déficit cinétique)
        if 'Brake' in df.columns and 'Throttle' in df.columns and 'LatAccel' in df.columns:
            coasting = df[(df['Brake'] == 0) & (df['Throttle'] == 0) & (abs(df['LatAccel']) > 1.0)]
            if len(coasting) > 20: 
                self.log("Conseil Pilotage : Phases de 'coasting' (roue libre) prolongées détectées en courbe.")
                self.log("Explication (Audit) : Transition trop lente entre freinage et accélération. Déficit cinétique à l'apex.")

        # 2. Analyse du Slip Ratio (Taux de Glissement au freinage)
        if 'WheelSpeedFL' in df.columns and 'TopSpeed' in df.columns and 'Brake' in df.columns:
            heavy_braking = df[(df['Brake'] > 80) & (df['TopSpeed'] > 100)].copy()
            
            if not heavy_braking.empty:
                heavy_braking['SlipRatioFL'] = (heavy_braking['WheelSpeedFL'] - heavy_braking['TopSpeed']) / heavy_braking['TopSpeed'].clip(lower=1.0)
                min_slip_fl = heavy_braking['SlipRatioFL'].min() 
                avg_slip_fl = heavy_braking['SlipRatioFL'].mean()
                
                self.log(f"📊 Pilotage : Glissement max au freinage (Roue AVG) = {min_slip_fl*100:.1f}%")

                if min_slip_fl < -0.25:
                    self.log("Diagnostic : Micro-blocages destructeurs (Lock-ups) détectés à l'avant.")
                    self.log("Action : Recul de la répartition de freinage vers l'arrière (+1 Index Rear Brake).")
                    self.sm.modify_parameter('CONTROLS', 'RearBrakeSetting', delta=+1)
                elif avg_slip_fl > -0.05:
                    self.log("Diagnostic Pilotage : Sous-exploitation du grip au freinage (Roues synchronisées avec la piste).")
                    self.log("Conseil : Tu peux freiner 15 à 20 mètres plus tard sans bloquer.")

    def _analyze_driver_traces(self, df):
        """
        MODÈLE MATHÉMATIQUE 5 : Qualité du signal pilote (Sawtooth & Zig-Zags).
        Identifie la sur-conduite et les corrections erratiques comme exigé par l'Audit.
        """
        if 'Throttle' in df.columns:
            # Dérivée de la pression sur l'accélérateur
            throttle_diff = np.diff(df['Throttle'])
            # Détection des changements de signe (pédale qui fait on/off/on)
            zero_crossings = np.where(np.diff(np.sign(throttle_diff)))[0]
            
            # Si le pilote pompe l'accélérateur plus de 5% du temps
            if len(zero_crossings) > (len(df) * 0.05): 
                self.log("🚨 Analyse Traces : Motif en 'dents de scie' détecté sur l'accélérateur.")
                self.log("Conseil Pilotage : Patinage thermique induit. Lisse ton application des gaz en sortie de courbe.")

        if 'SteeringAngle' in df.columns:
            # Détection des zig-zags (corrections directionnelles multiples)
            steer_diff = np.diff(df['SteeringAngle'])
            steer_crossings = np.where(np.diff(np.sign(steer_diff)))[0]
            
            if len(steer_crossings) > (len(df) * 0.08): 
                self.log("🚨 Analyse Traces : Zig-zags erratiques détectés sur la direction.")
                self.log("Conseil Pilotage : Sur-conduite flagrante. Tes corrections brutales surchauffent la surface des pneus avant.")

    def _analyze_dampers(self, df):
        """
        MODÈLE MATHÉMATIQUE 3 : Histogrammes d'amortisseurs (Symétrie et Peakness).
        Répond à l'exigence stricte de l'audit (Intégration d'aire et écart-type).
        """
        susp_cols = ['SuspensionVelocityFL', 'SuspensionVelocityFR', 'SuspensionVelocityRL', 'SuspensionVelocityRR']
        if all(col in df.columns for col in susp_cols):
            for col in susp_cols:
                # Séparation des vitesses pour l'intégration mathématique
                bump_data = df[df[col] < 0][col] # Négatif = Compression
                rebound_data = df[df[col] > 0][col] # Positif = Détente
                
                # 1. ANALYSE DE SYMÉTRIE (Jacking up / Packing down via Intégrale de l'aire)
                bump_area = np.trapz(np.abs(bump_data)) if len(bump_data) > 1 else 1.0
                rebound_area = np.trapz(rebound_data) if len(rebound_data) > 1 else 1.0
                
                symmetry_ratio = bump_area / rebound_area if rebound_area > 0 else 1.0
                
                wheel_prefix = "FRONT" if "F" in col else "REAR"
                wheel_side = "LEFT" if "L" in col else "RIGHT"
                section = f"{wheel_prefix}{wheel_side}"
                
                if symmetry_ratio > 1.3:
                    self.log(f"Diagnostic Cinématique : La suspension {section} s'écrase (Packing down). L'aire de compression est trop large.")
                    self.sm.modify_parameter(section, 'SlowBumpSetting', delta=+1)
                elif symmetry_ratio < 0.7:
                    self.log(f"Diagnostic Cinématique : La suspension {section} se soulève (Jacking up). Détente trop rapide.")
                    self.sm.modify_parameter(section, 'SlowReboundSetting', delta=+1)

                # 2. ANALYSE DE LA FORME DU PIC (Peakness via Écart-type)
                std_dev = df[col].std()
                if std_dev > 0.08: # Courbe trop étalée = sous-amorti
                    self.log(f"Diagnostic Fréquentiel : Châssis flottant sur {section} (Sous-amorti).")
                    self.sm.modify_parameter(section, 'SlowBumpSetting', delta=+1)
                    self.sm.modify_parameter(section, 'SlowReboundSetting', delta=+1)
                elif std_dev > 0 and std_dev < 0.015: # Courbe trop pointue = sur-amorti
                    self.log(f"Diagnostic Fréquentiel : Châssis trop rigide sur {section} (Sur-amorti, perte de contact).")
                    self.sm.modify_parameter(section, 'FastBumpSetting', delta=-1)
                    self.sm.modify_parameter(section, 'FastReboundSetting', delta=-1)

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
                    self.sm.modify_parameter('DRIVELINE', 'DiffPreloadSetting', delta=+1)
                    
                # Cas B : La voiture refuse de tourner quand on remet les gaz (Sous-virage "on-throttle")
                elif slip_diff < 0.02 and heavy_throttle['SteeringAngle'].max() > 45:
                    self.log("Diagnostic : La voiture pousse tout droit à la réaccélération (Différentiel trop verrouillé).")
                    self.log("Action : Ouverture du différentiel (Augmentation du Power Ramp Angle).")
                    self.sm.modify_parameter('DRIVELINE', 'DiffPowerSetting', delta=-1)

    def _analyze_gearbox(self, df):
        """
        Analyse de l'étagement de la boîte de vitesses (Final Drive).
        Objectif : Optimiser l'accélération tout en atteignant la VMax en fin de ligne droite.
        """
        if 'EngineRPM' in df.columns and 'TimeAtLimiter' in df.columns:
            # Cas 1 : La voiture reste bloquée au rupteur en ligne droite (perte de vitesse)
            if df['TimeAtLimiter'].max() > 1.0: 
                self.log("Diagnostic : Le moteur sature au rupteur trop longtemps en ligne droite.")
                self.log("Action : Allongement du rapport final (Final Drive) pour augmenter la Vitesse de Pointe.")
                self.sm.modify_parameter('DRIVELINE', 'FinalDriveSetting', delta=+1)
                
            # Cas 2 : Le moteur s'essouffle et n'atteint pas son plein potentiel (estimation empirique)
            elif df['EngineRPM'].max() < 8100:
                self.log("Diagnostic : Le 6ème ou 7ème rapport est trop long, perte d'accélération.")
                self.log("Action : Raccourcissement du rapport final pour plus de nervosité et de reprise.")
                self.sm.modify_parameter('DRIVELINE', 'FinalDriveSetting', delta=-1)
                ()

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
            self.sm.modify_parameter('FRONTWING', 'FWSetting', delta=+1, limit_max=5)
            self.sm.modify_parameter('REARWING', 'RWSetting', delta=-1, limit_min=3)
            
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
            self.sm.modify_parameter('SUSPENSION', 'FrontAntiSwaySetting', delta=-1)
            self.sm.modify_parameter('SUSPENSION', 'RearAntiSwaySetting', delta=-1)
        
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
            self.sm.modify_parameter('BODYAERO', 'WaterRadiatorSetting', delta=-1, limit_min=2)
            self.sm.modify_parameter('BODYAERO', 'OilRadiatorSetting', delta=-1, limit_min=2)
            self.sm.modify_parameter('BODYAERO', 'BrakeDuctSetting', delta=-1, limit_min=1)
            
        # Format Endurance (> 60 minutes)
        else:
            self.log("Mode ENDURANCE activé : Priorité à la fiabilité et à la préservation du matériel.")
            self.log("Action : Ouverture du refroidissement (pour survivre dans le trafic) et sécurisation du fond plat.")
            self.sm.modify_parameter('BODYAERO', 'WaterRadiatorSetting', delta=+1, limit_max=5)
            self.sm.modify_parameter('BODYAERO', 'BrakeDuctSetting', delta=+1, limit_max=5)
            # On monte la caisse de 1mm pour éviter d'user la planche (Plank Wear) sur 6 heures de course
            self.sm.modify_parameter('FRONTLEFT', 'RideHeightSetting', delta=+1)
            self.sm.modify_parameter('FRONTRIGHT', 'RideHeightSetting', delta=+1)
            self.sm.modify_parameter('REARLEFT', 'RideHeightSetting', delta=+1)
            self.sm.modify_parameter('REARRIGHT', 'RideHeightSetting', delta=+1)

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
            # L'IA compense les dégâts en modifiant le setup
            self.sm.modify_parameter('FRONTWING', 'FWSetting', delta=+1)
            
        if 'TireWearFL' in df.columns:
            wear_fl = df['TireWearFL'].max()
            if wear_fl > 30.0:
                self.log(f"⚠️ Usure critique Pneu Avant Gauche : {wear_fl:.1f}%.")
                self.log("Action : Déplace la répartition de freinage (Brake Bias) vers l'arrière pour soulager l'avant sous peine de crevaison.")
                self.sm.modify_parameter('CONTROLS', 'RearBrakeSetting', delta=+1)

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
                self.sm.modify_parameter('CONTROLS', 'RearBrakeSetting', delta=+1)

        if 'UnfilteredThrottle' in df.columns and 'FilteredThrottle' in df.columns:
            # On vérifie si le TC coupe l'accélération en sortie de courbe
            tc_intervention = (df['UnfilteredThrottle'] - df['FilteredThrottle']).mean()
            
            if tc_intervention > 10.0:
                self.log("Diagnostic (Électronique) : Le Traction Control (TC) bride énormément tes sorties de courbe.")
                self.log("Action : Ton train arrière manque d'adhérence mécanique. Assouplis la barre anti-roulis arrière (Rear ARB) ou baisse le niveau de TC au volant.")
                self.sm.modify_parameter('SUSPENSION', 'RearAntiSwaySetting', delta=-1)

    def _optimize_cold_pressures(self, df, session_context):
        """
        MODÈLE MATHÉMATIQUE : Équation de Linéarité Centrale (M = (I+O)/2)
        Ajuste les pressions en fonction du bombement de la bande de roulement.
        """
        self.log("--- OPTIMISATION THERMODYNAMIQUE DES PNEUS ---")
        valid_laps = df[(df['Valid'] == 1) & (df['Lap'] > 1)]
        if valid_laps.empty:
            self.log("Pas assez de tours lancés valides pour calibrer les pressions avec précision.")
            return

        avg_data = valid_laps.mean()
        target_hot_pressure = 165.0 
        
        # Mathématique de l'Audit : 0.1 PSI (~0.69 kPa) par degré d'écart ambiant
        ambient_temp = session_context.get('AmbientTemp', 25.0) if session_context else 25.0
        weather_correction_kpa = -0.69 * (ambient_temp - 25.0)

        tires = {
            'TirePressFL': ('FRONTLEFT', 'PressureSetting', 'FL'),
            'TirePressFR': ('FRONTRIGHT', 'PressureSetting', 'FR'),
            'TirePressRL': ('REARLEFT', 'PressureSetting', 'RL'),
            'TirePressRR': ('REARRIGHT', 'PressureSetting', 'RR')
        }

        for telemetry_key, (section, key, corner) in tires.items():
            if telemetry_key in avg_data:
                actual_hot = avg_data[telemetry_key]
                
                # Équation de Linéarité Centrale tirée de l'audit
                col_I = f'TireTemp{corner}_I'
                col_M = f'TireTemp{corner}_M'
                col_O = f'TireTemp{corner}_O'
                
                linear_correction = 0
                if col_I in avg_data and col_M in avg_data and col_O in avg_data:
                    m_edges = (avg_data[col_I] + avg_data[col_O]) / 2.0
                    delta_center = avg_data[col_M] - m_edges
                    if delta_center > 2.0:
                        self.log(f"[{section}] Surpression centrale (+{delta_center:.1f}°C). Pneu bombé.")
                        linear_correction = -1.0 # Baisse de pression
                    elif delta_center < -2.0:
                        self.log(f"[{section}] Centre trop froid ({delta_center:.1f}°C). Pneu affaissé.")
                        linear_correction = +1.0 # Hausse de pression
                
                delta_to_target = (target_hot_pressure - actual_hot)
                total_correction_kpa = delta_to_target + weather_correction_kpa + linear_correction
                
                if abs(total_correction_kpa) > 0.5:
                    self.log(f"[{section}] Pression à chaud: {actual_hot:.1f} kPa. Cible {target_hot_pressure}. Correc: {total_correction_kpa:+.1f} kPa.")
                    self.sm.modify_parameter(section, key, delta=int(round(total_correction_kpa)))
                else:
                    self.log(f"[{section}] Pression optimale confirmée ({actual_hot:.1f} kPa).")

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
                self.log("Action : Augmentation de la hauteur de caisse avant.")
                self.sm.modify_parameter('FRONTLEFT', 'RideHeightSetting', delta=+1)
                self.sm.modify_parameter('FRONTRIGHT', 'RideHeightSetting', delta=+1)
                
            # Maintien de l'inclinaison (Rake) pour l'appui du diffuseur
            avg_rake = avg_data['RideHeightRear'] - avg_data['RideHeightFront']
            if avg_rake < 1.0:
                self.log("Diagnostic : La voiture est trop plate (manque de Rake). Le diffuseur perd de son efficacité.")
                self.sm.modify_parameter('REARLEFT', 'RideHeightSetting', delta=+1)
                self.sm.modify_parameter('REARRIGHT', 'RideHeightSetting', delta=+1)

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
                self.log("Action : Tu as trop de carrossage négatif. Réduction du Camber avant (+1 Index vers zéro).")
                self.sm.modify_parameter('FRONTLEFT', 'CamberSetting', delta=+1)
                self.sm.modify_parameter('FRONTRIGHT', 'CamberSetting', delta=+1)
            elif spread_front < 2.0:
                self.log(f"Diagnostic : L'extérieur du pneu avant chauffe trop (Delta: {spread_front:.1f}°C).")
                self.log("Action : Manque de carrossage négatif. Augmentation du Camber.")
                self.sm.modify_parameter('FRONTLEFT', 'CamberSetting', delta=-1) 
                self.sm.modify_parameter('FRONTRIGHT', 'CamberSetting', delta=-1)

        # Pneu Arrière Gauche (Exemple représentatif pour le train arrière)
        if 'TireTempRL_I' in avg_data and 'TireTempRL_O' in avg_data:
            temp_in_rl = avg_data['TireTempRL_I']
            temp_out_rl = avg_data['TireTempRL_O']
            spread_rear = temp_in_rl - temp_out_rl
            
            # L'arrière nécessite généralement moins de carrossage que l'avant pour maximiser la motricité
            if spread_rear > 8.0:
                self.log("Diagnostic : Trop de carrossage arrière. Perte de surface de contact à l'accélération.")
                self.sm.modify_parameter('REARLEFT', 'CamberSetting', delta=+1)
                self.sm.modify_parameter('REARRIGHT', 'CamberSetting', delta=+1)

    def _analyze_lmgt3_specifics(self, df):
        """
        Analyse comportementale ciblée pour l'ensemble du plateau LMGT3.
        """
        self.log("--- ANALYSE DYNAMIQUE SPÉCIFIQUE LMGT3 ---")
        car = self.current_car_model

        if "Mustang" in car:
            if 'TireTempRL_M' in df.columns and 'TireTempRR_M' in df.columns:
                max_rear_temp = max(df['TireTempRL_M'].max(), df['TireTempRR_M'].max())
                if max_rear_temp > 95.0:
                    self.log("Diagnostic (Mustang) : Ton V8 détruit les gommes arrière en sortie de courbe lente.")
                    self.log("Action : Assouplissement de la barre anti-roulis (ARB) arrière.")
                    self.sm.modify_parameter('SUSPENSION', 'RearAntiSwaySetting', delta=-1)

        elif "911" in car or "Porsche" in car:
            if 'TopSpeed' in df.columns:
                self.log("Diagnostic (Porsche 911) : Profite du moteur en porte-à-faux arrière. Tu as une motricité absolue.")
                self.log("Conseil : Si l'arrière est fuyant au freinage, augmente l'aileron arrière, la VMax sera peu impactée.")

        elif "Huracan" in car or "Huracán" in car or "Lamborghini" in car:
            if 'SteeringAngle' in df.columns and 'Throttle' in df.columns:
                heavy_steering = df[df['SteeringAngle'] > 60]
                if not heavy_steering.empty and heavy_steering['Throttle'].mean() > 40:
                    self.log("Diagnostic (Huracán) : Sous-virage naturel détecté au point de corde sous légère accélération.")
                    self.log("Action : Réduction de l'angle de rampe de puissance du différentiel (Power Ramp Angle).")
                    self.sm.modify_parameter('DRIVELINE', 'DiffPowerSetting', delta=-1)

        elif "Vantage" in car or "Aston" in car:
            if 'LatAccel' in df.columns:
                if df['LatAccel'].max() < 1.3:
                    self.log("Diagnostic (Vantage) : Plateforme stable mais paresseuse à l'inscription (manque de turn-in).")
                    self.log("Action : Augmentation du pincement négatif (Toe-out) à l'avant pour un train avant plus incisif.")
                    self.sm.modify_parameter('SUSPENSION', 'FrontToeInSetting', delta=-1)

        elif "M4" in car or "BMW" in car:
            if 'SteeringAngle' in df.columns and 'Speed' in df.columns:
                slow_corners = df[(df['Speed'] < 100) & (df['SteeringAngle'] > 70)]
                if not slow_corners.empty:
                    self.log("Diagnostic (BMW M4) : Empattement long, la voiture peine à pivoter dans les épingles.")
                    self.log("Action : Augmentation de la hauteur de caisse arrière (Rake) pour déplacer le centre de pression vers l'avant.")
                    self.sm.modify_parameter('REARLEFT', 'RideHeightSetting', delta=+1)
                    self.sm.modify_parameter('REARRIGHT', 'RideHeightSetting', delta=+1)

        elif "Corvette" in car or "Z06" in car:
            if 'WheelSlipRL' in df.columns and 'Throttle' in df.columns:
                heavy_throttle = df[df['Throttle'] > 80]
                if not heavy_throttle.empty and heavy_throttle['WheelSlipRL'].max() > 0.1:
                    self.log("Diagnostic (Corvette) : L'arrière décroche brutalement (snap oversteer) à la reprise des gaz.")
                    self.log("Action : Durcissement de la détente lente (Slow Rebound) arrière pour ralentir le transfert de masse latéral.")
                    self.sm.modify_parameter('REARLEFT', 'SlowReboundSetting', delta=+1)
                    self.sm.modify_parameter('REARRIGHT', 'SlowReboundSetting', delta=+1)

        elif "296" in car or "Ferrari" in car:
            if 'RideHeightFront' in df.columns:
                if df['RideHeightFront'].min() < 0.15:
                    self.log("Diagnostic (Ferrari 296) : Très sensible au fond plat. L'aéro décroche si tu frottes trop fort.")
                    self.log("Action : Durcissement des butées avant (Front Packers) pour stabiliser la plateforme aéro.")
                    self.sm.modify_parameter('FRONTLEFT', 'PackerSetting', delta=+1)
                    self.sm.modify_parameter('FRONTRIGHT', 'PackerSetting', delta=+1)

        elif "Lexus" in car or "RC F" in car:
            if 'TopSpeed' in df.columns:
                self.log("Diagnostic (Lexus) : Forte traînée aéro, déficit de VMax en ligne droite.")
                self.log("Conseil : Privilégie un appui aéro réduit (aileron plus plat).")
                self.sm.modify_parameter('REARWING', 'RWSetting', delta=-1)

        elif "720S" in car or "McLaren" in car:
            if 'SuspensionVelocityFL' in df.columns:
                if df['SuspensionVelocityFL'].max() > 0.3:
                    self.log("Diagnostic (McLaren) : Châssis très rigide, tu perds le contact sur les gros vibreurs.")
                    self.log("Action : Assouplissement de la compression lente et rapide (Bump) pour mieux absorber les chocs.")
                    self.sm.modify_parameter('FRONTLEFT', 'FastBumpSetting', delta=-1)
                    self.sm.modify_parameter('FRONTRIGHT', 'FastBumpSetting', delta=-1)

        elif "AMG" in car or "Mercedes" in car:
            if 'SteeringAngle' in df.columns and 'Speed' in df.columns:
                fast_sweepers = df[(df['Speed'] > 180) & (df['SteeringAngle'] > 45)]
                if not fast_sweepers.empty:
                    self.log("Diagnostic (Mercedes-AMG) : Tendance au sous-virage aérodynamique dans les courbes rapides.")
                    self.log("Action : Baisse de la hauteur de caisse avant.")
                    self.sm.modify_parameter('FRONTLEFT', 'RideHeightSetting', delta=-1)
                    self.sm.modify_parameter('FRONTRIGHT', 'RideHeightSetting', delta=-1)

        if 'Brake' in df.columns and 'Throttle' in df.columns and 'LatAccel' in df.columns:
            coasting = df[(df['Brake'] == 0) & (df['Throttle'] == 0) & (abs(df['LatAccel']) > 1.0)]
            if len(coasting) > 20: 
                self.log("Conseil Pilotage (LMGT3) : Tu as des phases de 'coasting' (roue libre) trop longues en courbe.")

    def _analyze_hypercar_specifics(self, df):
        """Analyse comportementale ciblée pour la catégorie Reine (LMH / LMDh)"""
        self.log("--- ANALYSE DYNAMIQUE SPÉCIFIQUE HYPERCAR ---")
        car = self.current_car_model

        if "9X8" in car:
            if "2023" in car:
                self.log("Action (9X8 2023 Wingless) : Le Rake (assiette plongeante) doit être maximal.")
                self.sm.modify_parameter('REARLEFT', 'RideHeightSetting', delta=+1)
                self.sm.modify_parameter('REARRIGHT', 'RideHeightSetting', delta=+1)
            else:
                self.log("Action (9X8 2024 Winged) : Assouplissement de la barre anti-roulis (ARB) avant pour redonner du pouvoir directionnel.")
                self.sm.modify_parameter('SUSPENSION', 'FrontAntiSwaySetting', delta=-1)

        elif any(m in car for m in ["GR010", "TR010", "499P", "Tipo 6"]):
            if 'Speed' in df.columns and 'LatAccel' in df.columns and 'SteeringAngle' in df.columns:
                mgu_deploy_zones = df[(df['Speed'] > 185) & (df['Speed'] < 200) & (abs(df['LatAccel']) > 1.2)]
                if not mgu_deploy_zones.empty and mgu_deploy_zones['SteeringAngle'].var() > 10:
                    self.log(f"Diagnostic ({car}) : Instabilité directionnelle détectée lors de l'activation du MGU avant (~190 km/h).")

        elif any(m in car for m in ["963", "V-Series.R", "Cadillac", "Hybrid V8", "A424", "SC63", "GMR-001"]):
            if 'WheelSlipRL' in df.columns and 'Throttle' in df.columns:
                power_oversteer = df[(df['Throttle'] > 70) & (df['Speed'] < 120) & (df['WheelSlipRL'] > 0.08)]
                if not power_oversteer.empty:
                    self.log(f"Diagnostic ({car}) : Sur-couple du MGU arrière détecté en sortie de courbe lente.")
                    self.log("Action : Durcissement des ressorts arrière (Springs) pour asseoir la puissance.")
                    self.sm.modify_parameter('REARLEFT', 'SpringSetting', delta=+1)
                    self.sm.modify_parameter('REARRIGHT', 'SpringSetting', delta=+1)
            
            if any(m in car for m in ["Cadillac", "V-Series.R", "Hybrid V8"]):
                if df.get('RideHeightFront', pd.Series([1])).min() < 0.15:
                    self.log("Action (Châssis Dallara) : Assouplissement extrême de l'hydraulique en compression rapide (Fast Bump).")
                    self.sm.modify_parameter('FRONTLEFT', 'FastBumpSetting', delta=-2)
                    self.sm.modify_parameter('FRONTRIGHT', 'FastBumpSetting', delta=-2)

        elif any(m in car for m in ["Valkyrie", "SCG 007", "Vandervell"]):
            if 'BrakeTempFL' in df.columns:
                max_brake_temp = df['BrakeTempFL'].max()
                if max_brake_temp > 600:
                    self.log("Action (Urgent) : Surchauffe critique des freins détectée. Ouverture des écopes de freins (Brake Ducts).")
                    self.sm.modify_parameter('BODYAERO', 'BrakeDuctSetting', delta=+1)

    def _analyze_lmp3_specifics(self, df):
        """Analyse comportementale ciblée pour la catégorie LMP3."""
        self.log("--- ANALYSE DYNAMIQUE SPÉCIFIQUE LMP3 ---")
        car = self.current_car_model

        if 'Brake' in df.columns and 'WheelSpeedFL' in df.columns and 'TopSpeed' in df.columns:
            front_lockups = df[(df['TopSpeed'] > 80) & (df['Brake'] > 70) & (df['WheelSpeedFL'] < 10)]
            if len(front_lockups) > 5:
                self.log("🚨 ALERTE PILOTAGE (LMP3) : Tu bloques violemment les roues avant au freinage (Aucun ABS pour te sauver).")
                self.log("Action : L'IA recule la répartition de freinage (Brake Bias) vers l'arrière.")
                self.sm.modify_parameter('CONTROLS', 'RearBrakeSetting', delta=+1)

        if "Ginetta" in car or "G61" in car:
            if 'YawRate' in df.columns and 'Brake' in df.columns:
                trailbrake_oversteer = df[(df['Brake'] > 5) & (df['Brake'] < 40) & (abs(df['YawRate']) > 45)]
                if not trailbrake_oversteer.empty:
                    self.log("Action (Ginetta) : Augmentation de la barre anti-roulis arrière (Rear ARB) pour stabiliser la plateforme en entrée de virage.")
                    self.sm.modify_parameter('SUSPENSION', 'RearAntiSwaySetting', delta=+1)

        elif "Ligier" in car or "P325" in car:
            if 'Speed' in df.columns and 'SteeringAngle' in df.columns:
                slow_understeer = df[(df['Speed'] < 110) & (df['SteeringAngle'] > 80)]
                if not slow_understeer.empty:
                    self.log("Action (Ligier) : Assouplissement des ressorts avant (Front Springs) pour forcer le nez à s'inscrire.")
                    self.sm.modify_parameter('FRONTLEFT', 'SpringSetting', delta=-1)
                    self.sm.modify_parameter('FRONTRIGHT', 'SpringSetting', delta=-1)

        elif "Adess" in car or "AD25" in car:
            if 'TopSpeed' in df.columns:
                self.log("Action (Adess) : Baisse drastique de l'aileron arrière pour compenser le manque de grip par une VMax agressive.")
                self.sm.modify_parameter('REARWING', 'RWSetting', delta=-1)

    def _analyze_lmp2_specifics(self, df):
        """Analyse comportementale ciblée pour la catégorie LMP2 (Oreca 07)."""
        self.log("--- ANALYSE DYNAMIQUE SPÉCIFIQUE LMP2 (ORECA 07) ---")

        if 'RideHeightFront' in df.columns and 'RideHeightRear' in df.columns and 'TopSpeed' in df.columns:
            high_speed = df[df['TopSpeed'] > 220]
            if not high_speed.empty:
                avg_front_rh = high_speed['RideHeightFront'].mean()
                avg_rear_rh = high_speed['RideHeightRear'].mean()
                if (avg_rear_rh - avg_front_rh) < 0.010: 
                    self.log("Diagnostic (Oreca 07) : Ton train arrière s'écrase trop à haute vitesse. Tu perds l'effet de sol (Stall).")
                    self.log("Action : Augmentation de la hauteur de caisse statique à l'arrière.")
                    self.sm.modify_parameter('REARLEFT', 'RideHeightSetting', delta=+1)
                    self.sm.modify_parameter('REARRIGHT', 'RideHeightSetting', delta=+1)

        if 'TireTempFL_O' in df.columns and 'TireTempFR_O' in df.columns and 'LatAccel' in df.columns:
            heavy_lateral = df[abs(df['LatAccel']) > 2.0]
            if not heavy_lateral.empty:
                temp_fl_out = heavy_lateral['TireTempFL_O'].mean()
                temp_fr_out = heavy_lateral['TireTempFR_O'].mean()
                if max(temp_fl_out, temp_fr_out) > 100.0:
                    self.log("Action : Assouplissement de la barre anti-roulis avant (Front ARB) pour réduire la force latérale transférée au pneu extérieur.")
                    self.sm.modify_parameter('SUSPENSION', 'FrontAntiSwaySetting', delta=-1)

    def _analyze_gte_specifics(self, df):
        """Analyse comportementale ciblée pour la catégorie GTE."""
        self.log("--- ANALYSE DYNAMIQUE SPÉCIFIQUE GTE ---")
        car = self.current_car_model

        if 'Brake' in df.columns and 'WheelSpeedFL' in df.columns and 'TopSpeed' in df.columns:
            front_lockups = df[(df['TopSpeed'] > 100) & (df['Brake'] > 75) & (df['WheelSpeedFL'] < 20)]
            if len(front_lockups) > 3:
                self.log("🚨 ALERTE FREINAGE (GTE) : Tu attaques la pédale de frein trop fort. Aucun ABS ne te protège, tes roues avant bloquent.")
                self.log("Action : Recul immédiat de la répartition de freinage (Brake Bias) vers l'arrière.")
                self.sm.modify_parameter('CONTROLS', 'RearBrakeSetting', delta=+1)
            
            hard_braking = df[df['Brake'] > 90]
            if not hard_braking.empty and hard_braking['Brake'].mean() > 95:
                self.log("Conseil Pilotage : N'écrase pas la pédale à 100% en GTE. Trouve le seuil d'adhérence (Threshold) autour de 85-90% de pression max.")

        if "RSR" in car or "911 RSR" in car:
            if 'RideHeightFront' in df.columns and 'RideHeightRear' in df.columns:
                avg_front = df['RideHeightFront'].mean()
                avg_rear = df['RideHeightRear'].mean()
                if (avg_rear - avg_front) < 0.015:
                    self.log("Action (911 RSR) : Augmentation de la hauteur de caisse arrière pour créer plus d'appui aérodynamique.")
                    self.sm.modify_parameter('REARLEFT', 'RideHeightSetting', delta=+1)
                    self.sm.modify_parameter('REARRIGHT', 'RideHeightSetting', delta=+1)

        elif "488" in car or "Ferrari" in car:
            if 'WheelSlipRL' in df.columns and 'SteeringAngle' in df.columns:
                snap_oversteer = df[(df['WheelSlipRL'] > 0.15) & (abs(df['SteeringAngle']) > 30)]
                if not snap_oversteer.empty:
                    self.log("Action (488 GTE) : Assouplissement de la barre anti-roulis arrière (Rear ARB) pour calmer le train arrière à la limite.")
                    self.sm.modify_parameter('SUSPENSION', 'RearAntiSwaySetting', delta=-1)

        elif "C8.R" in car or "Corvette" in car:
            if 'SuspensionVelocityFL' in df.columns:
                kerb_strikes = df[df['SuspensionVelocityFL'] > 0.4]
                if not kerb_strikes.empty:
                    self.log("Action (C8.R) : Ouverture radicale de la compression rapide (Fast Bump) pour absorber les chocs.")
                    self.sm.modify_parameter('FRONTLEFT', 'FastBumpSetting', delta=-1)
                    self.sm.modify_parameter('FRONTRIGHT', 'FastBumpSetting', delta=-1)

        elif "Vantage GTE" in car or "Aston" in car:
            if 'TireTempRL_M' in df.columns and 'Throttle' in df.columns:
                if df['TireTempRL_M'].max() > 95.0:
                    self.log("Action (Vantage GTE) : Durcissement du différentiel à l'accélération (Power) pour éviter qu'une roue ne patine.")
                    self.sm.modify_parameter('DRIVELINE', 'DiffPowerSetting', delta=+1)

    def _analyze_track_specifics(self, track_name, df):
        """Analyse croisée entre la télémétrie et la topologie spécifique du circuit."""
        self.log(f"--- ANALYSE TOPOGRAPHIQUE ({track_name}) ---")
        track_lower = track_name.lower()

        if any(t.lower() in track_lower for t in self.track_database['low_drag']):
            self.log("Diagnostic Piste : Circuit à très faible traînée (Low Drag). Priorité absolue à la VMax.")
            self.sm.modify_parameter('REARLEFT', 'RideHeightSetting', delta=-1)
            self.sm.modify_parameter('REARRIGHT', 'RideHeightSetting', delta=-1)
            self.sm.modify_parameter('REARWING', 'RWSetting', delta=-1)
            self.sm.modify_parameter('SUSPENSION', 'RearToeInSetting', delta=-1)
            self.sm.modify_parameter('SUSPENSION', 'FrontToeInSetting', delta=+1)

            if "daytona" in track_lower:
                self.log("Action (Roval) : Asymétrie pour le banking. Durcissement des ressorts droits.")
                self.sm.modify_parameter('FRONTRIGHT', 'SpringSetting', delta=+1)
                self.sm.modify_parameter('REARRIGHT', 'SpringSetting', delta=+1)

        elif any(t.lower() in track_lower for t in self.track_database['bumpy']):
            self.log("Diagnostic Piste : Surface très bosselée / Vibreurs agressifs détectés.")
            if "sebring" in track_lower:
                self.sm.modify_parameter('FRONTLEFT', 'RideHeightSetting', delta=+1)
                self.sm.modify_parameter('FRONTRIGHT', 'RideHeightSetting', delta=+1)
                self.sm.modify_parameter('REARLEFT', 'SlowReboundSetting', delta=-1)
                self.sm.modify_parameter('REARRIGHT', 'SlowReboundSetting', delta=-1)
            elif "imola" in track_lower:
                self.sm.modify_parameter('FRONTLEFT', 'SpringSetting', delta=-1)
                self.sm.modify_parameter('FRONTRIGHT', 'SpringSetting', delta=-1)
                self.sm.modify_parameter('REARLEFT', 'SpringSetting', delta=-1)
                self.sm.modify_parameter('REARRIGHT', 'SpringSetting', delta=-1)

        elif any(t.lower() in track_lower for t in self.track_database['technical_abrasive']):
            self.log("Diagnostic Piste : Tracé technique avec freinage en appui et forte dégradation des pneus.")
            if "bahrain" in track_lower or "bahreïn" in track_lower:
                self.sm.modify_parameter('CONTROLS', 'RearBrakeSetting', delta=-1) 
                self.sm.modify_parameter('DRIVELINE', 'DiffCoastSetting', delta=-1)
            elif "portimao" in track_lower or "algarve" in track_lower:
                self.sm.modify_parameter('FRONTLEFT', 'SlowBumpSetting', delta=-1)
                self.sm.modify_parameter('FRONTRIGHT', 'SlowBumpSetting', delta=-1)
            elif "barcelona" in track_lower or "catalunya" in track_lower:
                self.sm.modify_parameter('FRONTLEFT', 'CamberSetting', delta=+1) 
                self.sm.modify_parameter('FRONTWING', 'FWSetting', delta=+1)
                self.sm.modify_parameter('REARWING', 'RWSetting', delta=+1)

        elif any(t.lower() in track_lower for t in self.track_database['high_speed_flow']):
            self.log("Diagnostic Piste : Profil fluide à très haute force G latérale. Compromis aéro nécessaire.")
            if "spa" in track_lower:
                self.sm.modify_parameter('FRONTLEFT', 'SpringSetting', delta=+1)
                self.sm.modify_parameter('FRONTRIGHT', 'SpringSetting', delta=+1)
                self.sm.modify_parameter('REARWING', 'RWSetting', delta=-1)
            elif "cota" in track_lower or "americas" in track_lower:
                self.sm.modify_parameter('SUSPENSION', 'FrontAntiSwaySetting', delta=+1)
                self.sm.modify_parameter('SUSPENSION', 'RearAntiSwaySetting', delta=-1)
            elif "paul ricard" in track_lower:
                self.sm.modify_parameter('DRIVELINE', 'DiffPreloadSetting', delta=+1)
            elif "silverstone" in track_lower or "lusail" in track_lower:
                self.sm.modify_parameter('REARLEFT', 'RideHeightSetting', delta=+1)
                self.sm.modify_parameter('REARRIGHT', 'RideHeightSetting', delta=+1)
                self.sm.modify_parameter('FRONTLEFT', 'CamberSetting', delta=-1)
                self.sm.modify_parameter('FRONTRIGHT', 'CamberSetting', delta=-1)