import { Head, Link } from '@inertiajs/react';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { BRAND, BRAND_DEEP } from '@/lib/brand';
import { Contours, Radar, enter } from '@/Components/BrandBackdrop';

function Seal({ src, alt }) {
    return (
        <img
            src={src}
            alt={alt}
            width="96"
            height="96"
            className="h-16 w-16 rounded-full bg-white object-cover shadow-xl ring-2 ring-white/90 sm:h-20 sm:w-20 lg:h-24 lg:w-24"
        />
    );
}

function PrimaryAction({ signedIn }) {
    const className =
        'group inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-white px-7 text-base font-semibold shadow-lg shadow-black/20 transition-[box-shadow,transform] duration-200 hover:shadow-xl motion-safe:hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#003d82]';

    return signedIn ? (
        <Link href={route('dashboard')} className={className} style={{ color: BRAND }}>
            <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
            Go to dashboard
        </Link>
    ) : (
        <Link href={route('login')} className={className} style={{ color: BRAND }}>
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

            <div
                className="relative isolate flex min-h-dvh flex-col overflow-hidden text-white"
                style={{ background: `radial-gradient(90% 70% at 50% 42%, ${BRAND} 0%, #002a5c 55%, ${BRAND_DEEP} 100%)` }}
            >
                {/* Static textures */}
                <Contours />
                <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]"
                    aria-hidden="true"
                />
                <Radar />

                {/* Header */}
                <header className="relative z-10">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:h-20 sm:px-8">
                        <div className="flex min-w-0 items-center gap-3">
                            <img src="/images/cdrrmo_logo_192.jpg" alt="" width="36" height="36" className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/40" />
                            <p className="min-w-0 truncate text-sm font-semibold sm:text-base">
                                SitReps
                                <span className="mx-2 text-white/40" aria-hidden="true">|</span>
                                <span className="font-medium text-white/75">CDRRMO Ilagan</span>
                            </p>
                        </div>
                        <Link
                            href={signedIn ? route('dashboard') : route('login')}
                            className="shrink-0 rounded-md border border-white/30 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            {signedIn ? 'Dashboard' : 'Sign in'}
                        </Link>
                    </div>
                </header>

                {/* Hero */}
                <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-14 text-center sm:px-8 sm:py-20">
                    <div className="mx-auto flex max-w-4xl flex-col items-center">
                        <div className={`flex items-center gap-4 ${enter}`}>
                            <Seal src="/images/ilagan.jpeg" alt="Seal of the City of Ilagan" />
                            <Seal src="/images/cdrrmo_logo_192.jpg" alt="CDRRMO Ilagan logo" />
                        </div>

                        <p className={`mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200 sm:text-sm ${enter} motion-safe:delay-100`}>
                            City of Ilagan · Province of Isabela
                        </p>
                        <h1
                            className={`mt-4 text-4xl font-bold leading-[1.08] tracking-tight [text-wrap:balance] sm:text-5xl lg:text-6xl xl:text-7xl ${enter} motion-safe:delay-150`}
                        >
                            City Disaster Risk Reduction and Management Office
                        </h1>
                        <div className={`mt-8 h-1 w-20 rounded-full bg-sky-300 ${enter} motion-safe:delay-200`} aria-hidden="true" />
                        <p className={`mt-8 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg xl:text-xl ${enter} motion-safe:delay-200`}>
                            Situational Reports System for monitoring, reporting, and coordinating emergency
                            operations across the City of Ilagan.
                        </p>

                        <div className={`mt-10 flex flex-col items-center gap-4 ${enter} motion-safe:delay-300`}>
                            <PrimaryAction signedIn={signedIn} />
                            {!signedIn && <p className="text-sm text-white/60">For authorized city offices and barangay accounts.</p>}
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="relative z-10 border-t border-white/10 bg-black/15">
                    <div className="mx-auto flex max-w-7xl flex-col items-center gap-1 px-5 py-5 text-center text-xs text-white/60 sm:flex-row sm:justify-between sm:px-8 sm:text-left sm:text-sm">
                        <p>© {year} City of Ilagan CDRRMO</p>
                        <p>CDRRMO Building, City Hall Compound, San Vicente, City of Ilagan, Isabela 3300</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
