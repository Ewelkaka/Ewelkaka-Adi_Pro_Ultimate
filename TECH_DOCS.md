# Dokumentacja Technologiczna: Adi Pro Ultimate (Edition 2026)
**Wersja:** 2.8.0-PRO
**Architekt:** Ewelina Lesiak
**Data Inicjalizacji:** Marzec 2025
**Ostatnia Aktualizacja:** Marzec 2026

## 1. Filozofia Architektoniczna: "Edge-Orchestrated Intelligence"
Adi Pro Ultimate wykorzystuje model **Client-Side Orchestration**. W przeciwieństwie do tradycyjnych systemów SaaS, logika biznesowa, przetwarzanie mediów i zarządzanie stanem odbywają się bezpośrednio na urządzeniu użytkownika (Browser/Electron), co minimalizuje opóźnienia (latency) i maksymalizuje prywatność danych.

## 2. Core Tech Stack (2026)

### Frontend & Logic
- **Język:** TypeScript (ES6+ Modules) – zapewniający typowanie i stabilność klasy Enterprise.
- **Rendering Silnika:** Vanilla DOM API z optymalizacją pod 120Hz displaye.
- **Przetwarzanie Tekstu:** `Marked.js` z customowymi rozszerzeniami dla renderowania źródeł Groundingu.
- **Stylizacja:** CSS3 Custom Properties (Variables) z implementacją **Glassmorphism 2.0** i dynamicznym motywem "Golden Mode".

### Silnik AI (Google GenAI SDK)
System dynamicznie przełącza się między modelami w zależności od zadania (Context-Aware Switching):
1. **Gemini 3 Pro Preview:** Główny procesor logiczny (Reasoning/Thinking Mode).
2. **Gemini 3 Pro Image:** Generowanie grafiki wysokiej rozdzielczości (1K, 2K, 4K).
3. **Veo 3.1 Fast:** Renderowanie kinematograficznych sekwencji wideo (do 10s).
4. **Gemini 2.5 Flash:** Szybka analiza geolokalizacyjna i proste zapytania tekstowe.

## 3. Kluczowe Moduły Technologiczne

### 3.1. Narzędzia Weryfikacji (Grounding Engine)
Adi Pro integruje dwa systemy weryfikacji faktów w czasie rzeczywistym:
- **Google Search Grounding:** Ekstrakcja danych z sieci z mapowaniem `groundingChunks` na interaktywne karty źródeł.
- **Google Maps Grounding:** Integracja z API geolokalizacji przeglądarki, przesyłająca współrzędne `lat/lng` do modelu w celu precyzyjnej analizy lokalnej.

### 3.2. Media Pipeline
- **Image Generation:** Implementacja dynamicznego wyboru `aspectRatio` (1:1) oraz `imageSize`. Przetwarzanie obrazów odbywa się poprzez `inlineData` (base64).
- **Video Generation (Veo):** Asynchroniczny pipeline wykorzystujący `operations.getVideosOperation`. System implementuje polling (10s interval) z mechanizmem automatycznego pobierania MP4.

### 3.3. Persistence Layer
- **LocalStorage History:** Szyfrowane (opcjonalnie) przechowywanie historii czatu (ostatnie 15 wiadomości) oraz galerii (ostatnie 30 pozycji).
- **Session State:** Zarządzanie personami (Standard, Strategic, Visuals, Content) poprzez dynamiczne wstrzykiwanie `systemInstruction`.

## 4. Bezpieczeństwo i Dystrybucja

### Izolacja API (BYOK - Bring Your Own Key)
Aplikacja nie przechowuje kluczy API na serwerze. Wykorzystuje mechanizm `process.env.API_KEY` wstrzykiwany przez środowisko wykonawcze lub dialog `aistudio.openSelectKey()`, co zapewnia pełną kontrolę kosztów i bezpieczeństwa po stronie użytkownika.

### Formaty Dystrybucji
1. **PWA (Progressive Web App):** Wykorzystuje `sw.js` (Service Worker) do cache'owania zasobów i pracy offline.
2. **Desktop Portable (Electron):** Natywna powłoka dla Windows/macOS, zapewniająca dostęp do systemu plików i wyższą wydajność renderowania wideo.

## 5. Roadmap Technologiczny (Q3-Q4 2026)
- **Moduł Live API:** Wdrożenie komunikacji głosowej o ultra-niskim opóźnieniu (Multimodal Live).
- **RAG Local Integration:** Możliwość indeksowania lokalnych dokumentów PDF/DOCX bez wysyłania ich treści do chmury.
- **Quantum-Safe Encryption:** Aktualizacja warstwy przechowywania kluczy.

---
*Zatwierdzono do użytku komercyjnego.*
*Podpisano: Ewelina Lesiak, Lead System Architect*
