import { describe, expect, it } from "vitest";
import { answerConflicts, applyChoices, askAboutConflicts, rowSummary } from "./conflicts";

const rows = [
    { id: 1, name_of_road: "Maharlika", status: "Closed", updated_at: "2026-10-29T01:00:00Z", _changed: true },
    { id: 2, name_of_road: "Bagumbayan", status: "Passable", updated_at: "2026-10-29T01:00:00Z", _changed: true },
    { id: 3, name_of_road: "Untouched", updated_at: "2026-10-29T01:00:00Z" },
];
const conflicts = [
    { id: 1, changedAt: "2026-10-29T02:00:00+08:00", byYou: true },
    { id: 2, changedAt: "2026-10-29T02:05:00+08:00", byYou: false },
];

describe("applyChoices", () => {
    it("saves mine over the other change, and drops my edit where theirs is kept", () => {
        const [mine, theirs, untouched] = applyChoices(rows, conflicts, { 1: "mine", 2: "theirs" });

        // Stamped with the other change's time, so the server no longer sees it as stale.
        expect(mine).toMatchObject({ name_of_road: "Maharlika", updated_at: "2026-10-29T02:00:00+08:00", _changed: true });
        // No longer marked as edited here, so the server keeps its own version.
        expect(theirs).toMatchObject({ updated_at: "2026-10-29T01:00:00Z", _changed: false });
        expect(untouched).toBe(rows[2]);
    });
});

describe("askAboutConflicts", () => {
    it("waits for the person's answer, and gives null when they close the dialog", async () => {
        const answered = askAboutConflicts({ label: "Roads", rows, conflicts });
        answerConflicts({ 1: "mine", 2: "theirs" });
        expect(await answered).toEqual({ 1: "mine", 2: "theirs" });

        const closed = askAboutConflicts({ label: "Roads", rows, conflicts });
        answerConflicts(null);
        expect(await closed).toBeNull();
    });
});

describe("rowSummary", () => {
    it("names a row by its own values, not ids or times", () => {
        expect(rowSummary(rows[0])).toBe("Maharlika · Closed");
        expect(rowSummary({ id: 9, updated_at: "x" })).toBe("A row");
    });
});
