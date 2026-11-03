"use client"

import { useState, useMemo, useTransition } from "react"
import { Icon, type IconName } from "./Icon"
import { Logo } from "./Logo"
import { Sparkline } from "./Sparkline"
import { RevenueChart } from "./RevenueChart"
import { SettingsDrawer } from "./SettingsDrawer"
import { updateTripStatus } from "@/app/actions"
import type { Location, DashboardMetrics, Trip, FuelLog, LedgerEntry } from "@/lib/db"

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
  const [query, setQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("All locations")
  const [currentPage, setCurrentPage] = useState(1)
  const [, startTransition] = useTransition()

  // Track status overrides locally for optimistic instant updates
  const [statusOverrides, setStatusOverrides] = useState<Record<string, "Approved" | "Pending" | "Rejected">>({})

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
        initials: "TM",
        name: "Thabo Mokoena",
        driverId: "DRV-018",
        type: t.trip_type,
        from: t.origin_name,
        to: t.destination_name,
        note: t.note || (t.trip_type === "VIP" ? "VIP Client Transfer" : "Standard Commute"),
        fuel: `−R ${approxFuel}.00`,
        net: `R ${fare > 0 ? fare.toFixed(2) : netFare.toFixed(2)}`,
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
      const matchLocation =
        selectedLocation === "All locations" ||
        row.from === selectedLocation ||
        row.to === selectedLocation
      return matchQuery && matchType && matchLocation
    })
  }, [initialRows, tripFilter, query, selectedLocation])

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
    const headers = ["Trip ID", "Driver", "Type", "Origin", "Destination", "Note", "Amount", "Status"]
    const rows = filteredRows.map((r) => [
      r.id,
      r.name,
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
  const pageSize = 8
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Top corridors count
  const corridorList = [
    { from: "Booysens", to: "Rosettenville", trips: "412", bar: "100%" },
    { from: "Rosettenville", to: "JHB Central", trips: "285", bar: "69%" },
    { from: "Booysens", to: "Gold Reef City", trips: "198", bar: "48%" },
  ]

  // Fuel ratio calculation
  const fuelRatioPct = metrics.grossRevenue > 0
    ? ((metrics.fuelExpense / metrics.grossRevenue) * 100).toFixed(1)
    : "22.9"

  return (
    <main className="admin-app">
      <header className="topbar">
        <Logo />
        <div className="topbar-center">
          <button type="button" className="driver-view-switch" onClick={onDriverView}>
            <Icon name="car" size={16} /> Driver App
          </button>
          <span className="live-fleet">
            <i /> <strong>12</strong> Drivers active
          </span>
          <button type="button" className="date-filter">
            <Icon name="calendar" size={16} /> Nov 1 – Nov 30, 2026{" "}
            <Icon name="chevron" size={14} />
          </button>
        </div>
        <div className="admin-profile">
          <button type="button" className="icon-button" aria-label="Notifications">
            <Icon name="bell" />
          </button>
          <span className="top-divider" />
          <span className="admin-avatar">ZN</span>
          <span>
            <strong>Zanele N.</strong>
            <small>Fleet Administrator</small>
          </span>
          <Icon name="chevron" size={15} />
        </div>
      </header>

      <div className="admin-content">
        <div className="page-heading">
          <div>
            <span className="eyebrow">EXECUTIVE OVERVIEW</span>
            <h1>Fleet performance</h1>
            <p>
              Monitor revenue, operations, and driver activity in real time.
            </p>
          </div>
          <div>
            <button
              type="button"
              className="secondary-action"
              onClick={handleExportReport}
            >
              <Icon name="download" size={17} /> Export report
            </button>
            <button
              type="button"
              className="primary-action"
              onClick={() => setDrawerOpen(true)}
            >
              <Icon name="settings" size={17} /> Pricing settings
            </button>
          </div>
        </div>

        {/* Real-time KPI Cards */}
        <section className="kpi-grid">
          <KpiCard
            label="Total Gross Revenue"
            value={`R ${metrics.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon="trend"
            spark="green"
          >
            <span className="positive-pill">
              <Icon name="trend" size={12} /> 18.4%
            </span>
            <span>vs last month</span>
          </KpiCard>
          <KpiCard
            label="Total Fuel Expense"
            value={`R ${metrics.fuelExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon="fuel"
            tone="expense"
          >
            <div className="fuel-ratio">
              <span>
                <b>{fuelRatioPct}%</b> fuel ratio
              </span>
              <span className="progress">
                <i style={{ width: `${Math.min(100, Number(fuelRatioPct))}%` }} />
              </span>
            </div>
          </KpiCard>
          <KpiCard
            label="Net Operating Profit"
            value={`R ${metrics.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon="sparkles"
            tone="profit"
            spark="green"
          >
            <span className="positive-pill">
              <Icon name="trend" size={12} /> 21.0%
            </span>
            <span>net margin growth</span>
          </KpiCard>
          <KpiCard
            label="Trips Breakdown"
            value={`${metrics.totalTrips} Trips`}
            icon="route"
            tone="trips"
          >
            <div className="trip-breakdown">
              <span>
                <i /> {metrics.regularTrips} Regular
              </span>
              <span>
                <i /> {metrics.vipTrips} VIP
              </span>
              <small>{metrics.vipRatio}% VIP trips · High margin</small>
            </div>
          </KpiCard>
        </section>

        {/* Analytics Grid */}
        <section className="analytics-grid">
          <article className="panel chart-panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">FINANCIAL FLOW</span>
                <h2>Revenue vs. fuel outflow</h2>
              </div>
              <div className="chart-legend">
                <span>
                  <i className="revenue" />
                  Revenue
                </span>
                <span>
                  <i className="vip" />
                  VIP revenue
                </span>
                <span>
                  <i className="fuel" />
                  Fuel
                </span>
              </div>
            </div>
            <RevenueChart />
          </article>
          <article className="panel corridors-panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">ROUTE INTELLIGENCE</span>
                <h2>Top corridors</h2>
              </div>
              <button type="button" aria-label="Filter corridors">
                <Icon name="filter" size={16} />
              </button>
            </div>
            <div className="corridor-overview">
              <div className="donut">
                <div>
                  <strong>{metrics.totalTrips}</strong>
                  <span>Trips</span>
                </div>
              </div>
              <div className="donut-legend">
                <span>
                  <i />
                  Top 3 corridors <b>63%</b>
                </span>
                <span>
                  <i />
                  Other routes <b>37%</b>
                </span>
              </div>
            </div>
            <div className="corridor-list">
              {corridorList.map((route, index) => (
                <div className="corridor-row" key={route.to}>
                  <span className="route-rank">0{index + 1}</span>
                  <div>
                    <strong>
                      {route.from} <Icon name="arrow" size={13} /> {route.to}
                    </strong>
                    <span className="route-bar">
                      <i style={{ width: route.bar }} />
                    </span>
                  </div>
                  <b>
                    {route.trips}
                    <small>trips</small>
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
                placeholder="Search driver or route..."
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setCurrentPage(1)
                }}
              />
            </label>
            <div className="toolbar-filters">
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
              <button type="button">
                <Icon name="calendar" size={15} /> Nov 2026{" "}
                <Icon name="chevron" size={13} />
              </button>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Trip type</th>
                  <th>Route</th>
                  <th>Client / notes</th>
                  <th>Fuel deduction</th>
                  <th>Net amount</th>
                  <th>Audit status</th>
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
                      <span className="fuel-amount">{row.fuel}</span>
                    </td>
                    <td>
                      <strong className="net-amount">{row.net}</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(row.id, row.status)}
                        title="Click to toggle status"
                        className={`status-pill ${
                          row.status === "Approved" ? "approved" : "pending"
                        }`}
                        style={{ border: 0, cursor: "pointer" }}
                      >
                        <i />
                        {row.status}
                      </button>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          title="Review trip details"
                          onClick={() => alert(`Trip Details:\nRoute: ${row.from} → ${row.to}\nType: ${row.type}\nFare: ${row.net}\nStatus: ${row.status}`)}
                        >
                          <Icon name="search" size={15} />
                        </button>
                        <button
                          type="button"
                          title="Toggle audit approval"
                          onClick={() => handleToggleStatus(row.id, row.status)}
                        >
                          <Icon name="edit" size={15} />
                        </button>
                        <button
                          type="button"
                          title="Download receipt"
                          onClick={() => alert(`Receipt downloaded for ${row.id}`)}
                        >
                          <Icon name="download" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRows.length === 0 && (
              <div className="empty-state">
                No ledger entries match your filters.
              </div>
            )}
          </div>
          <div className="table-footer">
            <span>
              Showing {filteredRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
              {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} entries
            </span>
            <div>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  type="button"
                  key={i + 1}
                  className={currentPage === i + 1 ? "active" : ""}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Settings Drawer */}
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
    </main>
  )
}
