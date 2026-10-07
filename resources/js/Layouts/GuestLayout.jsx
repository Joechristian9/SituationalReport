import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Contours, Radar, enter } from '@/Components/BrandBackdrop';
import { BRAND, BRAND_DEEP } from '@/lib/brand';

const brandBackground = { background: `radial-gradient(120% 90% at 50% 30%, #1a5bb0 0%, ${BRAND} 45%, #002a5c 80%, ${BRAND_DEEP} 100%)` };

function Seals() {
    const seal = 'h-14 w-14 rounded-full bg-white object-cover shadow-xl ring-2 ring-white/90 sm:h-16 sm:w-16 lg:h-20 lg:w-20';
    return (
        <div className="flex items-center -space-x-2">
            <img src="/images/ilagan.jpeg" alt="Seal of the City of Ilagan" width="80" height="80" decoding="async" className={seal} />
            <img src="/images/cdrrmo_logo_192.jpg" alt="CDRRMO Ilagan logo" width="80" height="80" decoding="async" className={seal} />
        </div>
    );
}

export default function GuestLayout({ children }) {
    const year = new Date().getFullYear();

    return (
        <div className="relative isolate flex min-h-dvh flex-col overflow-hidden text-white" style={brandBackground}>
            {/*
              Backdrop. The radar (the only moving part) sits in a corner away from the
              glass card, so the card's blur only ever covers static layers and is not
              recomputed every frame. Phones skip the radar entirely.
            */}
            <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
                <Contours />
                <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
                {/* Faint colour pool for depth; kept dim so white text on the clear glass keeps its contrast. */}
                <div className="absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-sky-400/15 blur-3xl" />
                <Radar className="-bottom-80 -left-80 hidden w-[52rem] lg:block" />
            </div>

            <header className="relative">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:h-20 sm:px-8">
                    <Link
                        href={route('welcome')}
                        className="flex min-w-0 items-center gap-2 rounded-md text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:text-base"
                    >
                        SitReps
                        <span className="text-white/40" aria-hidden="true">|</span>
                        <span className="truncate font-medium text-white/75">CDRRMO Ilagan</span>
                    </Link>
                    <Link
                        href={route('welcome')}
                        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border border-white/25 px-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:min-h-9"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        <span>Back<span className="hidden sm:inline"> to home</span></span>
                    </Link>
                </div>
            </header>

            {/* Phones: brand stacked above the card. Desktop: brand on the left, card on the right. */}
            <main className="relative flex flex-1 items-center px-5 pb-10 pt-4 sm:px-8">
                <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:gap-16 xl:gap-24">
                    <div className={`flex flex-col items-center text-center lg:items-start lg:text-left ${enter}`}>
                        <Seals />
                        <p className="mt-5 max-w-xl text-lg font-bold leading-snug tracking-tight [text-wrap:balance] sm:text-2xl lg:mt-8 lg:text-4xl lg:leading-tight xl:text-5xl">
                            City Disaster Risk Reduction and Management Office
                        </p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200 lg:mt-4 lg:text-sm">
                            City of Ilagan · Province of Isabela
                        </p>
                        <div
                            className="mt-8 hidden h-1 w-20 origin-left rounded-full bg-sky-300 motion-safe:animate-grow-x lg:block"
                            style={{ animationDelay: '400ms' }}
                            aria-hidden="true"
                        />
                        <p className="mt-8 hidden max-w-lg text-lg leading-relaxed text-white/80 lg:block">
                            Situational Reports System for monitoring, reporting, and coordinating emergency operations across the city.
                        </p>
                    </div>

                    {/*
                      Smoked-glass card: dark translucent tint with heavy blur, a bright hairline
                      edge, and a static glow in one corner. `auth-glass` (app.css) re-points the
                      design tokens so everything inside reads light-on-glass. Without
                      backdrop-filter: a near-solid dark tint.
                    */}
                    <div
                        className={`w-full max-w-md justify-self-center lg:max-w-none auth-glass relative isolate overflow-hidden rounded-3xl border border-white/15 bg-[#0b1426]/95 p-6 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_40px_80px_-20px_rgba(0,0,0,0.6)] supports-[backdrop-filter]:bg-[#0b1426]/45 supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150 lg:supports-[backdrop-filter]:backdrop-blur-2xl sm:max-w-lg sm:p-10 ${enter} motion-safe:delay-150`}
                    >
                        <div className="pointer-events-none absolute -right-20 -top-20 -z-10 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" aria-hidden="true" />
                        {children}
                    </div>
                </div>
            </main>

            <footer className="relative pb-6 text-center text-xs text-white/60 sm:text-sm">
                © {year} City of Ilagan CDRRMO
            </footer>
        </div>
    );
}
