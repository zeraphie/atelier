import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import { drawMark } from "./ui/curtain.js";
import "./index.css";

// Every module above is evaluated by now, so the draw has the thread to itself.
drawMark();

const root = document.getElementById("root");
if (root === null) {
  throw new Error("index.html has no #root element to mount into");
}
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
