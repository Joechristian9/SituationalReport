import { Head, Link } from '@inertiajs/react';
import { ArrowRight, LayoutDashboard } from 'lucide-react';

const BRAND = '#003d82';

// Reporting points on the rings: [radius, angle in radians, ping delay]
const POINTS = [
    [110, -0.6, '0s'],
    [160, 2.4, '0.8s'],
    [199, 0.9, '1.6s'],
    [160, -2.3, '2.4s'],
];
const pct = (v) => `${(v / 400) * 100}%`;

// Entrance: fade + rise once on load. Motion-safe only; transform/opacity only.
const enter = 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 motion-safe:fill-mode-both';

/** Concentric monitoring rings with a slow radar sweep and pinging report points. */
function MonitoringVisual() {
    return (
        <div className="absolute inset-0" aria-hidden="true">
            <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full text-slate-200">
                {[60, 110, 160, 199].map((r) => (
                    <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="currentColor" strokeWidth="1" />
                ))}
                <line x1="0" y1="200" x2="400" y2="200" stroke="currentColor" strokeWidth="1" />
                <line x1="200" y1="0" x2="200" y2="400" stroke="currentColor" strokeWidth="1" />
            </svg>

            {/* Radar sweep: one composited layer rotating; hidden for reduced motion */}
            <div
                className="absolute inset-0 rounded-full will-change-transform motion-safe:animate-sweep motion-reduce:hidden"
                style={{ background: `conic-gradient(from 0deg, ${BRAND}26, transparent 70deg, transparent)` }}
            />

            {POINTS.map(([r, a, delay]) => (
                <span
                    key={`${r}-${a}`}
                    className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: pct(200 + r * Math.cos(a)), top: pct(200 + r * Math.sin(a)) }}
                >
                    <span
                        className="absolute inset-0 rounded-full motion-safe:animate-ping-soft"
                        style={{ backgroundColor: BRAND, animationDelay: delay }}
                    />
                    <span className="absolute inset-0 rounded-full ring-2 ring-white" style={{ backgroundColor: BRAND }} />
                </span>
            ))}
        </div>
    );
}

function Seal({ src, alt, className = '' }) {
    return (
        <img
            src={src}
            alt={alt}
            width="224"
            height="224"
            className={`rounded-full bg-white object-cover ring-4 ring-white shadow-lg ${className}`}
        />
    );
}

function PrimaryAction({ signedIn }) {
    const className =
        'group inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-base font-semibold text-white shadow-sm transition-[box-shadow,transform] duration-200 hover:shadow-md motion-safe:hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
    const style = { backgroundColor: BRAND, '--tw-ring-color': BRAND };

    return signedIn ? (
        <Link href={route('dashboard')} className={className} style={style}>
            <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
            Go to dashboard
        </Link>
    ) : (
        <Link href={route('login')} className={className} style={style}>
            Sign in
            <ArrowRight className="h-5 w-5 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
    );
}

export default function Welcome({ auth }) {
    const signedIn = Boolean(auth?.user);
    const year = new Date().getFullYear();

    return (
        <>
            <Head title="CDRRMO Situational Reports" />

            <div className="flex min-h-dvh flex-col bg-white text-slate-900">
                {/* Top bar with a thin brand accent line */}
                <header className="border-b border-t-[3px] border-b-slate-200" style={{ borderTopColor: BRAND }}>
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                        <div className="flex min-w-0 items-center gap-3">
                            <img src="/images/cdrrmo_logo.jpg" alt="" width="36" height="36" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                            <p className="min-w-0 truncate text-sm font-semibold sm:text-base">
                                <span style={{ color: BRAND }}>SitReps</span>
                                <span className="mx-2 text-slate-300" aria-hidden="true">|</span>
                                <span className="text-slate-600">CDRRMO Ilagan</span>
                            </p>
                        </div>
                        <Link
                            href={signedIn ? route('dashboard') : route('login')}
                            className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        >
                            {signedIn ? 'Dashboard' : 'Sign in'}
                        </Link>
                    </div>
                </header>

                {/* Hero */}
                <main className="relative isolate flex flex-1 items-center overflow-hidden">
                    {/* Faint dot grid, fading toward the edges (static) */}
                    <div
                        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_70%_65%_at_60%_45%,black,transparent)]"
                        aria-hidden="true"
                    />

                    <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8">
                        <div>
                            {/* Seals on small screens (the large composition is desktop-only) */}
                            <div className={`mb-8 flex items-center gap-3 lg:hidden ${enter}`}>
                                <Seal src="/images/ilagan.jpeg" alt="Seal of the City of Ilagan" className="h-16 w-16 ring-2" />
                                <Seal src="/images/cdrrmo_logo.jpg" alt="CDRRMO Ilagan logo" className="h-16 w-16 ring-2" />
                            </div>

                            <p className={`text-sm font-semibold uppercase tracking-wider ${enter}`} style={{ color: BRAND }}>
                                City of Ilagan · Province of Isabela
                            </p>
                            <h1 className={`mt-3 text-4xl font-bold leading-tight tracking-tight text-slate-900 [text-wrap:balance] sm:text-5xl lg:text-[3.4rem] ${enter} motion-safe:delay-100`}>
                                City Disaster Risk Reduction and Management Office
                            </h1>
                            <div className={`mt-6 h-1 w-16 rounded-full ${enter} motion-safe:delay-150`} style={{ backgroundColor: BRAND }} aria-hidden="true" />
                            <p className={`mt-6 max-w-xl text-lg leading-relaxed text-slate-600 ${enter} motion-safe:delay-200`}>
                                Situational Reports System for monitoring, reporting, and coordinating emergency
                                operations across the City of Ilagan.
                            </p>

                            <div className={`mt-10 flex flex-col gap-4 sm:flex-row sm:items-center ${enter} motion-safe:delay-300`}>
                                <PrimaryAction signedIn={signedIn} />
                                {!signedIn && (
                                    <p className="text-sm text-slate-500">For authorized city offices and barangay accounts.</p>
                                )}
                            </div>
                        </div>

                        {/* Seal composition (desktop) */}
                        <div
                            className={`relative mx-auto hidden aspect-square w-full max-w-md lg:block motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-1000 motion-safe:fill-mode-both motion-safe:delay-200`}
                        >
                            <MonitoringVisual />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Seal src="/images/cdrrmo_logo.jpg" alt="CDRRMO Ilagan logo" className="h-56 w-56" />
                            </div>
                            <div className="absolute bottom-[12%] left-[6%]">
                                <Seal src="/images/ilagan.jpeg" alt="Seal of the City of Ilagan" className="h-28 w-28" />
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t border-slate-200">
                    <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                        <p>© {year} City of Ilagan CDRRMO</p>
                        <p>CDRRMO Building, City Hall Compound, San Vicente, City of Ilagan, Isabela 3300</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
