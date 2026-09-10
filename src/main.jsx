import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

/*
  Bersihkan service worker/cache versi lama.
  Ini penting karena sebelumnya app menggunakan path GitHub Pages.
*/
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();

      for (const registration of registrations) {
        await registration.unregister();
      }

      const cacheNames = await caches.keys();

      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
      }

      console.log("Old PWA cache/service worker cleared.");
    } catch (error) {
      console.error("Cache cleanup failed:", error);
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
