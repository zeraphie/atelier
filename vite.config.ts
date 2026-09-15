/**
 * ─ Vite config ─
 *
 * The site serves from GitHub Pages under the repository's name, so
 * every asset path starts with it, in development too. Tailwind comes
 * through its own Vite plugin and needs no PostCSS step. A quick
 * Cloudflare tunnel may front the dev server to show it to someone,
 * and Vite answers only to hosts it is told about.
 */

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const TUNNEL_HOSTS = [".trycloudflare.com"];

export default defineConfig({
  base: "/atelier/",
  plugins: [react(), tailwindcss()],
  server: { allowedHosts: TUNNEL_HOSTS },
  preview: { allowedHosts: TUNNEL_HOSTS },
});
