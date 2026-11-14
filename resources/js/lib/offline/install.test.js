import { beforeEach, describe, expect, it, vi } from "vitest";

// install.js wires the offline pieces into axios and Inertia when the app starts. These tests
// start it with everything around it mocked and drive the handlers it registered.

const handlers = vi.hoisted(() => ({ request: null, responseError: null, inertia: {} }));

vi.mock("axios", () => ({
    default: {
        get: vi.fn(() => Promise.resolve({ data: {} })),
        isCancel: () => false,
        interceptors: {
            request: { use: (onRequest) => (handlers.request = onRequest) },
            response: { use: (_, onError) => (handlers.responseError = onError) },
        },
    },
}));
vi.mock("@inertiajs/react", () => ({ router: { on: (event, handler) => (handlers.inertia[event] = handler) } }));
vi.mock("./context", () => ({ trackPages: vi.fn(), currentPage: () => null, currentDisaster: () => null, currentSession: () => "page-1", currentUser: () => ({ id: 7 }) }));
vi.mock("./queue", () => ({ QUEUED_MESSAGE: "saved on this device", endpointFor: vi.fn(() => "/road-reports"), enqueue: vi.fn(), mergePayloads: vi.fn(), openItemFor: vi.fn(async () => null) }));
vi.mock("./store", () => ({ removeItem: vi.fn() }));
vi.mock("./accounts", () => ({ notePage: vi.fn(), saveTemplate: vi.fn(), takeOldLock: vi.fn(() => null) }));
vi.mock("./auth", () => ({ finishPendingLogout: vi.fn(async () => {}) }));
vi.mock("./lock", () => ({ noteServerSession: vi.fn(), setSignedInHere: vi.fn(), signOutHere: vi.fn() }));
vi.mock("./offlineSession", () => ({ blocksRequest: vi.fn(() => false), offlineSession: vi.fn(() => null), signInToServer: vi.fn() }));
vi.mock("./staleAccounts", () => ({ CHECK_EVERY_MS: 300000, forgetStaleAccounts: vi.fn(async () => {}) }));
vi.mock("./sync", () => ({ canRefreshWithoutLosingEdits: () => true, needsReloadBeforeSaving: () => false, refreshPage: vi.fn(), subscribeSync: vi.fn(), syncNow: vi.fn() }));

vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => {}, removeItem: () => {} });
vi.stubGlobal("window", { addEventListener: vi.fn(), dispatchEvent: vi.fn(), navigator: {}, location: { origin: "http://localhost" } });
vi.stubGlobal("route", (name) => `/${name}`);
vi.stubGlobal("setInterval", vi.fn());
vi.stubGlobal("setTimeout", vi.fn());

const axios = (await import("axios")).default;
const { enqueue } = await import("./queue");
const { saveTemplate } = await import("./accounts");
const { offlineSession, signInToServer } = await import("./offlineSession");
const { installOffline, rememberCommunicationServices } = await import("./install");

installOffline({ props: {} });

const save = () => ({ method: "post", url: "/road-reports", data: { roads: [{ id: null, name: "Bridge road" }] }, headers: {} });

describe("keeping the communication form's columns for blank forms", () => {
    beforeEach(() => vi.clearAllMocks());

    it("saves the list the server sends", async () => {
        axios.get.mockResolvedValue({ data: { services: { cellphone: [{ id: 1 }] } } });

        await rememberCommunicationServices();

        expect(saveTemplate).toHaveBeenCalledWith({ communicationServices: { cellphone: [{ id: 1 }] } });
    });

    it("keeps the saved list when the answer is not the server's", async () => {
        // Data on with no load: the telco's page answers 200 with no list in it.
        axios.get.mockResolvedValue({ data: "<html>no load</html>" });
        await rememberCommunicationServices();

        axios.get.mockRejectedValue(new Error("Network Error"));
        await rememberCommunicationServices();

        expect(saveTemplate).not.toHaveBeenCalled();
    });
});

describe("saving a report", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("navigator", { onLine: true });
        offlineSession.mockReturnValue(null);
    });

    it("goes to the server as usual when the login is one the server knows", async () => {
        const config = save();

        expect(await handlers.request(config)).toBe(config);
        expect(enqueue).not.toHaveBeenCalled();
    });

    it("stays on the phone during an offline session, even if the server can be reached", async () => {
        // The server doesn't know this login: whatever session is open belongs to someone
        // else (or to nobody), so a save sent now would be filed under the wrong account.
        offlineSession.mockReturnValue({ user: { id: 7 }, blank: true });

        const stopped = await handlers.request(save()).catch((error) => error);
        const response = await handlers.responseError(stopped);

        expect(enqueue).toHaveBeenCalledWith({ url: "/road-reports", payload: { roads: [{ id: null, name: "Bridge road" }] }, replacesPending: undefined });
        expect(response).toMatchObject({ status: 202, data: { queued: true } });
        expect(signInToServer).toHaveBeenCalled(); // and the phone tries the server right away
    });

    it("stays on the phone for an Inertia form save during an offline session", () => {
        offlineSession.mockReturnValue({ user: { id: 7 }, blank: false });

        const allowed = handlers.inertia.before({ detail: { visit: { method: "post", url: { href: "http://localhost/road-reports" }, data: { roads: [] } } } });

        expect(allowed).toBe(false);
        expect(enqueue).toHaveBeenCalledWith({ url: "http://localhost/road-reports", payload: { roads: [] } });
        expect(signInToServer).toHaveBeenCalled();
    });
});
