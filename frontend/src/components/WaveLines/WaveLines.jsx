import { useEffect, useRef } from 'react';
import './WaveLines.css';

// ─── constants ────────────────────────────────────────────────────────────
const PI           = Math.PI;
const NUM_SEGS     = 8;
const FRAME_MS     = 16;    // cap at ~60 fps for consistent dt
const SCAN_STOP_MS = 14200; // 500 + 13*130 + 12000 — last line fully swept
const WIND_DOWN_MS = 1200;

// Fixed reference canvas — ensures identical wave shapes on every device/platform
const VB_W = 1440;
const VB_H = 900;

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

// ─── easing helpers ───────────────────────────────────────────────────────
function easeInOutSine(t) { return -(Math.cos(PI * t) - 1) / 2; }
function easeInQuad(t)    { return t * t; }

// ─── buildPath ────────────────────────────────────────────────────────────
// Uses .toFixed(1) for smooth sub-pixel rendering without integer-snap jitter.
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

    let d = `M0,${_y[0].toFixed(1)}`;
    for (let i = 0; i < NUM_SEGS; i++) {
        const x0 = i * segW, x1 = (i + 1) * segW;
        d += ` C${(x0 + segCp).toFixed(1)},${(_y[i] + _tan[i] * segCp).toFixed(1)}`
           + ` ${(x1 - segCp).toFixed(1)},${(_y[i + 1] - _tan[i + 1] * segCp).toFixed(1)}`
           + ` ${x1.toFixed(1)},${_y[i + 1].toFixed(1)}`;
    }
    return d;
}

// ─── component ────────────────────────────────────────────────────────────
export default function WaveLines() {
    const pathRefs         = useRef([]);
    const phaseRef         = useRef(STREAMS.map(s => s.phase));
    const breathRef        = useRef(STREAMS.map(s => s.bp));
    const lastTimeRef      = useRef(null);
    const rafRef           = useRef(null);

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
            // Smoothstep wind-down over last WIND_DOWN_MS
            const windStart = SCAN_STOP_MS - WIND_DOWN_MS;
            let speedMul = 1;
            if (elapsed > windStart) {
                const t = (elapsed - windStart) / WIND_DOWN_MS; // 0 → 1
                speedMul = 1 - t * t * (3 - 2 * t);             // 1 → 0
            }

            for (let i = 0; i < STREAMS.length; i++) {
                const s  = STREAMS[i];
                const el = pathRefs.current[i];
                if (!el) continue;

                // Update wave geometry
                phaseRef.current[i]  += s.spd * speedMul * dt;
                breathRef.current[i] += s.bs  * speedMul * dt;
                const breathMul = 1 + 0.18 * Math.sin(breathRef.current[i]);
                el.setAttribute('d', buildPath(s, phaseRef.current[i], breathMul, VB_W, VB_H));

                // Draw/sweep — purely time-driven, independent of speedMul
                const streamStart   = 500 + i * 130;
                const streamElapsed = elapsed - streamStart;
                const t             = streamElapsed / 12000;

                let dashOffset, opacity;
                if (streamElapsed < 0) {
                    dashOffset = 1;    opacity = 0;
                } else if (t >= 1) {
                    dashOffset = -1.1; opacity = 0;
                } else if (t < 0.5) {
                    const tp   = t / 0.5;
                    dashOffset = 1 - easeInOutSine(tp);
                    opacity    = (t < 0.04 ? t / 0.04 : 1) * s.opacity;
                } else {
                    const tp   = (t - 0.5) / 0.5;
                    dashOffset = -easeInQuad(tp) * 1.1;
                    opacity    = (1 - tp) * s.opacity;
                }

                el.style.strokeDashoffset = dashOffset;
                el.style.opacity          = opacity;
            }

            rafRef.current = requestAnimationFrame(tick);
        }

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            lastTimeRef.current = null;
        };
    }, []);

    return (
        <svg
            className="wave-lines"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid slice"
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
                        d={buildPath(s, s.phase, 1, VB_W, VB_H)}
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
                        d={buildPath(s, s.phase, 1, VB_W, VB_H)}
                        pathLength="1"
                        fill="none"
                        stroke="rgba(160, 200, 240, 0.18)"
                        strokeWidth={s.width * 0.7}
                        strokeLinecap="round"
                    />
                ))}
            </g>
        </svg>
    );
}
