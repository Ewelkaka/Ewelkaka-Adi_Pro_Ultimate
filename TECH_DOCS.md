# Rozszerzona Dokumentacja Technologiczna: Adi Pro Ultimate (Edycja 2026)
**Wersja:** 2.8.5-ENTERPRISE | **Klasyfikacja:** Internal Tech Spec | **Architekt:** Ewelina Lesiak

## 1. Architektura Systemu: "Multimodal Orchestrator"
Adi Pro Ultimate operuje w architekturze **Edge-First Multimodal Orchestration**. System został zaprojektowany tak, aby minimalizować obciążenie serwerowe, przenosząc ciężar procesowy na środowisko wykonawcze klienta (V8 Engine / Chromium), co zapewnia brak latencji przy renderowaniu UI i pełną prywatność.

### 1.1. Warstwy Systemowe
1.  **Warstwa Prezentacji (UI Layer):** Wykorzystuje Vanilla TypeScript z wzorcem *Component-Driven State*. Rendering zoptymalizowany pod odświeżanie 120Hz (ProMotion/Adaptive Sync), co uzyskano dzięki minimalizacji reflow/repaint w cyklach `requestAnimationFrame`.
2.  **Warstwa Orkiestracji (Orchestration Layer):** Odpowiada za dynamiczny wybór modelu (Model Routing). Algorytm analizuje prompt i flagi systemowe (Think, Video, Search), aby skierować zapytanie do odpowiedniego endpointu Google GenAI SDK.
3.  **Warstwa Komunikacji (API Bridge):** Implementuje protokół HTTPS/WSS dla bezpiecznej komunikacji z modelami Gemini 3 i Veo 3.1, wykorzystując mechanizm wstrzykiwania kluczy BYOK (Bring Your Own Key).

---

## 2. Specyfikacja Modeli AI (Core Intelligence)

| Funkcja | Model (2026) | Specyfikacja Techniczna |
| :--- | :--- | :--- |
| **Logic & Reasoning** | `gemini-3-pro-preview` | Thinking Budget do 32k tokenów, kontekst 2M+. |
| **Fast Interaction** | `gemini-3-flash-preview` | Optymalizacja pod niskie opóźnienia, obsługa multimodalna. |
| **Visual Production** | `gemini-3-pro-image` | Generowanie natywne 4K, obsługa stylów artystycznych i technicznych. |
| **Cinematic Video** | `veo-3.1-fast-generate` | Renderowanie klatek w wysokiej gęstości, asynchroniczny polling. |
| **Geo-Location** | `gemini-2.5-flash` | Integracja z Google Maps Tooling i Groundingiem. |

---

## 3. Grounding Engine & Fact-Checking
System implementuje zaawansowany mechanizm weryfikacji w czasie rzeczywistym, mapujący dane z zewnątrz na kontekst AI.

### 3.1. Google Search Grounding
- **Proces:** Zapytanie jest wzbogacane o narzędzie `googleSearch`. Model zwraca nie tylko tekst, ale i `groundingMetadata`.
- **Ekstrakcja:** Parser systemowy wyodrębnia `groundingChunks`, mapując je na interaktywne komponenty `source-card` w interfejsie.
- **Weryfikacja:** Każdy chunk zawiera referencję do fragmentu tekstu, co pozwala na wizualne podkreślenie faktów zweryfikowanych.

### 3.2. Google Maps Tooling
- **Context Injection:** System automatycznie pobiera współrzędne `latitude/longitude` z API przeglądarki (za zgodą użytkownika).
- **Retrieval Config:** Dane lokalizacyjne są przesyłane wewnątrz `toolConfig`, co pozwala modelowi na precyzyjne wskazywanie obiektów (restauracje, biura, punkty logistyczne) wraz z linkami do Map Google.

---

## 4. Media Pipeline (Obraz i Wideo)

### 4.1. Generowanie Wideo (Veo 3.1)
System wykorzystuje model pollingu asynchronicznego:
1.  **Request:** Wysłanie promptu i obrazu referencyjnego (opcjonalnie) do `generateVideos`.
2.  **Operation Tracking:** Otrzymanie identyfikatora operacji i monitorowanie jej stanu przez `getVideosOperation` co 10 sekund.
3.  **Finalization:** Po ukończeniu (done: true), system wykonuje bezpieczny fetch MP4 z dołączonym kluczem API, konwertując odpowiedź na `Blob` i lokalny URL (Object URL), aby uniknąć problemów z wygaśnięciem linków sesyjnych.

### 4.2. Generowanie Obrazu 4K
- **Dynamic Config:** Automatyczne przełączanie na `gemini-3-pro-image-preview` przy wyborze rozmiaru 2K/4K.
- **Aspect Ratio Logic:** Obsługa proporcji 1:1, 16:9, 9:16 bezpośrednio w `imageConfig`.

---

## 5. Persistence & State Management
- **Context Windowing:** System przechowuje ostatnie 15 wiadomości w `localStorage`, aby zachować spójność dialogu bez przekraczania limitów tokenów i wydajności przeglądarki.
- **Persona Context:** Każda persona (Standard, Strategic, Visuals, Creative) posiada dedykowany `systemInstruction`, który jest dynamicznie konkatenowany z kodem źródłowym projektu (Self-Awareness Context).

---

## 6. Bezpieczeństwo i Izolacja
1.  **Klucze API:** Nigdy nie są przesyłane na serwery Adi Pro. Cała komunikacja odbywa się bezpośrednio z domenami Google.
2.  **Sanitization:** Wykorzystanie biblioteki `marked.js` z rygorystyczną polityką bezpieczeństwa zapobiega atakom typu XSS w generowanych treściach.
3.  **Electron Isolation:** W wersji desktopowej proces renderowania jest odizolowany (`contextIsolation: true`), co chroni system operacyjny użytkownika przed nieautoryzowanym dostępem.

---
**Zatwierdziła:** Ewelina Lesiak, Lead System Architect
**Data:** 14 Marca 2026 r.