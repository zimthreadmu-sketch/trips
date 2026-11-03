import { neon, type NeonQueryFunction } from "@neondatabase/serverless"

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface Location {
  id: string
  name: string
  is_active: boolean
  order_priority: number
  created_at: string
}

export interface Driver {
  id: string
  name: string
  phone: string
  avatar_color: string
  initials: string
  vehicle: string
  status: "ACTIVE" | "OFF_DUTY" | "INACTIVE"
  created_at: string
}

export interface Trip {
  id: string
  driver_id: string
  origin_name: string
  destination_name: string
  trip_type: "Regular" | "VIP"
  fare: number
  payment_method: "Cash" | "Card" | "Account" | string
  note: string | null
  status: "Approved" | "Pending" | "Rejected"
  logged_at: string
}

export interface FuelLog {
  id: string
  driver_id: string
  station_name: string
  cost_amount: number
  liters: number
  odometer: number | null
  logged_at: string
}

export interface PricingSetting {
  id: string
  key: string
  value: string
}

export interface PricingRule {
  id: string
  origin_id: string
  destination_id: string
  regular_fare: number
  vip_fare: number
  created_at: string
}

export interface LedgerEntry {
  id: string
  type: "trip" | "fuel"
  time: string
  title: string
  detail: string
  amount: string
  numericAmount: number
  tone: "green" | "gold" | "red"
  status?: "Approved" | "Pending" | "Rejected"
  timestamp: string
}

export interface DashboardMetrics {
  grossRevenue: number
  fuelExpense: number
  netProfit: number
  totalTrips: number
  regularTrips: number
  vipTrips: number
  vipRatio: number
  pendingAudits: number
  todayRevenue: number
  todayFuel: number
}

export interface AnalyticsData {
  revenue: number
  fuelCost: number
  netProfit: number
  tripCount: number
  vipTrips: number
  regularTrips: number
  vipRatio: number
  avgTripFare: number
  topCorridors: { route: string; trips: number; revenue: number }[]
  dailyStats: { date: string; revenue: number; fuel: number; trips: number }[]
}

// ==========================================
// SEED DATA FOR MOCK & FIRST-TIME NEON DB
// ==========================================

const SEED_LOCATIONS: Location[] = [
  { id: "loc_booysens", name: "Booysens", is_active: true, order_priority: 1, created_at: new Date(Date.now() - 86400000 * 30).toISOString() },
  { id: "loc_rosettenville", name: "Rosettenville", is_active: true, order_priority: 2, created_at: new Date(Date.now() - 86400000 * 30).toISOString() },
  { id: "loc_jhbcbd", name: "JHB CBD", is_active: true, order_priority: 3, created_at: new Date(Date.now() - 86400000 * 30).toISOString() },
  { id: "loc_southgate", name: "Southgate", is_active: true, order_priority: 4, created_at: new Date(Date.now() - 86400000 * 30).toISOString() },
  { id: "loc_sandton", name: "Sandton", is_active: true, order_priority: 5, created_at: new Date(Date.now() - 86400000 * 30).toISOString() },
  { id: "loc_rosebank", name: "Rosebank", is_active: true, order_priority: 6, created_at: new Date(Date.now() - 86400000 * 30).toISOString() },
  { id: "loc_goldreef", name: "Gold Reef City", is_active: true, order_priority: 7, created_at: new Date(Date.now() - 86400000 * 30).toISOString() },
]

const SEED_DRIVER: Driver = {
  id: "driver_thabo_01",
  name: "Thabo Mokoena",
  phone: "+27 82 459 1024",
  avatar_color: "#E5A93C",
  initials: "TM",
  vehicle: "Toyota Quantum (GP 482-901)",
  status: "ACTIVE",
  created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
}

// Generate relative dates for realistic presentation
function getRelativeDate(daysAgo: number, hour: number, minute: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

const SEED_TRIPS: Trip[] = [
  {
    id: "trip_001",
    driver_id: "driver_thabo_01",
    origin_name: "Booysens",
    destination_name: "Rosettenville",
    trip_type: "Regular",
    fare: 60.0,
    payment_method: "Cash",
    note: "Morning commuter drop-off",
    status: "Approved",
    logged_at: getRelativeDate(0, 9, 42),
  },
  {
    id: "trip_002",
    driver_id: "driver_thabo_01",
    origin_name: "Rosettenville",
    destination_name: "Sandton",
    trip_type: "VIP",
    fare: 350.0,
    payment_method: "Account",
    note: "Corporate shuttle booking · VIP direct",
    status: "Approved",
    logged_at: getRelativeDate(0, 8, 15),
  },
  {
    id: "trip_003",
    driver_id: "driver_thabo_01",
    origin_name: "JHB CBD",
    destination_name: "Southgate",
    trip_type: "Regular",
    fare: 120.0,
    payment_method: "Card",
    note: "Evening commute",
    status: "Approved",
    logged_at: getRelativeDate(1, 17, 35),
  },
  {
    id: "trip_004",
    driver_id: "driver_thabo_01",
    origin_name: "Gold Reef City",
    destination_name: "Rosebank",
    trip_type: "VIP",
    fare: 420.0,
    payment_method: "Account",
    note: "Hotel conference transfer",
    status: "Approved",
    logged_at: getRelativeDate(1, 15, 10),
  },
  {
    id: "trip_005",
    driver_id: "driver_thabo_01",
    origin_name: "Booysens",
    destination_name: "JHB CBD",
    trip_type: "Regular",
    fare: 90.0,
    payment_method: "Cash",
    note: "Standard route passenger",
    status: "Pending",
    logged_at: getRelativeDate(1, 12, 22),
  },
  {
    id: "trip_006",
    driver_id: "driver_thabo_01",
    origin_name: "Rosebank",
    destination_name: "Sandton",
    trip_type: "VIP",
    fare: 380.0,
    payment_method: "Account",
    note: "Late executive shuttle",
    status: "Pending",
    logged_at: getRelativeDate(2, 20, 15),
  },
  {
    id: "trip_007",
    driver_id: "driver_thabo_01",
    origin_name: "Sandton",
    destination_name: "JHB CBD",
    trip_type: "Regular",
    fare: 140.0,
    payment_method: "Card",
    note: "Midday direct",
    status: "Approved",
    logged_at: getRelativeDate(2, 13, 0),
  },
  {
    id: "trip_008",
    driver_id: "driver_thabo_01",
    origin_name: "Southgate",
    destination_name: "Rosettenville",
    trip_type: "Regular",
    fare: 80.0,
    payment_method: "Cash",
    note: "Express",
    status: "Approved",
    logged_at: getRelativeDate(3, 10, 45),
  },
]

const SEED_FUEL: FuelLog[] = [
  {
    id: "fuel_001",
    driver_id: "driver_thabo_01",
    station_name: "Shell Garage Rosettenville",
    cost_amount: 350.0,
    liters: 15.4,
    odometer: 184250,
    logged_at: getRelativeDate(0, 7, 28),
  },
  {
    id: "fuel_002",
    driver_id: "driver_thabo_01",
    station_name: "Engen Booysens",
    cost_amount: 500.0,
    liters: 22.0,
    odometer: 183890,
    logged_at: getRelativeDate(2, 14, 10),
  },
  {
    id: "fuel_003",
    driver_id: "driver_thabo_01",
    station_name: "TotalEnergies Gold Reef",
    cost_amount: 420.0,
    liters: 18.5,
    odometer: 183420,
    logged_at: getRelativeDate(4, 8, 45),
  },
]

const SEED_PRICING_SETTINGS: PricingSetting[] = [
  { id: "set_regular_base", key: "regular_base_fare", value: "60.00" },
  { id: "set_vip_base", key: "vip_base_fare", value: "350.00" },
  { id: "set_fuel_target", key: "fuel_target_budget", value: "1500.00" },
]

// ==========================================
// IN-MEMORY FALLBACK STORE (ACTIVE WHEN DATABASE_URL IS NOT SET)
// ==========================================

class InMemoryStore {
  locations: Location[] = [...SEED_LOCATIONS]
  drivers: Driver[] = [SEED_DRIVER]
  trips: Trip[] = [...SEED_TRIPS]
  fuelLogs: FuelLog[] = [...SEED_FUEL]
  pricingSettings: PricingSetting[] = [...SEED_PRICING_SETTINGS]

  addLocation(name: string): Location {
    const existing = this.locations.find((l) => l.name.toLowerCase() === name.trim().toLowerCase())
    if (existing) return existing
    const newLoc: Location = {
      id: `loc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      is_active: true,
      order_priority: this.locations.length + 1,
      created_at: new Date().toISOString(),
    }
    this.locations.push(newLoc)
    return newLoc
  }

  addTrip(trip: Omit<Trip, "id" | "logged_at"> & { id?: string; logged_at?: string }): Trip {
    const newTrip: Trip = {
      id: trip.id || `trip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      driver_id: trip.driver_id || SEED_DRIVER.id,
      origin_name: trip.origin_name,
      destination_name: trip.destination_name,
      trip_type: trip.trip_type,
      fare: Number(trip.fare),
      payment_method: trip.payment_method || "Cash",
      note: trip.note || null,
      status: trip.status || "Pending",
      logged_at: trip.logged_at || new Date().toISOString(),
    }
    this.trips.unshift(newTrip)
    return newTrip
  }

  addFuelLog(fuel: Omit<FuelLog, "id" | "logged_at"> & { id?: string; logged_at?: string }): FuelLog {
    const newFuel: FuelLog = {
      id: fuel.id || `fuel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      driver_id: fuel.driver_id || SEED_DRIVER.id,
      station_name: fuel.station_name,
      cost_amount: Number(fuel.cost_amount),
      liters: Number(fuel.liters),
      odometer: fuel.odometer !== undefined && fuel.odometer !== null ? Number(fuel.odometer) : null,
      logged_at: fuel.logged_at || new Date().toISOString(),
    }
    this.fuelLogs.unshift(newFuel)
    return newFuel
  }

  updateTripStatus(tripId: string, status: "Approved" | "Pending" | "Rejected"): Trip | null {
    const trip = this.trips.find((t) => t.id === tripId)
    if (!trip) return null
    trip.status = status
    return trip
  }
}

// Global singleton for the in-memory store in dev/preview
const globalForStore = globalThis as unknown as { __fleetpulse_in_memory_store?: InMemoryStore }
export const mockStore = globalForStore.__fleetpulse_in_memory_store ?? new InMemoryStore()
if (process.env.NODE_ENV !== "production") {
  globalForStore.__fleetpulse_in_memory_store = mockStore
}

// ==========================================
// NEON DATABASE CLIENT & AUTO-MIGRATION
// ==========================================

let neonSql: NeonQueryFunction<false, false> | null = null
let isDbInitialized = false

export function isNeonConfigured(): boolean {
  const url = process.env.DATABASE_URL
  return Boolean(url && url.trim().length > 0 && !url.includes("placeholder"))
}

export function getDbClient(): NeonQueryFunction<false, false> | null {
  if (!isNeonConfigured()) {
    return null
  }
  if (!neonSql) {
    neonSql = neon(process.env.DATABASE_URL!)
  }
  return neonSql
}

/**
 * Initializes tables and seeds initial data in Neon PostgreSQL.
 * Safe to run multiple times (idempotent `CREATE TABLE IF NOT EXISTS` and `ON CONFLICT DO NOTHING`).
 */
export async function initDb(): Promise<{ mode: "neon" | "mock"; initialized: boolean }> {
  const sql = getDbClient()
  if (!sql) {
    return { mode: "mock", initialized: true }
  }

  if (isDbInitialized) {
    return { mode: "neon", initialized: true }
  }

  try {
    // 1. Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        order_priority INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS drivers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        avatar_color TEXT,
        initials TEXT,
        vehicle TEXT,
        status TEXT DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS pricing_rules (
        id TEXT PRIMARY KEY,
        origin_id TEXT,
        destination_id TEXT,
        regular_fare NUMERIC(10,2) NOT NULL,
        vip_fare NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        driver_id TEXT,
        origin_name TEXT NOT NULL,
        destination_name TEXT NOT NULL,
        trip_type TEXT NOT NULL,
        fare NUMERIC(10,2) NOT NULL,
        payment_method TEXT NOT NULL,
        note TEXT,
        status TEXT DEFAULT 'Pending',
        logged_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS fuel_logs (
        id TEXT PRIMARY KEY,
        driver_id TEXT,
        station_name TEXT NOT NULL,
        cost_amount NUMERIC(10,2) NOT NULL,
        liters NUMERIC(8,2) NOT NULL,
        odometer INT,
        logged_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS pricing_settings (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL
      );
    `

    // 2. Seed Default Driver
    await sql`
      INSERT INTO drivers (id, name, phone, avatar_color, initials, vehicle, status, created_at)
      VALUES (${SEED_DRIVER.id}, ${SEED_DRIVER.name}, ${SEED_DRIVER.phone}, ${SEED_DRIVER.avatar_color}, ${SEED_DRIVER.initials}, ${SEED_DRIVER.vehicle}, ${SEED_DRIVER.status}, ${SEED_DRIVER.created_at})
      ON CONFLICT (id) DO NOTHING;
    `

    // 3. Seed Default Locations
    for (const loc of SEED_LOCATIONS) {
      await sql`
        INSERT INTO locations (id, name, is_active, order_priority, created_at)
        VALUES (${loc.id}, ${loc.name}, ${loc.is_active}, ${loc.order_priority}, ${loc.created_at})
        ON CONFLICT (name) DO NOTHING;
      `
    }

    // 4. Seed Default Pricing Settings
    for (const setting of SEED_PRICING_SETTINGS) {
      await sql`
        INSERT INTO pricing_settings (id, key, value)
        VALUES (${setting.id}, ${setting.key}, ${setting.value})
        ON CONFLICT (key) DO NOTHING;
      `
    }

    // 5. Check if trips exist, if not seed initial sample trips
    const existingTrips = await sql`SELECT count(*) as count FROM trips;`
    if (Number(existingTrips[0]?.count || 0) === 0) {
      for (const trip of SEED_TRIPS) {
        await sql`
          INSERT INTO trips (id, driver_id, origin_name, destination_name, trip_type, fare, payment_method, note, status, logged_at)
          VALUES (${trip.id}, ${trip.driver_id}, ${trip.origin_name}, ${trip.destination_name}, ${trip.trip_type}, ${trip.fare}, ${trip.payment_method}, ${trip.note}, ${trip.status}, ${trip.logged_at})
          ON CONFLICT (id) DO NOTHING;
        `
      }
    }

    // 6. Check if fuel logs exist, if not seed initial sample fuel logs
    const existingFuel = await sql`SELECT count(*) as count FROM fuel_logs;`
    if (Number(existingFuel[0]?.count || 0) === 0) {
      for (const fuel of SEED_FUEL) {
        await sql`
          INSERT INTO fuel_logs (id, driver_id, station_name, cost_amount, liters, odometer, logged_at)
          VALUES (${fuel.id}, ${fuel.driver_id}, ${fuel.station_name}, ${fuel.cost_amount}, ${fuel.liters}, ${fuel.odometer}, ${fuel.logged_at})
          ON CONFLICT (id) DO NOTHING;
        `
      }
    }

    isDbInitialized = true
    return { mode: "neon", initialized: true }
  } catch (error) {
    console.error("[FleetPulse DB] Error initializing Neon DB, falling back to mock mode:", error)
    return { mode: "mock", initialized: false }
  }
}
