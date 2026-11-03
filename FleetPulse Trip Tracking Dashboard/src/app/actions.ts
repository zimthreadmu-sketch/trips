"use server"

import {
  initDb,
  getDbClient,
  isNeonConfigured,
  mockStore,
  type Location,
  type Driver,
  type Trip,
  type FuelLog,
  type LedgerEntry,
  type DashboardMetrics,
  type AnalyticsData,
} from "../lib/db"

// Helper to format ISO timestamp into UI display time like "09:42" or "Yesterday · 17:35"
function formatDisplayTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    const now = new Date()
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()

    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear()

    const hours = String(d.getHours()).padStart(2, "0")
    const minutes = String(d.getMinutes()).padStart(2, "0")
    const timeStr = `${hours}:${minutes}`

    if (isToday) return timeStr
    if (isYesterday) return `Yesterday · ${timeStr}`

    return `${d.toLocaleDateString("en-ZA", { month: "short", day: "numeric" })} · ${timeStr}`
  } catch {
    return isoString
  }
}

function buildLedgerEntries(trips: Trip[], fuels: FuelLog[]): LedgerEntry[] {
  const tripEntries: LedgerEntry[] = trips.map((t) => ({
    id: t.id,
    type: "trip",
    time: formatDisplayTime(t.logged_at),
    title: `${t.origin_name} → ${t.destination_name}`,
    detail: t.trip_type === "VIP" ? "VIP Trip" : "Regular trip",
    amount: `R ${Number(t.fare).toFixed(2)}`,
    numericAmount: Number(t.fare),
    tone: t.trip_type === "VIP" ? "gold" : "green",
    status: t.status,
    timestamp: t.logged_at,
  }))

  const fuelEntries: LedgerEntry[] = fuels.map((f) => ({
    id: f.id,
    type: "fuel",
    time: formatDisplayTime(f.logged_at),
    title: f.station_name,
    detail: `Fuel refill · ${f.liters}L`,
    amount: `−R ${Number(f.cost_amount).toFixed(2)}`,
    numericAmount: -Number(f.cost_amount),
    tone: "red",
    timestamp: f.logged_at,
  }))

  return [...tripEntries, ...fuelEntries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

function calculateDashboardMetrics(trips: Trip[], fuels: FuelLog[]): DashboardMetrics {
  const today = new Date().toDateString()

  const grossRevenue = trips.reduce((sum, t) => sum + Number(t.fare || 0), 0)
  const fuelExpense = fuels.reduce((sum, f) => sum + Number(f.cost_amount || 0), 0)
  const netProfit = grossRevenue - fuelExpense

  const totalTrips = trips.length
  const regularTrips = trips.filter((t) => t.trip_type === "Regular").length
  const vipTrips = trips.filter((t) => t.trip_type === "VIP").length
  const vipRatio = totalTrips > 0 ? Math.round((vipTrips / totalTrips) * 100) : 0
  const pendingAudits = trips.filter((t) => t.status === "Pending").length

  const todayRevenue = trips
    .filter((t) => new Date(t.logged_at).toDateString() === today)
    .reduce((sum, t) => sum + Number(t.fare || 0), 0)

  const todayFuel = fuels
    .filter((f) => new Date(f.logged_at).toDateString() === today)
    .reduce((sum, f) => sum + Number(f.cost_amount || 0), 0)

  return {
    grossRevenue,
    fuelExpense,
    netProfit,
    totalTrips,
    regularTrips,
    vipTrips,
    vipRatio,
    pendingAudits,
    todayRevenue,
    todayFuel,
  }
}

// ==========================================
// 1. GET INITIAL DATA
// ==========================================
export async function getInitialData(): Promise<{
  locations: Location[]
  driver: Driver
  todayTrips: Trip[]
  recentTrips: Trip[]
  fuelLogs: FuelLog[]
  ledgerEntries: LedgerEntry[]
  metrics: DashboardMetrics
  dbMode: "neon" | "mock"
}> {
  // Ensure DB is initialized if Neon is configured
  const { mode } = await initDb()
  const sql = getDbClient()

  if (mode === "neon" && sql) {
    try {
      const locationsRes = (await sql`
        SELECT * FROM locations WHERE is_active = true ORDER BY order_priority ASC, name ASC;
      `) as Location[]

      const driverRes = (await sql`
        SELECT * FROM drivers LIMIT 1;
      `) as Driver[]

      const tripsRes = (await sql`
        SELECT * FROM trips ORDER BY logged_at DESC;
      `) as Trip[]

      const fuelRes = (await sql`
        SELECT * FROM fuel_logs ORDER BY logged_at DESC;
      `) as FuelLog[]

      const parsedTrips: Trip[] = tripsRes.map((t) => ({
        ...t,
        fare: Number(t.fare),
      }))

      const parsedFuels: FuelLog[] = fuelRes.map((f) => ({
        ...f,
        cost_amount: Number(f.cost_amount),
        liters: Number(f.liters),
        odometer: f.odometer !== null ? Number(f.odometer) : null,
      }))

      const today = new Date().toDateString()
      const todayTrips = parsedTrips.filter(
        (t) => new Date(t.logged_at).toDateString() === today
      )

      return {
        locations: locationsRes,
        driver: driverRes[0] || mockStore.drivers[0],
        todayTrips,
        recentTrips: parsedTrips,
        fuelLogs: parsedFuels,
        ledgerEntries: buildLedgerEntries(parsedTrips, parsedFuels),
        metrics: calculateDashboardMetrics(parsedTrips, parsedFuels),
        dbMode: "neon",
      }
    } catch (err) {
      console.error("[FleetPulse DB] Neon query failed, falling back to mock data:", err)
    }
  }

  // Fallback to in-memory store
  const today = new Date().toDateString()
  const todayTrips = mockStore.trips.filter(
    (t) => new Date(t.logged_at).toDateString() === today
  )

  return {
    locations: [...mockStore.locations].sort((a, b) => a.order_priority - b.order_priority),
    driver: mockStore.drivers[0],
    todayTrips,
    recentTrips: [...mockStore.trips],
    fuelLogs: [...mockStore.fuelLogs],
    ledgerEntries: buildLedgerEntries(mockStore.trips, mockStore.fuelLogs),
    metrics: calculateDashboardMetrics(mockStore.trips, mockStore.fuelLogs),
    dbMode: "mock",
  }
}

// ==========================================
// 2. LOG TRIP
// ==========================================
export interface LogTripInput {
  driverId?: string
  originName: string
  destinationName: string
  tripType: "Regular" | "VIP"
  fare: number
  paymentMethod: "Cash" | "Card" | "Account" | string
  note?: string
  status?: "Approved" | "Pending"
  loggedAt?: string
}

export async function logTrip(data: LogTripInput): Promise<{ success: boolean; trip: Trip; error?: string }> {
  try {
    if (!data.originName || !data.destinationName) {
      throw new Error("Origin and Destination are required.")
    }
    if (!data.fare || data.fare <= 0) {
      throw new Error("Fare amount must be greater than zero.")
    }

    const tripId = `trip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const loggedAt = data.loggedAt || new Date().toISOString()
    const status = data.status || "Pending"
    const fare = Number(data.fare)
    const driverId = data.driverId || "driver_thabo_01"
    const note = data.note ? data.note.trim() : null

    const sql = getDbClient()
    if (isNeonConfigured() && sql) {
      await initDb()
      const rows = (await sql`
        INSERT INTO trips (id, driver_id, origin_name, destination_name, trip_type, fare, payment_method, note, status, logged_at)
        VALUES (${tripId}, ${driverId}, ${data.originName}, ${data.destinationName}, ${data.tripType}, ${fare}, ${data.paymentMethod}, ${note}, ${status}, ${loggedAt})
        RETURNING *;
      `) as Trip[]

      const inserted = rows[0]
      return {
        success: true,
        trip: { ...inserted, fare: Number(inserted.fare) },
      }
    }

    // In-memory fallback
    const inserted = mockStore.addTrip({
      id: tripId,
      driver_id: driverId,
      origin_name: data.originName,
      destination_name: data.destinationName,
      trip_type: data.tripType,
      fare,
      payment_method: data.paymentMethod,
      note,
      status,
      logged_at: loggedAt,
    })

    return { success: true, trip: inserted }
  } catch (error: any) {
    console.error("[FleetPulse Server Action] Error logging trip:", error)
    return { success: false, trip: null as any, error: error.message || "Failed to log trip" }
  }
}

// ==========================================
// 3. LOG FUEL
// ==========================================
export interface LogFuelInput {
  driverId?: string
  stationName: string
  costAmount: number
  liters: number
  odometer?: number
  loggedAt?: string
}

export async function logFuel(data: LogFuelInput): Promise<{ success: boolean; fuelLog: FuelLog; error?: string }> {
  try {
    if (!data.stationName) {
      throw new Error("Fuel station name is required.")
    }
    if (!data.costAmount || data.costAmount <= 0) {
      throw new Error("Cost amount must be greater than zero.")
    }
    if (!data.liters || data.liters <= 0) {
      throw new Error("Liters must be greater than zero.")
    }

    const fuelId = `fuel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const loggedAt = data.loggedAt || new Date().toISOString()
    const driverId = data.driverId || "driver_thabo_01"
    const cost = Number(data.costAmount)
    const liters = Number(data.liters)
    const odo = data.odometer ? Number(data.odometer) : null

    const sql = getDbClient()
    if (isNeonConfigured() && sql) {
      await initDb()
      const rows = (await sql`
        INSERT INTO fuel_logs (id, driver_id, station_name, cost_amount, liters, odometer, logged_at)
        VALUES (${fuelId}, ${driverId}, ${data.stationName}, ${cost}, ${liters}, ${odo}, ${loggedAt})
        RETURNING *;
      `) as FuelLog[]

      const inserted = rows[0]
      return {
        success: true,
        fuelLog: {
          ...inserted,
          cost_amount: Number(inserted.cost_amount),
          liters: Number(inserted.liters),
          odometer: inserted.odometer !== null ? Number(inserted.odometer) : null,
        },
      }
    }

    // In-memory fallback
    const inserted = mockStore.addFuelLog({
      id: fuelId,
      driver_id: driverId,
      station_name: data.stationName,
      cost_amount: cost,
      liters,
      odometer: odo,
      logged_at: loggedAt,
    })

    return { success: true, fuelLog: inserted }
  } catch (error: any) {
    console.error("[FleetPulse Server Action] Error logging fuel:", error)
    return { success: false, fuelLog: null as any, error: error.message || "Failed to log fuel" }
  }
}

// ==========================================
// 4. ADD LOCATION
// ==========================================
export async function addLocation(name: string): Promise<{ success: boolean; location: Location; error?: string }> {
  try {
    const cleanName = name.trim()
    if (!cleanName) {
      throw new Error("Location name cannot be empty.")
    }

    const sql = getDbClient()
    if (isNeonConfigured() && sql) {
      await initDb()
      const existing = (await sql`
        SELECT * FROM locations WHERE LOWER(name) = LOWER(${cleanName}) LIMIT 1;
      `) as Location[]

      if (existing.length > 0) {
        return { success: true, location: existing[0] }
      }

      const id = `loc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      const countRes = await sql`SELECT count(*) as total FROM locations;`
      const priority = Number(countRes[0]?.total || 0) + 1

      const rows = (await sql`
        INSERT INTO locations (id, name, is_active, order_priority, created_at)
        VALUES (${id}, ${cleanName}, true, ${priority}, NOW())
        RETURNING *;
      `) as Location[]

      return { success: true, location: rows[0] }
    }

    // In-memory fallback
    const loc = mockStore.addLocation(cleanName)
    return { success: true, location: loc }
  } catch (error: any) {
    console.error("[FleetPulse Server Action] Error adding location:", error)
    return { success: false, location: null as any, error: error.message || "Failed to add location" }
  }
}

// ==========================================
// 5. UPDATE TRIP STATUS (AUDIT APPROVAL/REJECTION)
// ==========================================
export async function updateTripStatus(
  tripId: string,
  status: "Approved" | "Pending" | "Rejected"
): Promise<{ success: boolean; trip: Trip | null; error?: string }> {
  try {
    const sql = getDbClient()
    if (isNeonConfigured() && sql) {
      await initDb()
      const rows = (await sql`
        UPDATE trips
        SET status = ${status}
        WHERE id = ${tripId}
        RETURNING *;
      `) as Trip[]

      if (rows.length === 0) {
        return { success: false, trip: null, error: "Trip not found" }
      }

      return {
        success: true,
        trip: { ...rows[0], fare: Number(rows[0].fare) },
      }
    }

    // In-memory fallback
    const updated = mockStore.updateTripStatus(tripId, status)
    if (!updated) {
      return { success: false, trip: null, error: "Trip not found" }
    }

    return { success: true, trip: updated }
  } catch (error: any) {
    console.error("[FleetPulse Server Action] Error updating trip status:", error)
    return { success: false, trip: null, error: error.message || "Failed to update trip status" }
  }
}

// ==========================================
// 6. GET ANALYTICS
// ==========================================
export async function getAnalytics(
  dateRange: "today" | "7days" | "30days" | "all" = "all"
): Promise<AnalyticsData> {
  const { recentTrips, fuelLogs } = await getInitialData()

  const now = new Date()
  let cutoff = new Date(0) // epoch for 'all'

  if (dateRange === "today") {
    cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  } else if (dateRange === "7days") {
    cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else if (dateRange === "30days") {
    cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }

  const filteredTrips = recentTrips.filter((t) => new Date(t.logged_at) >= cutoff)
  const filteredFuels = fuelLogs.filter((f) => new Date(f.logged_at) >= cutoff)

  const revenue = filteredTrips.reduce((sum, t) => sum + Number(t.fare || 0), 0)
  const fuelCost = filteredFuels.reduce((sum, f) => sum + Number(f.cost_amount || 0), 0)
  const netProfit = revenue - fuelCost
  const tripCount = filteredTrips.length
  const vipTrips = filteredTrips.filter((t) => t.trip_type === "VIP").length
  const regularTrips = filteredTrips.filter((t) => t.trip_type === "Regular").length
  const vipRatio = tripCount > 0 ? Math.round((vipTrips / tripCount) * 100) : 0
  const avgTripFare = tripCount > 0 ? Math.round((revenue / tripCount) * 100) / 100 : 0

  // Corridor route calculation
  const corridorMap: Record<string, { trips: number; revenue: number }> = {}
  for (const t of filteredTrips) {
    const route = `${t.origin_name} → ${t.destination_name}`
    if (!corridorMap[route]) {
      corridorMap[route] = { trips: 0, revenue: 0 }
    }
    corridorMap[route].trips += 1
    corridorMap[route].revenue += Number(t.fare || 0)
  }

  const topCorridors = Object.entries(corridorMap)
    .map(([route, stats]) => ({ route, trips: stats.trips, revenue: stats.revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Daily statistics calculation (last 7 days by default)
  const days = 7
  const dailyStats: { date: string; revenue: number; fuel: number; trips: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - i)
    const dateStr = targetDate.toISOString().split("T")[0]
    const label = targetDate.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric" })

    const dayTrips = filteredTrips.filter(
      (t) => t.logged_at.split("T")[0] === dateStr
    )
    const dayFuels = filteredFuels.filter(
      (f) => f.logged_at.split("T")[0] === dateStr
    )

    const dayRev = dayTrips.reduce((sum, t) => sum + Number(t.fare || 0), 0)
    const dayFuel = dayFuels.reduce((sum, f) => sum + Number(f.cost_amount || 0), 0)

    dailyStats.push({
      date: label,
      revenue: dayRev,
      fuel: dayFuel,
      trips: dayTrips.length,
    })
  }

  return {
    revenue,
    fuelCost,
    netProfit,
    tripCount,
    vipTrips,
    regularTrips,
    vipRatio,
    avgTripFare,
    topCorridors,
    dailyStats,
  }
}
