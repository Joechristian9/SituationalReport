import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { AlertTriangle, CheckCircle2, ExternalLink, Hand, Loader2, Map as MapIcon, MapPin, Maximize2, RefreshCw, ShieldAlert, X } from "lucide-react";
import { SkeletonList } from "@/Components/ui/skeleton";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { cn } from "@/lib/utils";

const PANAHON_URL = "https://www.panahon.gov.ph/";
const FEED_URL = "https://publicalert.pagasa.dost.gov.ph/feeds/";
const LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/";

// CAP severity, always shown as a word so it never relies on color alone.
const SEVERITY = {
    Extreme: "border-destructive/30 bg-destructive/10 text-destructive",
    Severe: "border-destructive/30 bg-destructive/10 text-destructive",
    Moderate: "border-warning/30 bg-warning/10 text-warning",
    Minor: "border-info/30 bg-info/10 text-info",
};

const when = (iso) => (iso ? format(new Date(iso), "MMM d, h:mm a") : null);

function AlertCard({ alert }) {
    return (
        <li className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">{alert.headline || alert.event}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {alert.region && `${alert.region} · `}Issued {when(alert.sent)}
                        {alert.expires && ` · Valid until ${when(alert.expires)}`}
                    </p>
                </div>
                <Badge variant="outline" className={cn("shrink-0", SEVERITY[alert.severity] ?? "bg-muted text-muted-foreground")}>
                    {alert.severity}
                </Badge>
            </div>

            {alert.mentionsIsabela && (
                <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-destructive">
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Isabela is named in this alert
                </p>
            )}

            {alert.areas.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Areas covered">
                    {alert.areas.map((area) => (
                        <li key={area} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {area}
                        </li>
                    ))}
                </ul>
            )}

            {(alert.description || alert.instruction) && (
                <details className="group mt-3">
                    <summary className="min-h-11 cursor-pointer list-none py-2 text-sm font-medium text-primary hover:underline md:min-h-0">
                        <span className="group-open:hidden">Read full bulletin</span>
                        <span className="hidden group-open:inline">Hide bulletin</span>
                    </summary>
                    <div className="space-y-3 text-sm leading-relaxed text-foreground">
                        {alert.description && <p className="whitespace-pre-line">{alert.description}</p>}
                        {alert.instruction && (
                            <p className="whitespace-pre-line rounded-lg bg-muted p-3">
                                <span className="font-semibold">What to do: </span>
                                {alert.instruction}
                            </p>
                        )}
                    </div>
                </details>
            )}
        </li>
    );
}

/**
 * Admin dashboard "PAGASA" tab: official alerts for Isabela (PAGASA's public CAP feed,
 * fetched and cached by the server) and the live PANaHON map. panahon.gov.ph has no
 * public API, so its map is embedded rather than rebuilt here.
 */
function MapButton({ icon: Icon, label, onClick }) {
    return (
        <Button variant="outline" className="min-h-11 min-w-11 gap-2 px-3 md:min-h-9" onClick={onClick}>
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{label}</span>
        </Button>
    );
}

// Read once: iPhones have no element full screen, and only touch screens get the tap-to-use layer.
const canFullscreen = typeof document !== "undefined" && document.fullscreenEnabled;
const touch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
const SLOW_MS = 15000;

export default function PagasaPanel() {
    const [showMap, setShowMap] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [slow, setSlow] = useState(false);
    const [mapActive, setMapActive] = useState(false);
    const [reloads, setReloads] = useState(0);
    const frameRef = useRef(null);

    // The iframe's load event can't tell a slow site from a stuck one, so offer the new tab after a while.
    useEffect(() => {
        if (!showMap || loaded) return;
        const timer = setTimeout(() => setSlow(true), SLOW_MS);
        return () => clearTimeout(timer);
    }, [showMap, loaded, reloads]);

    const reloadMap = () => {
        setLoaded(false);
        setSlow(false);
        setReloads((n) => n + 1);
    };
    const closeMap = () => {
        setShowMap(false);
        setLoaded(false);
        setSlow(false);
        setMapActive(false);
    };
    const { data, isLoading, isError, isFetching, refetch } = useQuery({
        queryKey: ["pagasa-alerts"],
        queryFn: async () => (await axios.get(route("admin.pagasa-alerts"))).data,
        // The server caches for 10 minutes, so re-opening the tab needn't refetch.
        staleTime: 1000 * 60 * 5,
        refetchInterval: 1000 * 60 * 10,
    });

    const alerts = data?.alerts ?? [];

    return (
        <div className="space-y-4 md:space-y-6">
            <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <div className="space-y-1">
                        <CardTitle className="text-lg">PAGASA alerts · Ilagan, Isabela</CardTitle>
                        <CardDescription>
                            Flood advisories and tropical cyclone alerts for Cagayan Valley.
                            {data?.fetchedAt && ` Checked ${formatDistanceToNow(new Date(data.fetchedAt), { addSuffix: true })}.`}
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" className="min-h-11 gap-2 md:min-h-9" onClick={() => refetch()} disabled={isFetching}>
                            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin motion-reduce:animate-none")} aria-hidden="true" />
                            Refresh
                        </Button>
                        <Button asChild className="min-h-11 gap-2 md:min-h-9">
                            <a href={PANAHON_URL} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                                Open PANaHON
                            </a>
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3" aria-live="polite" aria-busy={isLoading}>
                    {data?.stale && (
                        <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            PAGASA could not be reached. Showing the last alerts we received.
                        </p>
                    )}

                    {isLoading ? (
                        <SkeletonList rows={2} label="Checking PAGASA…" />
                    ) : isError ? (
                        <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            Could not load PAGASA alerts. Use Open PANaHON or try Refresh.
                        </p>
                    ) : alerts.length === 0 ? (
                        <p className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
                            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                            No active PAGASA alerts for Isabela or Cagayan Valley.
                        </p>
                    ) : (
                        <ul className="space-y-3">
                            {alerts.map((alert) => (
                                <AlertCard key={alert.id} alert={alert} />
                            ))}
                        </ul>
                    )}

                    <p className="text-xs leading-relaxed text-muted-foreground">
                        © Philippine Atmospheric, Geophysical and Astronomical Services Administration (PAGASA-DOST).
                        Alerts from{" "}
                        <a href={FEED_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                            PAGASA&apos;s public alert feed
                        </a>
                        , licensed under{" "}
                        <a href={LICENSE_URL} target="_blank" rel="noopener noreferrer license" className="underline hover:text-foreground">
                            CC BY 4.0
                        </a>
                        . Changes: filtered to Isabela and Cagayan Valley, text formatting simplified. This system is
                        not affiliated with or endorsed by PAGASA.
                    </p>
                </CardContent>
            </Card>

            <Card className="overflow-hidden">
                <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <div className="space-y-1">
                        <CardTitle className="text-lg">PANaHON live weather map</CardTitle>
                        <CardDescription>Radar, rainfall, forecasts and weather stations from PAGASA.</CardDescription>
                    </div>
                    {showMap && (
                        <div className="flex gap-2">
                            {/* Phones: icons only; the label stays for screen readers. */}
                            <MapButton icon={RefreshCw} label="Reload" onClick={reloadMap} />
                            {canFullscreen && <MapButton icon={Maximize2} label="Full screen" onClick={() => frameRef.current?.requestFullscreen()} />}
                            <Button asChild variant="outline" className="min-h-11 min-w-11 gap-2 px-3 md:min-h-9">
                                <a href={PANAHON_URL} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                                    <span className="sr-only sm:not-sr-only">New tab</span>
                                </a>
                            </Button>
                            <MapButton icon={X} label="Close map" onClick={closeMap} />
                        </div>
                    )}
                </CardHeader>
                {/* Loaded on request: it is PAGASA's whole site (~2 MB, with its own console warnings). */}
                {showMap ? (
                    <div className="relative border-t">
                        <iframe
                            key={reloads}
                            ref={frameRef}
                            src={PANAHON_URL}
                            title="PAGASA PANaHON live weather map"
                            onLoad={() => setLoaded(true)}
                            className="block h-[60svh] min-h-[360px] w-full md:h-[70vh] md:min-h-[420px]"
                        />
                        {!loaded ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted px-6 text-center" role="status">
                                <Loader2 className="h-8 w-8 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
                                <p className="text-sm font-medium text-foreground">Loading PANaHON…</p>
                                {slow && (
                                    <>
                                        <p className="max-w-sm text-sm text-muted-foreground">This is taking a while. PAGASA&apos;s site may be slow or busy.</p>
                                        <Button asChild variant="outline" className="min-h-11 gap-2 md:min-h-9">
                                            <a href={PANAHON_URL} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                                                Open in new tab
                                            </a>
                                        </Button>
                                    </>
                                )}
                            </div>
                        ) : (
                            // Touch screens: until tapped, swipes scroll the page instead of being caught by the map.
                            touch && !mapActive && (
                                <button
                                    type="button"
                                    onClick={() => setMapActive(true)}
                                    className="absolute inset-0 flex cursor-pointer items-center justify-center bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                                >
                                    <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-card px-4 text-sm font-medium text-foreground shadow-md">
                                        <Hand className="h-4 w-4" aria-hidden="true" />
                                        Tap to use the map
                                    </span>
                                </button>
                            )
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 border-t bg-muted px-6 py-10 text-center">
                        <MapIcon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                        <p className="max-w-md text-sm text-muted-foreground">
                            The map opens PAGASA&apos;s full PANaHON site inside this page. It uses more data, so it loads only when you ask.
                        </p>
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <Button className="min-h-11 gap-2 md:min-h-9" onClick={() => setShowMap(true)}>
                                <MapIcon className="h-4 w-4" aria-hidden="true" />
                                Load live map
                            </Button>
                            <Button asChild variant="outline" className="min-h-11 gap-2 md:min-h-9">
                                <a href={PANAHON_URL} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                                    Open in new tab
                                </a>
                            </Button>
                        </div>
                    </div>
                )}
                <p className="border-t px-6 py-3 text-xs leading-relaxed text-muted-foreground">
                    Map and data © PAGASA-DOST, shown directly from{" "}
                    <a href={PANAHON_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                        panahon.gov.ph
                    </a>
                    . All rights to PANaHON belong to PAGASA.
                </p>
            </Card>
        </div>
    );
}
