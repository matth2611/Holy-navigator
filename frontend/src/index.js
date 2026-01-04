import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

// Initialize Capacitor plugins for mobile
const initMobileApp = async () => {
  if (Capacitor.isNativePlatform()) {
    // Hide splash screen after app loads
    await SplashScreen.hide();
    
    // Set status bar style
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0A2463' });
    } catch (e) {
      // Status bar not available on all platforms
    }
  }
};

// Run initialization
initMobileApp();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

