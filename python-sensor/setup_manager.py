import os
from datetime import datetime

class LMU_SetupManager:
    """
    Gestionnaire avancé des fichiers .svm pour Le Mans Ultimate.
    Gère la lecture par Catégories (Sections) et la manipulation d'Index Entiers.
    """
    def __init__(self, setups_directory):
        self.setups_directory = setups_directory
        self.current_setup = {} # Structure: {'FRONTLEFT': {'CamberSetting': '32'}, ...}

    def parse_svm(self, filename="tempGarage.svm"):
        """
        Lit le setup actuel de la voiture dans les stands.
        Sépare les variables par [SECTIONS] pour ne pas confondre les 4 roues.
        """
        filepath = os.path.join(self.setups_directory, filename)
        if not os.path.exists(filepath):
            print(f"[SYSTEM] Fichier introuvable: {filepath}")
            return self.current_setup

        current_section = "GENERAL"
        self.current_setup[current_section] = {}

        with open(filepath, 'r', encoding='utf-8') as file:
            for line in file:
                line = line.strip()
                # On ignore les lignes vides ou les commentaires purs
                if not line or line.startswith('//') and not '=' in line:
                    continue
                
                # Détection d'une nouvelle catégorie ex: [FRONTLEFT]
                if line.startswith('[') and line.endswith(']'):
                    current_section = line[1:-1]
                    if current_section not in self.current_setup:
                        self.current_setup[current_section] = {}
                    continue

                # Extraction de la variable et de sa valeur
                if '=' in line:
                    key_part, val_part = line.split('=', 1)
                    key = key_part.strip()
                    # On garde la valeur brute (ex: "9") et on retire le commentaire (ex: "//P9")
                    val = val_part.split('//')[0].strip() if '//' in val_part else val_part.strip()
                    
                    self.current_setup[current_section][key] = val

        return self.current_setup

    def modify_parameter(self, section, key, delta, limit_min=None, limit_max=None):
        """
        Modifie une valeur par Index (Entier) dans une section précise.
        Ex: modify_parameter('FRONTLEFT', 'SlowBumpSetting', +1)
        """
        if section not in self.current_setup or key not in self.current_setup[section]:
            print(f"[WARNING] Paramètre '{key}' introuvable dans la section '[{section}]'.")
            return False

        try:
            # LMU utilise des Index entiers. Ex: "32" pour 49:51 de Brake Bias.
            current_val = int(self.current_setup[section][key])
            new_val = current_val + int(delta)

            # Application des contraintes de sécurité
            if limit_min is not None: new_val = max(int(limit_min), new_val)
            if limit_max is not None: new_val = min(int(limit_max), new_val)

            self.current_setup[section][key] = str(new_val)
            print(f"[SETUP IA] [{section}] {key} optimisé : {current_val} -> {new_val}")
            return True
        except ValueError:
            print(f"[ERROR] Le paramètre {key} n'est pas un index modifiable.")
            return False

    def export_optimized_setup(self, track_name="Track", base_filename="OptimizedSetup"):
        """
        Sauvegarde le setup modifié en réécrivant proprement les sections.
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        new_filename = f"{track_name}_{base_filename}_{timestamp}.svm"
        filepath = os.path.join(self.setups_directory, new_filename)

        with open(filepath, 'w', encoding='utf-8') as file:
            file.write(f"// Setup généré par LMU Track Engineer AI ({timestamp})\n\n")
            
            for section, params in self.current_setup.items():
                file.write(f"[{section}]\n")
                for key, val in params.items():
                    # On réécrit au format LMU (On perd les commentaires texte, mais LMU s'en moque)
                    file.write(f"{key}={val}\n")
                file.write("\n")
        
        print(f"[SYSTEM] Nouveau setup sauvegardé : {new_filename}")
        return filepath