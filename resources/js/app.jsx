import "../css/app.css";
import "./bootstrap";
// Imported first so the browser's one-time "installable" event is not missed.
import "./lib/pwa";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion } from "framer-motion";
import { installOffline } from "./lib/offline/install";
import OfflineStatus from "./Components/OfflineStatus";
import LockScreen from "./Components/LockScreen";
import EditConflictDialog from "./Components/EditConflictDialog";

// Tab titles read "Dashboard - SitRep". Set here, not from APP_NAME, so every server shows it
// without editing its .env.
const appName = "SitRep";

const queryClient = new QueryClient();

// Components use the light `m` element; its animation code arrives in a
// separate chunk instead of the full framer-motion bundle on every page.
const loadMotionFeatures = () =>
    import("./lib/motionFeatures").then((mod) => mod.default);

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx")
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Saves made with no internet are queued on the device and sent later.
        installOffline(props.initialPage);

        root.render(
            <QueryClientProvider client={queryClient}>
                <LazyMotion features={loadMotionFeatures}>
                    <App {...props} />
                    <OfflineStatus />
                    <LockScreen />
                    <EditConflictDialog />
                </LazyMotion>
            </QueryClientProvider>
        );
    },
    progress: {
        color: "#4B5563",
    },
});
