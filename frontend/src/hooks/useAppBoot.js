import { useEffect, useRef, useState } from "react";
import {
    BOOT_MIN_DELAY_MS,
    BOOT_ASSET_TIMEOUT_MS,
    BOOT_IMAGES,
    ROUTE_PRELOADERS,
    withTimeout,
    preloadImage,
} from "../utils/boot";

// Non-critical images to prefetch during idle time after first paint.
// These are the smallest responsive variants for the remaining two home cards
// so they feel instant when the user scrolls or flips.
const IDLE_PREFETCH_IMAGES = [
    "headshot-480.webp",
    "contact-480.webp",
    "flipIcon.png",
];

/**
 * Orchestrates the full app boot sequence:
 *   1. Mark perf start (DEV only)
 *   2. Lock scroll restoration to top-of-page
 *   3. Wait for: min delay + two paint frames + critical image preloads
 *   4. Once ready, fade out the loader overlay
 *   5. Prefetch non-critical routes/images during idle time
 *   6. Mount and settle decorative background visuals
 *   7. Lock shape entrance animations after their intro window
 *
 * @param {boolean} simpleMotion — reduces/skips animations on low-end devices
 * @returns {{ showDecorations, showLoader, isLoaderExiting, areShapesLocked, canRevealApp }}
 */
export function useAppBoot(simpleMotion) {
    const [showDecorations, setShowDecorations] = useState(false);
    const [isWavePaintReady, setIsWavePaintReady] = useState(false);
    const [areShapesLocked, setAreShapesLocked] = useState(false);
    const [isBootReady, setIsBootReady] = useState(false);
    const [showLoader, setShowLoader] = useState(true);
    const [isLoaderExiting, setIsLoaderExiting] = useState(false);
    const hasLoggedBootMeasureRef = useRef(false);

    const canRevealApp = isBootReady && isWavePaintReady;

    // DEV-only: capture the start of boot for performance measurement.
    useEffect(() => {
        if (!import.meta.env.DEV || typeof performance === "undefined") return;
        performance.mark("app-boot-start");
    }, []);

    // Prevent the browser from restoring an old scroll position on refresh.
    useEffect(() => {
        const canControl = typeof window !== "undefined" && "scrollRestoration" in window.history;
        const prev = canControl ? window.history.scrollRestoration : undefined;
        if (canControl) window.history.scrollRestoration = "manual";
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        return () => {
            if (canControl && prev) window.history.scrollRestoration = prev;
        };
    }, []);

    // Core boot: resolve after a minimum delay, two paint frames, and critical
    // image preloads — whichever takes longest. A hard-cap timeout prevents the
    // app from being stuck if preloads stall indefinitely.
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

            const preloadReady = withTimeout(preloadImages, BOOT_ASSET_TIMEOUT_MS);

            // Hard cap: fire regardless if the normal path stalls.
            bootTimeout = window.setTimeout(() => {
                if (!isCancelled) setIsBootReady(true);
            }, BOOT_ASSET_TIMEOUT_MS + BOOT_MIN_DELAY_MS + 300);

            await Promise.allSettled([minDelay, nextPaint, preloadReady]);
            if (!isCancelled) setIsBootReady(true);
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

    // After the app is revealed, prefetch non-critical images and route chunks
    // during browser idle time so subsequent navigations feel instant.
    useEffect(() => {
        if (!canRevealApp) return;

        let isCancelled = false;
        let idleHandle;
        let fallbackTimeout;

        const preloadNonCritical = () => {
            if (isCancelled) return;

            // Prefetch the small responsive variants (not the originals) so
            // the browser has them warm for the second and third home cards.
            IDLE_PREFETCH_IMAGES.forEach((name) => {
                const img = new Image();
                img.src = `${import.meta.env.BASE_URL}${name}`;
            });

            // Stagger route preloads so they don't all parse/execute in the same frame.
            ROUTE_PRELOADERS.forEach((loadRoute, index) => {
                window.setTimeout(() => {
                    if (!isCancelled) void loadRoute();
                }, index * 220);
            });
        };

        if (typeof window.requestIdleCallback === "function") {
            idleHandle = window.requestIdleCallback(preloadNonCritical, { timeout: 2400 });
        } else {
            fallbackTimeout = window.setTimeout(preloadNonCritical, 900);
        }

        return () => {
            isCancelled = true;
            window.clearTimeout(fallbackTimeout);
            if (idleHandle && typeof window.cancelIdleCallback === "function") {
                window.cancelIdleCallback(idleHandle);
            }
        };
    }, [canRevealApp]);

    // DEV-only: log precise boot duration once isBootReady fires.
    useEffect(() => {
        if (
            !import.meta.env.DEV ||
            !isBootReady ||
            hasLoggedBootMeasureRef.current ||
            typeof performance === "undefined"
        ) return;

        performance.mark("app-boot-ready");
        performance.measure("app-boot-duration", "app-boot-start", "app-boot-ready");
        const [entry] = performance.getEntriesByName("app-boot-duration").slice(-1);
        if (entry) console.info(`[perf] App boot ready in ${entry.duration.toFixed(1)}ms`);
        hasLoggedBootMeasureRef.current = true;
    }, [isBootReady]);

    // Mount decorations immediately — wave and shape entrance animations are the
    // primary visual treatment while the loader covers the content.
    useEffect(() => {
        setShowDecorations(true);
    }, []);

    // Wait for decorations to be mounted and painted — two RAF frames for path
    // geometry to settle, then a short extra delay before clearing the loader.
    // On simpleMotion devices WaveLines are never rendered, so we skip the
    // wait entirely and set ready immediately after two paints.
    useEffect(() => {
        if (!showDecorations) return;

        let rafA, rafB, paintTimer;
        let isCancelled = false;

        rafA = window.requestAnimationFrame(() => {
            rafB = window.requestAnimationFrame(() => {
                if (simpleMotion) {
                    if (!isCancelled) setIsWavePaintReady(true);
                    return;
                }
                paintTimer = window.setTimeout(() => {
                    if (!isCancelled) setIsWavePaintReady(true);
                }, 150);
            });
        });

        return () => {
            isCancelled = true;
            window.cancelAnimationFrame(rafA);
            window.cancelAnimationFrame(rafB);
            window.clearTimeout(paintTimer);
        };
    }, [showDecorations, simpleMotion]);

    // Lock shape entrance animations after their intro window to free GPU layers.
    useEffect(() => {
        if (!showDecorations) return;
        if (simpleMotion) {
            setAreShapesLocked(true);
            return;
        }
        const t = window.setTimeout(() => setAreShapesLocked(true), 3600);
        return () => window.clearTimeout(t);
    }, [showDecorations, simpleMotion]);

    // Once the app is ready to reveal, fade out the loader overlay.
    useEffect(() => {
        if (!canRevealApp) return;

        let hideLoaderTimeout;
        const rafId = window.requestAnimationFrame(() => {
            setIsLoaderExiting(true);
            hideLoaderTimeout = window.setTimeout(() => setShowLoader(false), 260);
        });

        return () => {
            window.cancelAnimationFrame(rafId);
            window.clearTimeout(hideLoaderTimeout);
        };
    }, [canRevealApp]);

    return { showDecorations, showLoader, isLoaderExiting, areShapesLocked, canRevealApp };
}
