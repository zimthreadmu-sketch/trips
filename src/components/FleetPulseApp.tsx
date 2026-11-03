"use client"

import { useState, useEffect } from "react"
import { DriverApp } from "./DriverApp"
import { AdminDashboard } from "./AdminDashboard"
import DriverOnboardingModal from "./DriverOnboardingModal"
import type { Location, Driver, Trip, FuelLog, LedgerEntry, DashboardMetrics } from "@/lib/db"

interface FleetPulseAppProps {
  initialLocations: Location[]
  initialDrivers: Driver[]
  initialActiveDriver?: Driver | null
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
  // DEFAULT IS STRICTLY DRIVER VIEW — NEVER ADMIN ON HOME PAGE
  const [currentView, setCurrentView] = useState<"driver" | "admin">("driver")
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  const [drivers, setDrivers] = useState<Driver[]>(
    (initialDrivers || []).filter((d) => d && d.id !== "driver_mru_01" && !d.name.toLowerCase().includes("jean-luc"))
  )
  const [activeDriver, setActiveDriver] = useState<Driver>(
    initialActiveDriver && initialActiveDriver.id !== "driver_mru_01" && !initialActiveDriver.name.toLowerCase().includes("jean-luc")
      ? initialActiveDriver
      : (initialDrivers && initialDrivers[0]) || {
          id: "",
          name: "Driver",
          phone: "",
          avatar_color: "#10B981",
          initials: "DR",
          vehicle: "Toyota HiAce (4821 DC 18)",
          status: "ACTIVE",
          created_at: new Date().toISOString(),
        }
  )
  const [trips, setTrips] = useState<Trip[]>(initialRecentTrips)
  const [todayTrips, setTodayTrips] = useState<Trip[]>(initialTodayTrips)
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(initialFuelLogs)
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(initialLedgerEntries)
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics)
  const [regularRate, setRegularRate] = useState(150)
  const [multiplier, setMultiplier] = useState(1.8)

  // First-time onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false)

  // On first startup: check if device knows the driver in phone cache
  useEffect(() => {
    try {
      const isBound = localStorage.getItem("fleetpulse_driver_bound")
      const savedDriverId = localStorage.getItem("fleetpulse_active_driver_id")

      // Clear any legacy test driver from local storage
      if (savedDriverId === "driver_mru_01") {
        localStorage.removeItem("fleetpulse_driver_bound")
        localStorage.removeItem("fleetpulse_active_driver_id")
        setShowOnboarding(true)
        return
      }

      if (!isBound || !savedDriverId) {
        setShowOnboarding(true)
      } else {
        const found = drivers.find((d) => d.id === savedDriverId)
        if (found) {
          setActiveDriver(found)
        } else if (drivers.length > 0) {
          setActiveDriver(drivers[0])
        } else {
          setShowOnboarding(true)
        }
      }
    } catch {
      // safe fallback
    }
  }, [drivers])

  const handleOnboardingComplete = (driver: Driver) => {
    setActiveDriver(driver)
    setShowOnboarding(false)
    try {
      localStorage.setItem("fleetpulse_driver_bound", "true")
      localStorage.setItem("fleetpulse_active_driver_id", driver.id)
    } catch {
      // safe ignore
    }
  }

  const handleSelectDriver = (drv: Driver) => {
    setActiveDriver(drv)
    try {
      localStorage.setItem("fleetpulse_driver_bound", "true")
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
      localStorage.setItem("fleetpulse_driver_bound", "true")
      localStorage.setItem("fleetpulse_active_driver_id", newDriver.id)
    } catch {
      // safe ignore
    }
  }

  // Handle new trip logged (optimistic live update)
  const handleTripLogged = (newTrip: Trip) => {
    setTrips((prev) => [newTrip, ...prev])
    setTodayTrips((prev) => [newTrip, ...prev])

    // Prepend to ledger entries with Rs currency
    const newLedgerEntry: LedgerEntry = {
      id: newTrip.id,
      type: "trip",
      time: "Just now",
      title: `${newTrip.origin_name} → ${newTrip.destination_name}`,
      detail: newTrip.trip_type === "VIP" ? "VIP Trip" : "Regular trip",
      amount: `Rs ${Number(newTrip.fare).toFixed(2)}`,
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

    // Prepend to ledger entries with Rs currency
    const newLedgerEntry: LedgerEntry = {
      id: newFuel.id,
      type: "fuel",
      time: "Just now",
      title: newFuel.station_name,
      detail: `Fuel refill · ${newFuel.liters}L`,
      amount: `−Rs ${Number(newFuel.cost_amount).toFixed(2)}`,
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
      {/* 1. First-time Startup Onboarding Gate */}
      {showOnboarding && (
        <DriverOnboardingModal
          drivers={drivers}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* 2. Driver App View (DEFAULT ON HOME PAGE) */}
      {currentView === "driver" && (
        <DriverApp
          desktopPreview={true}
          onAdminView={() => setCurrentView("admin")}
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
      )}

      {/* 3. Admin Dashboard View (ACCESSIBLE ONLY ON DEMAND VIA TOP-RIGHT ADMIN BUTTON) */}
      {currentView === "admin" && (
        <AdminDashboard
          onDriverView={() => setCurrentView("driver")}
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
