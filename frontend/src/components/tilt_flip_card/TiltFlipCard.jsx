import React, {
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
  "--expand-x": "0px",
  "--expand-y": "0px",
  "--expand-scale": "1"
};

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
    scale: `${scale}`
  };
}

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
  const pointerStateRef = useRef({ ...POINTER_INITIAL_STATE });

  const [isExpanded, setIsExpanded] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const cssVars = useMemo(
    () => ({
      "--card-w": `${width}px`,
      "--card-h": `${height}px`,
      "--pop-out": `${popOut}px`
    }),
    [width, height, popOut]
  );

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
    applyCssVars(VISUAL_INITIAL_STATE);
  }, [applyCssVars]);

  const resetAllState = useCallback(() => {
    resetPointerState();
    resetVisualState();
  }, [resetPointerState, resetVisualState]);

  const updateTilt = useCallback(
    (clientX, clientY) => {
      if (isExpanded) return;

      const element = tiltRef.current;
      if (!element) return;

      cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const localX = clientX - rect.left;
        const localY = clientY - rect.top;

        const normalizedX = localX / rect.width - 0.5;
        const normalizedY = localY / rect.height - 0.5;

        const rotateX = -normalizedY * maxTilt;
        const rotateY = normalizedX * maxTilt;

        applyCssVars({
          "--hover": "1",
          "--rx": `${rotateX}deg`,
          "--ry": `${rotateY}deg`,
          "--glare-x": `${(localX / rect.width) * 100}%`,
          "--glare-y": `${(localY / rect.height) * 100}%`,
          "--glare-o": "1"
        });
      });
    },
    [applyCssVars, isExpanded, maxTilt]
  );

  const computeExpandedTransform = useCallback(() => {
    const sceneElement = sceneRef.current;
    if (!sceneElement) return;

    const rect = sceneElement.getBoundingClientRect();
    const metrics = getExpandedMetrics(rect);

    applyCssVars({
      "--expand-x": metrics.x,
      "--expand-y": metrics.y,
      "--expand-scale": metrics.scale
    });
  }, [applyCssVars]);

  const openInspectView = useCallback(() => {
    computeExpandedTransform();

    applyCssVars({
      "--hover": "0",
      "--rx": "0deg",
      "--ry": "0deg",
      "--glare-o": "0"
    });

    setIsExpanded(true);
    setIsFlipped(true);
  }, [applyCssVars, computeExpandedTransform]);

  const closeInspectView = useCallback(() => {
    setIsExpanded(false);
    setIsFlipped(false);

    requestAnimationFrame(() => {
      resetAllState();
    });
  }, [resetAllState]);

  const endInteraction = useCallback(() => {
    resetPointerState();

    if (!isExpanded) {
      resetVisualState();
    }
  }, [isExpanded, resetPointerState, resetVisualState]);

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

  const handlePointerEnter = useCallback(
    (event) => {
      if (isExpanded || event.pointerType !== "mouse") return;
      updateTilt(event.clientX, event.clientY);
    },
    [isExpanded, updateTilt]
  );

  const handlePointerDown = useCallback(
    (event) => {
      if (isExpanded) return;

      pointerStateRef.current = {
        isDown: true,
        moved: false,
        startX: event.clientX,
        startY: event.clientY,
        activePointerId: event.pointerId
      };

      event.currentTarget.setPointerCapture?.(event.pointerId);

      if (event.pointerType === "touch" || event.pointerType === "pen") {
        updateTilt(event.clientX, event.clientY);
      }
    },
    [isExpanded, updateTilt]
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (isExpanded) return;

      const pointerState = pointerStateRef.current;

      if (event.pointerType === "mouse") {
        updateTilt(event.clientX, event.clientY);
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

      updateTilt(event.clientX, event.clientY);
    },
    [isExpanded, updateTilt]
  );

  const handlePointerUp = useCallback(
    (event) => {
      if (isExpanded) return;

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
    [isExpanded, openInspectView, endInteraction]
  );

  const handlePointerLeave = useCallback(
    (event) => {
      if (isExpanded) return;

      if (event.pointerType === "mouse") {
        resetVisualState();
      }
    },
    [isExpanded, resetVisualState]
  );

  const handlePointerCancel = useCallback(
    (event) => {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      endInteraction();
    },
    [endInteraction]
  );

  const handleBackdropClick = useCallback(() => {
    closeInspectView();
  }, [closeInspectView]);

  const handleCloseButtonClick = useCallback(
    (event) => {
      event.stopPropagation();
      closeInspectView();
    },
    [closeInspectView]
  );

  return (
    <>
      {isExpanded && (
        <div
          className="tfc-backdrop"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      <div
        ref={sceneRef}
        className={`tfc-scene ${isExpanded ? "is-expanded" : ""}`}
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
          className={`tfc-tilt ${isExpanded ? "is-expanded" : ""}`}
          onDragStart={(e) => e.preventDefault()}
        >
          <div className={`tfc-flip ${isFlipped ? "is-flipped" : ""}`}>
            <div className="tfc-face tfc-front">
              {frontImg && (
                <img
                  src={frontImg}
                  alt=""
                  className="card-bg-image"
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                />
              )}

              {!isExpanded && <div className="tfc-glare" />}

              {!isExpanded && (
                <div className="card-overlay">
                  <div className="tfc-content">{front}</div>
                </div>
              )}
            </div>

            <div
              className={`tfc-face tfc-back ${isExpanded ? "tfc-back-expanded" : ""
                }`}
            >
              {backImg && (
                <img
                  src={backImg}
                  alt=""
                  className="card-bg-image"
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