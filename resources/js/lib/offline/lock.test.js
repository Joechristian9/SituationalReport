import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { forgetAccount, rememberAccount } from "./accounts";
import {
    IDLE_MS,
    canLock,
    clearPendingLogout,
    coverNotice,
    holdIdleCover,
    isCovered,
    lock,
    noteActivity,
    noteServerSession,
    pendingLogout,
    serverHasSession,
    setPendingLogout,
    setSignedInHere,
    signOutHere,
    signedInHere,
    subscribeLock,
} from "./lock";

// Tests run without a browser: a plain in-memory localStorage.
const storage = new Map();
vi.stubGlobal("localStorage", {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
});

const fugu = { id: 7, name: "Fugu", email: "fugu@barangay.local", roles: [{ name: "user" }], permissions: [], offline_stamp: "s1" };

describe("who is logged in on this phone", () => {
    beforeEach(async () => {
        storage.clear();
        await rememberAccount(fugu, "correct horse");
        setSignedInHere(" Fugu@Barangay.local ");
    });
    afterEach(() => vi.useRealTimers());

    it("covers nothing on a page with no user", () => {
        signOutHere();

        expect(isCovered(null)).toBe(false);
    });

    it("leaves the app open for the account logged in here", () => {
        expect(signedInHere()).toBe("fugu@barangay.local");
        expect(isCovered(fugu)).toBe(false);
    });

    it("never covers an account this phone has no check for, so nobody is shut out", () => {
        forgetAccount(fugu.email);
        signOutHere();

        expect(isCovered(fugu)).toBe(false);
        expect(canLock(fugu.email)).toBe(false);
    });

    it("covers the app after logging out here and uncovers it after logging in", () => {
        lock();
        expect(isCovered(fugu)).toBe(true);
        expect(signedInHere()).toBeNull();

        setSignedInHere(fugu.email);
        expect(isCovered(fugu)).toBe(false);
    });

    it("covers an account's page while another account is the one logged in here", () => {
        setSignedInHere("rugao@barangay.local");

        expect(isCovered(fugu)).toBe(true);
    });

    it("covers after the idle time, a tap after that does not lift it, and admins are not timed out", () => {
        vi.useFakeTimers();
        vi.setSystemTime(Date.now() + IDLE_MS + 1000);

        noteActivity();

        expect(isCovered(fugu)).toBe(true);
        expect(isCovered(fugu, { idleLock: false })).toBe(false);
    });

    it("pushes the idle time back while the person is using the app", () => {
        vi.useFakeTimers();
        vi.setSystemTime(Date.now() + IDLE_MS - 60000);
        noteActivity();
        vi.setSystemTime(Date.now() + 120000);

        expect(isCovered(fugu)).toBe(false);
    });

    it("covers with a notice even when the account was just forgotten, until someone logs in", () => {
        forgetAccount(fugu.email);
        signOutHere({ notice: "changed" });

        expect(isCovered(fugu)).toBe(true);
        expect(coverNotice()).toBe("changed");

        setSignedInHere(fugu.email);
        expect(coverNotice()).toBeNull();
    });

    it("keeps a pending logout until it is cleared", () => {
        signOutHere({ pendingLogout: 7 });
        setSignedInHere("rugao@barangay.local");
        signOutHere();
        expect(pendingLogout()).toBe(7);

        clearPendingLogout();
        expect(pendingLogout()).toBeNull();

        setPendingLogout(8);
        expect(pendingLogout()).toBe(8);
    });

    it("saves an idle cover, so later activity cannot lift it", () => {
        vi.useFakeTimers();
        const start = Date.now();
        vi.setSystemTime(start + IDLE_MS + 1000);

        expect(holdIdleCover(fugu)).toBe(true);
        expect(signedInHere()).toBeNull();

        vi.setSystemTime(start); // even with the clock put back, it stays covered
        expect(isCovered(fugu)).toBe(true);
    });

    it("does not log out the account that just logged in over another account's page", () => {
        setSignedInHere("rugao@barangay.local");

        expect(holdIdleCover(fugu)).toBe(true); // fugu's page is still showing for a moment
        expect(signedInHere()).toBe("rugao@barangay.local");
    });

    it("leaves an open app alone", () => {
        expect(holdIdleCover(fugu)).toBe(false);
        expect(signedInHere()).toBe("fugu@barangay.local");
    });

    it("remembers which account the server still has logged in on this phone", () => {
        expect(serverHasSession(7)).toBe(true); // a phone logged in before this was tracked

        noteServerSession(null);
        setSignedInHere(fugu.email);
        expect(serverHasSession(7)).toBe(false);

        noteServerSession(7);
        expect(serverHasSession(7)).toBe(true);
        expect(serverHasSession(8)).toBe(false);
    });

    it("tells its listeners when the lock or the remembered accounts change", () => {
        const listener = vi.fn();
        const stop = subscribeLock(listener);

        lock();
        forgetAccount(fugu.email);
        expect(listener).toHaveBeenCalledTimes(2);

        stop();
        setSignedInHere(fugu.email);
        expect(listener).toHaveBeenCalledTimes(2);
    });
});
