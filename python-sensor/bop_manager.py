import os
import json
import cloudscraper
from bs4 import BeautifulSoup
import pdfplumber
import re

class BoPManager:
    """
    Système automatisé de scraping et de parsing des PDF de Balance of Performance (BoP)
    pour Le Mans Ultimate. Extracteur robuste multi-versions.
    """
    def __init__(self, storage_dir="."):
        self.storage_dir = storage_dir
        self.bop_url = "https://guide.lemansultimate.com/hc/en-gb/categories/16364289061135-Balance-of-Performance"
        self.db_path = os.path.join(storage_dir, "bop_database.json")
        self.pdf_path = os.path.join(storage_dir, "latest_bop.pdf")
        self.latest_version_title = None

    def fetch_latest_bop_pdf(self):
        """Scrape le site LMU pour trouver et télécharger le dernier PDF."""
        print("[BoP] Vérification des mises à jour sur le site officiel...")
        scraper = cloudscraper.create_scraper(browser={'browser': 'chrome', 'platform': 'windows', 'desktop': True})
        
        try:
            res = scraper.get(self.bop_url)
            soup = BeautifulSoup(res.text, 'html.parser')
            
            # Recherche robuste par TEXTE de l'article (ex: "Balance of Performance (1.4.1 Update...")
            article_links = []
            for a in soup.find_all('a', href=True):
                text = a.text.lower()
                if 'balance of performance' in text and 'update' in text:
                    article_links.append(a)
            
            if not article_links:
                print("[BoP] Erreur : Aucun article trouvé sur le site.")
                return False
                
            # Le site affiche toujours le plus récent en premier
            latest_article = article_links[0]
            article_title = latest_article.text.strip()
            self.latest_version_title = article_title
            
            # --- VÉRIFICATION INTELLIGENTE DE LA VERSION ---
            if os.path.exists(self.db_path):
                try:
                    with open(self.db_path, 'r', encoding='utf-8') as f:
                        local_db = json.load(f)
                        if local_db.get("_Metadata", {}).get("version") == article_title:
                            print(f"[BoP] La version locale est à jour ({article_title}). Scraping ignoré.")
                            return False # On arrête tout, pas besoin de télécharger
                except Exception:
                    pass

            bop_page_url = latest_article['href']
            if not bop_page_url.startswith('http'):
                bop_page_url = "https://guide.lemansultimate.com" + bop_page_url
                
            print(f"[BoP] Nouvelle mise à jour détectée : {article_title}")
            
            res_article = scraper.get(bop_page_url)
            soup_article = BeautifulSoup(res_article.text, 'html.parser')
            
            pdf_link = None
            for a in soup_article.find_all('a', href=True):
                if '.pdf' in a['href'].lower():
                    pdf_link = a['href']
                    break
            
            if not pdf_link:
                print("[BoP] Aucun fichier PDF trouvé dans l'article.")
                return False

            print(f"[BoP] Téléchargement du PDF en cours... ({pdf_link})")
            pdf_data = scraper.get(pdf_link).content
            with open(self.pdf_path, 'wb') as f:
                f.write(pdf_data)
                
            print("[BoP] PDF téléchargé avec succès.")
            return True
            
        except Exception as e:
            print(f"[BoP] Erreur lors du scraping : {e}")
            return False

    def parse_bop_pdf(self):
        """Parse le PDF (adaptatif pour gérer les versions 1.3.x et 1.4.x)."""
        if not os.path.exists(self.pdf_path):
            print("[BoP] Aucun PDF local à analyser.")
            return False

        print("[BoP] Extraction des données du PDF (Computer Vision)...")
        bop_db = {}
        
        try:
            with pdfplumber.open(self.pdf_path) as pdf:
                for page in pdf.pages:
                    words = page.extract_words()
                    if not words: continue
                    
                    # NOUVEAU : Capture des circuits avec noms composés (ex: "Le Mans Mulsanne") et leurs variantes
                    first_word_top = words[0]['top']
                    # On rassemble tous les mots qui sont sur la même ligne horizontale (en haut de page)
                    track_name_words = [w['text'] for w in words if abs(w['top'] - first_word_top) < 15]
                    full_track_line = " ".join(track_name_words).replace('_', ' ').strip()
                    
                    # On retire la date pour garder uniquement les noms de circuits (ex: "Bahrain Bahrain WEC, Bahrain Endurance...")
                    track_name = full_track_line.split('Date')[0].strip()
                    
                    if track_name not in bop_db:
                        bop_db[track_name] = {"HYPERCAR": {}, "LMGT3": {}, "LMP2": {}, "LMP3": {}, "LMGTE": {}}

                    tables = page.extract_tables()
                    for table in tables:
                        if not table or len(table) < 3: continue
                        
                        # Détection de la catégorie
                        table_text = str(table).upper()
                        category = None
                        for cat in ["HYPERCAR", "LMGT3", "LMP2", "LMP3", "LMGTE"]:
                            if cat in table_text:
                                category = cat
                                break
                        
                        if not category: continue

                        last_manufacturer = "Unknown"

                        # Les tableaux de LMU sont vicieux, ils fusionnent souvent les 2 premières lignes d'en-tête
                        for i, row in enumerate(table):
                            clean_row = [str(c).replace('\n', ' ').strip() if c is not None else "" for c in row]
                            
                            # Filtre strict : Ignore les lignes d'en-tête ou incomplètes
                            if len(clean_row) < 3: continue
                            if clean_row[1] == "" or "Car Model" in clean_row[1] or "Vehicles" in clean_row[1]: continue
                            if "Weight" in str(clean_row).upper() or "Manufacturer" in str(clean_row).title(): continue

                            if clean_row[0] != "":
                                last_manufacturer = clean_row[0]
                            
                            car_model = clean_row[1]
                            car_data = {"Manufacturer": last_manufacturer}

                            try:
                                if category == "HYPERCAR":
                                    car_data["MinWeight"] = self._clean_number(clean_row[2])
                                    car_data["MaxPowerStage1"] = self._clean_number(clean_row[3])
                                    car_data["Stage1End"] = self._clean_number(clean_row[4])
                                    car_data["Stage2Start"] = self._clean_number(clean_row[5])
                                    car_data["PowerGainLossStage2"] = self._clean_number(clean_row[6])
                                    car_data["DeployActivationSpeed"] = self._clean_number(clean_row[7])
                                    car_data["MaxStintEnergy"] = self._clean_number(clean_row[8])
                                    car_data["DockingTime"] = self._clean_number(clean_row[9])

                                elif category == "LMGT3":
                                    # Gestion de la variation du règlement (v1.3 = "P13", v1.4 = "87%")
                                    car_data["MinWeight"] = self._clean_number(clean_row[2])
                                    
                                    # Extrait la valeur de puissance qu'elle soit "Pxx" ou "xx"
                                    power_val = clean_row[3]
                                    if "P" in power_val.upper():
                                        match = re.search(r"P(\d+)", power_val.upper())
                                        car_data["MaxPowerStage1"] = f"P{match.group(1)}" if match else power_val
                                    else:
                                        car_data["MaxPowerStage1"] = self._clean_number(power_val)
                                        
                                    car_data["Stage1End"] = self._clean_number(clean_row[4])
                                    car_data["Stage2Start"] = self._clean_number(clean_row[5])
                                    car_data["PowerGainLossStage2"] = self._clean_number(clean_row[6])
                                    car_data["MaxStintEnergy"] = self._clean_number(clean_row[7])
                                    car_data["MinRearwingAngle"] = self._clean_number(clean_row[8])
                                    car_data["MaxRearwingAngle"] = self._clean_number(clean_row[9])
                                    car_data["MinRideHeight"] = self._clean_number(clean_row[10])

                                elif category == "LMGTE":
                                    car_data["MinWeight"] = self._clean_number(clean_row[2])
                                    car_data["PowerAdjustment"] = clean_row[3]
                                    car_data["FuelTankCapacity"] = self._clean_number(clean_row[4])
                                    car_data["RefuelRate"] = self._clean_number(clean_row[5])
                                    car_data["AeroPackage"] = clean_row[6]

                                elif category == "LMP2":
                                    car_data["MinWeight"] = self._clean_number(clean_row[2])
                                    car_data["Power"] = clean_row[3]
                                    car_data["MaxRPM"] = self._clean_number(clean_row[4])
                                    car_data["FuelTankCapacity"] = self._clean_number(clean_row[5])
                                    car_data["BaseAeroPackage"] = clean_row[6]
                                    car_data["FrontDivePlanes"] = clean_row[7]
                                    car_data["EngineCoverGurney"] = clean_row[8]
                                    car_data["RearwingGurney"] = clean_row[9]
                                    car_data["DiffuserStrakes"] = clean_row[10]

                                elif category == "LMP3":
                                    car_data["MinWeight"] = self._clean_number(clean_row[2])
                                    car_data["FrontDivePlane"] = clean_row[3]
                                    car_data["EngineCoverGurney"] = clean_row[4]

                                bop_db[track_name][category][car_model] = car_data
                            except IndexError:
                                continue 

            bop_db["_Metadata"] = {"version": self.latest_version_title}
            
            with open(self.db_path, 'w', encoding='utf-8') as f:
                json.dump(bop_db, f, indent=4)
            print(f"[BoP] Base de données BoP mise à jour ({len(bop_db)} circuits analysés).")
            return True

        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"[BoP] Erreur critique lors du parsing PDF : {e}")
            return False

    def _clean_number(self, text):
        """Isole la valeur nominale pure en ignorant les lests/gains entre parenthèses (ex: '1490 (+5)')."""
        if not text or text == "-": return None
        # On extrait le premier nombre (entier ou décimal) rencontré dans la chaîne (y compris les négatifs comme -0.5)
        match = re.search(r"[-+]?\d*\.\d+|[-+]?\d+", str(text))
        if match: return float(match.group())
        return None

    def get_bop_limits(self, track_name, category, car_model):
        """Renvoie les limites légales exactes pour un véhicule donné."""
        try:
            with open(self.db_path, 'r', encoding='utf-8') as f:
                db = json.load(f)
                
            target_track = None
            for t in db.keys():
                # INVERSION CRUCIALE : On vérifie si le nom cherché (ex: "Bahrain WEC") fait partie de la longue clé du PDF
                if track_name.lower() in t.lower():
                    target_track = t
                    break
                    
            if not target_track: return None
            
            cat_data = db[target_track].get(category.upper(), {})
            for model, limits in cat_data.items():
                # Matching intelligent pour gérer "911 GT3 R" vs "Porsche 911"
                if model.lower() in car_model.lower() or car_model.lower() in model.lower():
                    return limits
                    
            return None
        except Exception:
            return None

if __name__ == "__main__":
    manager = BoPManager()
    if manager.fetch_latest_bop_pdf():
        manager.parse_bop_pdf()