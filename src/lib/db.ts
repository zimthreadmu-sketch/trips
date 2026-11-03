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
  driver_name?: string
  driver_initials?: string
  vehicle?: string
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
  driver_name?: string
  vehicle?: string
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
  driver_name?: string
  driver_initials?: string
  vehicle?: string
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
// BASE STARTER DATA (LOCATIONS & DRIVERS ONLY - ZERO MOCK TRIPS/FUEL)
// ==========================================

export const SEED_LOCATIONS: Location[] = [
  { id: "loc_port_louis", name: "Port Louis", is_active: true, order_priority: 1, created_at: new Date().toISOString() },
  { id: "loc_grand_baie", name: "Grand Baie", is_active: true, order_priority: 2, created_at: new Date().toISOString() },
  { id: "loc_flic_en_flac", name: "Flic en Flac", is_active: true, order_priority: 3, created_at: new Date().toISOString() },
  { id: "loc_curepipe", name: "Curepipe", is_active: true, order_priority: 4, created_at: new Date().toISOString() },
  { id: "loc_ebene", name: "Ebene Cybercity", is_active: true, order_priority: 5, created_at: new Date().toISOString() },
  { id: "loc_airport", name: "SSR International Airport", is_active: true, order_priority: 6, created_at: new Date().toISOString() },
  { id: "loc_rose_hill", name: "Rose Hill", is_active: true, order_priority: 7, created_at: new Date().toISOString() },
  { id: "loc_tamarin", name: "Tamarin", is_active: true, order_priority: 8, created_at: new Date().toISOString() },
]

// ABSOLUTELY ZERO SAMPLE DRIVERS, TRIPS OR FUEL LOGS FOR LIVE PRODUCTION
export const SEED_TRIPS: Trip[] = []
export const SEED_FUEL: FuelLog[] = []

export const SEED_PRICING_SETTINGS: PricingSetting[] = [
  { id: "set_regular_base", key: "regular_base_fare", value: "60.00" },
  { id: "set_vip_base", key: "vip_base_fare", value: "350.00" },
  { id: "set_fuel_target", key: "fuel_target_budget", value: "1500.00" },
]

// Helper to compute initials from name
export function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return (name.trim().substring(0, 2) || "DR").toUpperCase()
}

// Color palettes for new drivers
const DRIVER_COLORS = ["#10B981", "#F59E0B", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6"]
function getDriverColor(index: number): string {
  return DRIVER_COLORS[index % DRIVER_COLORS.length]
}

// ==========================================
// IN-MEMORY FALLBACK STORE (CLEAN SLATE)
// ==========================================

class InMemoryStore {
  locations: Location[] = [...SEED_LOCATIONS]
  drivers: Driver[] = []
  trips: Trip[] = []
  fuelLogs: FuelLog[] = []
  pricingSettings: PricingSetting[] = [...SEED_PRICING_SETTINGS]

  getDrivers(): Driver[] {
    return this.drivers
  }

  addDriver(name: string, vehicle: string, phone?: string): Driver {
    const existing = this.drivers.find((d) => d.name.toLowerCase() === name.trim().toLowerCase())
    if (existing) {
      if (vehicle) existing.vehicle = vehicle
      return existing
    }
    const newDriver: Driver = {
      id: `driver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      phone: phone || "",
      avatar_color: getDriverColor(this.drivers.length),
      initials: computeInitials(name),
      vehicle: vehicle.trim() || "Toyota HiAce (4821 DC 18)",
      status: "ACTIVE",
      created_at: new Date().toISOString(),
    }
    this.drivers.push(newDriver)
    return newDriver
  }

  updateDriverVehicle(driverId: string, vehicle: string): Driver | null {
    const driver = this.drivers.find((d) => d.id === driverId)
    if (!driver) return null
    driver.vehicle = vehicle.trim()
    return driver
  }

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
    const driver = this.drivers.find((d) => d.id === trip.driver_id) || this.drivers[0] || null
    const newTrip: Trip = {
      id: trip.id || `trip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      driver_id: trip.driver_id || driver?.id || "",
      driver_name: trip.driver_name || driver?.name || "Driver",
      driver_initials: trip.driver_initials || driver?.initials || "DR",
      vehicle: trip.vehicle || driver?.vehicle || "Toyota HiAce (4821 DC 18)",
      origin_name: trip.origin_name,
      destination_name: trip.destination_name,
      trip_type: trip.trip_type,
      fare: Number(trip.fare) || 0,
      payment_method: trip.payment_method || "Cash",
      note: trip.note || null,
      status: trip.status || "Approved",
      logged_at: trip.logged_at || new Date().toISOString(),
    }
    this.trips.unshift(newTrip)
    return newTrip
  }

  addFuelLog(fuel: Omit<FuelLog, "id" | "logged_at"> & { id?: string; logged_at?: string }): FuelLog {
    const driver = this.drivers.find((d) => d.id === fuel.driver_id) || this.drivers[0] || null
    const newFuel: FuelLog = {
      id: fuel.id || `fuel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      driver_id: fuel.driver_id || driver?.id || "",
      driver_name: fuel.driver_name || driver?.name || "Driver",
      vehicle: fuel.vehicle || driver?.vehicle || "Toyota HiAce (4821 DC 18)",
      station_name: fuel.station_name,
      cost_amount: Number(fuel.cost_amount) || 0,
      liters: Number(fuel.liters) || 0,
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

  purgeData(): void {
    this.drivers = this.drivers.filter(d => d.id !== "driver_mru_01" && !d.name.toLowerCase().includes("jean-luc"))
    this.trips = []
    this.fuelLogs = []
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
 * Initializes tables in Neon PostgreSQL with schema updates.
 * Safe to run multiple times (idempotent).
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
        driver_name TEXT,
        driver_initials TEXT,
        vehicle TEXT,
        origin_name TEXT NOT NULL,
        destination_name TEXT NOT NULL,
        trip_type TEXT NOT NULL,
        fare NUMERIC(10,2) NOT NULL,
        payment_method TEXT NOT NULL,
        note TEXT,
        status TEXT DEFAULT 'Approved',
        logged_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    // Ensure columns exist if table was already created
    try {
      await sql`ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_name TEXT;`
      await sql`ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_initials TEXT;`
      await sql`ALTER TABLE trips ADD COLUMN IF NOT EXISTS vehicle TEXT;`
    } catch {
      // safe ignore
    }

    await sql`
      CREATE TABLE IF NOT EXISTS fuel_logs (
        id TEXT PRIMARY KEY,
        driver_id TEXT,
        driver_name TEXT,
        vehicle TEXT,
        station_name TEXT NOT NULL,
        cost_amount NUMERIC(10,2) NOT NULL,
        liters NUMERIC(8,2) NOT NULL,
        odometer INT,
        logged_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    try {
      await sql`ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS driver_name TEXT;`
      await sql`ALTER TABLE fuel_logs ADD COLUMN IF NOT EXISTS vehicle TEXT;`
    } catch {
      // safe ignore
    }

    await sql`
      CREATE TABLE IF NOT EXISTS pricing_settings (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL
      );
    `

    // Strictly non-destructive initialization: NEVER delete existing rows or tables on init

    // 2. Seed Default Locations if locations table is empty
    const existingLocations = await sql`SELECT count(*) as count FROM locations;`
    if (Number(existingLocations[0]?.count || 0) === 0) {
      for (const loc of SEED_LOCATIONS) {
        await sql`
          INSERT INTO locations (id, name, is_active, order_priority, created_at)
          VALUES (${loc.id}, ${loc.name}, ${loc.is_active}, ${loc.order_priority}, ${loc.created_at})
          ON CONFLICT (name) DO NOTHING;
        `
      }
    }

    // 4. Seed Default Pricing Settings
    for (const setting of SEED_PRICING_SETTINGS) {
      await sql`
        INSERT INTO pricing_settings (id, key, value)
        VALUES (${setting.id}, ${setting.key}, ${setting.value})
        ON CONFLICT (key) DO NOTHING;
      `
    }

    // NOTE: WE DO NOT SEED ANY DUMMY TRIPS OR FUEL LOGS!

    isDbInitialized = true
    return { mode: "neon", initialized: true }
  } catch (error) {
    console.error("[FleetPulse DB] Error initializing Neon DB, falling back to mock mode:", error)
    return { mode: "mock", initialized: false }
  }
}

/**
 * Wipes all dummy trips and fuel logs to ensure a completely clean slate.
 */
export async function cleanSlateDatabase(): Promise<{ success: boolean; message: string }> {
  mockStore.purgeData()
  const sql = getDbClient()
  if (sql) {
    try {
      await sql`DELETE FROM drivers WHERE id = 'driver_mru_01' OR name ILIKE '%Jean-Luc%';`
      await sql`TRUNCATE TABLE trips;`
      await sql`TRUNCATE TABLE fuel_logs;`
      return { success: true, message: "Neon database wiped to clean slate. Zero test drivers, trips, or fuel logs." }
    } catch (e) {
      console.error("Failed to truncate neon tables:", e)
      return { success: false, message: "Cleaned in-memory store; Neon truncate encountered: " + String(e) }
    }
  }
  return { success: true, message: "In-memory store wiped to clean slate." }
}
