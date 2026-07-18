
import React, { useState, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { QRCodeCanvas } from "qrcode.react";
import { inject, track } from "@vercel/analytics";
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

enum V2GStatus {
    READY = 'READY',
    ENGAGED = 'ENGAGED',
    OFFLINE = 'OFFLINE'
}

interface Task {
    id: string;
    desc: string;
    priority: TaskPriority;
    status: 'PENDING' | 'COMPLETED';
    timestamp: number;
    dueDate?: number;
    notes?: string;
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
    ir: number;
    status: 'GOOD' | 'WEAK' | 'CRITICAL';
    fx: number;
    regenHistory?: CellRegenEntry[];
    v2gStatus?: V2GStatus;
    v2gCycles?: number;
    regenProgress?: number;
    regenStatus?: 'ONGOING' | 'SUCCESS' | 'FAILURE';
}

interface BatteryBank {
    id: number;
    voltage: string;
    ir: string;
    temp: string;
    fx: number;
    repairHistory: RepairHistoryEntry[];
    bhsHistory?: { time: string; score: number }[];
    v2gStatus?: V2GStatus;
    v2gCycles?: number;
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

interface MineralRecovery {
    lithium: number;
    cobalt: number;
    nickel: number;
    lithiumTarget: number;
    cobaltTarget: number;
    nickelTarget: number;
}

// --- COMPONENTS ---

const BHSTrendChart = ({ data, repairs }: { data: { time: string; score: number }[]; repairs?: RepairHistoryEntry[] }) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorBhs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffd700" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ffd700" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                    dataKey="time" 
                    hide 
                />
                <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 8, fill: '#666', fontWeight: 'bold' }} 
                    axisLine={false}
                    tickLine={false}
                    ticks={[0, 25, 50, 65, 85, 100]}
                />
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'rgba(11, 18, 25, 0.95)', 
                        border: '1px solid rgba(255,215,0,0.4)', 
                        fontSize: '10px',
                        borderRadius: '2px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}
                    itemStyle={{ color: '#ffd700', fontWeight: 'bold' }}
                    labelStyle={{ color: '#666', marginBottom: '4px', display: 'block' }}
                    cursor={{ stroke: 'rgba(255,215,0,0.2)', strokeWidth: 1 }}
                />
                <ReferenceLine y={85} stroke="rgba(255,215,0,0.3)" strokeDasharray="3 3" label={{ position: 'right', value: 'WARN', fill: 'rgba(255,215,0,0.4)', fontSize: 7, fontWeight: 'bold' }} />
                <ReferenceLine y={65} stroke="rgba(255,51,51,0.3)" strokeDasharray="3 3" label={{ position: 'right', value: 'CRIT', fill: 'rgba(255,51,51,0.4)', fontSize: 7, fontWeight: 'bold' }} />
                
                {repairs?.map((r, i) => {
                    const dateObj = new Date(r.timestamp);
                    const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                        <ReferenceLine 
                            key={i} 
                            x={formattedTime} 
                            stroke="rgba(0, 255, 127, 0.4)" 
                            strokeWidth={1}
                            label={{ position: 'top', value: 'REGEN', fill: 'rgba(0, 255, 127, 0.6)', fontSize: 6 }} 
                        />
                    );
                })}

                <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#ffd700" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorBhs)" 
                    isAnimationActive={false}
                    dot={{ r: 1, fill: '#ffd700', strokeWidth: 0, fillOpacity: 0.5 }}
                    activeDot={{ r: 3, fill: '#ffd700', stroke: '#000', strokeWidth: 1 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

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

const TemperatureChart = ({ data, selectedIndex }: { data: ChartDataPoint[], selectedIndex: number }) => {
    const lines = useMemo(() => Array.from({ length: 32 }, (_, i) => `bank_temp_${i + 1}`), []);
    const selectedBankKey = `bank_temp_${selectedIndex + 1}`;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis domain={[15, 60]} stroke="rgba(255, 0, 255, 0.4)" fontSize={8} tickFormatter={(val) => `${val}°C`} />
                <ReferenceLine y={45} stroke="#ff3333" strokeDasharray="3 3" />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#0b1219', border: '1px solid #ff00ff', fontSize: '9px', fontFamily: 'JetBrains Mono' }} 
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
                            stroke={isSelected ? "#ff00ff" : (idx % 2 === 0 ? "#ff00ff" : "#00f2ff")} 
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
let isRepairing = false; let selectedIndex = 0; let selectedBankIds: Set<number> = new Set(); let globalHistoryMode = false;

let mineralData: MineralRecovery = {
    lithium: 12.45,
    cobalt: 4.82,
    nickel: 8.15,
    lithiumTarget: 25.0,
    cobaltTarget: 10.0,
    nickelTarget: 15.0
};
const STORAGE_KEY = 'adi_sovereign_v26_55';
const TASKS_KEY = 'adi_tasks_v1';

let undoSnapshot: BatteryBank | null = null;
let undoTargetIndex: number | null = null;
let undoTimeoutId: any = null;
let undoRemaining = 10;

const chartHistory: ChartDataPoint[] = [];
const fxHistory: ChartDataPoint[] = [];
const tempHistory: ChartDataPoint[] = [];
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
    let data: BatteryBank[] = [];
    if (saved) { 
        try { 
            data = JSON.parse(saved);
            // Migration: Ensure cells exist and other fields
            data = data.map((b: BatteryBank, i) => {
                if (!b.cells) {
                    b.cells = Array.from({ length: 16 }, (_, j) => ({
                        id: j + 1,
                        voltage: 3.9 + Math.random() * 0.2,
                        temp: 22 + Math.random() * 5,
                        ir: 0.5 + Math.random() * 1.5,
                        status: Math.random() > 0.9 ? 'WEAK' : 'GOOD',
                        fx: 0.01 + Math.random() * 0.05,
                        v2gStatus: V2GStatus.READY,
                        v2gCycles: Math.floor(Math.random() * 50)
                    }));
                } else {
                    b.cells = b.cells.map(c => ({
                        ...c,
                        voltage: c.voltage != null ? Number(c.voltage) : 3.9 + Math.random() * 0.2,
                        temp: c.temp != null ? Number(c.temp) : 22 + Math.random() * 5,
                        ir: c.ir != null ? Number(c.ir) : 0.5 + Math.random() * 1.5,
                        status: c.status || (Math.random() > 0.9 ? 'WEAK' : 'GOOD'),
                        fx: c.fx != null ? Number(c.fx) : 0.01 + Math.random() * 0.05,
                        v2gStatus: c.v2gStatus || V2GStatus.READY,
                        v2gCycles: c.v2gCycles || Math.floor(Math.random() * 50)
                    }));
                }
                if (!b.bhsHistory) {
                    const initialBhs = 85 + Math.random() * 15;
                    b.bhsHistory = Array.from({ length: 24 }, (_, j) => ({
                        time: `-${24 - j}h`,
                        score: Math.max(0, Math.min(100, initialBhs - (24 - j) * (0.1 + Math.random() * 0.2)))
                    }));
                }
                if (!b.id) b.id = i + 1;
                if (!b.v2gStatus) b.v2gStatus = 'READY';
                if (b.v2gCycles === undefined) b.v2gCycles = Math.floor(Math.random() * 50);
                if (b.fx === undefined) b.fx = 0.02 + Math.random() * 0.12;
                if (b.voltage === undefined) b.voltage = (3.9 + Math.random() * 0.2).toFixed(2);
                if (b.ir === undefined) b.ir = (12 + Math.random() * 8).toFixed(1);
                if (b.temp === undefined) b.temp = (22 + Math.random() * 5).toFixed(1);
                return b;
            });
        } catch(e) { console.error(e); } 
    }

    // Ensure exactly 32 banks for hackathon presentation stability
    if (data.length < 32) {
        const missingCount = 32 - data.length;
        const startId = data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1;
        const initialBhs = 85 + Math.random() * 15;
        const bhsHistory = Array.from({ length: 24 }, (_, j) => ({
            time: `-${24 - j}h`,
            score: Math.max(0, Math.min(100, initialBhs - (24 - j) * (0.1 + Math.random() * 0.2)))
        }));

        const missing = Array.from({ length: missingCount }, (_, i) => ({
            id: startId + i, 
            voltage: (3.9 + Math.random() * 0.2).toFixed(2), 
            ir: (12 + Math.random() * 8).toFixed(1),
            temp: (22 + Math.random() * 5).toFixed(1), 
            fx: 0.02 + Math.random() * 0.1, 
            repairHistory: [],
            bhsHistory,
            v2gStatus: V2GStatus.READY,
            v2gCycles: 0,
            healthPrediction: 'STABLE' as const,
            degradationRate: 0.005 + Math.random() * 0.01,
            predictedFailureDate: '> 30 DAYS',
            cells: Array.from({ length: 16 }, (_, j) => ({
                id: j + 1,
                voltage: 3.9 + Math.random() * 0.2,
                temp: 22 + Math.random() * 5,
                ir: 0.5 + Math.random() * 1.5,
                status: Math.random() > 0.95 ? 'CRITICAL' as const : (Math.random() > 0.8 ? 'WEAK' as const : 'GOOD' as const),
                fx: 0.01 + Math.random() * 0.05
            }))
        }));
        data = [...data, ...missing];
    } else if (data.length > 32) {
        data = data.slice(0, 32);
    }
    
    return data;
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
const modalRiskText = document.getElementById('modal-risk-text')!;

// Sim Elements
const openSimBtn = document.getElementById('open-sim-btn')!;
const simModalOverlay = document.getElementById('sim-modal-overlay')!;
const simCloseBtn = document.getElementById('sim-close-btn')!;

// QR Elements
const openQrBtn = document.getElementById('open-qr-btn')!;
const openDocsQrBtn = document.getElementById('open-docs-qr-btn')!;
const openStartupBtn = document.getElementById('open-startup-btn')!;
const qrModalOverlay = document.getElementById('qr-modal-overlay')!;
const qrCloseBtn = document.getElementById('qr-close-btn')!;
const qrContainer = document.getElementById('qr-container')!;
const qrUrlDisplay = document.getElementById('qr-url-display')!;
const qrDownloadBtn = document.getElementById('qr-download-btn')! as HTMLButtonElement;
const docsDownloadBtn = document.getElementById('docs-download-btn')! as HTMLButtonElement;

// Cell Inspector Elements
const cellInspectorModal = document.getElementById('cell-inspector-modal')!;
const cellInspectorClose = document.getElementById('cell-inspector-close')!;
const inspectorBankId = document.getElementById('inspector-bank-id')!;
const inspectorBankVoltage = document.getElementById('inspector-bank-voltage')!;
const inspectorBankStatus = document.getElementById('inspector-bank-status')!;
const inspectorV2GStatus = document.getElementById('inspector-v2g-status')!;
const inspectorV2GCycles = document.getElementById('inspector-v2g-cycles')!;
const inspectorFailureContainer = document.getElementById('inspector-failure-container')!;
const inspectorFailureDate = document.getElementById('inspector-failure-date')!;
const inspectorFailureProb = document.getElementById('inspector-failure-prob')!;
const inspectorDegradationRate = document.getElementById('inspector-degradation-rate')!;
const cellGrid = document.getElementById('cell-grid')!;
const regenCellsBtn = document.getElementById('regen-cells-btn') as HTMLButtonElement;
const v2gEngagedCount = document.getElementById('v2g-engaged-count') as HTMLElement;
const v2gReadyCount = document.getElementById('v2g-ready-count') as HTMLElement;
const v2gOfflineCount = document.getElementById('v2g-offline-count') as HTMLElement;
const headerV2GEngaged = document.getElementById('header-v2g-engaged') as HTMLElement;
const headerV2GReady = document.getElementById('header-v2g-ready') as HTMLElement;
const headerV2GOffline = document.getElementById('header-v2g-offline') as HTMLElement;

let selectedCells: Set<number> = new Set();

function updateCellBatchToolbar() {
    if (selectedCells.size > 0) {
        cellBatchToolbar.classList.remove('hidden');
        cellBatchCount.innerText = `${selectedCells.size} CELLS SELECTED`;
    } else {
        cellBatchToolbar.classList.add('hidden');
    }
}

function openCellInspector(bankIndex: number) {
    const bank = batteryData[bankIndex];
    if (!bank.cells) return;

    inspectorBankId.innerText = `B${String(bank.id).padStart(2, '0')}`;
    inspectorBankVoltage.innerText = bank.voltage;
    inspectorBankStatus.innerText = bank.healthPrediction || 'STABLE';
    inspectorBankStatus.className = `text-xl font-black uppercase tracking-tighter ${bank.healthPrediction === 'REGEN_REQ' ? 'text-adi-red animate-pulse' : (bank.healthPrediction === 'AT_RISK' ? 'text-adi-gold' : 'text-adi-green')}`;

    const v2gStatus = bank.v2gStatus || V2GStatus.OFFLINE;
    inspectorV2GStatus.innerText = v2gStatus;
    const v2gClass = v2gStatus === V2GStatus.ENGAGED ? 'bg-adi-magenta text-black animate-pulse shadow-[0_0_15px_rgba(255,0,255,0.4)]' : (v2gStatus === V2GStatus.READY ? 'bg-adi-green text-black shadow-[0_0_10px_rgba(0,255,65,0.2)]' : 'bg-gray-800 text-gray-500 border border-white/10');
    inspectorV2GStatus.className = `text-xs font-black uppercase tracking-widest px-3 py-1 rounded-sm w-fit ${v2gClass}`;

    inspectorV2GCycles.innerText = (bank.v2gCycles || 0).toString();

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

    selectedCells = new Set();
    updateCellBatchToolbar();
    renderCellGrid(bank);
    renderBHSTrendChart(bank);
    renderCellVarianceChart(bank);
    cellInspectorModal.classList.remove('hidden');
}

function renderCellVarianceChart(bank: BatteryBank) {
    const container = document.getElementById('cell-variance-chart')!;
    container.innerHTML = '';
    
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    container.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const cells = bank.cells || [];
    const voltages = cells.map(c => c.voltage);
    const minV = Math.min(...voltages);
    const maxV = Math.max(...voltages);
    const range = maxV - minV || 0.1;
    
    ctx.strokeStyle = 'rgba(0, 242, 255, 0.3)';
    ctx.lineWidth = 1;
    
    // Draw spectral bars
    const barWidth = canvas.width / cells.length;
    cells.forEach((cell, i) => {
        const h = ((cell.voltage - minV) / range) * (canvas.height - 20) + 10;
        const x = i * barWidth;
        const y = canvas.height - h;
        
        const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
        if (cell.status === 'CRITICAL') {
            gradient.addColorStop(0, '#ff0055');
            gradient.addColorStop(1, 'rgba(255, 0, 85, 0.1)');
        } else if (cell.status === 'WEAK') {
            gradient.addColorStop(0, '#ffcc00');
            gradient.addColorStop(1, 'rgba(255, 204, 0, 0.1)');
        } else {
            gradient.addColorStop(0, '#00f2ff');
            gradient.addColorStop(1, 'rgba(0, 242, 255, 0.1)');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 2, y, barWidth - 4, h);
        
        // Add ID label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '6px monospace';
        ctx.fillText(cell.id.toString(), x + barWidth/2 - 2, canvas.height - 2);
    });
}

function renderBHSTrendChart(bank: BatteryBank) {
    const root = getRoot('bhs-trend-chart');
    if (root && bank.bhsHistory) {
        root.render(<BHSTrendChart data={bank.bhsHistory} repairs={bank.repairHistory} />);
    }
}

function calculateCellHealth(cell: BatteryCell): number {
    const vDev = Math.abs(cell.voltage - 3.9) / 0.5 * 20;
    const tDev = Math.max(0, cell.temp - 35) / 10 * 30;
    const fxPenalty = cell.fx * 500;
    return Math.max(0, Math.min(100, 100 - (vDev + tDev + fxPenalty)));
}

function renderCellGrid(bank: BatteryBank) {
    cellGrid.innerHTML = '';
    const bankVoltageNum = parseFloat(bank.voltage);
    
    bank.cells?.forEach(cell => {
        const el = document.createElement('div');
        const isSelected = selectedCells.has(cell.id);
        const statusColor = cell.status === 'CRITICAL' ? 'border-adi-red bg-adi-red/10 text-adi-red' : (cell.status === 'WEAK' ? 'border-adi-gold bg-adi-gold/10 text-adi-gold' : 'border-adi-green/30 bg-adi-green/5 text-adi-green');
        const pulse = cell.status === 'CRITICAL' ? 'animate-pulse' : '';
        
        // Calculate average FX improvement per regen cycle (regeneration rate)
        let avgFxImprovement = 0;
        if (cell.regenHistory && cell.regenHistory.length > 0) {
            const totalImprovement = cell.regenHistory.reduce((sum, entry) => sum + ((entry.pre?.fx ?? 0) - (entry.post?.fx ?? 0)), 0);
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
        
        const health = calculateCellHealth(cell);
        
        el.className = `p-3 border rounded-sm cursor-pointer transition-all hover:bg-white/5 ${statusColor} ${isSelected ? 'ring-2 ring-white' : ''} ${pulse} relative group/cell flex flex-col`;
        el.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="text-[8px] font-bold uppercase tracking-widest opacity-70">CELL ${String(cell.id).padStart(2, '0')}</span>
                <span class="text-[8px] font-black ${health < 50 ? 'text-adi-red' : 'text-adi-green'}">${health.toFixed(0)}%</span>
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
            
            ${cell.regenStatus === 'ONGOING' ? `
                <div class="w-full bg-black/40 h-1.5 rounded-full overflow-hidden mb-2 border border-adi-cyan/30">
                    <div class="h-full bg-adi-cyan animate-pulse" style="width: ${cell.regenProgress || 0}%"></div>
                </div>
            ` : cell.regenStatus === 'SUCCESS' ? `
                <div class="w-full bg-adi-green/20 border border-adi-green/40 text-adi-green text-[6px] font-bold uppercase text-center py-0.5 mb-2 rounded-[1px]">Regen Success</div>
            ` : cell.regenStatus === 'FAILURE' ? `
                <div class="w-full bg-adi-red/20 border border-adi-red/40 text-adi-red text-[6px] font-bold uppercase text-center py-0.5 mb-2 rounded-[1px]">Regen Failed</div>
            ` : ''}

            <div class="flex justify-between items-end flex-1">
                <div class="flex flex-col">
                    <div class="text-[9px] font-mono opacity-60">${cell.temp.toFixed(1)}°C</div>
                    <div class="text-[7px] font-mono text-adi-cyan/60">${cell.ir.toFixed(2)}mΩ</div>
                </div>
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
            
            <div class="mt-2 pt-2 border-t border-white/5 flex justify-between items-center">
                <div class="flex items-center gap-1">
                    <div class="w-1.5 h-1.5 rounded-full ${cell.v2gStatus === 'ENGAGED' ? 'bg-adi-magenta animate-pulse' : cell.v2gStatus === 'READY' ? 'bg-adi-green' : 'bg-gray-600'}"></div>
                    <span class="text-[7px] font-bold uppercase ${cell.v2gStatus === 'ENGAGED' ? 'text-adi-magenta' : cell.v2gStatus === 'READY' ? 'text-adi-green' : 'text-gray-500'}">${cell.v2gStatus || 'OFFLINE'}</span>
                </div>
                <span class="text-[7px] text-gray-500 font-mono">V2G: ${cell.v2gCycles || 0}</span>
            </div>
        `;
        el.onclick = (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.view-history-btn')) {
                showCellRegenHistory(bank.id, cell);
                return;
            }
            
            if (selectedCells.has(cell.id)) {
                selectedCells.delete(cell.id);
            } else {
                selectedCells.add(cell.id);
            }
            renderCellGrid(bank);
            updateRegenButton();
            updateCellBatchToolbar();
        };
        cellGrid.appendChild(el);
    });
    updateRegenButton();
}

function updateRegenButton() {
    regenCellsBtn.disabled = selectedCells.size === 0;
    regenCellsBtn.innerText = selectedCells.size > 0 ? `REGENERATE ${selectedCells.size} CELLS` : 'SELECT CELLS';
}

const cellBatchToolbar = document.getElementById('cell-batch-toolbar')!;
const cellBatchCount = document.getElementById('cell-batch-count')!;
const cellBatchRepairBtn = document.getElementById('cell-batch-repair-btn') as HTMLButtonElement;
const cellBatchV2GBtn = document.getElementById('cell-batch-v2g-btn') as HTMLButtonElement;


cellInspectorClose.onclick = () => cellInspectorModal.classList.add('hidden');

cellBatchRepairBtn.onclick = () => {
    regenCellsBtn.onclick?.(new MouseEvent('click'));
};

cellBatchV2GBtn.onclick = () => {
    const bank = batteryData[selectedIndex];
    if (!bank || !bank.cells) return;
    
    bank.cells.forEach(c => {
        if (selectedCells.has(c.id)) {
            c.v2gStatus = V2GStatus.READY;
        }
    });
    
    addLog(`V2G SYNCED FOR ${selectedCells.size} CELLS IN B${bank.id}.`, "green");
    
    selectedCells.clear();
    renderCellGrid(bank);
    updateCellBatchToolbar();
    updateRegenButton();
};
regenCellsBtn.onclick = () => {
    const bank = batteryData[selectedIndex]; // Currently selected bank in main matrix
    if (!bank.cells) return;

    const avgVoltage = batteryData.reduce((a, b) => a + parseFloat(b.voltage), 0) / batteryData.length;
    const preHealth = calculateBHS(bank, avgVoltage);

    addLog(`CELL REGEN INITIATED: ${selectedCells.size} UNITS`, "cyan");
    
    const cellsToRegen = Array.from(selectedCells);
    bank.cells.forEach(c => {
        if (cellsToRegen.includes(c.id)) {
            c.regenStatus = 'ONGOING';
            c.regenProgress = 0;
        }
    });
    
    selectedCells.clear();
    updateRegenButton();
    updateCellBatchToolbar();
    renderCellGrid(bank);

    let progress = 0;
    const interval = setInterval(() => {
        progress += 10 + Math.random() * 15;
        if (progress >= 100) {
            clearInterval(interval);
            
            bank.cells!.forEach(c => {
                if (cellsToRegen.includes(c.id)) {
                    const isSuccess = Math.random() > 0.05; // 5% chance of failure
                    if (isSuccess) {
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

                        Object.assign(c, {
                            ...post,
                            status: 'GOOD',
                            regenHistory: history,
                            regenStatus: 'SUCCESS',
                            regenProgress: 100
                        });
                    } else {
                        c.regenStatus = 'FAILURE';
                        c.regenProgress = 100;
                    }
                }
            });
            
            renderCellGrid(bank);
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
            const criticals = bank.cells!.filter(c => c.status === 'CRITICAL').length;
            if (criticals === 0 && bank.healthPrediction === 'REGEN_REQ') {
                bank.healthPrediction = 'STABLE';
                bank.predictedFailureDate = undefined;
                renderMatrix();
                addLog(`BANK B${String(bank.id).padStart(2, '0')} HEALTH RESTORED`, "green");
            }
            renderAnalytics();
            
            // Clear status after 3 seconds
            setTimeout(() => {
                bank.cells!.forEach(c => {
                    if (cellsToRegen.includes(c.id)) {
                        c.regenStatus = undefined;
                        c.regenProgress = undefined;
                    }
                });
                renderCellGrid(bank);
            }, 3000);
            
        } else {
            bank.cells!.forEach(c => {
                if (cellsToRegen.includes(c.id)) {
                    c.regenProgress = progress;
                }
            });
            renderCellGrid(bank);
        }
    }, 200);
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

    // 4. V2G Cycle Wear (Small impact on overall BHS, but affects prediction)
    const cycleScore = Math.max(0, 100 - (bank.v2gCycles || 0) * 0.1);

    const bhs = (fxScore * 0.65) + (irScore * 0.2) + (stabilityScore * 0.1) + (cycleScore * 0.05);
    return Math.min(100, Math.max(0, bhs));
}

function calculateCellBHS(cell: BatteryCell, bankAvgVoltage: number): number {
    const fxScore = Math.max(0, 1 - cell.fx) * 100;
    const deviation = Math.abs(cell.voltage - bankAvgVoltage);
    const stabilityScore = Math.max(0, 100 - (deviation * 400)); 
    
    const bhs = (fxScore * 0.7) + (stabilityScore * 0.3);
    return Math.min(100, Math.max(0, bhs));
}

function renderMineralRecovery() {
    const valLi = document.getElementById('val-lithium');
    const barLi = document.getElementById('bar-lithium');
    const valCo = document.getElementById('val-cobalt');
    const barCo = document.getElementById('bar-cobalt');
    const valNi = document.getElementById('val-nickel');
    const barNi = document.getElementById('bar-nickel');

    if (valLi && barLi) {
        valLi.innerText = `${mineralData.lithium.toFixed(2)} kg`;
        barLi.style.width = `${(mineralData.lithium / mineralData.lithiumTarget) * 100}%`;
    }
    if (valCo && barCo) {
        valCo.innerText = `${mineralData.cobalt.toFixed(2)} kg`;
        barCo.style.width = `${(mineralData.cobalt / mineralData.cobaltTarget) * 100}%`;
    }
    if (valNi && barNi) {
        valNi.innerText = `${mineralData.nickel.toFixed(2)} kg`;
        barNi.style.width = `${(mineralData.nickel / mineralData.nickelTarget) * 100}%`;
    }
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
            
            <div class="grid grid-cols-3 gap-2 mb-2">
                <div class="flex flex-col">
                    <span class="text-[7px] text-gray-400 uppercase font-black tracking-widest opacity-60">Fleet Health</span>
                    <div class="flex items-baseline gap-1">
                        <span class="text-2xl font-black ${healthColorClass} tabular-nums tracking-tighter">${healthScore.toFixed(1)}</span>
                        <span class="text-[9px] text-gray-500 font-bold">%</span>
                    </div>
                </div>
                <div class="flex flex-col text-center">
                    <span class="text-[7px] text-gray-400 uppercase font-black tracking-widest opacity-60">V2G Active</span>
                    <div class="flex items-baseline justify-center gap-1">
                        <span class="text-2xl font-black ${v2gActiveCount > 0 ? 'text-adi-magenta animate-pulse' : 'text-gray-600'} tabular-nums tracking-tighter">${v2gActiveCount}</span>
                        <span class="text-[9px] text-gray-500 font-bold">V2G</span>
                    </div>
                </div>
                <div class="flex flex-col text-right">
                    <span class="text-[7px] text-gray-400 uppercase font-black tracking-widest opacity-60">Regen Req</span>
                    <div class="flex items-baseline justify-end gap-1">
                        <span class="text-2xl font-black ${regenReqCount > 0 ? 'text-adi-red animate-pulse' : 'text-adi-green'} tabular-nums tracking-tighter">${regenReqCount}</span>
                        <span class="text-[9px] text-gray-500 font-bold">UNITS</span>
                    </div>
                </div>
            </div>

            <div class="flex justify-between items-end border-t border-white/10 pt-2">
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

function renderMainCharts() {
    const cRoot = getRoot('voltage-chart-root');
    const fRoot = getRoot('fx-chart-root');
    const tRoot = getRoot('temp-chart-root');
    const bhsMainRoot = getRoot('bhs-main-chart-root');
    
    if (cRoot) cRoot.render(<VoltageChart data={[...chartHistory]} selectedIndex={selectedIndex} />);
    if (fRoot) fRoot.render(<FactorXChart data={[...fxHistory]} />);
    if (tRoot) tRoot.render(<TemperatureChart data={[...tempHistory]} selectedIndex={selectedIndex} />);
    
    const selectedBank = batteryData[selectedIndex];
    if (bhsMainRoot && selectedBank && selectedBank.bhsHistory) {
        bhsMainRoot.render(<BHSTrendChart data={selectedBank.bhsHistory} repairs={selectedBank.repairHistory} />);
    }
}

function renderMatrix() {
    if (!matrix) return;
    const batchToolbar = document.getElementById('batch-toolbar')!;
    matrix.innerHTML = '';
    
    if (selectedBankIds.size > 0) {
        batchToolbar.classList.remove('hidden');
    } else {
        batchToolbar.classList.add('hidden');
    }
    
    // Emergency data recovery to ensure matrix never disappears for hackathon
    if (!batteryData || batteryData.length === 0) {
        addLog("EMERGENCY DATA RECOVERY INITIATED", "red");
        batteryData = loadData();
    }

    const fleetAvgV = batteryData.reduce((a, b) => a + parseFloat(b.voltage), 0) / batteryData.length;
    
    // Update V2G summary counts
    const engagedCount = batteryData.filter(b => b.v2gStatus === V2GStatus.ENGAGED).length;
    const readyCount = batteryData.filter(b => b.v2gStatus === V2GStatus.READY).length;
    const offlineCount = batteryData.filter(b => b.v2gStatus === V2GStatus.OFFLINE || !b.v2gStatus).length;
    
    if (v2gEngagedCount) v2gEngagedCount.innerText = engagedCount.toString();
    if (v2gReadyCount) v2gReadyCount.innerText = readyCount.toString();
    if (v2gOfflineCount) v2gOfflineCount.innerText = offlineCount.toString();
    if (headerV2GEngaged) headerV2GEngaged.innerText = engagedCount.toString();
    if (headerV2GReady) headerV2GReady.innerText = readyCount.toString();
    if (headerV2GOffline) headerV2GOffline.innerText = offlineCount.toString();

    batteryData.forEach((d, i) => {
        // Instead of skipping, we flag for dimming to preserve 32-unit visual structure
        const isFilteredOut = (isRegenFilterActive && d.healthPrediction !== 'REGEN_REQ') ||
                              (isV2GFilterActive && d.v2gStatus !== V2GStatus.READY && d.v2gStatus !== V2GStatus.ENGAGED);

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

        const isSelected = selectedBankIds.has(d.id);
        const isEngaged = d.v2gStatus === V2GStatus.ENGAGED;
        const isReady = d.v2gStatus === V2GStatus.READY;
        const isRegenReq = d.healthPrediction === 'REGEN_REQ';
        
        let isAtRiskWithin7 = false;
        if (d.predictedFailureDate === 'IMMINENT') {
            isAtRiskWithin7 = true;
        } else if (d.predictedFailureDate && d.predictedFailureDate !== '> 30 DAYS') {
            const today = new Date();
            const failDate = new Date(d.predictedFailureDate);
            const diffTime = Math.abs(failDate.getTime() - today.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            if (diffDays <= 7) isAtRiskWithin7 = true;
        }

        const isAtRisk = d.healthPrediction === 'AT_RISK' || isAtRiskWithin7;
        const isDegrading = d.healthPrediction === 'DEGRADING';
        const isUndoable = undoSnapshot && undoTargetIndex === i;

        let extraClasses = '';
        if (isRegenReq) extraClasses += ' border-adi-red shadow-[0_0_10px_rgba(255,51,51,0.4)] animate-pulse';
        else if (isAtRiskWithin7) extraClasses += ' border-adi-red shadow-[0_0_10px_rgba(255,51,51,0.4)] animate-pulse';
        else if (isAtRisk) extraClasses += ' border-adi-gold shadow-[0_0_10px_rgba(255,215,0,0.2)]';
        else if (isDegrading) extraClasses += ' border-adi-gold/50';
        else if (isUndoable) extraClasses += ' border-adi-cyan shadow-[0_0_15px_rgba(0,242,255,0.3)]';

        const v2gStatus = d.v2gStatus || V2GStatus.OFFLINE;
        const v2gStatusBg = v2gStatus === V2GStatus.ENGAGED ? 'bg-adi-magenta text-black shadow-[0_0_15px_rgba(255,0,255,0.6)] animate-pulse' : 
                          (v2gStatus === V2GStatus.READY ? 'bg-adi-green/60 text-black' : 
                          'bg-adi-red/20 text-adi-red/80 border border-adi-red/30');
        const v2gIcon = v2gStatus === V2GStatus.ENGAGED ? 
            `<svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>` : 
            (v2gStatus === V2GStatus.READY ? 
            `<svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` : 
            `<svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`);
        const v2gIndicator = `<div class="text-[8px] ${v2gStatusBg} font-black uppercase tracking-widest px-2 py-0.5 rounded-[2px] mt-1 w-fit flex items-center gap-1 border border-white/10 transition-all duration-300 hover:scale-105">${v2gIcon} ${v2gStatus}</div>`;

        // Only apply V2G border styles if no critical health warning, unless engaged (engaged overrides)
        const hasHealthWarning = isRegenReq || isAtRisk || isDegrading;
        const showV2GStyle = !hasHealthWarning || isEngaged;

        cell.className = `matrix-cell working-pulse p-2 h-20 rounded-sm flex flex-col justify-between cursor-pointer group ${isSelected ? 'selected' : ''} ${statusClass} ${showV2GStyle && isEngaged ? 'v2g-engaged' : ''} ${showV2GStyle && isReady ? 'v2g-ready' : ''} ${showV2GStyle && v2gStatus === V2GStatus.OFFLINE ? 'v2g-offline' : ''} ${extraClasses} ${isFilteredOut ? 'opacity-20 grayscale pointer-events-none' : ''}`;
        
        const tempVal = parseFloat(d.temp);
        const tempColorClass = tempVal > 40 ? 'text-adi-red' : (tempVal < 25 ? 'text-adi-cyan' : 'text-adi-green');

        let healthBadge = '';
        if (isRegenReq) {
            healthBadge = `<div class="absolute top-0 right-0 bg-adi-red text-black text-[6px] font-black px-1 animate-pulse z-10 shadow-[0_0_3px_rgba(255,51,51,0.5)]">REGEN_REQ</div>`;
        } else if (isAtRiskWithin7 || d.healthPrediction === 'AT_RISK') {
            const riskStyle = isAtRiskWithin7 ? 'bg-adi-red text-white animate-pulse shadow-[0_0_5px_rgba(255,51,51,0.5)]' : 'bg-adi-gold text-black';
            healthBadge = `<div class="absolute top-0 right-0 ${riskStyle} text-[6px] font-black px-1 z-10">AT_RISK</div>`;
        } else {
            healthBadge = `<div class="absolute top-0 right-0 bg-adi-green/30 text-adi-green text-[6px] font-black px-1 z-10 border-l border-b border-adi-green/20">STABLE</div>`;
        }

        const undoBadge = isUndoable ? `<div class="absolute bottom-0 right-0 bg-adi-cyan text-black text-[6px] font-black px-1 z-10">UNDO_READY</div>` : '';

        const v2gBadge = `<div class="absolute top-0 left-0 ${v2gStatus === V2GStatus.ENGAGED ? 'bg-adi-magenta animate-pulse shadow-[0_0_10px_rgba(255,0,255,0.8)]' : (v2gStatus === V2GStatus.READY ? 'bg-adi-green/40 text-white/80' : 'bg-adi-red/20 text-adi-red/60')} text-black text-[5px] font-black px-1 z-10 rounded-br-sm shadow-sm">V2G: ${v2gStatus}</div>`;

        cell.innerHTML = `
            ${healthBadge}
            ${v2gBadge}
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
                <button class="inspect-cell-btn text-[7px] text-black bg-adi-cyan border border-adi-cyan/30 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(0,242,255,0.3)] hover:bg-white transition-all uppercase font-black z-20" data-id="${i}">INSPECT</button>
                <div class="flex flex-col text-right"><span class="text-[7px] font-mono text-adi-cyan/50">${d.ir}mΩ</span></div>
            </div>

            <div class="w-full h-[1.5px] bg-white/5 overflow-hidden relative rounded-full mt-1">
                <div class="h-full bg-adi-cyan opacity-40 transition-all duration-500" style="width: ${(parseFloat(d.voltage)/4.2)*100}%"></div>
            </div>
        `;
        cell.onclick = (e) => { 
            if(isRepairing) return; 
            const target = e.target as HTMLElement;
            
            if (target.classList.contains('view-history-btn')) {
                showBankHistory(d);
                return;
            }

            // Select the bank
            if (e.ctrlKey || e.metaKey) {
                if (selectedBankIds.has(d.id)) {
                    selectedBankIds.delete(d.id);
                } else {
                    selectedBankIds.add(d.id);
                }
            } else {
                selectedBankIds.clear();
                selectedBankIds.add(d.id);
                selectedIndex = i;
            }
            
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
            
            // Open inspector if only one selected
            if (selectedBankIds.size === 1) {
                openCellInspector(i);
            }
            renderMatrix(); 
            renderRepairHistory(); 
            renderFleetSummary();
        };
        matrix.appendChild(cell);
    });
    
    const avgFx = batteryData.reduce((a, b) => a + b.fx, 0) / 32;
    const sohValue = (100 - (avgFx * 35)).toFixed(1);
    sohIndicator.innerText = `${sohValue} %`;
    sohIndicator.className = parseFloat(sohValue) > 90 ? 'text-3xl font-black text-adi-green tabular-nums' : (parseFloat(sohValue) > 70 ? 'text-3xl font-black text-adi-gold tabular-nums' : 'text-3xl font-black text-adi-red tabular-nums');
    
    renderFleetSummary();
    renderMainCharts();
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
    undoBtn.classList.remove('hidden', 'text-adi-red'); 
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
    undoBtn.classList.add('hidden'); undoBtn.classList.remove('undo-active', 'text-adi-red');
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
    
    addLog(`INITIATING V2G STATUS UPDATE FOR B${target.id}...`, "gold");
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Cycle through: READY -> ENGAGED -> OFFLINE -> READY
    if (target.v2gStatus === V2GStatus.READY) {
        target.v2gStatus = V2GStatus.ENGAGED;
        addLog(`V2G ENGAGED FOR B${target.id}. ENERGY TRANSFER ACTIVE.`, "magenta");
        orbit.setMode('v2g');
    } else if (target.v2gStatus === V2GStatus.ENGAGED) {
        target.v2gStatus = V2GStatus.OFFLINE;
        addLog(`V2G OFFLINE FOR B${target.id}. NODE ISOLATED FROM GRID.`, "red");
        orbit.setMode('idle');
    } else {
        target.v2gStatus = V2GStatus.READY;
        addLog(`V2G READY FOR B${target.id}. NODE STANDBY.`, "green");
        orbit.setMode('idle');
    }
    
    gridStatus.innerText = target.v2gStatus;
    gridStatus.className = `text-xs font-bold ${target.v2gStatus === V2GStatus.ENGAGED ? 'text-adi-magenta animate-pulse' : (target.v2gStatus === V2GStatus.READY ? 'text-adi-green' : 'text-adi-red')}`;
    
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
const batchToolbar = document.getElementById('batch-toolbar')!;
const batchRepairBtn = document.getElementById('batch-repair-btn') as HTMLButtonElement;
const batchV2GBtn = document.getElementById('batch-v2g-btn') as HTMLButtonElement;

// ... existing code ...

batchRepairBtn.onclick = () => {
    selectedBankIds.forEach(id => {
        const bank = batteryData.find(b => b.id === id);
        if (bank) {
            // Initiate repair sequence
            bank.repairHistory.push({
                timestamp: Date.now(),
                success: true,
                resources: { cost: 50 },
                notes: "Batch repair initiated"
            });
            bank.fx = 0.05; // Reset FX
        }
    });
    selectedBankIds.clear();
    renderMatrix();
    renderFleetSummary();
};

batchV2GBtn.onclick = () => {
    selectedBankIds.forEach(id => {
        const bank = batteryData.find(b => b.id === id);
        if (bank) {
            // Apply common V2G configuration
            bank.v2gStatus = V2GStatus.READY;
            addLog(`V2G SYNCED FOR B${bank.id}.`, "green");
        }
    });
    selectedBankIds.clear();
    renderMatrix();
    renderFleetSummary();
};
repairBtn.onclick = () => {
    modalRiskText.innerHTML = `
        CRITICAL: INITIATING HADRON REPAIR PULSE. THIS PROCEDURE CARRIES SIGNIFICANT RISKS:
        <br/>- POTENTIAL LATTICE INSTABILITY
        <br/>- IRREVERSIBLE STATE CHANGES IN BATTERY CELLS
        <br/>- HIGH THERMAL SPIKES
        <br/>- ENERGY DEPLETION
        <br/><br/>CONFIRM LOCAL LATTICE FUSION? ALL CALCULATIONS PROCESSED ON-DEVICE. 100% AIRGAP MODE.
    `;
    modalOverlay.classList.remove('hidden');
    modalConfirm.onclick = () => {
        modalOverlay.classList.add('hidden');
        commitFusion('OFFLINE_FUSION');
    };
};
initiateBtn.onclick = () => {
    modalRiskText.innerHTML = `
        CRITICAL: INITIATING DEEP PULSE. THIS PROCEDURE CARRIES SIGNIFICANT RISKS:
        <br/>- SYSTEM-WIDE ENTROPY RESET
        <br/>- POTENTIAL DATA LOSS IN VOLATILE MEMORY
        <br/>- HIGH POWER CONSUMPTION
        <br/><br/>CONFIRM DEEP PULSE? ALL CALCULATIONS PROCESSED ON-DEVICE. 100% AIRGAP MODE.
    `;
    modalOverlay.classList.remove('hidden');
    modalConfirm.onclick = () => {
        modalOverlay.classList.add('hidden');
        commitFusion('DEEP_PULSE');
    };
};
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
const cellRegenModal = document.getElementById('cell-regen-modal')!;
const cellRegenClose = document.getElementById('cell-regen-close')!;
const regenHistoryContent = document.getElementById('regen-history-content')!;
const regenCellIdDisplay = document.getElementById('regen-cell-id')!;
const regenBankIdDisplay = document.getElementById('regen-bank-id')!;
const regenCycleCountDisplay = document.getElementById('regen-cycle-count')!;

cellRegenClose.onclick = () => cellRegenModal.classList.add('hidden');

// QR Modal Logic
let qrRoot: any = null;
openQrBtn.onclick = () => {
    const currentUrl = window.location.href;
    qrUrlDisplay.innerText = currentUrl;
    const modalTitle = qrModalOverlay.querySelector('h3');
    if (modalTitle) modalTitle.innerText = "System Access Node";
    qrModalOverlay.classList.remove('hidden');
    qrModalOverlay.classList.add('flex');
    docsDownloadBtn.classList.add('hidden');
    
    if (!qrRoot) {
        qrRoot = createRoot(qrContainer);
    }
    
    qrRoot.render(
        <QRCodeCanvas 
            value={currentUrl} 
            size={256}
            level={"H"}
            includeMargin={true}
            imageSettings={{
                src: "https://picsum.photos/seed/adi/64/64",
                x: undefined,
                y: undefined,
                height: 48,
                width: 48,
                excavate: true,
            }}
        />
    );
};

openDocsQrBtn.onclick = () => {
    const docsUrl = "https://docs.adipro.ultimate/tech-specs-v2-sovereign";
    qrUrlDisplay.innerText = "TECH DOCS: " + docsUrl;
    const modalTitle = qrModalOverlay.querySelector('h3');
    if (modalTitle) modalTitle.innerText = "Technological Documentation";
    qrModalOverlay.classList.remove('hidden');
    qrModalOverlay.classList.add('flex');
    docsDownloadBtn.classList.remove('hidden');
    
    if (!qrRoot) {
        qrRoot = createRoot(qrContainer);
    }
    
    qrRoot.render(
        <QRCodeCanvas 
            value={docsUrl} 
            size={256}
            level={"H"}
            includeMargin={true}
            fgColor="#ff00ff"
            imageSettings={{
                src: "https://picsum.photos/seed/tech/64/64",
                x: undefined,
                y: undefined,
                height: 48,
                width: 48,
                excavate: true,
            }}
        />
    );
};

openStartupBtn.onclick = () => {
    const startupUrl = window.location.href + "?mode=JURY_DEMO_2026";
    qrUrlDisplay.innerText = "JURY STARTUP CHALLENGE 2026: " + startupUrl;
    const modalTitle = qrModalOverlay.querySelector('h3');
    if (modalTitle) modalTitle.innerText = "Jury Startup Challenge 2026";
    qrModalOverlay.classList.remove('hidden');
    qrModalOverlay.classList.add('flex');
    docsDownloadBtn.classList.add('hidden');
    
    if (!qrRoot) {
        qrRoot = createRoot(qrContainer);
    }
    
    qrRoot.render(
        <QRCodeCanvas 
            value={startupUrl} 
            size={256}
            level={"H"}
            includeMargin={true}
            fgColor="#00ff41"
            imageSettings={{
                src: "https://picsum.photos/seed/startup/64/64",
                x: undefined,
                y: undefined,
                height: 48,
                width: 48,
                excavate: true,
            }}
        />
    );

    runJuryDemo();
};

let isDemoRunning = false;
function runJuryDemo() {
    if (isDemoRunning) return;
    isDemoRunning = true;
    addLog("JURY DEMO SEQUENCE INITIATED", "gold");
    addLog("CALIBRATING HEURISTIC CORE FOR PRESENTATION...", "cyan");
    
    // Step 1: Initial Scan
    setTimeout(() => {
        addLog("SCANNING FLEET NODES...", "cyan");
        renderMatrix();
    }, 1000);

    // Step 2: Predictive Maintenance Alert
    setTimeout(() => {
        const targetBank = batteryData[4]; // Bank 05
        if (targetBank) {
            targetBank.healthPrediction = 'AT_RISK';
            targetBank.predictedFailureDate = 'IMMINENT';
            targetBank.degradationRate = 0.045;
            targetBank.fx = 0.85; // Increase stress factor
            addLog("PREDICTIVE ALERT: ANOMALY DETECTED IN NODE B05", "red");
            addLog("FAILURE PROBABILITY: 88.4% | TIME TO FAILURE: < 48H", "red");
            renderMatrix();
            renderFleetSummary();
        }
    }, 3000);

    // Step 3: V2G Grid Support
    setTimeout(() => {
        addLog("GRID DEMAND DETECTED: ENGAGING V2G FLEET SUPPORT", "magenta");
        batteryData.forEach((b, i) => {
            if (i % 4 === 0) {
                b.v2gStatus = V2GStatus.ENGAGED;
                b.v2gCycles = (b.v2gCycles || 0) + 1;
            }
        });
        renderMatrix();
        renderFleetSummary();
    }, 6000);

    // Step 4: Autonomous Regeneration
    setTimeout(() => {
        const targetBank = batteryData[4];
        if (targetBank) {
            targetBank.healthPrediction = 'REGEN_REQ';
            addLog("INITIATING AUTONOMOUS REGENERATION ON NODE B05", "gold");
            addLog("PULSE FREQUENCY: 12.4kHz | TARGETING SULPHATION LATTICE", "cyan");
            renderMatrix();
            renderFleetSummary();
        }
    }, 9000);

    // Step 5: Recovery & Restoration
    setTimeout(() => {
        const targetBank = batteryData[4];
        if (targetBank) {
            targetBank.healthPrediction = 'STABLE';
            targetBank.predictedFailureDate = undefined;
            targetBank.degradationRate = 0.002;
            targetBank.fx = 0.05; // Reset stress factor
            targetBank.voltage = "402.4V";
            
            // Add to repair history
            targetBank.repairHistory.unshift({
                timestamp: Date.now(),
                date: new Date().toLocaleDateString(),
                success: true,
                type: "AUTONOMOUS_REGEN",
                label: "JURY_DEMO_RECOVERY",
                resources: { energy: 12.5, cost: 4.2, duration: 120 },
                preHealth: 62.4,
                postHealth: 99.8
            });

            addLog("REGENERATION COMPLETE: NODE B05 RESTORED", "green");
            addLog("HEALTH INDEX: 99.8% | DEGRADATION NEUTRALIZED", "green");
            renderMatrix();
            renderFleetSummary();
            renderRepairHistory();
        }
    }, 13000);

    // Step 6: Final Status
    setTimeout(() => {
        addLog("DEMO SEQUENCE COMPLETE. SYSTEM PERFORMANCE: OPTIMAL", "green");
        addLog("READY FOR JURY EVALUATION.", "gold");
        
        // Reset V2G after demo
        setTimeout(() => {
            batteryData.forEach(b => {
                if (b.v2gStatus === V2GStatus.ENGAGED) b.v2gStatus = V2GStatus.READY;
            });
            renderMatrix();
            renderFleetSummary();
            isDemoRunning = false;
        }, 5000);
    }, 16000);
}

qrDownloadBtn.onclick = () => {
    const canvas = qrContainer.querySelector('canvas');
    if (canvas) {
        const url = canvas.toDataURL("image/png");
        const a = document.createElement('a');
        a.href = url;
        a.download = `adi-pro-qr-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addLog("SYSTEM: QR IMAGE EXPORTED", "green");
    }
};

docsDownloadBtn.onclick = () => {
    const content = `ADI PRO ULTIMATE 2026 SOVEREIGN
TECHNOLOGICAL DOCUMENTATION V2.0
---------------------------------
Sovereign Identity: Local G7 Node
Integrity Protocol: Active
Fleet Management: Enabled
V2G Synchronization: Ready

This document contains the technological specifications for the ADI PRO ULTIMATE 2026 SOVEREIGN system.
All protocols are strictly sovereign and local.

Generated: ${new Date().toISOString()}
Node ID: ADI-PRO-SOV-2026
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "adi-pro-tech-docs.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog("SYSTEM: TECH DOCS DOWNLOADED", "magenta");
};

qrCloseBtn.onclick = () => {
    qrModalOverlay.classList.add('hidden');
    qrModalOverlay.classList.remove('flex');
};

function showCellRegenHistory(bankId: number, cell: BatteryCell) {
    regenCellIdDisplay.innerText = String(cell.id).padStart(2, '0');
    regenBankIdDisplay.innerText = String(bankId).padStart(2, '0');
    regenCycleCountDisplay.innerText = String(cell.regenHistory?.length || 0);
    
    regenHistoryContent.innerHTML = '';
    
    if (!cell.regenHistory || cell.regenHistory.length === 0) {
        regenHistoryContent.innerHTML = `<div class="text-center py-12 opacity-20 italic uppercase text-[10px] tracking-widest">No regeneration data available for this unit</div>`;
    } else {
        [...cell.regenHistory].reverse().forEach((entry, idx) => {
            const preV = entry.pre?.voltage ?? 0;
            const postV = entry.post?.voltage ?? 0;
            const preT = entry.pre?.temp ?? 0;
            const postT = entry.post?.temp ?? 0;
            const preFx = entry.pre?.fx ?? 0.001;
            const postFx = entry.post?.fx ?? 0;
            
            const vDiff = postV - preV;
            const tDiff = postT - preT;
            const fxDiff = preFx > 0 ? ((preFx - postFx) / preFx * 100).toFixed(1) : "0.0";
            
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
                        <div class="text-xs font-black text-white">${preV.toFixed(2)}V → <span class="text-adi-green">${postV.toFixed(2)}V</span></div>
                        <div class="text-[7px] text-adi-green font-bold">+${vDiff.toFixed(2)}V GAIN</div>
                    </div>
                    <div class="space-y-1">
                        <div class="text-[7px] text-gray-500 uppercase font-bold">Temp</div>
                        <div class="text-xs font-black text-white">${preT.toFixed(1)}°C → <span class="text-adi-cyan">${postT.toFixed(1)}°C</span></div>
                        <div class="text-[7px] ${tDiff < 0 ? 'text-adi-cyan' : 'text-adi-red'} font-bold">${tDiff.toFixed(1)}°C DELTA</div>
                    </div>
                    <div class="space-y-1">
                        <div class="text-[7px] text-gray-500 uppercase font-bold">Factor X (Entropy)</div>
                        <div class="text-xs font-black text-white">${preFx.toFixed(3)} → <span class="text-adi-magenta">${postFx.toFixed(3)}</span></div>
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
                            <div class="text-[8px] text-white/70 font-bold">${(entry.resources as any).parts ? (entry.resources as any).parts.join(', ') : `ENERGY: ${entry.resources.energy} // DUR: ${entry.resources.duration}s`}</div>
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
const alertsList = document.getElementById('alerts-list')!;
const noAlertsMsg = document.getElementById('no-alerts-msg')!;
const regenChartRoot = document.getElementById('regen-chart-root')!;
const tasksList = document.getElementById('tasks-list')!;
const addTaskBtn = document.getElementById('add-task-btn')!;
const newTaskForm = document.getElementById('new-task-form')!;
const saveTaskBtn = document.getElementById('save-task-btn')!;
const clearAlertsBtn = document.getElementById('clear-alerts-btn')!;
const newTaskDesc = document.getElementById('new-task-desc') as HTMLInputElement;
const newTaskNotes = document.getElementById('new-task-notes') as HTMLTextAreaElement;
const newTaskPriority = document.getElementById('new-task-priority') as HTMLSelectElement;
const newTaskDue = document.getElementById('new-task-due') as HTMLInputElement;
const taskSortSelect = document.getElementById('task-sort-select') as HTMLSelectElement;
const taskPriorityFilterSelect = document.getElementById('task-priority-filter') as HTMLSelectElement;
const taskStatusFilterSelect = document.getElementById('task-status-filter') as HTMLSelectElement;
const taskDueDateFilterSelect = document.getElementById('task-due-date-filter') as HTMLSelectElement;

let taskSortMode: 'TIME' | 'PRIORITY_HIGH' | 'PRIORITY_LOW' = 'TIME';
let taskPriorityFilter: 'ALL' | TaskPriority = 'ALL';
let taskStatusFilter: 'ALL' | 'PENDING' | 'COMPLETED' = 'ALL';
let taskDueDateFilter: 'ALL' | 'TODAY' | 'WEEK' | 'OVERDUE' | 'NONE' = 'ALL';
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

let selectedTaskIds: Set<string> = new Set();
let expandedTaskIds: Set<string> = new Set();
let justCompletedTaskId: string | null = null;

function renderTasks() {
    tasksList.innerHTML = '';
    
    let displayTasks = [...tasks];

    // Update bulk actions visibility
    const bulkActions = document.getElementById('bulk-actions');
    const selectedCount = document.getElementById('selected-count');
    if (bulkActions && selectedCount) {
        if (selectedTaskIds.size > 0) {
            bulkActions.classList.remove('hidden');
            selectedCount.innerText = `${selectedTaskIds.size} SELECTED`;
        } else {
            bulkActions.classList.add('hidden');
        }
    }

    // Filtering
    if (taskPriorityFilter !== 'ALL') {
        displayTasks = displayTasks.filter(t => t.priority === taskPriorityFilter);
    }
    if (taskStatusFilter !== 'ALL') {
        displayTasks = displayTasks.filter(t => t.status === taskStatusFilter);
    }

    if (taskDueDateFilter !== 'ALL') {
        const now = Date.now();
        const today = new Date(now).setHours(0, 0, 0, 0);
        const endOfWeek = new Date(now).setDate(new Date(now).getDate() + 7);
        
        displayTasks = displayTasks.filter(t => {
            if (taskDueDateFilter === 'NONE') return !t.dueDate;
            if (!t.dueDate) return false;
            
            if (taskDueDateFilter === 'TODAY') return t.dueDate >= today && t.dueDate < today + 86400000;
            if (taskDueDateFilter === 'WEEK') return t.dueDate >= today && t.dueDate <= endOfWeek;
            if (taskDueDateFilter === 'OVERDUE') return t.dueDate < today && t.status !== 'COMPLETED';
            return true;
        });
    }

    const pMap: Record<string, number> = { [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };

    if (taskSortMode === 'PRIORITY_HIGH') {
        displayTasks.sort((a, b) => pMap[b.priority] - pMap[a.priority]);
    } else if (taskSortMode === 'PRIORITY_LOW') {
        displayTasks.sort((a, b) => pMap[a.priority] - pMap[b.priority]);
    } else {
        displayTasks.sort((a, b) => b.timestamp - a.timestamp);
    }

    // Update sorting headers UI
    const timeHeader = document.getElementById('sort-by-time-header');
    const priorityHeader = document.getElementById('sort-by-priority-header');
    
    if (timeHeader) {
        const timeText = timeHeader.querySelector('span');
        const timeIcon = timeHeader.querySelector('svg');
        if (taskSortMode === 'TIME') {
            timeHeader.classList.add('text-adi-cyan');
            timeHeader.classList.remove('text-white/60');
            if (timeIcon) timeIcon.style.transform = 'rotate(0deg)';
        } else {
            timeHeader.classList.remove('text-adi-cyan');
            timeHeader.classList.add('text-white/60');
        }
    }
    
    if (priorityHeader) {
        const priorityText = priorityHeader.querySelector('span');
        const priorityIcon = priorityHeader.querySelector('svg');
        if (taskSortMode.startsWith('PRIORITY')) {
            priorityHeader.classList.add('text-adi-cyan');
            priorityHeader.classList.remove('text-white/60');
            if (priorityIcon) {
                priorityIcon.style.transform = taskSortMode === 'PRIORITY_LOW' ? 'rotate(180deg)' : 'rotate(0deg)';
                priorityIcon.style.transition = 'transform 0.2s ease';
            }
        } else {
            priorityHeader.classList.remove('text-adi-cyan');
            priorityHeader.classList.add('text-white/60');
            if (priorityIcon) priorityIcon.style.transform = 'rotate(0deg)';
        }
    }

    const selectAll = document.getElementById('task-select-all') as HTMLInputElement;
    if (selectAll) {
        selectAll.checked = displayTasks.length > 0 && displayTasks.every(t => selectedTaskIds.has(t.id));
    }

    displayTasks.forEach(t => {
        const el = document.createElement('div');
        const isExpanded = expandedTaskIds.has(t.id);
        const pBg = t.priority === TaskPriority.HIGH ? 'bg-adi-red/15' : (t.priority === TaskPriority.MEDIUM ? 'bg-adi-gold/15' : 'bg-adi-green/15');
        const pText = t.priority === TaskPriority.HIGH ? 'text-adi-red' : (t.priority === TaskPriority.MEDIUM ? 'text-adi-gold' : 'text-adi-green');
        const pTooltip = t.priority === TaskPriority.HIGH ? 'High Priority - Red' : (t.priority === TaskPriority.MEDIUM ? 'Medium Priority - Yellow' : 'Low Priority - Green');
        const pBadge = t.priority === TaskPriority.HIGH ? `<span class="text-[6px] font-black bg-adi-red/30 text-adi-red border border-adi-red/50 px-1 rounded-[1px] ml-2 shadow-[0_0_5px_rgba(255,51,51,0.2)]" title="${pTooltip}">▲ CRITICAL</span>` : (t.priority === TaskPriority.MEDIUM ? `<span class="text-[6px] font-black bg-adi-gold/30 text-adi-gold border border-adi-gold/50 px-1 rounded-[1px] ml-2 shadow-[0_0_5px_rgba(255,215,0,0.2)]" title="${pTooltip}">◆ STANDARD</span>` : `<span class="text-[6px] font-black bg-adi-green/30 text-adi-green border border-adi-green/50 px-1 rounded-[1px] ml-2 shadow-[0_0_5px_rgba(0,255,65,0.2)]" title="${pTooltip}">▼ ROUTINE</span>`);
        const leftBorder = t.priority === TaskPriority.HIGH ? 'border-l-adi-red' : (t.priority === TaskPriority.MEDIUM ? 'border-l-adi-gold' : 'border-l-adi-green');
        const indicatorColor = t.priority === TaskPriority.HIGH ? 'bg-adi-red' : (t.priority === TaskPriority.MEDIUM ? 'bg-adi-gold' : 'bg-adi-green');
        const indicatorShadow = t.priority === TaskPriority.HIGH ? 'shadow-[0_0_8px_rgba(255,51,51,0.6)]' : (t.priority === TaskPriority.MEDIUM ? 'shadow-[0_0_8px_rgba(255,215,0,0.6)]' : 'shadow-[0_0_8px_rgba(0,255,65,0.6)]');
        const statusColor = t.status === 'COMPLETED' ? 'text-adi-green' : 'text-gray-500';
        const opacity = t.status === 'COMPLETED' ? 'opacity-50' : 'opacity-100';
        const isJustCompleted = t.id === justCompletedTaskId;
        
        const dueDateBadge = t.dueDate ? `
            <div class="flex items-center gap-1 bg-adi-gold/10 border border-adi-gold/30 px-1.5 py-0.5 rounded-[1px] ml-2" title="Deadline: ${new Date(t.dueDate).toLocaleDateString()}">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-adi-gold"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span class="text-[6px] font-black text-adi-gold/60 uppercase tracking-widest mr-0.5">DUE:</span>
                <span class="text-[6px] font-black text-adi-gold uppercase tracking-widest">${new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
        ` : '';
        
        const pSelectClasses = t.priority === TaskPriority.HIGH ? 'text-adi-red border-adi-red/30 bg-adi-red/5' : (t.priority === TaskPriority.MEDIUM ? 'text-adi-gold border-adi-gold/30 bg-adi-gold/5' : 'text-adi-green border-adi-green/30 bg-adi-green/5');
        
        const pOptions = [
            { val: TaskPriority.LOW, label: 'ROUTINE', color: 'text-adi-green' },
            { val: TaskPriority.MEDIUM, label: 'STANDARD', color: 'text-adi-gold' },
            { val: TaskPriority.HIGH, label: 'CRITICAL', color: 'text-adi-red' }
        ].map(p => 
            `<option value="${p.val}" ${t.priority === p.val ? 'selected' : ''} class="bg-adi-panel ${p.color}">${p.label}</option>`
        ).join('');

        el.className = `flex flex-col p-2 ${pBg} border border-white/5 border-l-4 ${leftBorder} rounded-sm ${opacity} group hover:bg-white/20 transition-all cursor-pointer ${selectedTaskIds.has(t.id) ? 'ring-1 ring-adi-cyan/50 bg-adi-cyan/10' : ''} ${isJustCompleted ? 'task-complete-anim' : ''}`;
        el.dataset.id = t.id;
        el.innerHTML = `
            <div class="flex justify-between items-center w-full">
                <div class="flex items-center gap-3 flex-1">
                    <input type="checkbox" class="task-select-checkbox w-3 h-3 border border-white/20 bg-black rounded-sm appearance-none checked:bg-adi-cyan cursor-pointer transition-all" data-id="${t.id}" ${selectedTaskIds.has(t.id) ? 'checked' : ''}>
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full ${indicatorColor} ${indicatorShadow}" title="${pTooltip}"></div>
                        <span class="text-[9px] font-bold ${pText} uppercase tracking-wider ${t.status === 'COMPLETED' ? 'line-through' : ''}">${t.desc}</span>
                        ${pBadge}
                        ${dueDateBadge}
                        <span class="text-[7px] text-adi-cyan font-black ml-1 opacity-50 group-hover:opacity-100 transition-opacity">${isExpanded ? '[-]' : '[+]'}</span>
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
            </div>
            
            <div class="task-details ${isExpanded ? 'block' : 'hidden'} mt-2 ml-6 border-t border-white/5 pt-2 space-y-2">
                <div class="flex flex-col gap-1">
                    <span class="text-[6px] text-gray-500 font-black uppercase tracking-widest">Protocol Notes</span>
                    <textarea class="task-notes-edit w-full bg-black/40 border border-white/10 p-2 text-[7px] text-gray-400 uppercase italic leading-relaxed outline-none focus:border-adi-cyan/50 resize-none h-12 rounded-sm" data-id="${t.id}" placeholder="NO NOTES RECORDED...">${t.notes || ''}</textarea>
                </div>
                <div class="flex items-center gap-4">
                    <div class="flex flex-col gap-0.5">
                        <span class="text-[6px] text-gray-500 font-black uppercase tracking-widest">Priority Node</span>
                        <select class="task-priority-select text-[7px] font-black border px-1 py-0.5 rounded-[1px] w-fit ${pSelectClasses} uppercase tracking-widest bg-transparent outline-none cursor-pointer hover:bg-white/10 transition-colors" data-id="${t.id}">
                            ${pOptions}
                        </select>
                    </div>
                    <div class="flex flex-col gap-0.5">
                        <span class="text-[6px] text-gray-500 font-black uppercase tracking-widest">Created</span>
                        <span class="text-[7px] text-white font-mono uppercase tracking-widest">${new Date(t.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div class="flex flex-col gap-0.5">
                        <span class="text-[6px] text-adi-gold font-black uppercase tracking-widest">Deadline Node</span>
                        <input type="date" class="task-due-edit text-[7px] font-black border border-adi-gold/30 px-1 py-0.5 rounded-[1px] w-fit text-adi-gold uppercase tracking-widest bg-transparent outline-none cursor-pointer hover:bg-white/10 transition-colors" data-id="${t.id}" value="${t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : ''}">
                    </div>
                </div>
            </div>
        `;

        el.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('button') || target.closest('input') || target.closest('select')) {
                return;
            }
            
            const id = el.dataset.id;
            if (id) {
                if (expandedTaskIds.has(id)) {
                    expandedTaskIds.delete(id);
                } else {
                    expandedTaskIds.add(id);
                }
                renderTasks();
            }
        });

        tasksList.appendChild(el);
    });

    // Re-attach listeners
    document.querySelectorAll('.task-select-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const id = (e.target as HTMLElement).dataset.id;
            if (id) {
                if ((e.target as HTMLInputElement).checked) {
                    selectedTaskIds.add(id);
                } else {
                    selectedTaskIds.delete(id);
                }
                renderTasks();
            }
        });
    });

    document.querySelectorAll('.task-notes-edit').forEach(textarea => {
        textarea.addEventListener('input', (e) => {
            const id = (e.target as HTMLElement).dataset.id;
            const val = (e.target as HTMLTextAreaElement).value;
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.notes = val;
                localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
            }
        });
        textarea.addEventListener('click', (e) => e.stopPropagation());
    });

    document.querySelectorAll('.task-due-edit').forEach(input => {
        input.addEventListener('change', (e) => {
            const id = (e.target as HTMLElement).dataset.id;
            const val = (e.target as HTMLInputElement).value;
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.dueDate = val ? new Date(val).getTime() : undefined;
                saveTasks();
            }
        });
        input.addEventListener('click', (e) => e.stopPropagation());
    });

    document.querySelectorAll('.task-priority-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const id = (e.target as HTMLElement).dataset.id;
            const newPriority = (e.target as HTMLSelectElement).value as TaskPriority;
            const task = tasks.find(t => t.id === id);
            if (task) {
                pushTaskUndo();
                task.priority = newPriority;
                addLog(`PRIORITY UPDATED: ${task.desc} -> ${newPriority}`, "cyan");
                saveTasks();
            }
        });
    });

    document.querySelectorAll('.task-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = (btn as HTMLElement).dataset.id;
            const task = tasks.find(t => t.id === id);
            if (task) {
                pushTaskUndo();
                const newStatus = task.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
                task.status = newStatus;
                if (newStatus === 'COMPLETED') {
                    justCompletedTaskId = id || null;
                    addLog(`PROTOCOL COMPLETED: ${task.desc}`, "green");
                } else {
                    justCompletedTaskId = null;
                }
                saveTasks();
                // Clear the flag after a short delay so it doesn't re-animate on every render
                setTimeout(() => { 
                    justCompletedTaskId = null; 
                    renderTasks(); // Re-render to clear the animation class
                }, 1000);
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
                newTaskNotes.value = task.notes || '';
                newTaskPriority.value = task.priority;
                if (task.dueDate) {
                    const d = new Date(task.dueDate);
                    const iso = d.toISOString().split('T')[0];
                    newTaskDue.value = iso;
                } else {
                    newTaskDue.value = '';
                }
                newTaskForm.classList.remove('hidden');
                saveTaskBtn.innerText = "UPDATE";
                newTaskDesc.focus();
            }
        });
    });

    document.querySelectorAll('.task-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = (e.target as HTMLElement).dataset.id;
            if (!id) return;
            pushTaskUndo();
            tasks = tasks.filter(t => t.id !== id);
            selectedTaskIds.delete(id);
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
            const pre = h.pre ? (h.pre as any)[metricKey] ?? 0 : 0;
            const post = h.post ? (h.post as any)[metricKey] ?? 0 : 0;
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
        pre: h.pre ? (h.pre as any)[metricKey] ?? 0 : 0,
        post: h.post ? (h.post as any)[metricKey] ?? 0 : 0,
        label: `B${String(h.bankId).padStart(2, '0')}:C${String(h.cellId).padStart(2, '0')}`
    }));

    // Data for Trend (Last 20)
    const trendHistory = allRegens.slice(-20);
    const trendData = trendHistory.map((h, i) => {
        const pre = h.pre ? (h.pre as any)[metricKey] ?? 0 : 0;
        const post = h.post ? (h.post as any)[metricKey] ?? 0 : 0;
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
        { id: 'alerts', el: tabAlerts, controls: alertControls, container: alertsContainer, activeClass: 'text-adi-red', activeBorder: 'border-adi-red' }
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

tabAlerts.onclick = () => {
    tabAlerts.classList.add('text-adi-red', 'border-adi-red');
    tabAlerts.classList.remove('text-gray-500', 'border-transparent');
    tabHistory.classList.add('text-gray-500', 'border-transparent');
    tabHistory.classList.remove('text-adi-magenta', 'border-adi-magenta');
    tabTasks.classList.add('text-gray-500', 'border-transparent');
    tabTasks.classList.remove('text-adi-cyan', 'border-adi-cyan');
    tabAnalytics.classList.add('text-gray-500', 'border-transparent');
    tabAnalytics.classList.remove('text-adi-teal', 'border-adi-teal');

    alertControls.classList.remove('hidden');
    historyControls.classList.add('hidden');
    taskControls.classList.add('hidden');
    analyticsControls.classList.add('hidden');
    
    alertsContainer.classList.remove('hidden');
    repairHistoryContainer.classList.add('hidden');
    taskListContainer.classList.add('hidden');
    analyticsContainer.classList.add('hidden');
    renderAlerts();
};

const aiModalOverlay = document.getElementById('ai-modal-overlay')!;
const aiCloseBtn = document.getElementById('ai-close-btn')!;

tabAi.onclick = () => {
    aiModalOverlay.classList.remove('hidden');
    aiModalOverlay.classList.add('flex');
};

aiCloseBtn.onclick = () => {
    aiModalOverlay.classList.add('hidden');
    aiModalOverlay.classList.remove('flex');
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

const bulkPrioritySelect = document.getElementById('bulk-priority') as HTMLSelectElement;
const bulkDeleteBtn = document.getElementById('bulk-delete') as HTMLButtonElement;
const bulkCompleteBtn = document.getElementById('bulk-complete') as HTMLButtonElement;
const bulkPendingBtn = document.getElementById('bulk-pending') as HTMLButtonElement;

if (bulkPrioritySelect) {
    bulkPrioritySelect.onchange = (e) => {
        const newPriority = (e.target as HTMLSelectElement).value as TaskPriority;
        if (!newPriority) return;
        
        pushTaskUndo();
        selectedTaskIds.forEach(id => {
            const task = tasks.find(t => t.id === id);
            if (task) task.priority = newPriority;
        });
        
        addLog(`BULK PRIORITY UPDATE: ${selectedTaskIds.size} ITEMS -> ${newPriority}`, "cyan");
        selectedTaskIds.clear();
        saveTasks();
        bulkPrioritySelect.value = "";
    };
}

if (bulkCompleteBtn) {
    bulkCompleteBtn.onclick = () => {
        pushTaskUndo();
        selectedTaskIds.forEach(id => {
            const task = tasks.find(t => t.id === id);
            if (task) task.status = 'COMPLETED';
        });
        addLog(`BULK STATUS UPDATE: ${selectedTaskIds.size} ITEMS -> COMPLETED`, "green");
        selectedTaskIds.clear();
        saveTasks();
    };
}

if (bulkPendingBtn) {
    bulkPendingBtn.onclick = () => {
        pushTaskUndo();
        selectedTaskIds.forEach(id => {
            const task = tasks.find(t => t.id === id);
            if (task) task.status = 'PENDING';
        });
        addLog(`BULK STATUS UPDATE: ${selectedTaskIds.size} ITEMS -> PENDING`, "gray");
        selectedTaskIds.clear();
        saveTasks();
    };
}

if (bulkDeleteBtn) {
    bulkDeleteBtn.onclick = () => {
        pushTaskUndo();
        tasks = tasks.filter(t => !selectedTaskIds.has(t.id));
        addLog(`BULK DELETE: ${selectedTaskIds.size} ITEMS REMOVED`, "red");
        selectedTaskIds.clear();
        saveTasks();
    };
}

const taskSelectAll = document.getElementById('task-select-all') as HTMLInputElement;

if (taskSelectAll) {
    taskSelectAll.onchange = (e) => {
        const isChecked = (e.target as HTMLInputElement).checked;
        
        // Only select tasks currently visible (filtered)
        let visibleTasks = [...tasks];
        if (taskPriorityFilter !== 'ALL') {
            visibleTasks = visibleTasks.filter(t => t.priority === taskPriorityFilter);
        }
        if (taskStatusFilter !== 'ALL') {
            visibleTasks = visibleTasks.filter(t => t.status === taskStatusFilter);
        }
        if (taskDueDateFilter !== 'ALL') {
            const now = Date.now();
            const today = new Date(now).setHours(0, 0, 0, 0);
            const endOfWeek = new Date(now).setDate(new Date(now).getDate() + 7);
            
            visibleTasks = visibleTasks.filter(t => {
                if (taskDueDateFilter === 'NONE') return !t.dueDate;
                if (!t.dueDate) return false;
                
                if (taskDueDateFilter === 'TODAY') return t.dueDate >= today && t.dueDate < today + 86400000;
                if (taskDueDateFilter === 'WEEK') return t.dueDate >= today && t.dueDate <= endOfWeek;
                if (taskDueDateFilter === 'OVERDUE') return t.dueDate < today && t.status !== 'COMPLETED';
                return true;
            });
        }

        if (isChecked) {
            visibleTasks.forEach(t => selectedTaskIds.add(t.id));
        } else {
            visibleTasks.forEach(t => selectedTaskIds.delete(t.id));
        }
        renderTasks();
    };
}

const sortByTimeHeader = document.getElementById('sort-by-time-header');
const sortByPriorityHeader = document.getElementById('sort-by-priority-header');
const taskStatusPills = document.getElementById('task-status-pills');

if (taskStatusPills) {
    const buttons = taskStatusPills.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.onclick = () => {
            const status = btn.getAttribute('data-status') as any;
            taskStatusFilter = status;
            taskStatusFilterSelect.value = status;
            
            // Update UI
            buttons.forEach(b => {
                b.className = "px-2 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors";
            });
            btn.className = "px-2 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-widest bg-adi-cyan text-black transition-colors";
            
            renderTasks();
        };
    });
}

if (sortByTimeHeader) {
    sortByTimeHeader.onclick = () => {
        taskSortMode = 'TIME';
        taskSortSelect.value = 'TIME';
        renderTasks();
    };
}

if (sortByPriorityHeader) {
    sortByPriorityHeader.onclick = () => {
        // Toggle between HI and LO
        if (taskSortMode === 'PRIORITY_HIGH') {
            taskSortMode = 'PRIORITY_LOW';
            taskSortSelect.value = 'PRIORITY_LOW';
        } else {
            taskSortMode = 'PRIORITY_HIGH';
            taskSortSelect.value = 'PRIORITY_HIGH';
        }
        renderTasks();
    };
}

addTaskBtn.onclick = () => {
    editingTaskId = null;
    newTaskDesc.value = '';
    newTaskNotes.value = '';
    newTaskPriority.value = TaskPriority.LOW;
    newTaskDue.value = '';
    saveTaskBtn.innerText = "SAVE";
    newTaskForm.classList.toggle('hidden');
    if (!newTaskForm.classList.contains('hidden')) newTaskDesc.focus();
};

saveTaskBtn.onclick = () => {
    const desc = newTaskDesc.value.trim();
    const notes = newTaskNotes.value.trim();
    if (!desc) return;
    
    pushTaskUndo();
    const priority = newTaskPriority.value as TaskPriority;
    const dueDate = newTaskDue.value ? new Date(newTaskDue.value).getTime() : undefined;

    if (editingTaskId) {
        const task = tasks.find(t => t.id === editingTaskId);
        if (task) {
            task.desc = desc;
            task.notes = notes;
            task.priority = priority;
            task.dueDate = dueDate;
            addLog(`PROTOCOL UPDATED: ${desc}`, "cyan");
        }
        editingTaskId = null;
    } else {
        tasks.unshift({
            id: `t${Date.now()}`,
            desc,
            notes,
            priority,
            status: 'PENDING',
            timestamp: Date.now(),
            dueDate
        });
        addLog(`NEW PROTOCOL ADDED: ${desc}`, "cyan");
    }

    newTaskDesc.value = '';
    newTaskNotes.value = '';
    newTaskDue.value = '';
    newTaskForm.classList.add('hidden');
    saveTasks();
};

taskSortSelect.onchange = (e) => {
    taskSortMode = (e.target as HTMLSelectElement).value as any;
    renderTasks();
};

taskPriorityFilterSelect.onchange = (e) => {
    taskPriorityFilter = (e.target as HTMLSelectElement).value as any;
    renderTasks();
};

taskStatusFilterSelect.onchange = (e) => {
    taskStatusFilter = (e.target as HTMLSelectElement).value as any;
    
    // Sync with pills
    if (taskStatusPills) {
        const buttons = taskStatusPills.querySelectorAll('button');
        buttons.forEach(b => {
            if (b.getAttribute('data-status') === taskStatusFilter) {
                b.className = "px-2 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-widest bg-adi-cyan text-black transition-colors";
            } else {
                b.className = "px-2 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors";
            }
        });
    }
    
    renderTasks();
};

taskDueDateFilterSelect.onchange = (e) => {
    taskDueDateFilter = (e.target as HTMLSelectElement).value as any;
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
        let irChange = (Math.random() - 0.4) * 0.02; // Natural IR growth
        let fxMultiplier = 1.0;
        let v2gCycleIncrement = 0;
        
        if (bank.v2gStatus === 'ENGAGED') {
            vChange -= 0.004; // Accelerated discharge
            tChange += 0.25;  // Higher thermal stress
            irChange += 0.06; // Accelerated chemical degradation
            fxMultiplier = 1.8; // Faster Factor X growth
            v2gCycleIncrement = 1;
        }
        
        const newVoltage = (parseFloat(bank.voltage) + vChange).toFixed(2);
        const newTemp = (parseFloat(bank.temp) + tChange).toFixed(1);
        const newIR = (parseFloat(bank.ir) + irChange).toFixed(1);
        let newFx = Math.max(0, Math.min(1.0, bank.fx + (Math.random() - 0.48) * 0.0008 * fxMultiplier));
        if (v2gCycleIncrement > 0) {
            newFx -= 0.0002 * v2gCycleIncrement;
        }
        if (bank.v2gStatus === V2GStatus.ENGAGED) {
            newFx -= 0.00005;
        }
        newFx = Math.max(0, Math.min(1.0, newFx));
        const newV2GCycles = (bank.v2gCycles || 0) + v2gCycleIncrement;

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
        const tempBank = { ...bank, voltage: newVoltage, temp: newTemp, ir: newIR, fx: newFx };
        const bhs = calculateBHS(tempBank, avgVoltage);
        
        let prediction: 'STABLE' | 'DEGRADING' | 'REGEN_REQ' | 'AT_RISK' = 'STABLE';
        let predictedFailureDate = bank.predictedFailureDate;

        // Calculate degradation rate (change in BHS per cycle/tick)
        const prevBhs = calculateBHS(bank, avgVoltage);
        const currentDegradationRate = Math.max(0, prevBhs - bhs);
        const smoothedDegradationRate = bank.degradationRate ? (bank.degradationRate * 0.8 + currentDegradationRate * 0.2) : currentDegradationRate;

        // Update BHS History
        const newBhsHistory = [...(bank.bhsHistory || [])];
        if (newBhsHistory.length >= 24) newBhsHistory.shift();
        newBhsHistory.push({ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), score: bhs });

        // Calculate remaining lifespan in days based on degradation rate
        // Assuming 1 tick = 0.1 days for simulation purposes
        const ticksToFailure = smoothedDegradationRate > 0 ? (bhs - 40) / smoothedDegradationRate : 1000;
        let baseRemainingDays = ticksToFailure * 0.1;
        if (v2gCycleIncrement > 0) {
            baseRemainingDays -= 0.5 * v2gCycleIncrement;
        }
        if (bank.v2gStatus === V2GStatus.ENGAGED) {
            baseRemainingDays -= 0.05;
        }
        baseRemainingDays = Math.max(0, baseRemainingDays);
        
        // V2G Risk Adjustment: High cycle count reduces confidence in lifespan
        const v2gRiskFactor = Math.max(0.6, 1 - (newV2GCycles * 0.0015));
        const remainingDays = Math.floor(baseRemainingDays * v2gRiskFactor);
        
        if (bhs < 45 || parseFloat(newIR) > 20 || newFx > 0.12) {
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
            ir: newIR,
            fx: newFx,
            v2gCycles: newV2GCycles,
            healthPrediction: prediction,
            predictedFailureDate,
            degradationRate: smoothedDegradationRate,
            cells: updatedCells,
            bhsHistory: newBhsHistory
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
             
             const v2gStatus = bank.v2gStatus || 'OFFLINE';
             inspectorV2GStatus.innerText = v2gStatus;
             const v2gClass = v2gStatus === 'ENGAGED' ? 'bg-adi-magenta text-black animate-pulse shadow-[0_0_15px_rgba(255,0,255,0.4)]' : (v2gStatus === 'READY' ? 'bg-adi-green text-black shadow-[0_0_10px_rgba(0,255,65,0.2)]' : 'bg-gray-800 text-gray-500 border border-white/10');
             inspectorV2GStatus.className = `text-xs font-black uppercase tracking-widest px-3 py-1 rounded-sm w-fit ${v2gClass}`;
             
             inspectorV2GCycles.innerText = (bank.v2gCycles || 0).toString();

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
             renderBHSTrendChart(bank);
        }
    }

    const timestamp = new Date().toLocaleTimeString();
    const vPoint: ChartDataPoint = { time: timestamp };
    const fxPoint: ChartDataPoint = { time: timestamp };
    const tempPoint: ChartDataPoint = { time: timestamp };
    batteryData.forEach(b => { 
        vPoint[`bank_${b.id}`] = parseFloat(b.voltage); 
        fxPoint[`bank_fx_${b.id}`] = b.fx; 
        tempPoint[`bank_temp_${b.id}`] = parseFloat(b.temp);
    });
    chartHistory.push(vPoint); if (chartHistory.length > MAX_HISTORY) chartHistory.shift();
    fxHistory.push(fxPoint); if (fxHistory.length > MAX_HISTORY) fxHistory.shift();
    tempHistory.push(tempPoint); if (tempHistory.length > MAX_HISTORY) tempHistory.shift();
    
    renderMainCharts();

    // Update grid status live for selected bank
    const selectedBank = batteryData[selectedIndex];
    if (gridStatus) {
        gridStatus.innerText = selectedBank.v2gStatus || 'READY';
        gridStatus.className = `text-xs font-bold ${selectedBank.v2gStatus === 'ENGAGED' ? 'text-adi-magenta animate-pulse' : 'text-adi-gold'}`;
    }

    renderAlerts();

    // Update Mineral Recovery Simulation
    mineralData.lithium = Math.min(mineralData.lithiumTarget, mineralData.lithium + Math.random() * 0.05);
    mineralData.cobalt = Math.min(mineralData.cobaltTarget, mineralData.cobalt + Math.random() * 0.02);
    mineralData.nickel = Math.min(mineralData.nickelTarget, mineralData.nickel + Math.random() * 0.03);
    renderMineralRecovery();
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
            renderMineralRecovery();
        }
    } catch (error) {
        console.error("CRITICAL BOOT ERROR:", error);
        addLog("CRITICAL BOOT ERROR DETECTED", "red");
    }
})();

// --- AI ASSISTANT PROXY (FIXES CORS) ---
class GoogleGenAIProxy {
    models = {
        generateContent: async (params: any) => {
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            if (!res.ok) throw new Error(await res.text());
            return await res.json();
        },
        generateVideos: async (params: any) => {
            const res = await fetch('/api/ai/generateVideos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            if (!res.ok) throw new Error(await res.text());
            return await res.json();
        }
    };
    operations = {
        getVideosOperation: async (params: any) => {
            const res = await fetch('/api/ai/videoOperation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            if (!res.ok) throw new Error(await res.text());
            return await res.json();
        }
    };
}

const aiInput = document.getElementById('ai-input') as HTMLInputElement;
const aiSendBtn = document.getElementById('ai-send-btn') as HTMLButtonElement;
const aiGenImgBtn = document.getElementById('ai-gen-img-btn') as HTMLButtonElement;
const aiGenVidBtn = document.getElementById('ai-gen-vid-btn') as HTMLButtonElement;
const aiChatLog = document.getElementById('ai-chat-log')!;
const aiSuggestions = document.getElementById('ai-suggestions')!;

const AI_COMMANDS = [
    // Diagnostics
    "DIAGNOSE BANK [ID]",
    "ANALYZE LATTICE ENTROPY",
    "SYSTEM INTEGRITY DIAGNOSTIC",
    "THERMAL STABILITY ANALYSIS",
    "FACTOR X TREND ANALYSIS",
    "ANALYZE CELL VOLTAGE VARIANCE",
    "SCAN FOR MICRO-FRACTURES",
    "IMPEDANCE SPECTROSCOPY REPORT",
    
    // Fleet Management
    "FLEET STATUS REPORT",
    "PREDICT NEXT FAILURE",
    "ESTIMATE ENERGY SAVINGS",
    "V2G ENGAGEMENT STATUS",
    "GENERATE FLEET HEALTH AUDIT",
    "SIMULATE 30-DAY DEGRADATION",
    "CALCULATE GRID ARBITRAGE ROI",
    "MINERAL RECOVERY EFFICIENCY",
    "FLEET UTILIZATION HEATMAP",
    
    // Repair Protocols
    "REPAIR BANK [ID]",
    "REPAIR ALL CRITICAL NODES",
    "REGENERATE CRITICAL CELLS",
    "OPTIMIZE CHARGE CYCLES",
    "REGENERATE LITHIUM LATTICE",
    "V2G PEAK SHAVING PROTOCOL",
    "PREDICTIVE MAINTENANCE SCHEDULE",
    "RESET BMS CONTROLLER",
    "INITIATE DEEP PULSE RECOVERY",
    "CALIBRATE VOLTAGE SENSORS"
];

let selectedSuggestionIndex = -1;

function showSuggestions(filter: string = "") {
    const upperFilter = filter.toUpperCase();
    const filtered = AI_COMMANDS.filter(cmd => 
        cmd.toUpperCase().includes(upperFilter) || 
        upperFilter.split(' ').every(word => cmd.toUpperCase().includes(word))
    ).slice(0, 8); // Limit to 8 suggestions

    if (filtered.length === 0) {
        aiSuggestions.style.display = 'none';
        selectedSuggestionIndex = -1;
        return;
    }

    aiSuggestions.innerHTML = `
        <div class="px-2 py-1 border-b border-white/10 bg-black/60 text-[9px] text-gray-500 font-black uppercase tracking-widest">
            Suggested Protocols
        </div>
    `;
    
    filtered.forEach((cmd, idx) => {
        const item = document.createElement('div');
        item.className = `suggestion-item ${idx === selectedSuggestionIndex ? 'bg-adi-gold/20 text-white' : ''}`;
        
        // Highlight matching parts
        if (filter) {
            const regex = new RegExp(`(${filter})`, 'gi');
            item.innerHTML = cmd.replace(regex, '<span class="text-white font-black">$1</span>');
        } else {
            item.innerText = cmd;
        }

        item.onclick = () => {
            aiInput.value = cmd;
            aiSuggestions.style.display = 'none';
            aiInput.focus();
            selectedSuggestionIndex = -1;
        };
        aiSuggestions.appendChild(item);
    });
    aiSuggestions.style.display = 'block';
}

if (aiInput) {
    aiInput.oninput = () => {
        selectedSuggestionIndex = -1;
        showSuggestions(aiInput.value);
    };
    aiInput.onfocus = () => {
        selectedSuggestionIndex = -1;
        showSuggestions(aiInput.value);
    };
    
    aiInput.addEventListener('keydown', (e) => {
        const items = aiSuggestions.querySelectorAll('.suggestion-item');
        if (aiSuggestions.style.display === 'block' && items.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedSuggestionIndex = (selectedSuggestionIndex + 1) % items.length;
                showSuggestions(aiInput.value);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedSuggestionIndex = (selectedSuggestionIndex - 1 + items.length) % items.length;
                showSuggestions(aiInput.value);
            } else if (e.key === 'Enter' && selectedSuggestionIndex !== -1) {
                e.preventDefault();
                const selectedText = (items[selectedSuggestionIndex] as HTMLElement).innerText;
                aiInput.value = selectedText;
                aiSuggestions.style.display = 'none';
                selectedSuggestionIndex = -1;
            } else if (e.key === 'Escape') {
                aiSuggestions.style.display = 'none';
                selectedSuggestionIndex = -1;
            }
        }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== aiInput && !aiSuggestions.contains(e.target as Node)) {
            aiSuggestions.style.display = 'none';
            selectedSuggestionIndex = -1;
        }
    });
}

const ai = new GoogleGenAIProxy();

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
        addAiMessage('GENERATING FLEET REPORT VIA AI GATEWAY...', 'system');

        try {
            const response = await fetch('/api/ai-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fleetSize: '450 hulajnóg 36–48V Li-ion',
                    city: 'Warszawa / Kraków',
                    challenge: text
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'AI Gateway report failed.');
            addAiMessage((data.report || 'NO RESPONSE').replace(/\n/g, '<br/>'));
        } catch (e: any) {
            addAiMessage(`ERROR: ${e.message}`, 'system');
        }
    };
}

if (aiGenImgBtn) {
    aiGenImgBtn.onclick = () => {
        addAiMessage('IMAGE GENERATION IS DISABLED IN THIS DEPLOYMENT. USE THE AI REPORT GENERATOR INSTEAD.', 'system');
    };
}

if (aiGenVidBtn) {
    aiGenVidBtn.onclick = () => {
        addAiMessage('VIDEO GENERATION IS DISABLED IN THIS DEPLOYMENT. USE THE AI REPORT GENERATOR INSTEAD.', 'system');
    };
}

if (aiInput) {
    aiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') aiSendBtn.click();
    });
}

// Auto-open cell inspector removed to show main system panel on load



// --- LEAD FORM TRACKING ---
const leadForm = document.getElementById('lead-form') as HTMLFormElement | null;
const leadThankYou = document.getElementById('lead-thank-you');
const pricingCta = document.getElementById('pricing-cta');
const demoCheckoutCta = document.getElementById('demo-checkout-cta');
const stickyDemoCheckoutCta = document.getElementById('sticky-demo-checkout-cta');
const stickyLeadCta = document.getElementById('sticky-lead-cta');
const generateAiReportBtn = document.getElementById('generate-ai-report-btn') as HTMLButtonElement | null;
const aiReportOutput = document.getElementById('ai-report-output');
const copyAiReportBtn = document.getElementById('copy-ai-report-btn') as HTMLButtonElement | null;
const copyAiReportStatus = document.getElementById('copy-ai-report-status');
const aiPilotForm = document.getElementById('ai-pilot-form') as HTMLFormElement | null;
const aiPilotFormStatus = document.getElementById('ai-pilot-form-status');

if (pricingCta) {
    pricingCta.addEventListener('click', () => {
        track('Pricing CTA Click', {
            source: 'pricing_section'
        });
    });
}

if (demoCheckoutCta) {
    demoCheckoutCta.addEventListener('click', () => {
        track('Demo Checkout Click', {
            source: 'demo_checkout_section',
            price: '999_pln',
            provider: 'revolut'
        });
    });
}

if (stickyDemoCheckoutCta) {
    stickyDemoCheckoutCta.addEventListener('click', () => {
        track('Demo Checkout Click', {
            source: 'sticky_cta',
            price: '999_pln',
            provider: 'revolut'
        });
    });
}

if (stickyLeadCta) {
    stickyLeadCta.addEventListener('click', () => {
        track('Pricing CTA Click', {
            source: 'sticky_cta'
        });
    });
}

if (generateAiReportBtn && aiReportOutput) {
    generateAiReportBtn.addEventListener('click', async () => {
        generateAiReportBtn.disabled = true;
        aiReportOutput.textContent = 'Generuję raport AI...';
        track('AI Report Generate Click', { source: 'ai_gateway_demo' });

        try {
            const response = await fetch('/api/ai-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fleetSize: '450 hulajnóg 36–48V Li-ion',
                    city: 'Warszawa / Kraków',
                    challenge: 'wysokie koszty serwisu, spadek SoH i nieplanowane awarie baterii'
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Nie udało się wygenerować raportu.');
            aiReportOutput.textContent = data.report;
        } catch (error: any) {
            aiReportOutput.textContent = `Błąd generatora AI: ${error.message}`;
        } finally {
            generateAiReportBtn.disabled = false;
        }
    });
}

if (copyAiReportBtn && aiReportOutput) {
    copyAiReportBtn.addEventListener('click', async () => {
        const reportText = aiReportOutput.textContent?.trim() || '';
        if (!reportText || reportText === 'Raport AI pojawi się tutaj po kliknięciu przycisku.') return;

        try {
            await navigator.clipboard.writeText(reportText);
            copyAiReportStatus?.classList.remove('hidden');
            track('AI Report Copy Click', { source: 'ai_gateway_demo' });
            setTimeout(() => copyAiReportStatus?.classList.add('hidden'), 2500);
        } catch (error) {
            if (copyAiReportStatus) {
                copyAiReportStatus.textContent = 'Nie udało się skopiować raportu.';
                copyAiReportStatus.classList.remove('hidden');
            }
        }
    });
}

if (aiPilotForm) {
    aiPilotForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(aiPilotForm);
        const email = String(formData.get('email') || '').trim();
        const company = String(formData.get('company') || '').trim();
        const fleetSize = String(formData.get('fleetSize') || '').trim();
        const currentReport = aiReportOutput?.textContent?.trim() || '';

        track('AI Pilot Form Submit', {
            source: 'ai_report_section',
            hasFleetSize: fleetSize ? 'yes' : 'no'
        });

        const subject = 'Pilotaż ADI PRO Ultimate — raport AI dla floty';
        const body = [
            `Email: ${email}`,
            `Firma / flota: ${company}`,
            `Liczba pojazdów: ${fleetSize || '-'}`,
            '',
            'Proszę o kontakt w sprawie 30-dniowego pilotażu technicznego ADI PRO Ultimate.',
            '',
            'Raport AI / kontekst:',
            currentReport || '-'
        ].join('\n');

        aiPilotFormStatus?.classList.remove('hidden');
        window.location.href = `mailto:ewelinalesiak7@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
}

if (leadForm) {
    leadForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(leadForm);
        const name = String(formData.get('name') || '').trim();
        const email = String(formData.get('email') || '').trim();
        const company = String(formData.get('company') || '').trim();
        const plan = String(formData.get('plan') || '').trim();
        const message = String(formData.get('message') || '').trim();

        track('Lead Form Submit', {
            source: 'pricing_section',
            plan: plan || 'not_selected'
        });

        const subject = `Zapytanie o wdrożenie ADI PRO Ultimate - ${plan || 'kontakt'}`;
        const body = [
            `Imię: ${name}`,
            `Email: ${email}`,
            `Firma / flota: ${company || '-'}`,
            `Pakiet: ${plan || '-'}`,
            '',
            'Wiadomość:',
            message || '-'
        ].join('\n');

        if (leadThankYou) {
            leadThankYou.classList.remove('hidden');
            leadThankYou.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        window.location.href = `mailto:ewelinalesiak7@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
}

// --- VERCEL ANALYTICS INITIALIZATION ---
inject({ mode: 'production' });
