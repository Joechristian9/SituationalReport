import "../css/app.css";
import "./bootstrap";
// Imported first so the browser's one-time "installable" event is not missed.
import "./lib/pwa";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { installOffline } from "./lib/offline/install";
import OfflineStatus from "./Components/OfflineStatus";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

const queryClient = new QueryClient();

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
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
                <App {...props} />
                <OfflineStatus />
            </QueryClientProvider>
        );
    },
    progress: {
        color: "#4B5563",
    },
});
