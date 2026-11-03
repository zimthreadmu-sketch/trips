"use client"

import { useState, useTransition } from "react"
import { Icon } from "./Icon"
import { addLocation } from "@/app/actions"
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
}: SettingsDrawerProps) {
  const [newZone, setNewZone] = useState("Booysens South")
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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
      } catch (err: any) {
        setError(err.message || "Failed to add location")
      }
    })
  }

  const exampleVipFare = (regularRate * multiplier).toFixed(2)

  return (
    <div
      className="drawer-overlay"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <aside className="settings-drawer" aria-label="Settings and configurations">
        <div className="drawer-head">
          <div>
            <span className="eyebrow">FLEET CONFIGURATION</span>
            <h2>Locations & pricing</h2>
            <p>Manage service zones and fare rules.</p>
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

        <div className="drawer-section">
          <div className="drawer-section-title">
            <span className="drawer-icon">
              <Icon name="location" />
            </span>
            <div>
              <strong>Service locations</strong>
              <p>{locations.length} active zones across Johannesburg</p>
            </div>
          </div>
          <label className="drawer-field">
            <span>Add new zone</span>
            <div>
              <input
                value={newZone}
                onChange={(event) => setNewZone(event.target.value)}
                placeholder="e.g. Booysens South"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddZone()
                }}
              />
              <button
                type="button"
                onClick={handleAddZone}
                disabled={isPending || !newZone.trim()}
              >
                <Icon name="plus" size={17} /> {isPending ? "Adding..." : "Add"}
              </button>
            </div>
          </label>
          <div className="zone-list">
            {locations.map((item, i) => (
              <div key={item.id || item.name}>
                <span>
                  <i className={i === 0 ? "active" : ""} />
                  {item.name}
                </span>
                <button type="button" title="Edit location">
                  <Icon name="edit" size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-title">
            <span className="drawer-icon gold">
              <Icon name="sparkles" />
            </span>
            <div>
              <strong>Pricing rules</strong>
              <p>Adjust standard and premium rates</p>
            </div>
          </div>
          <label className="pricing-field">
            <span>
              <b>Standard base rate</b>
              <small>Default minimum fare</small>
            </span>
            <div>
              R{" "}
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
              <span>Booysens → Rosettenville</span>
              <strong>R {exampleVipFare}</strong>
            </div>
            <small>VIP rate based on current multiplier ({multiplier}× R{regularRate})</small>
          </div>
        </div>

        <div className="drawer-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" onClick={onClose}>
            <Icon name="check" size={17} /> Save changes
          </button>
        </div>
      </aside>
    </div>
  )
}
