"use client"

import { useState, useTransition } from "react"
import { Icon } from "./Icon"
import { logFuel } from "@/app/actions"
import type { FuelLog } from "@/lib/db"

interface LogFuelDrawerProps {
  isOpen: boolean
  onClose: () => void
  onFuelLogged: (fuelLog: FuelLog) => void
}

const STATIONS = [
  "Shell Garage Rosettenville",
  "Engen Booysens South",
  "BP Central JHB",
  "TotalEnergies Southgate",
  "Sasol Turffontein",
  "Caltex Crown Mines",
]

const QUICK_STATIONS = [
  "Shell",
  "Engen",
  "BP",
  "Total",
  "Sasol",
]

export function LogFuelDrawer({
  isOpen,
  onClose,
  onFuelLogged,
}: LogFuelDrawerProps) {
  const [station, setStation] = useState(STATIONS[0])
  const [costAmount, setCostAmount] = useState(350)
  const [liters, setLiters] = useState(15.4)
  const [odometer, setOdometer] = useState<string>("142850")
  const [isLogged, setIsLogged] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!isOpen) return null

  const handleQuickStation = (shortName: string) => {
    const found = STATIONS.find((s) => s.toLowerCase().includes(shortName.toLowerCase()))
    if (found) {
      setStation(found)
    }
  }

  const handleLitersChange = (val: number) => {
    setLiters(val)
    // Approximate petrol rate ~ R22.75 / liter
    setCostAmount(Math.round(val * 22.75))
  }

  const handleSubmit = () => {
    if (isPending || isLogged) return
    setError(null)

    if (costAmount <= 0) {
      setError("Please enter a valid fuel cost amount.")
      return
    }

    if (liters <= 0) {
      setError("Please enter liters fueled.")
      return
    }

    const tempFuelId = `fuel_${Date.now()}`
    const loggedAt = new Date().toISOString()
    const optimisticFuel: FuelLog = {
      id: tempFuelId,
      driver_id: "driver_thabo_01",
      station_name: station,
      cost_amount: Number(costAmount),
      liters: Number(liters),
      odometer: odometer ? Number(odometer) : null,
      logged_at: loggedAt,
    }

    // Trigger optimistic UI
    setIsLogged(true)
    onFuelLogged(optimisticFuel)

    startTransition(async () => {
      try {
        const result = await logFuel({
          driverId: "driver_thabo_01",
          stationName: station,
          costAmount: Number(costAmount),
          liters: Number(liters),
          odometer: odometer ? Number(odometer) : undefined,
          loggedAt,
        })

        if (!result.success) {
          setError(result.error || "Failed to record fuel expense")
          setIsLogged(false)
          return
        }

        window.setTimeout(() => {
          setIsLogged(false)
          onClose()
        }, 850)
      } catch (err: any) {
        setError(err.message || "Failed to submit fuel expense")
        setIsLogged(false)
      }
    })
  }

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
        aria-label="Log fuel refill"
      >
        <div className="sheet-grabber" />
        <div className="sheet-title">
          <div>
            <span className="eyebrow">FLEET EXPENSE</span>
            <h2>Log fuel refill</h2>
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

        <div className="fuel-banner">
          <Icon name="fuel" size={17} />
          <span>
            <strong>Fuel Expense Tracking</strong>
            Direct deduction from shift net earnings
          </span>
        </div>

        <div style={{ marginTop: "14px" }}>
          <label className="text-field" style={{ marginTop: 0 }}>
            <span>Fuel station</span>
            <span className="select-wrap">
              <Icon name="location" size={17} />
              <select
                value={station}
                onChange={(e) => setStation(e.target.value)}
              >
                {STATIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <Icon name="chevron" size={15} />
            </span>
          </label>
        </div>

        <div className="quick-spots">
          <span>POPULAR BRANDS</span>
          <div>
            {QUICK_STATIONS.map((brand) => (
              <button
                type="button"
                key={brand}
                onClick={() => handleQuickStation(brand)}
                className={`fuel-spot ${station.includes(brand) ? "active" : ""}`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        <div className="fuel-inputs-row">
          <div className="fuel-input-box">
            <label>Liters pumped</label>
            <div className="input-wrap">
              <input
                type="number"
                step="0.1"
                min="1"
                value={liters}
                onChange={(e) => handleLitersChange(Number(e.target.value))}
              />
              <span style={{ color: "#7a8292", fontSize: "11px" }}>L</span>
            </div>
          </div>
          <div className="fuel-input-box">
            <label>Total expense</label>
            <div className="input-wrap">
              <span style={{ color: "#7a8292", fontSize: "11px" }}>R</span>
              <input
                type="number"
                min="1"
                value={costAmount}
                onChange={(e) => setCostAmount(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: "12px" }}>
          <label className="text-field" style={{ marginTop: 0 }}>
            <span>Odometer reading (km)</span>
            <input
              type="number"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              placeholder="e.g. 142850"
            />
          </label>
        </div>

        <div className="fare-panel" style={{ marginTop: "14px", border: "1px solid #3d2426" }}>
          <div className="fare-row">
            <div>
              <span>LOGGED EXPENSE</span>
              <strong style={{ color: "#ff7479" }}>−R {Number(costAmount).toFixed(2)}</strong>
            </div>
            <div>
              <button type="button" onClick={() => handleLitersChange(Math.round(liters + 5))}>
                +5L
              </button>
              <button type="button" onClick={() => handleLitersChange(Math.round(liters + 10))}>
                +10L
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`complete-button fuel ${isLogged ? "completed" : ""}`}
          onClick={handleSubmit}
          disabled={isPending || isLogged}
        >
          {isLogged ? (
            <>
              <Icon name="check" /> Fuel expense recorded!
            </>
          ) : isPending ? (
            <>Recording fuel expense...</>
          ) : (
            <>
              <Icon name="fuel" size={17} /> Record Fuel Expense
            </>
          )}
        </button>
      </section>
    </div>
  )
}
