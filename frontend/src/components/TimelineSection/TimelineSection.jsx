import { useRef, useEffect } from 'react';
import './TimelineSection.css';

const VISIBLE    = 4;
const BREAKPOINT = 1024;
const isH = () => window.innerWidth >= BREAKPOINT;

const ENTRIES = [
    {
        year: '2023',
        title: 'IT Help Desk Technician',
        company: 'CU Denver · Business School',
        desc: 'Supported ~500 students and faculty — troubleshot classroom AV and projector systems, imaged computers, managed asset tracking, set up offices, and maintained a full computer lab.',
        color: '#7b9cf5',
    },
    {
        year: '2024',
        title: 'Math Tutor',
        company: 'CU Denver · Math Department',
        desc: 'Tutored students one-on-one across the full undergraduate math sequence — from algebra through Calculus III — building real conceptual understanding alongside exam prep.',
        color: '#4abf8e',
    },
    {
        year: '2025',
        title: 'Teaching Assistant',
        company: 'CU Denver · Computer Science Department',
        desc: 'TA\'d an intro systems programming course for 40+ students — led lab sessions and graded assignments covering shell scripting, file systems, and core Unix tooling.',
        color: '#f5a97b',
    },
    {
        year: '2025',
        title: 'Reasearcher/Software Developer Intern',
        company: '\u003cT\u003eLAPACK · CU Denver',
        desc: 'Implemented core symmetric eigenvalue routines for an NSF-funded C++ template linear algebra library. Contributions reviewed and merged as one of 17 contributors.',
        color: '#a87bf5',
    },
    {
        year: '2025',
        title: 'Junior Software Developer',
        company: 'Wanco Inc.',
        desc: 'Built Modem Wizard — a full-stack MERN app processing 40–90 modems weekly on the manufacturing floor. Also built a Python/Playwright automation tool that cut fulfillment from 4 hours to 10 minutes per box.',
        color: '#e87b7b',
    },
    {
        year: '2026',
        title: 'B.A. Computer Science, Math Minor',
        company: 'CU Denver',
        desc: 'Graduated with a 3.9 GPA after four years of balancing rigorous coursework in algorithms and systems with concurrent research, teaching, and production engineering roles.',
        color: '#c9be3a',
    },
    {
        year: '2026',
        title: 'M.S. CS Candidate',
        company: 'Colorado School of Mines',
        desc: 'Pursuing a graduate degree in Computer Science — deepening expertise in algorithms, systems, and high-impact engineering while continuing to build production software.',
        color: '#2ab8d4',
    },
];

function easeOutCubic(t)    { return 1 - Math.pow(1 - t, 3); }
function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; }
function lerp(a, b, t)   { return a + (b - a) * t; }
function clamp01(v)       { return v < 0 ? 0 : v > 1 ? 1 : v; }

export default function TimelineSection() {
    const driverRef  = useRef(null);
    const sectionRef = useRef(null);
    const railRef    = useRef(null);
    const fillRef    = useRef(null);
    const dotRefs     = useRef([]);
    const entryRefs   = useRef([]);
    const rafRef      = useRef(null);
    const prevBtnRef  = useRef(null);
    const nextBtnRef  = useRef(null);
    const stepRef     = useRef(0);      // current logical step (0 = start)
    const goToStepRef = useRef(null);   // set inside useEffect, called from JSX
    const autoPlayRef = useRef(null);   // timeout id for intro animation
    const isAutoPlayingRef = useRef(false);

    useEffect(() => {
        const N           = ENTRIES.length;
        const extraSlides = N - VISIBLE;
        const FADE_RANGE  = 0.4;
        // Same lerp on all screen sizes for consistent feel
        const LERP_DESKTOP = 0.06;
        const LERP_MOBILE  = 0.06;
        // Intro animation: one continuous sweep over AUTO_FRAMES frames (~3.3 s at 60 fps)
        const AUTO_FRAMES  = 200;
        let   autoT        = 0;
        // ── Arrow-driven step navigation (no scroll dependency) ───────────
        // step 0           = blank
        // steps 1..VISIBLE = fill stops at each dot centre, one at a time
        // steps VISIBLE+1..= carousel; fill completes on first carousel step
        const MAX_STEP = VISIBLE + extraSlides;

        let targetFill   = 0;
        let displayFill  = 0;
        let targetSlide  = 0;
        let displaySlide = 0;

        function updateButtons(s) {
            if (prevBtnRef.current) prevBtnRef.current.disabled = s <= 1;
            if (nextBtnRef.current) nextBtnRef.current.disabled = s >= MAX_STEP;
        }
        updateButtons(0);

        function goToStep(s) {
            const cs = Math.max(1, Math.min(MAX_STEP, s));
            stepRef.current = cs;
            updateButtons(cs);
            if (cs === 0) {
                targetFill  = 0;
                targetSlide = 0;
            } else if (cs <= VISIBLE) {
                // Stop fill visually on each dot's centre: dot i at (i+0.5)/VISIBLE
                targetFill  = (cs - 0.5) / VISIBLE;
                targetSlide = 0;
            } else {
                // Carousel phase: fill stays pinned at the last visible slot centre.
                // Dot in slot VISIBLE-1 has its centre at (VISIBLE-0.5)/VISIBLE of the rail.
                // Entries slide while the line stays fixed — no overshoot.
                targetFill  = (VISIBLE - 0.5) / VISIBLE;
                targetSlide = cs - VISIBLE;
            }
        }
        goToStepRef.current = goToStep;

        function setButtonsEnabled(on) {
            if (prevBtnRef.current) prevBtnRef.current.style.pointerEvents = on ? '' : 'none';
            if (nextBtnRef.current) nextBtnRef.current.style.pointerEvents = on ? '' : 'none';
        }

        function tick() {
            const rail    = railRef.current;
            const fill    = fillRef.current;
            const section = sectionRef.current;
            if (!rail || !fill || !section) {
                rafRef.current = requestAnimationFrame(tick);
                return;
            }

            const railRect = rail.getBoundingClientRect();
            const h        = isH();

            // ── Advance displayFill / displaySlide ──────────────────────
            if (isAutoPlayingRef.current) {
                // One continuous sweep: frame counter → eased t → fill + slide
                autoT = Math.min(1, autoT + 1 / AUTO_FRAMES);
                const eased    = easeInOutCubic(autoT);
                const fillFrac = VISIBLE / MAX_STEP;   // fraction of timeline for fill phase
                if (eased <= fillFrac) {
                    displayFill  = (eased / fillFrac) * ((VISIBLE - 0.5) / VISIBLE);
                    displaySlide = 0;
                } else {
                    displayFill  = (VISIBLE - 0.5) / VISIBLE;
                    displaySlide = ((eased - fillFrac) / (1 - fillFrac)) * extraSlides;
                }
                // Keep target in sync so lerp picks up seamlessly when autoplay ends
                targetFill  = displayFill;
                targetSlide = displaySlide;
                if (autoT >= 1) {
                    isAutoPlayingRef.current = false;
                    stepRef.current = MAX_STEP;
                    updateButtons(MAX_STEP);
                    setButtonsEnabled(true);
                }
            } else {
                const lf = h ? LERP_DESKTOP : LERP_MOBILE;
                displayFill  = lerp(displayFill,  targetFill,  lf);
                displaySlide = lerp(displaySlide, targetSlide, lf);
                const snap = h ? 0.001 : 0.002;
                if (Math.abs(displayFill  - targetFill)  < snap) displayFill  = targetFill;
                if (Math.abs(displaySlide - targetSlide) < snap) displaySlide = targetSlide;
            }

            if (h) {
                //  Desktop: horizontal carousel 
                fill.style.transformOrigin = 'left center';
                fill.style.transform = `scaleX(${displayFill.toFixed(5)})`;

                const slotWidth  = railRect.width / VISIBLE;
                const fillFrontX = railRect.left + displayFill * railRect.width;

                dotRefs.current.forEach((dot, i) => {
                    if (!dot) return;
                    const content = entryRefs.current[i];
                    const outer   = dot.parentElement;
                    const slotPos    = i - displaySlide;
                    const dotCenterX = railRect.left + (slotPos + 0.5) * slotWidth;

                    const fillReveal = displayFill < 0.999
                        ? easeOutCubic(clamp01((fillFrontX - dotCenterX + 64) / 64))
                        : 1;

                    let slideVis;
                    if      (slotPos <= -FADE_RANGE)             slideVis = 0;
                    else if (slotPos < 0)                         slideVis = clamp01((slotPos + FADE_RANGE) / FADE_RANGE);
                    else if (slotPos > VISIBLE - 1 + FADE_RANGE) slideVis = 0;
                    else if (slotPos > VISIBLE - 1)              slideVis = clamp01((VISIBLE - 1 + FADE_RANGE - slotPos) / FADE_RANGE);
                    else                                          slideVis = 1;

                    const ep = fillReveal * slideVis;

                    if (outer) {
                        outer.style.left   = `${(slotPos * slotWidth).toFixed(2)}px`;
                        outer.style.width  = `${slotWidth.toFixed(2)}px`;
                        outer.style.top    = '';
                        outer.style.height = '';
                    }
                    if (content) {
                        content.style.opacity   = ep.toFixed(4);
                        const dir    = i % 2 === 0 ? 1 : -1;
                        const yShift = displayFill < 0.999 ? (1 - fillReveal) * 18 * dir : 0;
                        content.style.transform = `translateY(${yShift.toFixed(2)}px)`;
                    }
                    dot.style.opacity   = ep.toFixed(4);
                    dot.style.transform = `translate(-50%, -50%) scale(${(0.25 + ep * 0.75).toFixed(4)})`;
                    dot.style.boxShadow = ep > 0.05
                        ? `0 0 ${(ep * 14).toFixed(1)}px ${(ep * 6).toFixed(1)}px ${dot.dataset.color}55`
                        : 'none';
                });

            } else {
                //  Mobile: vertical carousel (same phases, vertical axis) 
                fill.style.transformOrigin = 'top center';
                fill.style.transform = `scaleY(${displayFill.toFixed(5)})`;

                const slotHeight = railRect.height / VISIBLE;

                dotRefs.current.forEach((dot, i) => {
                    if (!dot) return;
                    const content = entryRefs.current[i];
                    const outer   = dot.parentElement;
                    const slotPos = i - displaySlide;

                    // Fill reveal: has the fill front passed this dot's vertical centre?
                    const dotRelY    = (slotPos + 0.5) * slotHeight; // px from rail top
                    const fillFrontY = displayFill * railRect.height;
                    const dist       = fillFrontY - dotRelY;

                    const fillReveal = displayFill < 0.999
                        ? easeOutCubic(clamp01((dist + 64) / 64))
                        : 1;

                    let slideVis;
                    if      (slotPos <= -FADE_RANGE)             slideVis = 0;
                    else if (slotPos < 0)                         slideVis = clamp01((slotPos + FADE_RANGE) / FADE_RANGE);
                    else if (slotPos > VISIBLE - 1 + FADE_RANGE) slideVis = 0;
                    else if (slotPos > VISIBLE - 1)              slideVis = clamp01((VISIBLE - 1 + FADE_RANGE - slotPos) / FADE_RANGE);
                    else                                          slideVis = 1;

                    const ep = fillReveal * slideVis;

                    if (outer) {
                        outer.style.top    = `${(slotPos * slotHeight).toFixed(2)}px`;
                        outer.style.height = `${slotHeight.toFixed(2)}px`;
                        outer.style.left   = '';
                        outer.style.width  = '';
                    }
                    if (content) {
                        content.style.opacity   = ep.toFixed(4);
                        content.style.transform = `translateX(${((1 - fillReveal) * 28).toFixed(2)}px)`;
                    }
                    dot.style.opacity   = ep.toFixed(4);
                    dot.style.transform = `translateY(-50%) scale(${(0.25 + ep * 0.75).toFixed(4)})`;
                    dot.style.boxShadow = ep > 0.05
                        ? `0 0 ${(ep * 14).toFixed(1)}px ${(ep * 6).toFixed(1)}px ${dot.dataset.color}55`
                        : 'none';
                });
            }

            rafRef.current = requestAnimationFrame(tick);
        }

        rafRef.current = requestAnimationFrame(tick);

        function onResize() {
            // If autoplay was running, abort it cleanly and restart it
            if (isAutoPlayingRef.current) {
                isAutoPlayingRef.current = false;
                setButtonsEnabled(false);
            }
            displayFill  = 0; targetFill  = 0;
            displaySlide = 0; targetSlide = 0;
            autoT = 0;
            stepRef.current = 1;
            updateButtons(1);

            const h = isH();
            if (fillRef.current) {
                fillRef.current.style.transformOrigin = h ? 'left center' : 'top center';
                fillRef.current.style.transform       = h ? 'scaleX(0)'   : 'scaleY(0)';
            }
            dotRefs.current.forEach(dot => {
                if (!dot) return;
                dot.style.opacity   = '0';
                dot.style.transform = h ? 'translate(-50%, -50%) scale(0.25)' : 'translateY(-50%) scale(0.25)';
                dot.style.boxShadow = 'none';
            });
            entryRefs.current.forEach(el => {
                if (!el) return;
                el.style.opacity   = '0';
                el.style.transform = '';
                const outer = el.parentElement;
                if (outer) {
                    outer.style.left   = '';
                    outer.style.width  = '';
                    outer.style.top    = '';
                    outer.style.height = '';
                }
            });
            // Re-run the intro sweep in the new orientation
            isAutoPlayingRef.current = true;
        }

        window.addEventListener('resize', onResize, { passive: true });

        // ── Intro auto-play: one continuous sweep when section enters view ──
        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries[0].isIntersecting) return;
                observer.disconnect(); // only play once
                autoT = 0;
                isAutoPlayingRef.current = true;
                setButtonsEnabled(false);
            },
            { threshold: 0.3 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);

        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener('resize', onResize);
            observer.disconnect();
            clearTimeout(autoPlayRef.current);
        };
    }, []);

    return (
        <div className="tl-driver" ref={driverRef}>
        <section className="tl-section" ref={sectionRef} aria-label="Career timeline">
            <div className="tl-header">
                <p className="tl-kicker">Experience</p>
                <h2 className="tl-heading">Career</h2>
            </div>

            <div className="tl-track">
                <div className="tl-rail" ref={railRef}>
                    <div className="tl-rail__bg" />
                    <div className="tl-rail__fill" ref={fillRef} />
                </div>

                <div className="tl-entries">
                    {ENTRIES.map((item, i) => (
                        <div
                            key={i}
                            className={`tl-entry tl-entry--${i % 2 === 0 ? 'above' : 'below'}`}
                        >
                            <div
                                className="tl-dot"
                                ref={el => { dotRefs.current[i] = el; }}
                                data-color={item.color}
                                style={{ background: item.color, opacity: 0 }}
                                aria-hidden="true"
                            />
                            <div
                                className="tl-content"
                                ref={el => { entryRefs.current[i] = el; }}
                                style={{ opacity: 0, '--entry-color': item.color }}
                            >
                                <div className="tl-meta">
                                    <span className="tl-company" style={{ color: item.color }}>
                                        {item.company}
                                    </span>
                                    <span className="tl-year">{item.year}</span>
                                </div>
                                <h3 className="tl-title">{item.title}</h3>
                                <p className="tl-desc">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Prev / Next navigation — scroll to each carousel step */}
            <nav className="tl-nav" aria-label="Career navigation">
                <button
                    className="tl-nav__btn"
                    ref={prevBtnRef}
                    onClick={() => goToStepRef.current?.(stepRef.current - 1)}
                    aria-label="Previous career entry"
                >
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 4 7 10 13 16"/></svg>
                </button>
                <button
                    className="tl-nav__btn"
                    ref={nextBtnRef}
                    onClick={() => goToStepRef.current?.(stepRef.current + 1)}
                    aria-label="Next career entry"
                >
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 4 13 10 7 16"/></svg>
                </button>
            </nav>
        </section>
        </div>
    );
}