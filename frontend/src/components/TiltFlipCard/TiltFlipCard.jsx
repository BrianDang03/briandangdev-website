import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import "./TiltFlipCard.css";

const MOVE_THRESHOLD_PX = 10;
const DEFAULT_EXPAND_SCALE_MAX = 2.2;
const DEFAULT_EDGE_GAP_PX = 48;
const DEFAULT_EDGE_GAP_RATIO = 0.06;
const BASE_ENTRANCE_DELAY_MS = 0; // Start card entrance motion immediately
const LERP_FACTOR_TILT = 0.24; // Tilt rotation responsiveness: higher = faster tracking
const LERP_FACTOR = 0.24; // Glare/shadow responsiveness
const LERP_FACTOR_POPOUT = 0.10; // Popout responsiveness — 0.10 exits RAF in ~620ms vs ~1050ms at 0.06
const CLOSE_RETURN_MS = 720;

const POINTER_INITIAL_STATE = {
  isDown: false,
  moved: false,
  startX: 0,
  startY: 0,
  activePointerId: null
};

const VISUAL_INITIAL_STATE = {
  "--hover": "0",
  "--rx": "0deg",
  "--ry": "0deg",
  "--glare-o": "0",
  "--glare-x": "50%",
  "--glare-y": "50%",
  "--shadow-x": "0px",
  "--shadow-y": "0px",
  "--shadow-blur": "20px",
  "--expand-x": "0px",
  "--expand-y": "0px",
  "--expand-scale": "1"
};

// Mobile browsers can emit delayed synthetic hover/mouse events after touch taps.
// Use a short global suppression window so closing one expanded card cannot
// accidentally tilt another card behind it.
let globalPointerSuppressionUntil = 0;

function suppressGlobalPointer(ms = 320) {
  const now = performance.now();
  globalPointerSuppressionUntil = Math.max(globalPointerSuppressionUntil, now + ms);
}

function isGlobalPointerSuppressed() {
  return performance.now() < globalPointerSuppressionUntil;
}

function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

function getDistance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function getExpandedMetrics(rect) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const edgeGap = Math.min(
    DEFAULT_EDGE_GAP_PX,
    viewportWidth * DEFAULT_EDGE_GAP_RATIO
  );

  const maxWidth = viewportWidth - edgeGap * 2;
  const maxHeight = viewportHeight - edgeGap * 2;

  const scale = Math.min(
    maxWidth / rect.width,
    maxHeight / rect.height,
    DEFAULT_EXPAND_SCALE_MAX
  );

  const scaledWidth = rect.width * scale;
  const scaledHeight = rect.height * scale;

  const targetLeft = (viewportWidth - scaledWidth) / 2;
  const targetTop = (viewportHeight - scaledHeight) / 2;

  return {
    x: `${targetLeft - rect.left}px`,
    y: `${targetTop - rect.top}px`,
    scale
  };
}

export default function TiltFlipCard({
  frontImg,
  frontWebpSrcSet,
  frontJpegSrcSet,
  frontSizes,
  front,
  backImg,
  back,
  prioritizeFrontImage = false,
  width = 320,
  height = 420,
  maxTilt = 12,
  popOut = 50,
  extendOut = 1,
  retractFactor = 0.94,
  entranceFrom = "top",
  entranceOrder = 0
}) {
  const sceneRef = useRef(null);
  const tiltRef = useRef(null);
  const rafRef = useRef(0);
  const pointerRafRef = useRef(0);
  const pendingPointerRef = useRef(null);
  const animateLerpRef = useRef(null);
  const closeReturnTimerRef = useRef(0);
  const pointerStateRef = useRef({ ...POINTER_INITIAL_STATE });

  // Lerp state: current and target values
  const lerpStateRef = useRef({
    current: {
      rx: 0,
      ry: 0,
      glareX: 50,
      glareY: 50,
      glareO: 0,
      shadowX: 0,
      shadowY: 0,
      shadowBlur: 20,
      hover: 0
    },
    target: {
      rx: 0,
      ry: 0,
      glareX: 50,
      glareY: 50,
      glareO: 0,
      shadowX: 0,
      shadowY: 0,
      shadowBlur: 20,
      hover: 0
    }
  });
  const isAnimatingRef = useRef(false);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [isBackdropVisible, setIsBackdropVisible] = useState(false);
  const [frontVisibleSrc, setFrontVisibleSrc] = useState(frontImg || null);
  const [backVisibleSrc, setBackVisibleSrc] = useState(backImg || null);

  const isFrontImageVisible = !frontImg || frontVisibleSrc === frontImg;
  const isBackImageVisible = !backImg || backVisibleSrc === backImg;

  useEffect(() => {
    if (!frontImg) {
      return;
    }

    const source = frontImg;
    let isCancelled = false;
    let isResolved = false;
    const img = new Image();

    const markLoaded = () => {
      if (isCancelled || isResolved) return;
      isResolved = true;

      setFrontVisibleSrc((prev) => (prev === source ? prev : source));
    };

    img.onload = markLoaded;
    img.onerror = markLoaded;
    img.src = frontImg;

    if (typeof img.decode === "function") {
      img.decode().then(markLoaded).catch(markLoaded);
    }

    return () => {
      isCancelled = true;
    };
  }, [frontImg]);

  useEffect(() => {
    if (!backImg) {
      return;
    }

    const source = backImg;
    let isCancelled = false;
    let isResolved = false;
    const img = new Image();

    const markLoaded = () => {
      if (isCancelled || isResolved) return;
      isResolved = true;

      setBackVisibleSrc((prev) => (prev === source ? prev : source));
    };

    img.onload = markLoaded;
    img.onerror = markLoaded;
    img.src = backImg;

    if (typeof img.decode === "function") {
      img.decode().then(markLoaded).catch(markLoaded);
    }

    return () => {
      isCancelled = true;
    };
  }, [backImg]);

  const supportsMouseHover = useCallback(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return true;
    }
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);

  const cssVars = useMemo(
    () => ({
      "--card-w": `${width}px`,
      "--card-h": `${height}px`,
      "--pop-out": `${popOut}px`,
      "--extend-out": `${extendOut}`,
      "--retract-factor": `${retractFactor}`,
      "--tfc-enter-delay": `${BASE_ENTRANCE_DELAY_MS + Math.max(0, entranceOrder) * 120}ms`,
      "--tfc-bg-enter-delay": `${BASE_ENTRANCE_DELAY_MS + Math.max(0, entranceOrder) * 120}ms`
    }),
    [width, height, popOut, extendOut, retractFactor, entranceOrder]
  );

  const entranceClass =
    entranceFrom === "left"
      ? "tfc-enter-left"
      : entranceFrom === "right"
        ? "tfc-enter-right"
        : entranceFrom === "front"
          ? "tfc-enter-front"
          : "tfc-enter-top";

  const applyCssVars = useCallback((vars) => {
    const element = tiltRef.current;
    if (!element) return;

    Object.entries(vars).forEach(([key, value]) => {
      element.style.setProperty(key, value);
    });
  }, []);

  const resetPointerState = useCallback(() => {
    pointerStateRef.current = { ...POINTER_INITIAL_STATE };
  }, []);

  const resetVisualState = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    isAnimatingRef.current = false;

    // Reset lerp state
    const { target: tgt, current: cur } = lerpStateRef.current;
    tgt.rx = 0; tgt.ry = 0; tgt.glareX = 50; tgt.glareY = 50;
    tgt.glareO = 0; tgt.shadowX = 0; tgt.shadowY = 0; tgt.shadowBlur = 20; tgt.hover = 0;
    Object.assign(cur, tgt);

    applyCssVars(VISUAL_INITIAL_STATE);
  }, [applyCssVars]);

  const animateLerp = useCallback(() => {
    if (!isAnimatingRef.current) return;

    const element = tiltRef.current;
    if (!element) {
      isAnimatingRef.current = false;
      return;
    }

    const style = element.style;

    const state = lerpStateRef.current;
    const { current, target } = state;

    // Lerp all values with independent factors
    current.rx = lerp(current.rx, target.rx, LERP_FACTOR_TILT);
    current.ry = lerp(current.ry, target.ry, LERP_FACTOR_TILT);
    current.glareX = lerp(current.glareX, target.glareX, LERP_FACTOR);
    current.glareY = lerp(current.glareY, target.glareY, LERP_FACTOR);
    current.glareO = lerp(current.glareO, target.glareO, LERP_FACTOR);
    current.shadowX = lerp(current.shadowX, target.shadowX, LERP_FACTOR);
    current.shadowY = lerp(current.shadowY, target.shadowY, LERP_FACTOR);
    current.shadowBlur = lerp(current.shadowBlur, target.shadowBlur, LERP_FACTOR);
    current.hover = lerp(current.hover, target.hover, LERP_FACTOR_POPOUT);

    // Apply lerped values directly to avoid per-frame object allocation.
    style.setProperty("--hover", current.hover.toString());
    style.setProperty("--rx", `${current.rx}deg`);
    style.setProperty("--ry", `${current.ry}deg`);
    style.setProperty("--glare-x", `${current.glareX}%`);
    style.setProperty("--glare-y", `${current.glareY}%`);
    style.setProperty("--glare-o", current.glareO.toString());
    style.setProperty("--shadow-x", `${current.shadowX}px`);
    style.setProperty("--shadow-y", `${current.shadowY}px`);
    style.setProperty("--shadow-blur", `${current.shadowBlur}px`);

    // Snap imperceptibly-close values to target so the RAF loop exits sooner.
    // Angles: 0.03° is well below visual threshold at 20° maxTilt.
    // Percentages / opacity / hover: 0.02 unit.
    // Shadow pixels: 0.3px — sub-pixel, invisible.
    const SNAP_ANGLE = 0.03;
    const SNAP_UNIT = 0.02;
    const SNAP_PX = 0.3;
    if (Math.abs(current.rx - target.rx) < SNAP_ANGLE) current.rx = target.rx;
    if (Math.abs(current.ry - target.ry) < SNAP_ANGLE) current.ry = target.ry;
    if (Math.abs(current.glareO - target.glareO) < SNAP_UNIT) current.glareO = target.glareO;
    if (Math.abs(current.hover - target.hover) < SNAP_UNIT) current.hover = target.hover;
    if (Math.abs(current.glareX - target.glareX) < SNAP_PX) current.glareX = target.glareX;
    if (Math.abs(current.glareY - target.glareY) < SNAP_PX) current.glareY = target.glareY;
    if (Math.abs(current.shadowX - target.shadowX) < SNAP_PX) current.shadowX = target.shadowX;
    if (Math.abs(current.shadowY - target.shadowY) < SNAP_PX) current.shadowY = target.shadowY;
    if (Math.abs(current.shadowBlur - target.shadowBlur) < SNAP_PX) current.shadowBlur = target.shadowBlur;

    const isClose =
      current.rx === target.rx &&
      current.ry === target.ry &&
      current.glareO === target.glareO &&
      current.hover === target.hover &&
      current.glareX === target.glareX &&
      current.glareY === target.glareY &&
      current.shadowX === target.shadowX &&
      current.shadowY === target.shadowY &&
      current.shadowBlur === target.shadowBlur;

    if (!isClose) {
      const nextAnimate = animateLerpRef.current;
      if (nextAnimate) {
        rafRef.current = requestAnimationFrame(nextAnimate);
      }
    } else {
      isAnimatingRef.current = false;
    }
  }, []);

  useEffect(() => {
    animateLerpRef.current = animateLerp;
  }, [animateLerp]);

  useEffect(() => {
    // Unlock scroll immediately when the close animation begins (isReturning),
    // rather than waiting the full 720 ms for isExpanded to clear.
    if (!isExpanded || isReturning) return;
    const savedScrollY = window.scrollY;
    const onScroll = () => {
      window.scrollTo({ top: savedScrollY, behavior: "instant" });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.classList.add("scroll-locked");
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.documentElement.classList.remove("scroll-locked");
    };
  }, [isExpanded, isReturning]);

  const startLerpAnimation = useCallback(() => {
    if (!isAnimatingRef.current) {
      const animate = animateLerpRef.current;
      if (!animate) return;
      isAnimatingRef.current = true;
      rafRef.current = requestAnimationFrame(animate);
    }
  }, []);

  const updateTilt = useCallback(
    (clientX, clientY) => {
      if (isExpanded) return;

      const element = tiltRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const localX = clientX - rect.left;
      const localY = clientY - rect.top;

      const normalizedX = localX / rect.width - 0.5;
      const normalizedY = localY / rect.height - 0.5;

      const rotateX = -normalizedY * maxTilt;
      const rotateY = normalizedX * maxTilt;

      // Realistic light and reflection calculation
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Convert tilt angles to radians
      const tiltRadX = (rotateX * Math.PI) / 180;
      const tiltRadY = (rotateY * Math.PI) / 180;

      // Calculate surface normal based on card tilt
      const normalX = Math.sin(tiltRadY);
      const normalY = -Math.sin(tiltRadX);
      const normalZ = Math.cos(tiltRadX) * Math.cos(tiltRadY);

      // Light direction: from card center to mouse position (normalized)
      const lightDirX = (localX - centerX) / rect.width;
      const lightDirY = (localY - centerY) / rect.height;
      const lightDirZ = 1.0;

      const lightLength = Math.sqrt(lightDirX * lightDirX + lightDirY * lightDirY + lightDirZ * lightDirZ);
      const lightX = lightDirX / lightLength;
      const lightY = lightDirY / lightLength;
      const lightZ = lightDirZ / lightLength;

      // View direction
      const viewX = 0;
      const viewY = 0;
      const viewZ = 1;

      // Calculate halfway vector (Blinn-Phong)
      const halfX = lightX + viewX;
      const halfY = lightY + viewY;
      const halfZ = lightZ + viewZ;

      const halfLength = Math.sqrt(halfX * halfX + halfY * halfY + halfZ * halfZ);
      const hX = halfX / halfLength;
      const hY = halfY / halfLength;
      const hZ = halfZ / halfLength;

      // Dot product: normal · halfway
      const specular = Math.max(0, normalX * hX + normalY * hY + normalZ * hZ);

      const shininess = 14;
      const specularIntensity = Math.pow(specular, shininess);

      // Calculate reflection
      const dotNL = normalX * lightX + normalY * lightY + normalZ * lightZ;
      const reflectX = 2 * dotNL * normalX - lightX;
      const reflectY = 2 * dotNL * normalY - lightY;

      const glareX = 50 + reflectX * 80;
      const glareY = 50 + reflectY * 80;
      const intensity = Math.min(1, specularIntensity * 3.5);

      // Calculate dynamic shadow
      const shadowX = normalizedY * 25;
      const shadowY = -normalizedX * 25;
      const shadowBlur = 25 + Math.abs(normalizedX * 15) + Math.abs(normalizedY * 15);

      // Update target values for lerping
      const tgt = lerpStateRef.current.target;
      tgt.rx = rotateX;
      tgt.ry = rotateY;
      tgt.glareX = glareX;
      tgt.glareY = glareY;
      tgt.glareO = intensity;
      tgt.shadowX = shadowX;
      tgt.shadowY = shadowY;
      tgt.shadowBlur = shadowBlur;
      tgt.hover = 1;

      // Start the lerp animation
      startLerpAnimation();
    },
    [isExpanded, maxTilt, startLerpAnimation]
  );

  const computeExpandedTransform = useCallback(() => {
    const sceneElement = sceneRef.current;
    if (!sceneElement) return;

    const rect = sceneElement.getBoundingClientRect();
    const metrics = getExpandedMetrics(rect);

    applyCssVars({
      "--expand-x": metrics.x,
      "--expand-y": metrics.y,
      "--expand-scale": `${metrics.scale}`
    });
  }, [applyCssVars]);

  const openInspectView = useCallback(() => {
    window.clearTimeout(closeReturnTimerRef.current);
    setIsReturning(false);
    setIsBackdropVisible(true);

    computeExpandedTransform();

    applyCssVars({
      "--hover": "0",
      "--rx": "0deg",
      "--ry": "0deg",
      "--glare-o": "0",
      "--shadow-x": "0px",
      "--shadow-y": "0px",
      "--shadow-blur": "20px"
    });

    setIsExpanded(true);
    setIsFlipped(true);
  }, [applyCssVars, computeExpandedTransform]);

  const closeInspectView = useCallback(() => {
    if (!isExpanded || isReturning) return;

    suppressGlobalPointer(200);

    window.clearTimeout(closeReturnTimerRef.current);

    // Immediately start flipping back and translating to original position.
    const safeExtendOut = Math.max(0.01, extendOut);
    setIsFlipped(false);
    setIsReturning(true);
    setIsBackdropVisible(false);
    applyCssVars({
      "--expand-x": "0px",
      "--expand-y": "0px",
      "--expand-scale": `${1 / safeExtendOut}`
    });

    closeReturnTimerRef.current = window.setTimeout(() => {
      resetVisualState();
      setIsExpanded(false);
      setIsReturning(false);
      resetPointerState();
    }, CLOSE_RETURN_MS);

  }, [
    isExpanded,
    isReturning,
    extendOut,
    applyCssVars,
    resetVisualState,
    resetPointerState
  ]);

  const endInteraction = useCallback(() => {
    resetPointerState();
    pendingPointerRef.current = null;
    cancelAnimationFrame(pointerRafRef.current);
    pointerRafRef.current = 0;

    if (!isExpanded) {
      // Lerp back to rest state instead of instant reset
      const tgt = lerpStateRef.current.target;
      tgt.rx = 0; tgt.ry = 0; tgt.glareX = 50; tgt.glareY = 50;
      tgt.glareO = 0; tgt.shadowX = 0; tgt.shadowY = 0; tgt.shadowBlur = 20; tgt.hover = 0;
      startLerpAnimation();
    }
  }, [isExpanded, resetPointerState, startLerpAnimation]);

  const runScheduledTiltUpdate = useCallback(() => {
    pointerRafRef.current = 0;
    const pendingPointer = pendingPointerRef.current;
    if (!pendingPointer) return;
    pendingPointerRef.current = null;
    updateTilt(pendingPointer.x, pendingPointer.y);
  }, [updateTilt]);

  const scheduleTiltUpdate = useCallback((clientX, clientY) => {
    pendingPointerRef.current = { x: clientX, y: clientY };
    if (pointerRafRef.current) return;
    pointerRafRef.current = requestAnimationFrame(runScheduledTiltUpdate);
  }, [runScheduledTiltUpdate]);

  useLayoutEffect(() => {
    if (!isExpanded) return;

    const handleResize = () => {
      computeExpandedTransform();
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isExpanded, computeExpandedTransform]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isExpanded) {
        closeInspectView();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = isExpanded ? "hidden" : "";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      cancelAnimationFrame(rafRef.current);
    };
  }, [isExpanded, closeInspectView]);

  useEffect(() => {
    return () => {
      window.clearTimeout(closeReturnTimerRef.current);
      cancelAnimationFrame(pointerRafRef.current);
    };
  }, []);

  const handlePointerEnter = useCallback(
    (event) => {
      if (isExpanded || isGlobalPointerSuppressed() || event.pointerType !== "mouse") return;
      if (!supportsMouseHover()) return;
      scheduleTiltUpdate(event.clientX, event.clientY);
    },
    [isExpanded, supportsMouseHover, scheduleTiltUpdate]
  );

  const handlePointerDown = useCallback(
    (event) => {
      if (isExpanded || isGlobalPointerSuppressed()) return;

      pointerStateRef.current = {
        isDown: true,
        moved: false,
        startX: event.clientX,
        startY: event.clientY,
        activePointerId: event.pointerId
      };

      event.currentTarget.setPointerCapture?.(event.pointerId);

      if (event.pointerType === "touch" || event.pointerType === "pen") {
        scheduleTiltUpdate(event.clientX, event.clientY);
      }
    },
    [isExpanded, scheduleTiltUpdate]
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (isExpanded || isGlobalPointerSuppressed()) return;

      const pointerState = pointerStateRef.current;

      if (event.pointerType === "mouse") {
        if (!supportsMouseHover()) return;
        scheduleTiltUpdate(event.clientX, event.clientY);
        return;
      }

      if (!pointerState.isDown || pointerState.activePointerId !== event.pointerId) {
        return;
      }

      const distance = getDistance(
        pointerState.startX,
        pointerState.startY,
        event.clientX,
        event.clientY
      );

      if (distance > MOVE_THRESHOLD_PX) {
        pointerState.moved = true;
      }

      scheduleTiltUpdate(event.clientX, event.clientY);
    },
    [isExpanded, supportsMouseHover, scheduleTiltUpdate]
  );

  const handlePointerUp = useCallback(
    (event) => {
      if (isExpanded || isGlobalPointerSuppressed()) return;

      const pointerState = pointerStateRef.current;
      const distance = getDistance(
        pointerState.startX,
        pointerState.startY,
        event.clientX,
        event.clientY
      );

      const movedEnough = distance > MOVE_THRESHOLD_PX;

      event.currentTarget.releasePointerCapture?.(event.pointerId);

      if (event.pointerType === "mouse") {
        if (!supportsMouseHover()) {
          endInteraction();
          return;
        }
        if (!movedEnough) {
          openInspectView();
        }
        endInteraction();
        return;
      }

      const wasTap =
        pointerState.isDown &&
        pointerState.activePointerId === event.pointerId &&
        !pointerState.moved &&
        !movedEnough;

      if (wasTap) {
        openInspectView();
      }

      endInteraction();
    },
    [isExpanded, openInspectView, endInteraction, supportsMouseHover]
  );

  const handlePointerLeave = useCallback(
    (event) => {
      if (isExpanded || isGlobalPointerSuppressed()) return;

      if (event.pointerType === "mouse") {
        if (!supportsMouseHover()) return;
        // Lerp back to rest state
        const tgt = lerpStateRef.current.target;
        tgt.rx = 0; tgt.ry = 0; tgt.glareX = 50; tgt.glareY = 50;
        tgt.glareO = 0; tgt.shadowX = 0; tgt.shadowY = 0; tgt.shadowBlur = 20; tgt.hover = 0;
        startLerpAnimation();
      }
    },
    [isExpanded, supportsMouseHover, startLerpAnimation]
  );

  const handlePointerCancel = useCallback(
    (event) => {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      endInteraction();
    },
    [endInteraction]
  );

  const handleBackdropPointerDown = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    suppressGlobalPointer(200);
  }, []);

  const handleBackdropClick = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    suppressGlobalPointer(200);
    closeInspectView();
  }, [closeInspectView]);

  const handleCloseButtonClick = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      // Release any active pointer capture to prevent events from affecting underlying cards
      if (event.target) {
        try {
          const pointerId = pointerStateRef.current.activePointerId;
          if (pointerId !== null) {
            event.target.releasePointerCapture?.(pointerId);
          }
        } catch {
          // Ignore errors if pointer capture wasn't active
        }
      }

      closeInspectView();
    },
    [closeInspectView]
  );

  return (
    <>
      {isBackdropVisible && (
        <div
          className="tfc-backdrop"
          onPointerDown={handleBackdropPointerDown}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      <div
        ref={sceneRef}
        className={`tfc-scene ${entranceClass} ${isExpanded ? "is-expanded" : ""} ${isReturning ? "is-returning" : ""}`}
        style={cssVars}
        onPointerEnter={handlePointerEnter}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerCancel}
      >
        <div
          ref={tiltRef}
          className={`tfc-tilt ${isExpanded ? "is-expanded" : ""} ${isReturning ? "is-returning" : ""}`}
          onDragStart={(e) => e.preventDefault()}
        >
          <div className={`tfc-flip ${isFlipped ? "is-flipped" : ""}`}>
            <div className={`tfc-face tfc-front ${frontImg && !isFrontImageVisible ? "has-loading-image" : ""}`}>
              {frontImg && (
                <picture>
                  {frontWebpSrcSet && (
                    <source
                      type="image/webp"
                      srcSet={frontWebpSrcSet}
                      sizes={frontSizes}
                    />
                  )}
                  {frontJpegSrcSet && (
                    <source
                      type="image/jpeg"
                      srcSet={frontJpegSrcSet}
                      sizes={frontSizes}
                    />
                  )}
                  <img
                    src={frontImg}
                    alt=""
                    className={`card-bg-image ${isFrontImageVisible ? "is-loaded" : "is-loading"}`}
                    loading={prioritizeFrontImage ? "eager" : "lazy"}
                    fetchPriority={prioritizeFrontImage ? "high" : "auto"}
                    decoding="async"
                    draggable="false"
                    sizes={frontSizes}
                  />
                </picture>
              )}

              {!isExpanded && <div className="tfc-glare" />}

              {(!isExpanded || isReturning) && (
                <div className="card-overlay">
                  <div className="tfc-content">{front}</div>
                </div>
              )}
            </div>

            <div className={`tfc-face tfc-back ${isExpanded ? "tfc-back-expanded" : ""} ${backImg && !isBackImageVisible ? "has-loading-image" : ""}`}>
              {backImg && (
                <img
                  src={backImg}
                  alt=""
                  className={`card-bg-image ${isBackImageVisible ? "is-loaded" : "is-loading"}`}
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                />
              )}

              {!isExpanded && <div className="tfc-glare" />}

              <div
                className={`card-overlay ${isExpanded ? "back-overlay" : ""}`}
                onDragStart={(e) => e.preventDefault()}
              >
                {isExpanded && (
                  <button
                    className="tfc-close-btn"
                    onClick={handleCloseButtonClick}
                    aria-label="Close expanded card"
                    type="button"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                )}

                <div
                  className={`tfc-content ${isExpanded ? "tfc-scroll-content" : ""}`}
                  onDragStart={(e) => e.preventDefault()}
                >
                  {back}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}