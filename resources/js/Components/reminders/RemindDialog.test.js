import { describe, expect, it } from "vitest";
import { SUGGESTIONS, suggestionText } from "./RemindDialog";

const [asap] = SUGGESTIONS;

describe("suggestionText", () => {
    it("names the chosen forms", () => {
        expect(suggestionText(asap, ["Roads"])).toBe("Please submit your Roads form as soon as possible.");
        expect(suggestionText(asap, ["Roads", "Bridges"])).toBe("Please submit your Roads and Bridges forms as soon as possible.");
        expect(suggestionText(asap, ["Roads", "Bridges", "Water Levels"])).toBe(
            "Please submit your Roads, Bridges and Water Levels forms as soon as possible.",
        );
    });

    it("counts the forms when naming them would pass the 200-character limit", () => {
        const many = ["Weather Report", "Electricity Services", "Water Services", "Communication Services", "Pre-Emptive Evacuation", "Incident Monitored", "Casualties", "Missing Persons", "Damaged Houses"];

        expect(suggestionText(asap, many)).toBe("Please submit your 9 pending forms as soon as possible.");
        SUGGESTIONS.forEach((make) => expect(suggestionText(make, many).length).toBeLessThanOrEqual(200));
    });

    it("falls back to pending forms when none is chosen", () => {
        expect(suggestionText(asap, [])).toBe("Please submit your pending forms as soon as possible.");
    });
});
