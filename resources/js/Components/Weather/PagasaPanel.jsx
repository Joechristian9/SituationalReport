import React from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, MapPin, RefreshCw, ShieldAlert } from "lucide-react";
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
                <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold", SEVERITY[alert.severity] ?? "border-border bg-muted text-muted-foreground")}>
                    {alert.severity}
                </span>
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
export default function PagasaPanel() {
    const { data, isLoading, isError, isFetching, refetch } = useQuery({
        queryKey: ["pagasa-alerts"],
        queryFn: async () => (await axios.get(route("admin.pagasa-alerts"))).data,
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
                        <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                            Checking PAGASA…
                        </p>
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
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">PANaHON live weather map</CardTitle>
                    <CardDescription>
                        Radar, rainfall, forecasts and weather stations from PAGASA. If the map stays blank, use Open PANaHON.
                    </CardDescription>
                </CardHeader>
                <iframe
                    src={PANAHON_URL}
                    title="PAGASA PANaHON live weather map"
                    loading="lazy"
                    className="block h-[70vh] min-h-[420px] w-full border-t"
                />
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
