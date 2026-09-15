/**
 * ─ Entry ─
 *
 * As little as can be: the styles, and the app fetched as its own
 * chunk and run only once the mark has drawn, since running it shares
 * the thread the draw runs on. The canvas comes as a third chunk,
 * behind the app.
 */

import "./index.css";
import { failLoader, whenMarkDrawn } from "./ui/curtain.js";

async function boot(): Promise<void> {
  const root = document.getElementById("root");
  if (root === null) {
    throw new Error("index.html has no #root element to mount into");
  }
  await whenMarkDrawn();
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
