"use client"

import { useState, useEffect } from "react"
import { Icon } from "./Icon"
import { Logo } from "./Logo"
import { LogTripModal } from "./LogTripModal"
import { EditTripModal } from "./EditTripModal"
import { LogFuelDrawer } from "./LogFuelDrawer"
import DriverSwitcherModal from "./DriverSwitcherModal"
import { toggleTripPaymentStatus } from "@/app/actions"
import type { Location, Driver, Trip, FuelLog, LedgerEntry } from "@/lib/db"

interface DriverAppProps {
  desktopPreview?: boolean
  onAdminView?: () => void
  locations: Location[]
  drivers: Driver[]
  activeDriver: Driver
  onSelectDriver: (driver: Driver) => void
  onUpdateDriver: (driver: Driver) => void
  onAddDriver: (driver: Driver) => void
  onLocationAdded?: (location: Location) => void
  todayTrips: Trip[]
  allTrips: Trip[]
  fuelLogs: FuelLog[]
  ledgerEntries: LedgerEntry[]
  onTripLogged: (trip: Trip) => void
  onTripUpdated?: (trip: Trip) => void
  onFuelLogged: (fuel: FuelLog) => void
  baseFare?: number
  vipMultiplier?: number
}

// ==========================================
// 1. TRIPS & FUEL LOGS TAB (JOURNEY & EXPENSE HISTORY)
// ==========================================
function DriverTripsTab({
  trips,
  fuelLogs,
  initialSubView = "trips",
  onEditTrip,
  onTogglePayment,
}: {
  trips: Trip[]
  fuelLogs: FuelLog[]
  initialSubView?: "trips" | "fuel"
  onEditTrip: (trip: Trip) => void
  onTogglePayment: (trip: Trip, e?: React.MouseEvent) => void
}) {
  const [subView, setSubView] = useState<"trips" | "fuel">(initialSubView)
  const [filter, setFilter] = useState<"All" | "Paid" | "Pending" | "VIP">("All")

  useEffect(() => {
    if (initialSubView) setSubView(initialSubView)
  }, [initialSubView])

  const visibleTrips = trips.filter((trip) => {
    if (filter === "All") return true
    if (filter === "VIP") return trip.trip_type === "VIP"
    const status = trip.payment_status || (trip.status === "Pending" ? "Pending" : "Paid")
    return status === filter
  })

  const vipCount = trips.filter((t) => t.trip_type === "VIP").length
  const pendingCount = trips.filter(
    (t) => (t.payment_status || (t.status === "Pending" ? "Pending" : "Paid")) === "Pending"
  ).length

  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + Number(f.cost_amount || 0), 0)
  const totalLiters = fuelLogs.reduce((sum, f) => sum + Number(f.liters || 0), 0)

  return (
    <div className="driver-tab-screen">
      <div className="tab-title-row">
        <div>
          <span className="eyebrow">{subView === "trips" ? "JOURNEY HISTORY" : "EXPENSE AUDIT"}</span>
          <h2>{subView === "trips" ? "My trips" : "Fuel logs"}</h2>
        </div>
      </div>

      {/* Segmented View Switcher: Trips vs Fuel Logs */}
      <div className="subview-tabs">
        <button
          type="button"
          className={subView === "trips" ? "active" : ""}
          onClick={() => setSubView("trips")}
        >
          <Icon name="route" size={14} /> Trips ({trips.length})
        </button>
        <button
          type="button"
          className={`fuel-tab ${subView === "fuel" ? "active" : ""}`}
          onClick={() => setSubView("fuel")}
        >
          <Icon name="fuel" size={14} /> Fuel Logs ({fuelLogs.length})
        </button>
      </div>

      {subView === "trips" ? (
        <>
          <div className="trip-summary-card">
            <div>
              <span>TOTAL LOGGED TRIPS</span>
              <strong>{trips.length}</strong>
              <small>
                <b>{vipCount}</b> VIP journeys ·{" "}
                <b style={{ color: pendingCount > 0 ? "#f5ad36" : "#20d59b" }}>{pendingCount}</b> pending
              </small>
            </div>
            <div className="trip-ring">
              <div>
                <strong>{vipCount}</strong>
                <span>VIP</span>
              </div>
            </div>
          </div>

          <div className="tab-filter">
            {(["All", "Paid", "Pending", "VIP"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item === "VIP" && <Icon name="sparkles" size={12} />}
                {item === "Paid" && <Icon name="check" size={12} />}
                {item === "Pending" && <Icon name="clock" size={12} />}
                {item}
                {item === "Pending" && pendingCount > 0 && (
                  <span
                    style={{
                      marginLeft: "4px",
                      padding: "1px 5px",
                      borderRadius: "99px",
                      background: "#f5ad36",
                      color: "#1c1203",
                      fontSize: "9px",
                      fontWeight: "800",
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="trip-history-list">
            {visibleTrips.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "#6d7586", fontSize: "13px" }}>
                No trips found in this filter view.
              </div>
            ) : (
              visibleTrips.map((trip) => {
                const isVip = trip.trip_type === "VIP"
                const isPaid =
                  (trip.payment_status || (trip.status === "Pending" ? "Pending" : "Paid")) === "Paid"

                return (
                  <article
                    className="trip-history-item"
                    key={trip.id}
                    onClick={() => onEditTrip(trip)}
                    title="Tap to edit trip details"
                  >
                    <div className={`trip-history-icon ${trip.trip_type.toLowerCase()}`}>
                      <Icon name={isVip ? "sparkles" : "route"} size={17} />
                    </div>
                    <div className="trip-history-copy">
                      <span className="trip-history-time">
                        {new Date(trip.logged_at).toLocaleTimeString("en-ZA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <strong>
                        {trip.origin_name} <Icon name="arrow" size={13} /> {trip.destination_name}
                      </strong>
                      <small>
                        <span className={trip.trip_type.toLowerCase()}>{trip.trip_type}</span>
                        {trip.payment_method} · {trip.driver_name || "Driver"}
                      </small>
                    </div>
                    <div className="trip-history-fare">
                      <strong>Rs {Number(trip.fare).toFixed(2)}</strong>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <button
                          type="button"
                          className={`payment-badge ${isPaid ? "paid" : "pending"}`}
                          onClick={(e) => onTogglePayment(trip, e)}
                          title={isPaid ? "Tap to mark as Pending" : "Tap to mark as Paid"}
                        >
                          <Icon name={isPaid ? "check" : "clock"} size={10} />
                          {isPaid ? "Paid" : "Pending"}
                        </button>
                        <button
                          type="button"
                          className="trip-edit-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditTrip(trip)
                          }}
                          title="Edit trip"
                        >
                          <Icon name="edit" size={11} /> Edit
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </>
      ) : (
        /* FUEL LOGS VIEW */
        <>
          <div className="trip-summary-card" style={{ background: "linear-gradient(135deg, #1f1416 0%, #11141c 100%)", borderColor: "#502126" }}>
            <div>
              <span style={{ color: "#ff858b" }}>TOTAL FUEL EXPENSES</span>
              <strong style={{ color: "#ff777c" }}>Rs {totalFuelCost.toLocaleString()}</strong>
              <small>
                <b style={{ color: "#f5ad36" }}>{totalLiters.toFixed(1)}L</b> pumped · {fuelLogs.length} refills
              </small>
            </div>
            <div className="fuel-history-icon" style={{ width: "48px", height: "48px", borderRadius: "14px" }}>
              <Icon name="fuel" size={24} />
            </div>
          </div>

          <div className="fuel-history-list">
            {fuelLogs.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "#6d7586", fontSize: "13px" }}>
                No fuel refill logs recorded yet.
              </div>
            ) : (
              fuelLogs.map((fuel) => {
                const fuelDate = new Date(fuel.logged_at)
                const dateStr = fuelDate.toLocaleDateString("en-MU", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })
                const timeStr = fuelDate.toLocaleTimeString("en-ZA", {
                  hour: "2-digit",
                  minute: "2-digit",
                })

                return (
                  <article className="fuel-history-item" key={fuel.id}>
                    <div className="fuel-history-icon">
                      <Icon name="fuel" size={18} />
                    </div>
                    <div className="fuel-history-copy">
                      <span className="fuel-history-time">
                        {dateStr} · {timeStr}
                      </span>
                      <strong>{fuel.station_name}</strong>
                      <div className="fuel-history-meta">
                        <span className="fuel-driver-tag">
                          <Icon name="users" size={12} /> Logged by: {fuel.driver_name || "Driver"}
                        </span>
                        <span>
                          Vehicle: {fuel.vehicle || "Nissan March"}
                          {fuel.odometer ? ` · Odometer: ${fuel.odometer.toLocaleString()} km` : ""}
                        </span>
                      </div>
                    </div>
                    <div className="fuel-history-fare">
                      <strong>−Rs {Number(fuel.cost_amount).toFixed(2)}</strong>
                      <small>{Number(fuel.liters).toFixed(1)}L</small>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ==========================================
// 2. INSIGHTS TAB (PERFORMANCE & REVENUE)
// ==========================================
function DriverInsightsTab({ trips, fuelLogs }: { trips: Trip[]; fuelLogs: FuelLog[] }) {
  const [range, setRange] = useState<"Day" | "Week" | "Month">("Week")
  const totalRevenue = trips.reduce((sum, t) => sum + Number(t.fare || 0), 0)
  const totalFuel = fuelLogs.reduce((sum, f) => sum + Number(f.cost_amount || 0), 0)
  const netEarnings = totalRevenue - totalFuel

  return (
    <div className="driver-tab-screen">
      <div className="tab-title-row">
        <div>
          <span className="eyebrow">DRIVER ANALYTICS</span>
          <h2>Shift Insights</h2>
        </div>
        <div className="range-pills">
          {(["Day", "Week", "Month"] as const).map((item) => (
            <button
              type="button"
              key={item}
              className={range === item ? "active" : ""}
              onClick={() => setRange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="insight-hero-card">
        <span>NET EARNINGS</span>
        <strong>Rs {netEarnings.toLocaleString()}</strong>
        <div className="insight-split">
          <div>
            <small>Gross revenue</small>
            <b>Rs {totalRevenue.toLocaleString()}</b>
          </div>
          <div>
            <small>Fuel expense</small>
            <b style={{ color: "#ff777c" }}>−Rs {totalFuel.toLocaleString()}</b>
          </div>
        </div>
      </div>

      <div className="stats-2col">
        <div className="mini-stat-card">
          <span>COMPLETED TRIPS</span>
          <strong>{trips.length}</strong>
          <small>
            <b style={{ color: "#20d59b" }}>{trips.filter((t) => t.trip_type === "VIP").length}</b> VIP
          </small>
        </div>
        <div className="mini-stat-card">
          <span>FUEL REFILLS</span>
          <strong>{fuelLogs.length}</strong>
          <small>
            <b style={{ color: "#f5ad36" }}>
              {fuelLogs.reduce((acc, f) => acc + Number(f.liters || 0), 0).toFixed(1)}L
            </b> pumped
          </small>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 3. SETTINGS TAB (ACCOUNT & VEHICLE)
// ==========================================
function DriverSettingsTab({
  driver,
  onDuty,
  setOnDuty,
  onAdminView,
  onOpenDriverSwitcher,
}: {
  driver?: Driver | null
  onDuty: boolean
  setOnDuty: (duty: boolean) => void
  onAdminView?: () => void
  onOpenDriverSwitcher: () => void
}) {
  return (
    <div className="driver-tab-screen">
      <div className="tab-title-row">
        <div>
          <span className="eyebrow">DRIVER PROFILE</span>
          <h2>Settings</h2>
        </div>
      </div>

      <div
        className="profile-card"
        onClick={onOpenDriverSwitcher}
        style={{ cursor: "pointer" }}
        title="Tap to switch driver or change vehicle"
      >
        <span
          className="profile-avatar"
          style={{ background: driver?.avatar_color || "#10B981", color: "#03261d" }}
        >
          {driver?.initials || "DR"}
          <i />
        </span>
        <div>
          <strong>{driver?.name || "Driver"}</strong>
          <span>Assigned: {driver?.vehicle || "Toyota HiAce"}</span>
          <small>
            <Icon name="check" size={11} /> Tap to switch profile or edit vehicle
          </small>
        </div>
        <Icon name="chevron" size={16} />
      </div>

      <div className="settings-group">
        <span className="settings-label">SHIFT CONTROLS</span>
        <div className="settings-list">
          <div className="setting-row">
            <span className="setting-icon green">
              <Icon name="users" size={17} />
            </span>
            <div>
              <strong>Duty Status</strong>
              <small>{onDuty ? "You are currently On Duty" : "You are currently Off Duty"}</small>
            </div>
            <button
              type="button"
              className={`mini-toggle ${onDuty ? "active" : ""}`}
              onClick={() => setOnDuty(!onDuty)}
              aria-label="Toggle duty status"
            >
              <i />
            </button>
          </div>

          <div
            className="setting-row"
            onClick={onOpenDriverSwitcher}
            style={{ cursor: "pointer" }}
          >
            <span className="setting-icon green">
              <Icon name="car" size={17} />
            </span>
            <div>
              <strong>{driver?.vehicle || "Toyota HiAce (4821 DC 18)"}</strong>
              <small>Tap to change assigned vehicle</small>
            </div>
            <Icon name="chevron" size={15} />
          </div>
        </div>
      </div>

      {onAdminView && (
        <div className="settings-group">
          <span className="settings-label">MANAGEMENT PORTAL</span>
          <div className="settings-list">
            <div
              className="setting-row"
              onClick={onAdminView}
              style={{ cursor: "pointer" }}
            >
              <span className="setting-icon">
                <Icon name="trend" size={17} />
              </span>
              <div>
                <strong>Admin Dashboard</strong>
                <small>View audit table, fleet metrics & reports</small>
              </div>
              <Icon name="chevron" size={15} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// MAIN DRIVER APP COMPONENT
// ==========================================
export function DriverApp({
  desktopPreview = false,
  onAdminView,
  locations,
  drivers,
  activeDriver,
  onSelectDriver,
  onUpdateDriver,
  onAddDriver,
  onLocationAdded,
  todayTrips,
  allTrips,
  fuelLogs,
  ledgerEntries,
  onTripLogged,
  onTripUpdated,
  onFuelLogged,
  baseFare = 60,
  vipMultiplier = 1.8,
}: DriverAppProps) {
  const [activeTab, setActiveTab] = useState<"shift" | "trips" | "insights" | "settings">("shift")
  const [tripsTabSubView, setTripsTabSubView] = useState<"trips" | "fuel">("trips")
  const [onDuty, setOnDuty] = useState(true)
  const [tripSheetOpen, setTripSheetOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [fuelDrawerOpen, setFuelDrawerOpen] = useState(false)
  const [driverSwitcherOpen, setDriverSwitcherOpen] = useState(false)

  const handleTogglePaymentStatus = async (trip: Trip, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const currentStatus = trip.payment_status || (trip.status === "Pending" ? "Pending" : "Paid")
    const nextStatus = currentStatus === "Paid" ? "Pending" : "Paid"
    const updatedTrip: Trip = {
      ...trip,
      payment_status: nextStatus,
      status: nextStatus === "Pending" ? "Pending" : "Approved",
    }
    if (onTripUpdated) {
      onTripUpdated(updatedTrip)
    }
    try {
      await toggleTripPaymentStatus(trip.id, nextStatus)
    } catch (err) {
      console.error("Failed to toggle payment status:", err)
    }
  }

  const today = new Date().toDateString()
  const todayTripsList = allTrips.filter(
    (t) => new Date(t.logged_at).toDateString() === today
  )
  const todayFuelList = fuelLogs.filter(
    (f) => new Date(f.logged_at).toDateString() === today
  )

  const todayRev = todayTripsList.reduce((acc, t) => acc + Number(t.fare || 0), 0)
  const todayFuel = todayFuelList.reduce((acc, f) => acc + Number(f.cost_amount || 0), 0)
  const todayNet = todayRev - todayFuel

  return (
    <main className={`mobile-shell ${desktopPreview ? "desktop-driver-preview" : ""}`}>
      {desktopPreview && (
        <aside className="driver-preview-intro">
          {onAdminView && (
            <button
              type="button"
              className="back-to-admin"
              onClick={onAdminView}
              aria-label="Back to Admin Dashboard"
            >
              <Icon name="arrow" size={16} /> Back to admin dashboard
            </button>
          )}
          <Logo />
          <h1>Driver Cockpit</h1>
          <p>
            Field-ready mobile interface built for single-hand operation, quick trip logging, and instant offline ledger sync.
          </p>
          <div className="preview-feature-list">
            <span>
              <i>
                <Icon name="check" size={14} />
              </i>{" "}
              Lightning fast trip & fuel logging
            </span>
            <span>
              <i>
                <Icon name="check" size={14} />
              </i>{" "}
              Live Mauritius fare calculating
            </span>
            <span>
              <i>
                <Icon name="check" size={14} />
              </i>{" "}
              One-tap driver and vehicle switcher
            </span>
          </div>
        </aside>
      )}

      <section className="driver-app">
        <header className="driver-header">
          <div className="driver-brand-row">
            <Logo compact />
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                type="button"
                className={`duty-toggle ${onDuty ? "active" : ""}`}
                onClick={() => setOnDuty(!onDuty)}
                aria-pressed={onDuty}
                aria-label={`Toggle duty status. Currently ${onDuty ? "On Duty" : "Off Duty"}`}
              >
                <span className="live-dot" />
                <span>{onDuty ? "On Duty" : "Off Duty"}</span>
              </button>
              {onAdminView && (
                <button
                  type="button"
                  onClick={onAdminView}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    height: "32px",
                    padding: "0 11px",
                    borderRadius: "99px",
                    border: "1px solid #285b49",
                    background: "#102920",
                    color: "#9ff0d2",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  aria-label="Switch to Admin Portal"
                >
                  <Icon name="trend" size={13} /> Admin
                </button>
              )}
            </div>
          </div>

          {/* GREETING ROW — STRICTLY "Morning, Driver" */}
          <div className="greeting-row">
            <div>
              <span className="eyebrow">
                {activeTab === "shift"
                  ? new Date().toLocaleDateString("en-MU", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }).toUpperCase()
                  : "FLEETPULSE DRIVER"}
              </span>
              <h1>
                {activeTab === "shift"
                  ? "Morning, Driver"
                  : activeTab === "trips"
                    ? (tripsTabSubView === "trips" ? "Trip history" : "Fuel logs")
                    : activeTab === "insights"
                      ? "Performance"
                      : "Account settings"}
              </h1>
            </div>

            {/* Profile Avatar — opens Driver Switcher */}
            <button
              type="button"
              className="avatar-button"
              aria-label="Select Driver Profile"
              onClick={() => setDriverSwitcherOpen(true)}
              style={{
                background: activeDriver?.avatar_color || "#10B981",
                color: "#ffffff",
                cursor: "pointer",
              }}
              title="Click to switch driver or change vehicle"
            >
              {activeDriver?.initials || "DR"}
            </button>
          </div>

          {/* Assigned Vehicle Badge — clickable to change vehicle */}
          <button
            type="button"
            className="vehicle-badge"
            onClick={() => setDriverSwitcherOpen(true)}
            title="Click to change vehicle"
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              padding: 0,
              color: "inherit",
              font: "inherit",
            }}
          >
            <Icon name="car" size={15} /> {activeDriver?.vehicle || "Toyota HiAce (4821 DC 18)"}
            <span style={{ fontSize: "10px", color: "#20d59b", marginLeft: "4px" }}>• Change</span>
          </button>
        </header>

        <section className={`driver-content ${activeTab !== "shift" ? "tab-content" : ""}`}>
          {/* TAB 1: SHIFT VIEW */}
          {activeTab === "shift" && (
            <>
              <div className="today-card">
                <div className="today-card-head">
                  <span>TODAY’S SHIFT ACTIVITY</span>
                  <span className="trend-label">
                    <Icon name="trend" size={14} /> Live
                  </span>
                </div>
                <div className="mobile-metrics">
                  <div>
                    <span>Gross</span>
                    <strong>Rs {todayRev.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span>Fuel</span>
                    <strong className="danger">
                      {todayFuel > 0 ? `−Rs ${todayFuel.toLocaleString()}` : "Rs 0"}
                    </strong>
                  </div>
                  <div>
                    <span>Net</span>
                    <strong className="success">Rs {todayNet.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div className="action-deck">
                <button
                  type="button"
                  className="log-trip-button"
                  onClick={() => setTripSheetOpen(true)}
                  aria-label="Log new journey trip"
                >
                  <span className="action-icon">
                    <Icon name="plus" size={23} />
                  </span>
                  <span>
                    <small>NEW JOURNEY</small>Log Trip
                  </span>
                  <Icon name="arrow" size={22} />
                </button>
                <button
                  type="button"
                  className="log-fuel-button"
                  onClick={() => setFuelDrawerOpen(true)}
                  aria-label="Log fuel expense"
                >
                  <span className="fuel-icon">
                    <Icon name="fuel" size={20} />
                  </span>
                  <span>
                    <small>EXPENSE</small>Log Fuel
                  </span>
                  <Icon name="chevron" size={17} />
                </button>
              </div>

              <div className="section-heading">
                <div>
                  <span className="eyebrow">RECENT TRIPS</span>
                  <h2>Recent trips</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("trips")}
                  aria-label="View all trips"
                >
                  View all
                </button>
              </div>

              <div className="shift-feed">
                {ledgerEntries.filter((item) => item.type === "trip").length === 0 ? (
                  <div style={{ padding: "36px 16px", textAlign: "center", color: "#6d7586", fontSize: "13px" }}>
                    <p style={{ margin: "0 0 6px 0", color: "#a5acba" }}>No trips logged yet today.</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#626978" }}>
                      Tap <strong style={{ color: "#20d59b" }}>+ Log Trip</strong> to record your first journey.
                    </p>
                  </div>
                ) : (
                  ledgerEntries
                    .filter((item) => item.type === "trip")
                    .slice(0, 5)
                    .map((item) => {
                      const associatedTrip = allTrips.find((t) => t.id === item.id)
                      const isPaid = associatedTrip
                        ? (associatedTrip.payment_status ||
                            (associatedTrip.status === "Pending" ? "Pending" : "Paid")) === "Paid"
                        : true

                      return (
                        <article
                          className="shift-item"
                          key={item.id}
                          style={{ cursor: "default" }}
                        >
                          <div className={`log-icon ${item.tone}`}>
                            <Icon
                              name={item.tone === "gold" ? "sparkles" : "route"}
                              size={18}
                            />
                          </div>
                          <div className="log-copy">
                            <div className="log-title">
                              <strong>{item.title}</strong>
                              <time>{item.time}</time>
                            </div>
                            <div className="log-meta">
                              <span className={`tag ${item.tone}`}>
                                {item.detail}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span
                                  className={`payment-badge ${isPaid ? "paid" : "pending"}`}
                                  style={{ cursor: "default", userSelect: "none" }}
                                >
                                  <Icon name={isPaid ? "check" : "clock"} size={10} />
                                  {isPaid ? "Paid" : "Pending"}
                                </span>
                                <b className={item.tone}>{item.amount}</b>
                              </div>
                            </div>
                          </div>
                        </article>
                      )
                    })
                )}
              </div>

              {/* DEDICATED FUEL REFILLS LOG SECTION (TIME & PERSON WHO LOGGED THEM) */}
              <div className="section-heading" style={{ marginTop: "24px" }}>
                <div>
                  <span className="eyebrow">EXPENSE AUDIT</span>
                  <h2>Recent fuel logs</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTripsTabSubView("fuel")
                    setActiveTab("trips")
                  }}
                  aria-label="View all fuel logs"
                >
                  View all ({fuelLogs.length})
                </button>
              </div>

              <div className="shift-feed">
                {fuelLogs.length === 0 ? (
                  <div style={{ padding: "28px 16px", textAlign: "center", color: "#6d7586", fontSize: "13px" }}>
                    <p style={{ margin: "0 0 6px 0", color: "#a5acba" }}>No fuel refills logged yet.</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#626978" }}>
                      Tap <strong style={{ color: "#f5ad36" }}>⛽ Log Fuel</strong> to record station refills.
                    </p>
                  </div>
                ) : (
                  fuelLogs.slice(0, 5).map((fuel) => {
                    const fuelDate = new Date(fuel.logged_at)
                    const timeStr = fuelDate.toLocaleTimeString("en-ZA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    const dateStr = fuelDate.toLocaleDateString("en-MU", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })

                    return (
                      <article className="shift-item" key={fuel.id} style={{ cursor: "default" }}>
                        <div className="log-icon red">
                          <Icon name="fuel" size={18} />
                        </div>
                        <div className="log-copy">
                          <div className="log-title">
                            <strong>{fuel.station_name}</strong>
                            <time>{dateStr} · {timeStr}</time>
                          </div>
                          <div className="log-meta">
                            <span className="tag red">
                              Refill · {Number(fuel.liters).toFixed(1)}L
                            </span>
                            <b className="red">−Rs {Number(fuel.cost_amount).toFixed(2)}</b>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              marginTop: "5px",
                              fontSize: "11px",
                              color: "#7e8899",
                            }}
                          >
                            <span style={{ color: "#20d59b", fontWeight: 700 }}>
                              <Icon name="users" size={11} /> Logged by: {fuel.driver_name || activeDriver.name}
                            </span>
                            <span>· {fuel.vehicle || activeDriver.vehicle}</span>
                            {fuel.odometer ? <span>· {fuel.odometer.toLocaleString()} km</span> : null}
                          </div>
                        </div>
                      </article>
                    )
                  })
                )}
              </div>
            </>
          )}

          {/* TAB 2: TRIPS & FUEL VIEW */}
          {activeTab === "trips" && (
            <DriverTripsTab
              trips={allTrips}
              fuelLogs={fuelLogs}
              initialSubView={tripsTabSubView}
              onEditTrip={(trip) => setEditingTrip(trip)}
              onTogglePayment={handleTogglePaymentStatus}
            />
          )}

          {/* TAB 3: INSIGHTS VIEW */}
          {activeTab === "insights" && (
            <DriverInsightsTab trips={allTrips} fuelLogs={fuelLogs} />
          )}

          {/* TAB 4: SETTINGS VIEW */}
          {activeTab === "settings" && (
            <DriverSettingsTab
              driver={activeDriver}
              onDuty={onDuty}
              setOnDuty={setOnDuty}
              onAdminView={onAdminView}
              onOpenDriverSwitcher={() => setDriverSwitcherOpen(true)}
            />
          )}
        </section>

        {/* BOTTOM NAVIGATION BAR */}
        <nav className="mobile-nav" aria-label="Main driver navigation">
          <button
            type="button"
            className={activeTab === "shift" ? "active" : ""}
            onClick={() => setActiveTab("shift")}
            aria-label="Shift dashboard tab"
          >
            <Icon name="car" />
            <span>Shift</span>
          </button>
          <button
            type="button"
            className={activeTab === "trips" ? "active" : ""}
            onClick={() => setActiveTab("trips")}
            aria-label="Trips history tab"
          >
            <Icon name="route" />
            <span>Trips</span>
          </button>
          <button
            type="button"
            className={activeTab === "insights" ? "active" : ""}
            onClick={() => setActiveTab("insights")}
            aria-label="Insights tab"
          >
            <Icon name="trend" />
            <span>Insights</span>
          </button>
          <button
            type="button"
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
            aria-label="Settings tab"
          >
            <Icon name="settings" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Log Trip Modal (with direct fare entry and on-the-fly location adding) */}
        <LogTripModal
          isOpen={tripSheetOpen}
          onClose={() => setTripSheetOpen(false)}
          locations={locations}
          activeDriver={activeDriver}
          onTripLogged={onTripLogged}
          onLocationAdded={onLocationAdded}
          baseFare={baseFare}
          vipMultiplier={vipMultiplier}
        />

        {/* Edit Trip Modal (editable even after the trip) */}
        {editingTrip && (
          <EditTripModal
            isOpen={Boolean(editingTrip)}
            onClose={() => setEditingTrip(null)}
            trip={editingTrip}
            locations={locations}
            onTripUpdated={(updated) => {
              if (onTripUpdated) onTripUpdated(updated)
              setEditingTrip(null)
            }}
            onLocationAdded={onLocationAdded}
          />
        )}

        {/* Log Fuel Drawer */}
        <LogFuelDrawer
          isOpen={fuelDrawerOpen}
          onClose={() => setFuelDrawerOpen(false)}
          activeDriver={activeDriver}
          onFuelLogged={onFuelLogged}
        />

        {/* Driver Switcher & Vehicle Selector Modal */}
        {driverSwitcherOpen && (
          <DriverSwitcherModal
            drivers={drivers}
            activeDriver={activeDriver}
            onSelectDriver={(drv) => {
              onSelectDriver(drv)
              setDriverSwitcherOpen(false)
            }}
            onUpdateDriver={onUpdateDriver}
            onAddDriver={onAddDriver}
            onClose={() => setDriverSwitcherOpen(false)}
          />
        )}
      </section>

      {desktopPreview && (
        <aside className="driver-preview-guide">
          <span className="preview-status">
            <i /> Live Driver View
          </span>
          <h2>Field Operations Flow</h2>
          <ol>
            <li>
              <span>01</span>
              Tap <strong>+ Log Trip</strong> or <strong>⛽ Log Fuel</strong>
            </li>
            <li>
              <span>02</span>
              Choose or add new locations on the fly
            </li>
            <li>
              <span>03</span>
              Enter trip fare directly and submit
            </li>
            <li>
              <span>04</span>
              Tap profile avatar to switch driver or vehicle
            </li>
          </ol>
          <small>Driver viewport 420px · Progressive Web App ready</small>
        </aside>
      )}
    </main>
  )
}

export default DriverApp
