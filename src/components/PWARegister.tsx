"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[FleetPulse PWA] Service Worker registered with scope:", reg.scope)
          })
          .catch((err) => {
            console.warn("[FleetPulse PWA] Service Worker registration failed:", err)
          })
      })
    }
  }, [])

  return null
}
export default PWARegister
