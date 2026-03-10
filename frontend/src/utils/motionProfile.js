let cachedSimpleMotion = null;

export function shouldUseSimpleMotion() {
  if (cachedSimpleMotion !== null) {
    return cachedSimpleMotion;
  }

  if (typeof window === "undefined") {
    cachedSimpleMotion = false;
    return cachedSimpleMotion;
  }

  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const prefersDataSaver = Boolean(connection && connection.saveData);
  // ≤2 cores = genuinely low-end (budget Android). 4-core phones are common
  // mid-range devices that handle 4 wave lines fine.
  const lowCoreDevice = (navigator.hardwareConcurrency || 8) <= 2;
  // ≤2 GB RAM = genuinely constrained. 4 GB is normal for mid-range phones.
  const lowMemoryDevice = (navigator.deviceMemory || 8) <= 2;

  cachedSimpleMotion = prefersReducedMotion || prefersDataSaver || lowCoreDevice || lowMemoryDevice;
  return cachedSimpleMotion;
}