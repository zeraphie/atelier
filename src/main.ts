/**
 * ─ Entry ─
 *
 * As little as can be: the styles, and the app fetched as its own
 * chunk once the loader is already moving, so that evaluating it is
 * one short stall in the loop rather than a long one before the first
 * paint. The canvas comes as a third chunk, behind the app.
 */

import "./index.css";
import { failLoader } from "./ui/curtain.js";

async function boot(): Promise<void> {
  const root = document.getElementById("root");
  if (root === null) {
    throw new Error("index.html has no #root element to mount into");
  }
  const [{ createRoot }, { StrictMode, createElement }, { App }] = await Promise.all([
    import("react-dom/client"),
    import("react"),
    import("./App.js"),
  ]);
  createRoot(root).render(createElement(StrictMode, null, createElement(App)));
}

boot().catch((error: unknown) => {
  failLoader();
  reportError(error);
});
