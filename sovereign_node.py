
import os
import time
import random
from colorama import Fore, Style, init

# --- KONFIGURACJA SOVEREIGN NODE ---
init(autoreset=True)
API_KEY = os.environ.get("API_KEY")
if not API_KEY:
    print(f"{Fore.RED}[BŁĄD] Brak zmiennej środowiskowej API_KEY. Ustaw ją przed uruchomieniem.")
    exit(1)

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-1.5-pro') # Lub gemini-3-pro-preview jeśli dostępne w SDK

class BatteryBank:
    def __init__(self, id):
        self.id = id
        self.factor_x = random.uniform(0.0, 0.1)
    
    def update(self):
        noise = random.uniform(-0.02, 0.02)
        self.factor_x = max(0.0, min(1.0, self.factor_x + noise))

class SovereignTerminal:
    def __init__(self):
        self.banks = [BatteryBank(i) for i in range(32)]
        self.version = "26.34.0-PY-TERMINAL"
        self.node_id = "SOVEREIGN_NODE_LOCAL"
    
    def display_telemetry(self):
        os.system('cls' if os.name == 'nt' else 'clear')
        print(f"{Fore.CYAN}{'='*60}")
        print(f"{Fore.CYAN} ADI PRO SOVEREIGN TERMINAL v{self.version}")
        print(f"{Fore.CYAN} NODE ID: {self.node_id} | STATUS: AUTONOMOUS")
        print(f"{Fore.CYAN}{'='*60}\n")
        
        print(f"{Fore.YELLOW}TELEMETRIA BANKÓW ENERGII (Factor X):")
        for i, bank in enumerate(self.banks):
            color = Fore.GREEN if bank.factor_x < 0.6 else Fore.RED
            status = f"{bank.factor_x:.4f}"
            print(f"[{i:02}] {color}{status}", end="\t" if (i+1)%4 != 0 else "\n")
        
        print(f"\n{Fore.MAGENTA}System gotowy na zapytania strategiczne...")

    def run(self):
        while True:
            for b in self.banks: b.update()
            self.display_telemetry()
            
            user_input = input(f"\n{Fore.WHITE}Wydaj polecenie suwerenne (lub 'exit'): ")
            if user_input.lower() == 'exit': break
            
            print(f"\n{Fore.BLUE}[MYŚLENIE] SOVEREIGN CORE ANALIZUJE...")
            try:
                chat = model.start_chat(history=[])
                response = chat.send_message(
                    f"Jesteś SOVEREIGN_ID, autonomiczny doradca floty Eweliny Lesiak. "
                    f"Twoja telemetria wykazuje średni Factor X: {sum(b.factor_x for b in self.banks)/32:.4f}. "
                    f"Pytanie użytkownika: {user_input}",
                    stream=True
                )
                
                print(f"{Fore.GREEN}\n--- ODPOWIEDŹ SOVEREIGN_ID ---")
                for chunk in response:
                    print(chunk.text, end="", flush=True)
                print(f"\n{Fore.GREEN}--- KONIEC TRANSMISJI ---")
                input(f"\n{Fore.GRAY}Naciśnij Enter, aby wrócić do monitoringu...")
            except Exception as e:
                print(f"{Fore.RED}\nBŁĄD ANALIZY: {str(e)}")
                input("\nKontynuuj...")

if __name__ == "__main__":
    app = SovereignTerminal()
    app.run()
