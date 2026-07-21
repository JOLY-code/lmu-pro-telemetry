import pyttsx3
import queue
import threading
import time

class AudioSpotter(threading.Thread):
    def __init__(self):
        super().__init__()
        self.msg_queue = queue.Queue()
        self.running = True
        # Dictionnaire pour garder en mémoire la dernière fois qu'on a dit une phrase
        self.cooldowns = {}

    def run(self):
        # L'initialisation du moteur TTS doit impérativement se faire DANS le Thread
        # pour éviter les crashs de communication COM sur Windows.
        engine = pyttsx3.init()
        
        # On règle la voix en anglais (jargon sport auto) et on accélère un peu le débit
        engine.setProperty('rate', 170)
        
        print("[AUDIO] Radio de l'Ingénieur connectée.")

        while self.running:
            try:
                # On attend une alerte pendant 0.5s, sinon on reboucle
                msg, msg_type, cooldown_time = self.msg_queue.get(timeout=0.5)
                
                # Système anti-spam (Cooldown massif pour l'endurance)
                now = time.time()
                if msg_type in self.cooldowns and now - self.cooldowns[msg_type] < cooldown_time:
                    continue 
                    
                self.cooldowns[msg_type] = now
                engine.say(msg)
                engine.runAndWait()
                
            except queue.Empty:
                pass
            except Exception as e:
                print(f"[AUDIO ERROR] Problème de synthèse vocale : {e}")

    def say(self, message, msg_type="general", cooldown=10):
        """Envoie un message vocal dans la file d'attente."""
        if self.running:
            self.msg_queue.put((message, msg_type, cooldown))

    def stop(self):
        self.running = False
        self.join()