import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './CareerScroller.css';

// ─── constants ────────────────────────────────────────────────────────────
const PI = Math.PI;
const NUM_SEGS = 10;

// Module-level scratch arrays — zero GC in hot path
const _px = new Float32Array(NUM_SEGS + 1);
const _py = new Float32Array(NUM_SEGS + 1);
const _tx = new Float32Array(NUM_SEGS + 1);
const _ty = new Float32Array(NUM_SEGS + 1);

// Vanishing point — center of sticky panel
const VP = { x: 0.5, y: 0.46 };

// ─── stream definitions ───────────────────────────────────────────────────
// Narrative arc — "following a fairy to a destination":
//
//  ACT 1  (0.00 → 0.12)  The fairy appears at center — two bright lines lead the way.
//  ACT 2  (0.04 → 0.35)  The trail fans outward from center — inner spread.
//  ACT 3  (0.22 → 0.65)  Outer lines complete the full spread — you're following.
//  ACT 4  (0.65 → 1.00)  convergeFactor shrinks all amplitudes → every line
//                         straightens and converges on the VP — arrival.
//
// ds/de  — scroll progress window for this stream's draw-in.
//           All streams fully drawn by 0.68 so the final ~32% is pure convergence.
const STREAMS = [
    // ── Act 1: fairy trail — center bright lines, draw first ─────────────
    { angle: -0.004, ampR: 0.007, cycles: 3.0, phase: 0, color: 'bright', opacity: 0.95, width: 2.40, spd: 0.35, bs: 0.18, bp: PI * 0.1, ds: 0.00, de: 0.10 },
    { angle: 0.004, ampR: 0.007, cycles: 3.0, phase: PI * 0.6, color: 'bright', opacity: 0.88, width: 1.90, spd: 0.40, bs: 0.15, bp: PI * 0.8, ds: 0.00, de: 0.10 },

    // ── Act 2 inner: first fan spread from center ─────────────────────────
    { angle: -0.06, ampR: 0.022, cycles: 2.5, phase: 0, color: 'bright', opacity: 0.90, width: 1.80, spd: 0.30, bs: 0.17, bp: PI * 0.2, ds: 0.04, de: 0.18 },
    { angle: 0.06, ampR: 0.022, cycles: 2.5, phase: PI * 0.3, color: 'bright', opacity: 0.86, width: 1.60, spd: 0.32, bs: 0.14, bp: PI * 1.0, ds: 0.04, de: 0.18 },
    { angle: -0.16, ampR: 0.040, cycles: 2.2, phase: PI * 0.5, color: 'main', opacity: 0.88, width: 1.70, spd: 0.28, bs: 0.18, bp: PI * 0.4, ds: 0.08, de: 0.22 },
    { angle: 0.16, ampR: 0.040, cycles: 2.2, phase: PI * 0.9, color: 'accent', opacity: 0.88, width: 1.70, spd: 0.28, bs: 0.18, bp: PI * 1.2, ds: 0.08, de: 0.22 },
    { angle: -0.28, ampR: 0.056, cycles: 1.9, phase: PI, color: 'main', opacity: 0.84, width: 1.50, spd: 0.26, bs: 0.16, bp: PI * 0.7, ds: 0.13, de: 0.28 },
    { angle: 0.28, ampR: 0.056, cycles: 1.9, phase: PI * 0.7, color: 'accent', opacity: 0.84, width: 1.50, spd: 0.26, bs: 0.16, bp: PI * 0.3, ds: 0.13, de: 0.28 },

    // ── Act 2 mid: trail broadens ─────────────────────────────────────────
    { angle: -0.42, ampR: 0.068, cycles: 1.7, phase: PI * 0.3, color: 'main', opacity: 0.80, width: 1.40, spd: 0.24, bs: 0.15, bp: PI * 1.5, ds: 0.20, de: 0.38 },
    { angle: 0.42, ampR: 0.068, cycles: 1.7, phase: PI * 1.1, color: 'accent', opacity: 0.80, width: 1.40, spd: 0.24, bs: 0.15, bp: PI * 0.6, ds: 0.20, de: 0.38 },
    { angle: -0.60, ampR: 0.076, cycles: 1.6, phase: PI * 0.8, color: 'main', opacity: 0.75, width: 1.25, spd: 0.27, bs: 0.13, bp: PI * 0.2, ds: 0.26, de: 0.44 },
    { angle: 0.60, ampR: 0.076, cycles: 1.6, phase: PI * 0.4, color: 'accent', opacity: 0.75, width: 1.25, spd: 0.27, bs: 0.13, bp: PI * 1.4, ds: 0.26, de: 0.44 },
    { angle: -0.78, ampR: 0.080, cycles: 1.5, phase: PI * 1.4, color: 'main', opacity: 0.68, width: 1.10, spd: 0.23, bs: 0.12, bp: PI * 0.9, ds: 0.32, de: 0.50 },
    { angle: 0.78, ampR: 0.080, cycles: 1.5, phase: PI * 0.2, color: 'accent', opacity: 0.68, width: 1.10, spd: 0.23, bs: 0.12, bp: PI * 0.5, ds: 0.32, de: 0.50 },

    // ── Act 3 outer: full spread — you're deep in the trail ───────────────
    { angle: -0.96, ampR: 0.078, cycles: 1.5, phase: PI * 0.6, color: 'main', opacity: 0.60, width: 0.95, spd: 0.20, bs: 0.11, bp: PI * 1.7, ds: 0.38, de: 0.55 },
    { angle: 0.96, ampR: 0.078, cycles: 1.5, phase: PI * 1.3, color: 'accent', opacity: 0.60, width: 0.95, spd: 0.20, bs: 0.11, bp: PI * 0.3, ds: 0.38, de: 0.55 },
    { angle: -1.14, ampR: 0.074, cycles: 1.5, phase: PI * 1.1, color: 'main', opacity: 0.52, width: 0.80, spd: 0.18, bs: 0.10, bp: PI * 0.6, ds: 0.44, de: 0.61 },
    { angle: 1.14, ampR: 0.074, cycles: 1.5, phase: PI * 0.5, color: 'accent', opacity: 0.52, width: 0.80, spd: 0.18, bs: 0.10, bp: PI * 1.2, ds: 0.44, de: 0.61 },
    { angle: -1.30, ampR: 0.068, cycles: 1.5, phase: PI * 0.2, color: 'main', opacity: 0.43, width: 0.68, spd: 0.16, bs: 0.09, bp: PI * 1.0, ds: 0.50, de: 0.68 },
    { angle: 1.30, ampR: 0.068, cycles: 1.5, phase: PI * 0.9, color: 'accent', opacity: 0.43, width: 0.68, spd: 0.16, bs: 0.09, bp: PI * 0.4, ds: 0.50, de: 0.68 },

    // ── Background haze wisps — softer, layered depth ─────────────────────
    { angle: -0.22, ampR: 0.035, cycles: 1.8, phase: PI * 1.3, color: 'main', opacity: 0.34, width: 0.70, spd: 0.44, bs: 0.21, bp: PI * 0.3, ds: 0.06, de: 0.24 },
    { angle: 0.22, ampR: 0.035, cycles: 1.8, phase: PI * 0.4, color: 'accent', opacity: 0.34, width: 0.70, spd: 0.44, bs: 0.21, bp: PI * 1.6, ds: 0.06, de: 0.24 },
    { angle: -0.50, ampR: 0.055, cycles: 1.6, phase: PI * 0.7, color: 'main', opacity: 0.30, width: 0.62, spd: 0.48, bs: 0.23, bp: PI * 0.8, ds: 0.18, de: 0.40 },
    { angle: 0.50, ampR: 0.055, cycles: 1.6, phase: PI * 1.6, color: 'accent', opacity: 0.30, width: 0.62, spd: 0.48, bs: 0.23, bp: PI * 0.2, ds: 0.18, de: 0.40 },
    { angle: -0.85, ampR: 0.065, cycles: 1.5, phase: PI * 0.3, color: 'main', opacity: 0.26, width: 0.55, spd: 0.42, bs: 0.20, bp: PI * 1.4, ds: 0.30, de: 0.52 },
    { angle: 0.85, ampR: 0.065, cycles: 1.5, phase: PI * 1.2, color: 'accent', opacity: 0.26, width: 0.55, spd: 0.42, bs: 0.20, bp: PI * 0.7, ds: 0.30, de: 0.52 },
    { angle: -1.20, ampR: 0.058, cycles: 1.5, phase: PI * 0.9, color: 'main', opacity: 0.22, width: 0.50, spd: 0.38, bs: 0.18, bp: PI * 0.5, ds: 0.42, de: 0.62 },
    { angle: 1.20, ampR: 0.058, cycles: 1.5, phase: PI * 0.6, color: 'accent', opacity: 0.22, width: 0.50, spd: 0.38, bs: 0.18, bp: PI * 1.1, ds: 0.42, de: 0.62 },
];

const STROKE_COLOR = {
    bright: 'rgba(215, 228, 255, 1)',  // cool silver-white  — fairy trail center
    main: 'rgba(110, 155, 245, 1)',  // mid periwinkle blue — left-side spread
    accent: 'rgba(70,  118, 215, 1)',  // deep steel blue     — right-side spread
};

// ─── Career timeline entries ──────────────────────────────────────────────
const CAREER = [
    {
        side: 'left', pct: 0.28, vpos: 0.54,
        year: '2020', title: 'Junior Developer', company: 'Company A',
        desc: 'Built web interfaces and learned the fundamentals of production code.',
    },
    {
        side: 'right', pct: 0.36, vpos: 0.63,
        year: '2021', title: 'Gameplay Programmer', company: 'Studio B',
        desc: 'Shipped player-feel mechanics and real-time systems in Unity.',
    },
    {
        side: 'left', pct: 0.44, vpos: 0.73,
        year: '2022', title: 'Full-Stack Engineer', company: 'Startup C',
        desc: 'React to Node.js — end-to-end features on a production platform.',
    },
    {
        side: 'right', pct: 0.52, vpos: 0.83,
        year: '2023–24', title: 'Software Engineer', company: 'Company D',
        desc: 'Led systems architecture across gameplay and web projects.',
    },
];

// ─── easing helpers ───────────────────────────────────────────────────────
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInOutSine(t) { return -(Math.cos(PI * t) - 1) / 2; }

// ─── buildPath ────────────────────────────────────────────────────────────
// Builds a bezier path from the far (bottom/edge) endpoint toward the VP.
// The path direction M(far) → VP means strokeDashoffset 1→0 draws bottom-to-center.
//
// Oscillation is perpendicular to the ray, perspective-scaled:
//   amplitude = 0 at VP (t=0), full at far end (t=1) — mimics 3-D foreshortening.
// convergeFactor (0→1): at 1 all oscillation collapses — lines merge at VP (arrival)
function buildPath(s, phase, breathMul, vw, vh, convergeFactor = 0) {
    const vpx = VP.x * vw;
    const vpy = VP.y * vh;

    // Unit ray direction from VP outward
    const rdx = Math.sin(s.angle);
    const rdy = Math.cos(s.angle);

    // Find where the ray exits the viewport (4% overshoot for seamless fade)
    let tMax = 999999;
    if (rdy > 0.001) tMax = Math.min(tMax, (vh * 1.04 - vpy) / rdy);   // bottom
    if (rdx < -0.001) tMax = Math.min(tMax, (-vw * 0.02 - vpx) / rdx); // left
    if (rdx > 0.001) tMax = Math.min(tMax, (vw * 1.02 - vpx) / rdx); // right
    if (rdy < -0.001) tMax = Math.min(tMax, (-vh * 0.02 - vpy) / rdy); // top
    const totalLen = tMax;

    // Perpendicular to ray (oscillation direction)
    const px = -rdy;
    const py = rdx;

    // Wave frequency: cycles measured over vh so density is consistent across angles
    const freqScale = (PI * 2 * s.cycles) / vh;
    const segLen = totalLen / NUM_SEGS;
    const cpLen = segLen / 3;

    // Sample points from far end (i=0, ray-t=1) to VP (i=NUM_SEGS, ray-t=0)
    for (let i = 0; i <= NUM_SEGS; i++) {
        const t = 1 - i / NUM_SEGS;  // 1 = far, 0 = VP
        const dist = t * totalLen;
        const amp = s.ampR * breathMul * vw * t * (1 - convergeFactor); // perspective-scaled; collapses at arrival
        const osc = amp * Math.sin(dist * freqScale + phase);
        _px[i] = vpx + dist * rdx + osc * px;
        _py[i] = vpy + dist * rdy + osc * py;
    }

    // Tangents via central differences (same technique as WaveLines slope approach)
    for (let i = 0; i <= NUM_SEGS; i++) {
        if (i === 0) {
            _tx[i] = _px[1] - _px[0];
            _ty[i] = _py[1] - _py[0];
        } else if (i === NUM_SEGS) {
            _tx[i] = _px[NUM_SEGS] - _px[NUM_SEGS - 1];
            _ty[i] = _py[NUM_SEGS] - _py[NUM_SEGS - 1];
        } else {
            _tx[i] = (_px[i + 1] - _px[i - 1]) * 0.5;
            _ty[i] = (_py[i + 1] - _py[i - 1]) * 0.5;
        }
    }

    let d = `M${_px[0].toFixed(1)},${_py[0].toFixed(1)}`;
    for (let i = 0; i < NUM_SEGS; i++) {
        const t0m = Math.sqrt(_tx[i] * _tx[i] + _ty[i] * _ty[i]) || 1;
        const t1m = Math.sqrt(_tx[i + 1] * _tx[i + 1] + _ty[i + 1] * _ty[i + 1]) || 1;
        const cp0x = _px[i] + (_tx[i] / t0m) * cpLen;
        const cp0y = _py[i] + (_ty[i] / t0m) * cpLen;
        const cp1x = _px[i + 1] - (_tx[i + 1] / t1m) * cpLen;
        const cp1y = _py[i + 1] - (_ty[i + 1] / t1m) * cpLen;
        d += ` C${cp0x.toFixed(1)},${cp0y.toFixed(1)} ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${_px[i + 1].toFixed(1)},${_py[i + 1].toFixed(1)}`;
    }
    return d;
}

// ─── component ────────────────────────────────────────────────────────────
export default function CareerScroller() {
    const [dims, setDims] = useState(() => ({
        w: typeof window !== 'undefined' ? window.innerWidth : 1440,
        h: typeof window !== 'undefined' ? window.innerHeight : 900,
    }));

    const containerRef = useRef(null);
    const overlayRef = useRef(null);
    const pathRefs = useRef([]);
    const careerRefs = useRef([]);
    const glowRef = useRef(null);
    const rafRef = useRef(null);
    const progressRef = useRef(0);
    const phaseRef = useRef(STREAMS.map(s => s.phase));
    const breathRef = useRef(STREAMS.map(s => s.bp));
    const lastTimeRef = useRef(null);
    const dimsRef = useRef(dims);
    dimsRef.current = dims;

    // Debounced resize
    useEffect(() => {
        let tid;
        function onResize() {
            clearTimeout(tid);
            tid = setTimeout(() => setDims({ w: window.innerWidth, h: window.innerHeight }), 200);
        }
        window.addEventListener('resize', onResize, { passive: true });
        return () => { window.removeEventListener('resize', onResize); clearTimeout(tid); };
    }, []);

    // RAF loop (wave oscillation) + passive scroll listener (draw progress)
    // Direct DOM mutation — zero React re-renders in hot path
    useEffect(() => {
        function tick(time) {
            const dt = lastTimeRef.current == null ? 0 : (time - lastTimeRef.current) / 1000;
            lastTimeRef.current = time;

            const { w, h } = dimsRef.current;
            const progress = progressRef.current;

            // Act 4: convergence — past 65% scroll, lines tighten toward VP (arrival)
            const convergeFactor = easeInOutSine(Math.max(0, Math.min(1, (progress - 0.65) / 0.35)));

            for (let i = 0; i < STREAMS.length; i++) {
                const s = STREAMS[i];
                const el = pathRefs.current[i];
                if (!el) continue;

                // Advance phase (same as WaveLines RAF loop)
                phaseRef.current[i] += s.spd * dt;
                breathRef.current[i] += s.bs * dt;
                const breathMul = 1 + 0.18 * Math.sin(breathRef.current[i]);

                // Rebuild oscillating bezier path — convergeFactor collapses amplitude at arrival
                el.setAttribute('d', buildPath(s, phaseRef.current[i], breathMul, w, h, convergeFactor));

                // Scroll-driven draw-in: dashoffset 1→0 = far end → VP
                const raw = (progress - s.ds) / (s.de - s.ds);
                const t = Math.max(0, Math.min(1, raw));
                const drawn = easeOutCubic(t);
                el.style.strokeDashoffset = (1 - drawn).toFixed(4);
                el.style.opacity = drawn > 0 ? (s.opacity * Math.min(1, drawn * 4)).toFixed(4) : '0';
            }

            // VP glow — faintly visible from the start so you can "see" the destination,
            // grows as the fairy trail draws in, then BLOOMS at convergence (arrival).
            if (glowRef.current) {
                const leadT = easeOutCubic(Math.max(0, Math.min(1, progress / 0.12)));
                const glowOpacity = Math.min(0.96, 0.18 + leadT * 0.20 + convergeFactor * 0.70);
                const glowScale = 0.42 + leadT * 0.22 + convergeFactor * 1.90;
                glowRef.current.style.opacity = glowOpacity.toFixed(4);
                glowRef.current.style.transform = `translate(-50%, -50%) scale(${glowScale.toFixed(4)})`;
            }

            // Career cards
            careerRefs.current.forEach((el, i) => {
                if (el) el.dataset.visible = progress >= CAREER[i].pct ? '1' : '0';
            });

            rafRef.current = requestAnimationFrame(tick);
        }

        function onScroll() {
            const c = containerRef.current;
            if (!c) return;
            const rect = c.getBoundingClientRect();
            const vh = window.innerHeight;
            const scrollable = rect.height - vh;
            progressRef.current = Math.max(0, Math.min(1, -rect.top / scrollable));

            if (overlayRef.current) {
                // Slide-up reveal: overlay rises from below the fold as user scrolls
                // toward the section. slideProgress=0 → translateY(100vh) offscreen;
                // slideProgress=1 → translateY(0) fully covering.
                const slideProgress = Math.max(0, Math.min(1, (vh - rect.top) / vh));
                const active = rect.top < vh && rect.bottom > 0;
                overlayRef.current.style.visibility = active ? 'visible' : 'hidden';
                overlayRef.current.style.transform = `translateY(${((1 - slideProgress) * 100).toFixed(2)}vh)`;
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            window.removeEventListener('scroll', onScroll);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            lastTimeRef.current = null;
        };
    }, []);

    const { w, h } = dims;

    const overlay = (
        <div className="cs-sticky" ref={overlayRef} style={{ visibility: 'hidden' }}>

            {/* ── Single SVG — unified glow filter matching WaveLines ── */}
            <svg
                className="cs-svg"
                viewBox={`0 0 ${w} ${h}`}
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                {STREAMS.map((s, i) => (
                    <path
                        key={i}
                        ref={el => { pathRefs.current[i] = el; }}
                        d={buildPath(s, s.phase, 1, w, h)}
                        pathLength="1"
                        fill="none"
                        stroke={STROKE_COLOR[s.color]}
                        strokeWidth={s.width}
                        strokeLinecap="round"
                        style={{ strokeDasharray: 1, strokeDashoffset: 1, opacity: 0 }}
                    />
                ))}
            </svg>

            {/* ── VP convergence glow orb ── */}
            <div
                className="cs-vp-glow"
                ref={glowRef}
                style={{
                    left: `${VP.x * 100}%`,
                    top: `${VP.y * 100}%`,
                    opacity: 0,
                    transform: 'translate(-50%, -50%) scale(0.35)',
                }}
                aria-hidden="true"
            />

            {/* ── Career entries ── */}
            {CAREER.map((item, i) => (
                <div
                    key={i}
                    ref={el => { careerRefs.current[i] = el; }}
                    className={`cs-item cs-item--${item.side}`}
                    data-visible="0"
                    style={{ top: `${item.vpos * 100}%` }}
                    aria-hidden="true"
                >
                    <span className="cs-year">{item.year}</span>
                    <h3 className="cs-title">{item.title}</h3>
                    <span className="cs-company">{item.company}</span>
                    <p className="cs-desc">{item.desc}</p>
                </div>
            ))}

            <div className="cs-label" aria-hidden="true"><span>Career</span></div>
            <div className="cs-scroll-cue" aria-hidden="true" />
        </div>
    );

    return (
        <>
            {/* Scroll spacer — stays in document flow to drive scroll progress */}
            <div className="cs-container" ref={containerRef} />
            {/* Overlay portalled to body — fully independent of layout */}
            {createPortal(overlay, document.body)}
        </>
    );
}

