import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
          <SiteSettingsProvider>
            <App />
          </SiteSettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
