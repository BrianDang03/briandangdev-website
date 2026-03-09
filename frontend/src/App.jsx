import './App.css';
import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import SkipToContent from "./components/SkipToContent";
import PageTransition from "./components/PageTransition";
import SEO from "./components/SEO";

const Portfolio = lazy(() => import("./pages/Portfolio"));
const About = lazy(() => import("./pages/About"));

function App() {
  const location = useLocation();
  const [showDecorations, setShowDecorations] = useState(false);

  useEffect(() => {
    let idleHandle;
    let timeoutHandle;

    const enableDecorations = () => setShowDecorations(true);

    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(enableDecorations, { timeout: 350 });
    } else {
      timeoutHandle = window.setTimeout(enableDecorations, 120);
    }

    return () => {
      if (idleHandle) {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle) {
        window.clearTimeout(timeoutHandle);
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="site-root">
        <SkipToContent />

        <div className={`theme-bg ${showDecorations ? "is-ready" : "is-deferred"}`} aria-hidden="true">
          {showDecorations && (
            <>
              <svg className="flowing-wave" viewBox="0 0 3000 1000" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
                    <stop offset="20%" stopColor="rgba(100, 180, 255, 0.2)" />
                    <stop offset="50%" stopColor="rgba(100, 200, 255, 0.25)" />
                    <stop offset="80%" stopColor="rgba(100, 180, 255, 0.2)" />
                    <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                  </linearGradient>
                </defs>
                {/* Simple intertwined wave lines */}
                <path
                  d="M 0,250 Q 380,210 780,310 T 1560,250 T 2320,300 T 3000,260"
                  stroke="url(#wave-gradient)"
                  strokeWidth="2"
                  fill="none"
                  className="wave-line"
                />
                <path
                  d="M 0,330 Q 360,390 760,280 T 1540,350 T 2300,290 T 3000,340"
                  stroke="url(#wave-gradient)"
                  strokeWidth="2"
                  fill="none"
                  className="wave-line wave-line-2"
                />
                <path
                  d="M 0,430 Q 400,370 820,470 T 1620,410 T 2360,480 T 3000,430"
                  stroke="url(#wave-gradient)"
                  strokeWidth="2"
                  fill="none"
                  className="wave-line wave-line-3"
                />
                <path
                  d="M 0,510 Q 380,560 800,460 T 1600,530 T 2360,470 T 3000,520"
                  stroke="url(#wave-gradient)"
                  strokeWidth="2"
                  fill="none"
                  className="wave-line wave-line-4"
                />
              </svg>
              <span className="orb orb-left" />
              <span className="orb orb-right" />
              <span className="orb orb-nav-cut orb-nav-1" />
              <span className="orb orb-nav-cut orb-nav-2" />
              <span className="beam beam-two" />
              <span className="hexagon hex-1" />
              <span className="hexagon hex-2" />
              <span className="hexagon hex-3" />
              <span className="hexagon hex-4" />
              <span className="hexagon hex-5" />
              <span className="hexagon hex-6" />
              <span className="hexagon hex-7" />
              <span className="hexagon hex-8" />
              <span className="orb orb-3" />
              <span className="orb orb-4" />
              <span className="orb orb-5" />
              <span className="orb orb-6" />
              <span className="orb orb-7" />
              <span className="orb orb-8" />
              <span className="orb orb-9" />
              <span className="orb orb-10" />
              <span className="orb orb-11" />
              <span className="orb orb-12" />
              <span className="orb orb-13" />
              <span className="orb orb-14" />
              <span className="orb orb-15" />
              <span className="orb orb-16" />
              <span className="orb orb-17" />
              <span className="orb orb-18" />
              <span className="orb orb-19" />
              <span className="orb orb-20" />
              <span className="floating-plus plus-1" />
              <span className="floating-plus plus-2" />
              <span className="floating-plus plus-3" />
              <span className="floating-plus plus-4" />
              <span className="floating-plus plus-5" />
              <span className="floating-plus plus-6" />
              <span className="floating-plus plus-7" />
              <span className="floating-plus plus-8" />
              <span className="floating-plus plus-9" />
              <span className="floating-plus plus-10" />
              <span className="floating-plus plus-11" />
              <span className="floating-plus plus-12" />
              <span className="floating-plus plus-13" />
              <span className="floating-plus plus-14" />
              <span className="floating-plus plus-15" />
              <span className="floating-plus plus-16" />
              <span className="floating-plus plus-17" />
              <span className="floating-plus plus-18" />
              <span className="floating-plus plus-19" />
              <span className="floating-plus plus-20" />
              <span className="floating-plus plus-21" />
              <span className="floating-plus plus-22" />
              <span className="floating-plus plus-23" />
              <span className="floating-plus plus-24" />
            </>
          )}
        </div>

        <Navbar />

        <main className="main-content" id="main-content">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home name="Brian Dang" job="Software Engineer" />} />
              <Route
                path="/portfolio"
                element={
                  <Suspense fallback={<section className="page-shell route-loading">Loading portfolio...</section>}>
                    <Portfolio />
                  </Suspense>
                }
              />
              <Route
                path="/about"
                element={
                  <Suspense fallback={<section className="page-shell route-loading">Loading about...</section>}>
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
    </ErrorBoundary>
  );
}

export default App;
