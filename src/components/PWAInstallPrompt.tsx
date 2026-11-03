"use client"

import { useState, useEffect } from "react"
import { Icon } from "./Icon"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    // 1. Detect if already installed/running in standalone mode
    const checkIsStandalone = () => {
      const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches
      const isNavStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true
      const isAndroidApp = document.referrer.includes("android-app://")
      return Boolean(isStandaloneMedia || isNavStandalone || isAndroidApp)
    }

    if (checkIsStandalone()) {
      setIsInstalled(true)
      return
    }

    // 2. Check if user dismissed recently (within past 12 hours)
    try {
      const dismissedTime = localStorage.getItem("fleetpulse_pwa_dismissed_time")
      if (dismissedTime && Date.now() - Number(dismissedTime) < 12 * 60 * 60 * 1000) {
        return
      }
    } catch {
      // safe ignore
    }

    // 3. Listen for Chrome / Android beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)

    // 4. Detect appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
      try {
        localStorage.setItem("fleetpulse_pwa_installed", "true")
      } catch {
        // safe ignore
      }
    }

    window.addEventListener("appinstalled", handleAppInstalled)

    // 5. Fallback timer for mobile devices (if beforeinstallprompt didn't fire immediately)
    const timer = setTimeout(() => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
      if (!checkIsStandalone() && isMobile) {
        setShowPrompt(true)
      }
    }, 1500)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
      window.removeEventListener("appinstalled", handleAppInstalled)
      clearTimeout(timer)
    }
  }, [])

  if (isInstalled || !showPrompt) return null

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice
        if (choice.outcome === "accepted") {
          setShowPrompt(false)
          setIsInstalled(true)
        }
      } catch (err) {
        console.warn("PWA install prompt error:", err)
        setShowInstructions(true)
      }
    } else {
      setShowInstructions(true)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    try {
      localStorage.setItem("fleetpulse_pwa_dismissed_time", String(Date.now()))
    } catch {
      // safe ignore
    }
  }

  const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent)

  return (
    <div
      className="pwa-install-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Install FleetPulse App"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(3, 4, 7, 0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "0 12px 16px 12px",
        animation: "pwaFadeIn 0.25s ease-out forwards",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss()
      }}
    >
      <div
        className="pwa-install-card"
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#0f121a",
          border: "1px solid #252d3d",
          borderRadius: "20px",
          padding: "20px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(32, 213, 155, 0.15)",
          color: "#f5f7fa",
          animation: "pwaSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                flexShrink: 0,
              }}
            >
              <Icon name="car" size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#f5f7fa", letterSpacing: "-0.02em" }}>
                Install FleetPulse
              </h3>
              <span style={{ fontSize: "12px", color: "#20d59b", fontWeight: "600" }}>
                Driver App · Mauritius
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss installation prompt"
            style={{
              background: "#161b26",
              border: "1px solid #283040",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              display: "grid",
              placeItems: "center",
              color: "#838c9d",
              cursor: "pointer",
            }}
          >
            <Icon name="close" size={14} />
          </button>
        </div>

        <p style={{ margin: "0 0 16px 0", fontSize: "13px", lineHeight: "1.5", color: "#a5afc2" }}>
          Install FleetPulse directly on your phone for full-screen cockpits, instant offline shift logging, and one-tap home screen access.
        </p>

        {showInstructions && (
          <div
            style={{
              background: "#161b26",
              border: "1px solid #2b3548",
              borderRadius: "12px",
              padding: "12px 14px",
              marginBottom: "16px",
              fontSize: "12px",
              color: "#c7d0e0",
              lineHeight: "1.4",
            }}
          >
            {isIOS ? (
              <div>
                <strong>How to install on iPhone/iPad:</strong>
                <ol style={{ margin: "6px 0 0 0", paddingLeft: "18px" }}>
                  <li>Tap the <strong>Share</strong> button at bottom of Safari.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                </ol>
              </div>
            ) : (
              <div>
                <strong>How to install on Android:</strong>
                <ol style={{ margin: "6px 0 0 0", paddingLeft: "18px" }}>
                  <li>Tap the <strong>3 dots (⋮)</strong> at top right in Chrome.</li>
                  <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                </ol>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px" }}>
          <button
            type="button"
            onClick={handleInstallClick}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              height: "46px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #20d59b 0%, #10b981 100%)",
              color: "#03261d",
              fontWeight: "800",
              fontSize: "14px",
              border: 0,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(32, 213, 155, 0.35)",
            }}
          >
            <Icon name="download" size={17} /> Install App
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              height: "46px",
              padding: "0 16px",
              borderRadius: "12px",
              background: "#161a24",
              border: "1px solid #283040",
              color: "#8c96a7",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
export default PWAInstallPrompt
