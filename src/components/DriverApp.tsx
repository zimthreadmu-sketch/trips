"use client"

import { useState } from "react"
import { Icon } from "./Icon"
import { Logo } from "./Logo"
import { LogTripModal } from "./LogTripModal"
import { LogFuelDrawer } from "./LogFuelDrawer"
import type { Location, Driver, Trip, FuelLog, LedgerEntry } from "@/lib/db"

interface DriverAppProps {
  desktopPreview?: boolean
  onAdminView?: () => void
  locations: Location[]
  driver: Driver
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
          <span>NOVEMBER TRIPS</span>
          <strong>{trips.length}</strong>
          <small>
            <b>+12%</b> from October
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
        {visibleTrips.map((trip) => {
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
                  {trip.payment_method}
                </small>
              </div>
              <div className="trip-history-fare">
                <strong>R {Number(trip.fare).toFixed(2)}</strong>
                <button type="button">Receipt</button>
              </div>
            </article>
          )
        })}
      </div>
      <button type="button" className="load-more-button">
        Load earlier trips
      </button>
    </div>
  )
}

function DriverInsights({ trips, fuelLogs }: { trips: Trip[]; fuelLogs: FuelLog[] }) {
  const [range, setRange] = useState("Week")
  const bars = [46, 70, 55, 84, 64, 92, 76]

  const totalRev = trips.reduce((sum, t) => sum + Number(t.fare || 0), 0)
  const totalFuel = fuelLogs.reduce((sum, f) => sum + Number(f.cost_amount || 0), 0)
  const netEarnings = totalRev - totalFuel
  const vipCount = trips.filter((t) => t.trip_type === "VIP").length
  const vipShare = trips.length > 0 ? Math.round((vipCount / trips.length) * 100) : 24
  const fuelRatio = totalRev > 0 ? ((totalFuel / totalRev) * 100).toFixed(1) : "18.2"
  const avgFare = trips.length > 0 ? Math.round(totalRev / trips.length) : 214

  return (
    <div className="driver-tab-screen">
      <div className="tab-title-row">
        <div>
          <span className="eyebrow">PERFORMANCE</span>
          <h2>My insights</h2>
        </div>
        <button className="square-action" aria-label="Insight date range">
          <Icon name="calendar" size={17} />
        </button>
      </div>
      <div className="insight-range">
        {["Week", "Month", "3 Months"].map((item) => (
          <button
            key={item}
            type="button"
            className={range === item ? "active" : ""}
            onClick={() => setRange(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="earnings-hero">
        <span>NET EARNINGS</span>
        <strong>R {netEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
        <small>
          <b>
            <Icon name="trend" size={12} /> 14.8%
          </b>{" "}
          compared to last {range.toLowerCase()}
        </small>
        <div className="mobile-bar-chart">
          {bars.map((height, index) => (
            <div key={index}>
              <i
                style={{ height: `${height}%` }}
                className={index === 5 ? "peak" : ""}
              />
              <span>{["M", "T", "W", "T", "F", "S", "S"][index]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="insight-metrics">
        <article>
          <span className="mini-metric-icon green">
            <Icon name="route" size={17} />
          </span>
          <div>
            <small>TRIPS</small>
            <strong>{trips.length}</strong>
            <b>4.6 / day</b>
          </div>
        </article>
        <article>
          <span className="mini-metric-icon gold">
            <Icon name="sparkles" size={17} />
          </span>
          <div>
            <small>VIP SHARE</small>
            <strong>{vipShare}%</strong>
            <b>R 2,190</b>
          </div>
        </article>
        <article>
          <span className="mini-metric-icon red">
            <Icon name="fuel" size={17} />
          </span>
          <div>
            <small>FUEL RATIO</small>
            <strong>{fuelRatio}%</strong>
            <b>−2.1% better</b>
          </div>
        </article>
        <article>
          <span className="mini-metric-icon blue">
            <Icon name="car" size={17} />
          </span>
          <div>
            <small>AVG. FARE</small>
            <strong>R {avgFare}</strong>
            <b>+R 18</b>
          </div>
        </article>
      </div>
      <div className="driver-panel">
        <div className="driver-panel-head">
          <div>
            <span className="eyebrow">TOP ROUTES</span>
            <h3>Best corridors</h3>
          </div>
          <span>Net earned</span>
        </div>
        {[
          ["Booysens → Rosettenville", "12 trips", "R 1,440"],
          ["Rosettenville → Sandton", "6 trips", "R 1,310"],
          ["JHB CBD → Southgate", "8 trips", "R 960"],
        ].map((route, index) => (
          <div className="driver-route-row" key={route[0]}>
            <span>0{index + 1}</span>
            <div>
              <strong>{route[0]}</strong>
              <small>{route[1]}</small>
            </div>
            <b>{route[2]}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

function DriverSettingsTab({
  driver,
  onDuty,
  setOnDuty,
  onAdminView,
}: {
  driver: Driver
  onDuty: boolean
  setOnDuty: (value: boolean) => void
  onAdminView?: () => void
}) {
  const [notifications, setNotifications] = useState(true)
  const [biometrics, setBiometrics] = useState(false)

  return (
    <div className="driver-tab-screen">
      <div className="tab-title-row">
        <div>
          <span className="eyebrow">DRIVER ACCOUNT</span>
          <h2>Settings</h2>
        </div>
        <button className="square-action" aria-label="Edit profile">
          <Icon name="edit" size={17} />
        </button>
      </div>
      <div className="profile-card">
        <span className="profile-avatar">
          {driver.initials || "TM"}
          <i />
        </span>
        <div>
          <strong>{driver.name || "Thabo Mokoena"}</strong>
          <span>Driver ID · {driver.id ? "DRV-018" : "DRV-018"}</span>
          <small>
            <Icon name="check" size={11} /> Verified driver
          </small>
        </div>
        <Icon name="chevron" size={16} />
      </div>
      <div className="settings-group">
        <span className="settings-label">SHIFT & VEHICLE</span>
        <div className="settings-list">
          <div className="setting-row">
            <span className="setting-icon green">
              <Icon name="car" size={17} />
            </span>
            <div>
              <strong>{driver.vehicle || "Toyota Rumion · DX 44 GP"}</strong>
              <small>Assigned vehicle</small>
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
                {onDuty
                  ? "You’re visible to dispatch"
                  : "You’re currently unavailable"}
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
          <div className="setting-row">
            <span className="setting-icon">
              <Icon name="settings" size={17} />
            </span>
            <div>
              <strong>Biometric sign-in</strong>
              <small>Use device authentication</small>
            </div>
            <button
              type="button"
              className={`mini-toggle ${biometrics ? "active" : ""}`}
              onClick={() => setBiometrics(!biometrics)}
              aria-label="Toggle biometrics"
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
      <div className="settings-group">
        <span className="settings-label">SUPPORT</span>
        <div className="settings-list">
          <button type="button" className="setting-row button-row">
            <span className="setting-icon">
              <Icon name="users" size={17} />
            </span>
            <div>
              <strong>Contact fleet support</strong>
              <small>Available 24 hours</small>
            </div>
            <Icon name="chevron" size={15} />
          </button>
          <button type="button" className="setting-row button-row danger-row">
            <span className="setting-icon red">
              <Icon name="arrow" size={17} />
            </span>
            <div>
              <strong>Sign out</strong>
              <small>FleetPulse Driver v2.4.0</small>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export function DriverApp({
  desktopPreview = false,
  onAdminView,
  locations,
  driver,
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
  const [activeTab, setActiveTab] = useState<"shift" | "trips" | "insights" | "settings">("shift")

  // Dynamic calculations for today
  const todayRev = todayTrips.reduce((sum, t) => sum + Number(t.fare || 0), 0)
  const today = new Date().toDateString()
  const todayFuels = fuelLogs.filter(
    (f) => new Date(f.logged_at).toDateString() === today
  )
  const todayFuel = todayFuels.reduce((sum, f) => sum + Number(f.cost_amount || 0), 0)
  const todayNet = todayRev - todayFuel

  return (
    <main
      className={`mobile-shell ${
        desktopPreview ? "desktop-driver-preview" : ""
      }`}
    >
      {desktopPreview && (
        <aside className="driver-preview-intro">
          <button type="button" className="back-to-admin" onClick={onAdminView}>
            <Icon name="arrow" size={16} /> Back to admin dashboard
          </button>
          <span className="eyebrow">DRIVER FIELD APP</span>
          <h1>The frontend your drivers use on every shift.</h1>
          <p>
            A focused mobile workspace for logging journeys, fuel expenses, and
            VIP account trips from the road.
          </p>
          <div className="preview-feature-list">
            <span>
              <i>
                <Icon name="check" size={14} />
              </i>
              One-tap trip and fuel logging
            </span>
            <span>
              <i>
                <Icon name="check" size={14} />
              </i>
              Live earnings and shift activity
            </span>
            <span>
              <i>
                <Icon name="check" size={14} />
              </i>
              Standard and VIP account fares
            </span>
          </div>
        </aside>
      )}

      <section className="driver-app">
        <header className="driver-header">
          <div className="driver-brand-row">
            <Logo />
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                className={`duty-toggle ${onDuty ? "active" : ""}`}
                onClick={() => setOnDuty(!onDuty)}
              >
                <span className="live-dot" /> {onDuty ? "On Duty" : "Off Duty"}
              </button>
              {onAdminView && !desktopPreview && (
                <button
                  type="button"
                  onClick={onAdminView}
                  title="Switch to Admin Dashboard"
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
                  }}
                >
                  <Icon name="trend" size={12} /> Admin
                </button>
              )}
            </div>
          </div>
          <div className="greeting-row">
            <div>
              <span className="eyebrow">
                {activeTab === "shift"
                  ? new Date().toLocaleDateString("en-ZA", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }).toUpperCase()
                  : "FLEETPULSE DRIVER"}
              </span>
              <h1>
                {activeTab === "shift"
                  ? `Morning, ${driver.name ? driver.name.split(" ")[0] : "Thabo"}`
                  : activeTab === "trips"
                    ? "Trip history"
                    : activeTab === "insights"
                      ? "Your performance"
                      : "Your account"}
              </h1>
            </div>
            <button type="button" className="avatar-button" aria-label="Open profile">
              {driver.initials || "TM"}
            </button>
          </div>
          <div className="vehicle-badge">
            <Icon name="car" size={15} /> {driver.vehicle || "Toyota Rumion · DX 44 GP"}
          </div>
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
                  <span>Today’s performance</span>
                  <span className="trend-label">
                    <Icon name="trend" size={14} /> 12.4%
                  </span>
                </div>
                <div className="mobile-metrics">
                  <div>
                    <span>Gross</span>
                    <strong>R {todayRev.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span>Fuel</span>
                    <strong className="danger">
                      {todayFuel > 0 ? `−R ${todayFuel.toLocaleString()}` : "R 0"}
                    </strong>
                  </div>
                  <div>
                    <span>Net</span>
                    <strong className="success">R {todayNet.toLocaleString()}</strong>
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
                {ledgerEntries.slice(0, 5).map((item) => (
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
                ))}
              </div>
            </>
          )}

          {activeTab === "trips" && <DriverTrips trips={allTrips} />}

          {activeTab === "insights" && (
            <DriverInsights trips={allTrips} fuelLogs={fuelLogs} />
          )}

          {activeTab === "settings" && (
            <DriverSettingsTab
              driver={driver}
              onDuty={onDuty}
              setOnDuty={setOnDuty}
              onAdminView={onAdminView}
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

        {/* Log Trip Modal */}
        <LogTripModal
          isOpen={tripSheetOpen}
          onClose={() => setTripSheetOpen(false)}
          locations={locations}
          onTripLogged={onTripLogged}
          baseFare={baseFare}
          vipMultiplier={vipMultiplier}
        />

        {/* Log Fuel Drawer */}
        <LogFuelDrawer
          isOpen={fuelDrawerOpen}
          onClose={() => setFuelDrawerOpen(false)}
          onFuelLogged={onFuelLogged}
        />
      </section>

      {desktopPreview && (
        <aside className="driver-preview-guide">
          <span className="preview-status">
            <i /> Interactive preview
          </span>
          <h2>Try the driver flow</h2>
          <ol>
            <li>
              <span>01</span>
              Select <strong>Log Trip</strong> or <strong>Log Fuel</strong>
            </li>
            <li>
              <span>02</span>
              Choose Standard or VIP
            </li>
            <li>
              <span>03</span>
              Adjust fare and submit to cloud
            </li>
          </ol>
          <small>Desktop preview · Driver viewport 390px</small>
        </aside>
      )}
    </main>
  )
}
