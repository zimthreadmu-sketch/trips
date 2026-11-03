import { getInitialData } from "./actions"
import { FleetPulseApp } from "@/components/FleetPulseApp"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Page() {
  const initialData = await getInitialData()

  return (
    <FleetPulseApp
      initialLocations={initialData.locations}
      initialDrivers={initialData.drivers}
      initialActiveDriver={initialData.activeDriver}
      initialTodayTrips={initialData.todayTrips}
      initialRecentTrips={initialData.recentTrips}
      initialFuelLogs={initialData.fuelLogs}
      initialLedgerEntries={initialData.ledgerEntries}
      initialMetrics={initialData.metrics}
      dbMode={initialData.dbMode}
    />
  )
}
