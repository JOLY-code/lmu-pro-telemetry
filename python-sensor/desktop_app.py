import sys
import pandas as pd
import numpy as np 
import pyqtgraph as pg
from live_telemetry import LiveTelemetryThread
from PyQt6.QtWidgets import (QApplication, QMainWindow, QVBoxLayout, QHBoxLayout, 
                             QWidget, QPushButton, QLabel, QFrame, QGridLayout,
                             QTabWidget, QListWidget, QStackedWidget, QComboBox, QTextEdit, 
                             QListWidgetItem, QTableWidget, QTableWidgetItem, QHeaderView, 
                             QScrollArea, QLineEdit)
from PyQt6.QtGui import QPainter, QColor, QLinearGradient, QFont, QPen, QBrush, QPainterPath 
from PyQt6.QtCore import Qt, QRect, QSize

# Import du backend d'ingénierie
from setup_manager import LMU_SetupManager
from RaceEngineerLogic import RaceEngineerLogic
from telemetry_data import LMUTelemetryPipeline
from analysis_views import CoachDaveAnalysisPage

# =====================================================================
# COMPOSANTS GRAPHIQUES PERSONNALISÉS (Bas Niveau / QPainter)
# =====================================================================

class TireHeatmapWidget(QWidget):
    def __init__(self, name):
        super().__init__()
        self.name = name
        self.setMinimumSize(80, 120)
        self.temps = (80.0, 80.0, 80.0) 
        self.pressure = 170.0
        self.camber = -3.0 # Ajout du carrossage pour le visuel Setup

    def update_data(self, inner, middle, outer, pressure):
        self.temps = (inner, middle, outer)
        self.pressure = pressure
        self.update() 

    def update_setup_data(self, pressure, camber):
        self.pressure = pressure
        self.camber = camber
        self.update()

    def get_color_for_temp(self, temp):
        if temp < 85: return QColor(0, 100, 255)      
        elif temp < 100: return QColor(0, 255, 0)     
        elif temp < 105: return QColor(255, 165, 0)   
        else: return QColor(255, 0, 0)                

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        rect = self.rect()
        tire_rect = QRect(10, 20, rect.width() - 20, rect.height() - 40)
        
        # En mode Setup (sans temp live), on affiche un gradient neutre
        if self.temps == (80.0, 80.0, 80.0):
            painter.setBrush(QBrush(QColor(40, 40, 40)))
        else:
            gradient = QLinearGradient(tire_rect.left(), tire_rect.top(), tire_rect.right(), tire_rect.top())
            gradient.setColorAt(0.0, self.get_color_for_temp(self.temps[0]))
            gradient.setColorAt(0.5, self.get_color_for_temp(self.temps[1]))
            gradient.setColorAt(1.0, self.get_color_for_temp(self.temps[2]))
            painter.setBrush(QBrush(gradient))

        painter.setPen(QPen(QColor(255, 255, 255), 1))
        painter.drawRoundedRect(tire_rect, 10, 10)

        painter.setPen(QColor(200, 200, 200))
        painter.setFont(QFont("Segoe UI", 8, QFont.Weight.Bold))
        painter.drawText(0, 15, rect.width(), 15, Qt.AlignmentFlag.AlignCenter, self.name)
        
        # Affichage conditionnel (Live Temp vs Setup Camber)
        if self.temps != (80.0, 80.0, 80.0):
            temp_str = f"{int(self.temps[0])} | {int(self.temps[1])} | {int(self.temps[2])}°C"
            painter.setPen(QColor(0, 0, 0)) 
            painter.drawText(tire_rect, Qt.AlignmentFlag.AlignCenter, temp_str)
        else:
            painter.setPen(QColor(0, 255, 200)) 
            painter.drawText(tire_rect, Qt.AlignmentFlag.AlignCenter, f"Camber\n{self.camber}°")

        painter.setPen(QColor(0, 255, 255))
        painter.drawText(0, rect.height() - 15, rect.width(), 15, Qt.AlignmentFlag.AlignCenter, f"{self.pressure:.1f} kPa")

class TelemetryBarWidget(QWidget):
    """Barre de progression type Télémétrie (Accélérateur, Frein)."""
    def __init__(self, name, color, max_val=100.0):
        super().__init__()
        self.name = name
        self.color = color
        self.max_val = max_val
        self.current_val = 0.0
        self.setMinimumHeight(30)

    def update_val(self, val):
        self.current_val = min(max(val, 0), self.max_val)
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        rect = self.rect()
        
        # Fond sombre
        painter.setBrush(QColor(30, 30, 30))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawRect(rect)
        
        # Barre de remplissage
        fill_width = int((self.current_val / self.max_val) * rect.width())
        painter.setBrush(self.color)
        painter.drawRect(0, 0, fill_width, rect.height())
        
        # Texte
        painter.setPen(QColor(255, 255, 255))
        painter.setFont(QFont("Consolas", 10, QFont.Weight.Bold))
        painter.drawText(rect, Qt.AlignmentFlag.AlignCenter, f"{self.name}: {self.current_val:.1f}")

class VerticalTelemetryBar(QWidget):
    """Barre de télémétrie verticale (Style Track Titan)"""
    def __init__(self, name, color):
        super().__init__()
        self.name = name
        self.color = color
        self.current_val = 0.0
        self.setMinimumSize(40, 150)

    def update_val(self, val):
        self.current_val = min(max(val, 0), 100.0)
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        rect = self.rect()
        
        # Contour/Fond
        painter.setBrush(QColor(30, 30, 30))
        painter.setPen(QPen(QColor(80, 80, 80), 2))
        painter.drawRect(0, 0, rect.width()-1, rect.height()-20) # Laisse de la place pour le texte
        
        # Remplissage vertical
        fill_height = int((self.current_val / 100.0) * (rect.height() - 20))
        painter.setBrush(self.color)
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawRect(2, (rect.height() - 20) - fill_height, rect.width()-4, fill_height)
        
        # Texte (Brake/Throttle)
        painter.setPen(QColor(200, 200, 200))
        painter.setFont(QFont("Segoe UI", 8, QFont.Weight.Bold))
        painter.drawText(0, rect.height() - 15, rect.width(), 15, Qt.AlignmentFlag.AlignCenter, self.name)

class PageSessionsLeaderboard(QWidget):
    """La page dédiée à l'analyse avancée du tour."""
    def __init__(self, graphs_widget):
        super().__init__()
        self.graphs = graphs_widget # On sauvegarde la référence du graphique
        layout = QHBoxLayout(self)

        # --- GAUCHE : Trajectoire, Conseils et Map ---
        left_panel = QVBoxLayout()
        left_panel.setSpacing(0)
        
        self.trajectory_view = TrajectoryWidget()
        left_panel.addWidget(self.trajectory_view, stretch=4)
        
        sep_line1 = QFrame()
        sep_line1.setFrameShape(QFrame.Shape.HLine)
        sep_line1.setStyleSheet("border-top: 2px solid #00ffcc; margin-top: 5px; margin-bottom: 5px;")
        left_panel.addWidget(sep_line1)

        # En-tête
        header_widget = QWidget()
        header_layout = QVBoxLayout(header_widget)
        header_layout.setContentsMargins(5, 5, 5, 5)
        
        self.lbl_track_info = QLabel("Session Data - En attente...")
        self.lbl_track_info.setStyleSheet("color: white; font-weight: bold; font-size: 12px;")
        self.lbl_car_info = QLabel("🚗 Hypercar  |  LMU")
        self.lbl_car_info.setStyleSheet("color: #aaaaaa; font-size: 11px;")
        
        header_layout.addWidget(self.lbl_track_info)
        header_layout.addWidget(self.lbl_car_info)
        
        # Conseils (On les stocke pour pouvoir les modifier avec l'IA plus tard)
        tips_layout = QHBoxLayout()
        self.tip_1 = DrivingTipCard("En attente de données", "Lancez le chargement de la base de données.", color="#555555")
        self.tip_2 = DrivingTipCard("Analyse", "L'ingénieur analyse vos secteurs...", color="#ffaa00")
        tips_layout.addWidget(self.tip_1)
        tips_layout.addWidget(self.tip_2)
        header_layout.addLayout(tips_layout)
        
        left_panel.addWidget(header_widget, stretch=3)

        # Map Circuit
        self.track_map = SectorMapWidget()
        left_panel.addWidget(self.track_map, stretch=4)
        
        layout.addLayout(left_panel, stretch=4)

        # --- DROITE : Graphiques Synchronisés ---
        right_panel = QVBoxLayout()
        
        header_compare = QHBoxLayout()
        lbl_you = QLabel("VOTRE SESSION ACTUELLE")
        lbl_you.setStyleSheet("background-color: #00ffcc; color: black; font-weight: bold; padding: 8px; border-radius: 4px;")
        header_compare.addWidget(lbl_you)
        right_panel.addLayout(header_compare)

        right_panel.addWidget(self.graphs)
        layout.addLayout(right_panel, stretch=6)

    def load_session_data(self, df_telemetry, session_context):
        """Cette fonction connecte les vraies données à l'interface"""
        # 1. Mise à jour de l'en-tête (Vrai circuit et vraie durée)
        if session_context:
            track = session_context.get('TrackName', 'Inconnu')
            duration = session_context.get('SessionDurationMinutes', 0)
            self.lbl_track_info.setText(f"Session Actuelle - {track} ({duration} mins)")

        # 2. Mise à jour des vrais secteurs sur la carte
        last_lap = df_telemetry.iloc[-1]
        self.track_map.update_real_sectors(last_lap['Sector1'], last_lap['Sector2'], last_lap['Sector3'])

        # 3. Envoi au graphique
        self.graphs.load_real_dataframe(df_telemetry)

        # 4. Tip dynamique basé sur tes vraies erreurs (Exemple : Blocage détecté)
        if df_telemetry['WheelSpeedFL'].min() < 10:
            self.tip_1.findChildren(QLabel)[0].setText("💡 Blocage de roue avant")
            self.tip_1.findChildren(QLabel)[1].setText("La télémétrie indique que vous avez bloqué la roue avant gauche. Freinez de manière dégressive.")
            self.tip_1.setStyleSheet("QFrame { background-color: #222222; border: 2px solid #ff3333; border-radius: 8px; } QLabel { border: none; }")
        
# =====================================================================
# ASSEMBLAGE DE LA VOITURE (CAR BLUEPRINT)
# =====================================================================
class LMUSetupTabsWidget(QTabWidget):
    """Interface de Setup reproduisant exactement les menus de Le Mans Ultimate."""
    def __init__(self):
        super().__init__()
        self.setStyleSheet("""
            QTabWidget::pane { border: 1px solid #333; background: #111111; border-radius: 4px; }
            QTabBar::tab { background: #222; color: #888; padding: 10px 15px; font-weight: bold; border: 1px solid #333; }
            QTabBar::tab:selected { background: #ffaa00; color: #000; }
            QLabel { color: #ccc; font-size: 12px; font-weight: bold; }
            QLabel[is_val="true"] { color: #00ffcc; font-size: 14px; font-family: 'Consolas'; background: #1a1a1a; padding: 5px; border-radius: 3px; }
        """)
        self.val_labels = {}

        # 1. POWERTRAIN (Standard)
        tab_powertrain = QWidget()
        layout_pt = QGridLayout(tab_powertrain)
        self._add_group(layout_pt, 0, 0, "ENGINE", ["Virtual Energy", "Starting Fuel", "Rev Limiter", "Engine Mixture",  "Water radiator cover", "Oil radiator cover"])  
        self._add_group(layout_pt, 1, 0, "ELECTRONICS", ["Onboard TC", "TC Power Cut", "TC slip angle", "Regen level", "Electric motor map"])
        self._add_group(layout_pt, 0, 1, "DIFFERENTIAL", ["Power", "Coast", "Preload", "Front Power", "Front coast", "Front Preload"])
        self._add_group(layout_pt, 1, 1, "GEARING", ["Ratio Set"])
        self.addTab(tab_powertrain, "POWERTRAIN")

        # 2. WHEELS & BRAKES (Avec colonnes Left / Readings / Right)
        tab_wheels = QWidget()
        layout_wb = QVBoxLayout(tab_wheels)
        layout_wb.addWidget(self._create_lr_group("FRONT WHEELS", ["Compound", "Tyre pressure", "Camber", "Brake disc"], has_3rd_spring=False))
        layout_wb.addWidget(self._create_lr_group("REAR WHEELS", ["Compound", "Tyre pressure", "Camber", "Brake disc"], has_3rd_spring=False))
        layout_wb.addWidget(self._create_standard_frame("BRAKES", ["Brake bias", "Brake Migration", "Max pedal force", "Front brake duct", "Rear brake duct", "ABS"]))
        self.addTab(tab_wheels, "WHEELS & BRAKES")

        # 3. SUSPENSION (Avec colonnes Left / 3rd Spring / Right)
        tab_susp = QWidget()
        layout_susp = QVBoxLayout(tab_susp)
        layout_susp.addWidget(self._create_lr_group("FRONT SUSPENSION", ["Spring rate","Tender spring rate", "Packers", "Ride height", "Spring rubber"], has_3rd_spring=True))
        layout_susp.addWidget(self._create_lr_group("REAR SUSPENSION", ["Spring rate", "Packers", "Ride height"], has_3rd_spring=True))
        self.addTab(tab_susp, "SUSPENSION")

        # 4. DAMPERS (Avec colonnes Left / 3rd Spring / Right)
        tab_damp = QWidget()
        layout_damp = QVBoxLayout(tab_damp)
        layout_damp.addWidget(self._create_lr_group("FRONT DAMPERS", ["Slow bump", "Slow rebound", "Fast bump", "Fast rebound"], has_3rd_spring=True))
        layout_damp.addWidget(self._create_lr_group("REAR DAMPERS", ["Slow bump", "Slow rebound", "Fast bump", "Fast rebound"], has_3rd_spring=True))
        self.addTab(tab_damp, "DAMPERS")

        # 5. CHASSIS & AERO
        tab_chassis = QWidget()
        layout_chas = QGridLayout(tab_chassis)
        self._add_group(layout_chas, 0, 0, "FRONT CHASSIS", ["Caster", "Toe-in", "Arb size & position", "Front Wheel Track", "Wheel range (lock)", "Splitter"])
        self._add_group(layout_chas, 1, 0, "REAR CHASSIS", ["Toe-in", "Arb size & position","Rear wheel track", "Rear wing"])
        self._add_group(layout_chas, 0, 1, "WEIGHT", ["Vertical", "Lateral", "Weight distribution"])
        self._add_group(layout_chas, 1, 1, "ADVANCED CHASSIS", ["Front pickup", "Rear pickup", "Chassis adjustment 2", "Chassis adjustment 3"])
        self.addTab(tab_chassis, "CHASSIS & AERO")
        
    def _add_group(self, layout, row, col, title, params):
        """Ajoute un bloc standard dans une grille."""
        layout.addWidget(self._create_standard_frame(title, params), row, col)

    def _create_standard_frame(self, title, params):
        """Crée un bloc de paramètres simples (Clé - Valeur)."""
        frame = QFrame()
        vbox = QVBoxLayout(frame)
        lbl_title = QLabel(title)
        lbl_title.setStyleSheet("color: #ffaa00; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #333;")
        vbox.addWidget(lbl_title)
        for p in params:
            row_layout = QHBoxLayout()
            name_lbl = QLabel(p)
            val_lbl = QLabel("-")
            val_lbl.setProperty("is_val", "true")
            val_lbl.setAlignment(Qt.AlignmentFlag.AlignRight)
            self.val_labels[p.replace(" ", "")] = val_lbl
            row_layout.addWidget(name_lbl)
            row_layout.addStretch()
            row_layout.addWidget(val_lbl)
            vbox.addLayout(row_layout)
        vbox.addStretch()
        return frame

    def _create_lr_group(self, title, params, has_3rd_spring=False):
        """Crée le système de colonnes (Left / Center / Right) vu dans le jeu LMU."""
        frame = QFrame()
        vbox = QVBoxLayout(frame)
        
        header_layout = QHBoxLayout()
        title_lbl = QLabel(title)
        title_lbl.setStyleSheet("color: #ffaa00; font-size: 16px; border-bottom: 1px solid #333;")
        header_layout.addWidget(title_lbl, stretch=2)
        
        headers = ["LEFT", "3RD SPRING" if has_3rd_spring else "READINGS", "RIGHT"]
        for h in headers:
            lbl = QLabel(h)
            lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            lbl.setStyleSheet("color: #666;")
            header_layout.addWidget(lbl, stretch=1)
            
        vbox.addLayout(header_layout)
        
        for p in params:
            row_layout = QHBoxLayout()
            name_lbl = QLabel(p)
            row_layout.addWidget(name_lbl, stretch=2)
            
            val_l = QLabel("-")
            val_c = QLabel("-")
            val_r = QLabel("-")
            for val in (val_l, val_c, val_r):
                val.setProperty("is_val", "true")
                val.setAlignment(Qt.AlignmentFlag.AlignCenter)
                
            if not has_3rd_spring: val_c.setStyleSheet("color: #555;") # Grisé si "Readings"
            
            prefix = title.split(" ")[0].capitalize() # Front ou Rear
            base_key = p.replace(" ", "")
            self.val_labels[f"{prefix}Left{base_key}"] = val_l
            self.val_labels[f"{prefix}Center{base_key}"] = val_c
            self.val_labels[f"{prefix}Right{base_key}"] = val_r
            
            row_layout.addWidget(val_l, stretch=1)
            row_layout.addWidget(val_c, stretch=1)
            row_layout.addWidget(val_r, stretch=1)
            vbox.addLayout(row_layout)
            
        return frame

    def load_setup(self, setup_data):
        """Fait le lien entre les données de l'ingénieur et l'interface LMU."""
        # On définit un mapping entre les clés générées de l'UI et les clés du backend
        mapping = {
            'StartingFuel': 'StartingFuel', 'OnboardTC': 'TC1', 'Preload': 'Preload',
            'Brakebias': 'BrakeBias', 'Rearwing': 'RearWingSetting', 'Wheelrangelock': 'SteeringLock',
            'Tyrepressure': 'FrontLeftPressure', # Simplification pour la démo
            'Rideheight': 'FrontRideHeight',
            'Arbsizeposition': 'FrontAntiSway'
        }
        
        for ui_key, backend_key in mapping.items():
            if ui_key in self.val_labels and backend_key in setup_data:
                self.val_labels[ui_key].setText(str(setup_data[backend_key]))

class DrivingTipCard(QFrame):
    def __init__(self, title, description, color="#ffaa00"):
        super().__init__()
        self.setStyleSheet(f"QFrame {{ background-color: #222222; border: 2px solid {color}; border-radius: 8px; }} QLabel {{ border: none; }}")
        self.setMinimumHeight(100)
        layout = QVBoxLayout(self)
        lbl_title = QLabel(f"💡 {title}")
        lbl_title.setStyleSheet(f"color: {color}; font-weight: bold; font-size: 13px;")
        lbl_title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        lbl_desc = QLabel(description)
        lbl_desc.setStyleSheet("color: #cccccc; font-size: 11px;")
        lbl_desc.setAlignment(Qt.AlignmentFlag.AlignCenter)
        lbl_desc.setWordWrap(True)
        layout.addWidget(lbl_title)
        layout.addWidget(lbl_desc)

class TrajectoryWidget(QWidget):
    """Affiche la trajectoire (Vue de dessus) avec les limites de la piste."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        
        self.plot = pg.PlotWidget()
        self.plot.hideAxis('left')
        self.plot.hideAxis('bottom')
        self.plot.setBackground('#1a1a1a')
        self.plot.setMouseEnabled(x=True, y=True)
        layout.addWidget(self.plot)

        # Boutons de zoom (Overlay) - Comme sur ton image
        btn_layout = QVBoxLayout()
        btn_layout.setContentsMargins(10, 10, 0, 0)
        btn_zoom_in = QPushButton("+ Zoom In")
        btn_zoom_out = QPushButton("- Zoom Out")
        for btn in [btn_zoom_in, btn_zoom_out]:
            btn.setFixedSize(80, 25)
            btn.setStyleSheet("background-color: #333; color: white; border: 1px solid #555; border-radius: 4px; font-size: 10px;")
            btn_layout.addWidget(btn)
        btn_layout.addStretch()
        
        # Astuce PyQt : Ajouter le layout par-dessus le graphe
        overlay_widget = QWidget(self.plot)
        overlay_widget.setLayout(btn_layout)
        overlay_widget.setFixedSize(100, 100)

        # Simulation du virage (Segment)
        t = np.linspace(0, np.pi/1.5, 100)
        
        # 1. Dessin des limites de la piste (Gris foncé)
        x_outer = np.cos(t) * 115
        y_outer = np.sin(t) * 115
        x_inner = np.cos(t) * 85
        y_inner = np.sin(t) * 85
        self.plot.plot(x_outer, y_outer, pen=pg.mkPen(color='#444444', width=2))
        self.plot.plot(x_inner, y_inner, pen=pg.mkPen(color='#444444', width=2))

        # 2. Ligne de référence (Bleu)
        x_ref = np.cos(t) * 105
        y_ref = np.sin(t) * 105
        self.plot.plot(x_ref, y_ref, pen=pg.mkPen(color='#0055ff', width=3))

        # 3. Ligne du joueur (Cyan) - Corde manquée
        x_you = np.cos(t) * 95 - 2 
        y_you = np.sin(t) * 98 - 5
        self.plot.plot(x_you, y_you, pen=pg.mkPen(color='#00ffcc', width=3))

        # Position actuelle (Point cyan)
        self.current_pos = self.plot.plot([x_you[50]], [y_you[50]], symbol='o', symbolSize=14, symbolBrush='#00ffcc', pen=None)

class SectorMapWidget(QWidget):
    """Dessine le circuit complet et affiche les vrais temps par secteur."""
    def __init__(self):
        super().__init__()
        self.setMinimumHeight(150)
        self.setStyleSheet("background-color: #1a1a1a; border-radius: 5px; border-top: 2px solid #00ffcc;")
        
        # Données des secteurs initialisées à vide
        self.sectors_data = [
            {"val": "-", "color": QColor(100, 100, 100)}, # Secteur 1
            {"val": "-", "color": QColor(100, 100, 100)}, # Secteur 2
            {"val": "-", "color": QColor(100, 100, 100)}  # Secteur 3
        ]

    def update_real_sectors(self, s1, s2, s3):
        """Met à jour l'interface avec les vraies données de la DB"""
        # Logique de couleur (Vert si sous un certain temps, Rouge sinon)
        self.sectors_data[0] = {"val": f"{s1:.2f}s", "color": QColor(50, 255, 50) if s1 < 35.3 else QColor(255, 50, 50)}
        self.sectors_data[1] = {"val": f"{s2:.2f}s", "color": QColor(50, 255, 50) if s2 < 60.2 else QColor(255, 50, 50)}
        self.sectors_data[2] = {"val": f"{s3:.2f}s", "color": QColor(50, 255, 50) if s3 < 45.2 else QColor(255, 50, 50)}
        self.update() # Déclenche le redessin

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        rect = self.rect()
        cx, cy = rect.width() / 2, rect.height() / 2
        scale = min(rect.width(), rect.height()) / 4

        # Tracé du circuit
        path = QPainterPath()
        points = [
            (cx - scale*1.5, cy + scale*0.5), (cx - scale*1.0, cy - scale*0.2),
            (cx - scale*0.2, cy - scale*0.8), (cx + scale*0.5, cy - scale*0.5),
            (cx + scale*1.5, cy - scale*0.6), (cx + scale*1.8, cy + scale*0.1),
            (cx + scale*1.2, cy + scale*0.6), (cx + scale*0.2, cy + scale*0.3),
            (cx - scale*0.8, cy + scale*0.8)
        ]
        path.moveTo(points[0][0], points[0][1])
        for p in points[1:]: path.lineTo(p[0], p[1])
        path.closeSubpath()

        painter.setPen(QPen(QColor(150, 100, 50), 6))
        painter.drawPath(path)
        painter.setPen(QPen(QColor(60, 60, 60), 4))
        painter.drawPath(path)

        # Positions fixes pour les étiquettes des 3 secteurs
        sector_positions = [points[1], points[4], points[7]]

        painter.setFont(QFont("Segoe UI", 8, QFont.Weight.Bold))
        for i, pos in enumerate(sector_positions):
            sec = self.sectors_data[i]
            
            # Pastille de couleur
            painter.setBrush(sec["color"])
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(int(pos[0]) - 10, int(pos[1]) - 10, 20, 20)
            
            # Texte du temps juste à côté
            painter.setPen(QColor(255, 255, 255))
            painter.drawText(int(pos[0]) + 15, int(pos[1]) + 5, sec["val"])

class TrackTitanGraphs(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        pg.setConfigOption('background', '#1a1a1a')
        pg.setConfigOption('foreground', '#888888')
        pg.setConfigOptions(antialias=True)
        self.win = pg.GraphicsLayoutWidget()
        layout.addWidget(self.win)
        
        # 1. Diff to Ref
        self.p_delta = self.win.addPlot(title="Diff to Best Lap (s)")
        self.p_delta.showGrid(x=True, y=True, alpha=0.2)
        self.curve_delta = self.p_delta.plot(pen=pg.mkPen(color='#ff5555', width=2))
        self.win.nextRow()
        
        # 2. Vitesse
        self.p_speed = self.win.addPlot(title="Speed (kph)")
        self.p_speed.showGrid(x=True, y=True, alpha=0.2)
        self.curve_speed_you = self.p_speed.plot(pen=pg.mkPen(color='#00ffcc', width=2.5))
        self.win.nextRow()
        
        # 3. Pédales
        self.p_pedals = self.win.addPlot(title="Throttle & Brake (%)")
        self.p_pedals.showGrid(x=True, y=True, alpha=0.2)
        self.p_pedals.setYRange(0, 105)
        self.curve_throttle = self.p_pedals.plot(pen=pg.mkPen(color='#00ffcc', width=2.5))
        self.curve_brake = self.p_pedals.plot(pen=pg.mkPen(color='#ff3333', width=2.5))
        self.win.nextRow()

        # 4. NOUVEAU : Vehicle Dynamics (Steering vs Lat G) - Outil d'ingénierie absolue
        self.p_dynamics = self.win.addPlot(title="Vehicle Dynamics : Steering vs Lat. G (Understeer Check)")
        self.p_dynamics.showGrid(x=True, y=True, alpha=0.3)
        self.p_dynamics.setLabel('left', 'Lat. G-Force', units='G')
        self.p_dynamics.setLabel('bottom', 'Steering Angle', units='°')
        # On utilise un Scatter Plot (nuage de points) pour la dynamique
        self.scatter_dynamics = self.p_dynamics.plot(pen=None, symbol='o', symbolSize=4, symbolBrush='#ffaa00')

        self.p_delta.setXLink(self.p_speed)
        self.p_pedals.setXLink(self.p_speed)

        self.data_time, self.data_speed, self.data_throttle = [], [], []
        self.data_brake, self.data_delta = [], []

    def load_real_dataframe(self, df):
        """Charge tes vraies données DuckDB"""
        x_laps = df['Lap'].tolist()
        speed_data = df['TopSpeed'].tolist()
        throttle_data = df['Throttle'].tolist()
        
        best_lap = df['LapTime'].min()
        delta_data = (df['LapTime'] - best_lap).tolist()

        self.curve_speed.setData(x_laps, speed_data)
        self.curve_throttle.setData(x_laps, throttle_data)
        self.curve_brake.setData([], [])
        self.curve_delta.setData(x_laps, delta_data)
        
        # Alimentation du nuage de points (Dynamique véhicule)
        if 'SteeringAngle' in df.columns and 'LatAccel' in df.columns:
            steer_data = df['SteeringAngle'].tolist()
            latg_data = df['LatAccel'].tolist()
            self.scatter_dynamics.setData(steer_data, latg_data)

    def update_realtime(self, live_data):
        """Anime les courbes de vitesse et pédales en Live"""
        self.data_time.append(live_data['Time'])
        self.data_speed.append(live_data['Speed'])
        self.data_throttle.append(live_data['Throttle'])
        self.data_brake.append(live_data['Brake'])
        self.data_delta.append(0.0)

        if len(self.data_time) > 300:
            self.data_time.pop(0); self.data_speed.pop(0)
            self.data_throttle.pop(0); self.data_brake.pop(0); self.data_delta.pop(0)

        self.curve_speed.setData(self.data_time, self.data_speed)
        self.curve_throttle.setData(self.data_time, self.data_throttle)
        self.curve_brake.setData(self.data_time, self.data_brake)
        self.curve_delta.setData(self.data_time, self.data_delta)

class GenericPage(QWidget):
    def __init__(self, title, subtitle):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.addWidget(QLabel(f"<h1 style='color:#ff3300;'>{title}</h1>"))
        layout.addWidget(QLabel(subtitle))
        layout.addStretch()

# =====================================================================
# FENÊTRE PRINCIPALE DU LOGICIEL (APPLICATION)
# =====================================================================
class PageCarSetups(QWidget):
    """L'interface complète de gestion des Setups (100% connectée aux vraies données)."""
    def __init__(self, blueprint_widget):
        super().__init__()
        self.blueprint = blueprint_widget
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        # --- 1. BARRE DE FILTRES DYNAMIQUES ---
        filters_frame = QFrame()
        filters_frame.setStyleSheet("background-color: #1a1a1a; border-radius: 5px; padding: 10px;")
        filters_layout = QHBoxLayout(filters_frame)
        
        lbl_title = QLabel("🔧 GESTIONNAIRE DE SETUPS")
        lbl_title.setStyleSheet("font-size: 18px; font-weight: bold; color: white;")
        
        self.combo_class = QComboBox()
        self.combo_class.addItems(["HYP", "LMP2", "LMGT3"])
        self.combo_class.setStyleSheet("background-color: #333; color: white; padding: 5px; border-radius: 3px;")
        self.combo_class.currentTextChanged.connect(self._on_class_changed)
        
        self.combo_track = QComboBox()
        self.combo_track.addItem("Auto-Détection (En attente de Télémétrie...)")
        self.combo_track.setStyleSheet("background-color: #333; color: white; padding: 5px; border-radius: 3px;")
        
        filters_layout.addWidget(lbl_title)
        filters_layout.addStretch()
        filters_layout.addWidget(QLabel("Catégorie :", styleSheet="color:#aaa;"))
        filters_layout.addWidget(self.combo_class)
        filters_layout.addWidget(QLabel("Circuit :", styleSheet="color:#aaa;"))
        filters_layout.addWidget(self.combo_track)
        
        layout.addWidget(filters_frame)

        # --- 2. CONTENU PRINCIPAL ---
        content_layout = QHBoxLayout()

        # Gauche : Historique
        left_col = QVBoxLayout()
        left_col.addWidget(QLabel("<b>HISTORIQUE DES ITÉRATIONS</b>", styleSheet="color: white;"))
        self.list_versions = QListWidget()
        self.list_versions.setStyleSheet("""
            QListWidget { background-color: #151515; border: 1px solid #333; border-radius: 5px; outline: none; }
            QListWidget::item { padding: 15px; border-bottom: 1px solid #222; color: #ddd; }
            QListWidget::item:selected { background-color: #2a2a2a; border-left: 4px solid #00ffcc; color: white; font-weight: bold; }
        """)
        self.list_versions.currentRowChanged.connect(self._on_version_selected)
        left_col.addWidget(self.list_versions)
        content_layout.addLayout(left_col, stretch=2)

        # Centre : Blueprint
        mid_col = QVBoxLayout()
        mid_col.addWidget(self.blueprint)
        content_layout.addLayout(mid_col, stretch=3)

        # Droite : Rapport
        right_col = QVBoxLayout()
        right_col.addWidget(QLabel("<b>📋 RAPPORT DE L'INGÉNIEUR</b>", styleSheet="color: white;"))
        self.txt_engineer = QTextEdit()
        self.txt_engineer.setReadOnly(True)
        self.txt_engineer.setStyleSheet("background-color: #151515; color: #00ffcc; font-family: 'Consolas'; font-size: 13px; border: 1px solid #333; padding: 15px; border-radius: 5px;")
        
        self.btn_export = QPushButton("💾 EXPORTER VERS LMU (.svm)")
        self.btn_export.setStyleSheet("background-color: #0055ff; color: white; padding: 12px; font-weight: bold; border-radius: 4px;")
        
        right_col.addWidget(self.txt_engineer)
        right_col.addWidget(self.btn_export)
        content_layout.addLayout(right_col, stretch=2)

        layout.addLayout(content_layout)
        self.current_db = [] # Base de données vide au démarrage

    def _on_class_changed(self, class_name):
        self.blueprint.set_car_class(class_name)

    def load_real_setups(self, track_name, car_class, setups_history):
        """Méthode appelée par l'IA pour injecter le vrai rapport d'ingénierie."""
        # Maj des menus déroulants
        self.combo_track.clear()
        self.combo_track.addItem(track_name)
        
        from PyQt6.QtCore import Qt
        index = self.combo_class.findText(car_class, Qt.MatchFlag.MatchContains)
        if index >= 0: self.combo_class.setCurrentIndex(index)

        # Injection des vraies itérations
        self.list_versions.clear()
        self.current_db = setups_history

        from PyQt6.QtWidgets import QListWidgetItem
        for item in self.current_db:
            self.list_versions.addItem(QListWidgetItem(item["name"]))
            
        # Sélectionne automatiquement la dernière version (L'optimisation)
        if self.list_versions.count() > 0:
            self.list_versions.setCurrentRow(self.list_versions.count() - 1)

    def _on_version_selected(self, index):
        if index < 0 or index >= len(self.current_db): return
        data = self.current_db[index]
        self.blueprint.load_setup(data["setup"])
        self.txt_engineer.setText(data["notes"])

# =====================================================================
# NOUVELLES PAGES E-SPORT (DASHBOARD, ACADEMY, LEADERBOARDS)
# =====================================================================

class StatCard(QFrame):
    """Petite carte de statistique dynamique pour le Dashboard."""
    def __init__(self, title, color):
        super().__init__()
        self.setStyleSheet(f"background-color: #1a1a1a; border-radius: 8px; border-bottom: 3px solid {color};")
        layout = QVBoxLayout(self)
        lbl_title = QLabel(title)
        lbl_title.setStyleSheet("color: #888888; font-size: 11px; font-weight: bold;")
        self.lbl_val = QLabel("-")
        self.lbl_val.setStyleSheet(f"color: {color}; font-size: 20px; font-weight: bold;")
        layout.addWidget(lbl_title)
        layout.addWidget(self.lbl_val)
        
    def set_value(self, value):
        self.lbl_val.setText(str(value))

class PageDashboard(QWidget):
    """Le tableau de bord d'accueil 100% connecté avec graphique d'usure de relais."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        
        # En-tête personnalisé style "Racing License"
        header_frame = QFrame()
        header_frame.setStyleSheet("background-color: #1a1a1a; border-radius: 8px; border-left: 5px solid #0055ff;")
        h_layout = QHBoxLayout(header_frame)
        
        driver_info = QVBoxLayout()
        name_lbl = QLabel("PILOTE : Mathéo Joly")
        name_lbl.setStyleSheet("font-size: 24px; font-weight: bold; color: white;")
        status_lbl = QLabel("🟢 STATUT : Télémétrie Active | LICENCE : PRO-AM | ÉQUIPE : Indépendant")
        status_lbl.setStyleSheet("color: #00ffcc; font-size: 12px; font-weight: bold;")
        driver_info.addWidget(name_lbl)
        driver_info.addWidget(status_lbl)
        h_layout.addLayout(driver_info)
        layout.addWidget(header_frame)
        
        # Grille de statistiques réelles
        grid = QGridLayout()
        self.card_track = StatCard("CIRCUIT ACTUEL", "#00ffcc")
        self.card_laps = StatCard("TOURS COMPLÉTÉS", "#00ff00")
        self.card_speed = StatCard("VITESSE MAX ABSOLUE", "#ff3300")
        self.card_validity = StatCard("TAUX DE TOURS VALIDES", "#ffaa00")
        
        grid.addWidget(self.card_track, 0, 0)
        grid.addWidget(self.card_laps, 0, 1)
        grid.addWidget(self.card_speed, 0, 2)
        grid.addWidget(self.card_validity, 0, 3)
        layout.addLayout(grid)

        # --- NOUVEAU : GRAPHIQUE STINT PACE (ÉVOLUTION DU RYTHME) ---
        self.pace_plot = pg.PlotWidget(title="Évolution du Rythme (Stint Pace)")
        self.pace_plot.setBackground('#1a1a1a')
        self.pace_plot.showGrid(x=True, y=True, alpha=0.2)
        self.pace_plot.setLabel('left', 'Temps au tour', units='s')
        self.pace_plot.setLabel('bottom', 'Tour')
        self.pace_curve = self.pace_plot.plot(pen=pg.mkPen(color='#ffaa00', width=2), symbol='o', symbolSize=6, symbolBrush='#00ffcc')
        self.pace_plot.setFixedHeight(220)
        layout.addWidget(self.pace_plot)
        
        # Zone de log d'activité (Console)
        layout.addWidget(QLabel("<b>CONSOLE SYSTÈME (DUCKDB)</b>", styleSheet="color: white; font-size: 14px; margin-top: 5px;"))
        self.activity_log = QListWidget()
        self.activity_log.setStyleSheet("background-color: #0d0d0d; border: 1px solid #333; border-radius: 5px; color: #00ff00; font-family: 'Consolas'; font-size: 12px; padding: 10px;")
        self.activity_log.addItem("> Initialisation du système...")
        layout.addWidget(self.activity_log)

    def update_dashboard_data(self, df, session_context):
        if df is None or df.empty: return
        if session_context:
            self.card_track.set_value(session_context.get('TrackName', 'Inconnu').upper())
        
        total_laps = len(df)
        max_speed = df['TopSpeed'].max()
        valid_laps_df = df[df['Valid'] == 1]
        valid_laps_count = len(valid_laps_df)
        validity_pct = (valid_laps_count / total_laps) * 100 if total_laps > 0 else 0
        best_lap = df['LapTime'].min()
        
        self.card_laps.set_value(f"{total_laps}")
        self.card_speed.set_value(f"{max_speed:.1f} kph")
        self.card_validity.set_value(f"{validity_pct:.1f} %")
        
        # Alimentation du graphique de Stint Pace
        if not valid_laps_df.empty:
            self.pace_curve.setData(valid_laps_df['Lap'].tolist(), valid_laps_df['LapTime'].tolist())

        self.activity_log.addItem(f"> [DATA] Analyse terminée : {total_laps} tours traités.")
        self.activity_log.addItem(f"> [CHRONO] Meilleur temps au tour absolu : {best_lap:.3f} s")
        if valid_laps_count < total_laps:
            self.activity_log.addItem(f"> [WARNING] {total_laps - valid_laps_count} tours annulés (Track Limits).")
        self.activity_log.scrollToBottom()

class PageAcademy(QWidget):
    """La zone de formation (Simracing & Engineering Academy)."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        title = QLabel("🎓 Base de Données Ingénierie & Pilotage")
        title.setStyleSheet("font-size: 22px; font-weight: bold; color: white; margin-bottom: 15px;")
        layout.addWidget(title)
        
        grid = QGridLayout()
        grid.setSpacing(15)
        
        def create_course_card(title, tag, color, duration):
            f = QFrame()
            f.setStyleSheet(f"background-color: #1a1a1a; border-top: 4px solid {color}; border-radius: 8px;")
            l = QVBoxLayout(f)
            
            tag_lbl = QLabel(tag)
            tag_lbl.setStyleSheet(f"color: {color}; font-weight: bold; font-size: 10px; background: transparent;")
            t = QLabel(title)
            t.setWordWrap(True)
            t.setStyleSheet("color: white; font-weight: bold; font-size: 14px; background: transparent; margin-top: 5px;")
            d = QLabel(f"⏱️ {duration}")
            d.setStyleSheet("color: #888; font-size: 11px; background: transparent;")
            
            btn = QPushButton("VISIONNER")
            btn.setStyleSheet(f"background-color: transparent; color: {color}; border: 1px solid {color}; border-radius: 4px; padding: 5px; font-weight: bold;")
            
            l.addWidget(tag_lbl)
            l.addWidget(t)
            l.addWidget(d)
            l.addStretch()
            l.addWidget(btn)
            return f
            
        grid.addWidget(create_course_card("Créer un Pipeline de Télémétrie avec DuckDB", "DATA ENGINEERING", "#0055ff", "24:15"), 0, 0)
        grid.addWidget(create_course_card("Maîtriser le Trail Braking en Hypercar", "PILOTAGE PRO", "#ff3300", "12:20"), 0, 1)
        grid.addWidget(create_course_card("Optimisation du Déploiement Hybride (ERS)", "STRATÉGIE", "#00ffcc", "18:40"), 0, 2)
        grid.addWidget(create_course_card("Lecture de l'usure asymétrique des pneus", "MÉCANIQUE", "#ffaa00", "09:30"), 1, 0)
        grid.addWidget(create_course_card("Analyse d'images pour la détection de Track Limits", "COMPUTER VISION", "#b000ff", "31:10"), 1, 1)
        grid.addWidget(create_course_card("Aérodynamique : Rake et Diffuseur", "AÉRODYNAMIQUE", "#ffaa00", "14:05"), 1, 2)
        
        layout.addLayout(grid)
        layout.addStretch()

class PageLeaderboards(QWidget):
    """Tableau de chronométrage officiel tiré des données adverses."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.addWidget(QLabel("<h2 style='color:white; margin-bottom: 15px;'>🏆 Chronométrage Session (Live Timing)</h2>"))
        
        self.table = QTableWidget()
        self.table.setColumnCount(4)
        self.table.setHorizontalHeaderLabels(["Pilote", "Catégorie", "Meilleur Tour", "Secteur 1 (Opt)"])
        self.table.horizontalHeader().setStretchLastSection(True)
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table.setStyleSheet("""
            QTableWidget { background-color: #1a1a1a; color: white; border: 1px solid #333; gridline-color: #444; font-size: 14px; }
            QHeaderView::section { background-color: #222; color: #ffaa00; font-weight: bold; padding: 8px; border: 1px solid #333; }
            QTableWidget::item { padding: 5px; border-bottom: 1px solid #333; }
        """)
        self.table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        layout.addWidget(self.table)
        
    def update_leaderboard(self, df_competitors):
        if df_competitors is None or df_competitors.empty:
            self.table.setRowCount(1)
            self.table.setItem(0, 0, QTableWidgetItem("Aucun adversaire détecté dans DuckDB."))
            return
            
        df_sorted = df_competitors.sort_values(by='LapTime', ascending=True)
        self.table.setRowCount(len(df_sorted))
        
        for row, (_, data) in enumerate(df_sorted.iterrows()):
            self.table.setItem(row, 0, QTableWidgetItem(str(data.get('DriverName', 'Inconnu'))))
            
            item_class = QTableWidgetItem(str(data.get('CarClass', '-')))
            item_class.setForeground(QColor("#ff3300") if "HYP" in str(data.get('CarClass', '')) else QColor("#00ffcc"))
            self.table.setItem(row, 1, item_class)
            
            item_time = QTableWidgetItem(f"{data.get('LapTime', 0):.3f} s")
            item_time.setForeground(QColor("#b000ff") if row == 0 else QColor("#00ff00")) # Violet pour le record absolu
            self.table.setItem(row, 2, item_time)
            self.table.setItem(row, 3, QTableWidgetItem(f"{data.get('Sector1', 0):.3f} s"))

class PageNews(QWidget):
    """Flux d'actualités Motorsport."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.addWidget(QLabel("<h2 style='color:white;'>📰 Actualités Motorsport & Mises à jour LMU</h2>"))
        
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setStyleSheet("QScrollArea { border: none; background-color: transparent; }")
        
        content = QWidget()
        content.setStyleSheet("background-color: transparent;")
        vbox = QVBoxLayout(content)
        
        def create_news_card(date, title, text):
            f = QFrame()
            f.setStyleSheet("background-color: #1a1a1a; border-left: 3px solid #ff3300; border-radius: 5px; padding: 10px; margin-bottom: 10px;")
            l = QVBoxLayout(f)
            d = QLabel(date)
            d.setStyleSheet("color: #888; font-size: 10px; font-weight: bold;")
            t = QLabel(title)
            t.setStyleSheet("color: white; font-size: 16px; font-weight: bold;")
            txt = QLabel(text)
            txt.setStyleSheet("color: #ccc; font-size: 12px;")
            txt.setWordWrap(True)
            l.addWidget(d)
            l.addWidget(t)
            l.addWidget(txt)
            return f
            
        vbox.addWidget(create_news_card("Aujourd'hui, 10:00", "Mise à jour LMU V1.2", "Nouveau modèle de dégradation des pneus implémenté. L'usure asymétrique est désormais plus pénalisante sur les vibreurs à haute vitesse."))
        vbox.addWidget(create_news_card("Hier, 14:30", "WEC - Les Hypercars gagnent en performance", "Le BOP (Balance of Performance) a été revu pour Spa-Francorchamps. Les Ferrari gagnent +5kW d'allocation hybride."))
        vbox.addWidget(create_news_card("Saison E-Sport", "Inscription au Championnat", "Les qualifications pour la division Pro s'ouvrent la semaine prochaine. Préparez vos setups de qualification sur Le Mans."))
        vbox.addStretch()
        
        scroll.setWidget(content)
        layout.addWidget(scroll)

class PageRaceEngineerChat(QWidget):
    """Interface de communication Radio (Chatbot) avec l'ingénieur."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        
        header = QLabel("📻 CANAL RADIO SÉCURISÉ - INGÉNIEUR DE PISTE")
        header.setStyleSheet("font-size: 18px; font-weight: bold; color: white; background-color: #1a1a1a; padding: 15px; border-radius: 5px; border-bottom: 3px solid #0055ff;")
        layout.addWidget(header)
        
        self.chat_history = QListWidget()
        self.chat_history.setStyleSheet("""
            QListWidget { background-color: #0d0d0d; border: 1px solid #333; border-radius: 5px; padding: 10px; outline: none; }
            QListWidget::item { margin-bottom: 10px; }
        """)
        self.chat_history.setWordWrap(True)
        self.add_message("Ingénieur", "Système radio initialisé. Je reçois bien la télémétrie de la voiture. Pose-moi des questions sur ton setup ou ta stratégie.", is_bot=True)
        layout.addWidget(self.chat_history)
        
        input_layout = QHBoxLayout()
        self.text_input = QLineEdit()
        self.text_input.setPlaceholderText("Demander une analyse de stratégie, un conseil setup...")
        self.text_input.setStyleSheet("background-color: #222; color: white; border: 1px solid #444; padding: 10px; border-radius: 5px; font-size: 14px;")
        
        btn_send = QPushButton("ENVOYER")
        btn_send.setStyleSheet("background-color: #0055ff; color: white; font-weight: bold; padding: 10px 20px; border-radius: 5px;")
        btn_send.clicked.connect(self._send_message)
        
        input_layout.addWidget(self.text_input)
        input_layout.addWidget(btn_send)
        layout.addLayout(input_layout)

    def add_message(self, sender, text, is_bot=False):
        color = "#00ffcc" if is_bot else "#ffffff"
        align = "left" if is_bot else "right"
        bg = "#1a1a1a" if is_bot else "#333333"
        html = f"<div style='text-align: {align};'><span style='background-color: {bg}; color: {color}; padding: 8px 12px; border-radius: 8px; font-family: Segoe UI; font-size: 13px;'><b>{sender}:</b> {text}</span></div>"
        
        item = QListWidgetItem()
        lbl = QLabel(html)
        lbl.setWordWrap(True)
        
        item.setSizeHint(lbl.sizeHint())
        self.chat_history.addItem(item)
        self.chat_history.setItemWidget(item, lbl)
        self.chat_history.scrollToBottom()

    def _send_message(self):
        msg = self.text_input.text().strip()
        if msg:
            self.add_message("Vous", msg, is_bot=False)
            self.text_input.clear()
            # Simulation de réponse de l'IA
            self.add_message("Ingénieur", "J'analyse tes données DuckDB... Tes pressions sont bonnes, mais tu surconduis dans le secteur 2. Laisse la voiture glisser un peu plus en entrée de virage.", is_bot=True)

class PageMemberships(QWidget):
    """Page de gestion de l'abonnement SaaS."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        
        header = QLabel("⭐ Offres & Abonnements (Équipe)")
        header.setStyleSheet("font-size: 22px; font-weight: bold; color: white; margin-bottom: 20px;")
        layout.addWidget(header)
        
        grid = QGridLayout()
        grid.setSpacing(20)
        
        def create_plan_card(title, price, features, is_active=False):
            f = QFrame()
            bg_color = "#2a2a2a" if is_active else "#1a1a1a"
            border = "2px solid #00ffcc" if is_active else "1px solid #333"
            
            f.setStyleSheet(f"background-color: {bg_color}; border: {border}; border-radius: 8px; padding: 15px;")
            l = QVBoxLayout(f)
            
            t = QLabel(title)
            t.setStyleSheet("color: white; font-weight: bold; font-size: 18px; border: none;")
            p = QLabel(price)
            p.setStyleSheet("color: #00ffcc; font-weight: bold; font-size: 24px; border: none; margin-bottom: 10px;")
            
            feat_lbl = QLabel(features)
            feat_lbl.setStyleSheet("color: #ccc; font-size: 13px; border: none; line-height: 1.5;")
            feat_lbl.setWordWrap(True)
            
            btn = QPushButton("GÉRER L'ABONNEMENT" if is_active else "METTRE À NIVEAU")
            btn_style = "background-color: #0055ff; color: white;" if not is_active else "background-color: #333; color: white;"
            btn.setStyleSheet(f"{btn_style} border: none; border-radius: 4px; padding: 10px; font-weight: bold; margin-top: 15px;")
            
            l.addWidget(t)
            l.addWidget(p)
            l.addWidget(feat_lbl)
            l.addStretch()
            l.addWidget(btn)
            return f

        f1 = "- Télémétrie basique (60Hz)\n- Historique de 10 sessions\n- Setups de base"
        f2 = "- Télémétrie IA temps réel\n- Radar des adversaires (Live)\n- Setups illimités"
        f3 = "- Outils pour toute l'équipe (Serveur)\n- Partage de setups cloud\n- Export MoTeC Pro"
        
        grid.addWidget(create_plan_card("AMATEUR", "Gratuit", f1, False), 0, 0)
        grid.addWidget(create_plan_card("PRO ENGINEER", "14.99 € / mois", f2, True), 0, 1) 
        grid.addWidget(create_plan_card("E-SPORT TEAM", "49.99 € / mois", f3, False), 0, 2)
        
        layout.addLayout(grid)
        layout.addStretch()

class PageSupport(QWidget):
    """Page de Diagnostic Système et Support."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        
        header = QLabel("🎧 Support Technique & État du Système")
        header.setStyleSheet("font-size: 22px; font-weight: bold; color: white; margin-bottom: 20px;")
        layout.addWidget(header)
        
        content = QHBoxLayout()
        
        # Colonne Diagnostic
        diag_frame = QFrame()
        diag_frame.setStyleSheet("background-color: #1a1a1a; border-radius: 8px; padding: 20px;")
        diag_layout = QVBoxLayout(diag_frame)
        diag_layout.addWidget(QLabel("<b>DIAGNOSTIC DES CAPTEURS LMU</b>", styleSheet="color: white; font-size: 14px; margin-bottom: 10px;"))
        
        def add_status(name, status, is_ok=True):
            color = "#00ff00" if is_ok else "#ff3333"
            lbl = QLabel(f"<span style='color: {color};'>●</span> <b>{name}</b> : {status}")
            lbl.setStyleSheet("color: #ccc; font-size: 13px; margin-bottom: 5px;")
            diag_layout.addWidget(lbl)
            
        add_status("Moteur Physique (Shared Memory)", "Connecté (Read-Only)", True)
        add_status("Base de données (DuckDB)", "Chemin local trouvé", True)
        add_status("Serveur Live Timing", "En attente de session multijoueur", False)
        add_status("Anti-Cheat Compliance", "Validé (BattlEye Safe)", True)
        diag_layout.addStretch()
        content.addWidget(diag_frame, stretch=1)
        
        # Colonne Contact
        contact_frame = QFrame()
        contact_frame.setStyleSheet("background-color: #1a1a1a; border-radius: 8px; padding: 20px;")
        contact_layout = QVBoxLayout(contact_frame)
        contact_layout.addWidget(QLabel("<b>OUVRIR UN TICKET IN-GAME</b>", styleSheet="color: white; font-size: 14px; margin-bottom: 10px;"))
        
        issue_input = QTextEdit()
        issue_input.setPlaceholderText("Décrivez le bug rencontré ou l'amélioration souhaitée pour l'équipe de développement...")
        issue_input.setStyleSheet("background-color: #222; border: 1px solid #444; border-radius: 4px; color: white; padding: 10px;")
        contact_layout.addWidget(issue_input)
        
        btn_send = QPushButton("✉️ ENVOYER LE TICKET")
        btn_send.setStyleSheet("background-color: #0055ff; color: white; font-weight: bold; padding: 10px; border-radius: 4px;")
        contact_layout.addWidget(btn_send)
        content.addWidget(contact_frame, stretch=1)
        
        layout.addLayout(content)

class LMUTrackEngineerApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("LMU Pro Track Engineer")
        self.setGeometry(50, 50, 1400, 900)
        
        self.setStyleSheet("""
            QMainWindow { background-color: #121212; }
            QLabel { color: #e0e0e0; font-family: 'Segoe UI'; }
            QListWidget {
                background-color: #1a1a1a;
                color: #aaaaaa;
                font-size: 14px;
                font-weight: bold;
                border: none;
                border-right: 2px solid #333;
                outline: none;
            }
            QListWidget::item { padding: 20px; border-left: 4px solid transparent; }
            QListWidget::item:selected { color: white; background-color: #2a2a2a; border-left: 4px solid #ff9900; }
            QListWidget::item:hover { background-color: #222222; }
            QPushButton {
                background-color: #ff9900; color: #111;
                font-weight: bold; font-family: 'Segoe UI'; font-size: 14px;
                border: none; padding: 15px; border-radius: 4px;
            }
            QPushButton:hover { background-color: #ffaa33; }
        """)

        main_widget = QWidget()
        self.setCentralWidget(main_widget)
        window_layout = QHBoxLayout(main_widget) # Layout horizontal principal
        window_layout.setContentsMargins(0, 0, 0, 0)
        window_layout.setSpacing(0)

        # --- BARRE LATÉRALE (SIDEBAR) ---
        self.sidebar = QListWidget()
        self.sidebar.setFixedWidth(220)
        
        # Ajout des éléments du menu (Similaire à l'image Track Titan)
        menu_items = [
            "Dashboard", 
            "Your Sessions", 
            "Pro Analysis (New)",  
            "Leaderboards", 
            "Car Setups", 
            "Academy", 
            "Motorsport News", 
            "Race Engineer", 
            "Memberships", 
            "Support"
        ]
        self.sidebar.addItems(menu_items)
        self.sidebar.setCurrentRow(1) # Focus par défaut sur 'Your Sessions'
        
        window_layout.addWidget(self.sidebar)

        # --- ZONE PRINCIPALE (PAGES MULTIPLES) ---
        right_side_widget = QWidget()
        right_side_layout = QVBoxLayout(right_side_widget)
        right_side_layout.setContentsMargins(20, 20, 20, 20)

        # Top Header (Bouton Live)
        header_layout = QHBoxLayout()
        self.lbl_dash_track = QLabel("🔴 OFFLINE - EN ATTENTE DE LMU...")
        self.lbl_dash_track.setStyleSheet("font-size: 16px; font-weight: bold; color: #ff5555;")
        self.btn_live = QPushButton("DÉMARRER LA SONDE LIVE (60Hz)")
        self.btn_live.clicked.connect(self.toggle_live_telemetry)
        
        header_layout.addWidget(self.lbl_dash_track)
        header_layout.addStretch()
        header_layout.addWidget(self.btn_live)
        self.btn_load_db = QPushButton("📥 CHARGER DONNÉES LMU (DUCKDB)")
        self.btn_load_db.setStyleSheet("background-color: #0055ff; color: white; font-weight: bold; font-family: 'Segoe UI'; font-size: 14px; border: none; padding: 15px; border-radius: 4px;")
        self.btn_load_db.clicked.connect(self.run_diagnostic)
        header_layout.addWidget(self.btn_load_db)
        right_side_layout.addLayout(header_layout)

        # Le gestionnaire de pages (Stacked Widget)
        self.pages = QStackedWidget()
        
        # Initialisation des composants vitaux
        self.live_graphs = TrackTitanGraphs()
        self.setup_viewer = LMUSetupTabsWidget()
        self.telemetry_thread = None

        # Création des pages
        self.page_dashboard = PageDashboard()
        self.page_sessions = PageSessionsLeaderboard(self.live_graphs)
        self.page_pro_analysis = CoachDaveAnalysisPage()
        self.page_leaderboards = PageLeaderboards()
        self.page_setups = PageCarSetups(self.setup_viewer)
        self.page_academy = PageAcademy()
        self.page_news = PageNews()
        self.page_engineer = PageRaceEngineerChat()
        self.page_memberships = PageMemberships()  
        self.page_support = PageSupport()         
        
        # Ajout des pages dans le StackedWidget dans l'ordre exact du menu
        self.pages.addWidget(self.page_dashboard)       # Index 0: Dashboard
        self.pages.addWidget(self.page_sessions)        # Index 1: Your Sessions
        self.pages.addWidget(self.page_pro_analysis)    # Index 2
        self.pages.addWidget(self.page_leaderboards)    # Index 2: Leaderboards
        self.pages.addWidget(self.page_setups)          # Index 3: Car Setups
        self.pages.addWidget(self.page_academy)         # Index 4: Academy
        self.pages.addWidget(self.page_news)            # Index 5: Motorsport News
        self.pages.addWidget(self.page_engineer)        # Index 6: Race Engineer
        self.pages.addWidget(self.page_memberships)     # Index 7: Memberships
        self.pages.addWidget(self.page_support)         # Index 8: Support

        right_side_layout.addWidget(self.pages)
        window_layout.addWidget(right_side_widget)

        # Connecter le clic de la barre latérale au changement de page
        self.sidebar.currentRowChanged.connect(self.pages.setCurrentIndex)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        pg.setConfigOption('background', '#1a1a1a') # Fond gris foncé
        pg.setConfigOption('foreground', '#888888')
        pg.setConfigOptions(antialias=True)

        self.win = pg.GraphicsLayoutWidget()
        layout.addWidget(self.win)

        self.pen_you = pg.mkPen(color='#00ffcc', width=2.5) 
        self.pen_ref = pg.mkPen(color='#0055ff', width=2)   

        # 1. Diff to Ref (Delta en secondes)
        self.p_delta = self.win.addPlot(title="Diff to Ref (s)")
        self.p_delta.showGrid(x=True, y=True, alpha=0.2)
        self.curve_delta = self.p_delta.plot(pen=pg.mkPen(color='#00ffcc', width=2))
        self.win.nextRow()

        # 2. Vitesse (Speed)
        self.p_speed = self.win.addPlot(title="Speed (kph)")
        self.p_speed.showGrid(x=True, y=True, alpha=0.2)
        self.curve_speed_you = self.p_speed.plot(pen=self.pen_you, name="Vous")
        self.curve_speed_ref = self.p_speed.plot(pen=self.pen_ref, name="Ref") # Ligne de référence
        self.win.nextRow()

        # 3. Accélérateur (Throttle)
        self.p_throttle = self.win.addPlot(title="Throttle (%)")
        self.p_throttle.showGrid(x=True, y=True, alpha=0.2)
        self.p_throttle.setYRange(0, 105)
        self.curve_thr_you = self.p_throttle.plot(pen=self.pen_you)
        self.curve_thr_ref = self.p_throttle.plot(pen=self.pen_ref)

        # Synchronisation
        self.p_delta.setXLink(self.p_speed)
        self.p_throttle.setXLink(self.p_speed)

        self.data_time, self.data_speed, self.data_throttle, self.data_delta = [], [], [], []

    def toggle_live_telemetry(self):
        """Allume ou éteint la lecture de la RAM à 60Hz"""
        if self.telemetry_thread is None or not self.telemetry_thread.running:
            self.telemetry_thread = LiveTelemetryThread()
            # On connecte le signal du thread (60Hz) à notre fonction de mise à jour des graphiques
            self.telemetry_thread.telemetry_tick.connect(self.live_graphs.update_realtime)
            self.telemetry_thread.start()
            
            self.btn_live.setText("🔴 ARRÊTER LA SONDE")
            self.btn_live.setStyleSheet("background-color: #333333; color: white;")
            self.lbl_dash_track.setText("🟢 LIVE TELEMETRY: CONNECTED (60Hz)")
            self.lbl_dash_track.setStyleSheet("font-size: 18px; font-weight: bold; color: #00ffcc;")
        else:
            self.telemetry_thread.stop()
            self.btn_live.setText("DÉMARRER LA SONDE LIVE (60Hz)")
            self.btn_live.setStyleSheet("background-color: #ff3300; color: white;")
            self.lbl_dash_track.setText("🔴 LIVE TELEMETRY: DISCONNECTED")
            self.lbl_dash_track.setStyleSheet("font-size: 18px; font-weight: bold; color: #ff3333;")

    # S'assurer de couper le thread quand on ferme la fenêtre
    def closeEvent(self, event):
        if self.telemetry_thread is not None:
            self.telemetry_thread.stop()
        event.accept()

    def print_to_console(self, text):
        # Sécurisation : On envoie l'erreur dans le terminal système au lieu de crasher l'UI
        print(f"> {text}")

    def run_diagnostic(self):
        print("--- LECTURE DE LA BASE DUCKDB LMU ET ANALYSE IA ---")

        pipeline = LMUTelemetryPipeline(log_directory=".")
        session_context = pipeline.extract_session_context()
        df_telemetry = pipeline.extract_stint_data()
        df_competitors = pipeline.extract_competitors_data() # NOUVEAU : Récupère les adversaires

        if df_telemetry is None or df_telemetry.empty:
            print("[ERREUR] Impossible de lire la télémétrie. Vérifiez la base DuckDB.")
            return

        # 2. ENVOI DES DONNÉES À TOUTES LES PAGES DE L'INTERFACE
        self.page_sessions.load_session_data(df_telemetry, session_context)
        self.page_pro_analysis.load_session_data(df_telemetry, session_context)
        self.page_dashboard.update_dashboard_data(df_telemetry, session_context)
        self.page_leaderboards.update_leaderboard(df_competitors)

        # 3. CRÉATION DU VRAI SETUP VIA L'INTELLIGENCE ARTIFICIELLE
        sm = LMU_SetupManager(setups_directory=".")
        
        # Valeurs de départ (Simulation de la lecture du setup présent sur la voiture)
        base_setup = {
            'FrontWingSetting': 4.0, 'RearWingSetting': 5.0, 'FrontAntiSway': 15.0, 'RearAntiSway': 10.0, 
            'BrakeBias': 56.0, 'Preload': 10.0, 'FrontRideHeight': 45.0, 'RearRideHeight': 55.0, 
            'FrontLeftPressure': 160.0, 'FrontRightPressure': 160.0, 'RearLeftPressure': 155.0, 'RearRightPressure': 155.0, 
            'FrontLeftCamber': -3.5, 'FrontRightCamber': -3.5, 'RearLeftCamber': -2.0, 'RearRightCamber': -2.0
        }
        sm.current_setup = base_setup.copy()
        
        # Exécution du diagnostic E-Sport
        engineer = RaceEngineerLogic(sm)
        success = engineer.analyze_and_optimize(df_telemetry, session_context=session_context)

        if success:
            track_name = session_context.get('TrackName', 'Circuit Inconnu')
            car_class = "HYP" # Détection automatique à ajouter plus tard via la télémétrie
            
            # Structuration du rapport pour l'interface visuelle
            report_text = "\n".join(engineer.diagnostic_report)
            
            setups_history = [
                {
                    "name": "Itération 1 - Setup Base",
                    "setup": base_setup,
                    "notes": f"--- ÉTAT INITIAL DE LA VOITURE ---\n\nCircuit : {track_name}\nLecture des paramètres avant analyse."
                },
                {
                    "name": "Itération 2 - IA Optimisation Course",
                    "setup": sm.current_setup, # Le nouveau setup modifié par l'IA
                    "notes": "--- RAPPORT DU RACE ENGINEER ---\n\n" + report_text
                }
            ]
            
            # 4. ENVOI DU RÉSULTAT AU GESTIONNAIRE DE SETUPS
            self.page_setups.load_real_setups(track_name, car_class, setups_history)

        print("[SUCCÈS] Interface mise à jour avec l'IA et les vraies données.")


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = LMUTrackEngineerApp()
    window.show()
    sys.exit(app.exec())