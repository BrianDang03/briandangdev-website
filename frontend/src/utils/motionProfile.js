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
  const lowCoreDevice = (navigator.hardwareConcurrency || 8) <= 4;
  const lowMemoryDevice = (navigator.deviceMemory || 8) <= 4;

  cachedSimpleMotion = prefersReducedMotion || prefersDataSaver || lowCoreDevice || lowMemoryDevice;
  return cachedSimpleMotion;
}