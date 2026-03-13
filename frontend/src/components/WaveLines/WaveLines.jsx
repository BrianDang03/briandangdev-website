import { useEffect, useRef, useState } from 'react';
import './WaveLines.css';

// ─── constants ────────────────────────────────────────────────────────────
const PI = Math.PI;
const NUM_SEGS = 8;
const FRAME_MS = 16;    // cap at ~60 fps for consistent dt
const SCAN_STOP_MS = 14200; // 500 + 13*130 + 12000 — last line fully swept
const WIND_DOWN_MS = 1200;

// Module-level scratch arrays — zero GC in hot path
const _y = new Float32Array(NUM_SEGS + 1);
const _tan = new Float32Array(NUM_SEGS + 1);

// ─── stream definitions ───────────────────────────────────────────────────
// startYR / endYR = fraction of viewport height from top
// ampR    = wave amplitude as fraction of viewport height
// cycles  = full sine cycles across the viewport width
// phase   = initial phase offset (radians)
// spd     = phase advance speed (rad/s)
// bs / bp = breath speed (rad/s) and initial breath phase — modulates ampR ±18%
const STREAMS = [
    // Layer A — slow background haze
    { startYR: 0.77, endYR: 0.97, ampR: 0.070, cycles: 1.5, phase: 0, color: 'blue', opacity: 0.38, width: 0.70, spd: 0.14, bs: 0.11, bp: 0 },
    { startYR: 0.81, endYR: 1.00, ampR: 0.080, cycles: 1.5, phase: PI * 0.5, color: 'teal', opacity: 0.34, width: 0.65, spd: 0.17, bs: 0.09, bp: PI * 0.7 },
    { startYR: 0.87, endYR: 1.04, ampR: 0.075, cycles: 1.5, phase: PI, color: 'blue', opacity: 0.36, width: 0.65, spd: 0.12, bs: 0.13, bp: PI * 1.3 },
    { startYR: 0.93, endYR: 1.09, ampR: 0.080, cycles: 1.5, phase: PI * 1.5, color: 'teal', opacity: 0.32, width: 0.60, spd: 0.15, bs: 0.10, bp: PI * 0.4 },

    // Layer B — main energy band
    { startYR: 0.79, endYR: 0.98, ampR: 0.090, cycles: 1.5, phase: 0, color: 'blue', opacity: 0.82, width: 1.40, spd: 0.29, bs: 0.17, bp: PI * 0.2 },
    { startYR: 0.82, endYR: 1.00, ampR: 0.095, cycles: 1.5, phase: PI * 0.4, color: 'white', opacity: 0.76, width: 1.20, spd: 0.32, bs: 0.14, bp: PI * 1.1 },
    { startYR: 0.84, endYR: 1.02, ampR: 0.100, cycles: 1.5, phase: PI, color: 'blue', opacity: 0.88, width: 1.50, spd: 0.26, bs: 0.19, bp: PI * 0.6 },
    { startYR: 0.87, endYR: 1.04, ampR: 0.085, cycles: 1.5, phase: PI * 0.6, color: 'teal', opacity: 0.72, width: 1.10, spd: 0.33, bs: 0.15, bp: PI * 1.8 },
    { startYR: 0.90, endYR: 1.07, ampR: 0.095, cycles: 1.5, phase: PI * 1.2, color: 'blue', opacity: 0.80, width: 1.30, spd: 0.30, bs: 0.18, bp: PI * 0.9 },
    { startYR: 0.93, endYR: 1.10, ampR: 0.080, cycles: 1.5, phase: PI * 0.8, color: 'white', opacity: 0.68, width: 1.00, spd: 0.27, bs: 0.12, bp: PI * 1.5 },

    // Layer C — fast foreground wisps
    { startYR: 0.80, endYR: 0.99, ampR: 0.100, cycles: 1.5, phase: PI * 0.2, color: 'white', opacity: 0.90, width: 0.90, spd: 0.47, bs: 0.22, bp: PI * 0.3 },
    { startYR: 0.83, endYR: 1.01, ampR: 0.095, cycles: 1.5, phase: PI * 0.9, color: 'blue', opacity: 0.84, width: 0.85, spd: 0.44, bs: 0.20, bp: PI * 1.6 },
    { startYR: 0.86, endYR: 1.04, ampR: 0.090, cycles: 1.5, phase: PI * 0.3, color: 'teal', opacity: 0.78, width: 0.80, spd: 0.50, bs: 0.24, bp: PI * 0.8 },
    { startYR: 0.91, endYR: 1.08, ampR: 0.100, cycles: 1.5, phase: PI * 1.1, color: 'white', opacity: 0.72, width: 0.75, spd: 0.41, bs: 0.21, bp: PI * 1.2 },
];

const GRAD = { blue: 'wl-grad-blue', teal: 'wl-grad-teal', white: 'wl-grad-white' };
const OVERSHOOT_R = 0.08;  // extend paths 8% beyond each edge; SVG viewport clips the transparent ends
const WAVE_REF_W = 1440;  // fixed reference width for wave frequency — prevents squishing on narrow screens

// ─── easing helpers ───────────────────────────────────────────────────────
function easeInOutSine(t) { return -(Math.cos(PI * t) - 1) / 2; }
function easeInQuad(t) { return t * t; }

// ─── buildPath ────────────────────────────────────────────────────────────
// Uses .toFixed(1) for smooth sub-pixel rendering without integer-snap jitter.
function buildPath(s, phase, breathMul, vbW, vbH) {
    const os = vbW * OVERSHOOT_R;
    const startX = -os;
    const totalW = vbW + os * 2;
    const startY = s.startYR * vbH;
    const endY = s.endYR * vbH;
    const amp = s.ampR * breathMul * vbH;
    // scale is based on a fixed reference width so wave shape stays consistent on all screen widths
    const refTotalW = WAVE_REF_W * (1 + OVERSHOOT_R * 2);
    const scale = (PI * 2 * s.cycles) / refTotalW;
    const segW = totalW / NUM_SEGS;
    const segCp = segW / 3;
    const slope = (endY - startY) / totalW;

    for (let i = 0; i <= NUM_SEGS; i++) {
        const xn = i * segW; // x relative to startX, used for wave math
        _y[i] = startY + slope * xn + amp * Math.sin(xn * scale + phase);
        _tan[i] = slope + amp * Math.cos(xn * scale + phase) * scale;
    }

    let d = `M${startX.toFixed(1)},${_y[0].toFixed(1)}`;
    for (let i = 0; i < NUM_SEGS; i++) {
        const x0 = startX + i * segW, x1 = startX + (i + 1) * segW;
        d += ` C${(x0 + segCp).toFixed(1)},${(_y[i] + _tan[i] * segCp).toFixed(1)}`
            + ` ${(x1 - segCp).toFixed(1)},${(_y[i + 1] - _tan[i + 1] * segCp).toFixed(1)}`
            + ` ${x1.toFixed(1)},${_y[i + 1].toFixed(1)}`;
    }
    return d;
}

// ─── component ────────────────────────────────────────────────────────────
export default function WaveLines() {
    const [dims, setDims] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
    const dimsRef = useRef(dims);
    const pathRefs = useRef([]);
    const phaseRef = useRef(STREAMS.map(s => s.phase));
    const breathRef = useRef(STREAMS.map(s => s.bp));
    const lastTimeRef = useRef(null);
    const rafRef = useRef(null);

    dimsRef.current = dims;

    // Debounced resize — updates viewBox so waves always span the full viewport
    useEffect(() => {
        let tid;
        function onResize() {
            clearTimeout(tid);
            tid = setTimeout(() => setDims({ w: window.innerWidth, h: window.innerHeight }), 150);
        }
        window.addEventListener('resize', onResize, { passive: true });
        return () => { window.removeEventListener('resize', onResize); clearTimeout(tid); };
    }, []);

    // RAF loop — mutates SVG path `d` attributes directly, never re-renders React
    useEffect(() => {
        let startTime = null;

        function tick(time) {
            if (startTime === null) startTime = time;
            const elapsed = time - startTime;

            // Stop loop entirely once all scan animations finish
            if (elapsed >= SCAN_STOP_MS) {
                rafRef.current = null;
                return;
            }

            // Throttle to ~15 fps — slow decorative waves don't need more
            const since = lastTimeRef.current == null ? Infinity : time - lastTimeRef.current;
            if (since < FRAME_MS) {
                rafRef.current = requestAnimationFrame(tick);
                return;
            }

            const dt = since === Infinity ? 0 : since / 1000;
            lastTimeRef.current = time;
            const { w: vbW, h: vbH } = dimsRef.current;
            // Smoothstep wind-down over last WIND_DOWN_MS
            const windStart = SCAN_STOP_MS - WIND_DOWN_MS;
            let speedMul = 1;
            if (elapsed > windStart) {
                const t = (elapsed - windStart) / WIND_DOWN_MS; // 0 → 1
                speedMul = 1 - t * t * (3 - 2 * t);             // 1 → 0
            }

            for (let i = 0; i < STREAMS.length; i++) {
                const s = STREAMS[i];
                const el = pathRefs.current[i];
                if (!el) continue;

                // Update wave geometry
                phaseRef.current[i] += s.spd * speedMul * dt;
                breathRef.current[i] += s.bs * speedMul * dt;
                const breathMul = 1 + 0.18 * Math.sin(breathRef.current[i]);
                el.setAttribute('d', buildPath(s, phaseRef.current[i], breathMul, vbW, vbH));

                // Draw/sweep — purely time-driven, independent of speedMul
                const streamStart = 500 + i * 130;
                const streamElapsed = elapsed - streamStart;
                const t = streamElapsed / 12000;

                let dashOffset, opacity;
                if (streamElapsed < 0) {
                    dashOffset = 1; opacity = 0;
                } else if (t >= 1) {
                    dashOffset = -1.1; opacity = 0;
                } else if (t < 0.5) {
                    const tp = t / 0.5;
                    dashOffset = 1 - easeInOutSine(tp);
                    opacity = (t < 0.04 ? t / 0.04 : 1) * s.opacity;
                } else {
                    const tp = (t - 0.5) / 0.5;
                    dashOffset = -easeInQuad(tp) * 1.1;
                    opacity = (1 - tp) * s.opacity;
                }

                el.style.strokeDashoffset = dashOffset;
                el.style.opacity = opacity;
            }

            rafRef.current = requestAnimationFrame(tick);
        }

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            lastTimeRef.current = null;
        };
    }, []);

    const { w: vbW, h: vbH } = dims;

    return (
        <svg
            className="wave-lines"
            viewBox={`0 0 ${vbW} ${vbH}`}
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="wl-grad-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(30,80,255,0)" />
                    <stop offset="3%" stopColor="rgba(60,120,255,0.95)" />
                    <stop offset="50%" stopColor="rgba(100,160,255,1)" />
                    <stop offset="97%" stopColor="rgba(60,120,255,0.95)" />
                    <stop offset="100%" stopColor="rgba(30,80,255,0)" />
                </linearGradient>
                <linearGradient id="wl-grad-white" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(80,100,255,0)" />
                    <stop offset="3%" stopColor="rgba(120,140,255,0.95)" />
                    <stop offset="50%" stopColor="rgba(160,180,255,1)" />
                    <stop offset="97%" stopColor="rgba(120,140,255,0.95)" />
                    <stop offset="100%" stopColor="rgba(80,100,255,0)" />
                </linearGradient>
                <linearGradient id="wl-grad-teal" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(50,50,220,0)" />
                    <stop offset="3%" stopColor="rgba(80,90,255,0.92)" />
                    <stop offset="50%" stopColor="rgba(110,130,255,1)" />
                    <stop offset="97%" stopColor="rgba(80,90,255,0.92)" />
                    <stop offset="100%" stopColor="rgba(50,50,220,0)" />
                </linearGradient>
            </defs>

            <g className="wl-band">
                {STREAMS.map((s, i) => (
                    <path
                        key={i}
                        ref={el => { pathRefs.current[i] = el; }}
                        d={buildPath(s, s.phase, 1, vbW, vbH)}
                        pathLength="1"
                        style={{ '--wl-i': i, strokeDashoffset: 1, opacity: 0 }}
                        fill="none"
                        stroke={`url(#${GRAD[s.color]})`}
                        strokeWidth={s.width}
                        strokeLinecap="round"
                    />
                ))}
            </g>

            {/* Baseline — static dim traces that appear after the sweep, no glow */}
            <g className="wl-base">
                {STREAMS.map((s, i) => (
                    <path
                        key={i}
                        style={{ '--wl-i': i }}
                        d={buildPath(s, s.phase, 1, vbW, vbH)}
                        pathLength="1"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.55)"
                        strokeWidth={s.width * 0.7}
                        strokeLinecap="round"
                    />
                ))}
            </g>
        </svg>
    );
}
