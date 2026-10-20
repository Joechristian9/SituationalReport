import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

// Every Inertia page must be its own entry: app.blade.php asks Vite for
// resources/js/Pages/<component>.jsx, and a page Rollup folded into a shared chunk has no
// manifest entry, so loading it directly (or reopening it offline) fails with a 500.
const pageEntries = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const file = path.posix.join(dir, entry.name);
        if (entry.isDirectory()) return pageEntries(file);
        return entry.name.endsWith(".jsx") ? [file] : [];
    });

export default defineConfig({
    plugins: [
        laravel({
            input: ["resources/js/app.jsx", ...pageEntries("resources/js/Pages")],
            refresh: true,
        }),
        react(),
    ],

    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./resources/js"),
        },
    },

    // `npm test`: logic tests next to the code (*.test.js), no browser needed.
    test: {
        include: ["resources/js/**/*.test.{js,jsx}"],
    },
});
