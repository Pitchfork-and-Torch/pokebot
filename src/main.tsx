import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import { SaveProvider } from "./state/save";
import { SkinProvider } from "./state/skin";
import "./styles.css";

const el = document.getElementById("root");
if (!el) throw new Error("root missing");

createRoot(el).render(
  <StrictMode>
    <HashRouter>
      <SaveProvider>
        <SkinProvider>
          <App />
        </SkinProvider>
      </SaveProvider>
    </HashRouter>
  </StrictMode>,
);
