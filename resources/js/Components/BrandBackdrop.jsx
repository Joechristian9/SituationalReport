import { cn } from '@/lib/utils';

// Entrance: fade + rise once on load. Motion-safe only; transform/opacity only.
export const enter =
    'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 motion-safe:fill-mode-both';

// Reporting points on the outer rings: [radius (of 500), angle in radians, ping delay]
const POINTS = [
    [470, 0.2, '0s'],
    [480, -2.5, '0.7s'],
    [440, 2.35, '1.4s'],
    [470, 3.4, '2.1s'],
    [440, -0.75, '2.8s'],
    [480, 0.95, '3.5s'],
];
const pct = (v) => `${(v / 1000) * 100}%`;

/** Topographic contour lines (static SVG, very low contrast). */
export function Contours() {
    const lines = Array.from({ length: 12 }, (_, i) => {
        const y = 40 + i * 80;
        const a = 24 + (i % 3) * 12;
        return `M-50 ${y} C 200 ${y - a}, 400 ${y + a}, 700 ${y} S 1150 ${y - a}, 1300 ${y + a / 2}`;
    });
    return (
        <svg viewBox="0 0 1200 960" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
            {lines.map((d, i) => (
                <path key={i} d={d} fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="1.5" />
            ))}
        </svg>
    );
}

/**
 * Radar: rings, a slow sweep and pinging report points.
 * `className` positions and sizes it; the default centres it behind the content.
 */
export function Radar({ className = 'left-1/2 top-1/2 w-[min(68rem,170vw)] -translate-x-1/2 -translate-y-1/2' }) {
    return (
        <div
            className={cn('pointer-events-none absolute aspect-square [mask-image:radial-gradient(circle,black_45%,transparent_72%)]', className)}
            aria-hidden="true"
        >
            <svg viewBox="0 0 1000 1000" className="absolute inset-0 h-full w-full">
                {[100, 180, 300, 420, 499].map((r) => (
                    <circle key={r} cx="500" cy="500" r={r} fill="none" stroke="white" strokeOpacity="0.13" strokeWidth="1" />
                ))}
                <line x1="0" y1="500" x2="1000" y2="500" stroke="white" strokeOpacity="0.08" strokeWidth="1" />
                <line x1="500" y1="0" x2="500" y2="1000" stroke="white" strokeOpacity="0.08" strokeWidth="1" />
            </svg>

            {/* Sweep: one composited layer rotating; hidden for reduced motion */}
            <div
                className="absolute inset-0 rounded-full will-change-transform motion-safe:animate-sweep motion-reduce:hidden"
                style={{ background: 'conic-gradient(from 0deg, rgba(147, 197, 253, 0.2), rgba(147, 197, 253, 0) 70deg, transparent)' }}
            />

            {POINTS.map(([r, a, delay]) => (
                <span
                    key={`${r}-${a}`}
                    className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: pct(500 + r * Math.cos(a)), top: pct(500 + r * Math.sin(a)) }}
                >
                    <span className="absolute inset-0 rounded-full bg-sky-300 motion-safe:animate-ping-soft" style={{ animationDelay: delay }} />
                    <span className="absolute inset-0 rounded-full bg-sky-300 ring-2 ring-white/70" />
                </span>
            ))}
        </div>
    );
}
