import { useEffect, useRef, useState } from 'react';
import './WaveLines.css';

// ─── constants ────────────────────────────────────────────────────────────
const PI           = Math.PI;
const NUM_SEGS     = 8;     // cubic bezier segments per line (sweet spot)
const FRAME_MS     = 0;     // uncapped — runs at display refresh rate (60fps / 120fps)
const SCAN_STOP_MS = 10400; // 500 + 13*130 + 8000 — last line fully drawn
const WIND_DOWN_MS = 1200;  // smoothstep decel window before full stop

// Module-level scratch arrays — zero GC in hot path
const _y   = new Float32Array(NUM_SEGS + 1);
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
    { startYR: 0.30, endYR: 0.50, ampR: 0.070, cycles: 1.5, phase: 0,        color: 'blue',  opacity: 0.18, width: 0.70, spd: 0.14, bs: 0.11, bp: 0        },
    { startYR: 0.34, endYR: 0.53, ampR: 0.080, cycles: 1.5, phase: PI*0.5,   color: 'teal',  opacity: 0.15, width: 0.65, spd: 0.17, bs: 0.09, bp: PI*0.7   },
    { startYR: 0.40, endYR: 0.57, ampR: 0.075, cycles: 1.5, phase: PI,       color: 'blue',  opacity: 0.16, width: 0.65, spd: 0.12, bs: 0.13, bp: PI*1.3   },
    { startYR: 0.46, endYR: 0.62, ampR: 0.080, cycles: 1.5, phase: PI*1.5,   color: 'teal',  opacity: 0.14, width: 0.60, spd: 0.15, bs: 0.10, bp: PI*0.4   },

    // Layer B — main energy band
    { startYR: 0.32, endYR: 0.51, ampR: 0.090, cycles: 1.5, phase: 0,        color: 'blue',  opacity: 0.52, width: 1.40, spd: 0.29, bs: 0.17, bp: PI*0.2   },
    { startYR: 0.35, endYR: 0.53, ampR: 0.095, cycles: 1.5, phase: PI*0.4,   color: 'white', opacity: 0.44, width: 1.20, spd: 0.32, bs: 0.14, bp: PI*1.1   },
    { startYR: 0.37, endYR: 0.55, ampR: 0.100, cycles: 1.5, phase: PI,       color: 'blue',  opacity: 0.55, width: 1.50, spd: 0.26, bs: 0.19, bp: PI*0.6   },
    { startYR: 0.40, endYR: 0.57, ampR: 0.085, cycles: 1.5, phase: PI*0.6,   color: 'teal',  opacity: 0.40, width: 1.10, spd: 0.33, bs: 0.15, bp: PI*1.8   },
    { startYR: 0.43, endYR: 0.60, ampR: 0.095, cycles: 1.5, phase: PI*1.2,   color: 'blue',  opacity: 0.48, width: 1.30, spd: 0.30, bs: 0.18, bp: PI*0.9   },
    { startYR: 0.46, endYR: 0.63, ampR: 0.080, cycles: 1.5, phase: PI*0.8,   color: 'white', opacity: 0.35, width: 1.00, spd: 0.27, bs: 0.12, bp: PI*1.5   },

    // Layer C — fast foreground wisps
    { startYR: 0.33, endYR: 0.52, ampR: 0.100, cycles: 1.5, phase: PI*0.2,   color: 'white', opacity: 0.60, width: 0.90, spd: 0.47, bs: 0.22, bp: PI*0.3   },
    { startYR: 0.36, endYR: 0.54, ampR: 0.095, cycles: 1.5, phase: PI*0.9,   color: 'blue',  opacity: 0.52, width: 0.85, spd: 0.44, bs: 0.20, bp: PI*1.6   },
    { startYR: 0.39, endYR: 0.57, ampR: 0.090, cycles: 1.5, phase: PI*0.3,   color: 'teal',  opacity: 0.45, width: 0.80, spd: 0.50, bs: 0.24, bp: PI*0.8   },
    { startYR: 0.44, endYR: 0.61, ampR: 0.100, cycles: 1.5, phase: PI*1.1,   color: 'white', opacity: 0.38, width: 0.75, spd: 0.41, bs: 0.21, bp: PI*1.2   },
];

const GRAD = { blue: 'wl-grad-blue', teal: 'wl-grad-teal', white: 'wl-grad-white' };

// ─── buildPath ────────────────────────────────────────────────────────────
// Zero heap allocations — reuses module-level Float32Arrays.
// breathMul modulates amplitude: 1 + 0.18*sin(breathPhase)
function buildPath(s, phase, breathMul, vbW, vbH) {
    const startY = s.startYR * vbH;
    const endY   = s.endYR   * vbH;
    const amp    = s.ampR * breathMul * vbH;
    const scale  = (PI * 2 * s.cycles) / vbW;
    const segW   = vbW / NUM_SEGS;
    const segCp  = segW / 3;
    const slope  = (endY - startY) / vbW;

    for (let i = 0; i <= NUM_SEGS; i++) {
        const x = i * segW;
        _y[i]   = startY + slope * x + amp * Math.sin(x * scale + phase);
        _tan[i] = slope  + amp * Math.cos(x * scale + phase) * scale;
    }

    let d = `M0,${Math.round(_y[0])}`;
    for (let i = 0; i < NUM_SEGS; i++) {
        const x0 = i * segW, x1 = (i + 1) * segW;
        d += ` C${Math.round(x0 + segCp)},${Math.round(_y[i] + _tan[i] * segCp)}`
           + ` ${Math.round(x1 - segCp)},${Math.round(_y[i + 1] - _tan[i + 1] * segCp)}`
           + ` ${Math.round(x1)},${Math.round(_y[i + 1])}`;
    }
    return d;
}

// ─── component ────────────────────────────────────────────────────────────
export default function WaveLines() {
    const [dims, setDims]  = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
    const dimsRef          = useRef(dims);
    const pathRefs         = useRef([]);
    const phaseRef         = useRef(STREAMS.map(s => s.phase));
    const breathRef        = useRef(STREAMS.map(s => s.bp));
    const lastTimeRef      = useRef(null);
    const rafRef           = useRef(null);

    dimsRef.current = dims;

    // Debounced resize so we don't thrash React state
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
                phaseRef.current[i]  += s.spd * speedMul * dt;
                breathRef.current[i] += s.bs  * speedMul * dt;
                const breathMul = 1 + 0.18 * Math.sin(breathRef.current[i]);
                const el = pathRefs.current[i];
                if (el) el.setAttribute('d', buildPath(s, phaseRef.current[i], breathMul, vbW, vbH));
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
                    <stop offset="0%"   stopColor="rgba(140,200,255,0)" />
                    <stop offset="10%"  stopColor="rgba(165,218,255,0.9)" />
                    <stop offset="50%"  stopColor="rgba(195,232,255,1)" />
                    <stop offset="90%"  stopColor="rgba(165,218,255,0.9)" />
                    <stop offset="100%" stopColor="rgba(140,200,255,0)" />
                </linearGradient>
                <linearGradient id="wl-grad-white" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="rgba(215,235,255,0)" />
                    <stop offset="10%"  stopColor="rgba(232,244,255,0.88)" />
                    <stop offset="50%"  stopColor="rgba(248,252,255,1)" />
                    <stop offset="90%"  stopColor="rgba(232,244,255,0.88)" />
                    <stop offset="100%" stopColor="rgba(215,235,255,0)" />
                </linearGradient>
                <linearGradient id="wl-grad-teal" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="rgba(90,210,195,0)" />
                    <stop offset="10%"  stopColor="rgba(115,222,210,0.82)" />
                    <stop offset="50%"  stopColor="rgba(138,232,220,1)" />
                    <stop offset="90%"  stopColor="rgba(115,222,210,0.82)" />
                    <stop offset="100%" stopColor="rgba(90,210,195,0)" />
                </linearGradient>
            </defs>

            <g className="wl-band">
                {STREAMS.map((s, i) => (
                    <path
                        key={i}
                        ref={el => { pathRefs.current[i] = el; }}
                        d={buildPath(s, s.phase, 1, vbW, vbH)}
                        pathLength="1"
                        style={{ '--wl-i': i }}
                        fill="none"
                        stroke={`url(#${GRAD[s.color]})`}
                        strokeWidth={s.width}
                        strokeLinecap="round"
                        opacity={s.opacity}
                    />
                ))}
            </g>
        </svg>
    );
}
