"use client"

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo">
      <span className="logo-mark">
        <span />
        <span />
        <span />
      </span>
      {!compact && (
        <span>
          Fleet<span>Pulse</span>
        </span>
      )}
    </div>
  )
}
