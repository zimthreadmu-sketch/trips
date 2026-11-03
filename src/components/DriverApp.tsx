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
  const [showAllLogs, setShowAllLogs] = useState(false)

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

  const displayedEntries = showAllLogs ? ledgerEntries : ledgerEntries.slice(0, 5)

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
                {new Date().toLocaleDateString("en-MU", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }).toUpperCase()}
              </span>
              <h1>Morning, Driver</h1>
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

        <section className="driver-content">
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
              <span className="eyebrow">LIVE ACTIVITY</span>
              <h2>Recent shift logs</h2>
            </div>
            {ledgerEntries.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllLogs(!showAllLogs)}
                aria-label={showAllLogs ? "Show recent 5 logs" : `View all ${ledgerEntries.length} shift logs`}
              >
                {showAllLogs ? "Show less" : `View all (${ledgerEntries.length})`}
              </button>
            )}
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
              displayedEntries.map((item) => (
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
        </section>

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
          <small>Driver viewport 420px · Progressive Web App ready</small>
        </aside>
      )}
    </main>
  )
}

export default DriverApp
