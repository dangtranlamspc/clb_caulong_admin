import { useEffect, useRef } from 'react';

interface RankAvatarProps {
    tier: string;
    name: string;
    size?: number;
    className?: string;
}

const TIER_CONFIG: Record<string, {
    element: string;
    c1: string; c2: string; c3: string;
    glow: string; bg: string;
    particleCount: number; emberCount: number; speed: number;
}> = {
    'Sắt': { element: 'iron', c1: '#64748b', c2: '#94a3b8', c3: '#e2e8f0', glow: '#94a3b8', bg: '#1e2330', particleCount: 0, emberCount: 0, speed: 0 },
    'Đồng': { element: 'fire', c1: '#7c2d12', c2: '#ea580c', c3: '#fb923c', glow: '#dc2626', bg: '#1c0e06', particleCount: 40, emberCount: 0, speed: 0.003 },
    'Bạc': { element: 'ice', c1: '#1e3a5f', c2: '#38bdf8', c3: '#bae6fd', glow: '#0ea5e9', bg: '#061018', particleCount: 0, emberCount: 28, speed: 0.004 },
    'Vàng': { element: 'lightning', c1: '#713f12', c2: '#eab308', c3: '#fef08a', glow: '#facc15', bg: '#181000', particleCount: 0, emberCount: 22, speed: 0.005 },
    'Bạch Kim': { element: 'holy', c1: '#1e3a5f', c2: '#67e8f9', c3: '#e0f2fe', glow: '#22d3ee', bg: '#030d1a', particleCount: 0, emberCount: 22, speed: 0.006 },
    'Lục Bảo': { element: 'nature', c1: '#14532d', c2: '#22c55e', c3: '#86efac', glow: '#16a34a', bg: '#04120a', particleCount: 0, emberCount: 20, speed: 0.007 },
    'Kim Cương': { element: 'void', c1: '#3b0764', c2: '#a855f7', c3: '#e9d5ff', glow: '#9333ea', bg: '#080010', particleCount: 0, emberCount: 22, speed: 0.008 },
    'Cao Thủ': { element: 'chaos', c1: '#4c0519', c2: '#f43f5e', c3: '#fda4af', glow: '#e11d48', bg: '#150006', particleCount: 50, emberCount: 0, speed: 0.009 },
};

function h2r(hex: string): [number, number, number] {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

interface FireParticle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; reset: boolean; }
interface Ember { angle: number; r: number; speed: number; size: number; alpha: number; alphaSpd: number; alphaDir: number; trail: { x: number; y: number }[]; drift: number; }

function noise(x: number, y: number, t: number) {
    return Math.sin(x * 3.1 + t * .7) * Math.cos(y * 2.7 - t * .5) + Math.sin(x * 1.3 - t * .3) * Math.sin(y * 4.1 + t * .9);
}

function drawFlameLayer(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, c1: string, c2: string, c3: string, t: number, intensity: number) {
    const nPts = 48;
    const [r1, g1, b1] = h2r(c1); const [r2, g2, b2] = h2r(c2); const [r3, g3, b3] = h2r(c3);
    for (let layer = 0; layer < 4; layer++) {
        const scale = 1.0 + layer * .1;
        ctx.beginPath();
        for (let i = 0; i <= nPts; i++) {
            const a = (i / nPts) * Math.PI * 2;
            const n = noise(Math.cos(a), Math.sin(a), t * .02 + layer * .5) * intensity;
            const rv = (R * scale) + (n * R * .22);
            i === 0 ? ctx.moveTo(cx + Math.cos(a) * rv, cy + Math.sin(a) * rv) : ctx.lineTo(cx + Math.cos(a) * rv, cy + Math.sin(a) * rv);
        }
        ctx.closePath();
        const [lrv, lgv, lbv] = layer === 0 ? [r1, g1, b1] : layer === 1 ? [r2, g2, b2] : [r3, g3, b3];
        const grad = ctx.createRadialGradient(cx, cy, R * .5, cx, cy, R * scale * 1.4);
        grad.addColorStop(0, `rgba(${lrv},${lgv},${lbv},0)`);
        grad.addColorStop(.5, `rgba(${lrv},${lgv},${lbv},${.2 - layer * .03})`);
        grad.addColorStop(1, `rgba(${lrv},${lgv},${lbv},${.5 - layer * .08})`);
        ctx.strokeStyle = `rgba(${lrv},${lgv},${lbv},${.8 - layer * .15})`;
        ctx.lineWidth = 3 - layer * .5; ctx.stroke();
        ctx.fillStyle = grad; ctx.fill();
    }
}

function drawIceCrystals(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, c2: string, c3: string, t: number, phase: number) {
    const [r2, g2, b2] = h2r(c2); const [r3, g3, b3] = h2r(c3);
    // outer 6 big crystals
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + t * .003 + phase;
        const pulse = .85 + Math.sin(t * .05 + i) * .15;
        const baseR = R * 1.02, tipR = R * (1.4 + Math.sin(t * .04 + i * 1.1) * .1) * pulse;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a - .07) * baseR, cy + Math.sin(a - .07) * baseR);
        ctx.lineTo(cx + Math.cos(a) * tipR, cy + Math.sin(a) * tipR);
        ctx.lineTo(cx + Math.cos(a + .07) * baseR, cy + Math.sin(a + .07) * baseR);
        ctx.closePath();
        const cg = ctx.createLinearGradient(cx + Math.cos(a) * baseR, cy + Math.sin(a) * baseR, cx + Math.cos(a) * tipR, cy + Math.sin(a) * tipR);
        cg.addColorStop(0, `rgba(${r2},${g2},${b2},.5)`);
        cg.addColorStop(.4, `rgba(${r3},${g3},${b3},.95)`);
        cg.addColorStop(1, `rgba(255,255,255,.4)`);
        ctx.fillStyle = cg; ctx.fill();
        ctx.strokeStyle = `rgba(${r3},${g3},${b3},.9)`; ctx.lineWidth = 1; ctx.stroke();
        // inner facet line
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * R * 1.05, cy + Math.sin(a) * R * 1.05);
        ctx.lineTo(cx + Math.cos(a) * tipR * .85, cy + Math.sin(a) * tipR * .85);
        ctx.strokeStyle = `rgba(255,255,255,.3)`; ctx.lineWidth = .5; ctx.stroke();
    }
    // inner 6 small shards between main crystals
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6 + t * .004 + phase;
        const sR = R * (.85 + Math.sin(t * .06 + i) * .06);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a - .04) * R * .92, cy + Math.sin(a - .04) * R * .92);
        ctx.lineTo(cx + Math.cos(a) * sR, cy + Math.sin(a) * sR);
        ctx.lineTo(cx + Math.cos(a + .04) * R * .92, cy + Math.sin(a + .04) * R * .92);
        ctx.closePath();
        ctx.fillStyle = `rgba(${r2},${g2},${b2},.3)`; ctx.fill();
        ctx.strokeStyle = `rgba(${r3},${g3},${b3},.4)`; ctx.lineWidth = .5; ctx.stroke();
    }
    // snowflake glow center pulse
    const sFade = .15 + Math.sin(t * .06 + phase) * .1;
    const sg = ctx.createRadialGradient(cx, cy, R * .3, cx, cy, R * .85);
    sg.addColorStop(0, `rgba(${r3},${g3},${b3},${sFade})`);
    sg.addColorStop(1, `rgba(${r2},${g2},${b2},0)`);
    ctx.beginPath(); ctx.arc(cx, cy, R * .85, 0, Math.PI * 2); ctx.fillStyle = sg; ctx.fill();
}

function drawLightning(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, c2: string, c3: string, t: number, phase: number) {
    const [r2, g2, b2] = h2r(c2); const [r3, g3, b3] = h2r(c3);
    // background electric field
    for (let ring = 0; ring < 2; ring++) {
        const rr = R * (1.05 + ring * .12);
        const alpha = (.08 + Math.sin(t * .08 + ring) * .05);
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r3},${g3},${b3},${alpha})`; ctx.lineWidth = ring === 0 ? 6 : 3; ctx.stroke();
    }
    // main lightning bolts
    for (let b = 0; b < 6; b++) {
        if (Math.floor(t * .4 + b * 5) % 4 !== 0) continue;
        const a = (b / 6) * Math.PI * 2 + t * .006 + phase;
        const startR = R * .98, endR = R * (1.35 + Math.random() * .2);
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * startR, cy + Math.sin(a) * startR);
        let cx2 = cx + Math.cos(a) * startR, cy2 = cy + Math.sin(a) * startR;
        for (let s = 1; s <= 8; s++) {
            const frac = s / 8;
            const jitter = (Math.random() - .5) * 14 * (1 - frac * .6);
            const nx = cx + Math.cos(a) * (startR + (endR - startR) * frac) + Math.cos(a + Math.PI / 2) * jitter;
            const ny = cy + Math.sin(a) * (startR + (endR - startR) * frac) + Math.sin(a + Math.PI / 2) * jitter;
            ctx.lineTo(nx, ny); cx2 = nx; cy2 = ny;
        }
        // outer glow
        ctx.strokeStyle = `rgba(${r2},${g2},${b2},.25)`; ctx.lineWidth = 6; ctx.stroke();
        // mid
        ctx.strokeStyle = `rgba(${r3},${g3},${b3},.7)`; ctx.lineWidth = 2; ctx.stroke();
        // core bright
        ctx.strokeStyle = `rgba(255,255,255,.9)`; ctx.lineWidth = .8; ctx.stroke();
        // branches
        for (let br = 0; br < 2; br++) {
            const brFrac = .3 + br * .25;
            const bx = cx + Math.cos(a) * (startR + (endR - startR) * brFrac) + Math.cos(a + Math.PI / 2) * (Math.random() - .5) * 8;
            const by = cy + Math.sin(a) * (startR + (endR - startR) * brFrac) + Math.sin(a + Math.PI / 2) * (Math.random() - .5) * 8;
            const brAngle = a + (Math.random() - .5) * .8;
            ctx.beginPath(); ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(brAngle) * (endR - startR) * .35, by + Math.sin(brAngle) * (endR - startR) * .35);
            ctx.strokeStyle = `rgba(${r3},${g3},${b3},.5)`; ctx.lineWidth = 1; ctx.stroke();
        }
        // tip spark
        ctx.beginPath(); ctx.arc(cx2, cy2, 3, 0, Math.PI * 2);
        const sg = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, 6);
        sg.addColorStop(0, `rgba(255,255,255,.9)`); sg.addColorStop(1, `rgba(${r3},${g3},${b3},0)`);
        ctx.fillStyle = sg; ctx.fill();
    }
}

function drawVoidTentacles(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, c1: string, c2: string, t: number, phase: number) {
    const [r1v, g1v, b1v] = h2r(c1); const [r2, g2, b2] = h2r(c2);
    // dark void aura
    const voidG = ctx.createRadialGradient(cx, cy, R * .6, cx, cy, R * 1.5);
    voidG.addColorStop(0, `rgba(${r1v},${g1v},${b1v},.15)`);
    voidG.addColorStop(.6, `rgba(${r1v},${g1v},${b1v},.08)`);
    voidG.addColorStop(1, `rgba(${r1v},${g1v},${b1v},0)`);
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.5, 0, Math.PI * 2); ctx.fillStyle = voidG; ctx.fill();
    // tentacles
    for (let i = 0; i < 10; i++) {
        const baseA = (i / 10) * Math.PI * 2 + t * .006 + phase;
        const len = R * (.5 + Math.sin(t * .035 + i * 1.7) * .18);
        const alpha = .5 + Math.sin(t * .06 + i) * .3;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(baseA) * R * .94, cy + Math.sin(baseA) * R * .94);
        for (let s = 1; s <= 14; s++) {
            const frac = s / 14;
            const waveA = baseA + Math.sin(t * .045 + s * .7 + i) * .35 + Math.cos(t * .025 + s * .4) * 0.15;
            const rv = R * .94 + len * frac;
            ctx.lineTo(cx + Math.cos(waveA) * rv, cy + Math.sin(waveA) * rv);
        }
        // glow stroke
        ctx.strokeStyle = `rgba(${r1v},${g1v},${b1v},${alpha * .4})`; ctx.lineWidth = 5; ctx.stroke();
        ctx.strokeStyle = `rgba(${r2},${g2},${b2},${alpha})`; ctx.lineWidth = 1.5; ctx.stroke();
        // tip
        const tipA = baseA + Math.sin(t * .045 + 14 * .7 + i) * .35;
        const tipX = cx + Math.cos(tipA) * (R * .94 + len), tipY = cy + Math.sin(tipA) * (R * .94 + len);
        const tg = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, 5);
        tg.addColorStop(0, `rgba(${r2},${g2},${b2},${alpha})`);
        tg.addColorStop(1, `rgba(${r2},${g2},${b2},0)`);
        ctx.beginPath(); ctx.arc(tipX, tipY, 5, 0, Math.PI * 2); ctx.fillStyle = tg; ctx.fill();
    }
    // orbiting void spheres
    for (let i = 0; i < 3; i++) {
        const oa = (i / 3) * Math.PI * 2 + t * .015 + phase;
        const or = R * 1.12;
        const ox = cx + Math.cos(oa) * or, oy = cy + Math.sin(oa) * or;
        const og = ctx.createRadialGradient(ox, oy, 0, ox, oy, 7);
        og.addColorStop(0, `rgba(${r2},${g2},${b2},.9)`);
        og.addColorStop(.5, `rgba(${r1v},${g1v},${b1v},.4)`);
        og.addColorStop(1, `rgba(${r1v},${g1v},${b1v},0)`);
        ctx.beginPath(); ctx.arc(ox, oy, 7, 0, Math.PI * 2); ctx.fillStyle = og; ctx.fill();
    }
}

function drawNatureVines(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, c1: string, c2: string, c3: string, t: number, phase: number) {
    const [r1, g1, b1] = h2r(c1); const [r2, g2, b2] = h2r(c2); const [r3, g3, b3] = h2r(c3);
    // ambient nature glow
    const ng = ctx.createRadialGradient(cx, cy, R * .5, cx, cy, R * 1.4);
    ng.addColorStop(0, `rgba(${r1},${g1},${b1},.1)`);
    ng.addColorStop(1, `rgba(${r1},${g1},${b1},0)`);
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.4, 0, Math.PI * 2); ctx.fillStyle = ng; ctx.fill();
    // vines
    for (let i = 0; i < 8; i++) {
        const baseA = (i / 8) * Math.PI * 2 + t * .005 + phase;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(baseA) * R * .96, cy + Math.sin(baseA) * R * .96);
        for (let s = 1; s <= 12; s++) {
            const frac = s / 12;
            const curl = Math.sin(t * .045 + s * .6 + i * 2.1) * .28;
            const a2 = baseA + curl + frac * .9;
            const rv = R * (1.0 + frac * .4 + Math.sin(t * .055 + s + i) * .05);
            ctx.lineTo(cx + Math.cos(a2) * rv, cy + Math.sin(a2) * rv);
        }
        const alpha = .6 + Math.sin(t * .04 + i) * .2;
        ctx.strokeStyle = `rgba(${r2},${g2},${b2},${alpha})`; ctx.lineWidth = 2.2; ctx.stroke();
        // leaves
        for (let l = 0; l < 2; l++) {
            const lFrac = .4 + l * .4;
            const lCurl = Math.sin(t * .045 + lFrac * 12 * .6 + i * 2.1) * .28;
            const lA = baseA + lCurl + lFrac * .9;
            const lR = R * (1.0 + lFrac * .4);
            const lx = cx + Math.cos(lA) * lR, ly = cy + Math.sin(lA) * lR;
            ctx.save(); ctx.translate(lx, ly); ctx.rotate(lA + Math.PI / 2 + Math.sin(t * .03 + i + l) * .3);
            ctx.beginPath(); ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r3},${g3},${b3},.85)`; ctx.fill();
            ctx.strokeStyle = `rgba(${r2},${g2},${b2},.5)`; ctx.lineWidth = .5; ctx.stroke();
            // leaf vein
            ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0);
            ctx.strokeStyle = `rgba(255,255,255,.2)`; ctx.lineWidth = .4; ctx.stroke();
            ctx.restore();
        }
    }
    // small flower buds at tips
    for (let i = 0; i < 4; i++) {
        const fa = (i / 4) * Math.PI * 2 + t * .008 + phase + Math.PI / 8;
        const fr = R * (1.32 + Math.sin(t * .04 + i) * .06);
        const fx = cx + Math.cos(fa) * fr, fy = cy + Math.sin(fa) * fr;
        const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, 6);
        fg.addColorStop(0, `rgba(255,255,200,.9)`);
        fg.addColorStop(.5, `rgba(${r3},${g3},${b3},.6)`);
        fg.addColorStop(1, `rgba(${r2},${g2},${b2},0)`);
        ctx.beginPath(); ctx.arc(fx, fy, 6, 0, Math.PI * 2); ctx.fillStyle = fg; ctx.fill();
    }
}

function drawHolyRunes(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, c2: string, c3: string, t: number, phase: number) {
    const [r2, g2, b2] = h2r(c2); const [r3, g3, b3] = h2r(c3);
    // divine light rays
    for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + t * .003 + phase;
        const isMain = i % 2 === 0;
        const r1v = R * (isMain ? 1.0 : .98), r2v = R * (isMain ? 1.38 : 1.18);
        const alpha = (isMain ? .35 : .15) + Math.sin(t * .05 + i * .4) * .12;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a - .012) * r1v, cy + Math.sin(a - .012) * r1v);
        ctx.lineTo(cx + Math.cos(a) * r2v, cy + Math.sin(a) * r2v);
        ctx.lineTo(cx + Math.cos(a + .012) * r1v, cy + Math.sin(a + .012) * r1v);
        ctx.closePath();
        const rg2 = ctx.createLinearGradient(cx + Math.cos(a) * r1v, cy + Math.sin(a) * r1v, cx + Math.cos(a) * r2v, cy + Math.sin(a) * r2v);
        rg2.addColorStop(0, `rgba(${r2},${g2},${b2},${alpha})`);
        rg2.addColorStop(1, `rgba(${r3},${g3},${b3},0)`);
        ctx.fillStyle = rg2; ctx.fill();
    }
    // orbiting rune symbols
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + t * .008 + phase;
        const rx = cx + Math.cos(a) * R * 1.18, ry = cy + Math.sin(a) * R * 1.18;
        const alpha = .6 + Math.sin(t * .07 + i * .8) * .3;
        ctx.save(); ctx.translate(rx, ry); ctx.rotate(a + t * .012);
        ctx.strokeStyle = `rgba(${r3},${g3},${b3},${alpha})`; ctx.lineWidth = 1.4;
        // rune: cross + diamond
        ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(3, 0); ctx.lineTo(0, 4); ctx.lineTo(-3, 0); ctx.closePath();
        ctx.strokeStyle = `rgba(${r2},${g2},${b2},${alpha * .6})`; ctx.lineWidth = .8; ctx.stroke();
        ctx.restore();
    }
    // inner holy circle pulse
    const hPulse = .12 + Math.sin(t * .05 + phase) * .08;
    const hg = ctx.createRadialGradient(cx, cy, R * .4, cx, cy, R * .9);
    hg.addColorStop(0, `rgba(${r3},${g3},${b3},${hPulse})`);
    hg.addColorStop(1, `rgba(${r2},${g2},${b2},0)`);
    ctx.beginPath(); ctx.arc(cx, cy, R * .9, 0, Math.PI * 2); ctx.fillStyle = hg; ctx.fill();
}

function drawIronOrnaments(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, c2: string, c3: string, t: number, phase: number) {
    const [r2, g2, b2] = h2r(c2); const [r3, g3, b3] = h2r(c3);
    // outer gear-like ticks
    for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const isMain = i % 6 === 0, isMid = i % 3 === 0;
        const r1v = R * (isMain ? 1.04 : isMid ? 1.02 : 1.01);
        const r2v = R * (isMain ? 1.18 : isMid ? 1.10 : 1.06);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r1v, cy + Math.sin(a) * r1v);
        ctx.lineTo(cx + Math.cos(a) * r2v, cy + Math.sin(a) * r2v);
        ctx.strokeStyle = `rgba(${r2},${g2},${b2},${isMain ? .95 : isMid ? .6 : .3})`;
        ctx.lineWidth = isMain ? 2.5 : isMid ? 1.5 : 1; ctx.stroke();
    }
    // 4 corner ornamental brackets
    for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const ox = cx + Math.cos(a) * R * 1.1, oy = cy + Math.sin(a) * R * 1.1;
        ctx.save(); ctx.translate(ox, oy); ctx.rotate(a);
        ctx.strokeStyle = `rgba(${r3},${g3},${b3},.9)`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-3, -4); ctx.lineTo(0, -5); ctx.lineTo(3, -4); ctx.lineTo(6, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(2, -2); ctx.stroke();
        ctx.restore();
    }
    // slow rotation overlay ring
    const rotA = t * .002 + phase;
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + rotA;
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R * 1.02, cy + Math.sin(a) * R * 1.02, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r3},${g3},${b3},.6)`; ctx.fill();
    }
}

export function RankAvatar({ tier, name, size = 100, className = '' }: RankAvatarProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const tRef = useRef<number>(0);
    const particlesRef = useRef<FireParticle[]>([]);
    const embersRef = useRef<Ember[]>([]);
    const phaseRef = useRef<number>(Math.random() * Math.PI * 2);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG['Sắt'];
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr; canvas.height = size * dpr;
        const ctx = canvas.getContext('2d')!;
        ctx.scale(dpr, dpr);
        const R = size * 0.36;
        let animRunning = true;

        particlesRef.current = Array.from({ length: cfg.particleCount }, () =>
            ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, reset: true }));

        embersRef.current = Array.from({ length: cfg.emberCount }, () => ({
            angle: Math.random() * Math.PI * 2,
            r: R * 1.02 + (Math.random() - .5) * 8,
            speed: (0.006 + Math.random() * .018) * (Math.random() < .5 ? 1 : -1),
            size: 1.2 + Math.random() * 2.8,
            alpha: Math.random(),
            alphaSpd: 0.015 + Math.random() * .025,
            alphaDir: 1, trail: [],
            drift: Math.random() * Math.PI * 2,
        }));

        const draw = () => {
            if (!animRunning) return;
            tRef.current += 1;
            const t = tRef.current;
            const phase = phaseRef.current;
            const cx = size / 2, cy = size / 2;
            const [r1, g1, b1] = h2r(cfg.c1), [r2, g2, b2] = h2r(cfg.c2), [r3, g3, b3] = h2r(cfg.c3), [rg, gg, bg2] = h2r(cfg.glow);

            // CLEAR — fully transparent
            ctx.clearRect(0, 0, size, size);

            // clip everything to circle so no square bg
            ctx.save();
            ctx.beginPath(); ctx.arc(cx, cy, size * .5, 0, Math.PI * 2); ctx.clip();

            // bg — only inside circle
            const bgG = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * .5);
            bgG.addColorStop(0, cfg.bg + 'ee');
            bgG.addColorStop(.7, cfg.bg + 'cc');
            bgG.addColorStop(1, '#020204dd');
            ctx.beginPath(); ctx.arc(cx, cy, size * .5, 0, Math.PI * 2);
            ctx.fillStyle = bgG; ctx.fill();
            ctx.restore();

            // outer halo (outside clip is fine — transparent)
            const pulse = .2 + Math.sin(t * .04 + phase) * .1;
            const halo = ctx.createRadialGradient(cx, cy, R * .7, cx, cy, R * 1.8);
            halo.addColorStop(0, `rgba(${rg},${gg},${bg2},${pulse * 2})`);
            halo.addColorStop(.5, `rgba(${rg},${gg},${bg2},${pulse})`);
            halo.addColorStop(1, `rgba(${rg},${gg},${bg2},0)`);
            ctx.beginPath(); ctx.arc(cx, cy, R * 1.8, 0, Math.PI * 2);
            ctx.fillStyle = halo; ctx.fill();

            // element decoration
            if (cfg.element === 'fire' || cfg.element === 'chaos') drawFlameLayer(ctx, cx, cy, R, cfg.c1, cfg.c2, cfg.c3, t, 1.6 + (cfg.element === 'chaos' ? 1.2 : 0));
            if (cfg.element === 'ice') drawIceCrystals(ctx, cx, cy, R, cfg.c2, cfg.c3, t, phase);
            if (cfg.element === 'lightning') drawLightning(ctx, cx, cy, R, cfg.c2, cfg.c3, t, phase);
            if (cfg.element === 'void') drawVoidTentacles(ctx, cx, cy, R, cfg.c1, cfg.c2, t, phase);
            if (cfg.element === 'nature') drawNatureVines(ctx, cx, cy, R, cfg.c1, cfg.c2, cfg.c3, t, phase);
            if (cfg.element === 'holy') drawHolyRunes(ctx, cx, cy, R, cfg.c2, cfg.c3, t, phase);
            if (cfg.element === 'iron') drawIronOrnaments(ctx, cx, cy, R, cfg.c2, cfg.c3, t, phase);

            // === MAIN RING ===
            // fat glow
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${rg},${gg},${bg2},.6)`; ctx.lineWidth = 12; ctx.stroke();
            // mid glow
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${r2},${g2},${b2},.5)`; ctx.lineWidth = 6; ctx.stroke();
            // sharp ring
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${r3},${g3},${b3},.98)`; ctx.lineWidth = 2; ctx.stroke();
            // inner accent ring
            ctx.beginPath(); ctx.arc(cx, cy, R - 6, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${r2},${g2},${b2},.3)`; ctx.lineWidth = 1; ctx.stroke();

            // chase arcs
            const chaseSpeed = cfg.element === 'lightning' ? .06 : .02;
            for (let i = 0; i < 3; i++) {
                const aS = t * chaseSpeed + (i / 3) * Math.PI * 2 + phase;
                const aL = cfg.element === 'chaos' ? Math.PI * .65 : Math.PI * .28;
                // arc glow
                ctx.beginPath(); ctx.arc(cx, cy, R, aS, aS + aL);
                ctx.strokeStyle = `rgba(${r2},${g2},${b2},.4)`; ctx.lineWidth = 8; ctx.stroke();
                // arc bright
                ctx.beginPath(); ctx.arc(cx, cy, R, aS, aS + aL);
                ctx.strokeStyle = `rgba(${r3},${g3},${b3},.95)`; ctx.lineWidth = 3; ctx.stroke();
                // leading edge spark
                const sparkX = cx + Math.cos(aS) * R, sparkY = cy + Math.sin(aS) * R;
                const sg = ctx.createRadialGradient(sparkX, sparkY, 0, sparkX, sparkY, 8);
                sg.addColorStop(0, `rgba(255,255,255,.9)`);
                sg.addColorStop(.4, `rgba(${r3},${g3},${b3},.6)`);
                sg.addColorStop(1, `rgba(${r3},${g3},${b3},0)`);
                ctx.beginPath(); ctx.arc(sparkX, sparkY, 8, 0, Math.PI * 2); ctx.fillStyle = sg; ctx.fill();
            }

            // embers with trails
            embersRef.current.forEach(p => {
                p.angle += p.speed;
                p.r += Math.sin(t * .03 + p.drift) * .4;
                p.alpha += p.alphaSpd * p.alphaDir;
                if (p.alpha > 1) { p.alpha = 1; p.alphaDir = -1; } if (p.alpha < .05) { p.alpha = .05; p.alphaDir = 1; }
                p.trail.push({ x: cx + Math.cos(p.angle) * p.r, y: cy + Math.sin(p.angle) * p.r });
                if (p.trail.length > 20) p.trail.shift();
                for (let i = 1; i < p.trail.length; i++) {
                    const ta = (i / p.trail.length);
                    ctx.beginPath(); ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y); ctx.lineTo(p.trail[i].x, p.trail[i].y);
                    ctx.strokeStyle = `rgba(${r3},${g3},${b3},${ta * p.alpha * .8})`;
                    ctx.lineWidth = p.size * ta * 1.2; ctx.stroke();
                }
                const px = cx + Math.cos(p.angle) * p.r, py = cy + Math.sin(p.angle) * p.r;
                const dg = ctx.createRadialGradient(px, py, 0, px, py, p.size * 3);
                dg.addColorStop(0, `rgba(255,255,255,${p.alpha * .8})`);
                dg.addColorStop(.3, `rgba(${r3},${g3},${b3},${p.alpha})`);
                dg.addColorStop(1, `rgba(${r3},${g3},${b3},0)`);
                ctx.beginPath(); ctx.arc(px, py, p.size * 3, 0, Math.PI * 2); ctx.fillStyle = dg; ctx.fill();
            });

            // fire/chaos particles
            particlesRef.current.forEach(p => {
                if (p.reset || p.life <= 0) {
                    const a = Math.random() * Math.PI * 2, rv = R * (.9 + Math.random() * .18);
                    p.x = cx + Math.cos(a) * rv; p.y = cy + Math.sin(a) * rv;
                    const outA = a + Math.PI + (Math.random() - .5) * .9;
                    const spd = .5 + Math.random() * 1.5;
                    p.vx = Math.cos(outA) * spd; p.vy = Math.sin(outA) * spd;
                    p.maxLife = 18 + Math.floor(Math.random() * 28); p.life = p.maxLife;
                    p.size = 2 + Math.random() * 3.5; p.reset = false;
                }
                p.life--; p.x += p.vx; p.y += p.vy; p.vy -= .05; p.vx *= .96;
                const frac = p.life / p.maxLife;
                const dg2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
                dg2.addColorStop(0, `rgba(255,255,220,${frac * .95})`);
                dg2.addColorStop(.3, `rgba(${r3},${g3},${b3},${frac * .8})`);
                dg2.addColorStop(.7, `rgba(${r2},${g2},${b2},${frac * .4})`);
                dg2.addColorStop(1, `rgba(${r1},${g1},${b1},0)`);
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.2 + frac * .5), 0, Math.PI * 2); ctx.fillStyle = dg2; ctx.fill();
            });

            // === AVATAR CENTER ===
            // dark bg circle
            const avG = ctx.createRadialGradient(cx - R * .15, cy - R * .15, R * .05, cx, cy, R * .72);
            avG.addColorStop(0, '#252840'); avG.addColorStop(.6, cfg.bg); avG.addColorStop(1, '#06060e');
            ctx.beginPath(); ctx.arc(cx, cy, R * .72, 0, Math.PI * 2); ctx.fillStyle = avG; ctx.fill();
            // inner glow ring
            const hlG = ctx.createLinearGradient(cx - R * .72, cy - R * .72, cx + R * .72, cy + R * .72);
            hlG.addColorStop(0, `rgba(${r3},${g3},${b3},.5)`);
            hlG.addColorStop(.5, `rgba(${r3},${g3},${b3},.08)`);
            hlG.addColorStop(1, `rgba(${r2},${g2},${b2},.4)`);
            ctx.beginPath(); ctx.arc(cx, cy, R * .72, 0, Math.PI * 2); ctx.strokeStyle = hlG; ctx.lineWidth = 2.5; ctx.stroke();
            // subtle inner ring
            ctx.beginPath(); ctx.arc(cx, cy, R * .62, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${r2},${g2},${b2},.12)`; ctx.lineWidth = 1; ctx.stroke();
            // letter with glow
            const fs = Math.round(R * .62);
            ctx.font = `700 ${fs}px -apple-system,BlinkMacSystemFont,sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.shadowColor = `rgba(${rg},${gg},${bg2},.95)`; ctx.shadowBlur = 20;
            ctx.fillStyle = `rgba(${r3},${g3},${b3},.98)`;
            ctx.fillText(name?.[0]?.toUpperCase() ?? '?', cx, cy + 1);
            // second pass for brighter glow
            ctx.shadowBlur = 8; ctx.fillStyle = `rgba(255,255,255,.4)`;
            ctx.fillText(name?.[0]?.toUpperCase() ?? '?', cx, cy + 1);
            ctx.shadowBlur = 0;

            rafRef.current = requestAnimationFrame(draw);
        };

        rafRef.current = requestAnimationFrame(draw);
        return () => { animRunning = false; cancelAnimationFrame(rafRef.current); };
    }, [tier, name, size]);

    return (
        <canvas
            ref={canvasRef}
            style={{ width: size, height: size, flexShrink: 0 }}
            className={className}
        />
    );
}