import React from "react";
import ReactDOM from "react-dom/client";

import CssBaseline from "@mui/material/CssBaseline";

import { Settings } from "./Settings";
import { PluginGate } from "../util/PluginGate";
import { PluginThemeProvider } from "../util/PluginThemeProvider";
import { OBRContextProvider } from "./OBRContext";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PluginGate>
      <PluginThemeProvider>
        <CssBaseline />
        <OBRContextProvider>
          <Settings />
        </OBRContextProvider>
      </PluginThemeProvider>
    </PluginGate>
  </React.StrictMode>
);
