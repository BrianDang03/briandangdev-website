import './App.css';
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import SkipToContent from "./components/SkipToContent/SkipToContent";
import PageTransition from "./components/PageTransition";
import SEO from "./components/SEO";

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

function AnimatedWaves() {
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

  useEffect(() => {
    // Stratified random phases: divide [0, 2π] into N equal bands, pick one
    // random value per band, then shuffle — guarantees even spread every load.
    function stratifiedPhases(n) {
      const step = (Math.PI * 2) / n;
      const phases = Array.from({ length: n }, (_, i) => i * step + Math.random() * step);
      for (let i = phases.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [phases[i], phases[j]] = [phases[j], phases[i]];
      }
      return phases;
    }
    const sPhases = stratifiedPhases(4);
    const ePhases = stratifiedPhases(4);

    // Each wave has independent start-Y and end-Y oscillators at different periods
    // and phases. As they drift apart or together the chord tilts and the
    // concavity of the wave shape changes naturally on its own.
    const WAVES = [
      { r: r0, b: b0, cr: cr0, baseY: 320, sAmp: 95, sFreq: 9.0e-5, sPhase: sPhases[0], eAmp: 48, eFreq: 1.1e-4, ePhase: ePhases[0], wAmp:  22, wSpeed: 1.8e-5, wOff: 1.47 },
      { r: r1, b: b1, cr: cr1, baseY: 355, sAmp: 90, sFreq: 1.0e-4, sPhase: sPhases[1], eAmp: 52, eFreq: 7.5e-5, ePhase: ePhases[1], wAmp: -20, wSpeed: 1.5e-5, wOff: 1.67 },
      { r: r2, b: b2, cr: cr2, baseY: 390, sAmp: 92, sFreq: 8.0e-5, sPhase: sPhases[2], eAmp: 45, eFreq: 9.5e-5, ePhase: ePhases[2], wAmp:  24, wSpeed: 2.2e-5, wOff: 1.54 },
      { r: r3, b: b3, cr: cr3, baseY: 425, sAmp: 88, sFreq: 8.5e-5, sPhase: sPhases[3], eAmp: 50, eFreq: 1.0e-4, ePhase: ePhases[3], wAmp: -18, wSpeed: 1.9e-5, wOff: 1.72 },
    ];

    function buildPath(w, t) {
      const sY = w.baseY + w.sAmp * Math.sin(w.sFreq * t + w.sPhase);
      const eY = w.baseY + w.eAmp * Math.sin(w.eFreq * t + w.ePhase);
      // The chord defines a tilted baseline from sY to eY.
      const chord = x => sY + (eY - sY) * (x / 3000);
      // Wave humps sit on top of the chord so concavity follows the chord tilt.
      const hump  = x => w.wAmp * Math.sin((x / 3000) * Math.PI * 2 + w.wSpeed * t + w.wOff);
      const y = x => chord(x) + hump(x);
      return (
        `M 0,${sY.toFixed(1)} ` +
        `Q 380,${y(380).toFixed(1)} 780,${y(780).toFixed(1)} ` +
        `T 1560,${y(1560).toFixed(1)} ` +
        `T 2320,${y(2320).toFixed(1)} ` +
        `T 3000,${eY.toFixed(1)}`
      );
    }

    // ── Pulse timing (JS-driven so order can be shuffled each round) ──────────
    const CYCLE_MS   = 18000; // full cycle length
    const FILL_FRAC  = 0.30;  // 0–30 %: head races right, tail fixed at start
    const HOLD_FRAC  = 0.20;  // 30–50 %: fully lit — hold (same duration as rest)
    const DRAIN_FRAC = 0.30;  // 50–80 %: head fixed at end, tail catches up
    //                           80–100 %: rest (invisible) = same 20 % as hold
    // ViewBox width used for clipRect calculations
    const VB_W = 3000;
    // Offsets (ms) between waves within a round — shuffled each round
    const OFFSET_POOL = [0, 150, 310, 500];

    function shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    // cycleStarts[i] = absolute rAF timestamp when wave i's current pulse began
    let cycleStarts = [null, null, null, null];
    let roundBase   = null;

    function beginRound(baseTs) {
      roundBase = baseTs;
      const offsets = shuffle(OFFSET_POOL);
      cycleStarts = offsets.map(o => baseTs + o);
    }

    function animate(ts) {
      // Initialise on the very first frame
      if (roundBase === null) beginRound(ts);

      // When the last wave's cycle has ended, chain the next round seamlessly
      const lastStart = Math.max(...cycleStarts);
      if (ts >= lastStart + CYCLE_MS) beginRound(lastStart + CYCLE_MS);

      WAVES.forEach((w, i) => {
        const d = buildPath(w, ts);
        if (w.b.current) w.b.current.setAttribute('d', d);
        if (w.r.current) w.r.current.setAttribute('d', d);
        if (!w.cr.current) return;

        const elapsed = ts - cycleStarts[i];
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

        w.cr.current.setAttribute('x', clipX);
        w.cr.current.setAttribute('width', clipW);
      });

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <svg className="flowing-wave" viewBox="0 0 3000 1000" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
          <stop offset="20%" stopColor="rgba(100, 180, 255, 0.38)" />
          <stop offset="50%" stopColor="rgba(130, 210, 255, 0.56)" />
          <stop offset="80%" stopColor="rgba(100, 180, 255, 0.38)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
        </linearGradient>
        {/* Clip rects control the visible window for each scan overlay */}
        <clipPath id="scan-clip-0"><rect ref={cr0} x="0" y="-200" width="0" height="1400" /></clipPath>
        <clipPath id="scan-clip-1"><rect ref={cr1} x="0" y="-200" width="0" height="1400" /></clipPath>
        <clipPath id="scan-clip-2"><rect ref={cr2} x="0" y="-200" width="0" height="1400" /></clipPath>
        <clipPath id="scan-clip-3"><rect ref={cr3} x="0" y="-200" width="0" height="1400" /></clipPath>
      </defs>
      {/* Base lines – always visible; share the same JS-driven path geometry */}
      <path ref={b0} d="" stroke="url(#wave-gradient)" strokeWidth="1.6" fill="none" className="wave-base" />
      <path ref={b1} d="" stroke="url(#wave-gradient)" strokeWidth="1.5" fill="none" className="wave-base wave-base-2" />
      <path ref={b2} d="" stroke="url(#wave-gradient)" strokeWidth="1.5" fill="none" className="wave-base wave-base-3" />
      <path ref={b3} d="" stroke="url(#wave-gradient)" strokeWidth="1.6" fill="none" className="wave-base wave-base-4" />
      {/* Scan highlights – clipPath reveals only the dots inside the window */}
      <path ref={r0} d="" stroke="url(#wave-gradient)" strokeWidth="2.9" fill="none" className="wave-line" clipPath="url(#scan-clip-0)" />
      <path ref={r1} d="" stroke="url(#wave-gradient)" strokeWidth="2.8" fill="none" className="wave-line wave-line-2" clipPath="url(#scan-clip-1)" />
      <path ref={r2} d="" stroke="url(#wave-gradient)" strokeWidth="2.8" fill="none" className="wave-line wave-line-3" clipPath="url(#scan-clip-2)" />
      <path ref={r3} d="" stroke="url(#wave-gradient)" strokeWidth="2.9" fill="none" className="wave-line wave-line-4" clipPath="url(#scan-clip-3)" />
    </svg>
  );
}

function App() {
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
    let idleHandle;
    let fallbackPreloadTimeout;
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

    const preloadNonCriticalInBackground = () => {
      BOOT_IMAGES.forEach((name) => {
        const img = new Image();
        img.src = `${import.meta.env.BASE_URL}${name}`;
      });

      ROUTE_PRELOADERS.forEach((loadRoute) => {
        void loadRoute();
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(preloadNonCriticalInBackground, { timeout: 1200 });
    } else {
      fallbackPreloadTimeout = window.setTimeout(preloadNonCriticalInBackground, 350);
    }

    return () => {
      isCancelled = true;
      window.clearTimeout(minDelayTimeout);
      window.clearTimeout(bootTimeout);
      window.clearTimeout(fallbackPreloadTimeout);
      window.cancelAnimationFrame(rafBootA);
      window.cancelAnimationFrame(rafBootB);
      if (idleHandle && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
    };
  }, []);

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
    let rafA;
    let rafB;

    // Prime decorations behind the loader so the first visible frame already has flowing shapes.
    rafA = window.requestAnimationFrame(() => {
      rafB = window.requestAnimationFrame(() => {
        setShowDecorations(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(rafA);
      window.cancelAnimationFrame(rafB);
    };
  }, []);

  useEffect(() => {
    if (!showDecorations) {
      return;
    }

    let rafA;
    let rafB;
    let isCancelled = false;

    // Wait an extra paint cycle after mounting waves so reveal starts with lines already rendered.
    rafA = window.requestAnimationFrame(() => {
      rafB = window.requestAnimationFrame(() => {
        if (!isCancelled) {
          setIsWavePaintReady(true);
        }
      });
    });

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(rafA);
      window.cancelAnimationFrame(rafB);
    };
  }, [showDecorations]);

  useEffect(() => {
    if (!showDecorations) {
      return;
    }

    const lockTimeout = window.setTimeout(() => {
      setAreShapesLocked(true);
    }, 3600);

    return () => {
      window.clearTimeout(lockTimeout);
    };
  }, [showDecorations]);

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

          <div className={`theme-bg ${showDecorations ? "is-ready" : "is-deferred"} ${areShapesLocked ? "is-locked" : ""}`} aria-hidden="true">
            {showDecorations && (
              <>
                <AnimatedWaves />
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
