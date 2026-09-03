import pyttsx3
import queue
import threading
import time

class AudioSpotter(threading.Thread):
    def __init__(self):
        super().__init__()
        self.msg_queue = queue.Queue()
        self.running = True
        self.cooldowns = {}

    def run(self):
        engine = pyttsx3.init()
        engine.setProperty('rate', 165) # Un tout petit peu plus lent pour le réalisme radio
        
        # --- NOUVEAU : FORCER LA VOIX ANGLAISE (US ou UK) ---
        voices = engine.getProperty('voices')
        for voice in voices:
            if 'EN-GB' in voice.id.upper() or 'EN-US' in voice.id.upper() or 'ENGLISH' in voice.name.upper():
                engine.setProperty('voice', voice.id)
                break
        
        print("[AUDIO] Radio de l'Ingénieur connectée.")
        # Message automatique pour vérifier que le son marche au lancement
        engine.say("Radio check. Engineer connected.")
        engine.runAndWait()

        while self.running:
            try:
                msg, msg_type, cooldown_time = self.msg_queue.get(timeout=0.5)
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
        if self.running:
            self.msg_queue.put((message, msg_type, cooldown))

    def stop(self):
        self.running = False
        self.join()