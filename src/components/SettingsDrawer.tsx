"use client"

import { useState, useTransition } from "react"
import { Icon } from "./Icon"
import { addLocation, purgeAllSeedData } from "@/app/actions"
import type { Location } from "@/lib/db"

interface SettingsDrawerProps {
  isOpen: boolean
  onClose: () => void
  locations: Location[]
  onLocationAdded: (loc: Location) => void
  regularRate: number
  setRegularRate: (val: number) => void
  multiplier: number
  setMultiplier: (val: number) => void
  onDatabasePurged?: () => void
}

export function SettingsDrawer({
  isOpen,
  onClose,
  locations,
  onLocationAdded,
  regularRate,
  setRegularRate,
  multiplier,
  setMultiplier,
  onDatabasePurged,
}: SettingsDrawerProps) {
  const [newZone, setNewZone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isPurging, setIsPurging] = useState(false)

  if (!isOpen) return null

  const handleAddZone = () => {
    if (!newZone.trim() || isPending) return
    setError(null)
    setSuccessMsg(null)

    startTransition(async () => {
      try {
        const result = await addLocation(newZone.trim())
        if (!result.success) {
          setError(result.error || "Failed to add location")
          return
        }
        onLocationAdded(result.location)
        setSuccessMsg(`Added zone "${result.location.name}" successfully!`)
        setNewZone("")
        setTimeout(() => setSuccessMsg(null), 3000)
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to add location")
      }
    })
  }

  const handlePurgeDatabase = async () => {
    if (!confirm("Are you sure you want to wipe all dummy trips and fuel logs to a clean slate? This action cannot be undone.")) {
      return
    }
    setIsPurging(true)
    setError(null)
    try {
      const res = await purgeAllSeedData()
      if (res.success) {
        setSuccessMsg("Clean slate achieved: all test trips and fuel logs wiped!")
        if (onDatabasePurged) onDatabasePurged()
        setTimeout(() => window.location.reload(), 1200)
      } else {
        setError(res.message)
      }
    } catch {
      setError("Failed to purge database.")
    } finally {
      setIsPurging(false)
    }
  }

  const exampleVipFare = (regularRate * multiplier).toFixed(2)

  return (
    <div
      className="drawer-overlay"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <aside className="settings-drawer" aria-label="Settings and configurations" style={{ overflowY: "auto" }}>
        <div className="drawer-head">
          <div>
            <span className="eyebrow">FLEET CONFIGURATION</span>
            <h2>Locations & pricing</h2>
            <p>Manage service zones, fare rules, and data state.</p>
          </div>
          <button onClick={onClose} aria-label="Close drawer">
            <Icon name="close" />
          </button>
        </div>

        {error && (
          <div style={{ margin: "16px 25px 0", color: "#ef5359", fontSize: "11px", padding: "8px 12px", background: "#2b1519", borderRadius: "8px" }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ margin: "16px 25px 0", color: "#20d59b", fontSize: "11px", padding: "8px 12px", background: "#10281f", borderRadius: "8px" }}>
            {successMsg}
          </div>
        )}

        {/* Location Management */}
        <div className="drawer-section">
          <div className="drawer-section-title">
            <span className="drawer-icon">
              <Icon name="location" />
            </span>
            <div>
              <strong>Service locations</strong>
              <p>{locations.length} active zones across Mauritius</p>
            </div>
          </div>
          <label className="drawer-field">
            <span>Add new zone</span>
            <div className="input-with-button">
              <input
                value={newZone}
                onChange={(event) => setNewZone(event.target.value)}
                placeholder="e.g. Trou aux Biches or Belle Mare"
                onKeyDown={(e) => e.key === "Enter" && handleAddZone()}
              />
              <button
                type="button"
                onClick={handleAddZone}
                disabled={isPending || !newZone.trim()}
              >
                {isPending ? "Adding..." : "Add"}
              </button>
            </div>
          </label>
          <div className="location-pills">
            {locations.map((loc) => (
              <span key={loc.id} className="location-pill active">
                <Icon name="location" size={13} /> {loc.name}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing Configuration */}
        <div className="drawer-section">
          <div className="drawer-section-title">
            <span className="drawer-icon">
              <Icon name="sparkles" />
            </span>
            <div>
              <strong>Fare matrix settings</strong>
              <p>Configure base rate and VIP multipliers</p>
            </div>
          </div>
          <label className="pricing-field">
            <span>
              <b>Standard base fare</b>
              <small>Default commuter rate</small>
            </span>
            <div className="currency-input">
              Rs{" "}
              <input
                type="number"
                value={regularRate}
                onChange={(event) => setRegularRate(Number(event.target.value))}
              />
            </div>
          </label>
          <label className="pricing-field">
            <span>
              <b>VIP rate multiplier</b>
              <small>Applied to the standard fare</small>
            </span>
            <div className="gold-input">
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={multiplier}
                onChange={(event) => setMultiplier(Number(event.target.value))}
              />{" "}
              ×
            </div>
          </label>
          <div className="rate-preview">
            <span>EXAMPLE FARE</span>
            <div>
              <span>Port Louis → Grand Baie</span>
              <strong>Rs {exampleVipFare}</strong>
            </div>
            <small>VIP rate based on current multiplier ({multiplier}× Rs {regularRate})</small>
          </div>
        </div>

        {/* Database Clean Slate Maintenance */}
        <div className="drawer-section">
          <div className="drawer-section-title">
            <span className="drawer-icon" style={{ background: "#ef535922", color: "#ef5359" }}>
              <Icon name="close" size={16} />
            </span>
            <div>
              <strong style={{ color: "#fc7d82" }}>Database Maintenance</strong>
              <p>Reset trips and fuel records for live operation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePurgeDatabase}
            disabled={isPurging}
            style={{
              width: "100%",
              height: "40px",
              borderRadius: "8px",
              background: "#2a1518",
              border: "1px solid #732328",
              color: "#fc7d82",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {isPurging ? "Resetting Database..." : "Purge All Test Trips & Fuel Logs"}
          </button>
        </div>

        <div className="drawer-actions">
          <button type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </aside>
    </div>
  )
}
export default SettingsDrawer
