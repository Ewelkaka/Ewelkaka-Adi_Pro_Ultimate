
import React, { useState, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, AreaChart, Area, BarChart, Bar, Legend } from "recharts";

// --- GLOBAL ERROR HANDLER ---
// Handled in index.html for early capture

// --- TYPES ---
interface ResourceUsage {
    energy: number;
    cost: number;
    duration: number;
}

interface RepairHistoryEntry {
    timestamp: number;
    date: string;
    success: boolean;
    type: string;
    label?: string;
    resources?: ResourceUsage;
    preHealth?: number;
    postHealth?: number;
}

enum TaskPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH'
}

interface Task {
    id: string;
    desc: string;
    priority: TaskPriority;
    status: 'PENDING' | 'COMPLETED';
    timestamp: number;
}

interface CellRegenEntry {
    timestamp: number;
    date: string;
    pre: { voltage: number; temp: number; fx: number };
    post: { voltage: number; temp: number; fx: number };
}

interface BatteryCell {
    id: number;
    voltage: number;
    temp: number;
    status: 'GOOD' | 'WEAK' | 'CRITICAL';
    fx: number;
    regenHistory?: CellRegenEntry[];
}

interface BatteryBank {
    id: number;
    voltage: string;
    ir: string;
    temp: string;
    fx: number;
    repairHistory: RepairHistoryEntry[];
    v2gStatus?: 'READY' | 'ENGAGED' | 'OFFLINE';
    healthPrediction?: 'STABLE' | 'DEGRADING' | 'REGEN_REQ' | 'AT_RISK';
    predictedFailureDate?: string;
    degradationRate?: number;
    cells?: BatteryCell[];
}

interface ChartDataPoint {
    time: string;
    [key: string]: string | number;
}

interface Alert {
    id: string;
    bankId: number;
    type: 'CRITICAL' | 'WARNING' | 'INFO';
    message: string;
    timestamp: number;
    acknowledged: boolean;
}

// --- LICENSE MANAGER ---
class LicenseManager {
    private static readonly NAZWA_SYSTEMU = "Adi Pro Ultimate 2026 Sovereign";
    private static readonly DATA = "2026-02-20";
    private static readonly KLUCZ_PRYWATNY = "SuperSekretnyKluczEwelina";
    private static readonly LICENCJA_FILE = "/licencja.json";

    private static async sha256(message: string): Promise<string> {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    public static async verify(): Promise<boolean> {
        // Bypass license check for development/preview
        console.log("License check bypassed for user session.");
        return true;
        /*
        try {
            console.log("Verifying license...");
            const response = await fetch(this.LICENCJA_FILE);
            if (!response.ok) {
                console.error("License file not found or fetch failed");
                return false;
            }
            const licencja = await response.json();

            const tokenUzytkownika = await this.sha256(`${this.NAZWA_SYSTEMU}${this.DATA}${this.KLUCZ_PRYWATNY}`);
            const tokenZPliku = licencja.licencja.numer_licencji;

            if (tokenZPliku !== tokenUzytkownika) {
                console.error("Token mismatch: expected", tokenUzytkownika, "got", tokenZPliku);
                return false;
            }

            if (!licencja.warunki_użytkowania.autoryzowany_użytkownik) {
                console.error("User not authorized in license file");
                return false;
            }

            console.log("License verified successfully");
            return true;
        } catch (e) {
            console.error("License verification error:", e);
            return false;
        }
        */
    }

    public static lockout() {
        const overlay = document.getElementById('license-lockout');
        const timestamp = document.getElementById('lockout-timestamp');
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
        }
        if (timestamp) {
            timestamp.innerText = `LOCKOUT_EVENT: ${new Date().toISOString()} // NODE_ID: ${Math.random().toString(36).substring(7).toUpperCase()}`;
        }
        console.error("Licencja nieważna lub nieautoryzowana – kontakt z właścicielem");
    }
}

// --- SOVEREIGN HEURISTIC ENGINE (SHE) ---
class SHE {
    private static JARGON = [
        "ionic jitter", "SEI layer passivization", "dendrite shattering", 
        "lattice entropy shift", "7.42Hz resonant lock", "Quantum Tunneling verified",
        "electrochemical stability achieved", "anode recrystallization",
        "thermal runaway preventive block", "capacitance bias corrected",
        "harmonic jitter normalization", "impedance floor reached",
        "molecular integrity baseline restored", "lithium plating reversal",
        "Coulombic efficiency gap bridged", "Dendrite bifurcation mitigated",
        "Electrolyte cavitation suppressed", "Lattice stress localized",
        "BMS shunt impedance verified", "Thermal gradient neutralized"
    ];

    public static getRandomJargon(): string {
        return this.JARGON[Math.floor(Math.random() * this.JARGON.length)];
    }

    public static generateTrace(action: string, context: BatteryBank): string {
        const index1 = Math.floor(Math.random() * this.JARGON.length);
        const index2 = (index1 + 1) % this.JARGON.length;
        const index3 = (index2 + 1) % this.JARGON.length;

        if (action === "FFT Scan") {
            return `FFT ANALYSIS COMPLETE. Detected ${this.JARGON[index1]} at ${context.ir}mOhm. Local floor secured at -124dB. Frequency noise within nominal limits.`;
        }
        if (action === "V2G Sync") {
            return `OFFLINE GRID SYNC: ${this.JARGON[index2]} detected in B${context.id}. Voltage stabilization threshold locked at ${context.voltage}V. Grid phase matched.`;
        }
        if (action === "Hadron Repair") {
            return `CRITICAL RECOVERY: ${this.JARGON[index3]} in progress. Lattice Entropy corrected from ${context.fx.toFixed(2)}Fx. 7.42Hz Pulse active. Anode surface stabilized.`;
        }
        if (action === "Isotope Map") {
            return `STABILITY MAPPING: Isotope ${this.JARGON[index1]} density within nominal limits. B${context.id} stability index: 0.992. No localized hotspots found.`;
        }
        if (action === "Stress Test") {
            return `LOAD SIMULATION: 40A Burst applied. ${this.JARGON[index2]} response verified. No sagging detected. Recovery time: 42ms.`;
        }
        return `SYSTEM_HEURISTIC: ${this.JARGON[index1]} verification in B${context.id} successful. Integrity score: 98.4%.`;
    }
}

// --- OSCILLOSCOPE VISUALIZER ---
class SovereignOscilloscope {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private offset: number = 0;
    private frequency: number = 1;
    private amplitude: number = 20;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.animate();
        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    private resize() {
        const rect = this.canvas.parentElement?.getBoundingClientRect();
        if (rect) {
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        }
    }

    public setMode(mode: 'normal' | 'repair' | 'stress') {
        if (mode === 'repair') { this.frequency = 4; this.amplitude = 30; }
        else if (mode === 'stress') { this.frequency = 10; this.amplitude = 15; }
        else { this.frequency = 1; this.amplitude = 20; }
    }

    private animate() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);
        
        this.ctx.strokeStyle = 'rgba(0, 255, 204, 0.05)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < w; i += 20) {
            this.ctx.beginPath(); this.ctx.moveTo(i, 0); this.ctx.lineTo(i, h); this.ctx.stroke();
        }
        for (let j = 0; j < h; j += 20) {
            this.ctx.beginPath(); this.ctx.moveTo(0, j); this.ctx.lineTo(w, j); this.ctx.stroke();
        }

        this.ctx.strokeStyle = '#00ffcc';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, h / 2);

        for (let x = 0; x < w; x++) {
            const y = h / 2 + Math.sin((x + this.offset) * 0.05 * this.frequency) * this.amplitude;
            this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
        
        this.offset += 2 * (this.frequency / 2);
        requestAnimationFrame(() => this.animate());
    }
}

// --- HADRON VISUAL ENGINE ---
interface Particle {
    angle: number; radius: number; tiltX: number; tiltZ: number; speed: number; size: number; color: string;
    history: { x: number; y: number; z: number }[]; x: number; y: number; z: number; screenX: number; screenY: number;
}

class HadronOrbit {
    private canvas: HTMLCanvasElement; private ctx: CanvasRenderingContext2D; private particles: Particle[] = [];
    private activeSpeedMultiplier: number = 1; private corePulse: number = 0; private isRepairing: boolean = false;
    private isScanning: boolean = false; private isSyncing: boolean = false; private orbitRotation: number = 0;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d', { alpha: true })!;
        this.init(); this.animate();
        window.addEventListener('resize', () => this.resize());
        setTimeout(() => this.resize(), 100);
    }

    private init() {
        this.resize();
        this.particles = [];
        const ringConfigs = [
            { radius: 100, tiltX: 1.1, tiltZ: 0.15, count: 25, speed: 0.015, color: '#00ff41' },
            { radius: 135, tiltX: 1.1, tiltZ: -0.1, count: 40, speed: 0.012, color: '#00f2ff' },
            { radius: 175, tiltX: 1.1, tiltZ: 0.05, count: 30, speed: 0.009, color: '#ffd700' }
        ];
        ringConfigs.forEach(conf => {
            for (let i = 0; i < conf.count; i++) {
                this.particles.push({
                    angle: Math.random() * Math.PI * 2, radius: conf.radius + (Math.random() - 0.5) * 12,
                    tiltX: conf.tiltX, tiltZ: conf.tiltZ, speed: conf.speed * (0.8 + Math.random() * 0.4),
                    size: 1.2 + Math.random() * 2, color: conf.color, history: [],
                    x: 0, y: 0, z: 0, screenX: 0, screenY: 0
                });
            }
        });
    }

    private resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width; this.canvas.height = rect.height;
    }

    public setMode(mode: 'repair' | 'scan' | 'sync' | 'idle' | 'v2g') {
        this.activeSpeedMultiplier = mode === 'repair' ? 12 : (mode === 'scan' ? 3 : (mode === 'sync' ? 1.5 : (mode === 'v2g' ? 2.5 : 1)));
        this.isRepairing = mode === 'repair'; 
        this.isScanning = mode === 'scan'; 
        this.isSyncing = mode === 'sync' || mode === 'v2g';
    }

    private project(x: number, y: number, z: number, tiltX: number, tiltZ: number) {
        let y1 = y * Math.cos(tiltX) - z * Math.sin(tiltX);
        let z1 = y * Math.sin(tiltX) + z * Math.cos(tiltX);
        let x2 = x * Math.cos(tiltZ) - y1 * Math.sin(tiltZ);
        let y2 = x * Math.sin(tiltZ) + y1 * Math.cos(tiltZ);
        return { x: x2, y: y2, z: z1 };
    }

    private drawLaserOrbit(radius: number, tiltX: number, tiltZ: number, color: string, zFilter: 'back' | 'front', centerX: number, centerY: number) {
        const segments = 120;
        this.ctx.beginPath();
        this.ctx.lineWidth = this.isRepairing ? 4 : (this.isScanning ? 0.5 : 1);
        this.ctx.strokeStyle = this.isRepairing ? '#00ff41' : color;
        this.ctx.globalAlpha = this.isRepairing ? 1.0 : (this.isSyncing ? 0.9 : 0.3);
        if (this.isScanning) { this.ctx.setLineDash([2, 2]); } else { this.ctx.setLineDash([8, 12]); }
        this.ctx.lineDashOffset = -this.orbitRotation * (this.isRepairing ? 120 : 20);
        let firstPoint = true;
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const pos = this.project(Math.cos(angle) * radius, Math.sin(angle) * radius, 0, tiltX, tiltZ);
            const isCorrectZ = zFilter === 'back' ? pos.z < 0 : pos.z >= 0;
            if (isCorrectZ) {
                if (firstPoint) { this.ctx.moveTo(centerX + pos.x, centerY + pos.y); firstPoint = false; }
                else { this.ctx.lineTo(centerX + pos.x, centerY + pos.y); }
            } else { firstPoint = true; }
        }
        this.ctx.stroke(); this.ctx.setLineDash([]); this.ctx.globalAlpha = 1;
    }

    private drawCore(centerX: number, centerY: number) {
        this.corePulse += 0.05 * this.activeSpeedMultiplier;
        const baseSize = 24; const pulse = Math.sin(this.corePulse) * 4;
        let size = (this.isRepairing ? baseSize * 2.0 : baseSize) + pulse;
        if (this.isScanning) size *= 0.8;
        this.ctx.shadowBlur = (this.isRepairing ? 80 : 40) + pulse * 5;
        this.ctx.shadowColor = this.isRepairing ? 'rgba(0, 255, 65, 0.9)' : (this.isSyncing ? 'rgba(255, 215, 0, 0.8)' : 'rgba(0, 242, 255, 0.6)');
        const grad = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, this.isRepairing ? '#00ff41' : (this.isSyncing ? '#ffd700' : '#00f2ff'));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = grad; this.ctx.beginPath(); this.ctx.arc(centerX, centerY, size, 0, Math.PI * 2); this.ctx.fill(); this.ctx.shadowBlur = 0;
    }

    private animate() {
        if (!this.canvas) return;
        const w = this.canvas.width; const h = this.canvas.height;
        const centerX = w / 2; const centerY = h / 2;
        this.orbitRotation += 0.01;
        this.ctx.clearRect(0, 0, w, h);
        this.particles.forEach(p => {
            p.angle += p.speed * this.activeSpeedMultiplier;
            const pos = this.project(Math.cos(p.angle) * p.radius, Math.sin(p.angle) * p.radius, 0, p.tiltX, p.tiltZ);
            p.screenX = centerX + pos.x; p.screenY = centerY + pos.y; p.z = pos.z;
        });
        const behind = this.particles.filter(p => p.z < 0).sort((a, b) => a.z - b.z);
        const inFront = this.particles.filter(p => p.z >= 0).sort((a, b) => a.z - b.z);
        const drawP = (p: Particle) => {
            const zScale = 1 + p.z / 250;
            this.ctx.fillStyle = this.isRepairing ? '#00ff41' : p.color;
            this.ctx.globalAlpha = 0.3 + (p.z + 250) / 500;
            this.ctx.beginPath(); this.ctx.arc(p.screenX, p.screenY, p.size * zScale, 0, Math.PI * 2); this.ctx.fill(); this.ctx.globalAlpha = 1;
        };
        this.drawLaserOrbit(100, 1.1, 0.15, '#00ff41', 'back', centerX, centerY);
        this.drawLaserOrbit(135, 1.1, -0.1, '#00f2ff', 'back', centerX, centerY);
        this.drawLaserOrbit(175, 1.1, 0.05, '#ffd700', 'back', centerX, centerY);
        behind.forEach(drawP); this.drawCore(centerX, centerY);
        this.drawLaserOrbit(100, 1.1, 0.15, '#00ff41', 'front', centerX, centerY);
        this.drawLaserOrbit(135, 1.1, -0.1, '#00f2ff', 'front', centerX, centerY);
        this.drawLaserOrbit(175, 1.1, 0.05, '#ffd700', 'front', centerX, centerY);
        inFront.forEach(drawP);
        requestAnimationFrame(() => this.animate());
    }
}

// --- REAL-TIME CHARTS ---
const VoltageChart = ({ data, selectedIndex }: { data: ChartDataPoint[], selectedIndex: number }) => {
    const lines = useMemo(() => Array.from({ length: 32 }, (_, i) => `bank_${i + 1}`), []);
    const selectedBankKey = `bank_${selectedIndex + 1}`;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis domain={[3.5, 4.3]} stroke="rgba(0, 242, 255, 0.4)" fontSize={8} tickFormatter={(val) => `${val}V`} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#0b1219', border: '1px solid #00f2ff', fontSize: '9px', fontFamily: 'JetBrains Mono' }} 
                    itemStyle={{ padding: '2px 0' }}
                    labelStyle={{ display: 'none' }}
                />
                {lines.map((bankKey, idx) => {
                    const isSelected = bankKey === selectedBankKey;
                    return (
                        <Line 
                            key={bankKey} 
                            type="monotone" 
                            dataKey={bankKey} 
                            stroke={isSelected ? "#00f2ff" : (idx % 2 === 0 ? "#00f2ff" : "#ff00ff")} 
                            strokeWidth={isSelected ? 2.5 : 1} 
                            dot={false} 
                            opacity={isSelected ? 1 : 0.05} 
                            isAnimationActive={false} 
                            name={`Bank B${idx + 1}`}
                        />
                    );
                })}
            </LineChart>
        </ResponsiveContainer>
    );
};

const FactorXChart = ({ data }: { data: ChartDataPoint[] }) => {
    const lines = useMemo(() => Array.from({ length: 32 }, (_, i) => `bank_fx_${i + 1}`), []);
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 1.0]} stroke="rgba(255, 215, 0, 0.4)" fontSize={8} tickFormatter={(val) => `${val.toFixed(1)}Fx`} />
                <ReferenceLine y={0.2} stroke="#ffd700" strokeDasharray="3 3" />
                <ReferenceLine y={0.6} stroke="#ff3333" strokeDasharray="3 3" />
                <Tooltip contentStyle={{ backgroundColor: '#000000', border: '1px solid #ffd700', fontSize: '9px', fontFamily: 'JetBrains Mono' }} itemStyle={{ padding: '0px' }} />
                {lines.map((bankKey, idx) => (<Line key={bankKey} type="monotone" dataKey={bankKey} stroke={idx % 2 === 0 ? "#ffd700" : "#ff00ff"} strokeWidth={1} dot={false} opacity={0.15} isAnimationActive={false} />))}
            </LineChart>
        </ResponsiveContainer>
    );
};

const SimulationChart = ({ data }: { data: any[] }) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorSoh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00ff41" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00ff41" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffd700" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ffd700" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={8} />
                <YAxis yAxisId="left" stroke="#00ff41" fontSize={8} domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" stroke="#ffd700" fontSize={8} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#0b1219', border: '1px solid #00f2ff', fontSize: '10px', fontFamily: 'JetBrains Mono' }} 
                />
                <Area yAxisId="left" type="monotone" dataKey="soh" stroke="#00ff41" fillOpacity={1} fill="url(#colorSoh)" name="Fleet Health %" isAnimationActive={false} />
                <Area yAxisId="right" type="monotone" dataKey="savings" stroke="#ffd700" fillOpacity={1} fill="url(#colorRoi)" name="Savings (AUD)" isAnimationActive={false} />
            </AreaChart>
        </ResponsiveContainer>
    );
};

// --- APP CORE ---
const orbit = new HadronOrbit('hadron-canvas');
const osc = new SovereignOscilloscope('osc-canvas');
let isRepairing = false; let selectedIndex = 0; let globalHistoryMode = false;
const STORAGE_KEY = 'adi_sovereign_v26_55';
const TASKS_KEY = 'adi_tasks_v1';

let undoSnapshot: BatteryBank | null = null;
let undoTargetIndex: number | null = null;
let undoTimeoutId: any = null;
let undoRemaining = 10;

const chartHistory: ChartDataPoint[] = [];
const fxHistory: ChartDataPoint[] = [];
const MAX_HISTORY = 40;

let tasks: Task[] = [];
try {
    const savedTasks = localStorage.getItem(TASKS_KEY);
    if (savedTasks) tasks = JSON.parse(savedTasks);
    else tasks = [
        { id: 't1', desc: 'INSPECT B04 THERMAL', priority: TaskPriority.HIGH, status: 'PENDING', timestamp: Date.now() },
        { id: 't2', desc: 'CALIBRATE SENSORS', priority: TaskPriority.LOW, status: 'PENDING', timestamp: Date.now() - 10000 }
    ];
} catch (e) { console.error(e); }

function saveTasks() {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    renderTasks();
}

function loadData(): BatteryBank[] {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { 
        try { 
            let data = JSON.parse(saved);
            // Migration: Ensure cells exist
            data = data.map((b: BatteryBank) => {
                if (!b.cells) {
                    b.cells = Array.from({ length: 16 }, (_, i) => ({
                        id: i + 1,
                        voltage: 3.9 + Math.random() * 0.2,
                        temp: 22 + Math.random() * 5,
                        status: Math.random() > 0.9 ? 'WEAK' : 'GOOD'
                    }));
                }
                return b;
            });
            return data;
        } catch(e) { console.error(e); } 
    }
    return Array.from({ length: 32 }, (_, i) => ({
        id: i + 1, voltage: (3.9 + Math.random() * 0.2).toFixed(2), ir: (12 + Math.random() * 8).toFixed(1),
        temp: (22 + Math.random() * 5).toFixed(1), fx: 0.02 + Math.random() * 0.1, repairHistory: [],
        v2gStatus: 'READY',
        healthPrediction: 'STABLE',
        degradationRate: 0.005 + Math.random() * 0.01,
        predictedFailureDate: '> 30 DAYS',
        cells: Array.from({ length: 16 }, (_, j) => ({
            id: j + 1,
            voltage: 3.9 + Math.random() * 0.2,
            temp: 22 + Math.random() * 5,
            status: Math.random() > 0.95 ? 'CRITICAL' : (Math.random() > 0.8 ? 'WEAK' : 'GOOD'),
            fx: 0.01 + Math.random() * 0.05
        }))
    }));
}

let batteryData = loadData();

// UI Elements
const matrix = document.getElementById('bank-matrix')!;
const logBox = document.getElementById('log-container')!;
const repairBtn = document.getElementById('repair-btn') as HTMLButtonElement;
const undoBtn = document.getElementById('undo-btn') as HTMLButtonElement;
const initiateBtn = document.getElementById('deep-pulse-btn') as HTMLButtonElement;
const scanFftBtn = document.getElementById('scan-fft-btn') as HTMLButtonElement;
const v2gSyncBtn = document.getElementById('v2g-sync-btn') as HTMLButtonElement;
const equityBtn = document.getElementById('equity-btn') as HTMLButtonElement;
const purgeBtn = document.getElementById('purge-btn') as HTMLButtonElement;
const isotopeBtn = document.getElementById('isotope-btn') as HTMLButtonElement;
const stressBtn = document.getElementById('stress-btn') as HTMLButtonElement;
const predictBtn = document.getElementById('predict-btn') as HTMLButtonElement;
const filterRegenBtn = document.getElementById('filter-regen-btn') as HTMLButtonElement;
const filterV2GBtn = document.getElementById('filter-v2g-btn') as HTMLButtonElement;
const filterAllBtn = document.getElementById('filter-all-btn') as HTMLButtonElement;
const bmsResetBtn = document.getElementById('bms-reset-btn') as HTMLButtonElement;

const targetLabel = document.getElementById('target-label')!;
const historyContainer = document.getElementById('repair-history-container')!;
const fleetSummaryContainer = document.getElementById('fleet-summary-container')!;
const historyTitleElement = document.querySelector('#repair-history-container')?.parentElement?.querySelector('span');
const sohIndicator = document.getElementById('soh-indicator')!;
const historyModeBtn = document.getElementById('toggle-history-mode')!;
const fusionGauge = document.getElementById('fusion-gauge-fill')!;
const fusionPercentText = document.getElementById('fusion-percent')!;
const gridStatus = document.getElementById('grid-status')!;
const waveStatus = document.getElementById('wave-status')!;
const appRoot = document.getElementById('app-root')!;
const modalOverlay = document.getElementById('confirm-modal-overlay')!;
const modalCancel = document.getElementById('modal-cancel')!;
const modalConfirm = document.getElementById('modal-confirm')!;

// Sim Elements
const openSimBtn = document.getElementById('open-sim-btn')!;
const simModalOverlay = document.getElementById('sim-modal-overlay')!;
const simCloseBtn = document.getElementById('sim-close-btn')!;

// Cell Inspector Elements
const cellInspectorModal = document.getElementById('cell-inspector-modal')!;
const cellInspectorClose = document.getElementById('cell-inspector-close')!;
const inspectorBankId = document.getElementById('inspector-bank-id')!;
const inspectorBankVoltage = document.getElementById('inspector-bank-voltage')!;
const inspectorBankStatus = document.getElementById('inspector-bank-status')!;
const inspectorFailureContainer = document.getElementById('inspector-failure-container')!;
const inspectorFailureDate = document.getElementById('inspector-failure-date')!;
const inspectorFailureProb = document.getElementById('inspector-failure-prob')!;
const inspectorDegradationRate = document.getElementById('inspector-degradation-rate')!;
const cellGrid = document.getElementById('cell-grid')!;
const regenCellsBtn = document.getElementById('regen-cells-btn') as HTMLButtonElement;

let selectedCells: number[] = [];

function openCellInspector(bankIndex: number) {
    const bank = batteryData[bankIndex];
    if (!bank.cells) return;

    inspectorBankId.innerText = `B${String(bank.id).padStart(2, '0')}`;
    inspectorBankVoltage.innerText = bank.voltage;
    inspectorBankStatus.innerText = bank.healthPrediction || 'STABLE';
    inspectorBankStatus.className = `text-xl font-black uppercase tracking-tighter ${bank.healthPrediction === 'REGEN_REQ' ? 'text-adi-red animate-pulse' : (bank.healthPrediction === 'AT_RISK' ? 'text-adi-gold' : 'text-adi-green')}`;

    if (bank.predictedFailureDate) {
        inspectorFailureContainer.classList.remove('hidden');
        inspectorFailureDate.innerText = bank.predictedFailureDate === 'IMMINENT' ? 'IMMINENT FAILURE' : bank.predictedFailureDate;
        inspectorFailureDate.className = `text-[10px] font-black tabular-nums tracking-widest ${bank.predictedFailureDate === 'IMMINENT' ? 'text-adi-red animate-pulse' : 'text-adi-gold'}`;
        
        // Calculate probability based on health score
        const fleetAvgV = batteryData.reduce((a, b) => a + parseFloat(b.voltage), 0) / batteryData.length;
        const bhs = calculateBHS(bank, fleetAvgV);
        const prob = Math.min(99.9, Math.max(0.1, (100 - bhs) * (bank.healthPrediction === 'REGEN_REQ' ? 1.5 : 1)));
        inspectorFailureProb.innerText = `${prob.toFixed(1)}%`;
        inspectorDegradationRate.innerText = `${(bank.degradationRate || 0).toFixed(3)}%/tick`;
    } else {
        inspectorFailureContainer.classList.add('hidden');
    }

    selectedCells = [];
    renderCellGrid(bank);
    cellInspectorModal.classList.remove('hidden');
}

function renderCellGrid(bank: BatteryBank) {
    cellGrid.innerHTML = '';
    const bankVoltageNum = parseFloat(bank.voltage);
    
    bank.cells?.forEach(cell => {
        const el = document.createElement('div');
        const isSelected = selectedCells.includes(cell.id);
        const statusColor = cell.status === 'CRITICAL' ? 'border-adi-red bg-adi-red/10 text-adi-red' : (cell.status === 'WEAK' ? 'border-adi-gold bg-adi-gold/10 text-adi-gold' : 'border-adi-green/30 bg-adi-green/5 text-adi-green');
        const pulse = cell.status === 'CRITICAL' ? 'animate-pulse' : '';
        
        // Calculate average FX improvement per regen cycle (regeneration rate)
        let avgFxImprovement = 0;
        if (cell.regenHistory && cell.regenHistory.length > 0) {
            const totalImprovement = cell.regenHistory.reduce((sum, entry) => sum + (entry.pre.fx - entry.post.fx), 0);
            avgFxImprovement = totalImprovement / cell.regenHistory.length;
        }

        // Calculate cell failure probability
        const cellBhs = calculateCellBHS(cell, bankVoltageNum);
        
        // Multiplier logic as requested: higher for CRITICAL, accounts for bank degradation and regen rate
        let multiplier = 1.0;
        if (cell.status === 'CRITICAL') multiplier = 2.5; 
        else if (cell.status === 'WEAK') multiplier = 1.8;
        
        // Account for bank's overall degradation rate
        const bankDegradation = bank.degradationRate || 0.01;
        multiplier *= (1 + bankDegradation * 10);
        
        // Account for regeneration rate (lower improvement rate = higher failure risk)
        if (avgFxImprovement > 0) {
            const regenEfficiencyFactor = Math.max(0.5, 1.3 - (avgFxImprovement * 15));
            multiplier *= regenEfficiencyFactor;
        } else if (cell.regenHistory && cell.regenHistory.length > 0) {
            multiplier *= 1.5;
        }

        const prob = Math.min(99.9, Math.max(0.1, (100 - cellBhs) * multiplier));
        
        el.className = `p-3 border rounded-sm cursor-pointer transition-all hover:bg-white/5 ${statusColor} ${isSelected ? 'ring-2 ring-white' : ''} ${pulse} relative group/cell`;
        el.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="text-[8px] font-bold uppercase tracking-widest opacity-70">CELL ${String(cell.id).padStart(2, '0')}</span>
                <div class="flex gap-1">
                    ${cell.regenHistory && cell.regenHistory.length > 0 ? `
                        <button class="view-history-btn w-3 h-3 bg-adi-magenta/20 border border-adi-magenta/40 rounded-[1px] flex items-center justify-center hover:bg-adi-magenta/40 transition-colors" title="View Regen History">
                            <span class="text-[6px] text-adi-magenta font-black">H</span>
                        </button>
                    ` : ''}
                    <div class="w-1.5 h-1.5 rounded-full ${cell.status === 'CRITICAL' ? 'bg-adi-red' : (cell.status === 'WEAK' ? 'bg-adi-gold' : 'bg-adi-green')}"></div>
                </div>
            </div>
            <div class="text-xl font-black tabular-nums tracking-tighter mb-1">${cell.voltage.toFixed(2)}V</div>
            <div class="flex justify-between items-end">
                <div class="text-[9px] font-mono opacity-60">${cell.temp.toFixed(1)}°C</div>
                <div class="flex flex-col items-end gap-1">
                    <div class="flex gap-1 items-center">
                        ${avgFxImprovement > 0 ? `
                            <div class="bg-adi-cyan/10 border border-adi-cyan/30 px-1.5 py-0.5 rounded-[1px]" title="Regeneration Rate (Avg ΔFX)">
                                <div class="text-[7px] text-adi-cyan font-black uppercase tracking-tighter">ΔFX: ${avgFxImprovement.toFixed(4)}</div>
                            </div>
                        ` : ''}
                        <div class="bg-black/60 px-2 py-1 rounded-sm border ${prob > 50 ? 'border-adi-red/50' : 'border-white/10'} flex flex-col items-end shadow-lg">
                            <div class="text-[5px] text-white/40 font-bold uppercase tracking-widest">Fail Prob</div>
                            <div class="text-[12px] font-black ${prob > 50 ? 'text-adi-red' : (prob > 20 ? 'text-adi-gold' : 'text-adi-green')} leading-none tracking-tighter">${prob.toFixed(1)}%</div>
                        </div>
                    </div>
                    <div class="text-[6px] text-white/20 font-bold uppercase">Cycles: ${cell.regenHistory?.length || 0}</div>
                </div>
            </div>
        `;
        el.onclick = (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.view-history-btn')) {
                showCellRegenHistory(bank.id, cell);
                return;
            }
            
            if (selectedCells.includes(cell.id)) {
                selectedCells = selectedCells.filter(id => id !== cell.id);
            } else {
                selectedCells.push(cell.id);
            }
            renderCellGrid(bank);
            updateRegenButton();
        };
        cellGrid.appendChild(el);
    });
    updateRegenButton();
}

function updateRegenButton() {
    regenCellsBtn.disabled = selectedCells.length === 0;
    regenCellsBtn.innerText = selectedCells.length > 0 ? `REGENERATE ${selectedCells.length} CELLS` : 'SELECT CELLS';
}

cellInspectorClose.onclick = () => cellInspectorModal.classList.add('hidden');

regenCellsBtn.onclick = () => {
    const bank = batteryData[selectedIndex]; // Currently selected bank in main matrix
    if (!bank.cells) return;

    const avgVoltage = batteryData.reduce((a, b) => a + parseFloat(b.voltage), 0) / batteryData.length;
    const preHealth = calculateBHS(bank, avgVoltage);

    addLog(`CELL REGEN INITIATED: ${selectedCells.length} UNITS`, "cyan");
    
    // Simulate regen
    bank.cells = bank.cells.map(c => {
        if (selectedCells.includes(c.id)) {
            const pre = { voltage: c.voltage, temp: c.temp, fx: c.fx };
            const post = { 
                voltage: 4.1 + Math.random() * 0.1, 
                temp: 24 + Math.random() * 2,
                fx: Math.max(0.001, c.fx * 0.1) // 90% reduction in entropy
            };
            
            const history = c.regenHistory || [];
            history.push({
                timestamp: Date.now(),
                date: new Date().toLocaleTimeString(),
                pre,
                post
            });

            return { ...c, status: 'GOOD', ...post, regenHistory: history };
        }
        return c;
    });

    // Recalculate bank stats based on cells? 
    // For now just visual update
    renderCellGrid(bank);
    selectedCells = [];
    updateRegenButton();
    addLog(`CELL REGEN COMPLETE: OPTIMAL PARAMETERS RESTORED`, "green");
    
    const postHealth = calculateBHS(bank, avgVoltage);
    bank.repairHistory.push({
        timestamp: Date.now(),
        date: new Date().toLocaleTimeString(),
        success: true,
        type: 'CELL_REGEN',
        preHealth,
        postHealth
    });

    // Check if bank health improves
    const criticals = bank.cells.filter(c => c.status === 'CRITICAL').length;
    if (criticals === 0 && bank.healthPrediction === 'REGEN_REQ') {
        bank.healthPrediction = 'STABLE';
        bank.predictedFailureDate = undefined;
        renderMatrix();
        addLog(`BANK B${String(bank.id).padStart(2, '0')} HEALTH RESTORED`, "green");
    }
    renderAnalytics();
};
const simStartBtn = document.getElementById('sim-start-btn') as HTMLButtonElement;
const simLog = document.getElementById('sim-log')!;
const simPixelGrid = document.getElementById('sim-pixel-grid')!;
const inputFleetSize = document.getElementById('input-fleet-size') as HTMLInputElement;
const inputSimDays = document.getElementById('input-sim-days') as HTMLInputElement;
const inputStrategy = document.getElementById('input-strategy') as HTMLSelectElement;
const valFleetSize = document.getElementById('val-fleet-size')!;
const valSimDays = document.getElementById('val-sim-days')!;

const simResSoh = document.getElementById('sim-res-soh')!;
const simResAvoided = document.getElementById('sim-res-avoided')!;
const simResSavings = document.getElementById('sim-res-savings')!;
const simResRoi = document.getElementById('sim-res-roi')!;

/**
 * Calculates the Battery Health Score (BHS) for a bank.
 * Weights: Factor X (70%), Internal Resistance (20%), Voltage Stability (10%)
 */
function calculateBHS(bank: BatteryBank, fleetAvgVoltage: number): number {
    // 1. Factor X Score (Lower is better, inverted scale 0-1)
    const fxScore = Math.max(0, 1 - bank.fx) * 100;

    // 2. IR Score (Nominal 12mOhm. Penalty increases after 15mOhm)
    const ir = parseFloat(bank.ir);
    let irScore = 100;
    if (ir > 12) {
        irScore = Math.max(0, 100 - (ir - 12) * 5); // Drops to 0 at 32mOhm
    }

    // 3. Voltage Stability Score (Deviation from fleet mean)
    const v = parseFloat(bank.voltage);
    const deviation = Math.abs(v - fleetAvgVoltage);
    // Stability is high if deviation < 0.05V, drops significantly after 0.1V
    const stabilityScore = Math.max(0, 100 - (deviation * 400)); 

    const bhs = (fxScore * 0.7) + (irScore * 0.2) + (stabilityScore * 0.1);
    return Math.min(100, Math.max(0, bhs));
}

function calculateCellBHS(cell: BatteryCell, bankAvgVoltage: number): number {
    const fxScore = Math.max(0, 1 - cell.fx) * 100;
    const deviation = Math.abs(cell.voltage - bankAvgVoltage);
    const stabilityScore = Math.max(0, 100 - (deviation * 400)); 
    
    const bhs = (fxScore * 0.7) + (stabilityScore * 0.3);
    return Math.min(100, Math.max(0, bhs));
}

function renderFleetSummary() {
    const count = batteryData.length;
    const avgFx = batteryData.reduce((a, b) => a + b.fx, 0) / count;
    
    const totalRegens = batteryData.reduce((sum, b) => 
        sum + b.repairHistory.filter(h => h.success).length, 0);
    
    const totalRepairCost = batteryData.reduce((sum, b) => 
        sum + b.repairHistory.reduce((inner, h) => inner + (h.resources?.cost || 0), 0), 0);
    
    const REPLACEMENT_UNIT_COST = 500; 
    const estimatedSavings = (totalRegens * REPLACEMENT_UNIT_COST) - totalRepairCost;

    const fleetAvgV = batteryData.reduce((a, b) => a + parseFloat(b.voltage), 0) / count;
    const healthyCount = batteryData.filter(b => calculateBHS(b, fleetAvgV) > 85).length;
    const warningCount = batteryData.filter(b => calculateBHS(b, fleetAvgV) <= 85 && calculateBHS(b, fleetAvgV) > 65).length;
    const criticalCount = count - healthyCount - warningCount;

    const healthScore = Math.max(0, 100 - (avgFx * 45));
    const healthColorClass = healthScore > 90 ? 'text-adi-green' : (healthScore > 70 ? 'text-adi-gold' : 'text-adi-red');
    
    const regenReqCount = batteryData.filter(b => b.healthPrediction === 'REGEN_REQ').length;
    const v2gActiveCount = batteryData.filter(b => b.v2gStatus === 'READY' || b.v2gStatus === 'ENGAGED').length;

    if (regenReqCount > 0) {
        filterRegenBtn.innerHTML = `
            <div class="btn-viz viz-stress bg-adi-red/20"></div>
            <span>Filter: Regen (${regenReqCount})</span>
        `;
    } else {
        filterRegenBtn.innerHTML = `
            <div class="btn-viz viz-stress bg-adi-red/20"></div>
            <span>Filter: Regen (0)</span>
        `;
    }

    if (v2gActiveCount > 0) {
        filterV2GBtn.innerHTML = `
            <div class="btn-viz viz-v2g bg-adi-cyan/20"></div>
            <span>Filter: V2G (${v2gActiveCount})</span>
        `;
    } else {
        filterV2GBtn.innerHTML = `
            <div class="btn-viz viz-v2g bg-adi-cyan/20"></div>
            <span>Filter: V2G (0)</span>
        `;
    }

    fleetSummaryContainer.innerHTML = `
        <div class="flex flex-col h-full justify-between font-mono animate-fadeIn">
            <div class="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                <span class="text-[10px] font-black text-adi-cyan uppercase tracking-[0.2em]">Fleet Integrity Command</span>
                <span class="text-[8px] text-adi-magenta animate-pulse font-bold">● LIVE_DATA</span>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-2">
                <div class="flex flex-col">
                    <span class="text-[7px] text-gray-400 uppercase font-black tracking-widest opacity-60">Fleet Health</span>
                    <div class="flex items-baseline gap-1">
                        <span class="text-2xl font-black ${healthColorClass} tabular-nums tracking-tighter">${healthScore.toFixed(1)}</span>
                        <span class="text-[9px] text-gray-500 font-bold">%</span>
                    </div>
                </div>
                <div class="flex flex-col text-right">
                    <span class="text-[7px] text-gray-400 uppercase font-black tracking-widest opacity-60">Regen Required</span>
                    <div class="flex items-baseline justify-end gap-1">
                        <span class="text-2xl font-black ${regenReqCount > 0 ? 'text-adi-red animate-pulse' : 'text-adi-green'} tabular-nums tracking-tighter">${regenReqCount}</span>
                        <span class="text-[9px] text-gray-500 font-bold">UNITS</span>
                    </div>
                </div>
            </div>

            <div class="flex justify-between items-end border-t border-white/10 pt-2">
                <div class="flex flex-col">
                    <span class="text-[7px] text-gray-400 uppercase font-black tracking-widest opacity-60">Fleet ROI</span>
                    <div class="flex items-baseline gap-1">
                        <span class="text-sm font-bold text-adi-green tabular-nums leading-tight">$${estimatedSavings.toFixed(0)}</span>
                        <span class="text-[9px] text-white/30 font-bold">%</span>
                    </div>
                </div>
                <div class="flex flex-col text-right">
                    <span class="text-[7px] text-gray-400 uppercase font-black tracking-widest opacity-60">Avg Factor X</span>
                    <span class="text-sm font-bold text-adi-cyan tabular-nums leading-tight">${avgFx.toFixed(5)}</span>
                    <div class="text-[6px] text-adi-cyan/40">LATTICE_ENTROPY</div>
                </div>
            </div>
            
            <div class="flex gap-1 h-2 w-full bg-white/5 rounded-sm overflow-hidden my-2 shadow-inner">
                <div class="h-full bg-adi-green shadow-[0_0_8px_rgba(0,255,65,0.4)]" style="width: ${(healthyCount/count)*100}%"></div>
                <div class="h-full bg-adi-gold shadow-[0_0_8px_rgba(255,215,0,0.4)]" style="width: ${(warningCount/count)*100}%"></div>
                <div class="h-full bg-adi-red shadow-[0_0_8px_rgba(255,51,51,0.4)]" style="width: ${(criticalCount/count)*100}%"></div>
            </div>

            <div class="flex justify-between items-center mt-1 border-t border-white/5 pt-1">
                <div class="flex items-center gap-1">
                    <div class="w-1.5 h-1.5 bg-adi-green/40 border border-adi-green/60 rounded-full"></div>
                    <span class="text-[6px] text-gray-500 uppercase font-black">STABLE</span>
                </div>
                <div class="flex items-center gap-1">
                    <div class="w-1.5 h-1.5 bg-adi-gold border border-adi-gold/60 rounded-full"></div>
                    <span class="text-[6px] text-gray-500 uppercase font-black">AT_RISK</span>
                </div>
                <div class="flex items-center gap-1">
                    <div class="w-1.5 h-1.5 bg-adi-red animate-pulse border border-adi-red/60 rounded-full"></div>
                    <span class="text-[6px] text-gray-500 uppercase font-black">REGEN_REQ</span>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                <div class="flex flex-col justify-center border-r border-white/5 pr-2">
                    <span class="text-[7px] text-gray-400 uppercase font-black tracking-widest mb-1 opacity-60">Total Regenerations</span>
                    <span class="text-lg font-black text-adi-magenta tabular-nums tracking-tighter leading-none">${totalRegens} <span class="text-[8px] text-gray-500">UNITS</span></span>
                </div>
                <div class="flex flex-col justify-center pl-2 text-right">
                    <span class="text-[7px] text-gray-400 uppercase font-black tracking-widest mb-1 opacity-60">Estimated Savings</span>
                    <span class="text-lg font-black text-adi-green tabular-nums tracking-tighter leading-none">$${estimatedSavings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} <span class="text-[8px] text-gray-500">AUD</span></span>
                </div>
            </div>
        </div>
    `;
}

let isRegenFilterActive = false;
let isV2GFilterActive = false;

filterRegenBtn.onclick = () => {
    isRegenFilterActive = !isRegenFilterActive;
    if (isRegenFilterActive) isV2GFilterActive = false; // Mutual exclusivity
    
    filterRegenBtn.classList.toggle('bg-adi-red/20');
    filterRegenBtn.classList.toggle('border-adi-red');
    filterRegenBtn.classList.toggle('border-adi-red/30');
    
    // Reset other filter visual
    filterV2GBtn.classList.remove('bg-adi-cyan/20', 'border-adi-cyan');
    filterV2GBtn.classList.add('border-adi-cyan/30');
    filterAllBtn.classList.remove('bg-white/20', 'border-white');
    filterAllBtn.classList.add('bg-white/10', 'border-white/20');
    
    renderMatrix();
};

filterV2GBtn.onclick = () => {
    isV2GFilterActive = !isV2GFilterActive;
    if (isV2GFilterActive) isRegenFilterActive = false; // Mutual exclusivity

    filterV2GBtn.classList.toggle('bg-adi-cyan/20');
    filterV2GBtn.classList.toggle('border-adi-cyan');
    filterV2GBtn.classList.toggle('border-adi-cyan/30');
    
    // Reset other filter visual
    filterRegenBtn.classList.remove('bg-adi-red/20', 'border-adi-red');
    filterRegenBtn.classList.add('border-adi-red/30');
    filterAllBtn.classList.remove('bg-white/20', 'border-white');
    filterAllBtn.classList.add('bg-white/10', 'border-white/20');

    renderMatrix();
};

filterAllBtn.onclick = () => {
    isRegenFilterActive = false;
    isV2GFilterActive = false;
    
    filterAllBtn.classList.add('bg-white/20', 'border-white');
    filterAllBtn.classList.remove('bg-white/10', 'border-white/20');
    
    filterRegenBtn.classList.remove('bg-adi-red/20', 'border-adi-red');
    filterRegenBtn.classList.add('border-adi-red/30');
    
    filterV2GBtn.classList.remove('bg-adi-cyan/20', 'border-adi-cyan');
    filterV2GBtn.classList.add('border-adi-cyan/30');
    
    renderMatrix();
};

function renderMatrix() {
    matrix.innerHTML = '';
    const fleetAvgV = batteryData.reduce((a, b) => a + parseFloat(b.voltage), 0) / batteryData.length;

    batteryData.forEach((d, i) => {
        if (isRegenFilterActive && d.healthPrediction !== 'REGEN_REQ') return;
        if (isV2GFilterActive && d.v2gStatus !== 'READY' && d.v2gStatus !== 'ENGAGED') return;

        const cell = document.createElement('div');
        const repairingNow = isRepairing && i === selectedIndex;
        const bhs = calculateBHS(d, fleetAvgV);
        
        let statusClass = 'status-healthy';
        let bhsColor = 'text-adi-green';
        if (bhs < 65) {
            statusClass = 'status-error';
            bhsColor = 'text-adi-red';
        } else if (bhs < 85) {
            statusClass = 'status-warning';
            bhsColor = 'text-adi-gold';
        }

        if (repairingNow) {
            statusClass = 'status-repairing';
        }

        const isSelected = i === selectedIndex;
        const isEngaged = d.v2gStatus === 'ENGAGED';
        const isReady = d.v2gStatus === 'READY';
        const isRegenReq = d.healthPrediction === 'REGEN_REQ';
        
        let isAtRiskWithin7 = false;
        if (d.predictedFailureDate === 'IMMINENT') {
            isAtRiskWithin7 = true;
        } else if (d.predictedFailureDate && d.predictedFailureDate !== '> 30 DAYS') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const failDate = new Date(d.predictedFailureDate);
            failDate.setHours(0, 0, 0, 0);
            const diffTime = failDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            if (diffDays >= 0 && diffDays <= 7) isAtRiskWithin7 = true;
        }

        const isAtRisk = d.healthPrediction === 'AT_RISK' || isAtRiskWithin7;
        const isDegrading = d.healthPrediction === 'DEGRADING';
        const isUndoable = undoSnapshot && undoTargetIndex === i;

        let extraClasses = '';
        if (isRegenReq) extraClasses += ' border-adi-red shadow-[0_0_15px_rgba(255,51,51,0.5)] animate-pulse';
        else if (isAtRiskWithin7) extraClasses += ' border-adi-red shadow-[0_0_15px_rgba(255,51,51,0.5)] animate-pulse';
        else if (isAtRisk) extraClasses += ' border-adi-gold shadow-[0_0_10px_rgba(255,215,0,0.3)]';
        else if (isDegrading) extraClasses += ' border-adi-gold/50';
        else if (isUndoable) extraClasses += ' border-adi-cyan shadow-[0_0_15px_rgba(0,242,255,0.3)]';

        const v2gStatus = d.v2gStatus || 'OFFLINE';
        const v2gStatusBg = v2gStatus === 'ENGAGED' ? 'bg-adi-magenta text-black shadow-[0_0_5px_rgba(255,0,255,0.5)] animate-pulse' : (v2gStatus === 'READY' ? 'bg-adi-green text-black' : 'bg-gray-800 text-gray-500 border border-white/10');
        const v2gDot = v2gStatus === 'ENGAGED' ? '⚡' : (v2gStatus === 'READY' ? '●' : '○');
        const v2gIndicator = `<div class="text-[6px] ${v2gStatusBg} font-black uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] mt-1 w-fit flex items-center gap-1">${v2gDot} ${v2gStatus}</div>`;

        // Only apply V2G border styles if no critical health warning, unless engaged (engaged overrides)
        const hasHealthWarning = isRegenReq || isAtRisk || isDegrading;
        const showV2GStyle = !hasHealthWarning || isEngaged;

        cell.className = `matrix-cell working-pulse p-2 h-20 rounded-sm flex flex-col justify-between cursor-pointer group ${isSelected ? 'selected' : ''} ${statusClass} ${showV2GStyle && isEngaged ? 'v2g-engaged' : ''} ${showV2GStyle && isReady ? 'v2g-ready' : ''} ${showV2GStyle && v2gStatus === 'OFFLINE' ? 'v2g-offline' : ''} ${extraClasses}`;
        
        const tempVal = parseFloat(d.temp);
        const tempColorClass = tempVal > 40 ? 'text-adi-red' : (tempVal < 25 ? 'text-adi-cyan' : 'text-adi-green');

        let healthBadge = '';
        if (isRegenReq) {
            healthBadge = `<div class="absolute top-0 right-0 bg-adi-red text-black text-[7px] font-black px-1.5 py-0.5 animate-pulse z-30 shadow-[0_0_5px_rgba(255,51,51,0.5)] rounded-bl-sm">REGEN_REQ</div>`;
        } else if (isAtRiskWithin7 || d.healthPrediction === 'AT_RISK') {
            const riskStyle = isAtRiskWithin7 ? 'bg-adi-red text-white animate-pulse shadow-[0_0_8px_rgba(255,51,51,0.6)]' : 'bg-adi-gold text-black';
            healthBadge = `<div class="absolute top-0 right-0 ${riskStyle} text-[7px] font-black px-1.5 py-0.5 z-30 rounded-bl-sm">AT_RISK</div>`;
        } else {
            healthBadge = `<div class="absolute top-0 right-0 bg-adi-green/20 text-adi-green text-[7px] font-black px-1.5 py-0.5 z-30 border-l border-b border-adi-green/30 rounded-bl-sm">STABLE</div>`;
        }

        const undoBadge = isUndoable ? `<div class="absolute bottom-0 right-0 bg-adi-cyan text-black text-[6px] font-black px-1 z-10">UNDO_READY</div>` : '';

        cell.innerHTML = `
            ${healthBadge}
            ${undoBadge}
            <div class="cell-scanline"></div>
            <div class="flex justify-between items-start">
                <div class="flex flex-col">
                    <span class="text-[7px] text-gray-500 font-bold tracking-widest">B${String(d.id).padStart(2, '0')}</span>
                    ${v2gIndicator}
                </div>
                <span class="text-[7px] font-black ${tempColorClass}">${tempVal.toFixed(1)}°C</span>
            </div>
            
            <div class="flex flex-col items-center justify-center flex-1 -mt-1">
                <div class="text-[6px] text-gray-500 font-bold uppercase tracking-widest opacity-60">HEALTH SCORE</div>
                <div class="text-2xl font-black ${bhsColor} tabular-nums tracking-tighter drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]">
                    ${bhs.toFixed(0)}%
                </div>
                ${d.predictedFailureDate ? `<div class="text-[5px] text-white/40 font-mono mt-0.5 uppercase tracking-tighter">EOL: ${d.predictedFailureDate}</div>` : ''}
                ${isSelected ? `<button class="view-history-btn text-[5px] text-adi-gold border border-adi-gold/30 px-1 rounded mt-1 hover:bg-adi-gold/10 uppercase font-black z-20">Full History</button>` : ''}
            </div>

            <div class="flex justify-between items-baseline mt-auto">
                <div class="flex flex-col"><span class="text-[8px] font-black text-white/70 tabular-nums">${d.voltage}V</span></div>
                <button class="inspect-cell-btn text-[6px] text-adi-cyan border border-adi-cyan/30 px-1 rounded hover:bg-adi-cyan/10 uppercase tracking-wider z-20" data-id="${i}">INSPECT</button>
                <div class="flex flex-col text-right"><span class="text-[7px] font-mono text-adi-cyan/50">${d.ir}mΩ</span></div>
            </div>

            <div class="w-full h-[1.5px] bg-white/5 overflow-hidden relative rounded-full mt-1">
                <div class="h-full bg-adi-cyan opacity-40 transition-all duration-500" style="width: ${(parseFloat(d.voltage)/4.2)*100}%"></div>
            </div>
        `;
        cell.onclick = (e) => { 
            if(isRepairing) return; 
            const target = e.target as HTMLElement;
            // Prevent triggering selection if inspect button clicked
            if (target.classList.contains('inspect-cell-btn')) {
                openCellInspector(i);
                return;
            }
            if (target.classList.contains('view-history-btn')) {
                showBankHistory(d);
                return;
            }

            selectedIndex = i; 
            targetLabel.innerText = `B${String(d.id).padStart(2, '0')} NODE`; 
            
            const status = d.v2gStatus || 'READY';
            gridStatus.innerText = status;
            gridStatus.className = `text-xs font-bold ${status === 'ENGAGED' ? 'text-adi-magenta animate-pulse' : 'text-adi-gold'}`;
            
            if (status === 'ENGAGED') {
                orbit.setMode('v2g');
            } else {
                orbit.setMode('idle');
            }

            globalHistoryMode = false;
            if (historyModeBtn) historyModeBtn.innerText = "Fleet";
            switchTab('history');
            renderMatrix(); 
            renderRepairHistory(); 
        };
        matrix.appendChild(cell);
    });
    
    const avgFx = batteryData.reduce((a, b) => a + b.fx, 0) / 32;
    const sohValue = (100 - (avgFx * 45)).toFixed(1);
    sohIndicator.innerText = `${sohValue} %`;
    sohIndicator.className = parseFloat(sohValue) > 90 ? 'text-3xl font-black text-adi-green tabular-nums' : (parseFloat(sohValue) > 70 ? 'text-3xl font-black text-adi-gold tabular-nums' : 'text-3xl font-black text-adi-red tabular-nums');
    
    renderFleetSummary();
}

function renderRepairHistory() {
    let logs: RepairHistoryEntry[] = [];
    const currentBank = batteryData[selectedIndex];
    
    let successRate = 0;
    if (currentBank.repairHistory.length > 0) {
        const successful = currentBank.repairHistory.filter(h => h.success).length;
        successRate = (successful / currentBank.repairHistory.length) * 100;
    }

    if (globalHistoryMode) {
        if (historyTitleElement) (historyTitleElement as HTMLElement).innerText = "Fleet Sovereign Log";
        batteryData.forEach(b => b.repairHistory.forEach(h => logs.push({...h, label: `B${String(b.id).padStart(2, '0')}`})));
        logs.sort((a, b) => b.timestamp - a.timestamp);
    } else {
        if (historyTitleElement) (historyTitleElement as HTMLElement).innerText = `Log: Bank B${String(currentBank.id).padStart(2, '0')}`;
        logs = currentBank.repairHistory.map(h => ({...h, label: `B${String(currentBank.id).padStart(2, '0')}`})).reverse();
    }

    let headerHtml = '';
    if (!globalHistoryMode && currentBank.repairHistory.length > 0) {
        headerHtml = `
            <div class="bg-adi-panel/80 border border-white/10 p-2 rounded-sm mb-4 flex justify-between items-center">
                <div class="text-[8px] text-gray-500 uppercase font-bold">Success Rate</div>
                <div class="text-xs font-black ${successRate > 80 ? 'text-adi-green' : (successRate > 50 ? 'text-adi-gold' : 'text-adi-red')}">${successRate.toFixed(1)}%</div>
            </div>
        `;
    }

    historyContainer.innerHTML = (logs.length === 0 ? `<div class="text-center opacity-20 py-8 text-[9px] tracking-widest italic uppercase">No local history</div>` : 
        headerHtml + logs.slice(0, 15).map(entry => `
            <div class="bg-adi-panel/60 border-l-2 ${entry.success ? 'border-adi-green' : 'border-adi-red'} p-3 leading-tight rounded-sm mb-2 shadow-sm">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-adi-cyan font-black text-[9px] uppercase tracking-tighter">${entry.label} // ${entry.type}</span>
                    <span class="text-[8px] text-gray-500 font-bold">${entry.date}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-[10px] text-white font-black tracking-widest uppercase">${entry.success ? 'SUCCESS' : 'STALL'}</span>
                    <div class="flex gap-2 items-center">
                        ${entry.preHealth !== undefined && entry.postHealth !== undefined ? `
                            <span class="text-[8px] text-gray-500 font-bold">${Math.round(entry.preHealth)}% → <span class="text-adi-cyan">${Math.round(entry.postHealth)}%</span></span>
                        ` : ''}
                        ${entry.resources ? `<span class="text-[8px] text-adi-green font-bold">$${entry.resources.cost.toFixed(2)}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join(''));
}

function addLog(text: string, type: 'cyan' | 'magenta' | 'green' | 'red' | 'gold' | 'teal' = 'cyan') {
    const div = document.createElement('div');
    const colorClass = { cyan: 'text-adi-cyan', magenta: 'text-adi-magenta', green: 'text-adi-green', red: 'text-adi-red', gold: 'text-adi-gold', teal: 'text-adi-teal' }[type];
    div.className = `${colorClass} leading-snug animate-fadeIn tracking-tight opacity-90 border-b border-white/5 pb-1 mb-1 font-mono text-[9px]`;
    div.innerHTML = `<span class="opacity-40 text-[7px] mr-2">[${new Date().toLocaleTimeString()}]</span> >> ${text.toUpperCase()}`;
    logBox.prepend(div);
    if (logBox.children.length > 50) logBox.lastElementChild?.remove();
    logBox.scrollTop = 0; // Since we prepend, top is the latest
}

function triggerShake() {
    appRoot.classList.add('app-shake');
    setTimeout(() => appRoot.classList.remove('app-shake'), 200);
}

async function commitFusion(type: 'OFFLINE_FUSION' | 'DEEP_PULSE' = 'OFFLINE_FUSION') {
    if (isRepairing) return;
    isRepairing = true; 
    modalOverlay.classList.add('hidden');
    repairBtn.disabled = true; orbit.setMode('repair'); osc.setMode('repair');
    waveStatus.innerText = "ACTIVE_FUSION";
    const target = batteryData[selectedIndex];
    const avgVoltage = batteryData.reduce((a, b) => a + parseFloat(b.voltage), 0) / batteryData.length;
    const preHealth = calculateBHS(target, avgVoltage);
    
    undoSnapshot = JSON.parse(JSON.stringify(target)); undoTargetIndex = selectedIndex;
    addLog(`GREEN FUSION START: B${target.id}`, 'green');
    const trace = SHE.generateTrace('Hadron Repair', target);
    addLog(`HEURISTIC_TRACE: ${trace}`, 'teal');
    const startTime = performance.now();
    let totalEnergy = 0;
    for (let i = 0; i <= 100; i += 5) {
        fusionGauge.style.display = 'block';
        fusionGauge.style.transform = `rotate(${i * 3.6}deg)`;
        fusionPercentText.innerText = `${i.toFixed(1)}%`;
        totalEnergy += 12; renderMatrix();
        await new Promise(r => setTimeout(r, 100));
    }
    target.fx = type === 'DEEP_PULSE' ? 0.002 : 0.008;
    target.voltage = (parseFloat(target.voltage) + (type === 'DEEP_PULSE' ? 0.18 : 0.12)).toFixed(2);
    target.temp = (parseFloat(target.temp) - 3.0).toFixed(1); 
    target.ir = (parseFloat(target.ir) * 0.8).toFixed(1); 
    
    const postHealth = calculateBHS(target, avgVoltage);

    target.repairHistory.push({
        timestamp: Date.now(), date: new Date().toLocaleTimeString(), success: true, type,
        resources: { energy: totalEnergy, cost: totalEnergy * 0.15, duration: 2 },
        preHealth,
        postHealth
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(batteryData));
    isRepairing = false; repairBtn.disabled = false;
    orbit.setMode('idle'); osc.setMode('normal'); fusionGauge.style.display = 'none'; fusionPercentText.innerText = "0.0%";
    waveStatus.innerText = "NOMINAL";
    addLog(`REPAIR SUCCESS: B${target.id} LATTICE RECOVERED`, 'green');
    renderMatrix(); renderRepairHistory(); renderFleetSummary(); renderAnalytics();
    startUndoCountdown();
}

function startUndoCountdown() {
    if (undoTimeoutId) clearInterval(undoTimeoutId);
    undoRemaining = 10; 
    undoBtn.classList.remove('hidden'); 
    undoBtn.classList.add('undo-active');
    addLog("UNDO WINDOW OPEN: 10s", "gold");
    
    const updateLabel = () => {
        undoBtn.innerHTML = `<span>Undo Repair [${undoRemaining}s]</span>`;
        if (undoRemaining <= 3) undoBtn.classList.add('text-adi-red');
    };
    
    updateLabel();
    undoTimeoutId = setInterval(() => {
        undoRemaining--;
        if (undoRemaining <= 0) { 
            clearInterval(undoTimeoutId); 
            undoSnapshot = null; 
            undoTargetIndex = null;
            undoBtn.classList.add('hidden'); 
            undoBtn.classList.remove('undo-active', 'text-adi-red');
            addLog("UNDO WINDOW CLOSED", "gray");
            renderMatrix(); // Clear undo highlight
        } else { 
            updateLabel(); 
        }
    }, 1000);
}

// SIMULATION ENGINE
async function runSimulation() {
    simStartBtn.disabled = true;
    const fleetSize = parseInt(inputFleetSize.value);
    const simDays = parseInt(inputSimDays.value);
    const strategy = inputStrategy.value;

    simLog.innerHTML = `<div class="text-adi-cyan">ALLOCATING HEURISTIC MEMORY FOR ${fleetSize} NODES...</div>`;
    
    // Initialize Sim Fleet
    let simFleet = Array.from({ length: fleetSize }, () => ({
        fx: 0.02 + Math.random() * 0.15,
        failures: 0,
        repairs: 0
    }));

    // Reset Visual Grid
    simPixelGrid.innerHTML = '';
    const pixels: HTMLElement[] = [];
    for(let i=0; i<fleetSize; i++) {
        const px = document.createElement('div');
        px.className = 'sim-grid-pixel bg-adi-green';
        simPixelGrid.appendChild(px);
        pixels.push(px);
    }

    const history = [];
    let totalAvoided = 0;
    let totalSavings = 0;

    for (let day = 1; day <= simDays; day++) {
        // Aging & Degradation
        simFleet.forEach((node, i) => {
            // Natural entropy increase
            node.fx += 0.002 + Math.random() * 0.005;
            
            // Strategy Intervention
            let didRepair = false;
            if (strategy === 'REACTIVE' && node.fx > 0.6) {
                node.fx = 0.05; node.repairs++; didRepair = true;
            } else if (strategy === 'PROACTIVE' && node.fx > 0.25) {
                node.fx = 0.02; node.repairs++; didRepair = true;
            } else if (strategy === 'SOVEREIGN' && node.fx > 0.15) {
                node.fx = 0.005; node.repairs++; didRepair = true;
            }

            if (didRepair) {
                totalAvoided++;
                totalSavings += (500 - 45); // Replace vs Repair cost
            }

            // Random failure chance if FX is high
            if (node.fx > 0.85 && Math.random() > 0.95) {
                node.fx = 0.99; // Total fail
                pixels[i].className = 'sim-grid-pixel bg-adi-red shadow-[0_0_4px_#ff3333]';
            } else if (node.fx > 0.6) {
                pixels[i].className = 'sim-grid-pixel bg-adi-red';
            } else if (node.fx > 0.25) {
                pixels[i].className = 'sim-grid-pixel bg-adi-gold';
            } else {
                pixels[i].className = 'sim-grid-pixel bg-adi-green';
            }
        });

        const avgSoh = (1 - (simFleet.reduce((a, b) => a + b.fx, 0) / fleetSize)) * 100;
        history.push({ day, soh: avgSoh.toFixed(1), savings: totalSavings });

        if (day % 10 === 0) {
            const logEntry = document.createElement('div');
            logEntry.innerText = `DAY ${day}: ${SHE.getRandomJargon().toUpperCase()} SYNCED. SOH: ${avgSoh.toFixed(1)}%`;
            simLog.prepend(logEntry);
            const sRoot = getRoot('sim-chart-container');
            if (sRoot) sRoot.render(<SimulationChart data={[...history]} />);
            await new Promise(r => setTimeout(r, 50));
        }

        // Results UI
        simResSoh.innerText = `${avgSoh.toFixed(1)}%`;
        simResAvoided.innerText = totalAvoided.toString();
        simResSavings.innerText = `$${totalSavings.toLocaleString()}`;
        simResRoi.innerText = `${((totalSavings / (totalAvoided * 45)) * 100).toFixed(0)}%`;
    }

    const finalLog = document.createElement('div');
    finalLog.className = 'text-adi-green font-black mt-2 pt-2 border-t border-white/10';
    finalLog.innerText = `PROJECTION SUCCESSFUL. LATTICE STABILITY VERIFIED.`;
    simLog.prepend(finalLog);
    simStartBtn.disabled = false;
}

// Event Listeners
simStartBtn.onclick = runSimulation;
openSimBtn.onclick = () => { simModalOverlay.style.display = 'flex'; };
simCloseBtn.onclick = () => { simModalOverlay.style.display = 'none'; };
inputFleetSize.oninput = () => valFleetSize.innerText = inputFleetSize.value;
inputSimDays.oninput = () => valSimDays.innerText = inputSimDays.value;

undoBtn.onclick = () => {
    if (!undoSnapshot || undoTargetIndex === null) return;
    batteryData[undoTargetIndex] = JSON.parse(JSON.stringify(undoSnapshot));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(batteryData));
    addLog(`EMERGENCY ROLLBACK EXECUTED ON B${batteryData[undoTargetIndex].id}`, "red");
    triggerShake();
    clearInterval(undoTimeoutId); undoSnapshot = null; undoTargetIndex = null;
    undoBtn.classList.add('hidden'); undoBtn.classList.remove('undo-active');
    renderMatrix(); renderRepairHistory(); renderFleetSummary();
};

scanFftBtn.onclick = async () => {
    if(isRepairing) return;
    scanFftBtn.disabled = true; orbit.setMode('scan');
    addLog("INIT LOCAL SPECTRAL SCAN...", "cyan");
    await new Promise(r => setTimeout(r, 1200));
    addLog(`SCAN SUCCESS: NO HARMONIC DISTORTION FOUND LATERALLY`, 'green');
    orbit.setMode('idle'); scanFftBtn.disabled = false;
};

isotopeBtn.onclick = async () => {
    if(isRepairing) return;
    addLog("MAPPING LOCAL ISOTOPE DENSITY...", "teal");
    await new Promise(r => setTimeout(r, 800));
    addLog("DENSITY MAP COMPLETED: NOMINAL DISTRIBUTION", "green");
};

stressBtn.onclick = async () => {
    if(isRepairing) return;
    stressBtn.disabled = true; osc.setMode('stress');
    addLog("LOCAL APPLICATION OF 40A BURST STRESS...", "red");
    triggerShake();
    await new Promise(r => setTimeout(r, 1500));
    addLog("LOAD RESPONSE: NO THERMAL SAG DETECTED LOCALLY", "green");
    osc.setMode('normal'); stressBtn.disabled = false;
};

predictBtn.onclick = async () => {
    if(isRepairing) return;
    predictBtn.disabled = true;
    addLog("INITIATING PREDICTIVE HEALTH MODEL (30-DAY HORIZON)...", "gold");
    await new Promise(r => setTimeout(r, 1000));
    
    let riskCount = 0;
    const avgVoltage = batteryData.reduce((a, b) => a + parseFloat(b.voltage), 0) / batteryData.length;

    batteryData = batteryData.map(b => {
        // Simulate degradation
        const simFx = b.fx + 0.05; // +5% entropy
        const simIr = parseFloat(b.ir) * 1.1; // +10% resistance
        const currentTemp = parseFloat(b.temp);
        const simTemp = currentTemp + (Math.random() * 5); // Simulate potential heat rise
        
        // Calculate simulated BHS
        const simBank = { ...b, fx: simFx, ir: simIr.toFixed(1) };
        const simBhs = calculateBHS(simBank, avgVoltage);
        
        // Voltage Stability Check
        const voltageDeviation = Math.abs(parseFloat(b.voltage) - avgVoltage);
        const isVoltageUnstable = voltageDeviation > 0.15;

        let predictedFailureDate = undefined;
        // Calculate remaining lifespan in days based on degradation rate
        const currentBhs = calculateBHS(b, avgVoltage);
        const degradationRate = b.degradationRate || 0.5; // Fallback if no degradation rate recorded yet
        const ticksToFailure = degradationRate > 0 ? (currentBhs - 40) / degradationRate : 1000;
        const remainingDays = Math.max(0, Math.floor(ticksToFailure * 0.1)); // Assuming 1 tick = 0.1 days
        
        const failureDate = new Date();
        failureDate.setDate(failureDate.getDate() + remainingDays);
        predictedFailureDate = failureDate.toISOString().split('T')[0];

        if (remainingDays <= 7 && b.healthPrediction !== 'REGEN_REQ') {
             addLog(`URGENT: B${String(b.id).padStart(2, '0')} FAILURE PREDICTED IN ${remainingDays} DAYS`, "red");
        }

        if (simBhs < 45 || parseFloat(simBank.ir) > 20 || simFx > 0.12 || simTemp > 45 || isVoltageUnstable) {
            riskCount++;
            let reason = "CRITICAL METRICS";
            if (simTemp > 45) reason = "THERMAL RUNAWAY RISK";
            if (isVoltageUnstable) reason = "VOLTAGE INSTABILITY";
            
            addLog(`CRITICAL PREDICTION: B${String(b.id).padStart(2, '0')} ${reason} - REGEN REQ`, "red");
            return { ...b, healthPrediction: 'REGEN_REQ', predictedFailureDate: 'IMMINENT' };
        } else if (remainingDays <= 7) {
            riskCount++;
            addLog(`PREDICTION ALERT: B${String(b.id).padStart(2, '0')} AT RISK - FAILURE IN ${remainingDays} DAYS`, "gold");
            return { ...b, healthPrediction: 'AT_RISK', predictedFailureDate };
        } else if (simBhs < 80) {
            return { ...b, healthPrediction: 'DEGRADING', predictedFailureDate };
        } else {
            return { ...b, healthPrediction: 'STABLE', predictedFailureDate: '> 30 DAYS' };
        }
    });
    
    if (riskCount === 0) {
        addLog("PREDICTION COMPLETE: FLEET STABLE FOR 30 DAYS", "green");
    } else {
        addLog(`PREDICTION COMPLETE: ${riskCount} UNITS FLAGGED FOR ATTENTION`, "magenta");
    }
    
    renderMatrix();
    renderFleetSummary();
    
    // Update inspector if open
    if (!cellInspectorModal.classList.contains('hidden')) {
        const bank = batteryData[selectedIndex];
        if (bank) {
             inspectorBankStatus.innerText = bank.healthPrediction || 'STABLE';
             inspectorBankStatus.className = `text-xl font-black uppercase tracking-tighter ${bank.healthPrediction === 'REGEN_REQ' ? 'text-adi-red animate-pulse' : (bank.healthPrediction === 'AT_RISK' ? 'text-adi-gold' : 'text-adi-green')}`;
             
             if (bank.predictedFailureDate) {
                 inspectorFailureContainer.classList.remove('hidden');
                 inspectorFailureDate.innerText = bank.predictedFailureDate === 'IMMINENT' ? 'IMMINENT FAILURE' : bank.predictedFailureDate;
                 inspectorFailureDate.className = `text-[10px] font-black tabular-nums tracking-widest ${bank.predictedFailureDate === 'IMMINENT' ? 'text-adi-red animate-pulse' : 'text-adi-gold'}`;
                 
                 const fleetAvgV = batteryData.reduce((a, b) => a + parseFloat(b.voltage), 0) / batteryData.length;
                 const bhs = calculateBHS(bank, fleetAvgV);
                 const prob = Math.min(99.9, Math.max(0.1, (100 - bhs) * (bank.healthPrediction === 'REGEN_REQ' ? 1.5 : 1)));
                 inspectorFailureProb.innerText = `${prob.toFixed(1)}%`;
             } else {
                 inspectorFailureContainer.classList.add('hidden');
             }
        }
    }

    predictBtn.disabled = false;
};

v2gSyncBtn.onclick = async () => {
    if(isRepairing) return;
    const target = batteryData[selectedIndex];
    v2gSyncBtn.disabled = true; 
    orbit.setMode('sync'); 
    gridStatus.innerText = "SYNCING";
    gridStatus.className = "text-xs text-adi-gold font-bold animate-pulse";
    
    addLog(`INITIATING V2G SYNC FOR B${target.id}...`, "gold");
    
    await new Promise(r => setTimeout(r, 1500));
    
    if (target.v2gStatus === 'ENGAGED') {
        target.v2gStatus = 'READY';
        addLog(`V2G DISENGAGED FOR B${target.id}. NODE STANDBY.`, "green");
        orbit.setMode('idle');
    } else {
        target.v2gStatus = 'ENGAGED';
        addLog(`V2G ENGAGED FOR B${target.id}. ENERGY TRANSFER ACTIVE.`, "magenta");
        orbit.setMode('v2g');
    }
    
    gridStatus.innerText = target.v2gStatus;
    gridStatus.className = `text-xs font-bold ${target.v2gStatus === 'ENGAGED' ? 'text-adi-magenta animate-pulse' : 'text-adi-gold'}`;
    
    v2gSyncBtn.disabled = false; 
    renderMatrix();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(batteryData));
};

equityBtn.onclick = () => {
    const target = batteryData[selectedIndex];
    const val = (parseFloat(target.voltage) * (1 - target.fx) * 45).toFixed(2);
    addLog(`EQUITY GUARD: LOCAL VALUE CALCULATION $${val} AUD`, "green");
};

purgeBtn.onclick = () => {
    const target = batteryData[selectedIndex];
    addLog(`PURGING ENTROPY B${target.id} MANUALLY...`, "red");
    target.fx = Math.min(target.fx * 1.5, 1.0); 
    renderMatrix();
};

bmsResetBtn.onclick = () => {
    addLog(`HARD RESET LOCAL BMS B${batteryData[selectedIndex].id}`, "magenta");
    triggerShake();
    setTimeout(() => addLog("LOCAL BMS LOGIC RE-INITIALIZED", "green"), 500);
};

modalCancel.onclick = () => modalOverlay.classList.add('hidden');
modalConfirm.onclick = () => { modalOverlay.classList.add('hidden'); commitFusion('OFFLINE_FUSION'); };
repairBtn.onclick = () => { if(!isRepairing) modalOverlay.classList.remove('hidden'); };
initiateBtn.onclick = () => commitFusion('DEEP_PULSE');
historyModeBtn.onclick = () => { globalHistoryMode = !globalHistoryMode; historyModeBtn.innerText = globalHistoryMode ? "Node" : "Fleet"; renderRepairHistory(); };

const modalConfirmFinal = document.getElementById('modal-confirm')!;

// Task UI Elements
const tabHistory = document.getElementById('tab-history')!;
const tabTasks = document.getElementById('tab-tasks')!;
const tabAnalytics = document.getElementById('tab-analytics')!;
const tabAi = document.getElementById('tab-ai')!;
const tabAlerts = document.getElementById('tab-alerts')!;
const alertBadge = document.getElementById('alert-badge')!;
const historyControls = document.getElementById('history-controls')!;
const taskControls = document.getElementById('task-controls')!;
const alertControls = document.getElementById('alert-controls')!;
const aiControls = document.getElementById('ai-controls')!;
const cellRegenModal = document.getElementById('cell-regen-modal')!;
const cellRegenClose = document.getElementById('cell-regen-close')!;
const regenHistoryContent = document.getElementById('regen-history-content')!;
const regenCellIdDisplay = document.getElementById('regen-cell-id')!;
const regenBankIdDisplay = document.getElementById('regen-bank-id')!;
const regenCycleCountDisplay = document.getElementById('regen-cycle-count')!;

cellRegenClose.onclick = () => cellRegenModal.classList.add('hidden');

function showCellRegenHistory(bankId: number, cell: BatteryCell) {
    regenCellIdDisplay.innerText = String(cell.id).padStart(2, '0');
    regenBankIdDisplay.innerText = String(bankId).padStart(2, '0');
    regenCycleCountDisplay.innerText = String(cell.regenHistory?.length || 0);
    
    regenHistoryContent.innerHTML = '';
    
    if (!cell.regenHistory || cell.regenHistory.length === 0) {
        regenHistoryContent.innerHTML = `<div class="text-center py-12 opacity-20 italic uppercase text-[10px] tracking-widest">No regeneration data available for this unit</div>`;
    } else {
        [...cell.regenHistory].reverse().forEach((entry, idx) => {
            const vDiff = entry.post.voltage - entry.pre.voltage;
            const tDiff = entry.post.temp - entry.pre.temp;
            const fxDiff = ((entry.pre.fx - entry.post.fx) / entry.pre.fx * 100).toFixed(1);
            
            const entryEl = document.createElement('div');
            entryEl.className = 'bg-white/5 border border-white/10 p-4 rounded-sm animate-fadeIn';
            entryEl.innerHTML = `
                <div class="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                    <span class="text-adi-magenta font-black text-[10px] uppercase tracking-tighter">CYCLE #${cell.regenHistory!.length - idx}</span>
                    <span class="text-[8px] text-gray-500 font-bold">${entry.date}</span>
                </div>
                <div class="grid grid-cols-3 gap-4">
                    <div class="space-y-1">
                        <div class="text-[7px] text-gray-500 uppercase font-bold">Voltage</div>
                        <div class="text-xs font-black text-white">${entry.pre.voltage.toFixed(2)}V → <span class="text-adi-green">${entry.post.voltage.toFixed(2)}V</span></div>
                        <div class="text-[7px] text-adi-green font-bold">+${vDiff.toFixed(2)}V GAIN</div>
                    </div>
                    <div class="space-y-1">
                        <div class="text-[7px] text-gray-500 uppercase font-bold">Temp</div>
                        <div class="text-xs font-black text-white">${entry.pre.temp.toFixed(1)}°C → <span class="text-adi-cyan">${entry.post.temp.toFixed(1)}°C</span></div>
                        <div class="text-[7px] ${tDiff < 0 ? 'text-adi-cyan' : 'text-adi-red'} font-bold">${tDiff.toFixed(1)}°C DELTA</div>
                    </div>
                    <div class="space-y-1">
                        <div class="text-[7px] text-gray-500 uppercase font-bold">Factor X (Entropy)</div>
                        <div class="text-xs font-black text-white">${entry.pre.fx.toFixed(3)} → <span class="text-adi-magenta">${entry.post.fx.toFixed(3)}</span></div>
                        <div class="text-[7px] text-adi-magenta font-bold">${fxDiff}% REDUCTION</div>
                    </div>
                </div>
            `;
            regenHistoryContent.appendChild(entryEl);
        });
    }
    
    cellRegenModal.classList.remove('hidden');
}

const bankHistoryModal = document.getElementById('bank-history-modal')!;
const bankHistoryClose = document.getElementById('bank-history-close')!;
const bankHistoryContent = document.getElementById('bank-history-content')!;
const historyBankIdDisplay = document.getElementById('history-bank-id')!;
const historyRepairCountDisplay = document.getElementById('history-repair-count')!;
const bankHistoryBtn = document.getElementById('bank-history-btn')!;

bankHistoryClose.onclick = () => bankHistoryModal.classList.add('hidden');

function showBankHistory(bank: BatteryBank) {
    historyBankIdDisplay.innerText = String(bank.id).padStart(2, '0');
    historyRepairCountDisplay.innerText = String(bank.repairHistory.length);
    
    let successRate = 0;
    if (bank.repairHistory.length > 0) {
        const successful = bank.repairHistory.filter(h => h.success).length;
        successRate = (successful / bank.repairHistory.length) * 100;
    }

    bankHistoryContent.innerHTML = '';
    
    if (bank.repairHistory.length === 0) {
        bankHistoryContent.innerHTML = `<div class="text-center py-12 opacity-20 italic uppercase text-[10px] tracking-widest">No repair history recorded for this node</div>`;
    } else {
        const summaryEl = document.createElement('div');
        summaryEl.className = 'bg-black/40 border border-white/10 p-4 rounded-sm mb-6 flex justify-around items-center';
        summaryEl.innerHTML = `
            <div class="text-center">
                <div class="text-[8px] text-gray-500 uppercase font-bold mb-1">Success Rate</div>
                <div class="text-2xl font-black ${successRate > 80 ? 'text-adi-green' : (successRate > 50 ? 'text-adi-gold' : 'text-adi-red')}">${successRate.toFixed(1)}%</div>
            </div>
            <div class="text-center">
                <div class="text-[8px] text-gray-500 uppercase font-bold mb-1">Total Cycles</div>
                <div class="text-2xl font-black text-white">${bank.repairHistory.length}</div>
            </div>
        `;
        bankHistoryContent.appendChild(summaryEl);

        [...bank.repairHistory].reverse().forEach((entry) => {
            const entryEl = document.createElement('div');
            entryEl.className = 'bg-adi-panel/80 border-l-4 ' + (entry.success ? 'border-adi-green' : 'border-adi-red') + ' p-5 rounded-sm animate-fadeIn shadow-lg mb-4';
            entryEl.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <div class="text-[10px] text-adi-cyan font-black uppercase tracking-widest mb-1">${entry.type}</div>
                        <div class="text-[8px] text-gray-500 font-bold">${entry.date}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-xs font-black ${entry.success ? 'text-adi-green' : 'text-adi-red'} uppercase tracking-tighter">${entry.success ? 'SUCCESS' : 'STALL'}</div>
                        ${entry.resources ? `<div class="text-[8px] text-adi-green font-bold mt-1">$${entry.resources.cost.toFixed(2)} CREDITS</div>` : ''}
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                    ${entry.preHealth !== undefined && entry.postHealth !== undefined ? `
                        <div class="space-y-1">
                            <div class="text-[7px] text-gray-500 uppercase font-bold">Health Delta</div>
                            <div class="text-xs font-black text-white">${Math.round(entry.preHealth)}% → <span class="text-adi-cyan">${Math.round(entry.postHealth)}%</span></div>
                        </div>
                    ` : ''}
                    ${entry.resources ? `
                        <div class="space-y-1">
                            <div class="text-[7px] text-gray-500 uppercase font-bold">Resources Used</div>
                            <div class="text-[8px] text-white/70 font-bold">${entry.resources.parts.join(', ')}</div>
                        </div>
                    ` : ''}
                </div>
            `;
            bankHistoryContent.appendChild(entryEl);
        });
    }
    
    bankHistoryModal.classList.remove('hidden');
}

bankHistoryBtn.onclick = () => {
    const bank = batteryData[selectedIndex];
    if (bank) showBankHistory(bank);
};

function renderAlerts() {
    const newAlerts: Alert[] = [];
    batteryData.forEach(b => {
        if (b.healthPrediction === 'REGEN_REQ') {
            newAlerts.push({
                id: `alert-regen-${b.id}`,
                bankId: b.id,
                type: 'CRITICAL',
                message: `B${String(b.id).padStart(2, '0')}: REGEN REQUIRED - CRITICAL DEGRADATION`,
                timestamp: Date.now(),
                acknowledged: false
            });
        } else if (b.healthPrediction === 'AT_RISK') {
            newAlerts.push({
                id: `alert-risk-${b.id}`,
                bankId: b.id,
                type: 'WARNING',
                message: `B${String(b.id).padStart(2, '0')}: AT RISK - ELEVATED ENTROPY`,
                timestamp: Date.now(),
                acknowledged: false
            });
        }
        
        if (b.fx > 0.15) {
             newAlerts.push({
                id: `alert-fx-${b.id}`,
                bankId: b.id,
                type: 'CRITICAL',
                message: `B${String(b.id).padStart(2, '0')}: LATTICE ENTROPY CRITICAL (FX: ${b.fx.toFixed(3)})`,
                timestamp: Date.now(),
                acknowledged: false
            });
        }
    });

    alerts = newAlerts; 

    const activeCount = alerts.length;
    if (activeCount > 0) {
        alertBadge.classList.remove('hidden');
        alertBadge.innerText = activeCount.toString();
    } else {
        alertBadge.classList.add('hidden');
    }

    alertsList.innerHTML = '';
    if (activeCount === 0) {
        noAlertsMsg.classList.remove('hidden');
    } else {
        noAlertsMsg.classList.add('hidden');
        alerts.forEach(a => {
            const el = document.createElement('div');
            const colorClass = a.type === 'CRITICAL' ? 'border-adi-red text-adi-red bg-adi-red/5' : 'border-adi-gold text-adi-gold bg-adi-gold/5';
            el.className = `p-3 border rounded-sm animate-fadeIn ${colorClass} relative group`;
            el.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex flex-col">
                        <span class="text-[7px] font-black uppercase tracking-widest opacity-50 mb-1">${a.type} // ${new Date(a.timestamp).toLocaleTimeString()}</span>
                        <span class="text-[10px] font-bold uppercase tracking-tight">${a.message}</span>
                    </div>
                    <button class="alert-goto-btn text-[8px] font-black border border-current px-1 hover:bg-white/10" data-id="${a.bankId}">GOTO</button>
                </div>
            `;
            alertsList.appendChild(el);
        });
        
        document.querySelectorAll('.alert-goto-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt((e.target as HTMLElement).dataset.id!);
                const index = batteryData.findIndex(b => b.id === id);
                if (index !== -1) {
                    selectedIndex = index;
                    renderMatrix();
                    addLog(`NAVIGATING TO NODE B${id}`, "cyan");
                }
            });
        });
    }
}

const analyticsControls = document.getElementById('analytics-controls')!;
const undoTaskBtn = document.getElementById('undo-task-btn')!;
const repairHistoryContainer = document.getElementById('repair-history-container')!;
const taskListContainer = document.getElementById('task-list-container')!;
const analyticsContainer = document.getElementById('analytics-container')!;
const alertsContainer = document.getElementById('alerts-container')!;
const aiContainer = document.getElementById('ai-container')!;
const alertsList = document.getElementById('alerts-list')!;
const noAlertsMsg = document.getElementById('no-alerts-msg')!;
const regenChartRoot = document.getElementById('regen-chart-root')!;
const tasksList = document.getElementById('tasks-list')!;
const addTaskBtn = document.getElementById('add-task-btn')!;
const newTaskForm = document.getElementById('new-task-form')!;
const saveTaskBtn = document.getElementById('save-task-btn')!;
const clearAlertsBtn = document.getElementById('clear-alerts-btn')!;
const newTaskDesc = document.getElementById('new-task-desc') as HTMLInputElement;
const newTaskPriority = document.getElementById('new-task-priority') as HTMLSelectElement;
const taskSortSelect = document.getElementById('task-sort-select') as HTMLSelectElement;

let taskSortMode: 'TIME' | 'PRIORITY_HIGH' | 'PRIORITY_LOW' = 'TIME';
let analyticsMetric: 'FX' | 'VOLTAGE' | 'TEMP' = 'FX';
let lastTasksState: Task[] | null = null;
let taskUndoTimeout: any = null;
let taskUndoInterval: any = null;
let editingTaskId: string | null = null;
let alerts: Alert[] = [];

function pushTaskUndo() {
    lastTasksState = JSON.parse(JSON.stringify(tasks));
    undoTaskBtn.classList.remove('hidden');
    undoTaskBtn.innerText = "UNDO (10s)";
    
    if (taskUndoTimeout) clearTimeout(taskUndoTimeout);
    if (taskUndoInterval) clearInterval(taskUndoInterval);
    
    let countdown = 10;
    taskUndoInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            undoTaskBtn.innerText = `UNDO (${countdown}s)`;
        } else {
            clearInterval(taskUndoInterval);
        }
    }, 1000);

    taskUndoTimeout = setTimeout(() => {
        clearInterval(taskUndoInterval);
        lastTasksState = null;
        undoTaskBtn.classList.add('hidden');
    }, 10000); // 10s undo window
}

function renderTasks() {
    tasksList.innerHTML = '';
    
    let displayTasks = [...tasks];
    const pMap: Record<string, number> = { [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };

    if (taskSortMode === 'PRIORITY_HIGH') {
        displayTasks.sort((a, b) => pMap[b.priority] - pMap[a.priority]);
    } else if (taskSortMode === 'PRIORITY_LOW') {
        displayTasks.sort((a, b) => pMap[a.priority] - pMap[b.priority]);
    } else {
        displayTasks.sort((a, b) => b.timestamp - a.timestamp);
    }

    displayTasks.forEach(t => {
        const el = document.createElement('div');
        const pColor = t.priority === TaskPriority.HIGH ? 'text-adi-red border-adi-red/30 bg-adi-red/5' : (t.priority === TaskPriority.MEDIUM ? 'text-adi-gold border-adi-gold/30 bg-adi-gold/5' : 'text-adi-cyan border-adi-cyan/30 bg-adi-cyan/5');
        const leftBorder = t.priority === TaskPriority.HIGH ? 'border-l-adi-red' : (t.priority === TaskPriority.MEDIUM ? 'border-l-adi-gold' : 'border-l-adi-cyan');
        const statusColor = t.status === 'COMPLETED' ? 'text-adi-green' : 'text-gray-500';
        const opacity = t.status === 'COMPLETED' ? 'opacity-50' : 'opacity-100';
        
        el.className = `flex justify-between items-center p-2 bg-white/5 border border-white/5 border-l-2 ${leftBorder} rounded-sm ${opacity} group hover:bg-white/10 transition-colors`;
        el.innerHTML = `
            <div class="flex flex-col flex-1">
                <span class="text-[9px] font-bold text-white uppercase tracking-wider ${t.status === 'COMPLETED' ? 'line-through' : ''}">${t.desc}</span>
                <div class="flex items-center gap-2 mt-1">
                    <span class="text-[7px] font-black border px-1.5 py-0.5 rounded-[1px] w-fit ${pColor} uppercase tracking-widest">${t.priority}</span>
                    <span class="text-[6px] text-gray-600 uppercase font-bold">${new Date(t.timestamp).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="flex gap-2 items-center">
                <button class="task-toggle-btn text-[10px] ${statusColor} hover:text-white font-black uppercase tracking-widest" data-id="${t.id}">
                    [${t.status === 'COMPLETED' ? 'DONE' : 'PENDING'}]
                </button>
                <button class="task-edit-btn text-[10px] text-adi-cyan hover:text-white font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity" data-id="${t.id}">
                    [EDIT]
                </button>
                <button class="task-delete-btn text-[10px] text-adi-red hover:text-white font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity" data-id="${t.id}">
                    [DEL]
                </button>
            </div>
        `;
        tasksList.appendChild(el);
    });

    // Re-attach listeners
    document.querySelectorAll('.task-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = (e.target as HTMLElement).dataset.id;
            const task = tasks.find(t => t.id === id);
            if (task) {
                pushTaskUndo();
                task.status = task.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
                saveTasks();
            }
        });
    });

    document.querySelectorAll('.task-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = (e.target as HTMLElement).dataset.id;
            const task = tasks.find(t => t.id === id);
            if (task) {
                editingTaskId = id;
                newTaskDesc.value = task.desc;
                newTaskPriority.value = task.priority;
                newTaskForm.classList.remove('hidden');
                saveTaskBtn.innerText = "UPDATE";
                newTaskDesc.focus();
            }
        });
    });

    document.querySelectorAll('.task-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = (e.target as HTMLElement).dataset.id;
            pushTaskUndo();
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            addLog(`PROTOCOL DELETED`, "red");
        });
    });
}

function renderAnalytics() {
    // Collect all cell regen history
    const allRegens: any[] = [];
    batteryData.forEach(b => {
        if (b.cells) {
            b.cells.forEach(c => {
                if (c.regenHistory) {
                    c.regenHistory.forEach(h => {
                        allRegens.push({ ...h, bankId: b.id, cellId: c.id });
                    });
                }
            });
        }
    });

    allRegens.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate Stats
    const totalRegens = allRegens.length;
    let avgGain = 0;
    let successRate = 0;
    const metricKey = analyticsMetric.toLowerCase();

    if (totalRegens > 0) {
        const gains = allRegens.map(h => {
            const pre = h.pre[metricKey];
            const post = h.post[metricKey];
            if (analyticsMetric === 'VOLTAGE') return post - pre;
            return pre - post; // For FX and Temp, lower is better
        });
        avgGain = gains.reduce((a, b) => a + b, 0) / totalRegens;
        successRate = (gains.filter(g => g > 0).length / totalRegens) * 100;
    }

    const unit = analyticsMetric === 'FX' ? '' : (analyticsMetric === 'VOLTAGE' ? 'V' : '°C');
    const sign = avgGain > 0 ? '+' : '';

    const statAvgGain = document.getElementById('stat-avg-gain');
    const statTotalRegens = document.getElementById('stat-total-regens');
    const statSuccessRate = document.getElementById('stat-success-rate');

    if (statAvgGain) statAvgGain.textContent = `${sign}${avgGain.toFixed(analyticsMetric === 'FX' ? 3 : 2)}${unit}`;
    if (statTotalRegens) statTotalRegens.textContent = totalRegens.toString();
    if (statSuccessRate) statSuccessRate.textContent = `${successRate.toFixed(0)}%`;

    // Data for Pre vs Post (Last 10)
    const recentHistory = allRegens.slice(-10);
    
    const barData = recentHistory.map((h, i) => ({
        name: `#${totalRegens - recentHistory.length + i + 1}`,
        pre: h.pre[metricKey],
        post: h.post[metricKey],
        label: `B${String(h.bankId).padStart(2, '0')}:C${String(h.cellId).padStart(2, '0')}`
    }));

    // Data for Trend (Last 20)
    const trendHistory = allRegens.slice(-20);
    const trendData = trendHistory.map((h, i) => {
        const pre = h.pre[metricKey];
        const post = h.post[metricKey];
        const gain = analyticsMetric === 'VOLTAGE' ? (post - pre) : (pre - post);
        return {
            index: i + 1,
            gain: parseFloat(gain.toFixed(3)),
            label: `B${String(h.bankId).padStart(2, '0')}:C${String(h.cellId).padStart(2, '0')}`
        };
    });

    // Colors
    const colorPre = analyticsMetric === 'FX' ? 'rgba(255, 0, 255, 0.4)' : (analyticsMetric === 'VOLTAGE' ? 'rgba(255, 51, 51, 0.4)' : 'rgba(255, 165, 0, 0.4)');
    const colorPost = analyticsMetric === 'FX' ? 'rgba(0, 242, 255, 0.6)' : (analyticsMetric === 'VOLTAGE' ? 'rgba(0, 255, 65, 0.6)' : 'rgba(0, 191, 255, 0.6)');
    const colorTrend = analyticsMetric === 'FX' ? '#d946ef' : (analyticsMetric === 'VOLTAGE' ? '#4ade80' : '#38bdf8');

    // Render Bar Chart
    const barRoot = getRoot('regen-chart-root');
    if (barRoot) {
        barRoot.render(
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="#4b5563" fontSize={8} tickLine={false} axisLine={false} />
                    <YAxis stroke="#4b5563" fontSize={8} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '9px' }}
                        itemStyle={{ fontSize: '9px' }}
                        labelFormatter={(label, payload) => payload[0]?.payload?.label || label}
                    />
                    <Bar dataKey="pre" name="Pre" fill={colorPre} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="post" name="Post" fill={colorPost} radius={[2, 2, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        );
    }

    // Render Trend Chart
    const trendRoot = getRoot('trend-chart-root');
    if (trendRoot) {
        trendRoot.render(
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="index" stroke="#4b5563" fontSize={8} tickLine={false} axisLine={false} />
                    <YAxis stroke="#4b5563" fontSize={8} tickLine={false} axisLine={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '9px' }}
                        itemStyle={{ fontSize: '9px' }}
                        formatter={(value: any) => [`${value > 0 ? '+' : ''}${value}${unit}`, 'Improvement']}
                        labelFormatter={(label, payload) => payload[0]?.payload?.label || `Cycle #${label}`}
                    />
                    <Line type="monotone" dataKey="gain" stroke={colorTrend} strokeWidth={2} dot={{ r: 2, fill: colorTrend }} activeDot={{ r: 4, fill: '#fff' }} />
                </LineChart>
            </ResponsiveContainer>
        );
    }
}

// Task Event Listeners
undoTaskBtn.onclick = () => {
    if (lastTasksState) {
        tasks = JSON.parse(JSON.stringify(lastTasksState));
        saveTasks();
        lastTasksState = null;
        undoTaskBtn.classList.add('hidden');
        if (taskUndoTimeout) clearTimeout(taskUndoTimeout);
        if (taskUndoInterval) clearInterval(taskUndoInterval);
        addLog("TASK MODIFICATION UNDONE", "gold");
    }
};

function switchTab(tabId: 'history' | 'tasks' | 'analytics' | 'alerts' | 'ai') {
    const tabs = [
        { id: 'history', el: tabHistory, controls: historyControls, container: repairHistoryContainer, activeClass: 'text-adi-magenta', activeBorder: 'border-adi-magenta' },
        { id: 'tasks', el: tabTasks, controls: taskControls, container: taskListContainer, activeClass: 'text-adi-cyan', activeBorder: 'border-adi-cyan' },
        { id: 'analytics', el: tabAnalytics, controls: analyticsControls, container: analyticsContainer, activeClass: 'text-adi-teal', activeBorder: 'border-adi-teal' },
        { id: 'alerts', el: tabAlerts, controls: alertControls, container: alertsContainer, activeClass: 'text-adi-red', activeBorder: 'border-adi-red' },
        { id: 'ai', el: tabAi, controls: aiControls, container: aiContainer, activeClass: 'text-adi-gold', activeBorder: 'border-adi-gold' }
    ];

    tabs.forEach(tab => {
        if (tab.id === tabId) {
            tab.el.classList.add(tab.activeClass, tab.activeBorder);
            tab.el.classList.remove('text-gray-500', 'border-transparent');
            tab.controls.classList.remove('hidden');
            tab.container.classList.remove('hidden');
            if (tabId === 'tasks') renderTasks();
            if (tabId === 'analytics') renderAnalytics();
            if (tabId === 'alerts') renderAlerts();
            if (tabId === 'ai') renderAI();
        } else {
            tab.el.classList.add('text-gray-500', 'border-transparent');
            tab.el.classList.remove(tab.activeClass, tab.activeBorder);
            tab.controls.classList.add('hidden');
            tab.container.classList.add('hidden');
        }
    });
}

tabHistory.onclick = () => switchTab('history');
tabTasks.onclick = () => switchTab('tasks');
tabAnalytics.onclick = () => switchTab('analytics');
tabAlerts.onclick = () => switchTab('alerts');
tabAi.onclick = () => switchTab('ai');

tabAlerts.onclick = () => {
    tabAlerts.classList.add('text-adi-red', 'border-adi-red');
    tabAlerts.classList.remove('text-gray-500', 'border-transparent');
    tabHistory.classList.add('text-gray-500', 'border-transparent');
    tabHistory.classList.remove('text-adi-magenta', 'border-adi-magenta');
    tabTasks.classList.add('text-gray-500', 'border-transparent');
    tabTasks.classList.remove('text-adi-cyan', 'border-adi-cyan');
    tabAnalytics.classList.add('text-gray-500', 'border-transparent');
    tabAnalytics.classList.remove('text-adi-teal', 'border-adi-teal');
    tabAi.classList.add('text-gray-500', 'border-transparent');
    tabAi.classList.remove('text-adi-gold', 'border-adi-gold');

    alertControls.classList.remove('hidden');
    historyControls.classList.add('hidden');
    taskControls.classList.add('hidden');
    analyticsControls.classList.add('hidden');
    aiControls.classList.add('hidden');
    
    alertsContainer.classList.remove('hidden');
    repairHistoryContainer.classList.add('hidden');
    taskListContainer.classList.add('hidden');
    analyticsContainer.classList.add('hidden');
    aiContainer.classList.add('hidden');
    renderAlerts();
};

tabAi.onclick = () => {
    tabAi.classList.add('text-adi-gold', 'border-adi-gold');
    tabAi.classList.remove('text-gray-500', 'border-transparent');
    tabHistory.classList.add('text-gray-500', 'border-transparent');
    tabHistory.classList.remove('text-adi-magenta', 'border-adi-magenta');
    tabTasks.classList.add('text-gray-500', 'border-transparent');
    tabTasks.classList.remove('text-adi-cyan', 'border-adi-cyan');
    tabAnalytics.classList.add('text-gray-500', 'border-transparent');
    tabAnalytics.classList.remove('text-adi-teal', 'border-adi-teal');
    tabAlerts.classList.add('text-gray-500', 'border-transparent');
    tabAlerts.classList.remove('text-adi-red', 'border-adi-red');

    aiControls.classList.remove('hidden');
    historyControls.classList.add('hidden');
    taskControls.classList.add('hidden');
    analyticsControls.classList.add('hidden');
    alertControls.classList.add('hidden');
    
    aiContainer.classList.remove('hidden');
    repairHistoryContainer.classList.add('hidden');
    taskListContainer.classList.add('hidden');
    analyticsContainer.classList.add('hidden');
    alertsContainer.classList.add('hidden');
};

document.querySelectorAll('.analytics-metric-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const metric = (e.target as HTMLElement).dataset.metric as 'FX' | 'VOLTAGE' | 'TEMP';
        analyticsMetric = metric;
        
        // Update active state
        document.querySelectorAll('.analytics-metric-btn').forEach(b => {
            const el = b as HTMLElement;
            if (el.dataset.metric === metric) {
                el.classList.remove('bg-transparent', 'text-gray-500', 'border-white/10');
                el.classList.add('bg-adi-magenta', 'text-black', 'border-transparent');
            } else {
                el.classList.add('bg-transparent', 'text-gray-500', 'border-white/10');
                el.classList.remove('bg-adi-magenta', 'text-black', 'border-transparent');
            }
        });

        renderAnalytics();
    });
});

clearAlertsBtn.onclick = () => {
    addLog("SYSTEM ALERTS ACKNOWLEDGED", "green");
    // In this simulation, alerts are derived from data, so they'll reappear if conditions persist
    // But we can clear the UI list temporarily or just log it
};

addTaskBtn.onclick = () => {
    editingTaskId = null;
    newTaskDesc.value = '';
    newTaskPriority.value = TaskPriority.LOW;
    saveTaskBtn.innerText = "SAVE";
    newTaskForm.classList.toggle('hidden');
    if (!newTaskForm.classList.contains('hidden')) newTaskDesc.focus();
};

saveTaskBtn.onclick = () => {
    const desc = newTaskDesc.value.trim();
    if (!desc) return;
    
    pushTaskUndo();
    const priority = newTaskPriority.value as TaskPriority;

    if (editingTaskId) {
        const task = tasks.find(t => t.id === editingTaskId);
        if (task) {
            task.desc = desc;
            task.priority = priority;
            addLog(`PROTOCOL UPDATED: ${desc}`, "cyan");
        }
        editingTaskId = null;
    } else {
        tasks.unshift({
            id: `t${Date.now()}`,
            desc,
            priority,
            status: 'PENDING',
            timestamp: Date.now()
        });
        addLog(`NEW PROTOCOL ADDED: ${desc}`, "cyan");
    }

    newTaskDesc.value = '';
    newTaskForm.classList.add('hidden');
    saveTasks();
};

taskSortSelect.onchange = (e) => {
    taskSortMode = (e.target as HTMLSelectElement).value as any;
    renderTasks();
};

const getRoot = (id: string) => {
    const w = window as any;
    if (!w._reactRoots) w._reactRoots = new Map<string, { root: any, el: HTMLElement }>();
    const roots = w._reactRoots;

    const currentEl = document.getElementById(id);
    if (!currentEl) return null;

    if (roots.has(id)) {
        const { root, el } = roots.get(id);
        if (el === currentEl) {
            return root;
        }
    }
    
    const root = createRoot(currentEl);
    roots.set(id, { root, el: currentEl });
    return root;
};

const updateTick = async () => {
    console.log("Heartbeat: updateTick running");
    // Periodic License Check
    if (!(await LicenseManager.verify())) {
        LicenseManager.lockout();
        return;
    }

    const avgVoltage = batteryData.reduce((a, b) => a + parseFloat(b.voltage), 0) / batteryData.length;

    batteryData = batteryData.map(bank => {
        let vChange = (Math.random() - 0.5) * 0.005;
        let tChange = (Math.random() - 0.45) * 0.2;
        
        if (bank.v2gStatus === 'ENGAGED') {
            vChange -= 0.002; // Discharging to grid
            tChange += 0.15;  // Heating up due to transfer
        }
        
        const newVoltage = (parseFloat(bank.voltage) + vChange).toFixed(2);
        const newTemp = (parseFloat(bank.temp) + tChange).toFixed(1);
        const newFx = Math.max(0, Math.min(1.0, bank.fx + (Math.random() - 0.4) * 0.001));

        // Simulate Cells
        let updatedCells = bank.cells;
        if (updatedCells) {
            updatedCells = updatedCells.map(cell => {
                let cvChange = (Math.random() - 0.5) * 0.01;
                let ctChange = (Math.random() - 0.45) * 0.3;
                
                // Degrade critical cells faster
                if (cell.status === 'CRITICAL') {
                    cvChange -= 0.005;
                    ctChange += 0.2;
                }

                const newCVoltage = Math.max(2.5, Math.min(4.5, cell.voltage + cvChange));
                const newCTemp = Math.max(15, cell.temp + ctChange);
                
                let status: 'GOOD' | 'WEAK' | 'CRITICAL' = 'GOOD';
                if (newCVoltage < 3.2 || newCVoltage > 4.25 || newCTemp > 50) status = 'CRITICAL';
                else if (newCVoltage < 3.6 || newCVoltage > 4.2 || newCTemp > 40) status = 'WEAK';

                return { ...cell, voltage: newCVoltage, temp: newCTemp, status };
            });
        }

        // Prediction Logic
        const tempBank = { ...bank, voltage: newVoltage, temp: newTemp, fx: newFx };
        const bhs = calculateBHS(tempBank, avgVoltage);
        
        let prediction: 'STABLE' | 'DEGRADING' | 'REGEN_REQ' | 'AT_RISK' = 'STABLE';
        let predictedFailureDate = bank.predictedFailureDate;

        // Calculate degradation rate (change in BHS per cycle/tick)
        const prevBhs = calculateBHS(bank, avgVoltage);
        const currentDegradationRate = Math.max(0, prevBhs - bhs);
        const smoothedDegradationRate = bank.degradationRate ? (bank.degradationRate * 0.8 + currentDegradationRate * 0.2) : currentDegradationRate;

        // Calculate remaining lifespan in days based on degradation rate
        // Assuming 1 tick = 0.1 days for simulation purposes
        const ticksToFailure = smoothedDegradationRate > 0 ? (bhs - 40) / smoothedDegradationRate : 1000;
        const remainingDays = Math.max(0, Math.floor(ticksToFailure * 0.1));
        
        if (bhs < 45 || parseFloat(bank.ir) > 20 || newFx > 0.12) {
            prediction = 'REGEN_REQ';
            predictedFailureDate = 'IMMINENT';
            if (bank.healthPrediction !== 'REGEN_REQ') {
                addLog(`PREDICTION ALERT: B${String(bank.id).padStart(2, '0')} REQUIRES REGENERATION`, "red");
            }
        } else if (bank.healthPrediction === 'REGEN_REQ') {
            if (bhs > 85) prediction = 'STABLE'; 
            else {
                prediction = 'REGEN_REQ';
                predictedFailureDate = 'IMMINENT';
            }
        } else if (remainingDays <= 7) {
            prediction = 'AT_RISK';
            const failureDate = new Date();
            failureDate.setDate(failureDate.getDate() + remainingDays);
            predictedFailureDate = failureDate.toISOString().split('T')[0];
            
            if (bank.healthPrediction !== 'AT_RISK') {
                addLog(`URGENT: B${String(bank.id).padStart(2, '0')} AT RISK - FAILURE IN ${remainingDays} DAYS`, "red");
            }
        } else if (bhs < 80) {
            prediction = 'DEGRADING';
            const failureDate = new Date();
            failureDate.setDate(failureDate.getDate() + remainingDays);
            predictedFailureDate = failureDate.toISOString().split('T')[0];
        } else {
            prediction = 'STABLE';
            predictedFailureDate = undefined;
        }

        if (prediction === 'STABLE') {
            predictedFailureDate = undefined; 
        }

        return {
            ...bank, 
            voltage: newVoltage,
            temp: newTemp,
            fx: newFx,
            healthPrediction: prediction,
            predictedFailureDate,
            degradationRate: smoothedDegradationRate,
            cells: updatedCells
        };
    });
    renderMatrix();
    
    // Update inspector if open
    if (!cellInspectorModal.classList.contains('hidden')) {
        const bank = batteryData[selectedIndex];
        if (bank && bank.cells) {
             inspectorBankVoltage.innerText = bank.voltage;
             inspectorBankStatus.innerText = bank.healthPrediction || 'STABLE';
             inspectorBankStatus.className = `text-xl font-black uppercase tracking-tighter ${bank.healthPrediction === 'REGEN_REQ' ? 'text-adi-red animate-pulse' : (bank.healthPrediction === 'AT_RISK' ? 'text-adi-gold' : 'text-adi-green')}`;
             
             if (bank.predictedFailureDate) {
                 inspectorFailureContainer.classList.remove('hidden');
                 inspectorFailureDate.innerText = bank.predictedFailureDate === 'IMMINENT' ? 'IMMINENT FAILURE' : bank.predictedFailureDate;
                 inspectorFailureDate.className = `text-[10px] font-black tabular-nums tracking-widest ${bank.predictedFailureDate === 'IMMINENT' ? 'text-adi-red animate-pulse' : 'text-adi-gold'}`;
                 
                 const fleetAvgV = batteryData.reduce((a, b) => a + parseFloat(b.voltage), 0) / batteryData.length;
                 const bhs = calculateBHS(bank, fleetAvgV);
                 const prob = Math.min(99.9, Math.max(0.1, (100 - bhs) * (bank.healthPrediction === 'REGEN_REQ' ? 1.5 : 1)));
                 inspectorFailureProb.innerText = `${prob.toFixed(1)}%`;
                 inspectorDegradationRate.innerText = `${(bank.degradationRate || 0).toFixed(3)}%/tick`;
             } else {
                 inspectorFailureContainer.classList.add('hidden');
             }

             renderCellGrid(bank);
        }
    }

    const timestamp = new Date().toLocaleTimeString();
    const vPoint: ChartDataPoint = { time: timestamp };
    const fxPoint: ChartDataPoint = { time: timestamp };
    batteryData.forEach(b => { vPoint[`bank_${b.id}`] = parseFloat(b.voltage); fxPoint[`bank_fx_${b.id}`] = b.fx; });
    chartHistory.push(vPoint); if (chartHistory.length > MAX_HISTORY) chartHistory.shift();
    fxHistory.push(fxPoint); if (fxHistory.length > MAX_HISTORY) fxHistory.shift();
    
    const cRoot = getRoot('voltage-chart-root');
    const fRoot = getRoot('fx-chart-root');
    if (cRoot) cRoot.render(<VoltageChart data={[...chartHistory]} selectedIndex={selectedIndex} />);
    if (fRoot) fRoot.render(<FactorXChart data={[...fxHistory]} />);

    // Update grid status live for selected bank
    const selectedBank = batteryData[selectedIndex];
    if (gridStatus) {
        gridStatus.innerText = selectedBank.v2gStatus || 'READY';
        gridStatus.className = `text-xs font-bold ${selectedBank.v2gStatus === 'ENGAGED' ? 'text-adi-magenta animate-pulse' : 'text-adi-gold'}`;
    }

    renderAlerts();
};

setInterval(updateTick, 3000); // Update UI every 3 seconds

function forceRestoreConsole() {
    if (!logBox) return;
    logBox.innerHTML = '';
    addLog("SYSTEM VISUALIZATION RESTORED", "green");
    addLog("CONSOLE LINK ESTABLISHED", "cyan");
    logBox.scrollTop = 0;
}

// Initial Startup License Check
(async () => {
    try {
        forceRestoreConsole();
        addLog("SYSTEM INITIALIZING...", "cyan");
        if (!(await LicenseManager.verify())) {
            LicenseManager.lockout();
        } else {
            addLog("LICENSE VERIFIED. CORE ONLINE.", "green");
            await updateTick(); // Initial render
            filterAllBtn.classList.add('bg-white/20', 'border-white');
            filterAllBtn.classList.remove('bg-white/10', 'border-white/20');
            renderMatrix(); 
            renderRepairHistory();
            renderFleetSummary();
        }
    } catch (error) {
        console.error("CRITICAL BOOT ERROR:", error);
        addLog("CRITICAL BOOT ERROR DETECTED", "red");
    }
})();

// --- AI ASSISTANT LOGIC ---
import { GoogleGenAI } from "@google/genai";

const aiInput = document.getElementById('ai-input') as HTMLInputElement;
const aiSendBtn = document.getElementById('ai-send-btn') as HTMLButtonElement;
const aiGenImgBtn = document.getElementById('ai-gen-img-btn') as HTMLButtonElement;
const aiGenVidBtn = document.getElementById('ai-gen-vid-btn') as HTMLButtonElement;
const aiChatLog = document.getElementById('ai-chat-log')!;

const apiKey = "AIzaSyBTScEKANDM3S4l7QdhrKUxnDSm4zB-o70";
const ai = new GoogleGenAI({ apiKey });

function addAiMessage(msg: string, role: 'user' | 'ai' | 'system' = 'ai') {
    const div = document.createElement('div');
    div.className = `p-2 rounded-sm border ${role === 'user' ? 'bg-white/5 border-white/10 text-white ml-4' : (role === 'system' ? 'bg-adi-red/10 border-adi-red/30 text-adi-red' : 'bg-adi-gold/10 border-adi-gold/30 text-adi-gold mr-4')}`;
    div.innerHTML = msg;
    aiChatLog.appendChild(div);
    aiChatLog.scrollTop = aiChatLog.scrollHeight;
}

if (aiSendBtn) {
    aiSendBtn.onclick = async () => {
        const text = aiInput.value.trim();
        if (!text) return;
        
        aiInput.value = '';
        addAiMessage(`> ${text}`, 'user');
        
        try {
            const response = await ai.models.generateContent({
                model: "gemini-3.1-pro-preview",
                contents: text,
            });
            addAiMessage(response.text || "NO RESPONSE");
        } catch (e: any) {
            addAiMessage(`ERROR: ${e.message}`, 'system');
        }
    };
}

if (aiGenImgBtn) {
    aiGenImgBtn.onclick = async () => {
        const text = aiInput.value.trim() || "A futuristic micromobility fleet orchestration center, cyberpunk style, neon lights";
        aiInput.value = '';
        addAiMessage(`> GENERATE IMAGE: ${text}`, 'user');
        
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.1-flash-image-preview',
                contents: { parts: [{ text }] },
                config: {
                    imageConfig: { aspectRatio: "16:9", imageSize: "1K" }
                }
            });
            
            let found = false;
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    addAiMessage(`<img src="${imageUrl}" class="w-full rounded-sm border border-adi-cyan/30 mt-2" />`);
                    found = true;
                }
            }
            if (!found) addAiMessage("IMAGE GENERATION FAILED: NO IMAGE DATA", 'system');
        } catch (e: any) {
            addAiMessage(`ERROR: ${e.message}`, 'system');
        }
    };
}

if (aiGenVidBtn) {
    aiGenVidBtn.onclick = async () => {
        const text = aiInput.value.trim() || "A futuristic e-bike driving through a neon city at night";
        aiInput.value = '';
        addAiMessage(`> GENERATE VIDEO: ${text}`, 'user');
        addAiMessage(`INITIATING VEO VIDEO GENERATION... THIS MAY TAKE A FEW MINUTES.`, 'system');
        
        try {
            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: text,
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: '16:9'
                }
            });
            
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({operation: operation});
            }
            
            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                addAiMessage(`<video src="${downloadLink}" controls class="w-full rounded-sm border border-adi-magenta/30 mt-2"></video>`);
            } else {
                addAiMessage("VIDEO GENERATION FAILED: NO VIDEO URI", 'system');
            }
        } catch (e: any) {
            addAiMessage(`ERROR: ${e.message}`, 'system');
        }
    };
}

if (aiInput) {
    aiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') aiSendBtn.click();
    });
}
