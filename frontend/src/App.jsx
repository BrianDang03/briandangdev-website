import './App.css';
import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import SkipToContent from "./components/SkipToContent/SkipToContent";
import PageTransition from "./components/PageTransition";
import SEO from "./components/SEO";
import { shouldUseSimpleMotion } from "./utils/motionProfile";

const Home = lazy(() => import("./pages/Home/Home"));
const Portfolio = lazy(() => import("./pages/Portfolio/Portfolio"));
const About = lazy(() => import("./pages/About/About"));

const BOOT_MIN_DELAY_MS = 420;
const BOOT_ASSET_TIMEOUT_MS = 1800;
const BOOT_IMAGES = ["modem.jpg", "headshot.jpg", "contact.png", "flipIcon.png"];
const ROUTE_PRELOADERS = [
  () => import("./pages/About/About"),
  () => import("./pages/Portfolio/Portfolio")
];

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      window.setTimeout(resolve, timeoutMs);
    })
  ]);
}

function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const done = () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    };
    img.onload = done;
    img.onerror = done;
    img.src = src;

    if (typeof img.decode === "function") {
      img.decode().then(done).catch(done);
    }
  });
}

function RouteLoadingFallback({ label }) {
  return (
    <section className="page-shell route-loading" role="status" aria-live="polite" aria-busy="true">
      <div className="route-loading-content">
        <div className="app-loader-mark" aria-hidden="true" />
        <p className="app-loader-text">{label}</p>
      </div>
    </section>
  );
}

// ── Module-level helix constants ──────────────────────────────────────────
// Hoisted out of the AnimatedWaves useEffect closure so V8 can JIT-compile
// buildPath once and reuse it without re-allocating arrays on every frame.
//
// PREVIOUS APPROACH (broken): used SVG Q+T quadratic Bezier with sine SAMPLE
// VALUES as control points. A Bezier control point is NOT on the curve —
// the actual peak of Q(p0,ctrl,p1) is at (p0+2*ctrl+p1)/4, so with a
// full sine cycle the rendered amplitude was half the intended value.
// The T reflections also produced control-point-x === endpoint-x at every
// junction, creating near-vertical tangents and kinked shapes.
//
// CURRENT APPROACH: cubic Bezier (C command) with hermite tangents.
// 6 anchor x-positions are evenly spaced at 600px intervals across the
// 3000-unit viewBox (= 5 segments × one full sine cycle).
// At each anchor the curve passes through the EXACT sine Y value.
// The cubic control points are derived from the analytic sine derivative
// (cos), guaranteeing C1-continuity (smooth tangents) across every junction.
const _SCALE = Math.PI * 2 / 3000; // radians per SVG x-unit (1 full cycle = 3000px)
const _SEG_W = 600;                 // segment width in SVG units
const _SEG_CP = _SEG_W / 3;         // hermite control-point offset = ⅓ segment width
const _XA = [0, 600, 1200, 1800, 2400, 3000]; // 6 evenly-spaced anchor x positions

function buildPath(w, t) {
  const phi = w.wSpeed * t + w.wOff;
  const amp = w.wAmp + w.breathAmp * Math.sin(w.breathFreq * t + w.breathPhase);
  const center = w.baseY + w.driftAmp * Math.sin(w.driftFreq * t + w.driftPhase);

  // Pre-compute y-value and tangent slope at each anchor.
  // y(x)    = center + amp * sin(x * _SCALE + phi)
  // dy/dx   = amp * cos(x * _SCALE + phi) * _SCALE
  const y = new Array(6);
  const tan = new Array(6);
  for (let i = 0; i < 6; i++) {
    const phase = _XA[i] * _SCALE + phi;
    y[i] = center + amp * Math.sin(phase);
    tan[i] = amp * Math.cos(phase) * _SCALE;
  }

  // Build cubic Bezier path: C cp1x,cp1y cp2x,cp2y ex,ey
  // cp1 = anchor + (⅓ segment, tangent × ⅓ segment)   — forward  control
  // cp2 = next_anchor - (⅓ segment, tangent × ⅓ segment) — backward control
  // This is the standard hermite → cubic Bezier conversion; the resulting
  // curve passes exactly through every anchor with the correct sine slope.
  let d = `M 0,${y[0].toFixed(1)}`;
  for (let i = 0; i < 5; i++) {
    const x0 = _XA[i];
    const x1 = _XA[i + 1];
    const cp1y = (y[i] + tan[i] * _SEG_CP).toFixed(1);
    const cp2y = (y[i + 1] - tan[i + 1] * _SEG_CP).toFixed(1);
    d += ` C ${x0 + _SEG_CP},${cp1y} ${x1 - _SEG_CP},${cp2y} ${x1},${y[i + 1].toFixed(1)}`;
  }
  return d;
}
// ───────────────────────────────────────────────────────────────────────────

function AnimatedWaves() {
  const simpleMotion = shouldUseSimpleMotion();
  const r0 = useRef(null);
  const r1 = useRef(null);
  const r2 = useRef(null);
  const r3 = useRef(null);
  const b0 = useRef(null);
  const b1 = useRef(null);
  const b2 = useRef(null);
  const b3 = useRef(null);
  const cr0 = useRef(null);
  const cr1 = useRef(null);
  const cr2 = useRef(null);
  const cr3 = useRef(null);
  const rafRef = useRef(0);

  // Generate random soft-fade gap positions once on mount — unique per line
  const waveMasks = useMemo(() => {
    function mkRng(seed) {
      let s = seed >>> 0;
      return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x100000000; };
    }
    function makeStops(rand, count, lineColor) {
      const VB_W = 3000;
      const gaps = [];
      for (let i = 0; i < count; i++) {
        const center = 150 + rand() * (VB_W - 300);
        const halfW = 35 + rand() * 130;
        const ramp = 30 + rand() * 90;
        gaps.push({ center, halfW, ramp });
      }
      gaps.sort((a, b) => a.center - b.center);
      const pts = [
        { x: 0, color: lineColor, o: 0 },
        { x: 80, color: lineColor, o: 1 },
      ];
      for (const { center, halfW, ramp } of gaps) {
        const edgeW = Math.min(ramp * 0.08, 12); // razor-thin edge snap
        const causticW = ramp * 0.18;            // narrow bright rim
        pts.push(
          { x: Math.max(80, center - halfW - ramp), color: lineColor, o: 1 },
          { x: Math.max(80, center - halfW - edgeW), color: lineColor, o: 1 },
          { x: Math.max(80, center - halfW), color: lineColor, o: 0.01 },
          { x: Math.max(80, center - halfW + causticW), color: lineColor, o: 1.0 },
          { x: Math.max(80, center - halfW + causticW * 1.8), color: lineColor, o: 0.03 },
          { x: center - halfW * 0.35, color: lineColor, o: 0.22 },
          { x: center, color: lineColor, o: 0.04 },
          { x: center + halfW * 0.35, color: lineColor, o: 0.22 },
          { x: Math.min(VB_W - 80, center + halfW - causticW * 1.8), color: lineColor, o: 0.03 },
          { x: Math.min(VB_W - 80, center + halfW - causticW), color: lineColor, o: 1.0 },
          { x: Math.min(VB_W - 80, center + halfW), color: lineColor, o: 0.01 },
          { x: Math.min(VB_W - 80, center + halfW + edgeW), color: lineColor, o: 1 },
          { x: Math.min(VB_W - 80, center + halfW + ramp), color: lineColor, o: 1 },
        );
      }
      pts.push(
        { x: VB_W - 80, color: lineColor, o: 1 },
        { x: VB_W, color: lineColor, o: 0 },
      );
      return pts.sort((a, b) => a.x - b.x);
    }
    const W = '#eaf4ff';
    const B = '#2255dd';
    return [
      makeStops(mkRng(8291), 4, W),
      makeStops(mkRng(1654), 6, '#30b8ff'),
      makeStops(mkRng(6087), 7, B),
      makeStops(mkRng(4315), 5, '#6633ff'),
    ];
  }, []);

  useEffect(() => {
    // Fixed starting rotation so helix always begins in the same position
    const initPhi = 0;

    // Helix constants
    const SPIRAL_CENTER = 500;    // 50% of viewBox height → always vertically centred in viewport

    // Each wave has independent start-Y and end-Y oscillators at different periods
    // and phases. As they drift apart or together the chord tilts and the
    // concavity of the wave shape changes naturally on its own.
    const WAVES = [
      // Pair A: phases 0 and π — always on opposite sides of the coil
      { r: r0, b: b0, cr: cr0, baseY: SPIRAL_CENTER, wAmp: 120, wSpeed: 7e-5, wOff: initPhi, breathAmp: 0, breathFreq: 0, breathPhase: 0, driftAmp: 0, driftFreq: 0, driftPhase: 0 },
      { r: r1, b: b1, cr: cr1, baseY: SPIRAL_CENTER, wAmp: 120, wSpeed: 7e-5, wOff: initPhi + Math.PI, breathAmp: 0, breathFreq: 0, breathPhase: 0, driftAmp: 0, driftFreq: 0, driftPhase: 0 },
      // Pair B: phases π/2 and 3π/2
      { r: r2, b: b2, cr: cr2, baseY: SPIRAL_CENTER, wAmp: 120, wSpeed: 7e-5, wOff: initPhi + Math.PI * 0.5, breathAmp: 0, breathFreq: 0, breathPhase: 0, driftAmp: 0, driftFreq: 0, driftPhase: 0 },
      { r: r3, b: b3, cr: cr3, baseY: SPIRAL_CENTER, wAmp: 120, wSpeed: 7e-5, wOff: initPhi + Math.PI * 1.5, breathAmp: 0, breathFreq: 0, breathPhase: 0, driftAmp: 0, driftFreq: 0, driftPhase: 0 },
    ];

    // ── Pulse timing (JS-driven so order can be shuffled each round) ──────────
    const CYCLE_MS = 18000; // full cycle length
    const FILL_FRAC = 0.30;  // 0–30 %: head races right, tail fixed at start
    const HOLD_FRAC = 0.20;  // 30–50 %: fully lit — hold (same duration as rest)
    const DRAIN_FRAC = 0.30;  // 50–80 %: head fixed at end, tail catches up
    //                           80–100 %: rest (invisible) = same 20 % as hold
    // ViewBox width used for clipRect calculations
    const VB_W = 3000;
    const activeWaveCount = simpleMotion ? 2 : 4;
    // Offsets (ms) between waves within a round — shuffled each round
    const OFFSET_POOL = [0, 150, 310, 500];
    const hardwareConcurrency = navigator.hardwareConcurrency || 8;
    const isLowPowerDevice = simpleMotion || hardwareConcurrency <= 4;
    const MAX_SIM_STEP_MS = isLowPowerDevice ? 30 : 24;
    const MIN_CLIP_DELTA_PX = isLowPowerDevice ? 2 : 1;

    function shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    // cycleStarts[i] = absolute rAF timestamp when wave i's current pulse began
    let cycleStarts = Array.from({ length: activeWaveCount }, () => null);
    let roundBase = null;
    let lastTs = null;
    let simTime = performance.now();
    const prevClip = Array.from({ length: activeWaveCount }, () => ({ x: -1, w: -1 }));
    const prevPathD = Array.from({ length: activeWaveCount }, () => "");
    // Track scan-path visibility to skip SVG filter work when wave is in rest
    // phase. SVG filter executes before clipPath, so a clipped-to-zero path
    // still runs the full Gaussian blur unless the element is visibility:hidden.
    const scanVisible = new Uint8Array(activeWaveCount).fill(1);

    function beginRound(baseTs) {
      roundBase = baseTs;
      const offsets = shuffle(OFFSET_POOL);
      for (let i = 0; i < cycleStarts.length; i++) {
        cycleStarts[i] = baseTs + offsets[i];
      }
    }

    function animate(ts) {
      if (lastTs === null) {
        lastTs = ts;
      }

      const delta = ts - lastTs;
      lastTs = ts;
      simTime += Math.min(delta, MAX_SIM_STEP_MS);

      // Initialise on the very first frame
      if (roundBase === null) beginRound(simTime);

      // When the last wave's cycle has ended, chain the next round seamlessly.
      // Use a simple loop so this is correct for both 2-wave and 4-wave counts.
      let lastStart = cycleStarts[0];
      for (let i = 1; i < activeWaveCount; i++) {
        if (cycleStarts[i] > lastStart) lastStart = cycleStarts[i];
      }
      if (simTime >= lastStart + CYCLE_MS) beginRound(lastStart + CYCLE_MS);

      for (let i = 0; i < activeWaveCount; i++) {
        const w = WAVES[i];
        const d = buildPath(w, simTime);
        if (d !== prevPathD[i]) {
          if (w.b.current) w.b.current.setAttribute('d', d);
          if (w.r.current) w.r.current.setAttribute('d', d);
          prevPathD[i] = d;
        }
        if (!w.cr.current) continue;

        const elapsed = simTime - cycleStarts[i];
        // clipX = left edge of lit window; clipW = width of lit window
        let clipX = 0, clipW = 0;

        if (elapsed >= 0) {
          const frac = Math.min(elapsed / CYCLE_MS, 1);
          if (frac < FILL_FRAC) {
            // Fill: window grows rightward from start
            clipX = 0;
            clipW = Math.round(VB_W * (frac / FILL_FRAC));
          } else if (frac < FILL_FRAC + HOLD_FRAC) {
            // Hold: fully lit
            clipX = 0;
            clipW = VB_W;
          } else if (frac < FILL_FRAC + HOLD_FRAC + DRAIN_FRAC) {
            // Drain: left edge (tail) advances rightward, right edge stays fixed
            const p = (frac - FILL_FRAC - HOLD_FRAC) / DRAIN_FRAC;
            clipX = Math.round(VB_W * p);
            clipW = VB_W - clipX;
          }
          // else rest: clipX=0, clipW=0 (fully hidden)
        }

        const clipCache = prevClip[i];
        if (Math.abs(clipX - clipCache.x) >= MIN_CLIP_DELTA_PX || Math.abs(clipW - clipCache.w) >= MIN_CLIP_DELTA_PX) {
          w.cr.current.setAttribute('x', clipX);
          w.cr.current.setAttribute('width', clipW);
          clipCache.x = clipX;
          clipCache.w = clipW;
        }

        // Hide/show the scan overlay to skip SVG filter cost during rest phase.
        const isResting = clipW === 0;
        if (isResting && scanVisible[i] === 1) {
          if (w.r.current) w.r.current.setAttribute('visibility', 'hidden');
          scanVisible[i] = 0;
        } else if (!isResting && scanVisible[i] === 0) {
          if (w.r.current) w.r.current.setAttribute('visibility', 'visible');
          scanVisible[i] = 1;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    // Skip the animation loop if the user prefers reduced motion — paint one static frame
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const t = performance.now();
      for (let i = 0; i < activeWaveCount; i++) {
        const w = WAVES[i];
        const d = buildPath(w, t);
        if (w.b.current) w.b.current.setAttribute('d', d);
        if (w.r.current) w.r.current.setAttribute('d', d);
      }
      return;
    }

    rafRef.current = requestAnimationFrame(animate);

    // Pause the RAF loop when the tab is hidden to save CPU and battery
    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
      } else {
        lastTs = null;
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [simpleMotion]);

  return (
    <svg className="flowing-wave" viewBox="0 0 3000 1000" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(10,30,120,0)" />
          <stop offset="15%" stopColor="rgba(20,80,200,0.3)" />
          <stop offset="35%" stopColor="rgba(30,130,240,0.55)" />
          <stop offset="50%" stopColor="rgba(50,160,255,0.65)" />
          <stop offset="65%" stopColor="rgba(30,130,240,0.55)" />
          <stop offset="85%" stopColor="rgba(20,80,200,0.3)" />
          <stop offset="100%" stopColor="rgba(10,30,120,0)" />
        </linearGradient>
        <linearGradient id="wave-gradient-white" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(220,238,255,0)" />
          <stop offset="15%" stopColor="rgba(220,238,255,0.32)" />
          <stop offset="35%" stopColor="rgba(235,247,255,0.56)" />
          <stop offset="50%" stopColor="rgba(245,252,255,0.68)" />
          <stop offset="65%" stopColor="rgba(235,247,255,0.56)" />
          <stop offset="85%" stopColor="rgba(220,238,255,0.32)" />
          <stop offset="100%" stopColor="rgba(220,238,255,0)" />
        </linearGradient>
        {/* Scan glow: single-pass blur in absolute SVG coords (filterUnits="userSpaceOnUse").   */}
        {/* Using bbox-% would cover ~3500×500px per wave — far too much GPU work per frame.    */}
        {/* Wave sits at y≈500 ±152 SVG units → bound filter to y 320–680 (400px at 1080p).    */}
        <filter id="wave-glow-scan" filterUnits="userSpaceOnUse" x="-40" y="280" width="3080" height="440" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="10" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur2" />
          <feMerge><feMergeNode in="blur1" /><feMergeNode in="blur2" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="wave-glow-scan-lite" filterUnits="userSpaceOnUse" x="-30" y="300" width="3060" height="400" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Clip rects control the visible window for each scan overlay */}
        <clipPath id="scan-clip-0"><rect ref={cr0} x="0" y="-200" width="0" height="1400" /></clipPath>
        <clipPath id="scan-clip-1"><rect ref={cr1} x="0" y="-200" width="0" height="1400" /></clipPath>
        <clipPath id="scan-clip-2"><rect ref={cr2} x="0" y="-200" width="0" height="1400" /></clipPath>
        <clipPath id="scan-clip-3"><rect ref={cr3} x="0" y="-200" width="0" height="1400" /></clipPath>
        {/* Per-line color-swap gradients: solid sections show the line's own colour,
             gap sections fade to the opposite colour (white→blue, blue→white) */}
        {waveMasks.map((stops, i) => (
          <linearGradient key={i} id={`wfg-${i}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="3000" y2="0">
            {stops.map((s, j) => (
              <stop key={j} offset={`${(s.x / 3000 * 100).toFixed(3)}%`} stopColor={s.color} stopOpacity={s.o} />
            ))}
          </linearGradient>
        ))}
      </defs>
      {/* Base lines – always visible; no SVG filter needed at 0.32 opacity (saves 4 blur passes/frame) */}
      <path ref={b0} d="" stroke="url(#wave-gradient-white)" strokeWidth="1.6" fill="none" className="wave-base" />
      <path ref={b1} d="" stroke="url(#wave-gradient-white)" strokeWidth="1.5" fill="none" className="wave-base wave-base-2" />
      {!simpleMotion && <path ref={b2} d="" stroke="url(#wave-gradient)" strokeWidth="1.5" fill="none" className="wave-base wave-base-3" />}
      {!simpleMotion && <path ref={b3} d="" stroke="url(#wave-gradient)" strokeWidth="1.6" fill="none" className="wave-base wave-base-4" />}
      {/* Scan highlights – clipPath reveals only the dots inside the window */}
      <path ref={r0} d="" stroke="url(#wfg-0)" strokeWidth="3.5" fill="none" className="wave-line" filter={simpleMotion ? "url(#wave-glow-scan-lite)" : "url(#wave-glow-scan)"} clipPath="url(#scan-clip-0)" />
      <path ref={r1} d="" stroke="url(#wfg-1)" strokeWidth="3.2" fill="none" className="wave-line wave-line-2" filter={simpleMotion ? "url(#wave-glow-scan-lite)" : "url(#wave-glow-scan)"} clipPath="url(#scan-clip-1)" />
      {!simpleMotion && <path ref={r2} d="" stroke="url(#wfg-2)" strokeWidth="3.2" fill="none" className="wave-line wave-line-3" filter="url(#wave-glow-scan)" clipPath="url(#scan-clip-2)" />}
      {!simpleMotion && <path ref={r3} d="" stroke="url(#wfg-3)" strokeWidth="3.5" fill="none" className="wave-line wave-line-4" filter="url(#wave-glow-scan)" clipPath="url(#scan-clip-3)" />}
    </svg>
  );
}

function App() {
  const simpleMotion = shouldUseSimpleMotion();
  const location = useLocation();
  const [showDecorations, setShowDecorations] = useState(false);
  const [isWavePaintReady, setIsWavePaintReady] = useState(false);
  const [areShapesLocked, setAreShapesLocked] = useState(false);
  const [isBootReady, setIsBootReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [isLoaderExiting, setIsLoaderExiting] = useState(false);
  const hasLoggedBootMeasureRef = useRef(false);
  const canRevealApp = isBootReady && isWavePaintReady;

  useEffect(() => {
    if (!import.meta.env.DEV || typeof performance === "undefined") {
      return;
    }

    performance.mark("app-boot-start");
  }, []);

  useEffect(() => {
    const canControlScrollRestoration = typeof window !== "undefined" && "scrollRestoration" in window.history;
    const previousScrollRestoration = canControlScrollRestoration ? window.history.scrollRestoration : undefined;

    if (canControlScrollRestoration) {
      window.history.scrollRestoration = "manual";
    }

    // Prevent browsers from restoring old scroll position on refresh.
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    return () => {
      if (canControlScrollRestoration && previousScrollRestoration) {
        window.history.scrollRestoration = previousScrollRestoration;
      }
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    let minDelayTimeout;
    let bootTimeout;
    let rafBootA;
    let rafBootB;

    const boot = async () => {
      const minDelay = new Promise((resolve) => {
        minDelayTimeout = window.setTimeout(resolve, BOOT_MIN_DELAY_MS);
      });

      const nextPaint = new Promise((resolve) => {
        rafBootA = window.requestAnimationFrame(() => {
          rafBootB = window.requestAnimationFrame(resolve);
        });
      });

      const preloadImages = Promise.allSettled(
        BOOT_IMAGES.map((name) => preloadImage(`${import.meta.env.BASE_URL}${name}`))
      );

      const preloadReady = withTimeout(
        preloadImages,
        BOOT_ASSET_TIMEOUT_MS
      );

      bootTimeout = window.setTimeout(() => {
        if (!isCancelled) {
          setIsBootReady(true);
        }
      }, BOOT_ASSET_TIMEOUT_MS + BOOT_MIN_DELAY_MS + 300);

      await Promise.allSettled([minDelay, nextPaint, preloadReady]);

      if (!isCancelled) {
        setIsBootReady(true);
      }
    };

    boot();

    return () => {
      isCancelled = true;
      window.clearTimeout(minDelayTimeout);
      window.clearTimeout(bootTimeout);
      window.cancelAnimationFrame(rafBootA);
      window.cancelAnimationFrame(rafBootB);
    };
  }, []);

  useEffect(() => {
    if (!canRevealApp) {
      return;
    }

    let isCancelled = false;
    let idleHandle;
    let fallbackTimeout;

    const preloadNonCriticalInBackground = () => {
      if (isCancelled) return;

      BOOT_IMAGES.forEach((name) => {
        const img = new Image();
        img.src = `${import.meta.env.BASE_URL}${name}`;
      });

      // Stagger route preloads so they don't all parse/execute in the same frame.
      ROUTE_PRELOADERS.forEach((loadRoute, index) => {
        window.setTimeout(() => {
          if (!isCancelled) {
            void loadRoute();
          }
        }, index * 220);
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(preloadNonCriticalInBackground, { timeout: 2400 });
    } else {
      fallbackTimeout = window.setTimeout(preloadNonCriticalInBackground, 900);
    }

    return () => {
      isCancelled = true;
      window.clearTimeout(fallbackTimeout);
      if (idleHandle && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
    };
  }, [canRevealApp]);

  useEffect(() => {
    if (!import.meta.env.DEV || !isBootReady || hasLoggedBootMeasureRef.current || typeof performance === "undefined") {
      return;
    }

    performance.mark("app-boot-ready");
    performance.measure("app-boot-duration", "app-boot-start", "app-boot-ready");

    const [entry] = performance.getEntriesByName("app-boot-duration").slice(-1);
    if (entry) {
      console.info(`[perf] App boot ready in ${entry.duration.toFixed(1)}ms`);
    }

    hasLoggedBootMeasureRef.current = true;
  }, [isBootReady]);

  useEffect(() => {
    // Start decorative motion immediately so it is visible and moving at load.
    setShowDecorations(true);
  }, []);

  useEffect(() => {
    if (!showDecorations) {
      return;
    }

    let rafA;
    let rafB;
    let paintTimer;
    let isCancelled = false;

    // Wait for waves to be mounted and rendered — 2 RAF frames to ensure paths are painted,
    // then an extra 500ms so the helix animation has time to populate all path geometry
    // before the loader fades out.
    rafA = window.requestAnimationFrame(() => {
      rafB = window.requestAnimationFrame(() => {
        paintTimer = window.setTimeout(() => {
          if (!isCancelled) {
            setIsWavePaintReady(true);
          }
        }, 280);
      });
    });

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(rafA);
      window.cancelAnimationFrame(rafB);
      window.clearTimeout(paintTimer);
    };
  }, [showDecorations]);

  useEffect(() => {
    if (!showDecorations) {
      return;
    }

    if (simpleMotion) {
      setAreShapesLocked(true);
      return;
    }

    const lockTimeout = window.setTimeout(() => {
      setAreShapesLocked(true);
    }, 3600);

    return () => {
      window.clearTimeout(lockTimeout);
    };
  }, [showDecorations, simpleMotion]);

  useEffect(() => {
    if (!canRevealApp) {
      return;
    }

    let hideLoaderTimeout;
    const rafId = window.requestAnimationFrame(() => {
      setIsLoaderExiting(true);
      hideLoaderTimeout = window.setTimeout(() => {
        setShowLoader(false);
      }, 260);
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(hideLoaderTimeout);
    };
  }, [canRevealApp]);

  return (
    <ErrorBoundary>
      <>
        <div className={`site-root ${canRevealApp ? "site-root-enter" : "site-root-preboot"}`}>
          <SkipToContent />

          <div className={`wave-bg ${showDecorations ? "is-ready" : "is-deferred"}`} aria-hidden="true">
            {showDecorations && <AnimatedWaves />}
          </div>

          <div className={`theme-bg ${showDecorations ? "is-ready" : ""} ${areShapesLocked ? "is-locked" : ""}`} aria-hidden="true">
            {showDecorations && (
              <>
                <span className="orb orb-left" />
                <span className="orb orb-nav-cut orb-nav-1" />
                <span className="orb orb-nav-cut orb-nav-2" />
                <span className="hexagon hex-1" />
                <span className="hexagon hex-2" />
                <span className="hexagon hex-5" />
                <span className="hexagon hex-6" />
                <span className="orb orb-3" />
                <span className="orb orb-8" />
                <span className="floating-plus plus-1" />
                <span className="floating-plus plus-4" />
                <span className="floating-plus plus-6" />
              </>
            )}
          </div>

          <div className={`theme-bg-footer ${showDecorations ? "is-ready" : "is-deferred"} ${areShapesLocked ? "is-locked" : ""}`} aria-hidden="true">
            {showDecorations && (
              <>
                <span className="beam beam-two" />
                <span className="hexagon hex-3" />
                <span className="hexagon hex-4" />
                <span className="hexagon hex-7" />
                <span className="hexagon hex-8" />
                <span className="orb orb-10" />
                <span className="floating-plus plus-7" />
              </>
            )}
          </div>

          <Navbar />

          <main className="main-content" id="main-content">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route
                  path="/"
                  element={
                    <Suspense fallback={<RouteLoadingFallback label="Loading home..." />}>
                      <Home name="Brian Dang" job="Software Engineer" />
                    </Suspense>
                  }
                />
                <Route
                  path="/portfolio"
                  element={
                    <Suspense fallback={<RouteLoadingFallback label="Loading portfolio..." />}>
                      <Portfolio />
                    </Suspense>
                  }
                />
                <Route
                  path="/about"
                  element={
                    <Suspense fallback={<RouteLoadingFallback label="Loading about..." />}>
                      <About />
                    </Suspense>
                  }
                />
                <Route
                  path="*"
                  element={
                    <PageTransition>
                      <SEO title="404 - Page Not Found" />
                      <section className="page-shell">
                        <h1>404</h1>
                        <p>The signal you requested does not exist on this frequency.</p>
                      </section>
                    </PageTransition>
                  }
                />
              </Routes>
            </AnimatePresence>
          </main>

          <Footer />
        </div>

        {showLoader && (
          <div
            className={`app-loader ${isLoaderExiting ? "is-exiting" : ""}`}
            role="status"
            aria-live="polite"
            aria-busy={!canRevealApp}
          >
            <div className="app-loader-mark" aria-hidden="true" />
            <p className="app-loader-text">Loading experience...</p>
          </div>
        )}
      </>
    </ErrorBoundary>
  );
}

export default App;
