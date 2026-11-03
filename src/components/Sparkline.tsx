"use client"

export function Sparkline({ tone = "green" }: { tone?: "green" | "red" | "gold" }) {
  const colors = { green: "#20d59b", red: "#ef5b62", gold: "#f6b94b" }
  return (
    <svg className="sparkline" viewBox="0 0 120 44" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spark-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={colors[tone]} stopOpacity=".3" />
          <stop offset="1" stopColor={colors[tone]} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M2 38 C14 32 16 35 27 28 S42 31 50 23 S67 25 75 16 S91 20 100 10 S112 12 118 4 V44 H2Z"
        fill={`url(#spark-${tone})`}
      />
      <path
        d="M2 38 C14 32 16 35 27 28 S42 31 50 23 S67 25 75 16 S91 20 100 10 S112 12 118 4"
        fill="none"
        stroke={colors[tone]}
        strokeWidth="2"
      />
    </svg>
  )
}
