"use client"

import { useState, useEffect } from "react"
import { DriverApp } from "./DriverApp"
import { AdminDashboard } from "./AdminDashboard"
import type { Location, Driver, Trip, FuelLog, LedgerEntry, DashboardMetrics } from "@/lib/db"

interface FleetPulseAppProps {
  initialLocations: Location[]
  initialDrivers: Driver[]
  initialActiveDriver: Driver
  initialTodayTrips: Trip[]
  initialRecentTrips: Trip[]
  initialFuelLogs: FuelLog[]
  initialLedgerEntries: LedgerEntry[]
  initialMetrics: DashboardMetrics
  dbMode: "neon" | "mock"
}

export function FleetPulseApp({
  initialLocations,
  initialDrivers,
  initialActiveDriver,
  initialTodayTrips,
  initialRecentTrips,
  initialFuelLogs,
  initialLedgerEntries,
  initialMetrics,
}: FleetPulseAppProps) {
  const [desktopView, setDesktopView] = useState<"admin" | "driver">("admin")
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  const [drivers, setDrivers] = useState<Driver[]>(
    initialDrivers && initialDrivers.length > 0 ? initialDrivers : [initialActiveDriver]
  )
  const [activeDriver, setActiveDriver] = useState<Driver>(initialActiveDriver)
  const [trips, setTrips] = useState<Trip[]>(initialRecentTrips)
  const [todayTrips, setTodayTrips] = useState<Trip[]>(initialTodayTrips)
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(initialFuelLogs)
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(initialLedgerEntries)
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics)
  const [regularRate, setRegularRate] = useState(60)
  const [multiplier, setMultiplier] = useState(1.8)

  // Hydrate active driver from localStorage
  useEffect(() => {
    try {
      const savedId = localStorage.getItem("fleetpulse_active_driver_id")
      if (savedId) {
        const found = drivers.find((d) => d.id === savedId)
        if (found) {
          setActiveDriver(found)
        }
      }
    } catch {
      // safe ignore localStorage errors
    }
  }, [drivers])

  const handleSelectDriver = (drv: Driver) => {
    setActiveDriver(drv)
    try {
      localStorage.setItem("fleetpulse_active_driver_id", drv.id)
    } catch {
      // safe ignore
    }
  }

  const handleUpdateDriver = (updated: Driver) => {
    setActiveDriver(updated)
    setDrivers((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
  }

  const handleAddDriver = (newDriver: Driver) => {
    setDrivers((prev) => [...prev, newDriver])
    setActiveDriver(newDriver)
    try {
      localStorage.setItem("fleetpulse_active_driver_id", newDriver.id)
    } catch {
      // safe ignore
    }
  }

  // Handle new trip logged (optimistic live update)
  const handleTripLogged = (newTrip: Trip) => {
    setTrips((prev) => [newTrip, ...prev])
    setTodayTrips((prev) => [newTrip, ...prev])

    // Prepend to ledger entries
    const newLedgerEntry: LedgerEntry = {
      id: newTrip.id,
      type: "trip",
      time: "Just now",
      title: `${newTrip.origin_name} → ${newTrip.destination_name}`,
      detail: newTrip.trip_type === "VIP" ? "VIP Trip" : "Regular trip",
      amount: `R ${Number(newTrip.fare).toFixed(2)}`,
      numericAmount: Number(newTrip.fare),
      tone: newTrip.trip_type === "VIP" ? "gold" : "green",
      status: newTrip.status,
      timestamp: newTrip.logged_at,
      driver_name: newTrip.driver_name || activeDriver.name,
      driver_initials: newTrip.driver_initials || activeDriver.initials,
      vehicle: newTrip.vehicle || activeDriver.vehicle,
    }
    setLedgerEntries((prev) => [newLedgerEntry, ...prev])

    // Update metrics dynamically
    setMetrics((prev) => {
      const grossRevenue = prev.grossRevenue + Number(newTrip.fare)
      const totalTrips = prev.totalTrips + 1
      const isVip = newTrip.trip_type === "VIP"
      const regularTrips = prev.regularTrips + (isVip ? 0 : 1)
      const vipTrips = prev.vipTrips + (isVip ? 1 : 0)
      const vipRatio = Math.round((vipTrips / totalTrips) * 100)
      const todayRevenue = prev.todayRevenue + Number(newTrip.fare)
      const netProfit = grossRevenue - prev.fuelExpense

      return {
        ...prev,
        grossRevenue,
        totalTrips,
        regularTrips,
        vipTrips,
        vipRatio,
        todayRevenue,
        netProfit,
      }
    })
  }

  // Handle new fuel logged (optimistic live update)
  const handleFuelLogged = (newFuel: FuelLog) => {
    setFuelLogs((prev) => [newFuel, ...prev])

    // Prepend to ledger entries
    const newLedgerEntry: LedgerEntry = {
      id: newFuel.id,
      type: "fuel",
      time: "Just now",
      title: newFuel.station_name,
      detail: `Fuel refill · ${newFuel.liters}L`,
      amount: `−R ${Number(newFuel.cost_amount).toFixed(2)}`,
      numericAmount: -Number(newFuel.cost_amount),
      tone: "red",
      timestamp: newFuel.logged_at,
      driver_name: newFuel.driver_name || activeDriver.name,
      vehicle: newFuel.vehicle || activeDriver.vehicle,
    }
    setLedgerEntries((prev) => [newLedgerEntry, ...prev])

    // Update metrics dynamically
    setMetrics((prev) => {
      const fuelExpense = prev.fuelExpense + Number(newFuel.cost_amount)
      const todayFuel = prev.todayFuel + Number(newFuel.cost_amount)
      const netProfit = prev.grossRevenue - fuelExpense

      return {
        ...prev,
        fuelExpense,
        todayFuel,
        netProfit,
      }
    })
  }

  // Handle location added
  const handleLocationAdded = (newLoc: Location) => {
    setLocations((prev) => {
      if (prev.some((l) => l.name.toLowerCase() === newLoc.name.toLowerCase())) {
        return prev
      }
      return [...prev, newLoc]
    })
  }

  return (
    <>
      {/* Driver App View */}
      <div
        className={
          desktopView === "admin"
            ? "mobile-shell"
            : "mobile-shell desktop-driver-preview"
        }
      >
        <DriverApp
          desktopPreview={desktopView === "driver"}
          onAdminView={() => setDesktopView("admin")}
          locations={locations}
          drivers={drivers}
          activeDriver={activeDriver}
          onSelectDriver={handleSelectDriver}
          onUpdateDriver={handleUpdateDriver}
          onAddDriver={handleAddDriver}
          onLocationAdded={handleLocationAdded}
          todayTrips={todayTrips}
          allTrips={trips}
          fuelLogs={fuelLogs}
          ledgerEntries={ledgerEntries}
          onTripLogged={handleTripLogged}
          onFuelLogged={handleFuelLogged}
          baseFare={regularRate}
          vipMultiplier={multiplier}
        />
      </div>

      {/* Admin Dashboard View */}
      {desktopView === "admin" && (
        <AdminDashboard
          onDriverView={() => setDesktopView("driver")}
          metrics={metrics}
          trips={trips}
          fuelLogs={fuelLogs}
          locations={locations}
          onLocationAdded={handleLocationAdded}
          regularRate={regularRate}
          setRegularRate={setRegularRate}
          multiplier={multiplier}
          setMultiplier={setMultiplier}
        />
      )}
    </>
  )
}
export default FleetPulseApp
