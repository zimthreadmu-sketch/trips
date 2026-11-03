"use client"

import { useState } from "react"

const defaultRevenue = [
  22, 28, 25, 36, 31, 42, 47, 39, 51, 48, 59, 55, 68, 63, 71, 66, 79, 74, 84,
  82, 91, 86, 96, 92,
]
const defaultFuel = [
  68, 64, 70, 62, 67, 56, 60, 63, 52, 56, 48, 53, 43, 48, 39, 45, 34, 39, 30,
  35, 25, 31, 22, 27,
]

interface RevenueChartProps {
  revenueData?: number[]
  fuelData?: number[]
}

export function RevenueChart({
  revenueData = defaultRevenue,
  fuelData = defaultFuel,
}: RevenueChartProps) {
  const [hovered, setHovered] = useState(20)

  const points = (values: number[]) =>
    values.map((v, index) => `${28 + index * 31},${210 - v * 1.55}`).join(" ")

  const safeIndex = Math.min(hovered, revenueData.length - 1)
  const x = 28 + safeIndex * 31
  const revenueY = 210 - (revenueData[safeIndex] || 70) * 1.55

  // Calculate dynamic tooltip values based on hovered point
  const currentRevenue = Math.round(((revenueData[safeIndex] || 50) / 100) * 8500)
  const currentFuel = Math.round(((fuelData[safeIndex] || 25) / 100) * 2800)
  const days = [
    "01 Nov", "02 Nov", "03 Nov", "04 Nov", "05 Nov", "06 Nov", "07 Nov",
    "08 Nov", "09 Nov", "10 Nov", "11 Nov", "12 Nov", "13 Nov", "14 Nov",
    "15 Nov", "16 Nov", "17 Nov", "18 Nov", "19 Nov", "20 Nov", "21 Nov",
    "22 Nov", "23 Nov", "24 Nov"
  ]
  const currentDay = days[safeIndex] || "21 Nov 2026"

  return (
    <div className="revenue-chart">
      <div className="chart-y-labels">
        <span>R 8k</span>
        <span>R 6k</span>
        <span>R 4k</span>
        <span>R 2k</span>
        <span>R 0</span>
      </div>
      <svg
        viewBox="0 0 770 245"
        preserveAspectRatio="none"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const mouseX = event.clientX - rect.left
          const calculatedIndex = Math.round(
            ((mouseX / rect.width) * 770 - 28) / 31
          )
          setHovered(
            Math.max(0, Math.min(revenueData.length - 1, calculatedIndex))
          )
        }}
      >
        <defs>
          <linearGradient id="revenue-area" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#18c990" stopOpacity=".28" />
            <stop offset="1" stopColor="#18c990" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="vip-area" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#f0ac35" stopOpacity=".17" />
            <stop offset="1" stopColor="#f0ac35" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[23, 70, 117, 164, 211].map((y) => (
          <line key={y} x1="28" x2="748" y1={y} y2={y} className="grid-line" />
        ))}
        <polygon
          points={`28,211 ${points(revenueData)} 741,211`}
          fill="url(#revenue-area)"
        />
        <polyline points={points(revenueData)} className="revenue-line" />
        <polyline
          points={points(revenueData.map((v, i) => v * 0.38 + (i % 5) * 2))}
          className="vip-line"
        />
        <polyline points={points(fuelData)} className="fuel-line" />
        <line x1={x} x2={x} y1="18" y2="211" className="hover-line" />
        <circle cx={x} cy={revenueY} r="5" className="hover-dot" />
      </svg>
      <div
        className="chart-tooltip"
        style={{ left: `${Math.min(78, 4 + safeIndex * 3.8)}%` }}
      >
        <span>{currentDay.toUpperCase()} 2026</span>
        <strong>R {currentRevenue.toLocaleString()}</strong>
        <small>
          <i /> Revenue &nbsp; <b>R {currentFuel.toLocaleString()} fuel</b>
        </small>
      </div>
      <div className="chart-x-labels">
        <span>Nov 1</span>
        <span>Nov 7</span>
        <span>Nov 14</span>
        <span>Nov 21</span>
        <span>Nov 30</span>
      </div>
    </div>
  )
}
