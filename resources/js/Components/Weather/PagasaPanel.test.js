import { describe, expect, it } from "vitest";
import { alertStatus, splitHeadline } from "./PagasaPanel";

const NOW = new Date("2026-10-21T12:00:00+08:00").getTime();
const minutesAgo = (m) => new Date(NOW - m * 60 * 1000).toISOString();

describe("alertStatus", () => {
    it("gives an all-clear or the alerts only while the data is recent", () => {
        expect(alertStatus({ alerts: [], fetchedAt: minutesAgo(5), stale: false }, NOW)).toBe("clear");
        expect(alertStatus({ alerts: [{ id: "a" }], fetchedAt: minutesAgo(29), stale: false }, NOW)).toBe("alerts");
    });

    it("never shows an old all-clear as current", () => {
        expect(alertStatus({ alerts: [], fetchedAt: minutesAgo(60 * 48), stale: false }, NOW)).toBe("outdated");
        expect(alertStatus({ alerts: [], fetchedAt: minutesAgo(5), stale: true }, NOW)).toBe("outdated");
        expect(alertStatus({ alerts: [], fetchedAt: null, stale: true }, NOW)).toBe("outdated");
    });
});

describe("splitHeadline", () => {
    it("splits PAGASA's 'Type : Title' headlines and leaves plain ones whole", () => {
        expect(splitHeadline("Tropical Cyclone Warning : Super Typhoon Rosal (CHAMPI) Signal #2")).toEqual([
            "Tropical Cyclone Warning",
            "Super Typhoon Rosal (CHAMPI) Signal #2",
        ]);
        expect(splitHeadline("General Flood Advisory")).toEqual([null, "General Flood Advisory"]);
    });
});
