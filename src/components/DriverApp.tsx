"use client"

import { useState } from "react"
import { Icon } from "./Icon"
import { Logo } from "./Logo"
import { LogTripModal } from "./LogTripModal"
import { LogFuelDrawer } from "./LogFuelDrawer"
import DriverSwitcherModal from "./DriverSwitcherModal"
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
  onFuelLogged: (fuel: FuelLog) => void
  baseFare?: number
  vipMultiplier?: number
}

function DriverTrips({ trips }: { trips: Trip[] }) {
  const [filter, setFilter] = useState<"All" | "Regular" | "VIP">("All")

  const visibleTrips = trips.filter(
    (trip) => filter === "All" || trip.trip_type === filter
  )

  const vipCount = trips.filter((t) => t.trip_type === "VIP").length

  return (
    <div className="driver-tab-screen">
      <div className="tab-title-row">
        <div>
          <span className="eyebrow">JOURNEY HISTORY</span>
          <h2>My trips</h2>
        </div>
        <button className="square-action" aria-label="Search trips">
          <Icon name="search" size={17} />
        </button>
      </div>
      <div className="trip-summary-card">
        <div>
          <span>TOTAL LOGGED TRIPS</span>
          <strong>{trips.length}</strong>
          <small>
            <b>{vipCount}</b> VIP journeys
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
        {(["All", "Regular", "VIP"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={filter === item ? "active" : ""}
            onClick={() => setFilter(item)}
          >
            {item === "VIP" && <Icon name="sparkles" size={12} />}
            {item}
          </button>
        ))}
      </div>
      <div className="trip-history-list">
        {visibleTrips.length === 0 ? (
          <div style={{ padding: "36px 16px", textAlign: "center", color: "#6d7586", fontSize: "13px" }}>
            No trips logged in this view yet.
          </div>
        ) : (
          visibleTrips.map((trip) => {
            const isVip = trip.trip_type === "VIP"
            return (
              <article
                className="trip-history-item"
                key={trip.id}
              >
                <div className={`trip-history-icon ${trip.trip_type.toLowerCase()}`}>
                  <Icon
                    name={isVip ? "sparkles" : "route"}
                    size={17}
                  />
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
                  <span style={{ fontSize: "10px", color: "#697184" }}>{trip.status}</span>
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}

function DriverInsights({ trips, fuelLogs }: { trips: Trip[]; fuelLogs: FuelLog[] }) {
  const [range, setRange] = useState("Week")
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

      <div className="earnings-hero-card">
        <span>TOTAL NET EARNINGS</span>
        <strong>Rs {netEarnings.toLocaleString()}</strong>
        <div className="earnings-hero-foot">
          <span>Gross: Rs {totalRevenue.toLocaleString()}</span>
          <span>Fuel: -Rs {totalFuel.toLocaleString()}</span>
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
          <span>FUEL ENTRIES</span>
          <strong>{fuelLogs.length}</strong>
          <small>
            <b>{fuelLogs.reduce((s, f) => s + Number(f.liters || 0), 0).toFixed(1)}L</b> pumped
          </small>
        </div>
      </div>
    </div>
  )
}

function DriverSettingsTab({
  driver,
  onDuty,
  setOnDuty,
  onAdminView,
  onOpenDriverSwitcher,
}: {
  driver: Driver
  onDuty: boolean
  setOnDuty: (duty: boolean) => void
  onAdminView?: () => void
  onOpenDriverSwitcher: () => void
}) {
  const [notifications, setNotifications] = useState(true)

  return (
    <div className="driver-tab-screen">
      <div className="tab-title-row">
        <div>
          <span className="eyebrow">DRIVER ACCOUNT</span>
          <h2>Settings</h2>
        </div>
        <button
          className="square-action"
          aria-label="Edit profile"
          onClick={onOpenDriverSwitcher}
        >
          <Icon name="edit" size={17} />
        </button>
      </div>

      <div
        className="profile-card"
        onClick={onOpenDriverSwitcher}
        style={{ cursor: "pointer" }}
        title="Click to switch driver or change vehicle"
      >
        <span
          className="profile-avatar"
          style={{ background: driver.avatar_color || "#10B981", color: "#03261d" }}
        >
          {driver.initials || "DR"}
          <i />
        </span>
        <div>
          <strong>{driver.name}</strong>
          <span>Assigned: {driver.vehicle}</span>
          <small>
            <Icon name="check" size={11} /> Tap to switch driver profile
          </small>
        </div>
        <Icon name="chevron" size={16} />
      </div>

      <div className="settings-group">
        <span className="settings-label">SHIFT & VEHICLE</span>
        <div className="settings-list">
          <div
            className="setting-row"
            onClick={onOpenDriverSwitcher}
            style={{ cursor: "pointer" }}
          >
            <span className="setting-icon green">
              <Icon name="car" size={17} />
            </span>
            <div>
              <strong>{driver.vehicle || "Toyota Quantum (GP 482-901)"}</strong>
              <small>Tap to change assigned vehicle</small>
            </div>
            <Icon name="chevron" size={15} />
          </div>
          <div className="setting-row">
            <span className="setting-icon green">
              <Icon name="users" size={17} />
            </span>
            <div>
              <strong>Duty status</strong>
              <small>
                {onDuty ? "You’re on active duty" : "You’re currently off duty"}
              </small>
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
        </div>
      </div>

      <div className="settings-group">
        <span className="settings-label">APP PREFERENCES</span>
        <div className="settings-list">
          <div className="setting-row">
            <span className="setting-icon">
              <Icon name="bell" size={17} />
            </span>
            <div>
              <strong>Notifications</strong>
              <small>Shift alerts and trip updates</small>
            </div>
            <button
              type="button"
              className={`mini-toggle ${notifications ? "active" : ""}`}
              onClick={() => setNotifications(!notifications)}
              aria-label="Toggle notifications"
            >
              <i />
            </button>
          </div>
          {onAdminView && (
            <button
              type="button"
              className="setting-row button-row"
              onClick={onAdminView}
            >
              <span className="setting-icon green">
                <Icon name="trend" size={17} />
              </span>
              <div>
                <strong>Switch to Admin Portal</strong>
                <small>View executive reports & ledgers</small>
              </div>
              <Icon name="chevron" size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

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
  onFuelLogged,
  baseFare = 60,
  vipMultiplier = 1.8,
}: DriverAppProps) {
  const [onDuty, setOnDuty] = useState(true)
  const [tripSheetOpen, setTripSheetOpen] = useState(false)
  const [fuelDrawerOpen, setFuelDrawerOpen] = useState(false)
  const [driverSwitcherOpen, setDriverSwitcherOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"shift" | "trips" | "insights" | "settings">("shift")

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
    <main className="mobile-shell">
      <div className="driver-preview-intro">
        <Logo />
        <span className="badge">Driver App View</span>
      </div>

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
                    height: "31px",
                    padding: "0 10px",
                    borderRadius: "99px",
                    border: "1px solid #285b49",
                    background: "#102920",
                    color: "#9ff0d2",
                    fontSize: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Icon name="trend" size={12} /> Admin
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
                    ? "Trip history"
                    : activeTab === "insights"
                      ? "Your performance"
                      : "Your account"}
              </h1>
            </div>

            {/* Profile Avatar — opens Driver Switcher */}
            <button
              type="button"
              className="avatar-button"
              aria-label="Select Driver Profile"
              onClick={() => setDriverSwitcherOpen(true)}
              style={{
                background: activeDriver.avatar_color || "#10B981",
                color: "#ffffff",
                cursor: "pointer",
              }}
              title="Click to switch driver or change vehicle"
            >
              {activeDriver.initials || "DR"}
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
            <Icon name="car" size={15} /> {activeDriver.vehicle || "Toyota Quantum (GP 482-901)"}
            <span style={{ fontSize: "10px", color: "#20d59b", marginLeft: "4px" }}>• Change</span>
          </button>
        </header>

        <section
          className={`driver-content ${
            activeTab !== "shift" ? "tab-content" : ""
          }`}
        >
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
                  <span className="eyebrow">LIVE ACTIVITY</span>
                  <h2>Recent shift logs</h2>
                </div>
                <button type="button" onClick={() => setActiveTab("trips")}>
                  View all
                </button>
              </div>

              <div className="shift-feed">
                {ledgerEntries.length === 0 ? (
                  <div style={{ padding: "36px 16px", textAlign: "center", color: "#6d7586", fontSize: "13px" }}>
                    <p style={{ margin: "0 0 6px 0", color: "#a5acba" }}>No shift activity logged yet.</p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#626978" }}>
                      Tap <strong style={{ color: "#20d59b" }}>+ Log Trip</strong> or <strong style={{ color: "#f5ad36" }}>⛽ Log Fuel</strong> to record your first entry.
                    </p>
                  </div>
                ) : (
                  ledgerEntries.slice(0, 5).map((item) => (
                    <article className="shift-item" key={item.id}>
                      <div className={`log-icon ${item.tone}`}>
                        <Icon
                          name={
                            item.type === "fuel"
                              ? "fuel"
                              : item.tone === "gold"
                                ? "sparkles"
                                : "route"
                          }
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
                          <b className={item.tone}>{item.amount}</b>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === "trips" && <DriverTrips trips={allTrips} />}

          {activeTab === "insights" && (
            <DriverInsights trips={allTrips} fuelLogs={fuelLogs} />
          )}

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

        <nav className="mobile-nav">
          <button
            type="button"
            className={activeTab === "shift" ? "active" : ""}
            onClick={() => setActiveTab("shift")}
          >
            <Icon name="car" />
            <span>Shift</span>
          </button>
          <button
            type="button"
            className={activeTab === "trips" ? "active" : ""}
            onClick={() => setActiveTab("trips")}
          >
            <Icon name="route" />
            <span>Trips</span>
          </button>
          <button
            type="button"
            className={activeTab === "insights" ? "active" : ""}
            onClick={() => setActiveTab("insights")}
          >
            <Icon name="trend" />
            <span>Insights</span>
          </button>
          <button
            type="button"
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
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
          <small>Driver viewport 390px · Progressive Web App ready</small>
        </aside>
      )}
    </main>
  )
}
export default DriverApp
