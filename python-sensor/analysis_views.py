import pandas as pd
import numpy as np
import pyqtgraph as pg
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel, 
                             QFrame, QListWidget, QStackedWidget, QPushButton, QGridLayout, QListWidgetItem)
from PyQt6.QtCore import Qt

# Couleurs Thème Coach Dave Delta
BG_COLOR = "#181924"
PANEL_COLOR = "#212332"
TEXT_MAIN = "#ffffff"
TEXT_MUTED = "#a0a3b5"
ACCENT_BLUE = "#3a86ff"
THROTTLE_GREEN = "#2a9d8f"
BRAKE_RED = "#e76f51"
SECTOR_RED = "#9d2a2a"
SECTOR_GREEN = "#2a9d5c"
SECTOR_PURPLE = "#8338ec"

class BottomHUD(QFrame):
    """Le bandeau inférieur ultra-détaillé de la vue Driving (Coach Dave Style)."""
    def __init__(self):
        super().__init__()
        self.setStyleSheet(f"background-color: {PANEL_COLOR}; border-radius: 8px;")
        layout = QVBoxLayout(self)
        layout.setContentsMargins(15, 10, 15, 10)
        layout.setSpacing(8)

        # --- LIGNE 1 : Header (Temps, Météo, Fuel) ---
        header_layout = QHBoxLayout()
        self.lbl_my_lap_info = QLabel("⏱️ 0:00.000  💧 0%  ☁️ 25°C  ⛽ 0.0L")
        self.lbl_my_lap_info.setStyleSheet(f"color: {TEXT_MUTED}; font-size: 12px; font-weight: bold;")
        
        lbl_center = QLabel("MY LAP       <span style='color:{BRAKE_RED}; font-size:16px;'>+0.000</span>       REFERENCE")
        lbl_center.setAlignment(Qt.AlignmentFlag.AlignCenter)
        lbl_center.setStyleSheet(f"color: {ACCENT_BLUE}; font-size: 12px; font-weight: bold;")
        
        self.lbl_ref_lap_info = QLabel("⏱️ 0:00.000  💧 0%  ☁️ 25°C  ⛽ 0.0L")
        self.lbl_ref_lap_info.setStyleSheet(f"color: {TEXT_MUTED}; font-size: 12px; font-weight: bold;")
        self.lbl_ref_lap_info.setAlignment(Qt.AlignmentFlag.AlignRight)

        header_layout.addWidget(self.lbl_my_lap_info)
        header_layout.addWidget(lbl_center, stretch=1)
        header_layout.addWidget(self.lbl_ref_lap_info)
        layout.addLayout(header_layout)

        # --- LIGNE 2 : Télémétrie Instantanée (Volant, Pédales, Vitesse, Gear) ---
        telemetry_layout = QHBoxLayout()
        
        def create_pedal_bar(color, width=60):
            f = QFrame()
            f.setFixedSize(width, 15)
            f.setStyleSheet(f"background-color: #111; border: 1px solid #333; border-radius: 3px;")
            fill = QFrame(f)
            fill.setStyleSheet(f"background-color: {color}; border-radius: 2px;")
            fill.setFixedSize(int(width*0.8), 13) # Simulation de remplissage
            return f

        # Partie Gauche (MY LAP)
        telemetry_layout.addWidget(QLabel("🛞", styleSheet="font-size: 18px;"))
        telemetry_layout.addWidget(create_pedal_bar(THROTTLE_GREEN))
        telemetry_layout.addWidget(QLabel("97%", styleSheet=f"color: {THROTTLE_GREEN}; font-weight: bold;"))
        telemetry_layout.addWidget(create_pedal_bar(BRAKE_RED, 40))
        telemetry_layout.addWidget(QLabel("12%", styleSheet=f"color: {BRAKE_RED}; font-weight: bold;"))
        self.lbl_my_gear = QLabel("⚙️ 4")
        self.lbl_my_speed = QLabel("🚀 187 kmh")
        self.lbl_my_gear.setStyleSheet("color: white; font-weight: bold;")
        self.lbl_my_speed.setStyleSheet("color: white; font-weight: bold;")
        telemetry_layout.addWidget(self.lbl_my_gear)
        telemetry_layout.addWidget(self.lbl_my_speed)
        
        telemetry_layout.addStretch()
        
        # Partie Droite (REFERENCE)
        self.lbl_ref_speed = QLabel("🚀 187 kmh")
        self.lbl_ref_gear = QLabel("⚙️ 4")
        self.lbl_ref_speed.setStyleSheet("color: white; font-weight: bold;")
        self.lbl_ref_gear.setStyleSheet("color: white; font-weight: bold;")
        telemetry_layout.addWidget(self.lbl_ref_speed)
        telemetry_layout.addWidget(self.lbl_ref_gear)
        telemetry_layout.addWidget(QLabel("97%", styleSheet=f"color: {THROTTLE_GREEN}; font-weight: bold;"))
        telemetry_layout.addWidget(create_pedal_bar(THROTTLE_GREEN))
        telemetry_layout.addWidget(QLabel("12%", styleSheet=f"color: {BRAKE_RED}; font-weight: bold;"))
        telemetry_layout.addWidget(create_pedal_bar(BRAKE_RED, 40))
        telemetry_layout.addWidget(QLabel("🛞", styleSheet="font-size: 18px;"))
        
        layout.addLayout(telemetry_layout)

        # --- LIGNE 3 : Graphique Delta Overview ---
        self.overview_plot = pg.PlotWidget()
        self.overview_plot.setFixedHeight(60)
        self.overview_plot.setBackground('transparent')
        self.overview_plot.hideAxis('left')
        self.overview_plot.hideAxis('bottom')
        self.overview_curve = self.overview_plot.plot(pen=pg.mkPen(color=ACCENT_BLUE, width=2))
        layout.addWidget(self.overview_plot)

        # --- LIGNE 4 : Blocs Secteurs ---
        sectors_layout = QHBoxLayout()
        sectors_layout.setSpacing(5)
        
        def create_sector_block(name, delta, is_purple=False, is_green=False):
            f = QFrame()
            bg = SECTOR_PURPLE if is_purple else (SECTOR_GREEN if is_green else SECTOR_RED)
            f.setStyleSheet(f"background-color: {bg}; border-radius: 4px; padding: 5px;")
            l = QVBoxLayout(f)
            l.setContentsMargins(5, 2, 5, 2)
            lbl = QLabel(f"{name} {delta}")
            lbl.setStyleSheet("color: white; font-weight: bold; font-size: 11px;")
            lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            l.addWidget(lbl)
            return f

        sectors_layout.addWidget(create_sector_block("SQ1", "-0.13s", is_green=True))
        sectors_layout.addWidget(create_sector_block("SQ2", "+0.13s", is_green=False))
        sectors_layout.addWidget(create_sector_block("SQ3", "+0.13s", is_green=False))
        sectors_layout.addWidget(create_sector_block("SQ4", "+0.13s", is_green=False))
        sectors_layout.addWidget(create_sector_block("SQ5", "-0.12s", is_purple=True))
        sectors_layout.addWidget(create_sector_block("SQ6", "-0.13s", is_green=True))
        
        layout.addLayout(sectors_layout)

    def load_data(self, df):
        if df is None or df.empty: return
        # Simulation d'une courbe de delta pour l'overview
        x = np.linspace(0, 100, len(df))
        y = np.sin(x/10) * 0.5
        self.overview_curve.setData(x, y)


class DataTab(QWidget):
    """L'onglet 'DATA' avec les 3 graphiques empilés et la minimap."""
    def __init__(self):
        super().__init__()
        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # --- GAUCHE : Graphiques Empilés ---
        graphs_layout = QVBoxLayout()
        
        pg.setConfigOption('background', PANEL_COLOR)
        pg.setConfigOption('foreground', TEXT_MUTED)
        self.win = pg.GraphicsLayoutWidget()
        graphs_layout.addWidget(self.win)
        
        # Speed
        self.p_speed = self.win.addPlot()
        self.p_speed.setLabel('left', 'SPEED')
        self.p_speed.showGrid(y=True, alpha=0.2)
        self.curve_speed_ref = self.p_speed.plot(pen=pg.mkPen(color=TEXT_MUTED, width=1.5, style=Qt.PenStyle.DashLine))
        self.curve_speed_my = self.p_speed.plot(pen=pg.mkPen(color=ACCENT_BLUE, width=2))
        self.win.nextRow()
        
        # Throttle
        self.p_thr = self.win.addPlot()
        self.p_thr.setLabel('left', 'THROTTLE')
        self.p_thr.setYRange(0, 105)
        self.p_thr.showGrid(y=True, alpha=0.2)
        self.curve_thr_ref = self.p_thr.plot(pen=pg.mkPen(color=TEXT_MUTED, width=1.5, style=Qt.PenStyle.DashLine))
        self.curve_thr_my = self.p_thr.plot(pen=pg.mkPen(color=THROTTLE_GREEN, width=2))
        self.win.nextRow()
        
        # Brake
        self.p_brk = self.win.addPlot()
        self.p_brk.setLabel('left', 'BRAKE')
        self.p_brk.setYRange(0, 105)
        self.p_brk.showGrid(y=True, alpha=0.2)
        self.curve_brk_ref = self.p_brk.plot(pen=pg.mkPen(color=TEXT_MUTED, width=1.5, style=Qt.PenStyle.DashLine))
        self.curve_brk_my = self.p_brk.plot(pen=pg.mkPen(color=BRAKE_RED, width=2))
        
        self.p_thr.setXLink(self.p_speed)
        self.p_brk.setXLink(self.p_speed)
        
        layout.addLayout(graphs_layout, stretch=7)
        
        # --- DROITE : Minimap et Stints ---
        right_panel = QVBoxLayout()
        
        self.minimap = pg.PlotWidget()
        self.minimap.setBackground(PANEL_COLOR)
        self.minimap.hideAxis('left')
        self.minimap.hideAxis('bottom')
        self.map_curve = self.minimap.plot(pen=pg.mkPen(color=TEXT_MUTED, width=2))
        right_panel.addWidget(self.minimap, stretch=4)
        
        stints_frame = QFrame()
        stints_frame.setStyleSheet(f"background-color: {PANEL_COLOR}; border-radius: 8px;")
        stints_layout = QVBoxLayout(stints_frame)
        stints_layout.addWidget(QLabel("<b>STINTS / LAPS</b>", styleSheet="color: white;"))
        self.laps_list = QListWidget()
        self.laps_list.setStyleSheet("background: transparent; border: none; color: white; outline: none;")
        stints_layout.addWidget(self.laps_list)
        right_panel.addWidget(stints_frame, stretch=6)
        
        layout.addLayout(right_panel, stretch=3)

    def load_data(self, df):
        if df is None or df.empty: return
        x = df['Lap'].tolist() # Remplacer par la distance (mLapDist) quand dispo
        self.curve_speed_my.setData(x, df['TopSpeed'].tolist())
        self.curve_thr_my.setData(x, df['Throttle'].tolist())
        
        # Simulation d'un tour de référence
        self.curve_speed_ref.setData(x, df['TopSpeed'] * 1.02)
        
        self.laps_list.clear()
        for i, row in df.iterrows():
            item = QListWidgetItem(f"Lap {int(row['Lap'])}  -  {row['LapTime']:.3f} s")
            self.laps_list.addItem(item)


class DrivingTab(QWidget):
    """L'onglet 'DRIVING' avec la grande trajectoire et l'analyse IA."""
    def __init__(self):
        super().__init__()
        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # --- GAUCHE : INSIGHTS (Analyse Texte) ---
        insights_frame = QFrame()
        insights_frame.setStyleSheet(f"background-color: {PANEL_COLOR}; border-radius: 8px;")
        insights_layout = QVBoxLayout(insights_frame)
        
        header = QLabel("< SUMMARY        SQ6 <span style='color:red;'>+0.365</span> >")
        header.setStyleSheet("color: white; font-weight: bold; font-size: 14px; margin-bottom: 10px;")
        insights_layout.addWidget(header)
        
        txt = QLabel(
            "<span style='color:#3a86ff;'>ENTRY</span><br><br>"
            "Your entry speed was <b>8 kmh faster</b> than the reference. You compromised your braking.<br><br>"
            "<span style='color:#ffaa00;'>APEX</span><br><br>"
            "Your apex speed was <b>6 kmh slower</b>. You are in a gear lower than the reference.<br><br>"
            "<span style='color:#2a9d8f;'>EXIT</span><br><br>"
            "You lost <b>0.4s</b> on exit. Try a wider line to carry momentum."
        )
        txt.setWordWrap(True)
        txt.setStyleSheet(f"color: {TEXT_MUTED}; font-size: 13px; line-height: 1.4;")
        insights_layout.addWidget(txt)
        insights_layout.addStretch()
        layout.addWidget(insights_frame, stretch=2)
        
        # --- CENTRE : MAP GÉANTE + BOTTOM HUD ---
        center_layout = QVBoxLayout()
        
        self.big_map = pg.PlotWidget()
        self.big_map.setBackground('transparent')
        self.big_map.hideAxis('left')
        self.big_map.hideAxis('bottom')
        
        # Simulation d'une trajectoire
        t = np.linspace(0, 2*np.pi, 200)
        self.big_map.plot(np.cos(t)*100, np.sin(t)*50, pen=pg.mkPen(color=TEXT_MUTED, width=3)) # Ref
        self.big_map.plot(np.cos(t)*102, np.sin(t)*48, pen=pg.mkPen(color=ACCENT_BLUE, width=2)) # Toi
        
        center_layout.addWidget(self.big_map, stretch=7)
        
        self.bottom_hud = BottomHUD()
        center_layout.addWidget(self.bottom_hud, stretch=3)
        
        layout.addLayout(center_layout, stretch=6)
        
        # --- DROITE : STINTS ---
        stints_frame = QFrame()
        stints_frame.setStyleSheet(f"background-color: {PANEL_COLOR}; border-radius: 8px;")
        stints_layout = QVBoxLayout(stints_frame)
        stints_layout.addWidget(QLabel("<b>STINTS / LAPS</b>", styleSheet="color: white;"))
        self.laps_list = QListWidget()
        self.laps_list.setStyleSheet("background: transparent; border: none; color: white; outline: none;")
        stints_layout.addWidget(self.laps_list)
        layout.addWidget(stints_frame, stretch=2)

    def load_data(self, df):
        if df is None or df.empty: return
        self.bottom_hud.load_data(df)
        self.laps_list.clear()
        for i, row in df.iterrows():
            item = QListWidgetItem(f"Lap {int(row['Lap'])}  -  {row['LapTime']:.3f} s")
            self.laps_list.addItem(item)


class CoachDaveAnalysisPage(QWidget):
    """Le conteneur principal qui remplace PageSessionsLeaderboard."""
    def __init__(self):
        super().__init__()
        self.setStyleSheet(f"background-color: {BG_COLOR};")
        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # --- MENU VERTICAL INTERNE ---
        side_menu = QFrame()
        side_menu.setFixedWidth(80)
        side_menu.setStyleSheet(f"background-color: {PANEL_COLOR}; border-radius: 8px;")
        side_layout = QVBoxLayout(side_menu)
        
        self.btn_driving = QPushButton("🏎️\nDRIVING")
        self.btn_data = QPushButton("📊\nDATA")
        
        for btn in [self.btn_driving, self.btn_data]:
            btn.setStyleSheet(f"background-color: transparent; color: {TEXT_MUTED}; font-weight: bold; padding: 15px 0; border: none;")
            side_layout.addWidget(btn)
            
        side_layout.addStretch()
        layout.addWidget(side_menu)
        
        # --- VUES ---
        self.stack = QStackedWidget()
        self.driving_view = DrivingTab()
        self.data_view = DataTab()
        
        self.stack.addWidget(self.driving_view)
        self.stack.addWidget(self.data_view)
        layout.addWidget(self.stack)
        
        # Routing
        self.btn_driving.clicked.connect(lambda: self._switch_tab(0, self.btn_driving))
        self.btn_data.clicked.connect(lambda: self._switch_tab(1, self.btn_data))
        self._switch_tab(0, self.btn_driving) # Défaut

    def _switch_tab(self, index, active_btn):
        self.stack.setCurrentIndex(index)
        self.btn_driving.setStyleSheet(f"background-color: transparent; color: {TEXT_MUTED}; font-weight: bold; border: none;")
        self.btn_data.setStyleSheet(f"background-color: transparent; color: {TEXT_MUTED}; font-weight: bold; border: none;")
        active_btn.setStyleSheet(f"background-color: #111; color: {ACCENT_BLUE}; font-weight: bold; border-left: 3px solid {ACCENT_BLUE};")

    def load_session_data(self, df_telemetry, session_context):
        """Distribue les données aux deux sous-vues."""
        self.driving_view.load_data(df_telemetry)
        self.data_view.load_data(df_telemetry)