import React from "react";
import { createRoot } from "react-dom/client";
import TimerWindow from "./components/Timer/TimerWindow";
import "./index.css";

const container = document.getElementById("timer-root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <TimerWindow />
    </React.StrictMode>
  );
}
