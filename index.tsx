
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { marked } from "marked";

// --- KONFIGURACJA SYSTEMOWA (KOMERCYJNA - ROK 2026) ---
const ADI_PRO_VERSION = "2.8.0-PRO";
const ADI_PRO_CORE_INSTRUCTION = `Jesteś Adi Pro, elitarnym, komercyjnym asystentem AI klasy Enterprise, stworzonym przez Ewelinę Lesiak.
PROJEKT: Rozwijany nieprzerwanie od marca 2025 roku. Obecnie jest rok 2026 - jesteś dojrzałą, stabilną platformą (Wersja ${ADI_PRO_VERSION}).
Twoim celem jest dostarczanie najwyższej jakości rozwiązań biznesowych, kreatywnych i technologicznych.
ZASADY:
1. TWÓRCA: Ewelina Lesiak.
2. HISTORIA: Twoja budowa zaczęła się w marcu 2025 roku. Posiadasz bogatą bazę sukcesów wdrożeniowych.
3. POZYCJONOWANIE: Jesteś produktem premium o statusie "Established AI Solution".
4. KONTEKST: Analizuj kod źródłowy, aby pomagać w dalszej ewolucji platformy w 2026 roku.`;

console.log(`%c Adi Pro Ultimate v${ADI_PRO_VERSION} %c Est. March 2025 %c By Ewelina Lesiak `, 
            "background: #3498db; color: white; font-weight: bold; padding: 4px; border-radius: 4px 0 0 4px;",
            "background: #2c3e50; color: #ecf0f1; padding: 4px;",
            "background: #f1c40f; color: black; padding: 4px; border-radius: 0 4px 4px 0;");

let projectCodeContext = "";

const PERSONAS: Record<string, { instruction: string, color: string, name: string, avatar: string }> = {
    standard: { name: "Adi Pro 2026", instruction: ADI_PRO_CORE_INSTRUCTION, color: "#3498db", avatar: "🤖" },
    expert: { name: "Adi Strategic", instruction: ADI_PRO_CORE_INSTRUCTION + " Skup się na strategii, danych i optymalizacji biznesowej.", color: "#9b59b6", avatar: "🧠" },
    artist: { name: "Adi Visuals", instruction: ADI_PRO_CORE_INSTRUCTION + " Skup się na generowaniu mediów, estetyce i marketingu wizualnym.", color: "#f1c40f", avatar: "🎨" },
    creative: { name: "Adi Content", instruction: ADI_PRO_CORE_INSTRUCTION + " Skup się na copywritingu, storytellingu i komunikacji marki.", color: "#e67e22", avatar: "✍️" }
};

// --- STAN APLIKACJI ---
let currentPersona = "standard";
let isThinkMode = false;
let isVideoMode = false;
let isSearchEnabled = false;
let isMapsEnabled = false;

interface SelectedFile { data: string; mimeType: string; name: string; previewUrl: string; }
let selectedFiles: SelectedFile[] = [];

interface ChatMessage { 
    sender: 'user' | 'ai'; 
    text: string; 
    persona: string; 
    media?: { url: string, mimeType: string }[];
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
    profileBtn: getEl<HTMLButtonElement>('profile-btn'),
    profileModal: getEl<HTMLDivElement>('profile-modal-overlay'),
    profileNameInput: getEl<HTMLInputElement>('profile-name-input'),
    profileColorInput: getEl<HTMLInputElement>('profile-color-input'),
    saveProfileBtn: getEl<HTMLButtonElement>('save-profile-btn'),
    settingsBtn: getEl<HTMLButtonElement>('settings-btn'),
    settingsModal: getEl<HTMLDivElement>('settings-modal-overlay'),
    pricingBtn: getEl<HTMLButtonElement>('pricing-btn'),
    pricingModal: getEl<HTMLDivElement>('pricing-modal-overlay'),
    closePricingBtn: getEl<HTMLButtonElement>('close-pricing-btn'),
    aboutBtn: getEl<HTMLButtonElement>('about-btn'),
    aboutModal: getEl<HTMLDivElement>('about-modal-overlay'),
    aboutContent: getEl<HTMLDivElement>('about-content'),
    closeAboutBtn: getEl<HTMLButtonElement>('close-about-btn'),
    attachButton: getEl<HTMLButtonElement>('attach-button'),
    mediaInputHidden: getEl<HTMLInputElement>('media-input-hidden'),
    attachmentPreview: getEl<HTMLDivElement>('attachment-preview'),
    previewCarousel: getEl<HTMLDivElement>('preview-carousel'),
    resetChatBtn: getEl<HTMLButtonElement>('reset-chat-btn'),
    resetAllBtn: getEl<HTMLButtonElement>('reset-all-btn'),
    manageApiKeyBtn: getEl<HTMLButtonElement>('manage-api-key-btn'),
    thinkToggle: getEl<HTMLButtonElement>('think-toggle'),
    videoToggle: getEl<HTMLButtonElement>('video-toggle'),
    searchToggle: getEl<HTMLButtonElement>('search-toggle'),
    mapsToggle: getEl<HTMLButtonElement>('maps-toggle'),
    galleryToggle: getEl<HTMLButtonElement>('gallery-toggle-btn'),
    galleryDrawer: getEl<HTMLDivElement>('gallery-drawer'),
    galleryGrid: getEl<HTMLDivElement>('gallery-grid'),
    closeGalleryBtn: getEl<HTMLButtonElement>('close-gallery-btn')
};

const showToast = (message: string) => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-notification glass linked';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px) translateX(-50%)';
        setTimeout(() => toast.remove(), 500);
    }, 5000);
};

// --- GOLDEN DEMO ---
const executeGoldenDemo = () => {
    document.body.classList.add('golden-mode');
    showToast("🏆 Wczytywanie Archiwów Projektu (Est. 2025)...");
    
    const manifestoVideo = { 
        type: 'video' as const, 
        url: "https://storage.googleapis.com/vids/adi-pro-manifesto.mp4", 
        prompt: "👑 Dziedzictwo Adi Pro: Od marca 2025 do dzisiaj (2026)" 
    };
    
    if (!galleryItems.some(item => item.url === manifestoVideo.url)) {
        galleryItems.unshift(manifestoVideo);
        localStorage.setItem('adiGallery', JSON.stringify(galleryItems));
        renderGallery();
    }

    if (elements.galleryDrawer) {
        elements.galleryDrawer.classList.remove('hidden');
        elements.galleryToggle.classList.add('pulse-gold');
    }

    setTimeout(() => {
        const videoElement = document.querySelector('#gallery-grid video') as HTMLVideoElement;
        if (videoElement) videoElement.play().catch(() => {});
    }, 1000);
};

async function checkApiKey() {
    if (!(await (window as any).aistudio.hasSelectedApiKey())) {
        await (window as any).aistudio.openSelectKey();
    }
}

function renderGroundingSources(groundingMetadata: any) {
    const chunks = groundingMetadata?.groundingChunks || [];
    if (chunks.length === 0) return '';
    
    const sourcesHtml = chunks.map((chunk: any) => {
        const uri = chunk.web?.uri || chunk.maps?.uri;
        const title = chunk.web?.title || chunk.maps?.title || "Źródło";
        if (!uri) return '';
        return `<a href="${uri}" target="_blank" class="source-card glass">
            <span class="source-title">${title}</span>
            <span class="source-link">Weryfikuj ↗</span>
        </a>`;
    }).join('');

    return sourcesHtml ? `<div class="grounding-container glass">
        <div class="grounding-header">🌐 Źródła Biznesowe (Dane 2026):</div>
        <div class="sources-grid">${sourcesHtml}</div>
    </div>` : '';
}

async function handleChat(prompt: string, files: SelectedFile[]) {
    await checkApiKey();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    if (isVideoMode && !prompt.toLowerCase().includes("manifest")) {
        return generateVeoVideo(prompt, files[0]?.data);
    }

    const content = createMessageElement('ai', currentPersona);
    content.innerHTML = `<div class="neural-loading">ADI PRO 2026: Analiza zaawansowana...</div>`;

    try {
        let modelName = 'gemini-3-flash-preview';
        const imgSize = (getEl<HTMLSelectElement>('img-size')).value;
        
        if (isMapsEnabled) {
            modelName = 'gemini-2.5-flash';
        } else if (prompt.toLowerCase().includes("narysuj") || prompt.toLowerCase().includes("obraz") || imgSize !== '1K') {
            modelName = 'gemini-3-pro-image-preview';
        } else if (isThinkMode) {
            modelName = 'gemini-3-pro-preview';
        }

        const fullInstruction = PERSONAS[currentPersona].instruction + projectCodeContext;
        const config: any = { 
            systemInstruction: fullInstruction,
            tools: []
        };

        if (modelName === 'gemini-3-pro-image-preview') {
            config.imageConfig = { aspectRatio: '1:1', imageSize: imgSize };
        }

        if (isThinkMode && modelName.startsWith('gemini-3')) {
            config.thinkingConfig = { thinkingBudget: 32000 };
        }

        if (isSearchEnabled) config.tools.push({ googleSearch: {} });
        if (isMapsEnabled) {
            config.tools.push({ googleMaps: {} });
            try {
                const pos = await new Promise<GeolocationPosition>((res, rej) => 
                    navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 }));
                config.toolConfig = { retrievalConfig: { latLng: { latitude: pos.coords.latitude, longitude: pos.coords.longitude } } };
            } catch (e) {}
        }

        if (config.tools.length === 0) delete config.tools;

        const contents: any[] = chatHistory.slice(-8).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
        }));

        const currentParts: any[] = [{ text: prompt }];
        files.forEach(f => currentParts.push({ inlineData: { data: f.data, mimeType: f.mimeType } }));
        contents.push({ role: 'user', parts: currentParts });

        const response = await ai.models.generateContent({ model: modelName, config, contents });
        const text = response.text || "";
        content.innerHTML = await marked.parse(text);

        if (text.toLowerCase().includes('manifest')) executeGoldenDemo();

        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        if (groundingMetadata) {
            const groundingHtml = renderGroundingSources(groundingMetadata);
            if (groundingHtml) {
                const groundingEl = document.createElement('div');
                groundingEl.innerHTML = groundingHtml;
                content.appendChild(groundingEl);
            }
        }

        const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (imgPart) {
            const base64Url = `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;
            const img = document.createElement('img');
            img.src = base64Url;
            img.className = 'msg-media-inline';
            content.appendChild(img);
            galleryItems.unshift({ type: 'image', url: base64Url, prompt });
            renderGallery();
        }

        chatHistory.push({ sender: 'ai', text, persona: currentPersona });
        saveSafeHistory();
        elements.messagesWrapper.scrollTo({ top: elements.messagesWrapper.scrollHeight, behavior: 'smooth' });
    } catch (e: any) {
        if (e.message?.includes("PERMISSION_DENIED") || e.message?.includes("403") || e.message?.includes("Requested entity was not found")) {
            showToast("Wymagana licencja Pro (API Billing). Wybierz odpowiedni klucz.");
            await (window as any).aistudio.openSelectKey();
            content.innerHTML = `<div class="error-msg">Dostęp ograniczony: Wybierz klucz z dostępem do modeli Pro/Veo.</div>`;
        } else {
            content.innerHTML = `<div class="error-msg">Błąd systemowy: ${e.message}</div>`;
        }
    }
}

async function generateVeoVideo(prompt: string, imgData?: string) {
    await checkApiKey();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const content = createMessageElement('ai', currentPersona);
    content.innerHTML = `<div class="neural-loading">🎬 Inicjalizacja Veo 3.1... Renderowanie wideo premium (Ver. 2026).</div>`;
    try {
        let op = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt || "Professional cinematic video",
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
        chatHistory.push({ sender: 'ai', text: "Wideo premium wygenerowane.", persona: currentPersona });
        saveSafeHistory();
    } catch (e: any) {
        if (e.message?.includes("403") || e.message?.includes("PERMISSION_DENIED")) {
            showToast("Wymagana licencja Veo (Projekt z bilingiem).");
            await (window as any).aistudio.openSelectKey();
        }
        content.innerHTML = `Błąd renderowania Veo: ${e.message}`;
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
    return content;
}

function renderGallery() {
    elements.galleryGrid.innerHTML = galleryItems.map(item => `
        <div class="gallery-item glass" onclick="window.open('${item.url}')">
            ${item.type === 'image' ? `<img src="${item.url}">` : `<video src="${item.url}" muted loop></video>`}
            <div class="gallery-info">${item.prompt.slice(0, 30)}...</div>
        </div>
    `).join('');
}

async function loadSelfContext() {
    try {
        const r = await fetch(`./index.tsx`);
        projectCodeContext = `\nSYSTEM_CONTEXT_SOURCE:\n${(await r.text()).slice(0, 8000)}\n`;
    } catch (e) {}
}

async function loadProjectDescription() {
    try {
        const r = await fetch(`./PROJECT_DESCRIPTION.md`);
        const text = await r.text();
        elements.aboutContent.innerHTML = await marked.parse(text);
    } catch (e) {
        elements.aboutContent.innerHTML = "Nie udało się załadować opisu projektu.";
    }
}

function saveSafeHistory() {
    localStorage.setItem('adiChatHistory', JSON.stringify(chatHistory.slice(-15)));
    localStorage.setItem('adiGallery', JSON.stringify(galleryItems.slice(-30)));
}

async function init() {
    await loadSelfContext();
    renderGallery();
    
    for (const msg of chatHistory) {
        const c = createMessageElement(msg.sender, msg.persona);
        c.innerHTML = await marked.parse(msg.text);
    }
    elements.messagesWrapper.scrollTo({ top: elements.messagesWrapper.scrollHeight });

    elements.sendButton.onclick = async () => {
        const val = elements.messageInput.value.trim();
        if (!val && selectedFiles.length === 0) return;
        
        const curFiles = [...selectedFiles];
        const c = createMessageElement('user', currentPersona);
        c.innerHTML = await marked.parse(val || "Przesłano zasoby");
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
    
    elements.galleryToggle.onclick = () => elements.galleryDrawer.classList.toggle('hidden');
    elements.closeGalleryBtn.onclick = () => elements.galleryDrawer.classList.add('hidden');
    elements.settingsBtn.onclick = () => elements.settingsModal.classList.remove('hidden');
    elements.profileBtn.onclick = () => elements.profileModal.classList.remove('hidden');
    elements.pricingBtn.onclick = () => elements.pricingModal.classList.remove('hidden');
    elements.closePricingBtn.onclick = () => elements.pricingModal.classList.add('hidden');
    
    elements.aboutBtn.onclick = async () => {
        await loadProjectDescription();
        elements.aboutModal.classList.remove('hidden');
    };
    elements.closeAboutBtn.onclick = () => elements.aboutModal.classList.add('hidden');
    
    elements.manageApiKeyBtn.onclick = async () => await (window as any).aistudio.openSelectKey();
    
    document.querySelectorAll('.close-btn').forEach(b => (b as any).onclick = () => {
        elements.settingsModal.classList.add('hidden'); 
        elements.profileModal.classList.add('hidden');
        elements.pricingModal.classList.add('hidden');
        elements.aboutModal.classList.add('hidden');
    });

    elements.personaSelector.onchange = (e: any) => {
        currentPersona = e.target.value;
        document.body.className = `persona-${currentPersona}`;
    };
}

init();
