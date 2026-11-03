"use client"

import { useState, useTransition } from "react"
import { Icon } from "./Icon"
import { logFuel } from "@/app/actions"
import type { FuelLog, Driver } from "@/lib/db"

interface LogFuelDrawerProps {
  isOpen: boolean
  onClose: () => void
  activeDriver?: Driver
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
  activeDriver,
  onFuelLogged,
}: LogFuelDrawerProps) {
  const [station, setStation] = useState(STATIONS[0])
  const [costAmount, setCostAmount] = useState<number | string>(350)
  const [liters, setLiters] = useState<number | string>(15.4)
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

    const numericCost = Number(costAmount)
    const numericLiters = Number(liters)

    if (isNaN(numericCost) || numericCost <= 0) {
      setError("Please enter a valid fuel cost amount.")
      return
    }

    if (isNaN(numericLiters) || numericLiters <= 0) {
      setError("Please enter liters fueled.")
      return
    }

    const tempFuelId = `fuel_${Date.now()}`
    const loggedAt = new Date().toISOString()
    const driverId = activeDriver?.id || "driver_thabo_01"
    const driverName = activeDriver?.name || "Thabo Mokoena"
    const vehicle = activeDriver?.vehicle || "Toyota Quantum (GP 482-901)"

    const optimisticFuel: FuelLog = {
      id: tempFuelId,
      driver_id: driverId,
      driver_name: driverName,
      vehicle: vehicle,
      station_name: station,
      cost_amount: numericCost,
      liters: numericLiters,
      odometer: odometer ? Number(odometer) : null,
      logged_at: loggedAt,
    }

    // Trigger optimistic UI
    setIsLogged(true)
    onFuelLogged(optimisticFuel)

    startTransition(async () => {
      try {
        const result = await logFuel({
          driverId,
          driverName,
          vehicle,
          stationName: station,
          costAmount: numericCost,
          liters: numericLiters,
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
        }, 750)
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to submit fuel expense")
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
        className="fuel-drawer"
        aria-modal="true"
        role="dialog"
        aria-label="Log fuel refill"
      >
        <div className="sheet-grabber" />
        <div className="sheet-title">
          <div>
            <span className="eyebrow">REFUEL EXPENSE</span>
            <h2>Log Fuel Entry</h2>
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

        <div className="hero-cost-card">
          <span>TOTAL COST (ZAR)</span>
          <div className="cost-input-row">
            <span className="currency">R</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <small>Recorded at {station.split(" ")[0]} station</small>
        </div>

        <div className="quick-presets">
          {[200, 350, 500, 750, 1000].map((preset) => (
            <button
              type="button"
              key={preset}
              onClick={() => {
                setCostAmount(preset)
                setLiters(Number((preset / 22.75).toFixed(1)))
              }}
              className={Number(costAmount) === preset ? "active" : ""}
            >
              R{preset}
            </button>
          ))}
        </div>

        <div className="fuel-form-grid">
          <label className="text-field">
            <span>Volume (Liters)</span>
            <div className="unit-input">
              <input
                type="number"
                step="0.1"
                value={liters}
                onChange={(e) => handleLitersChange(parseFloat(e.target.value) || 0)}
              />
              <span>L</span>
            </div>
          </label>

          <label className="text-field">
            <span>Odometer reading (km)</span>
            <input
              type="text"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              placeholder="e.g. 184520"
            />
          </label>
        </div>

        <label className="text-field">
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

        <div className="quick-spots">
          <span>FREQUENT STATIONS</span>
          <div>
            {QUICK_STATIONS.map((brand) => (
              <button
                type="button"
                key={brand}
                onClick={() => handleQuickStation(brand)}
                className={station.toLowerCase().includes(brand.toLowerCase()) ? "active" : ""}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className={`complete-button fuel-submit ${isLogged ? "completed" : ""}`}
          onClick={handleSubmit}
          disabled={isPending || isLogged}
        >
          {isLogged ? (
            <>
              <Icon name="check" /> Fuel logged successfully
            </>
          ) : isPending ? (
            <>Recording fuel...</>
          ) : (
            <>
              <Icon name="fuel" /> Record Fuel Expense
            </>
          )}
        </button>
      </section>
    </div>
  )
}
export default LogFuelDrawer
