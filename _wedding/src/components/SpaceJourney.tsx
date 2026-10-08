'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/context/LocaleContext';
import { ArrowLeft, Globe, Pause, Play, RotateCcw, Rocket } from 'lucide-react';

// Cinematic timeline: deep space -> Jupiter -> Saturn -> Mars -> Earth -> Castelul Cantacuzino
const SEGMENTS = [
  { start: 0.0, end: 0.16, dur: 10 },
  { start: 0.16, end: 0.34, dur: 11 },
  { start: 0.34, end: 0.52, dur: 12 },
  { start: 0.52, end: 0.66, dur: 9 },
  { start: 0.66, end: 0.88, dur: 13 },
  { start: 0.88, end: 1.0, dur: 9 },
];

// HUD anchors (km to the castle, km/s) sampled at each segment start
const DIST_KM = [4.0e12, 7.8e8, 1.43e9, 2.3e8, 3.9e5, 0];
const VEL_KMS = [36000, 74, 46, 32, 11, 0];
// Starfield warp speed (z units/s) per segment
const STAR_SPEED = [0.85, 0.3, 0.22, 0.16, 0.08, 0.02];
// [center, edge] background tint per segment
const BG = [
  ['#070a1c', '#010207'],
  ['#1a1208', '#060301'],
  ['#181309', '#050402'],
  ['#1d0b06', '#070201'],
  ['#07131f', '#010409'],
  ['#08110a', '#010302'],
];

const TAU = Math.PI * 2;

type Units = {
  ly: string;
  billionKm: string;
  millionKm: string;
  thousandKm: string;
  km: string;
  m: string;
};

type Star = { x: number; y: number; z: number; tw: number };

function hexMix(a: string, b: string, k: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (u: number) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

function segAt(p: number): { idx: number; u: number } {
  for (let i = 0; i < SEGMENTS.length; i++) {
    if (p <= SEGMENTS[i].end || i === SEGMENTS.length - 1) {
      const s = SEGMENTS[i];
      return { idx: i, u: clamp01((p - s.start) / (s.end - s.start)) };
    }
  }
  return { idx: 0, u: 0 };
}

function formatDistance(km: number, units: Units, locale: string): string {
  const nf = new Intl.NumberFormat(locale === 'ro' ? 'ro-RO' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const m = nf.format;
  if (km >= 1e12) return `${m(km / 9.461e12)} ${units.ly}`;
  if (km >= 1e9) return `${m(km / 1e9)} ${units.billionKm}`;
  if (km >= 1e6) return `${m(km / 1e6)} ${units.millionKm}`;
  if (km >= 1e3) return `${m(km / 1e3)} ${units.thousandKm}`;
  if (km >= 1) return `${m(km)} ${units.km}`;
  return `${m(km * 1000)} ${units.m}`;
}

function formatVelocity(kms: number, locale: string): string {
  const nf = new Intl.NumberFormat(locale === 'ro' ? 'ro-RO' : 'en-US', {
    maximumFractionDigits: kms >= 100 ? 0 : 1,
  });
  return `${nf.format(kms)} km/s`;
}

// Deterministic pseudo-noise for procedural ridges / blobs
function noise(i: number, seed: number): number {
  const v = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

// Castle window rectangles, in castle-local units (origin = castle base center)
const CASTLE_WINDOWS: [number, number, number, number][] = [];
for (let i = 0; i < 5; i++) {
  const x = -58 + i * 14;
  if (Math.abs(x) > 6) CASTLE_WINDOWS.push([x, -36, 7, 11]);
}
for (let i = 0; i < 4; i++) {
  const x = -51 + i * 14;
  if (Math.abs(x) > 6) CASTLE_WINDOWS.push([x, -20, 7, 11]);
}
CASTLE_WINDOWS.push([-90, -52, 6, 9], [-90, -30, 6, 9]);
CASTLE_WINDOWS.push([84, -52, 6, 9], [84, -30, 6, 9]);
CASTLE_WINDOWS.push([-11, -74, 6, 9], [5, -74, 6, 9]);

export default function SpaceJourney() {
  const { locale, toggleLocale, dict } = useLocale();
  const j = dict.journey;

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const distRef = useRef<HTMLSpanElement>(null);
  const velRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [segIdx, setSegIdx] = useState(0);

  const startedRef = useRef(started);
  const playingRef = useRef(playing);
  const pRef = useRef(0);
  const pTargetRef = useRef(0);
  const boostRef = useRef(0);
  const idxRef = useRef(0);
  const unitsRef = useRef<Units>(j.units);
  const localeRef = useRef(locale);
  unitsRef.current = j.units;
  localeRef.current = locale;

  const begin = () => {
    setStarted(true);
    setPlaying(true);
    startedRef.current = true;
    playingRef.current = true;
  };

  const restart = () => {
    pRef.current = 0;
    pTargetRef.current = 0;
    boostRef.current = 0;
    setStarted(true);
    setPlaying(true);
    startedRef.current = true;
    playingRef.current = true;
  };

  const jumpTo = (i: number) => {
    pTargetRef.current = Math.min(0.999, SEGMENTS[i].start + 0.004);
    begin();
  };

  const togglePlay = () => {
    setPlaying((prev) => {
      playingRef.current = !prev;
      return !prev;
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      playingRef.current = false;
      setPlaying(false);
    }

    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = wrap.clientWidth;
      h = wrap.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const stars: Star[] = [];
    for (let i = 0; i < 420; i++) {
      stars.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random(), tw: Math.random() * TAU });
    }

    // ---- drawing helpers -------------------------------------------------

    const sphere = (x: number, y: number, r: number, texture: () => void, rim?: string) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.clip();
      texture();
      const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.1, x, y, r * 1.05);
      g.addColorStop(0, 'rgba(255,255,255,0.10)');
      g.addColorStop(0.55, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.66)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.restore();
      if (rim) {
        ctx.save();
        ctx.strokeStyle = rim;
        ctx.lineWidth = 2;
        ctx.shadowColor = rim;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    };

    // Horizontal bands with wavy edges (gas-giant look)
    const bands = (x: number, y: number, r: number, cols: string[], phase: number) => {
      const n = cols.length;
      const sh = (r * 2) / n;
      const amp = r * 0.028;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = cols[i];
        ctx.beginPath();
        const yTop = (xx: number) => y - r + i * sh + Math.sin(xx / r * 7 + phase + i * 1.7) * amp;
        ctx.moveTo(x - r, yTop(x - r));
        for (let xx = x - r; xx <= x + r; xx += 12) ctx.lineTo(xx, yTop(xx));
        const yBot = (xx: number) => y - r + (i + 1) * sh + Math.sin(xx / r * 7 + phase + (i + 1) * 1.7) * amp;
        for (let xx = x + r; xx >= x - r; xx -= 12) ctx.lineTo(xx, yBot(xx));
        ctx.closePath();
        ctx.fill();
      }
    };

    const blob = (x: number, y: number, rx: number, ry: number, seed: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let a = 0; a <= TAU + 0.1; a += 0.5) {
        const wob = 0.75 + noise(Math.round(a * 10), seed) * 0.5;
        const px = x + Math.cos(a) * rx * wob;
        const py = y + Math.sin(a) * ry * wob;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    };

    // Ship path per segment (fractions of viewport)
    const shipPos = (idx: number, u: number): { x: number; y: number } => {
      const P: [number, number, number, number, number][] = [
        [0.5, 0.68, 0.53, 0.62, 0.02],
        [0.22, 0.8, 0.68, 0.26, 0.12],
        [0.82, 0.74, 0.26, 0.42, 0.08],
        [0.74, 0.64, 0.4, 0.36, 0.1],
        [0.58, 0.66, 0.5, 0.58, 0.04],
        [0.5, 0.62, 0.5, 0.62, 0],
      ];
      const [x0, y0, x1, y1, arc] = P[idx];
      return {
        x: lerp(x0, x1, u) * w,
        y: lerp(y0, y1, u) * h - Math.sin(u * Math.PI) * arc * h,
      };
    };

    const trail: { x: number; y: number; a: number }[] = [];

    const drawShip = (pos: { x: number; y: number }, heading: number, s: number, thrust: number) => {
      trail.push({ x: pos.x, y: pos.y, a: 1 });
      if (trail.length > 26) trail.shift();
      for (const t of trail) {
        t.a *= 0.9;
        ctx.fillStyle = `rgba(212,179,88,${(t.a * 0.25).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.a * 7 * s, 0, TAU);
        ctx.fill();
      }
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(heading + Math.PI / 2);
      ctx.scale(s, s);
      // engine glow
      const eg = ctx.createRadialGradient(0, 14, 0, 0, 14, 16 * thrust);
      eg.addColorStop(0, 'rgba(255,230,170,0.95)');
      eg.addColorStop(0.4, 'rgba(230,150,60,0.55)');
      eg.addColorStop(1, 'rgba(230,120,40,0)');
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(0, 14, 16 * thrust, 0, TAU);
      ctx.fill();
      // fins
      ctx.fillStyle = '#78716c';
      ctx.beginPath();
      ctx.moveTo(-6, 4);
      ctx.lineTo(-12, 13);
      ctx.lineTo(-5, 10);
      ctx.moveTo(6, 4);
      ctx.lineTo(12, 13);
      ctx.lineTo(5, 10);
      ctx.fill();
      // hull
      const hg = ctx.createLinearGradient(-6, 0, 6, 0);
      hg.addColorStop(0, '#e7e5e4');
      hg.addColorStop(0.5, '#a8a29e');
      hg.addColorStop(1, '#57534e');
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.moveTo(0, -17);
      ctx.lineTo(6, -3);
      ctx.lineTo(6, 10);
      ctx.lineTo(-6, 10);
      ctx.lineTo(-6, -3);
      ctx.closePath();
      ctx.fill();
      // cockpit
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, -6, 2.4, 0, TAU);
      ctx.fill();
      ctx.restore();
    };

    // ---- per-segment scenes ------------------------------------------------

    const drawJupiter = (u: number) => {
      const x = lerp(w * 1.35, w * 0.22, easeInOut(u));
      const y = lerp(h * 0.88, h * 0.5, u);
      const r = h * 0.62;
      const phase = u * 3;
      sphere(
        x, y, r,
        () => {
          bands(
            x, y, r,
            ['#e5cfa5', '#c99a68', '#f0e2c4', '#a9744b', '#dcbb8c', '#8f5e3a', '#e8d3aa', '#bf8f5f', '#f2e6cc', '#a5714a', '#d8b384', '#94623c', '#eadaba'],
            phase
          );
          const sx = x - r * 0.5 + Math.sin(u * 2.4 + 1) * r * 0.3;
          ctx.fillStyle = '#b4552e';
          ctx.beginPath();
          ctx.ellipse(sx, y + r * 0.24, r * 0.21, r * 0.115, 0, 0, TAU);
          ctx.fill();
          ctx.strokeStyle = 'rgba(240,210,170,0.7)';
          ctx.lineWidth = r * 0.02;
          ctx.stroke();
        },
        'rgba(255,224,170,0.22)'
      );
    };

    const drawSaturn = (u: number, now: number) => {
      const x = lerp(w * -0.28, w * 0.6, easeInOut(u));
      const y = lerp(h * 0.34, h * 0.56, u);
      const r = h * 0.3;
      const fl = 0.04 + 0.5 * Math.abs(Math.cos(u * Math.PI));
      const rot = -0.16;
      const ringBands: [number, number, number][] = [
        [1.32, 0.1, 0.5],
        [1.52, 0.16, 0.72],
        [1.72, 0.055, 0.3],
        [1.9, 0.13, 0.62],
      ];
      const drawRingHalf = (front: boolean) => {
        for (const [k, wRatio, alpha] of ringBands) {
          ctx.strokeStyle = `rgba(226,209,168,${alpha})`;
          ctx.lineWidth = r * wRatio;
          ctx.beginPath();
          ctx.ellipse(x, y, r * k, r * k * fl, rot, front ? 0 : Math.PI, front ? Math.PI : TAU);
          ctx.stroke();
        }
      };
      drawRingHalf(false);
      sphere(
        x, y, r,
        () => bands(x, y, r, ['#efe4c6', '#d9c69b', '#e9dcb8', '#c2ab7e', '#f2e9d0', '#cdbb90', '#e4d5ab', '#b89f74'], u * 2),
        'rgba(240,225,180,0.18)'
      );
      drawRingHalf(true);
      // Titan
      const ta = now * 0.00035 + 2;
      ctx.fillStyle = '#e0a45c';
      ctx.shadowColor = '#e0a45c';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(x + Math.cos(ta) * r * 2.7, y + Math.sin(ta) * r * 2.7 * fl * 1.6, h * 0.011, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const drawMars = (u: number) => {
      const x = lerp(w * 1.3, w * 0.32, easeInOut(u));
      const y = lerp(h * 0.3, h * 0.62, u);
      const r = h * 0.26;
      sphere(
        x, y, r,
        () => {
          const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.15, x, y, r);
          g.addColorStop(0, '#d2773f');
          g.addColorStop(0.6, '#a8542f');
          g.addColorStop(1, '#7a3b25');
          ctx.fillStyle = g;
          ctx.fillRect(x - r, y - r, r * 2, r * 2);
          blob(x - r * 0.2, y + r * 0.1, r * 0.55, r * 0.24, 3, 'rgba(70,34,22,0.55)');
          blob(x + r * 0.45, y - r * 0.25, r * 0.3, r * 0.18, 8, 'rgba(90,44,28,0.5)');
          ctx.fillStyle = 'rgba(245,240,235,0.85)';
          ctx.beginPath();
          ctx.ellipse(x, y - r * 0.88, r * 0.5, r * 0.16, 0, 0, TAU);
          ctx.fill();
          ctx.fillStyle = 'rgba(245,240,235,0.55)';
          ctx.beginPath();
          ctx.ellipse(x + r * 0.1, y + r * 0.94, r * 0.32, r * 0.1, 0, 0, TAU);
          ctx.fill();
          ctx.fillStyle = 'rgba(214,140,90,0.1)';
          ctx.fillRect(x - r, y - r, r * 2, r * 2);
        },
        'rgba(255,170,110,0.18)'
      );
    };

    const drawEarth = (u: number, now: number) => {
      const zoomU = (u - 0.52) / 0.48;
      if (zoomU < 0) {
        const x = lerp(w * 1.25, w * 0.5, easeInOut(u / 0.52));
        const y = lerp(h * 0.75, h * 0.48, easeInOut(u / 0.52));
        const r = lerp(h * 0.16, h * 0.42, easeInOut(u / 0.52));
        sphere(
          x, y, r,
          () => {
            const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.12, x, y, r);
            g.addColorStop(0, '#4d8ec2');
            g.addColorStop(0.55, '#25618f');
            g.addColorStop(1, '#0f3557');
            ctx.fillStyle = g;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
            const drift = u * r * 0.9;
            blob(x - r * 0.35 + drift * 0.2, y - r * 0.3, r * 0.4, r * 0.26, 2, '#41703f');
            blob(x + r * 0.1 + drift * 0.2, y - r * 0.05, r * 0.28, r * 0.38, 5, '#7c6f45');
            blob(x - r * 0.1 + drift * 0.2, y + r * 0.45, r * 0.22, r * 0.2, 9, '#3c6b3e');
            blob(x + r * 0.55 + drift * 0.2, y + r * 0.3, r * 0.3, r * 0.22, 11, '#86774d');
            for (let i = 0; i < 7; i++) {
              ctx.strokeStyle = 'rgba(255,255,255,0.32)';
              ctx.lineWidth = r * 0.06;
              ctx.beginPath();
              const cy2 = y - r + (i / 7) * r * 2 + noise(i, 4) * r * 0.25;
              ctx.arc(x - r * 0.3 + noise(i, 7) * r, cy2, r * (0.35 + noise(i, 2) * 0.4), 0.15 * Math.PI, 0.85 * Math.PI);
              ctx.stroke();
            }
            const term = ctx.createLinearGradient(x + r * 0.1, 0, x + r, 0);
            term.addColorStop(0, 'rgba(4,10,22,0)');
            term.addColorStop(1, 'rgba(4,10,22,0.8)');
            ctx.fillStyle = term;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
          },
          'rgba(150,200,255,0.2)'
        );
        // Moon
        const ma = u * 5 + 2.4;
        const mx = x + Math.cos(ma) * r * 2.1;
        const my = y + Math.sin(ma) * r * 0.6;
        sphere(mx, my, r * 0.12, () => {
          ctx.fillStyle = '#a8a29e';
          ctx.fillRect(mx - r, my - r, r * 2, r * 2);
          blob(mx - r * 0.03, my, r * 0.04, r * 0.05, 6, 'rgba(80,80,80,0.5)');
        });
        return;
      }
      // Google-Earth style telescoping descent into the Prahova Valley
      const t = clamp01(zoomU);
      const S = 1 + 190 * t * t * t;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#16281b');
      g.addColorStop(1, '#0a1610');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      // mountain ridges rushing outward as we zoom
      for (let layer = 0; layer < 5; layer++) {
        const depth = (layer + 1) / 5;
        const amp = h * 0.16 * depth * S;
        const shade = 26 + layer * 9;
        ctx.fillStyle = `rgb(${Math.round(shade * 0.8)},${Math.round(shade * 1.5)},${Math.round(shade * 1.05)})`;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let xx = 0; xx <= w; xx += 14) {
          const n = Math.sin(xx / w * 6 + layer * 2.2) * 0.5 + Math.sin(xx / w * 15 + layer * 5.1) * 0.3 + noise(Math.floor(xx / 14), layer + 1) * 0.35;
          ctx.lineTo(xx, cy + h * 0.12 * depth + amp * (0.5 - n));
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
      }
      // Prahova river
      ctx.strokeStyle = `rgba(190,215,230,${0.15 + t * 0.4})`;
      ctx.lineWidth = Math.max(1, 2 + t * 4);
      ctx.beginPath();
      for (let yy = cy; yy <= h; yy += 10) {
        const k = (yy - cy) / (h - cy);
        ctx.lineTo(cx + Math.sin(k * 5) * w * 0.06 * (0.2 + k * S * 0.05), yy);
      }
      ctx.stroke();
      // target reticle over the castle
      const pulse = (now * 0.002) % 1;
      ctx.strokeStyle = '#d4b358';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#d4b358';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(cx, cy + h * 0.1, 14, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1 - pulse;
      ctx.beginPath();
      ctx.arc(cx, cy + h * 0.1, 14 + pulse * 46, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(cx - 26, cy + h * 0.1);
      ctx.lineTo(cx + 26, cy + h * 0.1);
      ctx.moveTo(cx, cy + h * 0.1 - 26);
      ctx.lineTo(cx, cy + h * 0.1 + 26);
      ctx.stroke();
    };

    const ridgeY = (xx: number, base: number, amp: number, seed: number) =>
      base +
      Math.sin(xx * 0.004 + seed) * amp * 0.5 +
      Math.sin(xx * 0.013 + seed * 2.3) * amp * 0.3 +
      noise(Math.floor(xx / 40), seed) * amp * 0.35;

    const drawArrival = (u: number, now: number) => {
      const a = clamp01(u / 0.18);
      ctx.globalAlpha = a;
      const s = Math.min(w, h) / 700;
      const cx = w * 0.5;
      const moonX = w * 0.78;
      const moonY = h * 0.18;
      const moonR = Math.min(w, h) * 0.045;
      // moon
      ctx.fillStyle = 'rgba(232,230,223,0.9)';
      ctx.shadowColor = 'rgba(232,230,223,0.5)';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = hexMix(BG[5][0], BG[5][1], 0.4);
      ctx.beginPath();
      ctx.arc(moonX + moonR * 0.42, moonY - moonR * 0.22, moonR * 0.88, 0, TAU);
      ctx.fill();
      // mountain layers
      const layers: [number, string][] = [
        [h * 0.46, '#173429'],
        [h * 0.55, '#10281e'],
      ];
      for (const [base, col] of layers) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let xx = 0; xx <= w; xx += 24) ctx.lineTo(xx, ridgeY(xx, base, h * 0.09, base));
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
      }
      const nearBase = h * 0.66;
      const castleGround = ridgeY(cx, nearBase, h * 0.07, nearBase);
      ctx.fillStyle = '#0a1f16';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let xx = 0; xx <= w; xx += 24) ctx.lineTo(xx, ridgeY(xx, nearBase, h * 0.07, nearBase));
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      // castle silhouette
      ctx.save();
      ctx.translate(cx, castleGround);
      ctx.scale(s, s);
      ctx.fillStyle = '#060f0a';
      ctx.fillRect(-70, -46, 140, 46);
      ctx.beginPath();
      ctx.moveTo(-72, -46);
      ctx.lineTo(0, -46);
      ctx.lineTo(-36, -78);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -46);
      ctx.lineTo(72, -46);
      ctx.lineTo(36, -78);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-16, -86, 32, 40);
      ctx.beginPath();
      ctx.moveTo(-24, -86);
      ctx.lineTo(24, -86);
      ctx.lineTo(0, -126);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-96, -64, 26, 64);
      ctx.beginPath();
      ctx.moveTo(-102, -64);
      ctx.lineTo(-64, -64);
      ctx.lineTo(-83, -100);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(70, -64, 26, 64);
      ctx.beginPath();
      ctx.moveTo(64, -64);
      ctx.lineTo(102, -64);
      ctx.lineTo(83, -100);
      ctx.closePath();
      ctx.fill();
      // pennant
      ctx.strokeStyle = '#060f0a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -126);
      ctx.lineTo(0, -142);
      ctx.stroke();
      ctx.fillStyle = '#d4b358';
      ctx.beginPath();
      const flag = Math.sin(now * 0.004) * 2;
      ctx.moveTo(0, -142);
      ctx.lineTo(16 + flag, -138);
      ctx.lineTo(0, -134);
      ctx.closePath();
      ctx.fill();
      // windows lighting up
      const lit = Math.floor(clamp01((u - 0.2) / 0.55) * CASTLE_WINDOWS.length);
      ctx.shadowColor = '#e8c77a';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#e8c77a';
      for (let i = 0; i < lit; i++) {
        const [wx, wy, ww, wh] = CASTLE_WINDOWS[i];
        ctx.fillRect(wx, wy, ww, wh);
      }
      // door
      if (lit > CASTLE_WINDOWS.length / 2) {
        ctx.beginPath();
        ctx.rect(-7, -22, 14, 22);
        ctx.fill();
      }
      ctx.restore();
      // pines
      ctx.fillStyle = '#040a07';
      for (let i = 0; i < 26; i++) {
        const px = (i / 26 + noise(i, 12) * 0.03) * w;
        const ph = (34 + noise(i, 13) * 70) * s;
        const gy = ridgeY(px, nearBase + 40, h * 0.06, nearBase + 40);
        ctx.beginPath();
        ctx.moveTo(px - ph * 0.3, gy + 60);
        ctx.lineTo(px, gy - ph);
        ctx.lineTo(px + ph * 0.3, gy + 60);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    // ---- main loop ----------------------------------------------------------

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // progress integration
      if (startedRef.current && playingRef.current) {
        const cur = segAt(pTargetRef.current);
        const seg = SEGMENTS[cur.idx];
        pTargetRef.current = Math.min(1, pTargetRef.current + (dt * (seg.end - seg.start)) / seg.dur);
      }
      boostRef.current *= Math.exp(-dt * 2);
      pRef.current += (pTargetRef.current - pRef.current) * Math.min(1, dt * 3.2);
      const p = clamp01(pRef.current);
      const { idx, u } = segAt(p);
      if (idx !== idxRef.current) {
        idxRef.current = idx;
        setSegIdx(idx);
      }
      if (pTargetRef.current >= 1 && playingRef.current) {
        playingRef.current = false;
        setPlaying(false);
      }

      // HUD readouts
      const aKm = DIST_KM[idx];
      const bKm = idx + 1 < DIST_KM.length ? DIST_KM[idx + 1] : 0;
      const distKm =
        idx === SEGMENTS.length - 1
          ? (1 - easeInOut(u)) * aKm
          : bKm > 0
            ? Math.exp(Math.log(aKm) + (Math.log(bKm) - Math.log(aKm)) * easeInOut(u))
            : aKm * (1 - easeInOut(u));
      const vel = idx === SEGMENTS.length - 1 ? VEL_KMS[idx - 1] * (1 - easeInOut(u)) : lerp(VEL_KMS[idx], VEL_KMS[idx + 1], easeInOut(u));
      if (distRef.current) distRef.current.textContent = formatDistance(Math.max(0, distKm), unitsRef.current, localeRef.current);
      if (velRef.current) velRef.current.textContent = formatVelocity(vel, localeRef.current);
      if (barRef.current) barRef.current.style.width = `${(p * 100).toFixed(2)}%`;

      // background: blend tints across segment seams
      let bgc: [string, string] = [BG[idx][0], BG[idx][1]];
      if (u < 0.2 && idx > 0) {
        const k = u / 0.2;
        bgc = [hexMix(BG[idx - 1][0], BG[idx][0], k), hexMix(BG[idx - 1][1], BG[idx][1], k)];
      }
      const bg = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, Math.max(w, h) * 0.75);
      bg.addColorStop(0, bgc[0]);
      bg.addColorStop(1, bgc[1]);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // warp starfield
      const speed = (STAR_SPEED[idx] + boostRef.current) * (startedRef.current ? 1 : 0.25);
      const f = Math.min(w, h) * 0.6;
      const cxS = w * 0.5;
      const cyS = h * 0.45;
      ctx.lineCap = 'round';
      for (const st of stars) {
        st.z -= speed * dt * (0.5 + (1 - st.z) * 0.8);
        if (st.z <= 0.025) {
          st.x = Math.random() * 2 - 1;
          st.y = Math.random() * 2 - 1;
          st.z = 1;
        }
        const px = cxS + (st.x / st.z) * f;
        const py = cyS + (st.y / st.z) * f;
        const pz = st.z + speed * dt * 2.2;
        const px2 = cxS + (st.x / pz) * f;
        const py2 = cyS + (st.y / pz) * f;
        if (px < -60 || px > w + 60 || py < -60 || py > h + 60) continue;
        const twk = 0.75 + 0.25 * Math.sin(now * 0.0018 + st.tw);
        const alpha = Math.min(1, (1 - st.z) * 0.85 + 0.12) * twk;
        ctx.strokeStyle = `rgba(235,238,248,${alpha.toFixed(3)})`;
        ctx.lineWidth = (1 - st.z) * 1.5 + 0.4;
        ctx.beginPath();
        ctx.moveTo(px2, py2);
        ctx.lineTo(px, py);
        ctx.stroke();
      }

      if (idx === 0) {
        // the Sun ahead: a bright point growing as we fall toward it
        const sx = w * 0.5;
        const sy = h * 0.42;
        const r = 2 + 5 * u;
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 26 + 130 * u);
        glow.addColorStop(0, `rgba(255,244,214,${0.5 + 0.35 * u})`);
        glow.addColorStop(0.25, 'rgba(255,220,150,0.28)');
        glow.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, sy, 26 + 130 * u, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#fff8e7';
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, TAU);
        ctx.fill();
      } else if (idx === 1) drawJupiter(u);
      else if (idx === 2) drawSaturn(u, now);
      else if (idx === 3) drawMars(u);
      else if (idx === 4) drawEarth(u, now);
      else drawArrival(u, now);

      // ship
      if (idx <= 3 || (idx === 4 && u < 0.5)) {
        const pos = shipPos(idx, u);
        const a = shipPos(idx, Math.max(0, u - 0.02));
        const b = shipPos(idx, Math.min(1, u + 0.02));
        const heading = Math.atan2(b.y - a.y, b.x - a.x);
        const sScale = idx === 4 ? 1 - u * 1.8 : 1;
        const thrust = reduceMotion ? 0.7 : 0.85 + 0.3 * Math.sin(now * 0.02);
        if (sScale > 0.05) drawShip(pos, heading, Math.max(0.05, sScale), thrust);
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // ---- input -------------------------------------------------------------

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      startedRef.current = true;
      setStarted(true);
      pTargetRef.current = clamp01(pTargetRef.current + e.deltaY * 0.00016);
      boostRef.current = Math.min(0.5, boostRef.current + Math.abs(e.deltaY) * 0.0018);
    };
    let dragY: number | null = null;
    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('a,button')) return;
      dragY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (dragY === null) return;
      const dy = e.clientY - dragY;
      dragY = e.clientY;
      startedRef.current = true;
      setStarted(true);
      pTargetRef.current = clamp01(pTargetRef.current - dy * 0.0022);
    };
    const onPointerUp = () => {
      dragY = null;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        pTargetRef.current = clamp01(pTargetRef.current + 0.02);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        pTargetRef.current = clamp01(pTargetRef.current - 0.02);
      } else if (e.key.toLowerCase() === 'r') {
        restart();
      }
    };
    wrap.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wp = j.waypoints[segIdx];

  return (
    <div ref={wrapRef} className="relative h-screen w-full overflow-hidden bg-stone-950 text-stone-100">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full border border-stone-700/80 bg-stone-900/70 px-3 py-1.5 text-xs uppercase tracking-wider text-stone-300 backdrop-blur-sm transition-colors hover:border-gold-500/50 hover:text-gold-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {j.back}
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 font-mono text-[11px] tracking-widest text-gold-400/80 sm:flex">
            <Rocket className="h-3.5 w-3.5" />
            {j.ship}
          </span>
          <button
            onClick={toggleLocale}
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-stone-700/80 bg-stone-900/70 px-3 py-1.5 text-xs font-medium tracking-wider text-stone-200 backdrop-blur-sm transition-all hover:bg-stone-800 hover:text-gold-400"
            aria-label="Toggle language"
          >
            <Globe className="h-3.5 w-3.5 text-gold-500" />
            <span className={locale === 'en' ? 'font-bold text-gold-400' : 'text-stone-400'}>EN</span>
            <span className="text-stone-600">|</span>
            <span className={locale === 'ro' ? 'font-bold text-gold-400' : 'text-stone-400'}>RO</span>
          </button>
        </div>
      </div>

      {/* Bottom HUD */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 px-4 pb-5">
        {started && (
          <div key={segIdx} className="w-full max-w-xl animate-fadeUp rounded-xl border border-stone-800/90 bg-stone-950/75 px-5 py-4 text-center backdrop-blur-md">
            <h3 className="font-serif text-xl tracking-wide text-gold-300">{wp.name}</h3>
            <p className="mt-1 text-xs leading-relaxed text-stone-300 sm:text-sm">{wp.caption}</p>
          </div>
        )}

        {/* Waypoint chips */}
        <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5">
          {SEGMENTS.map((_, i) => (
            <button
              key={i}
              onClick={() => jumpTo(i)}
              type="button"
              className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors sm:text-[11px] ${
                i === segIdx
                  ? 'border-gold-500/60 bg-gold-500/15 font-semibold text-gold-300'
                  : 'border-stone-700/70 bg-stone-900/60 text-stone-400 hover:border-stone-500 hover:text-stone-200'
              }`}
            >
              {j.waypoints[i].name}
            </button>
          ))}
        </div>

        {/* Telemetry + controls */}
        <div className="flex w-full max-w-3xl flex-wrap items-end justify-between gap-3">
          <div className="rounded-lg border border-stone-800/80 bg-stone-950/70 px-3 py-2 font-mono text-[10px] leading-relaxed tracking-wider text-stone-400 backdrop-blur-sm sm:text-[11px]">
            <div>
              <span className="text-stone-500">{j.hud.destination}: </span>
              <span className="text-emerald-300/90">45.371°N 25.444°E</span>
            </div>
            <div>
              <span className="text-stone-500">{j.hud.distance}: </span>
              <span ref={distRef} className="text-gold-300">—</span>
            </div>
            <div>
              <span className="text-stone-500">{j.hud.velocity}: </span>
              <span ref={velRef} className="text-stone-200">—</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              type="button"
              className="rounded-full border border-stone-700/80 bg-stone-900/70 p-2.5 text-stone-200 backdrop-blur-sm transition-colors hover:border-gold-500/50 hover:text-gold-400"
              aria-label={playing ? j.pause : j.play}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={restart}
              type="button"
              className="rounded-full border border-stone-700/80 bg-stone-900/70 p-2.5 text-stone-200 backdrop-blur-sm transition-colors hover:border-gold-500/50 hover:text-gold-400"
              aria-label={j.restart}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      {started && segIdx < 5 && (
        <p className="pointer-events-none absolute bottom-1 left-1/2 z-10 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.2em] text-stone-600">
          {locale === 'ro' ? 'derulează sau trage pentru a coborî' : 'scroll or drag to descend'}
        </p>
      )}

      {/* Start overlay */}
      {!started && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-stone-950/55 px-4">
          <div className="max-w-2xl animate-fadeUp text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold-500">{j.eyebrow}</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight tracking-wide text-stone-100 sm:text-5xl">{j.title}</h1>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-stone-300 sm:text-base">{j.subtitle}</p>
            <button
              onClick={begin}
              type="button"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold-500/50 bg-carpathian-700 px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone-100 shadow-lg transition-colors hover:bg-carpathian-600"
            >
              <Rocket className="h-4 w-4 text-gold-400" />
              {j.begin}
            </button>
          </div>
        </div>
      )}

      {/* Arrival overlay */}
      <div
        className={`absolute inset-0 z-30 flex items-center justify-center px-4 transition-opacity duration-1000 ${
          segIdx === 5 && started ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="max-w-xl rounded-2xl border border-gold-500/25 bg-stone-950/60 px-8 py-10 text-center backdrop-blur-sm">
          <h2 className="font-serif text-3xl tracking-wide text-gold-300 sm:text-4xl">{j.arrival.title}</h2>
          <p className="mt-3 font-serif text-lg text-stone-100">{j.arrival.venue}</p>
          <p className="mt-1 font-mono text-xs tracking-[0.25em] text-gold-500">{j.arrival.date}</p>
          <p className="mt-4 text-sm italic leading-relaxed text-stone-300">{j.arrival.line}</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-gold-500/50 bg-carpathian-700 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-stone-100 transition-colors hover:bg-carpathian-600"
            >
              {j.arrival.cta}
            </Link>
            <button
              onClick={restart}
              type="button"
              className="flex items-center gap-1.5 rounded-full border border-stone-700 px-5 py-2.5 text-xs uppercase tracking-wider text-stone-300 transition-colors hover:border-gold-500/50 hover:text-gold-400"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {j.restart}
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute inset-x-0 bottom-0 z-20 h-[3px] bg-stone-800/80">
        <div ref={barRef} className="h-full bg-gold-500/80" style={{ width: '0%' }} />
      </div>
    </div>
  );
}
