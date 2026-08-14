import cv2
import mediapipe as mp
import numpy as np
import socket
import struct
import math
import time

# --- CONFIGURATION RÉSEAU ---
UDP_IP = "127.0.0.1"
UDP_PORT = 4242
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# --- RÉGLAGES DE CONDUITE (Ajustables) ---
SMOOTHING = 0.15      # Fluidité (0.05 = Lisse mais lent | 0.30 = Réactif mais nerveux)
SENSITIVITY = 0.5     # Divise par 2 la vitesse de rotation globale pour plus de précision

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
    refine_landmarks=False
)

# Modèle 3D du visage (Calibré en millimètres)
face_3d_model = np.array([
    [0.0, 0.0, 0.0],           # 0: Nez
    [0.0, 70.0, -20.0],        # 1: Menton
    [-40.0, -30.0, -20.0],     # 2: Oeil gauche
    [40.0, -30.0, -20.0],      # 3: Oeil droit
    [-20.0, 40.0, -20.0],      # 4: Lèvre gauche
    [20.0, 40.0, -20.0]        # 5: Lèvre droite
], dtype=np.float64)

# Variables de mémoire pour la stabilité PnP
rvec = np.zeros((3, 1), dtype=np.float64)
tvec = np.zeros((3, 1), dtype=np.float64)
is_tracking = False

def smooth_value(current, new, alpha=SMOOTHING):
    return (alpha * new) + ((1.0 - alpha) * current)

smooth_yaw, smooth_pitch, smooth_roll = 0.0, 0.0, 0.0

# Variables de Calibrage (Le Zéro absolu du baquet)
offset_yaw, offset_pitch, offset_roll = 0.0, 0.0, 0.0 

# --- NOUVELLES VARIABLES : AUTO-CALIBRATION ---
auto_calibrating = True
calib_frames = 0
calib_max_frames = 90  # Enregistre pendant ~3 secondes à 30 FPS
hist_yaw, hist_pitch, hist_roll = [], [], []

# Fenêtre glissante pour l'Auto-Centrage Dynamique (en roulant)
dynamic_history = []
# ----------------------------------------------

cap = cv2.VideoCapture(0)

print("[SYSTEM] Tracker SimRacing Prêt.")
print("[SYSTEM] Création du fichier de log télémétrique...")
log_file = open("lmu_headtracking_logs.txt", "w")
log_file.write("Time(s),Raw_Yaw,Raw_Pitch,Raw_Roll,Smooth_Yaw,Smooth_Pitch,Smooth_Roll,Offset_Yaw\n")
start_time = time.time()

while cap.isOpened():
    success, image = cap.read()
    if not success: break

    image = cv2.flip(image, 1)
    img_h, img_w, img_c = image.shape
    image = cv2.convertScaleAbs(image, alpha=1.2, beta=20)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    results = face_mesh.process(image_rgb)

    if results.multi_face_landmarks:
        face_landmarks = results.multi_face_landmarks[0]
        face_2d = np.array([[int(face_landmarks.landmark[idx].x * img_w), int(face_landmarks.landmark[idx].y * img_h)] 
                            for idx in [1, 152, 33, 263, 61, 291]], dtype=np.float64)

        focal_length = 1.0 * img_w
        cam_matrix = np.array([[focal_length, 0, img_w / 2], [0, focal_length, img_h / 2], [0, 0, 1]], dtype=np.float64)
        dist_matrix = np.zeros((4, 1), dtype=np.float64)

        if not is_tracking:
            success, rvec, tvec = cv2.solvePnP(face_3d_model, face_2d, cam_matrix, dist_matrix)
            is_tracking = success
        else:
            success, rvec, tvec = cv2.solvePnP(face_3d_model, face_2d, cam_matrix, dist_matrix, rvec, tvec, useExtrinsicGuess=True)

        if success:
            rmat, _ = cv2.Rodrigues(rvec)
            
            raw_pitch = math.asin(-rmat[1, 2]) * (180.0 / math.pi)
            raw_yaw = -(math.atan2(rmat[0, 2], rmat[2, 2]) * (180.0 / math.pi)) # Inversion miroir
            raw_roll = math.atan2(rmat[1, 0], rmat[1, 1]) * (180.0 / math.pi)

            # --- 1. L'ANALYSE ET AUTO-CALIBRATION ---
            if auto_calibrating:
                # Enregistrement des données dans le tableau
                hist_yaw.append(raw_yaw)
                hist_pitch.append(raw_pitch)
                hist_roll.append(raw_roll)
                calib_frames += 1
                
                # HUD d'information pendant la calibration
                cv2.putText(image, f"AUTO-CALIBRATION: {calib_frames}/{calib_max_frames}", (20, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 2)
                cv2.putText(image, "REGARDEZ DROIT DEVANT VOUS", (20, 190), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                
                if calib_frames >= calib_max_frames:
                    # Analyse mathématique : Moyenne des positions capturées
                    offset_yaw = np.mean(hist_yaw)
                    offset_pitch = np.mean(hist_pitch)
                    offset_roll = np.mean(hist_roll)
                    auto_calibrating = False
                    print(f"[SYSTEM] Calibration IA terminée. Zéro absolu défini.")
                
                # Pendant qu'il calibre, on force la vue au centre pour OpenTrack
                calibrated_yaw, calibrated_pitch, calibrated_roll = 0.0, 0.0, 0.0
            else:
                # Application normale
                calibrated_pitch = raw_pitch - offset_pitch
                calibrated_yaw = raw_yaw - offset_yaw
                calibrated_roll = raw_roll - offset_roll

                # AUTO-CENTRAGE DYNAMIQUE (Si tu bouges dans ton baquet en ligne droite)
                dynamic_history.append((raw_yaw, raw_pitch, raw_roll))
                if len(dynamic_history) > 60: # Fenêtre glissante d'environ 2 secondes
                    dynamic_history.pop(0)
                    
                    # Calcul de la variance spatiale (Es-tu parfaitement immobile ?)
                    yaw_var = np.var([h[0] for h in dynamic_history])
                    pitch_var = np.var([h[1] for h in dynamic_history])
                    
                    # Si la variance est quasi nulle (immobile en ligne droite), on ajuste doucement le zéro
                    if yaw_var < 0.1 and pitch_var < 0.1:
                        offset_yaw = smooth_value(offset_yaw, np.mean([h[0] for h in dynamic_history]), 0.01)
                        offset_pitch = smooth_value(offset_pitch, np.mean([h[1] for h in dynamic_history]), 0.01)
                        offset_roll = smooth_value(offset_roll, np.mean([h[2] for h in dynamic_history]), 0.01)
            # ----------------------------------------

            # 2. Application du limiteur de sensibilité et du lissage
            smooth_pitch = smooth_value(smooth_pitch, calibrated_pitch * SENSITIVITY)
            smooth_yaw = smooth_value(smooth_yaw, calibrated_yaw * SENSITIVITY)
            smooth_roll = smooth_value(smooth_roll, calibrated_roll * SENSITIVITY)

            # 3. Envoi UDP
            data = struct.pack("dddddd", 0.0, 0.0, 0.0, smooth_yaw, smooth_pitch, smooth_roll)
            sock.sendto(data, (UDP_IP, UDP_PORT))

            current_time = time.time() - start_time
            log_file.write(f"{current_time:.3f},{raw_yaw:.2f},{raw_pitch:.2f},{raw_roll:.2f},{smooth_yaw:.2f},{smooth_pitch:.2f},{smooth_roll:.2f},{offset_yaw:.2f}\n")

            # --- HUD ---
            cv2.rectangle(image, (10, 10), (350, 150), (0, 0, 0), -1)
            cv2.putText(image, "LMU TRACKER - CALIBRATED", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            cv2.putText(image, f"YAW   (G/D): {smooth_yaw:.1f} deg", (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(image, f"PITCH (H/B): {smooth_pitch:.1f} deg", (20, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(image, f"ROLL  (Inc): {smooth_roll:.1f} deg", (20, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            # Laser visuel
            nose_3d = np.array([[0.0, 0.0, 150.0]], dtype=np.float64)
            nose_proj, _ = cv2.projectPoints(nose_3d, rvec, tvec, cam_matrix, dist_matrix)
            cv2.line(image, (int(face_2d[0][0]), int(face_2d[0][1])), (int(nose_proj[0][0][0]), int(nose_proj[0][0][1])), (0, 0, 255), 3)

    else:
        is_tracking = False

    cv2.imshow('LMU - Tracker', image)

    if cv2.waitKey(5) & 0xFF == 27: # Touche ECHAP uniquement pour quitter
        break

cap.release()
cv2.destroyAllWindows()

log_file.close()
print("[SYSTEM] Télémétrie sauvegardée avec succès dans 'lmu_headtracking_logs.txt'")