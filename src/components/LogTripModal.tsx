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
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Pending">("Paid")
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
    const driverId = activeDriver?.id || ""
    const driverName = activeDriver?.name || "Driver"
    const driverInitials = activeDriver?.initials || "DR"
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
      payment_status: paymentStatus,
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
          paymentStatus: paymentStatus,
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
        style={{ maxHeight: "96vh", overflowY: "visible" }}
      >
        <div className="sheet-grabber" />
        <div className="sheet-title" style={{ marginBottom: "6px" }}>
          <div>
            <span className="eyebrow" style={{ fontSize: "9px" }}>NEW JOURNEY · MAURITIUS</span>
            <h2 style={{ fontSize: "17px", margin: "2px 0 0" }}>Log a trip</h2>
          </div>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close"
            disabled={isLogged}
            style={{ width: "30px", height: "30px" }}
          >
            <Icon name="close" size={15} />
          </button>
        </div>

        {error && (
          <div style={{ color: "#ef5359", fontSize: "11px", marginBottom: "6px", padding: "6px 10px", background: "#2b1519", borderRadius: "8px" }}>
            {error}
          </div>
        )}

        {/* Trip Type Selector */}
        <div className="trip-selector" style={{ marginTop: "4px" }}>
          <button
            type="button"
            className={tripType === "regular" ? "active" : ""}
            onClick={() => handleTripTypeChange("regular")}
            style={{ height: "30px", fontSize: "11px" }}
          >
            Standard Trip
          </button>
          <button
            type="button"
            className={tripType === "vip" ? "vip active" : ""}
            onClick={() => handleTripTypeChange("vip")}
            style={{ height: "30px", fontSize: "11px" }}
          >
            <Icon name="sparkles" size={13} /> VIP Trip
          </button>
        </div>

        {tripType === "vip" && (
          <div className="vip-banner" style={{ marginTop: "6px", padding: "6px 10px" }}>
            <Icon name="sparkles" size={14} />
            <span>
              <strong>VIP Custom Rate Active</strong>
              Executive charter transfer
            </span>
          </div>
        )}

        {/* Route Fields with Add Location Trigger */}
        <div className="route-fields" style={{ marginTop: "6px", gap: "6px" }}>
          <label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
              <span style={{ fontSize: "8px" }}>Origin</span>
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
                  fontSize: "10px",
                  fontWeight: "700",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                + Add
              </button>
            </div>
            <span className="select-wrap" style={{ height: "36px", padding: "0 8px" }}>
              <Icon name="location" size={14} />
              <select
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
                style={{ fontSize: "11px" }}
              >
                {locationNames.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <Icon name="chevron" size={13} />
            </span>
          </label>
          <div className="route-connector" style={{ paddingTop: "18px" }}>
            <span />
            <Icon name="arrow" size={13} />
            <span />
          </div>
          <label>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
              <span style={{ fontSize: "8px" }}>Destination</span>
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
                  fontSize: "10px",
                  fontWeight: "700",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                + Add
              </button>
            </div>
            <span className="select-wrap" style={{ height: "36px", padding: "0 8px" }}>
              <Icon name="location" size={14} />
              <select
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                style={{ fontSize: "11px" }}
              >
                {locationNames.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <Icon name="chevron" size={13} />
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
              padding: "10px",
              marginTop: "6px",
              marginBottom: "6px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "#20d59b" }}>
                Add New {targetLocationField === "origin" ? "Pickup" : "Destination"} Spot
              </span>
              <button
                type="button"
                onClick={() => setIsAddingLocation(false)}
                style={{ background: "transparent", border: 0, color: "#7a8292", cursor: "pointer", fontSize: "11px" }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                type="text"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="e.g. Trou aux Biches"
                style={{
                  flex: 1,
                  height: "34px",
                  padding: "0 8px",
                  background: "#090a0f",
                  border: "1px solid #28303f",
                  borderRadius: "6px",
                  color: "#f5f7fa",
                  fontSize: "11px",
                }}
                autoFocus
              />
              <button
                type="submit"
                disabled={isSavingLocation || !newLocationName.trim()}
                style={{
                  height: "34px",
                  padding: "0 12px",
                  borderRadius: "6px",
                  background: "#20d59b",
                  color: "#03261d",
                  fontWeight: "700",
                  fontSize: "11px",
                  border: 0,
                  cursor: "pointer",
                }}
              >
                {isSavingLocation ? "..." : "Add"}
              </button>
            </div>
          </form>
        )}

        {/* Quick Spot Chips */}
        <div className="quick-spots" style={{ marginTop: "4px" }}>
          <div style={{ display: "flex", gap: "5px", overflowX: "auto", scrollbarWidth: "none", marginTop: "2px" }}>
            {quickSpots.slice(0, 4).map((spot) => (
              <button
                type="button"
                key={spot}
                onClick={() => setDestination(spot)}
                className={destination === spot ? "active" : ""}
                style={{ padding: "3px 8px", fontSize: "9px" }}
              >
                {spot}
              </button>
            ))}
          </div>
        </div>

        {tripType === "vip" && (
          <label className="text-field" style={{ marginTop: "6px" }}>
            <span style={{ fontSize: "8px" }}>VIP passenger / hotel / account ref</span>
            <input
              value={passengerRef}
              onChange={(e) => setPassengerRef(e.target.value)}
              placeholder="e.g. Hotel Transfer - Constance"
              style={{ height: "34px", fontSize: "11px" }}
            />
          </label>
        )}

        {/* DRIVER DIRECT TRIP FARE & PAYMENT ENTRY */}
        <div className="fare-panel" style={{ marginTop: "6px", padding: "8px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: "0 0 105px", height: "34px", background: "#151821", border: `1px solid ${tripType === "vip" ? "#f5ad3666" : "#20d59b55"}`, borderRadius: "8px", padding: "0 8px" }}>
              <span style={{ fontSize: "13px", fontWeight: "800", color: tripType === "vip" ? "#f7c75b" : "#20d59b" }}>
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
                  height: "100%",
                  background: "transparent",
                  border: 0,
                  outline: 0,
                  fontSize: "15px",
                  fontWeight: "800",
                  color: "#f5f7fa",
                  fontVariantNumeric: "tabular-nums",
                }}
              />
            </div>

            {/* Quick Fare Presets in a single sleek flex row */}
            <div style={{ display: "flex", gap: "4px", flex: 1, overflowX: "auto", scrollbarWidth: "none" }}>
              {[100, 150, 250, 350, 500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFare(preset)}
                  style={{
                    flex: "1 0 auto",
                    padding: "5px 7px",
                    borderRadius: "6px",
                    background: Number(fare) === preset ? (tripType === "vip" ? "#f5ad3633" : "#20d59b22") : "#1b1e2a",
                    border: Number(fare) === preset ? (tripType === "vip" ? "1px solid #f5ad36" : "1px solid #20d59b") : "1px solid #262b3a",
                    color: Number(fare) === preset ? (tripType === "vip" ? "#f7c75b" : "#20d59b") : "#a2aab8",
                    fontSize: "10px",
                    fontWeight: "700",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  Rs {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method & Payment Status side-by-side in one compact row */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "6px", alignItems: "center", paddingTop: "6px", borderTop: "1px solid #1c212e" }}>
            {/* Payment Method (4 compact pills) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2px", background: "#14171f", padding: "2px", borderRadius: "6px" }}>
              {(["Cash", "Card", "Account", "Juice"] as const).map((method) => (
                <button
                  type="button"
                  key={method}
                  onClick={() => {
                    setPayment(method)
                    if (method === "Account") setPaymentStatus("Pending")
                    else setPaymentStatus("Paid")
                  }}
                  style={{
                    height: "25px",
                    border: 0,
                    borderRadius: "4px",
                    background: payment === method ? "#28303e" : "transparent",
                    color: payment === method ? "#ffffff" : "#727a8a",
                    fontSize: "9px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  {method === "Account" ? "Acct" : method}
                </button>
              ))}
            </div>

            {/* Payment Status (Paid vs Pending) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
              <button
                type="button"
                onClick={() => setPaymentStatus("Paid")}
                style={{
                  height: "25px",
                  borderRadius: "5px",
                  fontWeight: "700",
                  fontSize: "10px",
                  cursor: "pointer",
                  border: paymentStatus === "Paid" ? "1px solid #20d59b" : "1px solid #262d3c",
                  background: paymentStatus === "Paid" ? "rgba(32, 213, 155, 0.2)" : "#131620",
                  color: paymentStatus === "Paid" ? "#20d59b" : "#7d8597",
                }}
              >
                ✓ Paid
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus("Pending")}
                style={{
                  height: "25px",
                  borderRadius: "5px",
                  fontWeight: "700",
                  fontSize: "10px",
                  cursor: "pointer",
                  border: paymentStatus === "Pending" ? "1px solid #f5ad36" : "1px solid #262d3c",
                  background: paymentStatus === "Pending" ? "rgba(245, 173, 54, 0.2)" : "#131620",
                  color: paymentStatus === "Pending" ? "#f5ad36" : "#7d8597",
                }}
              >
                ⏳ Pend
              </button>
            </div>
          </div>
        </div>

        {/* Action Button: Confirm & Log Trip */}
        <button
          type="button"
          className={`complete-button ${isLogged ? "completed" : ""}`}
          onClick={handleSubmit}
          disabled={isPending || isLogged}
          style={{ height: "42px", marginTop: "8px", fontSize: "13px" }}
        >
          {isLogged ? (
            <>
              <Icon name="check" size={15} /> Trip logged successfully
            </>
          ) : isPending ? (
            <>Recording trip...</>
          ) : (
            <>
              Confirm & Log Trip (Rs {fare}) <Icon name="arrow" size={14} />
            </>
          )}
        </button>
      </section>
    </div>
  )
}
export default LogTripModal
