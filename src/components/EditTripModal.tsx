"use client"

import { useState, useEffect, useTransition } from "react"
import { Icon } from "./Icon"
import { updateTrip, addLocation } from "@/app/actions"
import type { Location, Trip } from "@/lib/db"

interface EditTripModalProps {
  isOpen: boolean
  onClose: () => void
  trip: Trip | null
  locations: Location[]
  onTripUpdated: (updatedTrip: Trip) => void
  onLocationAdded?: (location: Location) => void
}

export function EditTripModal({
  isOpen,
  onClose,
  trip,
  locations,
  onTripUpdated,
  onLocationAdded,
}: EditTripModalProps) {
  const [tripType, setTripType] = useState<"regular" | "vip">("regular")
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [fare, setFare] = useState<number | string>("")
  const [passengerRef, setPassengerRef] = useState("")
  const [payment, setPayment] = useState<string>("Cash")
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Pending">("Paid")
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // On-the-fly location adding
  const [isAddingLocation, setIsAddingLocation] = useState(false)
  const [newLocationName, setNewLocationName] = useState("")
  const [targetLocationField, setTargetLocationField] = useState<"origin" | "destination">("destination")
  const [isSavingLocation, setIsSavingLocation] = useState(false)

  // Populate form with trip data whenever trip changes
  useEffect(() => {
    if (trip) {
      setTripType(trip.trip_type.toLowerCase() === "vip" ? "vip" : "regular")
      setOrigin(trip.origin_name || "Port Louis")
      setDestination(trip.destination_name || "Grand Baie")
      setFare(trip.fare)
      setPassengerRef(trip.note || "")
      setPayment(trip.payment_method || "Cash")
      setPaymentStatus(trip.payment_status || (trip.status === "Pending" ? "Pending" : "Paid"))
      setIsSaved(false)
      setError(null)
    }
  }, [trip])

  if (!isOpen || !trip) return null

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

  const handleSave = () => {
    const numericFare = Number(fare)
    if (isNaN(numericFare) || numericFare <= 0) {
      setError("Please enter a valid trip fare amount in Rs.")
      return
    }
    if (isPending || isSaved) return
    setError(null)

    const updatedTrip: Trip = {
      ...trip,
      origin_name: origin,
      destination_name: destination,
      trip_type: tripType === "vip" ? "VIP" : "Regular",
      fare: numericFare,
      payment_method: payment,
      payment_status: paymentStatus,
      note: passengerRef.trim() || null,
      status: paymentStatus === "Pending" ? "Pending" : "Approved",
    }

    // Optimistic UI update
    setIsSaved(true)
    onTripUpdated(updatedTrip)

    startTransition(async () => {
      try {
        const result = await updateTrip(trip.id, {
          originName: origin,
          destinationName: destination,
          tripType: tripType === "vip" ? "VIP" : "Regular",
          fare: numericFare,
          paymentMethod: payment,
          paymentStatus: paymentStatus,
          note: passengerRef.trim() || undefined,
        })

        if (!result.success) {
          setError(result.error || "Failed to update trip")
          setIsSaved(false)
          return
        }

        window.setTimeout(() => {
          setIsSaved(false)
          onClose()
        }, 600)
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to update trip")
        setIsSaved(false)
      }
    })
  }

  const locationNames = locations.length > 0
    ? locations.map((l) => l.name)
    : ["Port Louis", "Grand Baie", "Flic en Flac", "Curepipe", "Ebene Cybercity", "SSR International Airport", "Rose Hill", "Tamarin"]

  return (
    <div
      className="sheet-overlay"
      onMouseDown={(event) =>
        event.target === event.currentTarget && !isSaved && onClose()
      }
    >
      <section
        className="trip-sheet"
        aria-modal="true"
        role="dialog"
        aria-label="Edit trip details"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <div className="sheet-grabber" />
        <div className="sheet-title">
          <div>
            <span className="eyebrow">EDIT JOURNEY · MAURITIUS</span>
            <h2>Edit Trip</h2>
          </div>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close"
            disabled={isSaved}
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
        <div className="trip-selector" style={{ marginTop: "12px" }}>
          <button
            type="button"
            className={tripType === "regular" ? "active" : ""}
            onClick={() => setTripType("regular")}
          >
            Standard Trip
          </button>
          <button
            type="button"
            className={tripType === "vip" ? "vip active" : ""}
            onClick={() => setTripType("vip")}
          >
            <Icon name="sparkles" size={15} /> VIP Trip
          </button>
        </div>

        {/* Route Fields */}
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
            <button
              type="button"
              onClick={() => {
                const prevOrigin = origin
                setOrigin(destination)
                setDestination(prevOrigin)
              }}
              title="Swap origin and destination"
              style={{
                background: "#161b26",
                border: "1px solid #283040",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#20d59b",
                cursor: "pointer",
              }}
            >
              <Icon name="arrow" size={14} />
            </button>
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
                placeholder="e.g. Pereybere or Tamarin Bay"
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

        <label className="text-field">
          <span>Notes / Passenger reference</span>
          <input
            value={passengerRef}
            onChange={(e) => setPassengerRef(e.target.value)}
            placeholder="e.g. VIP transfer or client name"
          />
        </label>

        {/* Fare and Payment Section */}
        <div className="fare-panel">
          <div style={{ marginBottom: "8px" }}>
            <span style={{ display: "block", fontSize: "10px", fontWeight: "700", color: "#8991a3", letterSpacing: "0.1em" }}>
              TRIP FARE (RS)
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

          {/* Quick Presets */}
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

          {/* PAYMENT STATUS TOGGLE (PAID vs PENDING) */}
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #1f2533" }}>
            <span style={{ display: "block", fontSize: "10px", fontWeight: "700", color: "#8991a3", letterSpacing: "0.08em", marginBottom: "8px" }}>
              PAYMENT COLLECTION STATUS
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setPaymentStatus("Paid")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  height: "40px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "12px",
                  cursor: "pointer",
                  border: paymentStatus === "Paid" ? "1px solid #20d59b" : "1px solid #283040",
                  background: paymentStatus === "Paid" ? "rgba(32, 213, 155, 0.18)" : "#131620",
                  color: paymentStatus === "Paid" ? "#20d59b" : "#7d8597",
                  boxShadow: paymentStatus === "Paid" ? "0 0 14px rgba(32, 213, 155, 0.25)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon name="check" size={14} /> Paid (Received)
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus("Pending")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  height: "40px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "12px",
                  cursor: "pointer",
                  border: paymentStatus === "Pending" ? "1px solid #f5ad36" : "1px solid #283040",
                  background: paymentStatus === "Pending" ? "rgba(245, 173, 54, 0.18)" : "#131620",
                  color: paymentStatus === "Pending" ? "#f5ad36" : "#7d8597",
                  boxShadow: paymentStatus === "Pending" ? "0 0 14px rgba(245, 173, 54, 0.25)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon name="clock" size={14} /> Pending Payment
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`complete-button ${isSaved ? "completed" : ""}`}
          onClick={handleSave}
          disabled={isPending || isSaved}
          style={{ marginTop: "16px" }}
        >
          {isSaved ? (
            <>
              <Icon name="check" /> Trip updated successfully
            </>
          ) : isPending ? (
            <>Saving changes...</>
          ) : (
            <>
              Save Changes <Icon name="check" />
            </>
          )}
        </button>
      </section>
    </div>
  )
}
export default EditTripModal
