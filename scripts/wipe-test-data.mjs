import { neon } from "@neondatabase/serverless"
import * as fs from "fs"

// Load .env.local
const envFile = fs.readFileSync(".env.local", "utf8")
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const val = match[2].trim().replace(/^"(.*)"$/, "$1")
    process.env[key] = val
  }
}

if (!process.env.DATABASE_URL) {
  console.log("No DATABASE_URL found.")
  process.exit(0)
}

let connStr = process.env.DATABASE_URL.replace("channel_binding=require&", "").replace("&channel_binding=require", "")
const sql = neon(connStr)

try {
  console.log("Cleaning trips and fuel_logs tables in Neon DB...")
  await sql`TRUNCATE TABLE trips;`
  await sql`TRUNCATE TABLE fuel_logs;`
  console.log("✓ Neon database clean slate complete. 0 trips and 0 fuel logs remaining.")
} catch (e) {
  console.error("Truncate error:", e)
}
