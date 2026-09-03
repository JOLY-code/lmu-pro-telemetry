import os
import json
import pandas as pd
import re

class CommunityReferenceManager:
    """
    Aspire le Google Spreadsheet d'Ohne Speed (Laptimes & Fuel Calculator)
    via l'export CSV natif pour créer une base de données centralisée.
    """
    def __init__(self, storage_dir="."):
        self.storage_dir = storage_dir
        self.sheet_url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN03UvJDm99byA6vQPZHKOCYVvfxLu1zkJAzdaKyROykzEKY2-Xl1rl1q5znZEf36m88dxMKsY2eaO/pubhtml"
        self.laptimes_csv_url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN03UvJDm99byA6vQPZHKOCYVvfxLu1zkJAzdaKyROykzEKY2-Xl1rl1q5znZEf36m88dxMKsY2eaO/pub?gid=1766901750&single=true&output=csv"
        self.fuel_csv_url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN03UvJDm99byA6vQPZHKOCYVvfxLu1zkJAzdaKyROykzEKY2-Xl1rl1q5znZEf36m88dxMKsY2eaO/pub?gid=5654949&single=true&output=csv"
        
        self.car_csv_urls = {
            "LMGT3": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN03UvJDm99byA6vQPZHKOCYVvfxLu1zkJAzdaKyROykzEKY2-Xl1rl1q5znZEf36m88dxMKsY2eaO/pub?gid=1991956603&single=true&output=csv",
            "HYPERCAR": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN03UvJDm99byA6vQPZHKOCYVvfxLu1zkJAzdaKyROykzEKY2-Xl1rl1q5znZEf36m88dxMKsY2eaO/pub?gid=306210712&single=true&output=csv",
            "LMP3": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN03UvJDm99byA6vQPZHKOCYVvfxLu1zkJAzdaKyROykzEKY2-Xl1rl1q5znZEf36m88dxMKsY2eaO/pub?gid=1738814445&single=true&output=csv",
            "LMGTE": "https://docs.google.com/spreadsheets/d/e/2PACX-1vTN03UvJDm99byA6vQPZHKOCYVvfxLu1zkJAzdaKyROykzEKY2-Xl1rl1q5znZEf36m88dxMKsY2eaO/pub?gid=2143838563&single=true&output=csv"
        }
        self.db_path = os.path.join(storage_dir, "community_reference.json")

    def time_to_seconds(self, time_str):
        """Convertit '1:58.91' en secondes (float)."""
        try:
            if pd.isna(time_str) or not isinstance(time_str, str) or ":" not in time_str: return 0.0
            parts = str(time_str).strip().split(':')
            return round((float(parts[0]) * 60) + float(parts[1]), 3)
        except Exception: return 0.0

    def fetch_and_parse(self):
        print("[COMMUNITY] Vérification de la base de données Ohne Speed...")
        try:
            # 1. Extraction via CSV (Rapide et ne crashe pas)
            df_laptimes = pd.read_csv(self.laptimes_csv_url, header=None)
            df_fuel = pd.read_csv(self.fuel_csv_url, header=None)

            # Recherche du Timestamp "Last updated:" dans les premières lignes du fichier
            header_text = " ".join([str(val) for val in df_laptimes.head(10).values.flatten()]).upper()
            match = re.search(r'LAST UPDATED:\s*(.*?CEST)', header_text)
            online_timestamp = match.group(1).strip() if match else "Unknown"

            # VÉRIFICATION INTELLIGENTE DE LA DATE
            if os.path.exists(self.db_path):
                with open(self.db_path, 'r', encoding='utf-8') as f:
                    local_db = json.load(f)
                    if local_db.get("_Metadata", {}).get("last_updated") == online_timestamp:
                        print(f"[COMMUNITY] Données à jour ({online_timestamp}). Extraction ignorée.")
                        return True

            print(f"[COMMUNITY] Nouvelle mise à jour trouvée ({online_timestamp}). Création du JSON...")

            db = {"_Metadata": {"last_updated": online_timestamp}, "LMGT3": {}, "HYPERCAR": {}, "LMP2": {}, "LMP2ELMS": {}, "LMP2WEC": {}, "LMP3": {}, "LMGTE": {}}

            # ==========================================
            # PARSING LAPTIMES
            # ==========================================
            current_class = None
            for index, row in df_laptimes.iterrows():
                row_text = " ".join([str(val) for val in row.values]).upper()
                row_cond = row_text.replace(" ", "") # Facilite la détection sans espaces
                
                # Détection ultra-précise des 6 catégories officielles du tableur
                if "LMGT3" in row_cond: current_class = "LMGT3"
                elif "LMH" in row_cond or "HYPERCAR" in row_cond: current_class = "HYPERCAR"
                elif "LMP2ELMS" in row_cond: current_class = "LMP2ELMS"
                elif "LMP2WEC" in row_cond: current_class = "LMP2WEC"
                elif "LMP3" in row_cond: current_class = "LMP3"
                elif "GTE" in row_cond: current_class = "LMGTE"

                # CORRECTION : La colonne 1 est le Circuit (La colonne 0 est vide dans le CSV)
                track_val = str(row[1]).strip()
                if current_class and track_val and track_val.lower() not in ["nan", "track", "1", "none", "minute", "min"]:
                    try:
                        # Mappage recalibré sur la structure CSV exacte
                        patch_ver = str(row[2]).strip()
                        class_avg_w = str(row[3]).strip()
                        alien_time = self.time_to_seconds(str(row[4]))
                        
                        fastest_car = str(row[12]).strip()
                        laptime_str = str(row[13]).strip()
                        best_avg = str(row[14]).strip() if len(row) > 14 else ""
                        
                        if alien_time > 0 and fastest_car.lower() != "nan":
                            clean_car = fastest_car.split('(')[0].strip()
                            db[current_class][track_val] = {
                                "patch": patch_ver,
                                "class_avgW": class_avg_w,
                                "fastest_car": clean_car,
                                "laptime_str": laptime_str,
                                "best_avg": best_avg,
                                "alien_time_sec": alien_time,
                                "paces_sec": {
                                    "Alien_100": alien_time,
                                    "Competitive_101": self.time_to_seconds(row[5]),
                                    "Good_102": self.time_to_seconds(row[6]),
                                    "Good_103": self.time_to_seconds(row[7]),
                                    "Midpack_104": self.time_to_seconds(row[8]),
                                    "Midpack_105": self.time_to_seconds(row[9]),
                                    "Tail_ender_106": self.time_to_seconds(row[10]),
                                    "Offline_107": self.time_to_seconds(row[11])
                                },
                                "fuel_stints": {} 
                            }
                    except Exception: pass

            # ==========================================
            # PARSING FUEL CALCULATOR
            # ==========================================
            current_class_fuel = None
            for index, row in df_fuel.iterrows():
                row_text = " ".join([str(val) for val in row.values]).upper()
                row_cond = row_text.replace(" ", "")
                
                if "LMGT3" in row_cond: current_class_fuel = "LMGT3"
                elif "LMH" in row_cond or "HYPERCAR" in row_cond: current_class_fuel = "HYPERCAR"
                elif "LMP2ELMS" in row_cond: current_class_fuel = "LMP2ELMS"
                elif "LMP2WEC" in row_cond: current_class_fuel = "LMP2WEC"
                elif "LMP3" in row_cond: current_class_fuel = "LMP3"
                elif "GTE" in row_cond: current_class_fuel = "LMGTE"

                # CORRECTION : La colonne 0 est le Circuit (et non la 1)
                track_val = str(row[0]).strip()
                if current_class_fuel and track_val and track_val.lower() not in ["nan", "track", "1", "none", "minute", "min"]:
                    if track_val in db[current_class_fuel]:
                        try:
                            # Décalage corrigé (4 min = col 2, 90 min = col 21)
                            def get_laps(col_idx):
                                if len(row) > col_idx:
                                    val = str(row[col_idx]).split(' ')[0]
                                    return int(val) if val.isdigit() else 0
                                return 0

                            db[current_class_fuel][track_val]["fuel_stints"] = {
                                "4_min": get_laps(2),
                                "6_min": get_laps(3),
                                "8_min": get_laps(4),
                                "10_min": get_laps(5),
                                "15_min": get_laps(6),
                                "20_min": get_laps(7),
                                "25_min": get_laps(8),
                                "30_min": get_laps(9),
                                "35_min": get_laps(10),
                                "40_min": get_laps(11),
                                "45_min": get_laps(12),
                                "50_min": get_laps(13),
                                "55_min": get_laps(14),
                                "60_min": get_laps(15),
                                "65_min": get_laps(16),
                                "70_min": get_laps(17),
                                "75_min": get_laps(18),
                                "80_min": get_laps(19),
                                "85_min": get_laps(20),
                                "90_min": get_laps(21)
                            }
                        except Exception: pass

            # ==========================================
            # PARSING CAR% (META RANKING & SPECIFIC LAPTIMES)
            # ==========================================
            for category, csv_url in self.car_csv_urls.items():
                try:
                    df_cars = pd.read_csv(csv_url, header=None)
                    db[category]["meta_ranking"] = {}
                    
                    # 1. Trouver la ligne qui contient les noms des circuits (La ligne qui commence par la catégorie)
                    track_row_idx = None
                    for idx, r in df_cars.iterrows():
                        if str(r[0]).strip().upper() in ["LMGT3", "LMH", "LMP3", "GTE"]:
                            track_row_idx = idx
                            break
                    
                    if track_row_idx is not None:
                        track_names = df_cars.iloc[track_row_idx]
                        
                        # 2. Parcourir toutes les voitures situées sous cette ligne
                        for idx in range(track_row_idx + 1, len(df_cars)):
                            car_row = df_cars.iloc[idx]
                            car_name = str(car_row[0]).strip()
                            
                            if not car_name or car_name.lower() == "nan": continue
                            
                            # Extraction du % Global (Colonne 1) pour la Tier List
                            global_pct = str(car_row[1]).replace("%", "").strip()
                            try:
                                db[category]["meta_ranking"][car_name] = float(global_pct)
                            except Exception: pass
                                
                            # Extraction des chronos spécifiques (À partir de la colonne 6)
                            for col_idx in range(6, len(car_row)):
                                track = str(track_names[col_idx]).strip()
                                
                                # Si le nom de la colonne du circuit est vide, ou "NaN", ou si on tape dans un autre tableau, on saute.
                                if not track or track.lower() == "nan" or "car" in track.lower(): continue
                                
                                laptime = str(car_row[col_idx]).strip()
                                
                                # --- LE FIX EST ICI ---
                                # Si on tombe sur une colonne contenant un pourcentage (ex: "100.04%"),
                                # c'est qu'on a débordé sur le tableau "%valid". On arrête tout pour cette voiture !
                                if "%" in laptime:
                                    break 
                                
                                # On nettoie les cases vides
                                if laptime.lower() == "nan" or laptime == "": 
                                    laptime = "N/A"
                                
                                # On l'ajoute au circuit correspondant dans notre DB
                                if track in db[category]:
                                    if "specific_cars" not in db[category][track]:
                                        db[category][track]["specific_cars"] = {}
                                    db[category][track]["specific_cars"][car_name] = laptime
                                    
                except Exception as e: 
                    print(f"[COMMUNITY] Erreur extraction Car% pour {category}: {e}")
            
            with open(self.db_path, 'w', encoding='utf-8') as f:
                json.dump(db, f, indent=4)
            print("[COMMUNITY] Base de données mise à jour et sauvegardée.")
            return True

        except Exception as e:
            print(f"[COMMUNITY] Erreur fatale lors de la mise à jour: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    CommunityReferenceManager().fetch_and_parse()