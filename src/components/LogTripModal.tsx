"use client"

import { useState, useTransition } from "react"
import { Icon } from "./Icon"
import { logTrip, addLocation } from "@/app/actions"
import type { Location, Trip, Driver } from "@/lib/db"

interface LogTripModalProps {
  isOpen: boolean
  onClose: () => void
  locations: Location[]
  activeDriver?: Driver
  onTripLogged: (trip: Trip) => void
  onLocationAdded?: (location: Location) => void
  vipMultiplier?: number
  baseFare?: number
}

export function LogTripModal({
  isOpen,
  onClose,
  locations,
  activeDriver,
  onTripLogged,
  onLocationAdded,
  vipMultiplier = 1.8,
  baseFare = 150,
}: LogTripModalProps) {
  const [tripType, setTripType] = useState<"regular" | "vip">("regular")
  const [origin, setOrigin] = useState("Port Louis")
  const [destination, setDestination] = useState("Grand Baie")
  const [fare, setFare] = useState<number | string>(baseFare)
  const [passengerRef, setPassengerRef] = useState("")
  const [payment, setPayment] = useState<string>("Cash")
  const [isLogged, setIsLogged] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // On-the-fly location creation state
  const [isAddingLocation, setIsAddingLocation] = useState(false)
  const [newLocationName, setNewLocationName] = useState("")
  const [targetLocationField, setTargetLocationField] = useState<"origin" | "destination">("destination")
  const [isSavingLocation, setIsSavingLocation] = useState(false)

  if (!isOpen) return null

  const handleTripTypeChange = (type: "regular" | "vip") => {
    setTripType(type)
    if (type === "vip") {
      setFare(Math.round(baseFare * vipMultiplier))
      setPayment("Account")
    } else {
      setFare(baseFare)
      setPayment("Cash")
    }
  }

  const handleSaveNewLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLocationName.trim() || newLocationName.trim().length < 2) return
    setIsSavingLocation(true)
    try {
      const res = await addLocation(newLocationName.trim())
      if (res.success && res.location) {
        if (targetLocationField === "origin") {
          setOrigin(res.location.name)
        } else {
          setDestination(res.location.name)
        }
        if (onLocationAdded) {
          onLocationAdded(res.location)
        }
        setNewLocationName("")
        setIsAddingLocation(false)
      } else {
        setError(res.error || "Failed to add location")
      }
    } catch {
      setError("Network error adding location.")
    } finally {
      setIsSavingLocation(false)
    }
  }

  const handleSubmit = () => {
    const numericFare = Number(fare)
    if (isNaN(numericFare) || numericFare <= 0) {
      setError("Please enter a valid trip fare amount greater than Rs 0.")
      return
    }
    if (isPending || isLogged) return
    setError(null)

    const tempTripId = `trip_${Date.now()}`
    const loggedAt = new Date().toISOString()
    const driverId = activeDriver?.id || "driver_mru_01"
    const driverName = activeDriver?.name || "Jean-Luc Laviolette"
    const driverInitials = activeDriver?.initials || "JL"
    const vehicle = activeDriver?.vehicle || "Toyota HiAce (4821 DC 18)"
    const note = tripType === "vip" ? (passengerRef.trim() || "VIP Airport / Hotel Charter") : "Standard Commute"

    // Build optimistic trip
    const optimisticTrip: Trip = {
      id: tempTripId,
      driver_id: driverId,
      driver_name: driverName,
      driver_initials: driverInitials,
      vehicle: vehicle,
      origin_name: origin,
      destination_name: destination,
      trip_type: tripType === "vip" ? "VIP" : "Regular",
      fare: numericFare,
      payment_method: payment,
      note: note,
      status: "Approved",
      logged_at: loggedAt,
    }

    // Trigger optimistic UI immediately
    setIsLogged(true)
    onTripLogged(optimisticTrip)

    startTransition(async () => {
      try {
        const result = await logTrip({
          driverId,
          driverName,
          driverInitials,
          vehicle,
          originName: origin,
          destinationName: destination,
          tripType: tripType === "vip" ? "VIP" : "Regular",
          fare: numericFare,
          paymentMethod: payment,
          note: note,
          status: "Approved",
          loggedAt,
        })

        if (!result.success) {
          setError(result.error || "Failed to log trip")
          setIsLogged(false)
          return
        }

        // Close modal after feedback animation
        window.setTimeout(() => {
          setIsLogged(false)
          onClose()
        }, 750)
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to submit trip")
        setIsLogged(false)
      }
    })
  }

  // Location list with defaults in Mauritius
  const locationNames = locations.length > 0
    ? locations.map((l) => l.name)
    : ["Port Louis", "Grand Baie", "Flic en Flac", "Curepipe", "Ebene Cybercity", "SSR International Airport", "Rose Hill", "Tamarin"]

  const quickSpots = ["Port Louis", "Grand Baie", "Ebene Cybercity", "SSR International Airport"].filter(
    (s) => s !== origin
  )

  return (
    <div
      className="sheet-overlay"
      onMouseDown={(event) =>
        event.target === event.currentTarget && !isLogged && onClose()
      }
    >
      <section
        className="trip-sheet"
        aria-modal="true"
        role="dialog"
        aria-label="Log a new trip"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="sheet-grabber" />
        <div className="sheet-title">
          <div>
            <span className="eyebrow">NEW JOURNEY · MAURITIUS</span>
            <h2>Log a trip</h2>
          </div>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close"
            disabled={isLogged}
          >
            <Icon name="close" />
          </button>
        </div>

        {error && (
          <div style={{ color: "#ef5359", fontSize: "11px", marginTop: "10px", padding: "8px 12px", background: "#2b1519", borderRadius: "8px" }}>
            {error}
          </div>
        )}

        {/* Trip Type Selector */}
        <div className="trip-selector">
          <button
            type="button"
            className={tripType === "regular" ? "active" : ""}
            onClick={() => handleTripTypeChange("regular")}
          >
            Standard Trip
          </button>
          <button
            type="button"
            className={tripType === "vip" ? "vip active" : ""}
            onClick={() => handleTripTypeChange("vip")}
          >
            <Icon name="sparkles" size={15} /> VIP Trip
          </button>
        </div>

        {tripType === "vip" && (
          <div className="vip-banner">
            <Icon name="sparkles" size={15} />
            <span>
              <strong>VIP Custom Rate Enabled</strong>
              Enter custom premium fare for this executive transfer
            </span>
          </div>
        )}

        {/* Route Fields with Add Location Trigger */}
        <div className="route-fields">
          <label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span>Origin location</span>
              <button
                type="button"
                onClick={() => {
                  setTargetLocationField("origin")
                  setIsAddingLocation(true)
                }}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "#20d59b",
                  fontSize: "11px",
                  fontWeight: "700",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                + Add New
              </button>
            </div>
            <span className="select-wrap">
              <Icon name="location" size={17} />
              <select
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
              >
                {locationNames.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <Icon name="chevron" size={15} />
            </span>
          </label>
          <div className="route-connector">
            <span />
            <Icon name="arrow" size={15} />
            <span />
          </div>
          <label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span>Destination location</span>
              <button
                type="button"
                onClick={() => {
                  setTargetLocationField("destination")
                  setIsAddingLocation(true)
                }}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "#20d59b",
                  fontSize: "11px",
                  fontWeight: "700",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                + Add New
              </button>
            </div>
            <span className="select-wrap">
              <Icon name="location" size={17} />
              <select
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
              >
                {locationNames.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <Icon name="chevron" size={15} />
            </span>
          </label>
        </div>

        {/* Inline Add Location Subform */}
        {isAddingLocation && (
          <form
            onSubmit={handleSaveNewLocation}
            style={{
              background: "#12151e",
              border: "1px solid #20d59b44",
              borderRadius: "10px",
              padding: "12px",
              marginBottom: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#20d59b" }}>
                Add New {targetLocationField === "origin" ? "Pickup" : "Destination"} Spot
              </span>
              <button
                type="button"
                onClick={() => setIsAddingLocation(false)}
                style={{ background: "transparent", border: 0, color: "#7a8292", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="e.g. Trou aux Biches or Belle Mare"
                style={{
                  flex: 1,
                  height: "38px",
                  padding: "0 10px",
                  background: "#090a0f",
                  border: "1px solid #28303f",
                  borderRadius: "8px",
                  color: "#f5f7fa",
                  fontSize: "12px",
                }}
                autoFocus
              />
              <button
                type="submit"
                disabled={isSavingLocation || !newLocationName.trim()}
                style={{
                  height: "38px",
                  padding: "0 14px",
                  borderRadius: "8px",
                  background: "#20d59b",
                  color: "#03261d",
                  fontWeight: "700",
                  fontSize: "12px",
                  border: 0,
                  cursor: "pointer",
                }}
              >
                {isSavingLocation ? "Adding..." : "Add"}
              </button>
            </div>
          </form>
        )}

        {/* Quick Spot Chips */}
        <div className="quick-spots">
          <span>POPULAR DESTINATIONS</span>
          <div>
            {quickSpots.map((spot) => (
              <button
                type="button"
                key={spot}
                onClick={() => setDestination(spot)}
                className={destination === spot ? "active" : ""}
              >
                {spot}
              </button>
            ))}
          </div>
        </div>

        {tripType === "vip" && (
          <label className="text-field">
            <span>VIP passenger / hotel / account reference</span>
            <input
              value={passengerRef}
              onChange={(e) => setPassengerRef(e.target.value)}
              placeholder="e.g. Hotel Transfer - Constance Belle Mare"
            />
          </label>
        )}

        {/* DRIVER DIRECT TRIP FARE ENTRY */}
        <div className="fare-panel">
          <div style={{ marginBottom: "8px" }}>
            <span style={{ display: "block", fontSize: "10px", fontWeight: "700", color: "#8991a3", letterSpacing: "0.1em" }}>
              ENTER TRIP FARE (DRIVER SPECIFIES IN RS)
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
              <span style={{ fontSize: "18px", fontWeight: "800", color: tripType === "vip" ? "#f7c75b" : "#20d59b" }}>
                Rs
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={fare}
                onChange={(e) => setFare(e.target.value)}
                placeholder="0"
                style={{
                  width: "100%",
                  height: "44px",
                  background: "#151821",
                  border: `1px solid ${tripType === "vip" ? "#f5ad3666" : "#20d59b55"}`,
                  borderRadius: "10px",
                  padding: "0 12px",
                  fontSize: "20px",
                  fontWeight: "800",
                  color: "#f5f7fa",
                  fontVariantNumeric: "tabular-nums",
                }}
              />
            </div>
          </div>

          {/* Quick Fare Presets */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
            {[100, 150, 250, 350, 500, 800, 1200, 1500].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setFare(preset)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: Number(fare) === preset ? "#20d59b22" : "#1b1e2a",
                  border: Number(fare) === preset ? "1px solid #20d59b" : "1px solid #262b3a",
                  color: Number(fare) === preset ? "#20d59b" : "#a2aab8",
                  fontSize: "11px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Rs {preset}
              </button>
            ))}
          </div>

          <div className="payment-toggle">
            {(["Cash", "Card", "Account", "Juice"] as const).map((method) => (
              <button
                type="button"
                key={method}
                className={payment === method ? "active" : ""}
                onClick={() => setPayment(method)}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className={`complete-button ${isLogged ? "completed" : ""}`}
          onClick={handleSubmit}
          disabled={isPending || isLogged}
        >
          {isLogged ? (
            <>
              <Icon name="check" /> Trip logged successfully
            </>
          ) : isPending ? (
            <>Recording trip...</>
          ) : (
            <>
              Complete & Log Trip <Icon name="arrow" />
            </>
          )}
        </button>
      </section>
    </div>
  )
}
export default LogTripModal
