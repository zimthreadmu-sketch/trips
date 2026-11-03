"use client"

import { useState } from "react"
import { Icon } from "./Icon"
import { Logo } from "./Logo"
import { createDriver } from "@/app/actions"
import type { Driver } from "@/lib/db"

interface DriverOnboardingModalProps {
  drivers: Driver[]
  onComplete: (driver: Driver) => void
}

export function DriverOnboardingModal({
  drivers,
  onComplete,
}: DriverOnboardingModalProps) {
  const [mode, setMode] = useState<"select" | "new">(drivers.length > 0 ? "select" : "new")
  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers[0]?.id || "")

  // New driver inputs
  const [newName, setNewName] = useState("")
  const [newVehicle, setNewVehicle] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (mode === "select") {
      const found = drivers.find((d) => d.id === selectedDriverId) || drivers[0]
      if (!found) {
        setError("Please select a driver from the list or register a new one.")
        return
      }
      try {
        localStorage.setItem("fleetpulse_driver_bound", "true")
        localStorage.setItem("fleetpulse_active_driver_id", found.id)
      } catch {
        // safe ignore
      }
      onComplete(found)
      return
    }

    // Register new driver
    if (!newName.trim() || newName.trim().length < 2) {
      setError("Please enter your full name.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createDriver({
        name: newName.trim(),
        vehicle: newVehicle.trim() || "Toyota HiAce (4821 DC 18)",
        phone: newPhone.trim(),
      })

      if (res.success && res.driver) {
        try {
          localStorage.setItem("fleetpulse_driver_bound", "true")
          localStorage.setItem("fleetpulse_active_driver_id", res.driver.id)
        } catch {
          // safe ignore
        }
        onComplete(res.driver)
      } else {
        setError(res.error || "Failed to create driver profile.")
      }
    } catch {
      setError("Network error creating driver profile.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(5, 6, 9, 0.94)",
        backdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#10131a",
          border: "1px solid #232938",
          borderRadius: "20px",
          padding: "26px 22px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(16,185,129,0.15)",
          color: "#f5f7fa",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ display: "inline-block", marginBottom: "12px" }}>
            <Logo />
          </div>
          <span
            style={{
              display: "block",
              color: "#20d59b",
              fontSize: "10px",
              fontWeight: "700",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            DEVICE SETUP · MAURITIUS
          </span>
          <h2 style={{ fontSize: "20px", margin: "6px 0 4px", letterSpacing: "-0.03em" }}>
            Who is driving today?
          </h2>
          <p style={{ margin: 0, fontSize: "12px", color: "#8a94a6", lineHeight: 1.4 }}>
            Set your driver profile for this device. It will be stored in your phone cache for future shifts.
          </p>
        </div>

        {/* Tab Toggle: Existing vs New */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            background: "#090a0f",
            borderRadius: "10px",
            padding: "4px",
            marginBottom: "18px",
            border: "1px solid #1c2230",
          }}
        >
          <button
            type="button"
            onClick={() => setMode("select")}
            style={{
              padding: "8px 0",
              borderRadius: "8px",
              border: 0,
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              background: mode === "select" ? "#18202d" : "transparent",
              color: mode === "select" ? "#20d59b" : "#6c7689",
              transition: "all 0.15s ease",
            }}
          >
            Select Driver
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            style={{
              padding: "8px 0",
              borderRadius: "8px",
              border: 0,
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              background: mode === "new" ? "#18202d" : "transparent",
              color: mode === "new" ? "#20d59b" : "#6c7689",
              transition: "all 0.15s ease",
            }}
          >
            + New Driver
          </button>
        </div>

        {error && (
          <div
            style={{
              background: "#2a1518",
              border: "1px solid #732328",
              color: "#fc7d82",
              padding: "8px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              marginBottom: "14px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "select" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto", marginBottom: "18px" }}>
              {drivers.length === 0 ? (
                <p style={{ textAlign: "center", color: "#6c7689", fontSize: "12px", padding: "16px 0" }}>
                  No registered drivers found. Click "+ New Driver" above to register.
                </p>
              ) : (
                drivers.map((drv) => {
                  const isSelected = drv.id === selectedDriverId
                  return (
                    <div
                      key={drv.id}
                      onClick={() => setSelectedDriverId(drv.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        background: isSelected ? "#12261f" : "#141720",
                        border: isSelected ? "1px solid #20d59b" : "1px solid #222838",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: drv.avatar_color || "#10B981",
                          color: "#03261d",
                          fontSize: "13px",
                          fontWeight: "800",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        {drv.initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: "14px", display: "block", color: "#f5f7fa" }}>{drv.name}</strong>
                        <span style={{ fontSize: "11px", color: "#7a8292", display: "block" }}>{drv.vehicle}</span>
                      </div>
                      {isSelected && (
                        <span style={{ color: "#20d59b" }}>
                          <Icon name="check" size={16} />
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {mode === "new" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "18px" }}>
              <label>
                <span style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#8a94a6", marginBottom: "4px" }}>
                  DRIVER FULL NAME
                </span>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Jean-Luc Laviolette"
                  required
                  style={{
                    width: "100%",
                    height: "44px",
                    background: "#090a0f",
                    border: "1px solid #283042",
                    borderRadius: "10px",
                    padding: "0 12px",
                    color: "#f5f7fa",
                    fontSize: "13px",
                  }}
                  autoFocus
                />
              </label>

              <label>
                <span style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#8a94a6", marginBottom: "4px" }}>
                  ASSIGNED VEHICLE (MODEL & REGISTRATION)
                </span>
                <input
                  type="text"
                  value={newVehicle}
                  onChange={(e) => setNewVehicle(e.target.value)}
                  placeholder="e.g. Toyota HiAce (4821 DC 18)"
                  style={{
                    width: "100%",
                    height: "44px",
                    background: "#090a0f",
                    border: "1px solid #283042",
                    borderRadius: "10px",
                    padding: "0 12px",
                    color: "#f5f7fa",
                    fontSize: "13px",
                  }}
                />
              </label>

              <label>
                <span style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#8a94a6", marginBottom: "4px" }}>
                  PHONE NUMBER (OPTIONAL)
                </span>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. +230 5842 1920"
                  style={{
                    width: "100%",
                    height: "44px",
                    background: "#090a0f",
                    border: "1px solid #283042",
                    borderRadius: "10px",
                    padding: "0 12px",
                    color: "#f5f7fa",
                    fontSize: "13px",
                  }}
                />
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || (mode === "select" && drivers.length === 0)}
            style={{
              width: "100%",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #20d59b 0%, #10b981 100%)",
              color: "#03261d",
              fontWeight: "800",
              fontSize: "14px",
              border: 0,
              cursor: "pointer",
              boxShadow: "0 10px 24px rgba(16,185,129,0.3)",
            }}
          >
            {isSubmitting ? "Saving Profile..." : "Confirm & Start Shift"}
          </button>
        </form>
      </div>
    </div>
  )
}
export default DriverOnboardingModal
