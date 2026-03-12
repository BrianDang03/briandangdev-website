import './App.css';
import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import SkipToContent from "./components/SkipToContent/SkipToContent";
import PageTransition from "./components/PageTransition";
import SEO from "./components/SEO";
import { shouldUseSimpleMotion } from "./utils/motionProfile";
import WaveLines from "./components/WaveLines/WaveLines";

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
            {showDecorations && <WaveLines />}
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
