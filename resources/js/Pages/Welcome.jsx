import { Head, Link } from '@inertiajs/react';
import { ArrowRight, LayoutDashboard } from 'lucide-react';

const BRAND = '#003d82';

/** Concentric "monitoring" rings behind the seals: quiet, institutional, no motion. */
function MonitoringRings() {
    return (
        <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full text-slate-200" aria-hidden="true">
            {[60, 110, 160, 199].map((r) => (
                <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="currentColor" strokeWidth="1" />
            ))}
            <line x1="0" y1="200" x2="400" y2="200" stroke="currentColor" strokeWidth="1" />
            <line x1="200" y1="0" x2="200" y2="400" stroke="currentColor" strokeWidth="1" />
            {/* a few reporting points on the rings */}
            {[
                [200 + 110 * Math.cos(-0.6), 200 + 110 * Math.sin(-0.6)],
                [200 + 160 * Math.cos(2.4), 200 + 160 * Math.sin(2.4)],
                [200 + 199 * Math.cos(0.9), 200 + 199 * Math.sin(0.9)],
                [200 + 60 * Math.cos(3.6), 200 + 60 * Math.sin(3.6)],
            ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="4" fill={BRAND} opacity="0.55" />
            ))}
        </svg>
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

export default function Welcome({ auth }) {
    const signedIn = Boolean(auth?.user);
    const year = new Date().getFullYear();

    const primaryAction = signedIn ? (
        <Link
            href={route('dashboard')}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-base font-semibold text-white shadow-sm transition-colors hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: BRAND, '--tw-ring-color': BRAND }}
        >
            <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
            Go to dashboard
        </Link>
    ) : (
        <Link
            href={route('login')}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-base font-semibold text-white shadow-sm transition-colors hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: BRAND, '--tw-ring-color': BRAND }}
        >
            Sign in
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
    );

    return (
        <>
            <Head title="CDRRMO Situational Reports" />

            <div className="flex min-h-dvh flex-col bg-white text-slate-900">
                {/* Top bar */}
                <header className="border-b border-slate-200">
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                        <div className="flex min-w-0 items-center gap-3">
                            <img src="/images/cdrrmo_logo.jpg" alt="" width="36" height="36" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                            <p className="min-w-0 truncate text-sm font-semibold sm:text-base">
                                <span style={{ color: BRAND }}>SitReps</span>
                                <span className="mx-2 text-slate-300" aria-hidden="true">|</span>
                                <span className="text-slate-600">CDRRMO Ilagan</span>
                            </p>
                        </div>
                        {signedIn ? (
                            <Link
                                href={route('dashboard')}
                                className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <Link
                                href={route('login')}
                                className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            >
                                Sign in
                            </Link>
                        )}
                    </div>
                </header>

                {/* Hero */}
                <main className="flex flex-1 items-center">
                    <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8">
                        <div>
                            {/* Seals on small screens (the large composition is desktop-only) */}
                            <div className="mb-8 flex items-center gap-3 lg:hidden">
                                <Seal src="/images/ilagan.jpeg" alt="Seal of the City of Ilagan" className="h-16 w-16 ring-2" />
                                <Seal src="/images/cdrrmo_logo.jpg" alt="CDRRMO Ilagan logo" className="h-16 w-16 ring-2" />
                            </div>

                            <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: BRAND }}>
                                City of Ilagan · Province of Isabela
                            </p>
                            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-slate-900 [text-wrap:balance] sm:text-5xl lg:text-[3.4rem]">
                                City Disaster Risk Reduction and Management Office
                            </h1>
                            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
                                Situational Reports System for monitoring, reporting, and coordinating emergency
                                operations across the City of Ilagan.
                            </p>

                            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                                {primaryAction}
                                {!signedIn && (
                                    <p className="text-sm text-slate-500">For authorized city offices and barangay accounts.</p>
                                )}
                            </div>
                        </div>

                        {/* Seal composition (desktop) */}
                        <div className="relative mx-auto hidden aspect-square w-full max-w-md lg:block">
                            <MonitoringRings />
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
