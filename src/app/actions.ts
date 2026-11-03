"use server"

import {
  initDb,
  getDbClient,
  isNeonConfigured,
  mockStore,
  computeInitials,
  cleanSlateDatabase,
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
    driver_name: t.driver_name || "Thabo Mokoena",
    driver_initials: t.driver_initials || "TM",
    vehicle: t.vehicle || "Toyota Quantum (GP 482-901)",
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
    driver_name: f.driver_name || "Thabo Mokoena",
    vehicle: f.vehicle || "Toyota Quantum (GP 482-901)",
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
// 1. GET INITIAL DATA (REAL & LIVE)
// ==========================================
export async function getInitialData(): Promise<{
  locations: Location[]
  drivers: Driver[]
  activeDriver: Driver
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

      const driversRes = (await sql`
        SELECT * FROM drivers WHERE status = 'ACTIVE' ORDER BY created_at ASC;
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

      const fallbackDriver: Driver = driversRes[0] || mockStore.drivers[0]

      return {
        locations: locationsRes,
        drivers: driversRes.length > 0 ? driversRes : mockStore.drivers,
        activeDriver: fallbackDriver,
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
    drivers: [...mockStore.drivers],
    activeDriver: mockStore.drivers[0],
    todayTrips,
    recentTrips: [...mockStore.trips],
    fuelLogs: [...mockStore.fuelLogs],
    ledgerEntries: buildLedgerEntries(mockStore.trips, mockStore.fuelLogs),
    metrics: calculateDashboardMetrics(mockStore.trips, mockStore.fuelLogs),
    dbMode: "mock",
  }
}

// ==========================================
// 2. DRIVER MANAGEMENT ACTIONS
// ==========================================
export async function getDrivers(): Promise<Driver[]> {
  const sql = getDbClient()
  if (isNeonConfigured() && sql) {
    try {
      await initDb()
      return (await sql`SELECT * FROM drivers WHERE status = 'ACTIVE' ORDER BY name ASC;`) as Driver[]
    } catch (e) {
      console.error("Failed to fetch drivers from Neon:", e)
    }
  }
  return mockStore.getDrivers()
}

export async function createDriver(data: {
  name: string
  vehicle: string
  phone?: string
}): Promise<{ success: boolean; driver: Driver; error?: string }> {
  try {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Driver name is required.")
    }
    const name = data.name.trim()
    const vehicle = data.vehicle ? data.vehicle.trim() : "Toyota Quantum (GP 482-901)"
    const initials = computeInitials(name)
    const driverId = `driver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    const colors = ["#10B981", "#F59E0B", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6"]
    const avatarColor = colors[Math.floor(Math.random() * colors.length)]

    const sql = getDbClient()
    if (isNeonConfigured() && sql) {
      await initDb()
      const rows = (await sql`
        INSERT INTO drivers (id, name, phone, avatar_color, initials, vehicle, status, created_at)
        VALUES (${driverId}, ${name}, ${data.phone || ""}, ${avatarColor}, ${initials}, ${vehicle}, 'ACTIVE', NOW())
        RETURNING *;
      `) as Driver[]
      return { success: true, driver: rows[0] }
    }

    const created = mockStore.addDriver(name, vehicle, data.phone)
    return { success: true, driver: created }
  } catch (err: unknown) {
    return { success: false, driver: null as unknown as Driver, error: (err as Error).message }
  }
}

export async function updateDriverVehicle(
  driverId: string,
  vehicle: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const trimmed = vehicle.trim()
    const sql = getDbClient()
    if (isNeonConfigured() && sql) {
      await initDb()
      await sql`UPDATE drivers SET vehicle = ${trimmed} WHERE id = ${driverId};`
    }
    mockStore.updateDriverVehicle(driverId, trimmed)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

// ==========================================
// 3. LOG TRIP (DRIVER DIRECT FARE ENTRY)
// ==========================================
export interface LogTripInput {
  driverId?: string
  driverName?: string
  driverInitials?: string
  vehicle?: string
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
    const status = data.status || "Approved"
    const fare = Number(data.fare)
    const driverId = data.driverId || "driver_thabo_01"
    const driverName = data.driverName || "Thabo Mokoena"
    const driverInitials = data.driverInitials || computeInitials(driverName)
    const vehicle = data.vehicle || "Toyota Quantum (GP 482-901)"
    const note = data.note ? data.note.trim() : null

    const sql = getDbClient()
    if (isNeonConfigured() && sql) {
      await initDb()
      const rows = (await sql`
        INSERT INTO trips (id, driver_id, driver_name, driver_initials, vehicle, origin_name, destination_name, trip_type, fare, payment_method, note, status, logged_at)
        VALUES (${tripId}, ${driverId}, ${driverName}, ${driverInitials}, ${vehicle}, ${data.originName}, ${data.destinationName}, ${data.tripType}, ${fare}, ${data.paymentMethod}, ${note}, ${status}, ${loggedAt})
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
      driver_name: driverName,
      driver_initials: driverInitials,
      vehicle: vehicle,
      origin_name: data.originName,
      destination_name: data.destinationName,
      trip_type: data.tripType,
      fare: fare,
      payment_method: data.paymentMethod,
      note: note,
      status: status,
      logged_at: loggedAt,
    })

    return { success: true, trip: inserted }
  } catch (err: unknown) {
    return {
      success: false,
      trip: null as unknown as Trip,
      error: (err as Error).message || "Failed to log trip.",
    }
  }
}

// ==========================================
// 4. LOG FUEL ENTRY
// ==========================================
export interface LogFuelInput {
  driverId?: string
  driverName?: string
  vehicle?: string
  stationName: string
  costAmount: number
  liters: number
  odometer?: number
  loggedAt?: string
}

export async function logFuel(data: LogFuelInput): Promise<{ success: boolean; fuelLog: FuelLog; error?: string }> {
  try {
    if (!data.stationName || data.stationName.trim().length === 0) {
      throw new Error("Fuel station location is required.")
    }
    if (!data.costAmount || data.costAmount <= 0) {
      throw new Error("Fuel cost amount must be greater than zero.")
    }
    if (!data.liters || data.liters <= 0) {
      throw new Error("Fuel liters must be greater than zero.")
    }

    const fuelId = `fuel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const loggedAt = data.loggedAt || new Date().toISOString()
    const cost = Number(data.costAmount)
    const liters = Number(data.liters)
    const odometer = data.odometer ? Number(data.odometer) : null
    const driverId = data.driverId || "driver_thabo_01"
    const driverName = data.driverName || "Thabo Mokoena"
    const vehicle = data.vehicle || "Toyota Quantum (GP 482-901)"

    const sql = getDbClient()
    if (isNeonConfigured() && sql) {
      await initDb()
      const rows = (await sql`
        INSERT INTO fuel_logs (id, driver_id, driver_name, vehicle, station_name, cost_amount, liters, odometer, logged_at)
        VALUES (${fuelId}, ${driverId}, ${driverName}, ${vehicle}, ${data.stationName.trim()}, ${cost}, ${liters}, ${odometer}, ${loggedAt})
        RETURNING *;
      `) as FuelLog[]

      const inserted = rows[0]
      return {
        success: true,
        fuelLog: {
          ...inserted,
          cost_amount: Number(inserted.cost_amount),
          liters: Number(inserted.liters),
        },
      }
    }

    // In-memory fallback
    const inserted = mockStore.addFuelLog({
      id: fuelId,
      driver_id: driverId,
      driver_name: driverName,
      vehicle: vehicle,
      station_name: data.stationName.trim(),
      cost_amount: cost,
      liters: liters,
      odometer: odometer,
      logged_at: loggedAt,
    })

    return { success: true, fuelLog: inserted }
  } catch (err: unknown) {
    return {
      success: false,
      fuelLog: null as unknown as FuelLog,
      error: (err as Error).message || "Failed to log fuel refill.",
    }
  }
}

// ==========================================
// 5. ADD LOCATION (ON-THE-FLY BY DRIVER OR ADMIN)
// ==========================================
export async function addLocation(name: string): Promise<{ success: boolean; location: Location; error?: string }> {
  try {
    const trimmed = name ? name.trim() : ""
    if (!trimmed || trimmed.length < 2) {
      throw new Error("Location name must be at least 2 characters.")
    }

    const sql = getDbClient()
    if (isNeonConfigured() && sql) {
      await initDb()
      const locId = `loc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      const maxOrderRes = (await sql`SELECT COALESCE(MAX(order_priority), 0) as max FROM locations;`) as { max: number }[]
      const nextOrder = Number(maxOrderRes[0]?.max || 0) + 1

      const rows = (await sql`
        INSERT INTO locations (id, name, is_active, order_priority, created_at)
        VALUES (${locId}, ${trimmed}, true, ${nextOrder}, NOW())
        ON CONFLICT (name) DO UPDATE SET is_active = true
        RETURNING *;
      `) as Location[]

      return { success: true, location: rows[0] }
    }

    const loc = mockStore.addLocation(trimmed)
    return { success: true, location: loc }
  } catch (err: unknown) {
    return {
      success: false,
      location: null as unknown as Location,
      error: (err as Error).message || "Failed to add location.",
    }
  }
}

// ==========================================
// 6. UPDATE TRIP STATUS
// ==========================================
export async function updateTripStatus(
  tripId: string,
  status: "Approved" | "Pending" | "Rejected"
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = getDbClient()
    if (isNeonConfigured() && sql) {
      await initDb()
      await sql`UPDATE trips SET status = ${status} WHERE id = ${tripId};`
      return { success: true }
    }

    mockStore.updateTripStatus(tripId, status)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || "Failed to update trip status." }
  }
}

// ==========================================
// 7. GET ANALYTICS
// ==========================================
export async function getAnalytics(range: "today" | "7days" | "30days" | "all" = "all"): Promise<AnalyticsData> {
  const { recentTrips, fuelLogs } = await getInitialData()

  const now = new Date()
  let cutoff = new Date(0)

  if (range === "today") {
    cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (range === "7days") {
    cutoff = new Date(now.getTime() - 7 * 86400000)
  } else if (range === "30days") {
    cutoff = new Date(now.getTime() - 30 * 86400000)
  }

  const filteredTrips = recentTrips.filter((t) => new Date(t.logged_at) >= cutoff)
  const filteredFuels = fuelLogs.filter((f) => new Date(f.logged_at) >= cutoff)

  const revenue = filteredTrips.reduce((acc, t) => acc + Number(t.fare || 0), 0)
  const fuelCost = filteredFuels.reduce((acc, f) => acc + Number(f.cost_amount || 0), 0)
  const netProfit = revenue - fuelCost

  const tripCount = filteredTrips.length
  const vipTrips = filteredTrips.filter((t) => t.trip_type === "VIP").length
  const regularTrips = filteredTrips.filter((t) => t.trip_type === "Regular").length
  const vipRatio = tripCount > 0 ? Math.round((vipTrips / tripCount) * 100) : 0
  const avgTripFare = tripCount > 0 ? Math.round(revenue / tripCount) : 0

  // Corridor route volume
  const corridorMap = new Map<string, { trips: number; revenue: number }>()
  filteredTrips.forEach((t) => {
    const route = `${t.origin_name} → ${t.destination_name}`
    const existing = corridorMap.get(route) || { trips: 0, revenue: 0 }
    corridorMap.set(route, {
      trips: existing.trips + 1,
      revenue: existing.revenue + Number(t.fare || 0),
    })
  })

  const topCorridors = Array.from(corridorMap.entries())
    .map(([route, stats]) => ({ route, trips: stats.trips, revenue: stats.revenue }))
    .sort((a, b) => b.trips - a.trips)
    .slice(0, 5)

  // Daily Stats for line chart
  const dailyMap = new Map<string, { revenue: number; fuel: number; trips: number }>()
  filteredTrips.forEach((t) => {
    const day = new Date(t.logged_at).toISOString().split("T")[0]
    const cur = dailyMap.get(day) || { revenue: 0, fuel: 0, trips: 0 }
    dailyMap.set(day, { ...cur, revenue: cur.revenue + Number(t.fare), trips: cur.trips + 1 })
  })
  filteredFuels.forEach((f) => {
    const day = new Date(f.logged_at).toISOString().split("T")[0]
    const cur = dailyMap.get(day) || { revenue: 0, fuel: 0, trips: 0 }
    dailyMap.set(day, { ...cur, fuel: cur.fuel + Number(f.cost_amount) })
  })

  const dailyStats = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))

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

// ==========================================
// 8. PURGE ALL SEED DATA (CLEAN SLATE RESET)
// ==========================================
export async function purgeAllSeedData(): Promise<{ success: boolean; message: string }> {
  return await cleanSlateDatabase()
}
