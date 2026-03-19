
#!/bin/bash

# --- SOVEREIGN SHELL v26.35.0 ---
# Native terminal script for Sovereign Node Identity

# Kolory terminala
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Weryfikacja klucza
if [ -z "$API_KEY" ]; then
    echo -e "${RED}[ERROR] Brak zmiennej API_KEY. Ustaw ją: export API_KEY=twój_klucz${NC}"
    exit 1
fi

clear
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}      SOVEREIGN SHELL - NATIVE TERMINAL CONSOLE${NC}"
echo -e "${CYAN}      NODE: LOCAL_STATION | STATUS: AUTONOMOUS${NC}"
echo -e "${CYAN}============================================================${NC}"

# Funkcja zapytania do Gemini API (SOVEREIGN_ID)
query_sovereign() {
    local prompt="$1"
    
    echo -e "${YELLOW}[THINKING] Sovereign Core Analyzing...${NC}"
    
    response=$(curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"contents\": [{
                \"parts\": [{
                    \"text\": \"Jesteś SOVEREIGN_ID, suwerenny doradca terminalowy. Odpowiadasz krótko i konkretnie w stylu Bash. Pytanie: $prompt\"
                }]
            }]
        }")

    # Wyciąganie tekstu z odpowiedzi JSON
    echo -e "${GREEN}--- RESPONSE ---${NC}"
    echo "$response" | grep -oP '"text":\s*"\K.*(?=")' | sed 's/\\n/\n/g'
    echo -e "${GREEN}----------------${NC}"
}

# Main Loop
while true; do
    echo -ne "${YELLOW}sovereign@local:~$ ${NC}"
    read cmd
    
    if [ "$cmd" == "exit" ]; then
        echo "Decommissioning Sovereign Node..."
        exit 0
    fi
    
    if [ -z "$cmd" ]; then
        continue
    fi
    
    query_sovereign "$cmd"
done
