// Decorative background shapes — orbs, beams, and floating-plus signs.
// Split into two containers so the main shapes scroll with the page while
// the footer shapes stay anchored near the bottom.
export default function DecorativeShapes({ show, isLocked }) {
    const lockClass = isLocked ? "is-locked" : "";

    return (
        <>
            {/* Primary shapes — fixed to viewport, parallax-scrolled via CSS vars */}
            <div className={`theme-bg ${show ? "is-ready" : ""} ${lockClass}`} aria-hidden="true">
                {show && (
                    <>
                        <span className="orb orb-left" />
                        <span className="orb orb-nav-cut orb-nav-1" />
                        <span className="orb orb-nav-cut orb-nav-2" />
                        <span className="orb orb-3" />
                        <span className="orb orb-8" />
                        <span className="floating-plus plus-1" />
                        <span className="floating-plus plus-4" />
                        <span className="floating-plus plus-6" />
                    </>
                )}
            </div>

            {/* Footer shapes — anchored near the bottom of the page */}
            <div className={`theme-bg-footer ${show ? "is-ready" : "is-deferred"} ${lockClass}`} aria-hidden="true">
                {show && (
                    <>
                        <span className="beam beam-two" />
                        <span className="orb orb-10" />
                        <span className="floating-plus plus-7" />
                    </>
                )}
            </div>
        </>
    );
}
