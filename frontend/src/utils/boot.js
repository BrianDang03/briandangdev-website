// ── Boot sequencing constants ─────────────────────────────────────────────
export const BOOT_MIN_DELAY_MS = 200;
export const BOOT_ASSET_TIMEOUT_MS = 1800;

// Only preload the LCP-critical image at its smallest responsive size.
// Loading full-size originals (~1-1.8 MB each) as "critical" assets delayed
// FCP/LCP by forcing 4+ MB onto the blocking network waterfall.
// headshot.jpg, contact.png, and flipIcon.png are below the fold — the
// browser will prefetch them lazily via srcset after first paint.
export const BOOT_IMAGES = ["modem-480.webp"];

export const ROUTE_PRELOADERS = [
    () => import("../pages/About/About"),
    () => import("../pages/Portfolio/Portfolio"),
];

// ── Utilities ─────────────────────────────────────────────────────────────
export function withTimeout(promise, timeoutMs) {
    return Promise.race([
        promise,
        new Promise((resolve) => window.setTimeout(resolve, timeoutMs)),
    ]);
}

export function preloadImage(src) {
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
