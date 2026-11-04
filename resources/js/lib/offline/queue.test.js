import { describe, expect, it, vi } from "vitest";

vi.mock("./store", () => ({ allItems: vi.fn(), newKey: vi.fn(), putItem: vi.fn(), removeItem: vi.fn() }));
vi.mock("./context", () => ({ currentDisaster: vi.fn(), currentSession: vi.fn(), currentUser: vi.fn() }));

const { QUEUED_MESSAGE, savedMessage, savedToastOptions } = await import("./queue");

const skipped = { data: { message: "Saved. 1 row wasn't saved because you can't edit it.", skipped_rows: 1 } };

describe("the message after a save", () => {
    it("keeps the form's own wording when nothing was left out", () => {
        const response = { data: { message: "Server wording" } };

        expect(savedMessage(response, "Form wording")).toBe("Form wording");
        expect(savedToastOptions(response)).toBeUndefined();
    });

    it("shows the server's wording, for longer, when rows were left out", () => {
        expect(savedMessage(skipped, "Form wording")).toBe(skipped.data.message);
        expect(savedToastOptions(skipped)).toEqual({ duration: 5000 });
    });

    it("still says a save was only queued on the device", () => {
        expect(savedMessage({ data: { queued: true } }, "Form wording")).toBe(QUEUED_MESSAGE);
    });
});
