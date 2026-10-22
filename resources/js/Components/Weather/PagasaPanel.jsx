import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Clock, ExternalLink, Hand, Loader2, Map as MapIcon, MapPin, Maximize2, RefreshCw, ShieldAlert, X } from "lucide-react";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/Components/ui/sheet";
import TablePagination from "@/Components/ui/TablePagination";
import { cn } from "@/lib/utils";
import useMediaQuery from "@/hooks/useMediaQuery";
import useOnline from "@/hooks/useOnline";

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

const BAR = { Extreme: "bg-destructive", Severe: "bg-destructive", Moderate: "bg-warning", Minor: "bg-info" };

const TONE = {
    muted: "border-border bg-muted/50 text-muted-foreground",
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/30 bg-warning/10 text-warning",
    destructive: "border-destructive/30 bg-destructive/10 text-destructive",
};

// The server refreshes every 10 minutes; older than this, something is wrong (PAGASA down, or a tab left open for days).
const OUTDATED_MS = 30 * 60 * 1000;

/** What the alert notice leads with: "outdated" before anything else, so an old all-clear is never shown as green. */
export function alertStatus(data, now = Date.now()) {
    const age = data?.fetchedAt ? now - new Date(data.fetchedAt).getTime() : Infinity;
    if (data?.stale || age > OUTDATED_MS) return "outdated";
    return data.alerts.length > 0 ? "alerts" : "clear";
}

const when = (iso) => (iso ? format(new Date(iso), "MMM d, h:mm a") : null);

const PAGE_SIZE = 5;
const GUTTER = "px-4 sm:px-6";
// Clears the 4px severity bar on the tile's left edge.
const TILE_PAD = "pl-5 pr-4";

/** "Tropical Cyclone Warning : Super Typhoon Rosal Signal #2" → ["Tropical Cyclone Warning", "Super Typhoon Rosal Signal #2"]. */
export function splitHeadline(text) {
    const at = text.indexOf(" : ");
    return at === -1 ? [null, text] : [text.slice(0, at), text.slice(at + 3)];
}

/** `markIsabela`: tag alerts naming Isabela; off when every alert does, since then it tells nothing apart. */
function AlertRow({ alert, markIsabela }) {
    const [kind, title] = splitHeadline(alert.headline || alert.event);
    const hasDetails = alert.areas.length > 0 || alert.description || alert.instruction;
    const summary = (
        <>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Badge variant="outline" className={SEVERITY[alert.severity] ?? "bg-muted text-muted-foreground"}>
                        {alert.severity}
                    </Badge>
                    {kind && <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{kind}</span>}
                </div>
                {/* text-pretty: no lone "#2" on the last line of a wrapped typhoon name. */}
                <p className="mt-1.5 text-pretty font-semibold leading-snug text-foreground">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    {alert.region && `${alert.region} · `}Issued {when(alert.sent)}
                    {alert.expires && ` · Until ${when(alert.expires)}`}
                </p>
                {markIsabela && alert.mentionsIsabela && (
                    <p className={cn("mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", TONE.destructive)}>
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        Mentions Isabela
                    </p>
                )}
            </div>
            {hasDetails && (
                <ChevronDown className="h-5 w-5 shrink-0 self-center text-muted-foreground transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
            )}
        </>
    );

    return (
        <li className="relative overflow-hidden rounded-xl border bg-card">
            <span className={cn("absolute inset-y-0 left-0 w-1", BAR[alert.severity] ?? "bg-border")} aria-hidden="true" />
            {hasDetails ? (
                // The whole tile opens the bulletin: one large tap target instead of a "Show details" link per alert.
                // Shared name: the browser closes the open alert when another opens. Older browsers just allow several open.
                <details name="pagasa-alert" className="group">
                    <summary className={cn("flex cursor-pointer list-none gap-3 py-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden", TILE_PAD)}>
                        {summary}
                    </summary>
                    {/* Cyclone bulletins can list dozens of areas, so they sit with the bulletin, not on the tile. */}
                    <div className={cn("space-y-3 border-t pb-4 pt-3 text-sm leading-relaxed text-foreground", TILE_PAD)}>
                        {alert.areas.length > 0 && (
                            <p>
                                <span className="font-semibold">Areas: </span>
                                {alert.areas.join(", ")}
                            </p>
                        )}
                        {alert.description && <p className="whitespace-pre-line">{alert.description}</p>}
                        {alert.instruction && (
                            <p className="whitespace-pre-line rounded-lg bg-muted p-3">
                                <span className="font-semibold">What to do: </span>
                                {alert.instruction}
                            </p>
                        )}
                    </div>
                </details>
            ) : (
                <div className={cn("flex gap-3 py-4", TILE_PAD)}>{summary}</div>
            )}
        </li>
    );
}

function MapButton({ icon: Icon, label, onClick }) {
    return (
        <Button variant="outline" className="min-h-11 min-w-11 gap-2 px-3 md:min-h-9" onClick={onClick}>
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{label}</span>
        </Button>
    );
}

/** `compact`: icon only on phones (label kept for screen readers), for the row of map controls. */
function NewTabLink({ compact = false }) {
    return (
        <Button asChild variant="outline" className="min-h-11 min-w-11 gap-2 px-3 md:min-h-9">
            <a href={PANAHON_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                <span className={cn(compact && "sr-only sm:not-sr-only")}>{compact ? "New tab" : "Open in new tab"}</span>
            </a>
        </Button>
    );
}

// Read once: iPhones have no element full screen, and only touch screens get the tap-to-use layer.
const canFullscreen = typeof document !== "undefined" && document.fullscreenEnabled;
const touch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
const SLOW_MS = 15000;

/**
 * Admin dashboard "PAGASA" tab: PAGASA's official alerts for Isabela (public CAP feed, fetched
 * and cached by the server) as a one-line notice whose list opens in a drawer, and the live
 * PANaHON map, loaded on request (~2 MB). panahon.gov.ph has no public API, so it is embedded.
 */
export default function PagasaPanel() {
    const [showMap, setShowMap] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [slow, setSlow] = useState(false);
    const [mapActive, setMapActive] = useState(false);
    const [reloads, setReloads] = useState(0);
    const [alertsOpen, setAlertsOpen] = useState(false);
    const [alertPage, setAlertPage] = useState(1);
    const frameRef = useRef(null);
    const listRef = useRef(null);
    const online = useOnline();
    const isWide = useMediaQuery("(min-width: 640px)");
    const mapOn = showMap && online;

    // The iframe's load event can't tell a slow site from a stuck one, so offer the new tab after a while.
    useEffect(() => {
        if (!mapOn || loaded) return;
        const timer = setTimeout(() => setSlow(true), SLOW_MS);
        return () => clearTimeout(timer);
    }, [mapOn, loaded, reloads]);

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
    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ["pagasa-alerts"],
        queryFn: async () => (await axios.get(route("admin.pagasa-alerts"))).data,
        // The server caches for 10 minutes, so re-opening the tab needn't refetch.
        staleTime: 1000 * 60 * 5,
        refetchInterval: 1000 * 60 * 10,
    });

    const alerts = data?.alerts ?? [];
    const checked = data?.fetchedAt ? formatDistanceToNow(new Date(data.fetchedAt), { addSuffix: true }) : null;
    const isabela = alerts.filter((alert) => alert.mentionsIsabela).length;
    // Alerts naming Isabela come first (server order); the first page is stretched to hold them all.
    const perPage = Math.max(PAGE_SIZE, isabela);
    const totalPages = Math.max(1, Math.ceil(alerts.length / perPage));
    // A refresh can shrink the list under the current page.
    const page = Math.min(alertPage, totalPages);
    const shown = alerts.slice((page - 1) * perPage, page * perPage);
    const goToPage = (next) => {
        setAlertPage(next);
        listRef.current?.scrollTo({ top: 0 });
    };
    const naming = isabela === 0 ? "" : isabela === alerts.length && isabela > 1 ? ", all mention Isabela" : `, ${isabela} ${isabela === 1 ? "mentions" : "mention"} Isabela`;
    // No data once loading is over means the request failed.
    const status = isLoading
        ? { tone: "muted", icon: Loader2, title: "Checking PAGASA alerts…", detail: null }
        : {
              error: { tone: "destructive", icon: ShieldAlert, title: "Could not reach PAGASA", detail: "Try Refresh, or check the map below." },
              outdated: {
                  tone: "warning",
                  icon: Clock,
                  title: "Alerts may be out of date",
                  detail: checked ? `PAGASA last answered ${checked}. Refresh before relying on this.` : "PAGASA has not answered yet. Try Refresh.",
              },
              alerts: {
                  tone: isabela > 0 ? "destructive" : "warning",
                  icon: AlertTriangle,
                  title: `${alerts.length} active ${alerts.length === 1 ? "alert" : "alerts"}${naming}`,
                  detail: `Checked ${checked}`,
              },
              clear: { tone: "success", icon: CheckCircle2, title: "No active PAGASA alerts for Isabela", detail: `Checked ${checked}` },
          }[data ? alertStatus(data) : "error"];
    const StatusIcon = status.icon;
    // Close, not just hide, when a refresh clears every alert, or the drawer would pop open by itself when new ones arrive.
    if (alertsOpen && alerts.length === 0) setAlertsOpen(false);

    return (
        <>
            <Card className="overflow-hidden">
                {/* Alerts as a one-line notice; the list opens in a drawer so the map stays in view. */}
                <div role="status" className={cn("flex flex-col gap-3 border-b py-3 sm:flex-row sm:items-center", GUTTER, TONE[status.tone])}>
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                        <StatusIcon className={cn("mt-0.5 h-5 w-5 shrink-0", isLoading && "animate-spin motion-reduce:animate-none")} aria-hidden="true" />
                        <p className="min-w-0 text-sm">
                            <span className="block font-semibold text-foreground sm:inline">{status.title}</span>
                            {status.detail && (
                                <>
                                    <span className="hidden text-muted-foreground sm:inline"> · </span>
                                    <span className="text-muted-foreground">{status.detail}</span>
                                </>
                            )}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {alerts.length > 0 && (
                            <Button variant="outline" className="min-h-11 flex-1 gap-1 bg-card sm:flex-none md:min-h-9" onClick={() => setAlertsOpen(true)}>
                                View alerts
                                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            className="min-h-11 min-w-11 gap-2 bg-card px-3 md:min-h-9"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            aria-label={isFetching ? "Checking PAGASA alerts" : "Refresh PAGASA alerts"}
                        >
                            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin motion-reduce:animate-none")} aria-hidden="true" />
                        </Button>
                    </div>
                </div>

                <section aria-labelledby="pagasa-map-title">
                    <div className={cn("flex flex-col gap-3 py-4 sm:flex-row sm:items-center", GUTTER)}>
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <MapIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                                <h2 id="pagasa-map-title" className="text-lg font-semibold leading-snug text-foreground">Live weather map</h2>
                                <p className="text-sm text-muted-foreground">
                                    {!online
                                        ? "Needs internet. It loads once this device is back online."
                                        : mapOn
                                          ? "Radar, rainfall, forecasts and weather stations from PAGASA's PANaHON."
                                          : "Radar, rainfall and forecasts from PANaHON. Load it when you need it, to save data."}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {mapOn ? (
                                <>
                                    {/* Phones: icons only; the label stays for screen readers. */}
                                    <MapButton icon={RefreshCw} label="Reload" onClick={reloadMap} />
                                    {canFullscreen && <MapButton icon={Maximize2} label="Full screen" onClick={() => frameRef.current?.requestFullscreen()} />}
                                    <NewTabLink compact />
                                    <MapButton icon={X} label="Close map" onClick={closeMap} />
                                </>
                            ) : (
                                <>
                                    <Button className="min-h-11 flex-1 gap-2 sm:flex-none md:min-h-9" onClick={() => setShowMap(true)} disabled={!online}>
                                        <MapIcon className="h-4 w-4" aria-hidden="true" />
                                        Load live map
                                    </Button>
                                    <NewTabLink />
                                </>
                            )}
                        </div>
                    </div>

                    {mapOn && (
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
                                            <NewTabLink />
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
                    )}
                </section>

                <p className={cn("border-t bg-muted/40 py-3 text-xs leading-relaxed text-muted-foreground", GUTTER)}>
                    Alerts: PAGASA-DOST{" "}
                    <a href={FEED_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                        public alert feed
                    </a>{" "}
                    (
                    <a href={LICENSE_URL} target="_blank" rel="noopener noreferrer license" className="underline hover:text-foreground">
                        CC BY 4.0
                    </a>
                    ), filtered to Isabela and Cagayan Valley with simplified formatting. Map and data © PAGASA-DOST, shown from{" "}
                    <a href={PANAHON_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                        panahon.gov.ph
                    </a>
                    . Not affiliated with or endorsed by PAGASA.
                </p>
            </Card>

            <Sheet open={alertsOpen} onOpenChange={setAlertsOpen}>
                {/* Bottom sheet on phones, side panel from 640px, as on Audit Logs. */}
                <SheetContent
                    side={isWide ? "right" : "bottom"}
                    className={cn("flex flex-col gap-0 overflow-hidden p-0", isWide ? "h-full w-full sm:max-w-xl sm:rounded-l-2xl" : "max-h-[92dvh] rounded-t-2xl")}
                >
                    {/* Right padding keeps the title clear of the close button. */}
                    <SheetHeader className={cn("shrink-0 space-y-1 border-b pb-4 pr-14 pt-5 text-left", GUTTER)}>
                        <SheetTitle>PAGASA alerts</SheetTitle>
                        <SheetDescription>
                            {status.title}
                            {status.detail && ` · ${status.detail}`}
                        </SheetDescription>
                    </SheetHeader>
                    <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
                        <ul className="space-y-3 p-3 sm:p-4">
                            {shown.map((alert) => (
                                <AlertRow key={alert.id} alert={alert} markIsabela={isabela < alerts.length} />
                            ))}
                        </ul>
                        {totalPages > 1 && (
                            <TablePagination
                                className={cn("pt-1", GUTTER)}
                                currentPage={page}
                                totalPages={totalPages}
                                totalItems={alerts.length}
                                perPage={perPage}
                                onPageChange={goToPage}
                                itemLabel="alerts"
                            />
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
