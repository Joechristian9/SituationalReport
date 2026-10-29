import { beforeEach, describe, expect, it, vi } from "vitest";

// sync.js listens for typing on the page when it loads; tests run without a browser.
vi.hoisted(() => {
    globalThis.document = { addEventListener: () => {} };
});

vi.mock("axios", () => ({ default: { post: vi.fn(), get: vi.fn() } }));
vi.mock("@inertiajs/react", () => ({ router: { visit: vi.fn() } }));
vi.mock("./store", () => ({ allItems: vi.fn(), putItem: vi.fn(), removeItem: vi.fn() }));
vi.mock("./context", () => ({ currentUser: () => ({ id: 1 }), currentSession: () => "page-1" }));

const axios = (await import("axios")).default;
const { allItems, putItem, removeItem } = await import("./store");
const { syncNow, syncState } = await import("./sync");

const report = { id: "key-1", userId: 1, status: "pending", url: "/roads", payload: { roads: [] }, session: "old-page", savedAt: 1 };

describe("syncNow", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("navigator", { onLine: true });
        vi.stubGlobal("window", { dispatchEvent: vi.fn() });
        allItems.mockResolvedValue([report]);
    });

    it("gives up on a send that hangs, keeps the report queued, and frees the next run", async () => {
        axios.post.mockRejectedValue(Object.assign(new Error("timeout of 30000ms exceeded"), { code: "ECONNABORTED" }));

        await syncNow();

        expect(axios.post).toHaveBeenCalledWith(report.url, report.payload, expect.objectContaining({ timeout: 30000 }));
        expect(removeItem).not.toHaveBeenCalled();
        expect(putItem).not.toHaveBeenCalled();
        expect(syncState().running).toBe(false);
    });

    it("removes the report once the server has it", async () => {
        axios.post.mockResolvedValue({ status: 200, data: {} });

        await syncNow();

        expect(removeItem).toHaveBeenCalledWith("key-1");
    });

    it("holds a report whose rows were changed on another device until the person chooses", async () => {
        const conflicts = [{ id: 5, changedAt: "2026-10-29T02:00:00+08:00", byYou: true }];
        axios.post.mockRejectedValue({ response: { status: 409, data: { message: "Changed elsewhere", conflicts } } });

        await syncNow();

        expect(putItem).toHaveBeenCalledWith(expect.objectContaining({ id: "key-1", status: "conflict", conflicts }));
        expect(removeItem).not.toHaveBeenCalled();
    });

    it("tells the app the account is signed out, and keeps the report for the next sign-in", async () => {
        axios.post.mockRejectedValue({ response: { status: 401, data: {} } });

        await syncNow();

        expect(window.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: "offline:signed-out" }));
        expect(syncState().loginNeeded).toBe(true);
        expect(removeItem).not.toHaveBeenCalled();
        expect(putItem).not.toHaveBeenCalled();
    });
});
