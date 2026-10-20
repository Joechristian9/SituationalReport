import { describe, expect, it } from "vitest";
import { distance, stationsFrom, statusOf } from "./WaterLevelGraph";

describe("statusOf", () => {
    it("counts reaching a threshold as crossing it", () => {
        expect(statusOf(4.5, 3.5, 4.5)).toBe("critical");
        expect(statusOf(3.5, 3.5, 4.5)).toBe("alarm");
        expect(statusOf(3.49, 3.5, 4.5)).toBe("normal");
    });

    it("never flags a station on a missing threshold", () => {
        expect(statusOf(9, NaN, NaN)).toBe("normal");
        expect(statusOf(4, 3.5, NaN)).toBe("alarm");
    });
});

describe("distance", () => {
    it("rounds away float noise and says which side", () => {
        expect(distance(4.8, 4.5, "critical")).toBe("0.3 m above critical");
        expect(distance(3.2, 3.5, "alarm")).toBe("0.3 m below alarm");
        expect(distance(3.5, 3.5, "alarm")).toBe("0 m above alarm");
    });

    it("says nothing when a value is missing", () => {
        expect(distance(4, NaN, "critical")).toBeNull();
    });
});

describe("stationsFrom", () => {
    it("parses the string levels and lists the worst first, each judged on its own thresholds", () => {
        const rows = [
            { id: 1, gauging_station: "Low river", current_level: "2.00", alarm_level: "1.50", critical_level: "2.50" },
            { id: 2, gauging_station: "Calm", current_level: "1.00", alarm_level: "3.00", critical_level: "4.00" },
            { id: 3, gauging_station: "Flooding", current_level: "5.00", alarm_level: "3.50", critical_level: "4.50" },
            { id: 4, gauging_station: "Near alarm", current_level: "2.90", alarm_level: "3.00", critical_level: "4.00" },
        ];

        const stations = stationsFrom(rows);

        expect(stations.map((s) => [s.name, s.status])).toEqual([
            ["Flooding", "critical"],
            // 2 m is under the other rivers' alarm levels but over this one's.
            ["Low river", "alarm"],
            ["Near alarm", "normal"],
            ["Calm", "normal"],
        ]);
        expect(stations[0].level).toBe(5);
    });
});
