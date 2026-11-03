"use client"

import { useState, useMemo, useTransition } from "react"
import { Icon, type IconName } from "./Icon"
import { Logo } from "./Logo"
import { Sparkline } from "./Sparkline"
import { RevenueChart } from "./RevenueChart"
import { SettingsDrawer } from "./SettingsDrawer"
import { updateTripStatus } from "@/app/actions"
import { computeInitials, type Location, type DashboardMetrics, type Trip, type FuelLog } from "@/lib/db"

interface AdminDashboardProps {
  onDriverView: () => void
  metrics: DashboardMetrics
  trips: Trip[]
  fuelLogs: FuelLog[]
  locations: Location[]
  onLocationAdded: (loc: Location) => void
  regularRate: number
  setRegularRate: (val: number) => void
  multiplier: number
  setMultiplier: (val: number) => void
}

interface TableRowData {
  id: string
  initials: string
  name: string
  driverId: string
  type: "Regular" | "VIP"
  from: string
  to: string
  note: string
  fuel: string
  net: string
  status: "Approved" | "Pending" | "Rejected"
  color: string
}

function KpiCard({
  label,
  value,
  children,
  icon,
  tone = "neutral",
  spark,
}: {
  label: string
  value: string
  children: React.ReactNode
  icon: IconName
  tone?: string
  spark?: "green" | "red" | "gold"
}) {
  return (
    <article className={`kpi-card ${tone}`}>
      <div className="kpi-head">
        <span>{label}</span>
        <span className="kpi-icon">
          <Icon name={icon} size={17} />
        </span>
      </div>
      <strong>{value}</strong>
      <div className="kpi-bottom">
        {children}
        {spark && <Sparkline tone={spark} />}
      </div>
    </article>
  )
}

export function AdminDashboard({
  onDriverView,
  metrics,
  trips,
  locations,
  onLocationAdded,
  regularRate,
  setRegularRate,
  multiplier,
  setMultiplier,
}: AdminDashboardProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [tripFilter, setTripFilter] = useState("All trips")
  const [driverFilter, setDriverFilter] = useState("All drivers")
  const [query, setQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("All locations")
  const [currentPage, setCurrentPage] = useState(1)
  const [, startTransition] = useTransition()

  // Track status overrides locally for optimistic instant updates
  const [statusOverrides, setStatusOverrides] = useState<Record<string, "Approved" | "Pending" | "Rejected">>({})

  const uniqueDrivers = useMemo(() => {
    const set = new Set<string>()
    trips.forEach((t) => {
      if (t.driver_name) set.add(t.driver_name)
    })
    return Array.from(set)
  }, [trips])

  // Format table rows from trips
  const initialRows: TableRowData[] = useMemo(() => {
    const avatarColors = ["mint", "gold", "blue", "coral", "purple"]
    return trips.map((t, idx) => {
      const color = avatarColors[idx % avatarColors.length]
      const approxFuel = t.trip_type === "VIP" ? 86 : 42
      const fare = Number(t.fare || 0)
      const netFare = Math.max(0, fare - approxFuel)

      return {
        id: t.id,
        initials: t.driver_initials || computeInitials(t.driver_name || "Driver"),
        name: t.driver_name || "Thabo Mokoena",
        driverId: t.vehicle || "Toyota Quantum",
        type: t.trip_type,
        from: t.origin_name,
        to: t.destination_name,
        note: t.note || (t.trip_type === "VIP" ? "VIP Client Transfer" : "Standard Commute"),
        fuel: `−Rs ${approxFuel}.00`,
        net: `Rs ${fare.toFixed(2)}`,
        status: (statusOverrides[t.id] || t.status) as "Approved" | "Pending" | "Rejected",
        color,
      }
    })
  }, [trips, statusOverrides])

  // Filtered rows
  const filteredRows = useMemo(() => {
    return initialRows.filter((row) => {
      const matchQuery =
        row.name.toLowerCase().includes(query.toLowerCase()) ||
        row.from.toLowerCase().includes(query.toLowerCase()) ||
        row.to.toLowerCase().includes(query.toLowerCase()) ||
        row.note.toLowerCase().includes(query.toLowerCase())
      const matchType = tripFilter === "All trips" || row.type === tripFilter
      const matchDriver = driverFilter === "All drivers" || row.name === driverFilter
      const matchLocation =
        selectedLocation === "All locations" ||
        row.from === selectedLocation ||
        row.to === selectedLocation
      return matchQuery && matchType && matchDriver && matchLocation
    })
  }, [initialRows, tripFilter, driverFilter, query, selectedLocation])

  // Status toggle handler
  const handleToggleStatus = (id: string, currentStatus: "Approved" | "Pending" | "Rejected") => {
    const nextStatus = currentStatus === "Approved" ? "Pending" : "Approved"

    // Optimistic update
    setStatusOverrides((prev) => ({ ...prev, [id]: nextStatus }))

    startTransition(async () => {
      try {
        await updateTripStatus(id, nextStatus)
      } catch (err) {
        console.error("Failed to update status:", err)
        // Rollback on error
        setStatusOverrides((prev) => ({ ...prev, [id]: currentStatus }))
      }
    })
  }

  // Export report handler
  const handleExportReport = () => {
    const headers = ["Trip ID", "Driver", "Vehicle", "Type", "Origin", "Destination", "Note", "Amount", "Status"]
    const rows = filteredRows.map((r) => [
      r.id,
      `"${r.name}"`,
      `"${r.driverId}"`,
      r.type,
      `"${r.from}"`,
      `"${r.to}"`,
      `"${r.note}"`,
      r.net,
      r.status,
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `FleetPulse_Report_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const approvedCount = filteredRows.filter((r) => r.status === "Approved").length
  const pendingCount = filteredRows.filter((r) => r.status === "Pending").length

  // Pagination
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <main className="admin-shell">
      <div className="admin-wrap">
        {/* Top Navbar */}
        <header className="admin-nav">
          <div className="nav-left">
            <Logo />
            <span className="live-counter">
              <i /> Live Fleet · {trips.length} Trips
            </span>
          </div>

          <div className="nav-right">
            <div className="date-badge">
              <Icon name="calendar" size={15} />
              <span>Nov 1 – Nov 30, 2026</span>
            </div>

            <button
              type="button"
              className="quick-driver-switch"
              onClick={onDriverView}
              title="Open Mobile Driver App"
            >
              <Icon name="car" size={16} />
              <span>Driver View</span>
            </button>

            <button
              type="button"
              className="icon-action-btn"
              onClick={() => setDrawerOpen(true)}
              aria-label="Settings"
              title="Fleet & Pricing Settings"
            >
              <Icon name="settings" size={18} />
            </button>

            <div className="admin-profile">
              <span className="admin-avatar">FP</span>
              <div className="admin-meta">
                <strong>Fleet Manager</strong>
                <small>zimthreadmu@gmail.com</small>
              </div>
            </div>
          </div>
        </header>

        {/* Top Metric Cards */}
        <section className="kpi-grid">
          <KpiCard
            label="TOTAL GROSS REVENUE"
            value={`Rs ${metrics.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            icon="trend"
            spark="green"
          >
            <span className="kpi-tag positive">
              <Icon name="trend" size={13} /> {metrics.todayRevenue > 0 ? `+Rs ${metrics.todayRevenue.toLocaleString()} today` : "Live telemetry"}
            </span>
            <small>Total customer fares collected</small>
          </KpiCard>

          <KpiCard
            label="TOTAL FUEL EXPENSE"
            value={`Rs ${metrics.fuelExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            icon="fuel"
            spark="red"
          >
            <span className="kpi-tag negative">
              <Icon name="fuel" size={13} /> {metrics.grossRevenue > 0 ? `${((metrics.fuelExpense / metrics.grossRevenue) * 100).toFixed(1)}%` : "0%"} of revenue
            </span>
            <small>Refuel station receipts</small>
          </KpiCard>

          <KpiCard
            label="NET OPERATING PROFIT"
            value={`Rs ${metrics.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            icon="check"
            tone="featured"
            spark="green"
          >
            <span className="kpi-tag highlight">
              Net margin {metrics.grossRevenue > 0 ? `${Math.round((metrics.netProfit / metrics.grossRevenue) * 100)}%` : "100%"}
            </span>
            <small>Gross revenue minus fuel</small>
          </KpiCard>

          <KpiCard
            label="TRIPS BREAKDOWN"
            value={`${metrics.totalTrips} Trips`}
            icon="car"
            spark="gold"
          >
            <span className="kpi-tag gold">
              <Icon name="sparkles" size={12} /> {metrics.vipTrips} VIP ({metrics.vipRatio}%)
            </span>
            <small>{metrics.regularTrips} Regular journeys</small>
          </KpiCard>
        </section>

        {/* Analytics Section */}
        <section className="analytics-grid">
          <article className="panel chart-panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">FINANCIAL FLOW</span>
                <h2>Daily Revenue vs Fuel Outflow</h2>
              </div>
              <div className="chart-legend">
                <span className="legend-item rev">
                  <i /> Total Revenue
                </span>
                <span className="legend-item vip">
                  <i /> VIP Trips
                </span>
                <span className="legend-item fuel">
                  <i /> Fuel Expense
                </span>
              </div>
            </div>
            <RevenueChart />
          </article>

          <article className="panel corridors-panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">ROUTE INTELLIGENCE</span>
                <h2>Top corridor routes</h2>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setDrawerOpen(true)}
              >
                Manage zones
              </button>
            </div>

            <div className="donut-wrap">
              <div className="donut-chart">
                <div className="donut-hole">
                  <strong>{metrics.totalTrips}</strong>
                  <span>Trips</span>
                </div>
              </div>
              <div className="donut-legend">
                <div>
                  <span className="legend-dot green" />
                  <span>Regular ({metrics.regularTrips})</span>
                </div>
                <div>
                  <span className="legend-dot gold" />
                  <span>VIP ({metrics.vipTrips})</span>
                </div>
              </div>
            </div>

            <div className="corridor-list">
              {[
                {
                  route: "Port Louis ⇄ Grand Baie",
                  trips: trips.filter((t) => t.origin_name.includes("Port Louis") || t.destination_name.includes("Port Louis")).length,
                  pct: "Main tourist & coastal hub",
                },
                {
                  route: "Flic en Flac ⇄ Ebene",
                  trips: trips.filter((t) => t.origin_name.includes("Ebene") || t.destination_name.includes("Ebene")).length,
                  pct: "Cybercity business corridor",
                },
                {
                  route: "SSR Airport ⇄ Grand Baie VIP",
                  trips: trips.filter((t) => t.trip_type === "VIP").length,
                  pct: "Executive hotel transfers",
                },
              ].map((c) => (
                <div className="corridor-row" key={c.route}>
                  <div>
                    <strong>{c.route}</strong>
                    <small>{c.pct}</small>
                  </div>
                  <b>
                    {c.trips} trips
                  </b>
                </div>
              ))}
            </div>
          </article>
        </section>

        {/* Operational Ledger */}
        <section className="panel ledger-panel">
          <div className="ledger-heading">
            <div>
              <span className="eyebrow">OPERATIONAL LEDGER</span>
              <h2>Trip & expense activity</h2>
            </div>
            <div className="ledger-summary">
              <span>
                <i className="approved-dot" /> {approvedCount} Approved
              </span>
              <span>
                <i className="pending-dot" /> {pendingCount} Pending
              </span>
            </div>
          </div>
          <div className="table-toolbar">
            <label className="search-box">
              <Icon name="search" size={17} />
              <input
                placeholder="Search driver, route, or notes..."
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setCurrentPage(1)
                }}
              />
            </label>
            <div className="toolbar-filters">
              {/* Filter by Driver */}
              <label>
                <Icon name="users" size={15} />
                <select
                  value={driverFilter}
                  onChange={(event) => {
                    setDriverFilter(event.target.value)
                    setCurrentPage(1)
                  }}
                >
                  <option>All drivers</option>
                  {uniqueDrivers.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <Icon name="chevron" size={13} />
              </label>

              {/* Filter by Trip Type */}
              <label>
                <Icon name="filter" size={15} />
                <select
                  value={tripFilter}
                  onChange={(event) => {
                    setTripFilter(event.target.value)
                    setCurrentPage(1)
                  }}
                >
                  <option>All trips</option>
                  <option>Regular</option>
                  <option>VIP</option>
                </select>
                <Icon name="chevron" size={13} />
              </label>

              {/* Filter by Location */}
              <label>
                <Icon name="location" size={15} />
                <select
                  value={selectedLocation}
                  onChange={(event) => {
                    setSelectedLocation(event.target.value)
                    setCurrentPage(1)
                  }}
                >
                  <option>All locations</option>
                  {locations.map((loc) => (
                    <option key={loc.id || loc.name} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                <Icon name="chevron" size={13} />
              </label>

              <button
                type="button"
                className="export-btn"
                onClick={handleExportReport}
                title="Download CSV ledger"
              >
                <Icon name="download" size={15} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>DRIVER & VEHICLE</th>
                  <th>TYPE</th>
                  <th>ROUTE</th>
                  <th>PASSENGER / CLIENT NOTE</th>
                  <th>FARE COLLECTED</th>
                  <th>AUDIT STATUS</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="driver-cell">
                        <span className={`table-avatar ${row.color}`}>
                          {row.initials}
                        </span>
                        <span>
                          <strong>{row.name}</strong>
                          <small>{row.driverId}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`type-pill ${row.type.toLowerCase()}`}>
                        {row.type === "VIP" && (
                          <Icon name="sparkles" size={12} />
                        )}
                        {row.type}
                      </span>
                    </td>
                    <td>
                      <div className="route-cell">
                        <span>{row.from}</span>
                        <Icon name="arrow" size={14} />
                        <span>{row.to}</span>
                      </div>
                    </td>
                    <td>
                      <span className="notes-cell">{row.note}</span>
                    </td>
                    <td>
                      <strong className="net-amount">{row.net}</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(row.id, row.status)}
                        className={`status-pill ${
                          row.status === "Approved" ? "approved" : "pending"
                        }`}
                        style={{ border: 0, cursor: "pointer" }}
                        title="Click to toggle status"
                      >
                        <i />
                        {row.status}
                      </button>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          title="Toggle audit status"
                          onClick={() => handleToggleStatus(row.id, row.status)}
                        >
                          <Icon name="check" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRows.length === 0 && (
              <div className="empty-state" style={{ padding: "48px 16px", textAlign: "center", color: "#697184" }}>
                <p style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#9ca5b4" }}>No trips logged yet.</p>
                <p style={{ margin: 0, fontSize: "12px" }}>
                  When drivers log regular or VIP journeys, real-time records will appear here automatically.
                </p>
              </div>
            )}
          </div>

          <div className="table-footer">
            <span>
              Showing {filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} entries
            </span>
            <div>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button type="button" className="active">
                {currentPage}
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>

      {drawerOpen && (
        <SettingsDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          locations={locations}
          onLocationAdded={onLocationAdded}
          regularRate={regularRate}
          setRegularRate={setRegularRate}
          multiplier={multiplier}
          setMultiplier={setMultiplier}
        />
      )}
    </main>
  )
}
export default AdminDashboard
