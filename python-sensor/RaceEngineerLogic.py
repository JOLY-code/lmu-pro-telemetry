import pandas as pd

class RaceEngineerLogic:
    """
    Moteur d'inférence d'ingénierie de course avancé.
    Gère désormais l'aéro, les pneus, le freinage et la balance mécanique.
    """
    def __init__(self, setup_manager):
        self.sm = setup_manager
        self.diagnostic_report = []

    def log(self, message):
        self.diagnostic_report.append(message)
        print(f"[ENGINEER/RADIO] {message}")

    def analyze_and_optimize(self, df_telemetry, session_context=None, df_competitors=None):
        """Processus complet d'analyse d'un relais avec conscience de l'environnement ET des adversaires."""
        if df_telemetry is None or df_telemetry.empty:
            self.log("Box, box. Données insuffisantes, fais un tour de plus.")
            return False

        self.log("Copie. Analyse de la télémétrie en cours...")
        
        # 1. Gestion du contexte
        if session_context:
            circuit = session_context.get('TrackName', 'Inconnu')
            duree = session_context.get('SessionDurationMinutes', 40)
            pluie = session_context.get('RainPathLevel', 0.0)
            self.log(f"📍 Contexte : {circuit} | Météo : Air {session_context.get('AmbientTemp')}°C / Piste {session_context.get('TrackTemp')}°C")
            if pluie > 0.1:
                self.log("⚠️ Piste humide détectée. L'IA recommande d'activer le protocole Pluie (Rain Setup).")
            self._adapt_setup_to_session_format(race_duration_minutes=duree)
            
            # --- STRATÉGIE DE CARBURANT ---
            self.calculate_race_strategy(df_telemetry, duree, tank_capacity_liters=110.0)
        else:
            self.log("⚠️ Attention radio : Contexte de session introuvable.")
            self._adapt_setup_to_session_format(race_duration_minutes=40)

        # 2. Analyse Châssis
        avg_data = df_telemetry.mean()
        self._analyze_mechanical_balance(df_telemetry)
        self._analyze_braking(df_telemetry)
        self._analyze_tire_pressures(avg_data)
        self._analyze_tire_temperatures(avg_data)
        self._analyze_aero_platform(avg_data, df_telemetry)
        self._analyze_dampers(df_telemetry)
        self._analyze_differential(df_telemetry)
        self._analyze_gearbox(df_telemetry)
        self._analyze_driver_plateau(df_telemetry, current_position=5, target_position=1)
        self._analyze_hybrid_deployment(df_telemetry)
        self._analyze_wear_and_damage(df_telemetry)
        self._analyze_electronics(df_telemetry)

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

    def _analyze_tire_pressures(self, avg_data):
        """
        Analyse des pressions de pneus pour maximiser la surface de contact (Grip mécanique).
        Cible théorique sur Hypercar/LMGT3 : ~180 kPa à chaud.
        """
        target_pressure = 180.0
        tolerance = 3.0

        pressures = {
            'FrontLeftPressure': avg_data.get('TirePressFL', target_pressure),
            'FrontRightPressure': avg_data.get('TirePressFR', target_pressure),
            'RearLeftPressure': avg_data.get('TirePressRL', target_pressure),
            'RearRightPressure': avg_data.get('TirePressRR', target_pressure)
        }

        for tire, press in pressures.items():
            if press < (target_pressure - tolerance):
                self.log(f"Diagnostic : Pression {tire} trop basse ({press:.1f} kPa). Le pneu s'écrase.")
                self.sm.modify_parameter('Tires', tire, delta=+1.0)
            elif press > (target_pressure + tolerance):
                self.log(f"Diagnostic : Pression {tire} trop haute ({press:.1f} kPa). Le pneu ballonne (surchauffe centrale).")
                self.sm.modify_parameter('Tires', tire, delta=-1.0)

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