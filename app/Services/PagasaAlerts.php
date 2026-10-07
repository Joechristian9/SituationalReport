<?php

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use SimpleXMLElement;
use Throwable;

/**
 * Active PAGASA alerts for Isabela, from PAGASA's public CAP feed (CC BY 4.0).
 *
 * panahon.gov.ph has no public API (its internal one is signed per browser session),
 * so the feed is the official machine-readable source. It lists the whole country;
 * we keep Cagayan Valley alerts and nationwide tropical cyclone alerts.
 */
class PagasaAlerts
{
    public const FEED_URL = 'https://publicalert.pagasa.dost.gov.ph/feeds/';

    private const HOST = 'https://publicalert.pagasa.dost.gov.ph';

    private const CACHE_KEY = 'pagasa.alerts';

    private const LAST_GOOD_KEY = 'pagasa.alerts.last-good';

    // Feed titles look like "GFA #2 - Region 2 (Cagayan Valley)" or "Tropical Cyclone Alert : ...".
    private const RELEVANT_TITLE = '/Region 2\b|Cagayan Valley|Isabela|Tropical Cyclone/i';

    // Each relevant entry costs one request; the feed is newest first, so older ones have expired.
    private const MAX_ENTRIES = 15;

    // Anything else (e.g. "Unknown") sorts last.
    private const SEVERITY_RANK = ['Extreme' => 0, 'Severe' => 1, 'Moderate' => 2, 'Minor' => 3];

    /**
     * @return array{alerts: array<int, array<string, mixed>>, fetchedAt: ?string, stale: bool}
     */
    public static function current(): array
    {
        // Only one request fetches from PAGASA at a time; the others get the last copy
        // instead of each holding a PHP worker for up to 15s while PAGASA is slow.
        $result = Cache::get(self::CACHE_KEY)
            ?? Cache::lock('pagasa.fetch', 30)->get(fn () => Cache::get(self::CACHE_KEY) ?? self::refresh())
            ?: self::lastGood(stale: false);

        // Cached alerts can expire before the cache does.
        $result['alerts'] = array_values(array_filter(
            $result['alerts'],
            fn (array $alert) => ! $alert['expires'] || Carbon::parse($alert['expires'])->isFuture(),
        ));

        return $result;
    }

    private static function refresh(): array
    {
        try {
            $result = ['alerts' => self::fetch(), 'fetchedAt' => now()->toIso8601String(), 'stale' => false];
            Cache::forever(self::LAST_GOOD_KEY, $result);
            $ttl = now()->addMinutes(10);
        } catch (Throwable $e) {
            report($e);
            // PAGASA unreachable: show the last copy we had rather than "no alerts", and
            // wait a little before trying again instead of retrying on every request.
            $result = self::lastGood(stale: true);
            $ttl = now()->addMinutes(2);
        }

        Cache::put(self::CACHE_KEY, $result, $ttl);

        return $result;
    }

    private static function lastGood(bool $stale): array
    {
        $last = Cache::get(self::LAST_GOOD_KEY) ?? ['alerts' => [], 'fetchedAt' => null, 'stale' => true];

        return $stale ? [...$last, 'stale' => true] : $last;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private static function fetch(): array
    {
        $feed = new SimpleXMLElement(Http::timeout(15)->get(self::FEED_URL)->throw()->body());

        $urls = [];
        foreach ($feed->entry as $entry) {
            if (preg_match(self::RELEVANT_TITLE, (string) $entry->title)) {
                $urls[] = self::onPagasaHost((string) $entry->link['href']);
            }
            if (count($urls) >= self::MAX_ENTRIES) {
                break;
            }
        }

        $responses = Http::pool(fn ($pool) => array_map(fn (string $url) => $pool->timeout(15)->get($url), $urls));

        $alerts = [];
        foreach ($responses as $response) {
            if (! $response instanceof Response || ! $response->successful()) {
                continue;
            }
            $alert = self::parse($response->body());
            if ($alert && self::concernsIsabela($alert)) {
                $alerts[$alert['id']] = $alert;
            }
        }

        $alerts = array_values($alerts);
        usort($alerts, fn (array $a, array $b) => [$b['mentionsIsabela'], self::SEVERITY_RANK[$a['severity']] ?? PHP_INT_MAX, $b['sent']]
            <=> [$a['mentionsIsabela'], self::SEVERITY_RANK[$b['severity']] ?? PHP_INT_MAX, $a['sent']]);

        return $alerts;
    }

    private static function parse(string $xml): ?array
    {
        try {
            $cap = new SimpleXMLElement($xml);
        } catch (Throwable) {
            return null;
        }

        if ((string) $cap->status !== 'Actual' || (string) $cap->msgType === 'Cancel' || ! isset($cap->info)) {
            return null;
        }

        $info = $cap->info[0];
        $region = null;
        foreach ($info->parameter as $parameter) {
            if (str_starts_with((string) $parameter->valueName, 'layer:Google:Region')) {
                $region = (string) $parameter->value;
            }
        }

        $areas = [];
        foreach ($info->area as $area) {
            $areas[] = trim((string) $area->areaDesc);
        }
        $areas = array_values(array_unique(array_filter($areas)));

        $description = self::clean((string) $info->description);

        return [
            'id' => (string) $cap->identifier,
            'event' => (string) $info->event,
            'headline' => (string) $info->headline,
            'severity' => (string) $info->severity ?: 'Unknown',
            'urgency' => (string) $info->urgency,
            'certainty' => (string) $info->certainty,
            'sent' => (string) $cap->sent,
            'expires' => (string) $info->expires ?: null,
            'region' => $region,
            'areas' => $areas,
            'description' => $description,
            'instruction' => self::clean((string) $info->instruction),
            'mentionsIsabela' => stripos($description.' '.implode(' ', $areas), 'Isabela') !== false,
        ];
    }

    private static function concernsIsabela(array $alert): bool
    {
        return $alert['mentionsIsabela']
            || str_contains((string) $alert['region'], 'Cagayan Valley')
            || str_contains($alert['event'], 'Tropical Cyclone');
    }

    // Some feed links use PAGASA's bare IP, whose TLS certificate doesn't match it.
    private static function onPagasaHost(string $url): string
    {
        $path = parse_url($url, PHP_URL_PATH) ?? '';

        return self::HOST.$path;
    }

    // Bulletins use markdown-style **bold**; the UI shows plain text.
    private static function clean(string $text): string
    {
        return trim(str_replace('**', '', $text));
    }
}
