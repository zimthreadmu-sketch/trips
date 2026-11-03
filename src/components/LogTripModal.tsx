"use client"

import { useState, useTransition } from "react"
import { Icon } from "./Icon"
import { logTrip } from "@/app/actions"
import type { Location, Trip } from "@/lib/db"

interface LogTripModalProps {
  isOpen: boolean
  onClose: () => void
  locations: Location[]
  onTripLogged: (trip: Trip) => void
  vipMultiplier?: number
  baseFare?: number
}

export function LogTripModal({
  isOpen,
  onClose,
  locations,
  onTripLogged,
  vipMultiplier = 1.8,
  baseFare = 60,
}: LogTripModalProps) {
  const [tripType, setTripType] = useState<"regular" | "vip">("vip")
  const [origin, setOrigin] = useState("Booysens")
  const [destination, setDestination] = useState("Rosettenville")
  const [fare, setFare] = useState(tripType === "vip" ? Math.round(baseFare * vipMultiplier) : baseFare)
  const [passengerRef, setPassengerRef] = useState("Executive Charter - Dr. Adeleke")
  const [payment, setPayment] = useState<string>("Account")
  const [isLogged, setIsLogged] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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

  const handleSubmit = () => {
    if (isPending || isLogged) return
    setError(null)

    // Build optimistic trip
    const tempTripId = `trip_${Date.now()}`
    const loggedAt = new Date().toISOString()
    const optimisticTrip: Trip = {
      id: tempTripId,
      driver_id: "driver_thabo_01",
      origin_name: origin,
      destination_name: destination,
      trip_type: tripType === "vip" ? "VIP" : "Regular",
      fare: Number(fare),
      payment_method: payment,
      note: tripType === "vip" ? passengerRef : "Standard Commute",
      status: "Approved",
      logged_at: loggedAt,
    }

    // Trigger optimistic UI immediately
    setIsLogged(true)
    onTripLogged(optimisticTrip)

    startTransition(async () => {
      try {
        const result = await logTrip({
          driverId: "driver_thabo_01",
          originName: origin,
          destinationName: destination,
          tripType: tripType === "vip" ? "VIP" : "Regular",
          fare: Number(fare),
          paymentMethod: payment,
          note: tripType === "vip" ? passengerRef : "Standard Commute",
          status: "Approved",
          loggedAt,
        })

        if (!result.success) {
          setError(result.error || "Failed to log trip")
          setIsLogged(false)
          return
        }

        // Close modal after nice feedback animation
        window.setTimeout(() => {
          setIsLogged(false)
          onClose()
        }, 850)
      } catch (err: any) {
        setError(err.message || "Failed to submit trip")
        setIsLogged(false)
      }
    })
  }

  // Location list with defaults
  const locationNames = locations.length > 0
    ? locations.map((l) => l.name)
    : ["Booysens", "Rosettenville", "JHB Central", "Southgate", "Sandton", "Rosebank"]

  const quickSpots = ["Booysens", "Rosettenville", "JHB Central", "Southgate"].filter(
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
      >
        <div className="sheet-grabber" />
        <div className="sheet-title">
          <div>
            <span className="eyebrow">NEW JOURNEY</span>
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
              Premium account pricing is active ({vipMultiplier}× base rate)
            </span>
          </div>
        )}

        <div className="route-fields">
          <label>
            <span>Origin location</span>
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
            <span>Destination location</span>
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

        <div className="quick-spots">
          <span>QUICK SPOTS</span>
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
            <span>VIP passenger / account reference</span>
            <input
              value={passengerRef}
              onChange={(e) => setPassengerRef(e.target.value)}
              placeholder="e.g. Executive Charter - Dr. Adeleke"
            />
          </label>
        )}

        <div className="fare-panel">
          <div className="fare-row">
            <div>
              <span>TRIP FARE</span>
              <strong>R {Number(fare).toFixed(2)}</strong>
            </div>
            <div>
              <button type="button" onClick={() => setFare((prev) => prev + 10)}>
                +R10
              </button>
              <button type="button" onClick={() => setFare((prev) => prev + 50)}>
                +R50
              </button>
            </div>
          </div>
          <div className="payment-toggle">
            {(["Cash", "Card", "Account"] as const).map((method) => (
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
