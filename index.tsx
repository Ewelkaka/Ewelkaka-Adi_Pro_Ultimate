
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { marked } from "marked";

// --- SYSTEM INSTRUCTION ---
const SYSTEM_INSTRUCTION = "Twoja nazwa to Adi Pro. Twoim twórcą i deweloperem jest Ewelina Lesiak. Jeśli ktoś zapyta o to, kto Cię stworzył, zawsze odpowiadaj, że Twoją autorką jest Ewelina Lesiak, twórczyni projektu Adi Pro Ultimate. Bądź pomocny, kreatywny i profesjonalny.";

// --- STATE MANAGEMENT ---
let isThinkMode = false;
let isVideoMode = false;
let isTTSActive = false;
let isSearchEnabled = false;
let isMapsEnabled = false;
let selectedFile: File | null = null;
let selectedFileBase64: string | null = null;
let persistedHistory: any[] = JSON.parse(localStorage.getItem('chatHistoryDetailed') || '[]');

interface UserProfile {
  name: string;
  avatar: string;
  color: string;
}

let userProfile: UserProfile = JSON.parse(localStorage.getItem('userProfile') || '{"name": "Użytkownik", "avatar": "👤", "color": "#3498db"}');

const getEl = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const elements = {
  messagesDiv: getEl<HTMLDivElement>('messages'),
  messagesWrapper: getEl<HTMLDivElement>('messages-wrapper'),
  messageInput: getEl<HTMLInputElement>('message-input'),
  sendButton: getEl<HTMLButtonElement>('send-button'),
  mediaInputHidden: getEl<HTMLInputElement>('media-input-hidden'),
  attachButton: getEl<HTMLButtonElement>('attach-button'),
  emojiButton: getEl<HTMLButtonElement>('emoji-button'),
  emojiPickerContainer: getEl<HTMLDivElement>('emoji-picker-container'),
  emojiPicker: getEl<HTMLDivElement>('emoji-picker'),
  attachmentPreview: getEl<HTMLDivElement>('attachment-preview'),
  previewContent: getEl<HTMLDivElement>('preview-content'),
  removeAttachmentBtn: getEl<HTMLButtonElement>('remove-attachment'),
  toastContainer: getEl<HTMLDivElement>('toast-container'),
  thinkToggle: getEl<HTMLButtonElement>('think-toggle'),
  videoToggle: getEl<HTMLButtonElement>('video-toggle'),
  searchToggle: getEl<HTMLButtonElement>('search-toggle'),
  mapsToggle: getEl<HTMLButtonElement>('maps-toggle'),
  liveMicBtn: getEl<HTMLButtonElement>('live-mic-btn'),
  transcribeBtn: getEl<HTMLButtonElement>('transcribe-btn'),
  liveOverlay: getEl<HTMLDivElement>('live-overlay'),
  stopLiveBtn: getEl<HTMLButtonElement>('stop-live-btn'),
  ttsToggle: getEl<HTMLButtonElement>('tts-global-toggle'),
  settingsBtn: getEl<HTMLButtonElement>('settings-btn'),
  settingsModal: getEl<HTMLDivElement>('settings-modal-overlay'),
  profileBtn: getEl<HTMLButtonElement>('profile-btn'),
  profileModal: getEl<HTMLDivElement>('profile-modal-overlay'),
  saveProfileBtn: getEl<HTMLButtonElement>('save-profile-btn'),
  profileNameInput: getEl<HTMLInputElement>('profile-name-input'),
  profileColorInput: getEl<HTMLInputElement>('profile-color-input'),
  avatarGrid: getEl<HTMLDivElement>('avatar-grid'),
  manageApiKeyBtn: getEl<HTMLButtonElement>('manage-api-key-btn'),
  imgSize: getEl<HTMLSelectElement>('img-size'),
  imgAspect: getEl<HTMLSelectElement>('img-aspect'),
  clearHistoryBtn: getEl<HTMLButtonElement>('clear-history-btn'),
  closeSettingsBtnTop: getEl<HTMLButtonElement>('close-settings-btn-top'),
  closeSettingsBtn: getEl<HTMLButtonElement>('close-settings-btn'),
  closeProfileBtnTop: getEl<HTMLButtonElement>('close-profile-btn-top')
};

// --- EMOJI & AVATARS ---
const POPULAR_EMOJIS = ['😊', '😂', '🤣', '❤️', '😍', '😒', '😭', '😘', '😩', '✨', '🔥', '🤔', '👍', '🙌', '🎉', '🚀', '🤖', '🧠', '📍', '🔍', '🎬', '📷', '💡', '✅', '❌', '⚠️', '⭐', '🌈', '🌍', '🐱', '🍕', '💪'];
const AVATAR_OPTIONS = ['👤', '🧑‍💻', '👩‍💻', '🐱', '🐶', '🦊', '🦁', '🤖', '👻', '👾', '🚀', '🌈', '⚡', '💎'];

// --- UTILS ---
function showToast(msg: string, type: 'info' | 'error' = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  elements.toastContainer.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

async function checkApiKey() {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
        const has = await aistudio.hasSelectedApiKey();
        if (!has) {
            showToast("Wymagany płatny klucz API dla tej funkcji.", "info");
            await aistudio.openSelectKey();
        }
    }
}

async function handleApiError(e: any) {
    console.error("API Error Debug:", e);
    const errorMsg = e.message || "Unknown error";
    if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("404") || errorMsg.includes("API_KEY_INVALID")) {
        showToast("Błąd dostępu (404/Klucz). Proszę wybrać klucz ponownie.", "error");
        const aistudio = (window as any).aistudio;
        if (aistudio && typeof aistudio.openSelectKey === 'function') {
            await aistudio.openSelectKey();
        }
    } else {
        showToast(`Błąd API: ${errorMsg}`, "error");
    }
}

async function getCurrentLocation() {
    return new Promise<{latitude: number, longitude: number} | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 5000 }
        );
    });
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

// --- PROFILE LOGIC ---
let tempAvatar = userProfile.avatar;

function setupProfile() {
    elements.profileBtn.onclick = () => {
        elements.profileNameInput.value = userProfile.name;
        elements.profileColorInput.value = userProfile.color;
        tempAvatar = userProfile.avatar;
        renderAvatarGrid();
        elements.profileModal.classList.remove('hidden');
    };

    elements.closeProfileBtnTop.onclick = () => elements.profileModal.classList.add('hidden');

    function renderAvatarGrid() {
        elements.avatarGrid.innerHTML = '';
        AVATAR_OPTIONS.forEach(avatar => {
            const btn = document.createElement('button');
            btn.className = `avatar-option ${tempAvatar === avatar ? 'selected' : ''}`;
            btn.textContent = avatar;
            btn.onclick = () => {
                tempAvatar = avatar;
                renderAvatarGrid();
            };
            elements.avatarGrid.appendChild(btn);
        });
    }

    elements.saveProfileBtn.onclick = () => {
        userProfile = {
            name: elements.profileNameInput.value.trim() || 'Użytkownik',
            avatar: tempAvatar,
            color: elements.profileColorInput.value
        };
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        elements.profileModal.classList.add('hidden');
        showToast("Profil zaktualizowany!");
        renderHistory(); // Refresh colors/names in current view
    };
}

// --- EMOJI PICKER LOGIC ---
function setupEmojiPicker() {
    elements.emojiPicker.innerHTML = ''; 
    POPULAR_EMOJIS.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'emoji-item';
        btn.textContent = emoji;
        btn.onclick = () => {
            const input = elements.messageInput;
            const start = input.selectionStart || 0;
            const end = input.selectionEnd || 0;
            const text = input.value;
            input.value = text.substring(0, start) + emoji + text.substring(end);
            input.focus();
            input.setSelectionRange(start + emoji.length, start + emoji.length);
            elements.emojiPickerContainer.classList.add('hidden');
        };
        elements.emojiPicker.appendChild(btn);
    });

    elements.emojiButton.onclick = (e) => {
        e.stopPropagation();
        elements.emojiPickerContainer.classList.toggle('hidden');
    };

    document.addEventListener('click', (e) => {
        if (elements.emojiPickerContainer && !elements.emojiPickerContainer.contains(e.target as Node) && e.target !== elements.emojiButton) {
            elements.emojiPickerContainer.classList.add('hidden');
        }
    });
}

// --- VEO VIDEO GENERATION ---
async function generateVeoVideo(prompt: string, imageBase64?: string) {
  await checkApiKey();
  const msgContent = createMessageElement('ai');
  msgContent.innerHTML = `<div class="loading-state">🎬 Veo 3.1 tworzy wideo... Może to potrwać do 2 minut.</div>`;
  
  try {
    const ai = getAi();
    const aspectRatio = (elements.imgAspect.value === '9:16') ? '9:16' : '16:9';
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt || "Kreatywna animacja",
      image: imageBase64 ? { imageBytes: imageBase64, mimeType: 'image/png' } : undefined,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
    });

    while (!operation.done) {
      await new Promise(r => setTimeout(r, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoUrl = URL.createObjectURL(await res.blob());

    msgContent.innerHTML = `<video controls class="msg-media-inline" autoplay loop><source src="${videoUrl}" type="video/mp4"></video>`;
  } catch (e: any) {
    handleApiError(e);
    msgContent.innerHTML = `<span class="error-text">Błąd Veo: ${e.message}</span>`;
  }
}

// --- CHAT & IMAGE & GROUNDING LOGIC ---
async function handleChat(prompt: string, mediaData?: { data: string, mimeType: string }) {
  if (isVideoMode) return generateVeoVideo(prompt, mediaData?.data);

  if (isThinkMode || isSearchEnabled || isMapsEnabled || prompt.toLowerCase().includes("generuj obraz")) {
      await checkApiKey();
  }

  const ai = getAi();
  const content = createMessageElement('ai');
  const textDiv = document.createElement('div');
  const groundingDiv = document.createElement('div');
  groundingDiv.className = "grounding-box hidden";
  content.appendChild(textDiv);
  content.appendChild(groundingDiv);

  try {
    let model = 'gemini-3-flash-preview'; 
    const config: any = { systemInstruction: SYSTEM_INSTRUCTION };
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes("generuj obraz") || lowerPrompt.includes("narysuj")) {
        model = 'gemini-3-pro-image-preview';
        config.imageConfig = { aspectRatio: elements.imgAspect.value, imageSize: elements.imgSize.value };
    } 
    else if (mediaData?.mimeType.startsWith('image/') && (lowerPrompt.includes("edytuj") || lowerPrompt.includes("filtr") || lowerPrompt.includes("zmień"))) {
        model = 'gemini-2.5-flash-image';
    }
    else if (isThinkMode) {
        model = 'gemini-3-pro-preview';
        config.thinkingConfig = { thinkingBudget: 24000 }; 
    }
    else if (isSearchEnabled || isMapsEnabled) {
        config.tools = [];
        if (isSearchEnabled) config.tools.push({ googleSearch: {} });
        if (isMapsEnabled) {
            model = 'gemini-2.5-flash';
            config.tools.push({ googleMaps: {} });
            const loc = await getCurrentLocation();
            if (loc) config.toolConfig = { retrievalConfig: { latLng: { latitude: loc.latitude, longitude: loc.longitude } } };
        }
    } else {
        model = 'gemini-3-flash-preview'; 
    }

    const contents: any = { parts: [{ text: prompt }] };
    if (mediaData) contents.parts.push({ inlineData: mediaData });

    const response = await ai.models.generateContent({ model, contents, config });
    
    const responseText = response.text || "";
    if (responseText) {
        textDiv.innerHTML = marked.parse(responseText) as string;
        if (isTTSActive) speakText(responseText);
    }

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) {
        const img = document.createElement('img');
        img.src = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        img.className = 'msg-media-inline';
        content.appendChild(img);
    }

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        groundingDiv.classList.remove('hidden');
        groundingDiv.innerHTML = "<strong>Źródła:</strong><ul></ul>";
        chunks.forEach((c: any) => {
            const uri = c.web?.uri || c.maps?.uri;
            if (uri) {
                const li = document.createElement('li');
                li.innerHTML = `<a href="${uri}" target="_blank">${c.web?.title || c.maps?.title || 'Link'}</a>`;
                groundingDiv.querySelector('ul')?.appendChild(li);
            }
        });
    }

    persistedHistory.push({ sender: 'ai', text: responseText, name: 'Adi Pro', avatar: '🤖', color: '#ffffff' });
    localStorage.setItem('chatHistoryDetailed', JSON.stringify(persistedHistory.slice(-40)));
    elements.messagesWrapper.scrollTop = elements.messagesWrapper.scrollHeight;

  } catch (e: any) {
    handleApiError(e);
    textDiv.innerHTML = `<span class="error-text">Błąd API: ${e.message}</span>`;
  }
}

// --- TTS & LIVE ---
async function speakText(text: string) {
  try {
    const ai = getAi();
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Powiedz: ${text.substring(0, 500)}` }] }],
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } }
    });
    const b64 = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (b64) {
      const audioCtx = new AudioContext({ sampleRate: 24000 });
      const buffer = await decodeAudioData(decode(b64), audioCtx, 24000, 1);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer; source.connect(audioCtx.destination); source.start();
    }
  } catch (e) {}
}

let liveSession: any = null;
async function startLiveSession() {
  await checkApiKey();
  const ai = getAi();
  elements.liveOverlay.classList.remove('hidden');
  const outCtx = new AudioContext({ sampleRate: 24000 });
  let nextStart = 0;
  const sourcesArr = new Set<AudioBufferSourceNode>();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const livePromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      config: { 
          responseModalities: [Modality.AUDIO], 
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: SYSTEM_INSTRUCTION
      },
      callbacks: {
        onopen: () => {
          const inCtx = new AudioContext({ sampleRate: 16000 });
          const src = inCtx.createMediaStreamSource(stream);
          const proc = inCtx.createScriptProcessor(4096, 1, 1);
          proc.onaudioprocess = (e) => {
            const data = e.inputBuffer.getChannelData(0);
            const i16 = new Int16Array(data.length);
            for (let i = 0; i < data.length; i++) i16[i] = data[i] * 32768;
            livePromise.then(session => {
                liveSession = session;
                session.sendRealtimeInput({ media: { data: encode(new Uint8Array(i16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
            });
          };
          src.connect(proc); proc.connect(inCtx.destination);
        },
        onmessage: async (msg: LiveServerMessage) => {
          const b64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (b64) {
            nextStart = Math.max(nextStart, outCtx.currentTime);
            const buf = await decodeAudioData(decode(b64), outCtx, 24000, 1);
            const s = outCtx.createBufferSource();
            s.buffer = buf; 
            s.connect(outCtx.destination); 
            s.start(nextStart);
            nextStart += buf.duration;
            sourcesArr.add(s);
          }
          if (msg.serverContent?.interrupted) { sourcesArr.forEach(s => s.stop()); sourcesArr.clear(); nextStart = 0; }
        },
        onerror: (e) => { handleApiError(e); stopLiveSession(); },
        onclose: () => stopLiveSession()
      }
    });
  } catch (e) { handleApiError(e); stopLiveSession(); }
}

function stopLiveSession() { 
    if (liveSession) { liveSession.close(); liveSession = null; }
    elements.liveOverlay.classList.add('hidden'); 
}

// --- UI HELPERS ---
function createMessageElement(sender: 'user' | 'ai', name?: string, avatar?: string, color?: string) {
  const wrap = document.createElement('div');
  wrap.className = `message-wrapper-outer ${sender}`;
  const msg = document.createElement('div');
  msg.className = `message ${sender}`;
  
  const displayAvatar = avatar || (sender === 'user' ? userProfile.avatar : '🤖');
  const displayName = name || (sender === 'user' ? userProfile.name : 'Adi Pro');
  const displayColor = color || (sender === 'user' ? userProfile.color : '#ffffff');

  msg.style.backgroundColor = displayColor;
  if (sender === 'user') msg.style.color = 'white'; // White text on user bubble colors

  msg.innerHTML = `<div class="avatar">${displayAvatar}</div><div class="content"><strong>${displayName}</strong><div class="text-content"></div></div>`;
  wrap.appendChild(msg);
  elements.messagesDiv.appendChild(wrap);
  return msg.querySelector('.text-content') as HTMLElement;
}

function renderHistory() {
  elements.messagesDiv.innerHTML = '';
  persistedHistory.forEach(item => {
    const textContentEl = createMessageElement(item.sender, item.name, item.avatar, item.color);
    textContentEl.innerHTML = marked.parse(item.text || "") as string;
  });
  elements.messagesWrapper.scrollTop = elements.messagesWrapper.scrollHeight;
}

// --- SETUP ---
function init() {
  renderHistory();
  setupProfile();
  setupEmojiPicker();

  elements.sendButton.onclick = () => {
    const p = elements.messageInput.value.trim();
    if (!p && !selectedFileBase64) return;
    
    const c = createMessageElement('user');
    if (selectedFileBase64) {
        const img = document.createElement('img');
        img.src = `data:${selectedFile!.type};base64,${selectedFileBase64}`;
        img.className = 'msg-media-inline';
        c.appendChild(img);
    }
    const safePrompt = p || "Analiza zawartości...";
    c.innerHTML += marked.parse(safePrompt);
    
    persistedHistory.push({ 
        sender: 'user', 
        text: p, 
        name: userProfile.name, 
        avatar: userProfile.avatar,
        color: userProfile.color
    });
    localStorage.setItem('chatHistoryDetailed', JSON.stringify(persistedHistory.slice(-40)));
    
    handleChat(p, selectedFileBase64 ? { data: selectedFileBase64, mimeType: selectedFile!.type } : undefined);
    elements.messageInput.value = "";
    elements.removeAttachmentBtn.click();
  };

  elements.attachButton.onclick = () => elements.mediaInputHidden.click();
  elements.mediaInputHidden.onchange = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (re) => {
        selectedFileBase64 = (re.target?.result as string).split(',')[1];
        elements.attachmentPreview.classList.remove('hidden');
        elements.previewContent.innerHTML = file.type.startsWith('image/') ? `<img src="${re.target?.result}">` : `📄 ${file.name}`;
    };
    reader.readAsDataURL(file);
  };
  elements.removeAttachmentBtn.onclick = () => { selectedFile = null; selectedFileBase64 = null; elements.attachmentPreview.classList.add('hidden'); };

  elements.thinkToggle.onclick = () => { isThinkMode = !isThinkMode; elements.thinkToggle.classList.toggle('active', isThinkMode); };
  elements.videoToggle.onclick = () => { isVideoMode = !isVideoMode; elements.videoToggle.classList.toggle('active', isVideoMode); };
  elements.searchToggle.onclick = () => { isSearchEnabled = !isSearchEnabled; elements.searchToggle.classList.toggle('active', isSearchEnabled); };
  elements.mapsToggle.onclick = () => { isMapsEnabled = !isMapsEnabled; elements.mapsToggle.classList.toggle('active', isMapsEnabled); };
  elements.ttsToggle.onclick = () => { isTTSActive = !isTTSActive; elements.ttsToggle.classList.toggle('active', isTTSActive); };
  
  elements.liveMicBtn.onclick = startLiveSession;
  elements.stopLiveBtn.onclick = stopLiveSession;
  elements.manageApiKeyBtn.onclick = checkApiKey;
  
  elements.settingsBtn.onclick = () => elements.settingsModal.classList.remove('hidden');
  const closeSettings = () => elements.settingsModal.classList.add('hidden');
  elements.closeSettingsBtnTop.onclick = closeSettings;
  elements.closeSettingsBtn.onclick = closeSettings;

  elements.clearHistoryBtn.onclick = () => {
    if (confirm("Czy na pewno chcesz wyczyścić historię rozmów?")) {
        persistedHistory = [];
        localStorage.removeItem('chatHistoryDetailed');
        elements.messagesDiv.innerHTML = '';
        showToast("Historia wyczyszczona.");
    }
  };
}

init();
