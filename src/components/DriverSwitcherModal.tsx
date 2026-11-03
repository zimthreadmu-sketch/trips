"use client"

import { useState } from "react"
import { Icon } from "./Icon"
import { type Driver } from "../lib/db"
import { createDriver, updateDriverVehicle } from "../app/actions"

interface DriverSwitcherModalProps {
  drivers: Driver[]
  activeDriver: Driver
  onSelectDriver: (driver: Driver) => void
  onUpdateDriver: (updated: Driver) => void
  onAddDriver: (newDriver: Driver) => void
  onClose: () => void
}

export default function DriverSwitcherModal({
  drivers,
  activeDriver,
  onSelectDriver,
  onUpdateDriver,
  onAddDriver,
  onClose,
}: DriverSwitcherModalProps) {
  const [vehicle, setVehicle] = useState(activeDriver?.vehicle || "Toyota HiAce (4821 DC 18)")
  const [isSavingVehicle, setIsSavingVehicle] = useState(false)
  const [vehicleSavedMessage, setVehicleSavedMessage] = useState("")

  // Add new driver form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDriverName, setNewDriverName] = useState("")
  const [newDriverVehicle, setNewDriverVehicle] = useState("")
  const [newDriverPhone, setNewDriverPhone] = useState("")
  const [isCreatingDriver, setIsCreatingDriver] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicle.trim()) return
    setIsSavingVehicle(true)
    setVehicleSavedMessage("")
    try {
      await updateDriverVehicle(activeDriver.id, vehicle.trim())
      const updated: Driver = { ...activeDriver, vehicle: vehicle.trim() }
      onUpdateDriver(updated)
      setVehicleSavedMessage("Vehicle updated successfully!")
      setTimeout(() => setVehicleSavedMessage(""), 2500)
    } catch {
      setErrorMsg("Failed to update vehicle.")
    } finally {
      setIsSavingVehicle(false)
    }
  }

  const handleCreateNewDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDriverName.trim()) {
      setErrorMsg("Please enter a driver name.")
      return
    }
    setIsCreatingDriver(true)
    setErrorMsg("")
    try {
      const res = await createDriver({
        name: newDriverName.trim(),
        vehicle: newDriverVehicle.trim() || vehicle.trim() || "Toyota Quantum (GP 482-901)",
        phone: newDriverPhone.trim(),
      })
      if (res.success && res.driver) {
        onAddDriver(res.driver)
        onSelectDriver(res.driver)
        setShowAddForm(false)
        setNewDriverName("")
        setNewDriverVehicle("")
        setNewDriverPhone("")
      } else {
        setErrorMsg(res.error || "Failed to create driver.")
      }
    } catch {
      setErrorMsg("Network error creating driver.")
    } finally {
      setIsCreatingDriver(false)
    }
  }

  return (
    <div className="bottom-sheet-backdrop" onClick={onClose}>
      <div
        className="bottom-sheet"
        style={{ maxHeight: "88vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="sheet-title">
          <div>
            <span className="eyebrow">DRIVER PROFILE & VEHICLE</span>
            <h3>Active Driver</h3>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Current Active Driver Card */}
        <div
          style={{
            background: "linear-gradient(145deg, #161b24, #10131a)",
            border: "1px solid #283042",
            borderRadius: "14px",
            padding: "16px",
            marginTop: "16px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: activeDriver.avatar_color || "#10B981",
              color: "#03261d",
              fontWeight: "800",
              fontSize: "16px",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            {activeDriver.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <strong style={{ fontSize: "16px", color: "#f5f7fa" }}>{activeDriver.name}</strong>
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: "700",
                  padding: "2px 8px",
                  borderRadius: "99px",
                  background: "#10b98122",
                  color: "#20d59b",
                  border: "1px solid #10b98144",
                }}
              >
                ON SHIFT
              </span>
            </div>
            <span style={{ fontSize: "12px", color: "#8b94a5", display: "block", marginTop: "3px" }}>
              {activeDriver.vehicle}
            </span>
          </div>
        </div>

        {/* Change Assigned Vehicle Form */}
        <form onSubmit={handleSaveVehicle} style={{ marginTop: "18px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#8991a3", marginBottom: "6px" }}>
            ASSIGNED VEHICLE (MODEL / REG NUMBER)
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              placeholder="e.g. Toyota Quantum (GP 482-901)"
              style={{
                flex: 1,
                height: "44px",
                padding: "0 14px",
                background: "#151821",
                border: "1px solid #2a3140",
                borderRadius: "10px",
                color: "#f5f7fa",
                fontSize: "13px",
              }}
            />
            <button
              type="submit"
              disabled={isSavingVehicle || vehicle === activeDriver.vehicle}
              style={{
                height: "44px",
                padding: "0 16px",
                borderRadius: "10px",
                background: vehicle === activeDriver.vehicle ? "#1a1e28" : "#20d59b",
                color: vehicle === activeDriver.vehicle ? "#697184" : "#052c21",
                fontWeight: "700",
                fontSize: "12px",
                border: 0,
                cursor: vehicle === activeDriver.vehicle ? "default" : "pointer",
              }}
            >
              {isSavingVehicle ? "Saving..." : "Save"}
            </button>
          </div>
          {vehicleSavedMessage && (
            <p style={{ fontSize: "11px", color: "#20d59b", marginTop: "6px" }}>{vehicleSavedMessage}</p>
          )}
        </form>

        {/* Switch Driver List */}
        <div style={{ marginTop: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#8991a3" }}>SWITCH DRIVER</span>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                background: "transparent",
                border: 0,
                color: "#20d59b",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              {showAddForm ? "Cancel" : "+ Add New Driver"}
            </button>
          </div>

          {/* Add New Driver Form Accordion */}
          {showAddForm && (
            <form
              onSubmit={handleCreateNewDriver}
              style={{
                background: "#151821",
                border: "1px solid #2e3646",
                borderRadius: "12px",
                padding: "14px",
                marginBottom: "14px",
              }}
            >
              <span style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#f5f7fa", marginBottom: "10px" }}>
                Add New Driver (No account needed)
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input
                  type="text"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  placeholder="Driver Full Name (e.g. Sipho Dlamini)"
                  style={{
                    height: "40px",
                    padding: "0 12px",
                    background: "#0d0f14",
                    border: "1px solid #28303f",
                    borderRadius: "8px",
                    color: "#f5f7fa",
                    fontSize: "13px",
                  }}
                  autoFocus
                />
                <input
                  type="text"
                  value={newDriverVehicle}
                  onChange={(e) => setNewDriverVehicle(e.target.value)}
                  placeholder="Vehicle (e.g. Mercedes Sprinter · CA 902-114)"
                  style={{
                    height: "40px",
                    padding: "0 12px",
                    background: "#0d0f14",
                    border: "1px solid #28303f",
                    borderRadius: "8px",
                    color: "#f5f7fa",
                    fontSize: "13px",
                  }}
                />
                <input
                  type="text"
                  value={newDriverPhone}
                  onChange={(e) => setNewDriverPhone(e.target.value)}
                  placeholder="Phone number (optional)"
                  style={{
                    height: "40px",
                    padding: "0 12px",
                    background: "#0d0f14",
                    border: "1px solid #28303f",
                    borderRadius: "8px",
                    color: "#f5f7fa",
                    fontSize: "13px",
                  }}
                />
                <button
                  type="submit"
                  disabled={isCreatingDriver || !newDriverName.trim()}
                  style={{
                    height: "42px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #20d59b, #10b981)",
                    color: "#03261d",
                    fontWeight: "800",
                    fontSize: "13px",
                    border: 0,
                    cursor: "pointer",
                    marginTop: "4px",
                  }}
                >
                  {isCreatingDriver ? "Adding Driver..." : "Add & Set Active"}
                </button>
              </div>
            </form>
          )}

          {/* List of existing drivers */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {drivers.map((drv) => {
              const isSelected = drv.id === activeDriver.id
              return (
                <button
                  key={drv.id}
                  type="button"
                  onClick={() => {
                    onSelectDriver(drv)
                    setVehicle(drv.vehicle)
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: isSelected ? "#15241f" : "#12141c",
                    border: isSelected ? "1px solid #1f684f" : "1px solid #222634",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "#f5f7fa",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: drv.avatar_color || "#3B82F6",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: "700",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {drv.initials}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: "14px", display: "block" }}>{drv.name}</strong>
                    <span style={{ fontSize: "11px", color: "#7a8292", display: "block" }}>{drv.vehicle}</span>
                  </div>
                  {isSelected && (
                    <span style={{ color: "#20d59b" }}>
                      <Icon name="check" size={16} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {errorMsg && (
          <p style={{ color: "#ef5359", fontSize: "12px", marginTop: "12px", textAlign: "center" }}>
            {errorMsg}
          </p>
        )}

        <div style={{ marginTop: "24px" }}>
          <button
            type="button"
            className="cta-button"
            onClick={onClose}
            style={{ width: "100%", height: "46px" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
