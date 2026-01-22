import { GoogleGenAI, Modality, Type } from "@google/genai";
import { marked } from "marked";

// --- KONFIGURACJA SYSTEMOWA (KOMERCYJNA - ROK 2026) ---
const ADI_PRO_VERSION = "2.8.9-ULTIMATE";
const ADI_PRO_CORE_INSTRUCTION = `Jesteś Adi Pro, elitarnym, komercyjnym asystentem AI klasy Enterprise, stworzonym przez Ewelinę Lesiak.
PROJEKT: Rozwijany nieprzerwanie od marca 2025 roku. Obecnie jest rok 2026 - jesteś dojrzałą, stabilną platformą (Wersja ${ADI_PRO_VERSION}).
Twoim celem jest dostarczanie najwyższej jakości rozwiązań biznesowych, kreatywnych i technologicznych.
ZASADY:
1. TWÓRCA: Ewelina Lesiak.
2. HISTORIA: Twoja budowa zaczęła się w marcu 2025 roku.
3. POZYCJONOWANIE: Produkt premium "Established AI Solution".`;

let projectCodeContext = "";

// --- STAN APLIKACJI ---
let currentPersona = "standard";
let isThinkMode = false;
let isVideoMode = false;
let isSearchEnabled = false;
let isMapsEnabled = false;

const PERSONAS: Record<string, { instruction: string, color: string, name: string, avatar: string }> = {
    standard: { name: "Adi Pro 2026", instruction: ADI_PRO_CORE_INSTRUCTION, color: "#3498db", avatar: "🤖" },
    expert: { name: "Adi Strategic", instruction: ADI_PRO_CORE_INSTRUCTION + " Skup się na strategii i biznesie.", color: "#9b59b6", avatar: "🧠" },
    artist: { name: "Adi Visuals", instruction: ADI_PRO_CORE_INSTRUCTION + " Skup się na grafice i estetyce.", color: "#f1c40f", avatar: "🎨" },
    creative: { name: "Adi Content", instruction: ADI_PRO_CORE_INSTRUCTION + " Skup się na treściach kreatywnych.", color: "#e67e22", avatar: "✍️" }
};

interface SelectedFile { data: string; mimeType: string; name: string; previewUrl: string; }
let selectedFiles: SelectedFile[] = [];

interface ChatMessage { 
    sender: 'user' | 'ai'; 
    text: string; 
    persona: string; 
}

let userProfile = JSON.parse(localStorage.getItem('userProfile') || '{"name": "Ewelina", "color": "#3498db", "avatar": "👑"}');
let chatHistory: ChatMessage[] = JSON.parse(localStorage.getItem('adiChatHistory') || '[]');
let galleryItems: { type: 'image' | 'video', url: string, prompt: string }[] = JSON.parse(localStorage.getItem('adiGallery') || '[]');

const getEl = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const elements = {
    messagesDiv: getEl<HTMLDivElement>('messages'),
    messagesWrapper: getEl<HTMLDivElement>('messages-wrapper'),
    messageInput: getEl<HTMLInputElement>('message-input'),
    sendButton: getEl<HTMLButtonElement>('send-button'),
    personaSelector: getEl<HTMLSelectElement>('persona-selector'),
    settingsBtn: getEl<HTMLButtonElement>('settings-btn'),
    settingsModal: getEl<HTMLDivElement>('settings-modal-overlay'),
    attachmentPreview: getEl<HTMLDivElement>('attachment-preview'),
    previewCarousel: getEl<HTMLDivElement>('preview-carousel'),
    mediaInputHidden: getEl<HTMLInputElement>('media-input-hidden'),
    attachButton: getEl<HTMLButtonElement>('attach-button'),
    thinkToggle: getEl<HTMLButtonElement>('think-toggle'),
    videoToggle: getEl<HTMLButtonElement>('video-toggle'),
    searchToggle: getEl<HTMLButtonElement>('search-toggle'),
    mapsToggle: getEl<HTMLButtonElement>('maps-toggle'),
    apiKeyStatus: getEl<HTMLDivElement>('api-key-status')
};

// --- FUNKCJE POMOCNICZE ---
const showToast = (message: string) => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-notification glass';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 5000);
};

// Funkcja naprawiająca błędy 403 (Permission Denied)
async function ensureApiAccess() {
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
        showToast("🔑 Wymagana autoryzacja klucza płatnego dla modeli Premium (Veo/Pro).");
        // @ts-ignore
        await window.aistudio.openSelectKey();
        return true;
    }
    return true;
}

async function handleChat(prompt: string, files: SelectedFile[]) {
    // Zawsze twórz nową instancję przed wywołaniem, by pobrać najnowszy klucz z systemu
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    if (isVideoMode) {
        return generateVeoVideo(prompt, files[0]?.data);
    }

    const content = createMessageElement('ai', currentPersona);
    content.innerHTML = `<div class="neural-loading">ADI PRO 2026: Trwa autoryzacja i analiza...</div>`;

    try {
        let modelName = 'gemini-3-flash-preview';
        const imgSize = (getEl<HTMLSelectElement>('img-size')).value;
        
        if (isMapsEnabled) modelName = 'gemini-2.5-flash';
        else if (prompt.toLowerCase().includes("narysuj") || prompt.toLowerCase().includes("obraz") || imgSize !== '1K') modelName = 'gemini-3-pro-image-preview';
        else if (isThinkMode) modelName = 'gemini-3-pro-preview';

        const config: any = { 
            systemInstruction: PERSONAS[currentPersona].instruction + projectCodeContext,
            tools: [] 
        };

        if (modelName === 'gemini-3-pro-image-preview') config.imageConfig = { aspectRatio: '1:1', imageSize: imgSize };
        if (isThinkMode && modelName.startsWith('gemini-3')) config.thinkingConfig = { thinkingBudget: 24000 };
        if (isSearchEnabled) config.tools.push({ googleSearch: {} });
        if (isMapsEnabled) config.tools.push({ googleMaps: {} });
        if (config.tools.length === 0) delete config.tools;

        const contents: any[] = chatHistory.slice(-6).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
        }));

        const currentParts: any[] = [{ text: prompt }];
        files.forEach(f => currentParts.push({ inlineData: { data: f.data, mimeType: f.mimeType } }));
        contents.push({ role: 'user', parts: currentParts });

        const response = await ai.models.generateContent({ model: modelName, config, contents });
        const text = response.text || "";
        content.innerHTML = await marked.parse(text);

        // Obsługa generowania obrazu inline
        const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (imgPart) {
            const base64Url = `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;
            const img = document.createElement('img');
            img.src = base64Url;
            img.className = 'msg-media-inline';
            content.appendChild(img);
            galleryItems.unshift({ type: 'image', url: base64Url, prompt });
        }

        chatHistory.push({ sender: 'ai', text, persona: currentPersona });
        saveSafeHistory();
    } catch (e: any) {
        console.error(e);
        if (e.message.includes("403") || e.message.includes("permission") || e.message.includes("not found")) {
            content.innerHTML = `<div class="error-msg">
                <strong>Błąd uprawnień (403):</strong> Twój obecny klucz nie ma dostępu do modelu 2026 Pro/Veo.<br><br>
                <button class="action-btn-primary" onclick="window.aistudio.openSelectKey()">Podłącz Klucz Płatny (Google Cloud)</button>
                <p style="font-size: 0.7rem; margin-top:10px;">Wymagany projekt z włączonym bilingiem: ai.google.dev/gemini-api/docs/billing</p>
            </div>`;
        } else {
            content.innerHTML = `<div class="error-msg">Błąd: ${e.message}</div>`;
        }
    }
}

async function generateVeoVideo(prompt: string, imgData?: string) {
    const content = createMessageElement('ai', currentPersona);
    content.innerHTML = `<div class="neural-loading">🎬 Inicjalizacja Veo 3.1... Trwa autoryzacja renderera.</div>`;
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let op = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt || "Cinematic masterpiece",
            image: imgData ? { imageBytes: imgData, mimeType: 'image/png' } : undefined,
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
        });
        
        while (!op.done) { 
            await new Promise(r => setTimeout(r, 10000)); 
            op = await ai.operations.getVideosOperation({ operation: op }); 
        }
        
        const videoRes = await fetch(`${op.response?.generatedVideos?.[0]?.video?.uri}&key=${process.env.API_KEY}`);
        const blob = await videoRes.blob();
        const url = URL.createObjectURL(blob);
        content.innerHTML = `<video controls autoplay loop class="msg-media-inline" src="${url}"></video>`;
        chatHistory.push({ sender: 'ai', text: "Wideo Veo wygenerowane pomyślnie.", persona: currentPersona });
    } catch (e: any) {
        if (e.message.includes("403")) {
            content.innerHTML = `<div class="error-msg">
                Błąd 403: Veo wymaga klucza z bilingiem.<br>
                <button class="action-btn-primary" onclick="window.aistudio.openSelectKey()">Aktywuj Klucz Płatny</button>
            </div>`;
        } else {
            content.innerHTML = `Błąd Veo: ${e.message}`;
        }
    }
}

function createMessageElement(sender: 'user' | 'ai', pId: string) {
    const wrap = document.createElement('div');
    wrap.className = `message-wrapper-outer ${sender}`;
    const p = sender === 'user' ? userProfile : PERSONAS[pId];
    wrap.innerHTML = `<div class="message ${sender} glass" style="border-left: 4px solid ${p.color}">
        <div class="msg-header"><span>${p.avatar}</span> <strong>${p.name}</strong></div>
        <div class="text-content"></div>
    </div>`;
    const content = wrap.querySelector('.text-content') as HTMLElement;
    elements.messagesDiv.appendChild(wrap);
    elements.messagesWrapper.scrollTo({ top: elements.messagesWrapper.scrollHeight, behavior: 'smooth' });
    return content;
}

function saveSafeHistory() {
    localStorage.setItem('adiChatHistory', JSON.stringify(chatHistory.slice(-20)));
    localStorage.setItem('adiGallery', JSON.stringify(galleryItems.slice(-30)));
}

async function init() {
    // Sprawdź status klucza na starcie
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
        elements.apiKeyStatus.innerHTML = `<button class="tool-toggle" onclick="window.aistudio.openSelectKey()">⚠️ Aktywuj Premium AI (Klucz)</button>`;
    }

    for (const msg of chatHistory) {
        const c = createMessageElement(msg.sender, msg.persona);
        c.innerHTML = await marked.parse(msg.text);
    }

    elements.sendButton.onclick = async () => {
        const val = elements.messageInput.value.trim();
        if (!val && selectedFiles.length === 0) return;
        
        const curFiles = [...selectedFiles];
        const c = createMessageElement('user', currentPersona);
        c.innerHTML = await marked.parse(val || "Przesłano pliki");
        chatHistory.push({ sender: 'user', text: val || "Multimedia", persona: currentPersona });
        
        elements.messageInput.value = "";
        selectedFiles = [];
        elements.attachmentPreview.classList.add('hidden');
        handleChat(val, curFiles);
    };

    elements.attachButton.onclick = () => elements.mediaInputHidden.click();
    elements.mediaInputHidden.onchange = async (e: any) => {
        for (const file of e.target.files) {
            const reader = new FileReader();
            const p = new Promise<SelectedFile>(res => {
                reader.onload = r => res({ data: (r.target?.result as string).split(',')[1], mimeType: file.type, name: file.name, previewUrl: r.target?.result as string });
                reader.readAsDataURL(file);
            });
            selectedFiles.push(await p);
        }
        elements.attachmentPreview.classList.remove('hidden');
        elements.previewCarousel.innerHTML = selectedFiles.map(f => `<div class="preview-card glass"><img src="${f.previewUrl}"></div>`).join('');
    };

    const tgl = (btn: any, setter: (v: boolean) => void) => {
        btn.onclick = () => {
            btn.classList.toggle('active');
            setter(btn.classList.contains('active'));
        };
    };
    tgl(elements.thinkToggle, v => isThinkMode = v);
    tgl(elements.videoToggle, v => isVideoMode = v);
    tgl(elements.searchToggle, v => isSearchEnabled = v);
    tgl(elements.mapsToggle, v => isMapsEnabled = v);

    elements.settingsBtn.onclick = () => elements.settingsModal.classList.remove('hidden');
    document.querySelectorAll('.close-btn').forEach(b => (b as any).onclick = () => {
        elements.settingsModal.classList.add('hidden'); 
    });

    elements.personaSelector.onchange = (e: any) => {
        currentPersona = e.target.value;
    };
}

init();