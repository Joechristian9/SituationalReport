import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [
        laravel({
            input: [
                "resources/js/app.jsx",
                "resources/js/Pages/Admin/Dashboard.jsx",
                "resources/js/Pages/Admin/BatchHistory.jsx",
                "resources/js/Pages/Admin/BatchHistoryDetail.jsx",
                "resources/js/Pages/SituationReports/Index.jsx"
            ],
            refresh: true,
        }),
        react(),
    ],

    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./resources/js"),
        },
    },
});
