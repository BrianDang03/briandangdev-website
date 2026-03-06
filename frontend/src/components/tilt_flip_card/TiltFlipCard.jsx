import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import "./TiltFlipCard.css";

const MOVE_THRESHOLD = 10;

const POINTER_DEFAULT = {
  isDown: false,
  moved: false,
  startX: 0,
  startY: 0,
  activePointerId: null
};

const VISUAL_DEFAULT = {
  "--hover": "0",
  "--rx": "0deg",
  "--ry": "0deg",
  "--glare-o": "0",
  "--glare-x": "50%",
  "--glare-y": "50%",
  "--expand-x": "0px",
  "--expand-y": "0px",
  "--expand-scale": "1"
};

export default function TiltFlipCard({
  frontImg,
  front,
  backImg,
  back,
  width = 320,
  height = 420,
  maxTilt = 12,
  popOut = 18
}) {
  const sceneRef = useRef(null);
  const tiltRef = useRef(null);
  const rafRef = useRef(0);
  const pointerRef = useRef({ ...POINTER_DEFAULT });

  const [expanded, setExpanded] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const styleVars = useMemo(
    () => ({
      "--card-w": `${width}px`,
      "--card-h": `${height}px`,
      "--pop-out": `${popOut}px`
    }),
    [width, height, popOut]
  );

  const applyVars = useCallback((vars) => {
    const el = tiltRef.current;
    if (!el) return;

    for (const [key, value] of Object.entries(vars)) {
      el.style.setProperty(key, value);
    }
  }, []);

  const resetPointerState = useCallback(() => {
    pointerRef.current = { ...POINTER_DEFAULT };
  }, []);

  const resetVisualState = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    applyVars(VISUAL_DEFAULT);
  }, [applyVars]);

  const fullReset = useCallback(() => {
    resetPointerState();
    resetVisualState();
  }, [resetPointerState, resetVisualState]);

  const updateTilt = useCallback(
    (clientX, clientY) => {
      if (expanded) return;

      const el = tiltRef.current;
      if (!el) return;

      cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const nx = x / rect.width - 0.5;
        const ny = y / rect.height - 0.5;

        const tiltX = -ny * maxTilt;
        const tiltY = nx * maxTilt;

        applyVars({
          "--hover": "1",
          "--rx": `${tiltX}deg`,
          "--ry": `${tiltY}deg`,
          "--glare-x": `${(x / rect.width) * 100}%`,
          "--glare-y": `${(y / rect.height) * 100}%`,
          "--glare-o": "1"
        });
      });
    },
    [expanded, maxTilt, applyVars]
  );

  const computeExpandedTransform = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const rect = scene.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const edgeGap = Math.min(48, viewportW * 0.06);
    const maxW = viewportW - edgeGap * 2;
    const maxH = viewportH - edgeGap * 2;

    const scale = Math.min(maxW / rect.width, maxH / rect.height, 2.2);

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    applyVars({
      "--expand-x": `${viewportW / 2 - centerX}px`,
      "--expand-y": `${viewportH / 2 - centerY}px`,
      "--expand-scale": `${scale}`
    });
  }, [applyVars]);

  const openInspect = useCallback(() => {
    computeExpandedTransform();

    applyVars({
      "--hover": "0",
      "--rx": "0deg",
      "--ry": "0deg",
      "--glare-o": "0"
    });

    setExpanded(true);
    setFlipped(true);
  }, [computeExpandedTransform, applyVars]);

  const closeInspect = useCallback(() => {
    setExpanded(false);
    setFlipped(false);

    requestAnimationFrame(() => {
      fullReset();
    });
  }, [fullReset]);

  const endPointerInteraction = useCallback(() => {
    resetPointerState();

    if (!expanded) {
      resetVisualState();
    }
  }, [expanded, resetPointerState, resetVisualState]);

  useLayoutEffect(() => {
    if (!expanded) return;

    const handleResize = () => {
      computeExpandedTransform();
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [expanded, computeExpandedTransform]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && expanded) {
        closeInspect();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = expanded ? "hidden" : "";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      cancelAnimationFrame(rafRef.current);
    };
  }, [expanded, closeInspect]);

  const onPointerEnter = useCallback(
    (e) => {
      if (expanded || e.pointerType !== "mouse") return;
      updateTilt(e.clientX, e.clientY);
    },
    [expanded, updateTilt]
  );

  const onPointerDown = useCallback(
    (e) => {
      if (expanded) return;

      pointerRef.current = {
        isDown: true,
        moved: false,
        startX: e.clientX,
        startY: e.clientY,
        activePointerId: e.pointerId
      };

      if (e.pointerType === "touch" || e.pointerType === "pen") {
        updateTilt(e.clientX, e.clientY);
      }
    },
    [expanded, updateTilt]
  );

  const onPointerMove = useCallback(
    (e) => {
      if (expanded) return;

      const state = pointerRef.current;

      if (e.pointerType === "mouse") {
        updateTilt(e.clientX, e.clientY);
        return;
      }

      if (!state.isDown || state.activePointerId !== e.pointerId) return;

      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;

      if (Math.hypot(dx, dy) > MOVE_THRESHOLD) {
        state.moved = true;
      }

      updateTilt(e.clientX, e.clientY);
    },
    [expanded, updateTilt]
  );

  const onPointerUp = useCallback(
    (e) => {
      if (expanded) return;

      const state = pointerRef.current;

      if (e.pointerType === "mouse") {
        openInspect();
        endPointerInteraction();
        return;
      }

      const wasTap =
        state.isDown &&
        state.activePointerId === e.pointerId &&
        !state.moved;

      if (wasTap) {
        openInspect();
      } else {
        endPointerInteraction();
      }
    },
    [expanded, openInspect, endPointerInteraction]
  );

  const onPointerLeave = useCallback(
    (e) => {
      if (expanded) return;
      if (e.pointerType === "mouse") {
        resetVisualState();
      }
    },
    [expanded, resetVisualState]
  );

  const onPointerCancel = useCallback(() => {
    endPointerInteraction();
  }, [endPointerInteraction]);

  return (
    <>
      {expanded && <div className="tfc-backdrop" onClick={closeInspect} />}

      <div
        ref={sceneRef}
        className={`tfc-scene ${expanded ? "is-expanded" : ""}`}
        style={styleVars}
        onPointerEnter={onPointerEnter}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerCancel}
      >
        <div
          ref={tiltRef}
          className={`tfc-tilt ${expanded ? "is-expanded" : ""}`}
        >
          <div
            className={`tfc-flip ${flipped ? "is-flipped" : ""} ${expanded ? "is-expanded" : ""}`}
          >
            <div className="tfc-face tfc-front">
              {frontImg && (
                <img
                  src={frontImg}
                  alt="card background"
                  className="card-bg-image"
                  loading="lazy"
                  decoding="async"
                />
              )}

              {!expanded && <div className="tfc-glare" />}

              {!expanded && (
                <div className="card-overlay">
                  <div className="tfc-content">{front}</div>
                </div>
              )}
            </div>

            <div className={`tfc-face tfc-back ${expanded ? "tfc-back-expanded" : ""}`}>
              {backImg && (
                <img
                  src={backImg}
                  alt="card background"
                  className="card-bg-image"
                  loading="lazy"
                  decoding="async"
                />
              )}

              {!expanded && <div className="tfc-glare" />}

              <div className={`card-overlay ${expanded ? "back-overlay" : ""}`}>
                {expanded && (
                  <button
                    className="tfc-close-btn"
                    onClick={closeInspect}
                    aria-label="Close expanded card"
                    type="button"
                  >
                    <span>x</span>
                  </button>
                )}

                <div className={`tfc-content ${expanded ? "tfc-scroll-content" : ""}`}>
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