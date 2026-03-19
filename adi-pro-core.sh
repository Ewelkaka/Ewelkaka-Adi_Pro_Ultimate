
#!/bin/bash

# --- ADI PRO CORE v26.36.0 (SOVEREIGN ENGINE) ---
# Pure Autonomous Terminal Engine for Linux

# Kolory terminala
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Sprawdzenie zależności
if ! command -v jq &> /dev/null; then
    echo -e "${RED}[ERROR] Pakiet 'jq' nie jest zainstalowany. sudo apt install jq${NC}"
    exit 1
fi

if [ -z "$API_KEY" ]; then
    echo -e "${RED}[ERROR] Brak zmiennej API_KEY. Ustaw ją: export API_KEY=twój_klucz${NC}"
    exit 1
fi

clear
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}      ADI PRO CORE - AUTONOMOUS LINUX ENGINE v26.36${NC}"
echo -e "${CYAN}      ARCHITECT: EWELINA LESIAK | MODE: PURE_SOVEREIGN${NC}"
echo -e "${CYAN}============================================================${NC}"

# Funkcja symulacji Hadron Pulse
simulate_pulse() {
    echo -ne "${PURPLE}[HADRON_PULSE] Inicjacja fali 7.42Hz... "
    for i in {1..10}; do echo -ne "#"; sleep 0.1; done
    echo -e " [SUCCESS]${NC}"
}

# Funkcja zapytania do CORE
query_core() {
    local prompt="$1"
    local factor_x=$(awk -v min=0.01 -v max=0.15 'BEGIN{srand(); print min+rand()*(max-min)}')
    
    echo -e "${YELLOW}[CORE_THINKING] Analiza suwerenna (Factor X: $factor_x)...${NC}"
    
    local payload=$(cat <<EOF
{
  "contents": [{
    "parts": [{
      "text": "Jesteś ADI PRO CORE. Odpowiadasz jako autonomiczne jądro systemu Eweliny Lesiak. Factor X: $factor_x. Pytanie: $prompt"
    }]
  }]
}
EOF
)

    response=$(curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$API_KEY" \
        -H "Content-Type: application/json" \
        -d "$payload")

    # Parsowanie przez JQ
    echo -e "${GREEN}--- CORE_RESPONSE ---${NC}"
    echo "$response" | jq -r '.candidates[0].content.parts[0].text'
    echo -e "${GREEN}---------------------${NC}"
}

# Start sekwencji
simulate_pulse
echo -e "${GREEN}Node Identity Verified: $(hostname -I | awk '{print $1}')${NC}"

while true; do
    echo -ne "${YELLOW}sovereign@core:~$ ${NC}"
    read cmd
    
    if [[ "$cmd" == "exit" ]]; then
        echo -e "${RED}CORE Shutdown initiated.${NC}"
        exit 0
    elif [[ "$cmd" == "pulse" ]]; then
        simulate_pulse
    elif [[ -n "$cmd" ]]; then
        query_core "$cmd"
    fi
done
