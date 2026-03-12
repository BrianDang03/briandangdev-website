import './App.css';
import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import WaveLines from './components/WaveLines/WaveLines';
import DecorativeShapes from './components/DecorativeShapes/DecorativeShapes';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import PageTransition from './components/PageTransition';
import SEO from './components/SEO';
import AppLoader from './components/AppLoader/AppLoader';
import SkipToContent from './components/SkipToContent/SkipToContent';
import { useAppBoot } from './hooks/useAppBoot';
import { shouldUseSimpleMotion } from './utils/motionProfile';

const Home = lazy(() => import('./pages/Home/Home'));
const Portfolio = lazy(() => import('./pages/Portfolio/Portfolio'));
const About = lazy(() => import('./pages/About/About'));

function RouteLoadingFallback({ label }) {
  return (
    <div className="route-loading" role="status" aria-live="polite" aria-busy="true">
      <div className="app-loader-mark" aria-hidden="true" />
      <p className="app-loader-text">Loading {label}...</p>
    </div>
  );
}

function App() {
  const location = useLocation();
  const simpleMotion = shouldUseSimpleMotion();
  const { showDecorations, showLoader, isLoaderExiting, areShapesLocked, canRevealApp } =
    useAppBoot(simpleMotion);

  return (
    <ErrorBoundary>
      <>
        <div className={`app-root ${canRevealApp ? 'app-root-enter' : 'app-root-preboot'}`}>

          {/* Layer 5 — Skip to content (--z-skip: 9999, keyboard-only) */}
          <SkipToContent />

          {/* Layer 1 — Wave background (--z-wave: -4) */}
          <div className={`wave-bg ${showDecorations ? 'is-ready' : 'is-deferred'}`} aria-hidden="true">
            {showDecorations && !simpleMotion && <WaveLines />}
          </div>

          {/* Layer 2 — Decorative shapes (--z-shapes: 1) */}
          <DecorativeShapes show={showDecorations} isLocked={areShapesLocked} />

          {/* Layer 3 — Navbar (--z-navbar: 15) */}
          <Navbar />

          {/* Layer 4 — Page content (normal flow) */}
          <main className="main-content" id="main-content">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route
                  path="/"
                  element={
                    <Suspense fallback={<RouteLoadingFallback label="Home" />}>
                      <Home name="Brian Dang" job="Software Engineer" />
                    </Suspense>
                  }
                />
                <Route
                  path="/portfolio"
                  element={
                    <Suspense fallback={<RouteLoadingFallback label="Portfolio" />}>
                      <Portfolio />
                    </Suspense>
                  }
                />
                <Route
                  path="/about"
                  element={
                    <Suspense fallback={<RouteLoadingFallback label="About" />}>
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

          {/* Footer — (--z-footer: 2 in Footer.css) */}
          <Footer />

        </div>

        {/* Layer 6 — App loader (--z-loader: 60) — sibling of app-root, NOT
            a child, so it is unaffected by app-root-preboot's opacity: 0 */}
        <AppLoader show={showLoader} isExiting={isLoaderExiting} canRevealApp={canRevealApp} />
      </>
    </ErrorBoundary>
  );
}

export default App;

