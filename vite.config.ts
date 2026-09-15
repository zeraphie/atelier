/**
 * ─ Vite config ─
 *
 * The site serves from GitHub Pages under the repository's name, so
 * every asset path starts with it, in development too. Tailwind comes
 * through its own Vite plugin and needs no PostCSS step.
 */

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/atelier/",
  plugins: [react(), tailwindcss()],
});
