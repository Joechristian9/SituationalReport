import { describe, expect, it } from "vitest";
// A 400 x 800 screen (tests run without a browser).
globalThis.window = { innerWidth: 400, innerHeight: 800 };
import { fit } from "./fitOnScreen";

// A 200 x 40 status on a 400 x 800 screen.
const box = { getBoundingClientRect: () => ({ width: 200, height: 40 }) };

describe("fit (keeps the dragged status on screen)", () => {

    it("leaves a position that already fits alone", () => {
        expect(fit({ left: 50, bottom: 100 }, box)).toEqual({ left: 50, bottom: 100 });
    });

    it("pulls it back from every edge, 8px in", () => {
        expect(fit({ left: -30, bottom: -30 }, box)).toEqual({ left: 8, bottom: 8 });
        expect(fit({ left: 999, bottom: 999 }, box)).toEqual({ left: 192, bottom: 752 });
    });

    it("means the default spot when nothing was saved", () => {
        expect(fit(null, box)).toBeNull();
    });
});
