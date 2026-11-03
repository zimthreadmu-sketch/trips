import { useMemo, useState, type ReactNode } from "react"

type IconName = "arrow" | "bell" | "calendar" | "car" | "check" | "chevron" | "close" | "download" | "edit" | "filter" | "fuel" | "location" | "plus" | "route" | "search" | "settings" | "sparkles" | "trend" | "users"

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
    car: (
      <>
        <path d="m5 17-2-1v-5l2-5h14l2 5v5l-2 1" />
        <path d="M5 11h14M7 14h.01M17 14h.01M6 17v2M18 17v2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    close: <path d="M18 6 6 18M6 6l12 12" />,
    download: (
      <>
        <path d="M12 3v12m0 0 5-5m-5 5-5-5" />
        <path d="M5 21h14" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    filter: <path d="M4 5h16M7 12h10M10 19h4" />,
    fuel: (
      <>
        <path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16" />
        <path d="M3 21h13M7 7h5M15 8h2l3 3v7a2 2 0 0 0 2 2" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    route: (
      <>
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="6" r="2" />
        <path d="M8 18h3a4 4 0 0 0 4-4v-4a4 4 0 0 1 3-4" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3-1.2 3.3L7.5 7.5l3.3 1.2L12 12l1.2-3.3 3.3-1.2-3.3-1.2Z" />
        <path d="m5.5 13-.8 2.2-2.2.8 2.2.8.8 2.2.8-2.2 2.2-.8-2.2-.8Z" />
      </>
    ),
    trend: <path d="m3 17 6-6 4 4 8-9m0 0h-5m5 0v5" />,
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
      </>
    ),
  }

  return (
    <svg
      aria-hidden="true"
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function Logo({ compact = false }: { compact?: boolean }) {
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

const logItems = [
  {
    time: "09:42",
    icon: "route" as IconName,
    title: "Booysens → Rosettenville",
    detail: "Regular trip",
    amount: "R 60.00",
    tone: "green",
  },
  {
    time: "08:15",
    icon: "route" as IconName,
    title: "Rosettenville → Sandton",
    detail: "VIP Trip",
    amount: "R 350.00",
    tone: "gold",
  },
  {
    time: "07:28",
    icon: "fuel" as IconName,
    title: "Shell Garage Rosettenville",
    detail: "Fuel refill · 15.4L",
    amount: "−R 350.00",
    tone: "red",
  },
]

function DriverTrips() {
  const [filter, setFilter] = useState<"All" | "Regular" | "VIP">("All")
  const trips = [
    {
      time: "09:42",
      from: "Booysens",
      to: "Rosettenville",
      type: "Regular",
      fare: "R 60.00",
      payment: "Cash",
    },
    {
      time: "08:15",
      from: "Rosettenville",
      to: "Sandton",
      type: "VIP",
      fare: "R 350.00",
      payment: "Account",
    },
    {
      time: "Yesterday · 17:35",
      from: "JHB Central",
      to: "Southgate",
      type: "Regular",
      fare: "R 120.00",
      payment: "Card",
    },
    {
      time: "Yesterday · 15:10",
      from: "Gold Reef City",
      to: "Rosebank",
      type: "VIP",
      fare: "R 420.00",
      payment: "Account",
    },
    {
      time: "Yesterday · 12:22",
      from: "Booysens",
      to: "JHB CBD",
      type: "Regular",
      fare: "R 90.00",
      payment: "Cash",
    },
  ]
  const visibleTrips = trips.filter(
    (trip) => filter === "All" || trip.type === filter,
  )

  return (
    <div className="driver-tab-screen">
      <div className="tab-title-row">
        <div>
          <span className="eyebrow">JOURNEY HISTORY</span>
          <h2>My trips</h2>
        </div>
        <button className="square-action" aria-label="Search trips">
          <Icon name="search" size={17} />
        </button>
      </div>
      <div className="trip-summary-card">
        <div>
          <span>NOVEMBER TRIPS</span>
          <strong>84</strong>
          <small>
            <b>+12%</b> from October
          </small>
        </div>
        <div className="trip-ring">
          <div>
            <strong>19</strong>
            <span>VIP</span>
          </div>
        </div>
      </div>
      <div className="tab-filter">
        {(["All", "Regular", "VIP"] as const).map((item) => (
          <button
            key={item}
            className={filter === item ? "active" : ""}
            onClick={() => setFilter(item)}
          >
            {item === "VIP" && <Icon name="sparkles" size={12} />}
            {item}
          </button>
        ))}
      </div>
      <div className="trip-history-list">
        {visibleTrips.map((trip) => (
          <article
            className="trip-history-item"
            key={`${trip.time}-${trip.from}`}
          >
            <div className={`trip-history-icon ${trip.type.toLowerCase()}`}>
              <Icon
                name={trip.type === "VIP" ? "sparkles" : "route"}
                size={17}
              />
            </div>
            <div className="trip-history-copy">
              <span className="trip-history-time">{trip.time}</span>
              <strong>
                {trip.from} <Icon name="arrow" size={13} /> {trip.to}
              </strong>
              <small>
                <span className={trip.type.toLowerCase()}>{trip.type}</span>
                {trip.payment}
              </small>
            </div>
            <div className="trip-history-fare">
              <strong>{trip.fare}</strong>
              <button>Receipt</button>
            </div>
          </article>
        ))}
      </div>
      <button className="load-more-button">Load earlier trips</button>
    </div>
  )
}

function DriverInsights() {
  const [range, setRange] = useState("Week")
  const bars = [46, 70, 55, 84, 64, 92, 76]

  return (
    <div className="driver-tab-screen">
      <div className="tab-title-row">
        <div>
          <span className="eyebrow">PERFORMANCE</span>
          <h2>My insights</h2>
        </div>
        <button className="square-action" aria-label="Insight date range">
          <Icon name="calendar" size={17} />
        </button>
      </div>
      <div className="insight-range">
        {["Week", "Month", "3 Months"].map((item) => (
          <button
            key={item}
            className={range === item ? "active" : ""}
            onClick={() => setRange(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="earnings-hero">
        <span>NET EARNINGS</span>
        <strong>R 6,840.00</strong>
        <small>
          <b>
            <Icon name="trend" size={12} /> 14.8%
          </b>{" "}
          compared to last {range.toLowerCase()}
        </small>
        <div className="mobile-bar-chart">
          {bars.map((height, index) => (
            <div key={index}>
              <i
                style={{ height: `${height}%` }}
                className={index === 5 ? "peak" : ""}
              />
              <span>{["M", "T", "W", "T", "F", "S", "S"][index]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="insight-metrics">
        <article>
          <span className="mini-metric-icon green">
            <Icon name="route" size={17} />
          </span>
          <div>
            <small>TRIPS</small>
            <strong>32</strong>
            <b>4.6 / day</b>
          </div>
        </article>
        <article>
          <span className="mini-metric-icon gold">
            <Icon name="sparkles" size={17} />
          </span>
          <div>
            <small>VIP SHARE</small>
            <strong>24%</strong>
            <b>R 2,190</b>
          </div>
        </article>
        <article>
          <span className="mini-metric-icon red">
            <Icon name="fuel" size={17} />
          </span>
          <div>
            <small>FUEL RATIO</small>
            <strong>18.2%</strong>
            <b>−2.1% better</b>
          </div>
        </article>
        <article>
          <span className="mini-metric-icon blue">
            <Icon name="car" size={17} />
          </span>
          <div>
            <small>AVG. FARE</small>
            <strong>R 214</strong>
            <b>+R 18</b>
          </div>
        </article>
      </div>
      <div className="driver-panel">
        <div className="driver-panel-head">
          <div>
            <span className="eyebrow">TOP ROUTES</span>
            <h3>Best corridors</h3>
          </div>
          <span>Net earned</span>
        </div>
        {[
          ["Booysens → Rosettenville", "12 trips", "R 1,440"],
          ["Rosettenville → Sandton", "6 trips", "R 1,310"],
          ["JHB CBD → Southgate", "8 trips", "R 960"],
        ].map((route, index) => (
          <div className="driver-route-row" key={route[0]}>
            <span>0{index + 1}</span>
            <div>
              <strong>{route[0]}</strong>
              <small>{route[1]}</small>
            </div>
            <b>{route[2]}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

function DriverSettings({
  onDuty,
  setOnDuty,
}: {
  onDuty: boolean
  setOnDuty: (value: boolean) => void
}) {
  const [notifications, setNotifications] = useState(true)
  const [biometrics, setBiometrics] = useState(false)

  return (
    <div className="driver-tab-screen">
      <div className="tab-title-row">
        <div>
          <span className="eyebrow">DRIVER ACCOUNT</span>
          <h2>Settings</h2>
        </div>
        <button className="square-action" aria-label="Edit profile">
          <Icon name="edit" size={17} />
        </button>
      </div>
      <div className="profile-card">
        <span className="profile-avatar">
          TM
          <i />
        </span>
        <div>
          <strong>Thabo Mokoena</strong>
          <span>Driver ID · DRV-018</span>
          <small>
            <Icon name="check" size={11} /> Verified driver
          </small>
        </div>
        <Icon name="chevron" size={16} />
      </div>
      <div className="settings-group">
        <span className="settings-label">SHIFT & VEHICLE</span>
        <div className="settings-list">
          <div className="setting-row">
            <span className="setting-icon green">
              <Icon name="car" size={17} />
            </span>
            <div>
              <strong>Toyota Rumion</strong>
              <small>DX 44 GP · Assigned vehicle</small>
            </div>
            <Icon name="chevron" size={15} />
          </div>
          <div className="setting-row">
            <span className="setting-icon green">
              <Icon name="users" size={17} />
            </span>
            <div>
              <strong>Duty status</strong>
              <small>
                {onDuty
                  ? "You’re visible to dispatch"
                  : "You’re currently unavailable"}
              </small>
            </div>
            <button
              className={`mini-toggle ${onDuty ? "active" : ""}`}
              onClick={() => setOnDuty(!onDuty)}
            >
              <i />
            </button>
          </div>
        </div>
      </div>
      <div className="settings-group">
        <span className="settings-label">APP PREFERENCES</span>
        <div className="settings-list">
          <div className="setting-row">
            <span className="setting-icon">
              <Icon name="bell" size={17} />
            </span>
            <div>
              <strong>Notifications</strong>
              <small>Shift alerts and trip updates</small>
            </div>
            <button
              className={`mini-toggle ${notifications ? "active" : ""}`}
              onClick={() => setNotifications(!notifications)}
            >
              <i />
            </button>
          </div>
          <div className="setting-row">
            <span className="setting-icon">
              <Icon name="settings" size={17} />
            </span>
            <div>
              <strong>Biometric sign-in</strong>
              <small>Use device authentication</small>
            </div>
            <button
              className={`mini-toggle ${biometrics ? "active" : ""}`}
              onClick={() => setBiometrics(!biometrics)}
            >
              <i />
            </button>
          </div>
          <button className="setting-row button-row">
            <span className="setting-icon">
              <Icon name="sparkles" size={17} />
            </span>
            <div>
              <strong>Payment methods</strong>
              <small>Cash, card and account defaults</small>
            </div>
            <Icon name="chevron" size={15} />
          </button>
        </div>
      </div>
      <div className="settings-group">
        <span className="settings-label">SUPPORT</span>
        <div className="settings-list">
          <button className="setting-row button-row">
            <span className="setting-icon">
              <Icon name="users" size={17} />
            </span>
            <div>
              <strong>Contact fleet support</strong>
              <small>Available 24 hours</small>
            </div>
            <Icon name="chevron" size={15} />
          </button>
          <button className="setting-row button-row danger-row">
            <span className="setting-icon red">
              <Icon name="arrow" size={17} />
            </span>
            <div>
              <strong>Sign out</strong>
              <small>FleetPulse Driver v2.4.0</small>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

function DriverApp({
  desktopPreview = false,
  onAdminView,
}: {
  desktopPreview?: boolean
  onAdminView?: () => void
}) {
  const [onDuty, setOnDuty] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [tripType, setTripType] = useState<"regular" | "vip">("vip")
  const [origin, setOrigin] = useState("Booysens")
  const [destination, setDestination] = useState("Rosettenville")
  const [fare, setFare] = useState(180)
  const [payment, setPayment] = useState("Account")
  const [logged, setLogged] = useState(false)
  const [activeTab, setActiveTab] =
    useState<"shift" | "trips" | "insights" | "settings">("shift")

  const completeTrip = () => {
    setLogged(true)
    window.setTimeout(() => {
      setSheetOpen(false)
      setLogged(false)
    }, 850)
  }

  return (
    <main
      className={`mobile-shell ${
        desktopPreview ? "desktop-driver-preview" : ""
      }`}
    >
      {desktopPreview && (
        <aside className="driver-preview-intro">
          <button className="back-to-admin" onClick={onAdminView}>
            <Icon name="arrow" size={16} /> Back to admin dashboard
          </button>
          <span className="eyebrow">DRIVER FIELD APP</span>
          <h1>The frontend your drivers use on every shift.</h1>
          <p>
            A focused mobile workspace for logging journeys, fuel expenses, and
            VIP account trips from the road.
          </p>
          <div className="preview-feature-list">
            <span>
              <i>
                <Icon name="check" size={14} />
              </i>
              One-tap trip and fuel logging
            </span>
            <span>
              <i>
                <Icon name="check" size={14} />
              </i>
              Live earnings and shift activity
            </span>
            <span>
              <i>
                <Icon name="check" size={14} />
              </i>
              Standard and VIP account fares
            </span>
          </div>
        </aside>
      )}
      <section className="driver-app">
        <header className="driver-header">
          <div className="driver-brand-row">
            <Logo />
            <button
              className={`duty-toggle ${onDuty ? "active" : ""}`}
              onClick={() => setOnDuty(!onDuty)}
            >
              <span className="live-dot" /> {onDuty ? "On Duty" : "Off Duty"}
            </button>
          </div>
          <div className="greeting-row">
            <div>
              <span className="eyebrow">
                {activeTab === "shift"
                  ? "MONDAY, 30 NOVEMBER"
                  : "FLEETPULSE DRIVER"}
              </span>
              <h1>
                {activeTab === "shift"
                  ? "Morning, Thabo"
                  : activeTab === "trips"
                    ? "Trip history"
                    : activeTab === "insights"
                      ? "Your performance"
                      : "Your account"}
              </h1>
            </div>
            <button className="avatar-button" aria-label="Open profile">
              TM
            </button>
          </div>
          <div className="vehicle-badge">
            <Icon name="car" size={15} /> Toyota Rumion <span /> DX 44 GP
          </div>
        </header>

        <section
          className={`driver-content ${
            activeTab !== "shift" ? "tab-content" : ""
          }`}
        >
          {activeTab === "shift" && (
            <>
              <div className="today-card">
                <div className="today-card-head">
                  <span>Today’s performance</span>
                  <span className="trend-label">
                    <Icon name="trend" size={14} /> 12.4%
                  </span>
                </div>
                <div className="mobile-metrics">
                  <div>
                    <span>Gross</span>
                    <strong>R 1,480</strong>
                  </div>
                  <div>
                    <span>Fuel</span>
                    <strong className="danger">−R 350</strong>
                  </div>
                  <div>
                    <span>Net</span>
                    <strong className="success">R 1,130</strong>
                  </div>
                </div>
              </div>

              <div className="action-deck">
                <button
                  className="log-trip-button"
                  onClick={() => setSheetOpen(true)}
                >
                  <span className="action-icon">
                    <Icon name="plus" size={23} />
                  </span>
                  <span>
                    <small>NEW JOURNEY</small>Log Trip
                  </span>
                  <Icon name="arrow" size={22} />
                </button>
                <button className="log-fuel-button">
                  <span className="fuel-icon">
                    <Icon name="fuel" size={20} />
                  </span>
                  <span>
                    <small>EXPENSE</small>Log Fuel
                  </span>
                  <Icon name="chevron" size={17} />
                </button>
              </div>

              <div className="section-heading">
                <div>
                  <span className="eyebrow">LIVE ACTIVITY</span>
                  <h2>Recent shift logs</h2>
                </div>
                <button>View all</button>
              </div>
              <div className="shift-feed">
                {logItems.map((item) => (
                  <article className="shift-item" key={item.time}>
                    <div className={`log-icon ${item.tone}`}>
                      <Icon name={item.icon} size={18} />
                    </div>
                    <div className="log-copy">
                      <div className="log-title">
                        <strong>{item.title}</strong>
                        <time>{item.time}</time>
                      </div>
                      <div className="log-meta">
                        <span className={`tag ${item.tone}`}>
                          {item.detail}
                        </span>
                        <b className={item.tone}>{item.amount}</b>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
          {activeTab === "trips" && <DriverTrips />}
          {activeTab === "insights" && <DriverInsights />}
          {activeTab === "settings" && (
            <DriverSettings onDuty={onDuty} setOnDuty={setOnDuty} />
          )}
        </section>

        <nav className="mobile-nav">
          <button
            className={activeTab === "shift" ? "active" : ""}
            onClick={() => setActiveTab("shift")}
          >
            <Icon name="car" />
            <span>Shift</span>
          </button>
          <button
            className={activeTab === "trips" ? "active" : ""}
            onClick={() => setActiveTab("trips")}
          >
            <Icon name="route" />
            <span>Trips</span>
          </button>
          <button
            className={activeTab === "insights" ? "active" : ""}
            onClick={() => setActiveTab("insights")}
          >
            <Icon name="trend" />
            <span>Insights</span>
          </button>
          <button
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
          >
            <Icon name="settings" />
            <span>Settings</span>
          </button>
        </nav>

        {sheetOpen && (
          <div
            className="sheet-overlay"
            onMouseDown={(event) =>
              event.target === event.currentTarget && setSheetOpen(false)
            }
          >
            <section
              className="trip-sheet"
              aria-modal="true"
              role="dialog"
              aria-label="Log a new trip"
            >
              <div className="sheet-grabber" />
              <div className="sheet-title">
                <div>
                  <span className="eyebrow">NEW JOURNEY</span>
                  <h2>Log a trip</h2>
                </div>
                <button
                  className="close-button"
                  onClick={() => setSheetOpen(false)}
                  aria-label="Close"
                >
                  <Icon name="close" />
                </button>
              </div>

              <div className="trip-selector">
                <button
                  className={tripType === "regular" ? "active" : ""}
                  onClick={() => setTripType("regular")}
                >
                  Standard Trip
                </button>
                <button
                  className={tripType === "vip" ? "vip active" : ""}
                  onClick={() => setTripType("vip")}
                >
                  <Icon name="sparkles" size={15} /> VIP Trip
                </button>
              </div>
              {tripType === "vip" && (
                <div className="vip-banner">
                  <Icon name="sparkles" size={15} />
                  <span>
                    <strong>VIP Custom Rate Enabled</strong>Premium account
                    pricing is active
                  </span>
                </div>
              )}

              <div className="route-fields">
                <label>
                  <span>Origin location</span>
                  <span className="select-wrap">
                    <Icon name="location" size={17} />
                    <select
                      value={origin}
                      onChange={(event) => setOrigin(event.target.value)}
                    >
                      <option>Booysens</option>
                      <option>Rosettenville</option>
                      <option>JHB CBD</option>
                      <option>Southgate</option>
                    </select>
                    <Icon name="chevron" size={15} />
                  </span>
                </label>
                <div className="route-connector">
                  <span />
                  <Icon name="arrow" size={15} />
                  <span />
                </div>
                <label>
                  <span>Destination location</span>
                  <span className="select-wrap">
                    <Icon name="location" size={17} />
                    <select
                      value={destination}
                      onChange={(event) => setDestination(event.target.value)}
                    >
                      <option>Rosettenville</option>
                      <option>Booysens</option>
                      <option>JHB CBD</option>
                      <option>Southgate</option>
                    </select>
                    <Icon name="chevron" size={15} />
                  </span>
                </label>
              </div>
              <div className="quick-spots">
                <span>QUICK SPOTS</span>
                <div>
                  {["Booysens", "Rosettenville", "JHB CBD", "Southgate"].map(
                    (spot) => (
                      <button
                        key={spot}
                        onClick={() => setDestination(spot)}
                        className={destination === spot ? "active" : ""}
                      >
                        {spot}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {tripType === "vip" && (
                <label className="text-field">
                  <span>VIP passenger / account reference</span>
                  <input defaultValue="Executive Charter - Dr. Adeleke" />
                </label>
              )}

              <div className="fare-panel">
                <div className="fare-row">
                  <div>
                    <span>TRIP FARE</span>
                    <strong>R {fare.toFixed(2)}</strong>
                  </div>
                  <div>
                    <button onClick={() => setFare(fare + 10)}>+R10</button>
                    <button onClick={() => setFare(fare + 50)}>+R50</button>
                  </div>
                </div>
                <div className="payment-toggle">
                  {["Cash", "Card", "Account"].map((method) => (
                    <button
                      key={method}
                      className={payment === method ? "active" : ""}
                      onClick={() => setPayment(method)}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
              <button
                className={`complete-button ${logged ? "completed" : ""}`}
                onClick={completeTrip}
              >
                {logged ? (
                  <>
                    <Icon name="check" /> Trip logged successfully
                  </>
                ) : (
                  <>
                    Complete & Log Trip <Icon name="arrow" />
                  </>
                )}
              </button>
            </section>
          </div>
        )}
      </section>
      {desktopPreview && (
        <aside className="driver-preview-guide">
          <span className="preview-status">
            <i /> Interactive preview
          </span>
          <h2>Try the driver flow</h2>
          <ol>
            <li>
              <span>01</span>
              Select <strong>Log Trip</strong>
            </li>
            <li>
              <span>02</span>
              Choose Standard or VIP
            </li>
            <li>
              <span>03</span>
              Adjust the fare and submit
            </li>
          </ol>
          <small>Desktop preview · Driver viewport 390px</small>
        </aside>
      )}
    </main>
  )
}

const revenue = [
  22, 28, 25, 36, 31, 42, 47, 39, 51, 48, 59, 55, 68, 63, 71, 66, 79, 74, 84,
  82, 91, 86, 96, 92,
]
const fuel = [
  68, 64, 70, 62, 67, 56, 60, 63, 52, 56, 48, 53, 43, 48, 39, 45, 34, 39, 30,
  35, 25, 31, 22, 27,
]

function Sparkline({ tone = "green" }: { tone?: "green" | "red" | "gold" }) {
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
  children: ReactNode
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

function RevenueChart() {
  const [hovered, setHovered] = useState(20)
  const points = (values: number[]) =>
    values.map((v, index) => `${28 + index * 31},${210 - v * 1.55}`).join(" ")
  const x = 28 + hovered * 31
  const revenueY = 210 - revenue[hovered] * 1.55

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
          setHovered(
            Math.max(
              0,
              Math.min(
                23,
                Math.round(
                  (((event.clientX - rect.left) / rect.width) * 770 - 28) / 31,
                ),
              ),
            ),
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
          points={`28,211 ${points(revenue)} 741,211`}
          fill="url(#revenue-area)"
        />
        <polyline points={points(revenue)} className="revenue-line" />
        <polyline
          points={points(revenue.map((v, i) => v * 0.38 + (i % 5) * 2))}
          className="vip-line"
        />
        <polyline points={points(fuel)} className="fuel-line" />
        <line x1={x} x2={x} y1="18" y2="211" className="hover-line" />
        <circle cx={x} cy={revenueY} r="5" className="hover-dot" />
      </svg>
      <div
        className="chart-tooltip"
        style={{ left: `${Math.min(78, 4 + hovered * 3.8)}%` }}
      >
        <span>21 NOV 2026</span>
        <strong>R 7,820</strong>
        <small>
          <i /> Revenue &nbsp; <b>R 1,840 fuel</b>
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

const ledgerRows = [
  {
    initials: "TM",
    name: "Thabo Mokoena",
    id: "DRV-018",
    type: "Regular",
    from: "Booysens",
    to: "Rosettenville",
    note: "Standard Commute",
    fuel: "−R 42.00",
    net: "R 118.00",
    status: "Approved",
    color: "mint",
  },
  {
    initials: "LN",
    name: "Lerato Nkosi",
    id: "DRV-024",
    type: "VIP",
    from: "Sandton",
    to: "Rosebank",
    note: "VIP Hotel Transfer",
    fuel: "−R 86.00",
    net: "R 514.00",
    status: "Approved",
    color: "gold",
  },
  {
    initials: "SM",
    name: "Sipho Mahlangu",
    id: "DRV-007",
    type: "Regular",
    from: "JHB Central",
    to: "Southgate",
    note: "Standard Commute",
    fuel: "−R 55.00",
    net: "R 145.00",
    status: "Pending Review",
    color: "blue",
  },
  {
    initials: "PD",
    name: "Priya Daniels",
    id: "DRV-031",
    type: "VIP",
    from: "Booysens",
    to: "Midrand",
    note: "Contract Billing",
    fuel: "−R 112.00",
    net: "R 688.00",
    status: "Approved",
    color: "coral",
  },
  {
    initials: "KN",
    name: "Kabelo Ndlovu",
    id: "DRV-012",
    type: "Regular",
    from: "Gold Reef City",
    to: "JHB CBD",
    note: "Tour Group Transfer",
    fuel: "−R 68.00",
    net: "R 212.00",
    status: "Approved",
    color: "purple",
  },
]

function SettingsDrawer({ onClose }: { onClose: () => void }) {
  const [regularRate, setRegularRate] = useState(60)
  const [multiplier, setMultiplier] = useState(1.8)
  const [zone, setZone] = useState("Booysens South")
  return (
    <div
      className="drawer-overlay"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <aside className="settings-drawer">
        <div className="drawer-head">
          <div>
            <span className="eyebrow">FLEET CONFIGURATION</span>
            <h2>Locations & pricing</h2>
            <p>Manage service zones and fare rules.</p>
          </div>
          <button onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="drawer-section">
          <div className="drawer-section-title">
            <span className="drawer-icon">
              <Icon name="location" />
            </span>
            <div>
              <strong>Service locations</strong>
              <p>7 active zones across Johannesburg</p>
            </div>
          </div>
          <label className="drawer-field">
            <span>Add new zone</span>
            <div>
              <input
                value={zone}
                onChange={(event) => setZone(event.target.value)}
              />
              <button>
                <Icon name="plus" size={17} /> Add
              </button>
            </div>
          </label>
          <div className="zone-list">
            {["Booysens", "Rosettenville", "JHB Central", "Southgate"].map(
              (item, i) => (
                <div key={item}>
                  <span>
                    <i className={i === 0 ? "active" : ""} />
                    {item}
                  </span>
                  <button>
                    <Icon name="edit" size={15} />
                  </button>
                </div>
              ),
            )}
          </div>
        </div>
        <div className="drawer-section">
          <div className="drawer-section-title">
            <span className="drawer-icon gold">
              <Icon name="sparkles" />
            </span>
            <div>
              <strong>Pricing rules</strong>
              <p>Adjust standard and premium rates</p>
            </div>
          </div>
          <label className="pricing-field">
            <span>
              <b>Standard base rate</b>
              <small>Default minimum fare</small>
            </span>
            <div>
              R{" "}
              <input
                type="number"
                value={regularRate}
                onChange={(event) => setRegularRate(Number(event.target.value))}
              />
            </div>
          </label>
          <label className="pricing-field">
            <span>
              <b>VIP rate multiplier</b>
              <small>Applied to the standard fare</small>
            </span>
            <div className="gold-input">
              <input
                type="number"
                step=".1"
                value={multiplier}
                onChange={(event) => setMultiplier(Number(event.target.value))}
              />{" "}
              ×
            </div>
          </label>
          <div className="rate-preview">
            <span>EXAMPLE FARE</span>
            <div>
              <span>Booysens → Rosettenville</span>
              <strong>R {(regularRate * multiplier).toFixed(2)}</strong>
            </div>
            <small>VIP rate based on current multiplier</small>
          </div>
        </div>
        <div className="drawer-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={onClose}>
            <Icon name="check" size={17} /> Save changes
          </button>
        </div>
      </aside>
    </div>
  )
}

function AdminDashboard({ onDriverView }: { onDriverView: () => void }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [tripFilter, setTripFilter] = useState("All trips")
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState("All locations")
  const filteredRows = useMemo(
    () =>
      ledgerRows.filter((row) => {
        const matchQuery =
          row.name.toLowerCase().includes(query.toLowerCase()) ||
          row.from.toLowerCase().includes(query.toLowerCase()) ||
          row.to.toLowerCase().includes(query.toLowerCase())
        const matchType = tripFilter === "All trips" || row.type === tripFilter
        const matchLocation =
          location === "All locations" ||
          row.from === location ||
          row.to === location
        return matchQuery && matchType && matchLocation
      }),
    [tripFilter, query, location],
  )

  return (
    <main className="admin-app">
      <header className="topbar">
        <Logo />
        <div className="topbar-center">
          <button className="driver-view-switch" onClick={onDriverView}>
            <Icon name="car" size={16} /> Driver App
          </button>
          <span className="live-fleet">
            <i /> <strong>12</strong> Drivers active
          </span>
          <button className="date-filter">
            <Icon name="calendar" size={16} /> Nov 1 – Nov 30, 2026{" "}
            <Icon name="chevron" size={14} />
          </button>
        </div>
        <div className="admin-profile">
          <button className="icon-button">
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
            <button className="secondary-action">
              <Icon name="download" size={17} /> Export report
            </button>
            <button
              className="primary-action"
              onClick={() => setDrawerOpen(true)}
            >
              <Icon name="settings" size={17} /> Pricing settings
            </button>
          </div>
        </div>

        <section className="kpi-grid">
          <KpiCard
            label="Total Gross Revenue"
            value="R 148,920.00"
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
            value="R 34,210.00"
            icon="fuel"
            tone="expense"
          >
            <div className="fuel-ratio">
              <span>
                <b>22.9%</b> fuel ratio
              </span>
              <span className="progress">
                <i />
              </span>
            </div>
          </KpiCard>
          <KpiCard
            label="Net Operating Profit"
            value="R 114,710.00"
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
            value="1,420 Trips"
            icon="route"
            tone="trips"
          >
            <div className="trip-breakdown">
              <span>
                <i /> 1,140 Regular
              </span>
              <span>
                <i /> 280 VIP
              </span>
              <small>19.7% of trips · 41% of revenue</small>
            </div>
          </KpiCard>
        </section>

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
              <button>
                <Icon name="filter" size={16} />
              </button>
            </div>
            <div className="corridor-overview">
              <div className="donut">
                <div>
                  <strong>895</strong>
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
              {[
                ["Booysens", "Rosettenville", "412", "100%"],
                ["Rosettenville", "JHB Central", "285", "69%"],
                ["Booysens", "Gold Reef City", "198", "48%"],
              ].map((route, index) => (
                <div className="corridor-row" key={route[1]}>
                  <span className="route-rank">0{index + 1}</span>
                  <div>
                    <strong>
                      {route[0]} <Icon name="arrow" size={13} /> {route[1]}
                    </strong>
                    <span className="route-bar">
                      <i style={{ width: route[3] }} />
                    </span>
                  </div>
                  <b>
                    {route[2]}
                    <small>trips</small>
                  </b>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="panel ledger-panel">
          <div className="ledger-heading">
            <div>
              <span className="eyebrow">OPERATIONAL LEDGER</span>
              <h2>Trip & expense activity</h2>
            </div>
            <div className="ledger-summary">
              <span>
                <i className="approved-dot" /> 1,376 Approved
              </span>
              <span>
                <i className="pending-dot" /> 44 Pending
              </span>
            </div>
          </div>
          <div className="table-toolbar">
            <label className="search-box">
              <Icon name="search" size={17} />
              <input
                placeholder="Search driver or route..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="toolbar-filters">
              <label>
                <Icon name="filter" size={15} />
                <select
                  value={tripFilter}
                  onChange={(event) => setTripFilter(event.target.value)}
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
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                >
                  <option>All locations</option>
                  <option>Booysens</option>
                  <option>Rosettenville</option>
                  <option>JHB Central</option>
                  <option>Southgate</option>
                </select>
                <Icon name="chevron" size={13} />
              </label>
              <button>
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
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="driver-cell">
                        <span className={`table-avatar ${row.color}`}>
                          {row.initials}
                        </span>
                        <span>
                          <strong>{row.name}</strong>
                          <small>{row.id}</small>
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
                      <span
                        className={`status-pill ${
                          row.status === "Approved" ? "approved" : "pending"
                        }`}
                      >
                        <i />
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button title="Review">
                          <Icon name="search" size={15} />
                        </button>
                        <button title="Edit">
                          <Icon name="edit" size={15} />
                        </button>
                        <button title="Download receipt">
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
            <span>Showing {filteredRows.length} of 1,420 entries</span>
            <div>
              <button disabled>Previous</button>
              <button className="active">1</button>
              <button>2</button>
              <button>3</button>
              <span>…</span>
              <button>142</button>
              <button>Next</button>
            </div>
          </div>
        </section>
      </div>
      {drawerOpen && <SettingsDrawer onClose={() => setDrawerOpen(false)} />}
    </main>
  )
}

export default function App() {
  const [desktopView, setDesktopView] = useState<"admin" | "driver">("admin")

  return (
    <>
      <DriverApp
        desktopPreview={desktopView === "driver"}
        onAdminView={() => setDesktopView("admin")}
      />
      {desktopView === "admin" && (
        <AdminDashboard onDriverView={() => setDesktopView("driver")} />
      )}
    </>
  )
}
