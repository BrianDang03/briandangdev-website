import './WaveLines.css';

// ── Path geometry helpers ─────────────────────────────────────────────────
// Two full sine cycles across the 3000-unit viewBox, diagonal baseline so
// every line flows from upper-left to lower-right.
//   y(x)  = startY + slope·x + amp·sin(x·SCALE + phase)
//   dy/dx = slope  + amp·cos(x·SCALE + phase)·SCALE
// Cubic Bezier hermite conversion guarantees C1-continuity at every anchor.

const VB_W = 3000;
const SCALE = (Math.PI * 4) / VB_W;   // 2 full cycles
const XA = [0, 300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700, 3000];
const SEG_CP = 100;                      // ⅓ of 300px segment

function buildPath({ startY, endY, amp, phase }) {
    const slope = (endY - startY) / VB_W;
    const y = XA.map(x => startY + slope * x + amp * Math.sin(x * SCALE + phase));
    const tan = XA.map(x => slope + amp * Math.cos(x * SCALE + phase) * SCALE);

    let d = `M 0,${y[0].toFixed(1)}`;
    for (let i = 0; i < 10; i++) {
        const cp1y = (y[i] + tan[i] * SEG_CP).toFixed(1);
        const cp2y = (y[i + 1] - tan[i + 1] * SEG_CP).toFixed(1);
        d += ` C ${XA[i] + SEG_CP},${cp1y} ${XA[i + 1] - SEG_CP},${cp2y} ${XA[i + 1]},${y[i + 1].toFixed(1)}`;
    }
    return d;
}

// ── Line definitions ──────────────────────────────────────────────────────
// Five parallel streams spread across the viewport height.
// Varying phase offsets so crests/troughs don't overlap, creating the
// layered ribbon look (Hoyoverse-style). Lower opacity = visually further back.
// All lines share the same phase so crests/troughs align — they ripple in unison.
const LINES = [
    { startY: -120, endY: 1000, amp: 55, phase: 0, opacity: 0.55, strokeWidth: 1.4 },
    { startY: -60, endY: 1060, amp: 68, phase: 0, opacity: 0.45, strokeWidth: 1.2 },
    { startY: 0, endY: 1120, amp: 72, phase: 0, opacity: 0.50, strokeWidth: 1.3 },
    { startY: 60, endY: 1180, amp: 68, phase: 0, opacity: 0.40, strokeWidth: 1.2 },
    { startY: 120, endY: 1240, amp: 55, phase: 0, opacity: 0.35, strokeWidth: 1.1 },
];

export default function WaveLines() {
    return (
        <svg
            className="wave-lines"
            viewBox="0 0 3000 1000"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
        >
            <defs>
                <filter id="wl-glow" filterUnits="userSpaceOnUse" x="-40" y="-200" width="3080" height="1400" colorInterpolationFilters="sRGB">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <linearGradient id="wl-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(180,220,255,0)" />
                    <stop offset="15%" stopColor="rgba(180,220,255,1)" />
                    <stop offset="85%" stopColor="rgba(180,220,255,1)" />
                    <stop offset="100%" stopColor="rgba(180,220,255,0)" />
                </linearGradient>
            </defs>

            {LINES.map((line, i) => (
                <path
                    key={i}
                    d={buildPath(line)}
                    fill="none"
                    stroke="url(#wl-grad)"
                    strokeWidth={line.strokeWidth}
                    strokeLinecap="round"
                    opacity={line.opacity}
                    filter="url(#wl-glow)"
                />
            ))}
        </svg>
    );
}
