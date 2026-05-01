import { useState, useEffect, useRef } from "react";

const colors = {
  surface: "#0c0e10",
  surfaceContainerLow: "#111416",
  surfaceContainer: "#171a1c",
  surfaceContainerHigh: "#1d2022",
  surfaceContainerHighest: "#232629",
  primary: "#8cacff",
  primaryDim: "#2c6dec",
  primaryFixed: "#769dff",
  secondary: "#fe7d5e",
  secondaryDim: "#f7785a",
  tertiary: "#b6ffbf",
  tertiaryDim: "#49ee7f",
  onSurface: "#eeeef0",
  onSurfaceVariant: "#aaabad",
  outlineVariant: "#46484a",
  outline: "#747578",
  error: "#ff716c",
  brand: "#3E7BFA",
};

const Icon = ({ name, fill = false, size = 24, color }) => (
  <span
    className="material-symbols-outlined"
    style={{
      fontVariationSettings: fill ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
      fontSize: size,
      color: color || "inherit",
      lineHeight: 1,
    }}
  >
    {name}
  </span>
);

const baseHabits = [
  { id: 1, name: "Hydration Goal", icon: "water_drop", iconColor: colors.tertiaryDim, streak: 7 },
  { id: 2, name: "Read 15 Pages", icon: "menu_book", iconColor: colors.primary, streak: 12 },
  { id: 3, name: "Mindfulness Session", icon: "self_improvement", iconColor: colors.secondary, streak: 3 },
  { id: 4, name: "No screens after 10pm", icon: "bedtime", iconColor: colors.primaryFixed, streak: 5 },
  { id: 5, name: "Stretch / move", icon: "fitness_center", iconColor: colors.tertiaryDim, streak: 9 },
  { id: 6, name: "Log spending", icon: "account_balance_wallet", iconColor: colors.secondary, streak: 2 },
];

const journalEntries = [
  { id: 1, title: "Morning Sunlight", time: "8:45 AM", tag: "Gratitude", icon: "sentiment_satisfied", iconColor: colors.tertiaryDim, body: "Today started slow. The way the light hit the kitchen table reminded me of that summer in Tuscany...", tags: ["#morning", "#reflection"] },
  { id: 2, title: "Rainy Commute", time: "6:12 PM", tag: "Focus", icon: "water_drop", iconColor: colors.secondary, body: "The city looks different through the rain. Every reflection tells a story. I spent most of the train ride thinking about liminal spaces...", tags: ["#work", "#growth"] },
  { id: 3, title: "Midnight Thoughts", time: "11:58 PM", tag: "Dreams", icon: "dark_mode", iconColor: colors.primary, body: "A strange dream about a giant library where the books were made of water. What does it mean to seek knowledge that cannot be held?", tags: ["#dreams"] },
];

const moodOptions = [
  { label: "Drained", icon: "water_drop", color: colors.secondary },
  { label: "Reflective", icon: "auto_awesome", color: colors.primary },
  { label: "Anxious", icon: "bolt", color: colors.error },
  { label: "Peaceful", icon: "eco", color: colors.tertiaryDim },
  { label: "Cloudy", icon: "cloud", color: colors.primaryFixed },
];

const spotifyData = {
  artists: [
    { name: "Sonder", color: "#5B4A9E" },
    { name: "Ravyn Lenae", color: "#8B3A62" },
    { name: "SZA", color: "#3A6B5B" },
  ],
  tracks: 14,
  minutes: 52,
  vibe: "Melancholic + introspective",
};

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const calendarDays = [
  { day: "Mon", date: 12 }, { day: "Tue", date: 13 }, { day: "Wed", date: 14, active: true },
  { day: "Thu", date: 15 }, { day: "Fri", date: 16 },
];

const mealProtocol = [
  { slot: "Breakfast", name: "Avocado Power Toast", kcal: 420, protein: 22, tracked: true },
  { slot: "Mid-Morning", name: "Whey & Berry Shake", kcal: 180, protein: null, tracked: true },
  { slot: "Lunch", name: "Grilled Harissa Chicken", kcal: null, protein: 45, carbs: 38, tracked: false, upNext: true, desc: "Quinoa, Roasted Peppers, Hummus" },
  { slot: "Dinner", name: "Grilled Salmon & Quinoa", kcal: 520, protein: 48, tracked: false },
  { slot: "Evening", name: "Greek Yogurt & Walnuts", kcal: 210, protein: 18, tracked: false },
];

const smartSuggestions = [
  { name: "Miso-Glazed Salmon", desc: "Rich in Omega-3 & High Protein", protein: 34, tag: "Protein dense", tagColor: "#49ee7f" },
  { name: "Beef & Broccoli Stir Fry", desc: "Fast absorption for recovery", protein: 42, tag: "Post-workout", tagColor: "#49ee7f" },
  { name: "Cottage Cheese Bowl", desc: "Slow-release casein protein", protein: 28, tag: "Before bed", tagColor: "#8cacff" },
];

const moodTrendData = [3, 4, 3, 5, 4, 6, 5];

const budgetCategories = [
  { name: "Needs", spent: 1200, total: 2000, color: colors.primary },
  { name: "Wants", spent: 450, total: 800, color: colors.secondary },
  { name: "Savings", spent: 800, total: 1000, color: colors.tertiaryDim },
  { name: "Emergencies", spent: 150, total: 500, color: colors.error },
];

const upcomingBills = [
  { name: "Cloud Storage", due: "2 days", amount: 9.99, icon: "cloud", color: colors.primary },
  { name: "Utility Bill", due: "5 days", amount: 85.00, icon: "bolt", color: colors.secondary },
  { name: "Gym Membership", due: "12 days", amount: 45.00, icon: "fitness_center", color: colors.tertiaryDim },
];

const weeklyPlan = [
  { day: "Mon", label: "Upper Body", status: "done", duration: "52m" },
  { day: "Tue", label: "Lower Body", status: "current", duration: "" },
  { day: "Wed", label: "Active Recovery", status: "upcoming", duration: "20m Yoga" },
  { day: "Thu", label: "Push Day", status: "upcoming", duration: "" },
  { day: "Fri", label: "Pull Day", status: "upcoming", duration: "" },
];

function StepsRing({ steps = 8432, goal = 10000, size = 120 }) {
  const pct = Math.min(steps / goal, 1);
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="transparent" stroke={colors.outlineVariant + "33"} strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="transparent" stroke={colors.tertiaryDim} strokeWidth={8} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "Manrope", color: colors.onSurface }}>{steps.toLocaleString()}</span>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: colors.onSurfaceVariant }}>Steps</span>
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color, height = 6 }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ width: "100%", height, borderRadius: height, background: colors.surfaceContainerHigh }}>
      <div style={{ width: `${pct}%`, height: "100%", borderRadius: height, background: color, transition: "width 0.4s ease" }} />
    </div>
  );
}

function MoodTrendChart() {
  const w = 280, h = 60, pad = 8;
  const maxV = Math.max(...moodTrendData);
  const pts = moodTrendData.map((v, i) => ({
    x: pad + (i / (moodTrendData.length - 1)) * (w - pad * 2),
    y: h - pad - ((v / maxV) * (h - pad * 2)),
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 20}`} style={{ overflow: "visible" }}>
      <path d={line} fill="none" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill={i === pts.length - 2 ? colors.tertiaryDim : colors.primary} />
          <text x={p.x} y={h + 16} textAnchor="middle" fill={colors.onSurfaceVariant} fontSize={9} fontFamily="Inter">{weekDays[i]}</text>
        </g>
      ))}
    </svg>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: colors.surfaceContainer,
        borderRadius: 20,
        padding: "20px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: colors.onSurfaceVariant }}>{children}</span>;
}

// ─── TAB: HOME ───
function HomeTab({ habits, toggleHabit, spotifyConfirmed, setSpotifyConfirmed }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Spotify Recap */}
      {!spotifyConfirmed ? (
        <Card style={{ background: `linear-gradient(135deg, ${colors.surfaceContainerLow}, ${colors.surfaceContainer})` }}>
          <SectionLabel>Today's soundtrack</SectionLabel>
          <div style={{ display: "flex", gap: 16, margin: "16px 0", justifyContent: "center" }}>
            {spotifyData.artists.map((a) => (
              <div key={a.name} style={{ textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: 32, background: a.color, border: `2px solid ${colors.tertiaryDim}40`, margin: "0 auto 6px" }} />
                <span style={{ fontSize: 11, color: colors.onSurface, fontWeight: 500 }}>{a.name}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, background: colors.surfaceContainerHigh, borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "Manrope", color: colors.onSurface }}>{spotifyData.tracks}</div>
              <div style={{ fontSize: 10, color: colors.onSurfaceVariant }}>tracks played</div>
            </div>
            <div style={{ flex: 1, background: colors.surfaceContainerHigh, borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "Manrope", color: colors.onSurface }}>{spotifyData.minutes}</div>
              <div style={{ fontSize: 10, color: colors.onSurfaceVariant }}>min listened</div>
            </div>
          </div>
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <SectionLabel>Vibe estimate</SectionLabel>
          </div>
          <div style={{ textAlign: "center", margin: "8px 0 16px" }}>
            <span style={{ display: "inline-block", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: "#8cacff18", color: colors.primary }}>{spotifyData.vibe}</span>
          </div>
          <button
            onClick={() => setSpotifyConfirmed(true)}
            style={{ width: "100%", padding: "12px 0", borderRadius: 16, border: "none", background: colors.onSurface, color: colors.surface, fontWeight: 700, fontSize: 14, fontFamily: "Inter", cursor: "pointer" }}
          >
            That's about right
          </button>
        </Card>
      ) : (
        <Card style={{ background: colors.surfaceContainerLow }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 14, background: `${colors.secondary}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="insights" fill color={colors.secondary} size={22} />
            </div>
            <div>
              <SectionLabel>Mood insight</SectionLabel>
              <p style={{ fontSize: 15, fontWeight: 700, color: colors.onSurface, margin: "4px 0 0", fontFamily: "Manrope" }}>You've been consistent 3 days in a row 🔥</p>
            </div>
          </div>
        </Card>
      )}

      {/* Habits Today */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px", marginBottom: 10 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "Manrope", margin: 0 }}>Habits today</h2>
          <span style={{ fontSize: 13, color: colors.primary, fontWeight: 500 }}>View all</span>
        </div>
        <Card style={{ padding: 12 }}>
          {habits.slice(0, 3).map((h) => (
            <div
              key={h.id}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: colors.surfaceContainerHigh, borderRadius: 14, marginBottom: 8 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${h.iconColor}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={h.icon} color={h.iconColor} size={20} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: colors.onSurface }}>{h.name}</span>
              </div>
              <button
                onClick={() => toggleHabit(h.id)}
                style={{
                  width: 28, height: 28, borderRadius: 14,
                  border: h.done ? "none" : `2px solid ${colors.outlineVariant}`,
                  background: h.done ? colors.primary : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                {h.done && <Icon name="check" fill color="#fff" size={16} />}
              </button>
            </div>
          ))}
        </Card>
      </div>

      {/* Fitness Ring */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "Manrope", margin: "0 0 10px 4px" }}>Fitness</h2>
        <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 28, paddingBottom: 20 }}>
          <StepsRing />
          <div style={{ marginTop: 16, width: "100%", background: colors.surfaceContainerHigh, borderRadius: 14, padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <Icon name="event_repeat" color={colors.secondary} size={16} />
              <SectionLabel>Reminder</SectionLabel>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: colors.onSurface }}>HIIT Cardio Session at 5:30 PM</span>
          </div>
        </Card>
      </div>

      {/* Money Snapshot */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "Manrope", margin: "0 0 10px 4px" }}>Money</h2>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
            <div>
              <SectionLabel>Daily spend</SectionLabel>
              <p style={{ fontSize: 22, fontWeight: 700, margin: "4px 0 0", fontFamily: "Manrope" }}>
                $42.50 <span style={{ fontSize: 13, fontWeight: 400, color: colors.onSurfaceVariant }}>/ $60</span>
              </p>
            </div>
            <Icon name="account_balance_wallet" color={colors.primaryFixed} size={22} />
          </div>
          <ProgressBar value={42.5} max={60} color={colors.primary} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: colors.onSurfaceVariant }}>
            <span>Budget left</span>
            <span style={{ color: colors.tertiaryDim }}>$17.50</span>
          </div>
        </Card>
      </div>

      {/* Next Meal */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px", marginBottom: 10 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "Manrope", margin: 0 }}>Next meal</h2>
          <span style={{ fontSize: 13, color: colors.primary, fontWeight: 500 }}>View all</span>
        </div>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px 0" }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: colors.primary }}>Lunch · Up next</span>
          </div>
          <div style={{ display: "flex", gap: 14, padding: "12px 16px 16px", alignItems: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: 14, background: colors.surfaceContainerHigh, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="restaurant" color={colors.onSurfaceVariant} size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "Manrope", marginBottom: 4 }}>Grilled Harissa Chicken</div>
              <div style={{ fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 8 }}>Quinoa, Roasted Peppers, Hummus</div>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: colors.onSurfaceVariant }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: colors.primary, display: "inline-block" }} /> 45g Protein
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: colors.onSurfaceVariant }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: colors.secondary, display: "inline-block" }} /> 38g Carbs
                </span>
              </div>
            </div>
            <button style={{ padding: "8px 14px", borderRadius: 12, border: "none", background: colors.primary, color: "#001f56", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "Inter", flexShrink: 0 }}>
              Track
            </button>
          </div>
          <div style={{ padding: "10px 16px", borderTop: `1px solid ${colors.outlineVariant}12`, display: "flex", justifyContent: "space-between", fontSize: 11, color: colors.onSurfaceVariant }}>
            <span>3 of 5 meals tracked today</span>
            <span style={{ color: colors.tertiaryDim }}>2,450 kcal left</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── TAB: HABITS ───
function HabitsTab({ habits, toggleHabit }) {
  const doneCount = habits.filter((h) => h.done).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "Manrope", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Your habits</h1>
        <p style={{ fontSize: 14, color: colors.onSurfaceVariant, margin: 0 }}>{doneCount} of {habits.length} completed today</p>
      </div>

      {/* Streak summary */}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, background: colors.surfaceContainer, borderRadius: 16, padding: "16px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "Manrope", color: colors.tertiaryDim }}>{doneCount}</div>
          <div style={{ fontSize: 10, color: colors.onSurfaceVariant, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Done today</div>
        </div>
        <div style={{ flex: 1, background: colors.surfaceContainer, borderRadius: 16, padding: "16px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "Manrope", color: colors.primary }}>12</div>
          <div style={{ fontSize: 10, color: colors.onSurfaceVariant, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Best streak</div>
        </div>
        <div style={{ flex: 1, background: colors.surfaceContainer, borderRadius: 16, padding: "16px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "Manrope", color: colors.secondary }}>87%</div>
          <div style={{ fontSize: 10, color: colors.onSurfaceVariant, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Weekly rate</div>
        </div>
      </div>

      {/* Habits list */}
      <Card style={{ padding: 8 }}>
        {habits.map((h, i) => (
          <div
            key={h.id}
            style={{
              display: "flex", alignItems: "center", padding: "14px 12px",
              borderBottom: i < habits.length - 1 ? `1px solid ${colors.outlineVariant}15` : "none",
            }}
          >
            <button
              onClick={() => toggleHabit(h.id)}
              style={{
                width: 28, height: 28, borderRadius: 14, flexShrink: 0,
                border: h.done ? "none" : `2px solid ${colors.outlineVariant}`,
                background: h.done ? colors.tertiaryDim : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s", marginRight: 14,
              }}
            >
              {h.done && <Icon name="check" fill color="#000" size={16} />}
            </button>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${h.iconColor}18`, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 12, flexShrink: 0 }}>
              <Icon name={h.icon} color={h.iconColor} size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: h.done ? colors.onSurfaceVariant : colors.onSurface, textDecoration: h.done ? "line-through" : "none", transition: "all 0.2s" }}>{h.name}</div>
            </div>
            <span style={{ fontSize: 11, color: colors.onSurfaceVariant, whiteSpace: "nowrap" }}>
              {h.streak > 0 ? `${h.streak} day streak` : "New"}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── TAB: JOURNAL ───
function JournalTab() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [journalText, setJournalText] = useState("");
  const [view, setView] = useState("check-in");
  const [filter, setFilter] = useState("All Entries");
  const filters = ["All Entries", "Personal", "Gratitude", "Dreams"];

  if (view === "entries") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <SectionLabel>Journal</SectionLabel>
          <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "Manrope", margin: "4px 0 4px", letterSpacing: "-0.02em" }}>Your digital sanctuary</h1>
          <p style={{ fontSize: 13, color: colors.onSurfaceVariant, margin: 0 }}>Capturing the whispers of your mind, one entry at a time.</p>
        </div>

        <button
          onClick={() => setView("check-in")}
          style={{ width: "100%", padding: "14px 20px", borderRadius: 16, border: "none", background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDim})`, color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: "Inter", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", opacity: 0.8 }}>Start writing</div>
            <div>Free Writing</div>
          </div>
          <Icon name="edit" color="#fff" size={20} />
        </button>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "Manrope" }}>Mood trends</span>
            <span style={{ fontSize: 11, color: colors.tertiaryDim, fontWeight: 600 }}>Resilient</span>
          </div>
          <MoodTrendChart />
        </Card>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px", borderRadius: 10, border: `1px solid ${filter === f ? colors.primary + "50" : colors.outlineVariant + "30"}`,
                background: filter === f ? `${colors.primary}15` : "transparent",
                color: filter === f ? colors.primary : colors.onSurfaceVariant,
                fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "Inter",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: colors.onSurfaceVariant }}>Today</div>
        {journalEntries.map((e) => (
          <Card key={e.id} style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 16, background: `${e.iconColor}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={e.icon} fill color={e.iconColor} size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "Manrope" }}>{e.title}</div>
                <div style={{ fontSize: 11, color: colors.onSurfaceVariant }}>{e.time} · {e.tag}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 1.6, margin: "0 0 10px" }}>{e.body}</p>
            <div style={{ display: "flex", gap: 6 }}>
              {e.tags.map((t) => (
                <span key={t} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: colors.surfaceContainerLow, color: colors.onSurfaceVariant }}>{t}</span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "Manrope", margin: "0 0 6px", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
          How are you <span style={{ color: colors.primary, fontStyle: "italic" }}>really</span> feeling?
        </h1>
        <p style={{ fontSize: 14, color: colors.onSurfaceVariant, margin: 0 }}>Take a moment to check in with yourself.</p>
      </div>

      <div>
        <SectionLabel>Current resonance</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
          {moodOptions.map((m) => (
            <button
              key={m.label}
              onClick={() => setSelectedMood(m.label)}
              style={{
                padding: "10px 18px", borderRadius: 16, border: `1px solid ${selectedMood === m.label ? m.color + "50" : colors.outlineVariant + "30"}`,
                background: selectedMood === m.label ? `${m.color}18` : colors.surfaceContainerHigh,
                color: selectedMood === m.label ? m.color : colors.onSurface,
                fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                fontFamily: "Inter", transition: "all 0.2s",
              }}
            >
              <Icon name={m.icon} fill={selectedMood === m.label} color={selectedMood === m.label ? m.color : colors.onSurfaceVariant} size={16} />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <Card style={{ background: `${colors.surfaceContainer}99`, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionLabel>Reflection</SectionLabel>
          <button style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: colors.primary, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Inter" }}>
            <Icon name="mic" color={colors.primary} size={18} /> Voice note
          </button>
        </div>
        <textarea
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          placeholder="Today felt like..."
          style={{
            width: "100%", minHeight: 140, background: "transparent", border: "none", outline: "none",
            color: colors.onSurface, fontSize: 16, fontFamily: "Inter", resize: "none", lineHeight: 1.7,
          }}
        />
        <div style={{ borderTop: `1px solid ${colors.outlineVariant}15`, paddingTop: 14, marginTop: 12 }}>
          <SectionLabel>Contextual focus</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {["#stress", "#gym", "#work", "#relationships"].map((t) => (
              <span key={t} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: colors.surfaceContainerLow, border: `1px solid ${colors.outlineVariant}20`, color: colors.onSurfaceVariant }}>{t}</span>
            ))}
            <button style={{ padding: "4px 8px", borderRadius: 8, background: colors.surfaceContainerHighest, border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <Icon name="add" color={colors.primary} size={14} />
            </button>
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => setView("entries")}
          style={{ flex: 1, padding: "14px 0", borderRadius: 20, border: "none", background: "transparent", color: colors.onSurfaceVariant, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "Inter" }}
        >
          Skip
        </button>
        <button
          onClick={() => setView("entries")}
          style={{ flex: 2, padding: "14px 0", borderRadius: 20, border: "none", background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDim})`, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "Inter" }}
        >
          Continue
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card style={{ padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 140, background: colors.surfaceContainerLow }}>
          <Icon name="insights" color={colors.secondary} size={28} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "Manrope", marginBottom: 4 }}>Weekly trends</div>
            <div style={{ fontSize: 12, color: colors.onSurfaceVariant }}>You've felt 'Reflective' 4 times this week.</div>
          </div>
        </Card>
        <Card style={{ padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 140, background: colors.surfaceContainerLow }}>
          <Icon name="psychology" color={colors.tertiaryDim} size={28} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "Manrope", marginBottom: 4 }}>Guided prompt</div>
            <div style={{ fontSize: 12, color: colors.onSurfaceVariant, fontStyle: "italic" }}>"What's one thing that surprised you today?"</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── TAB: HEALTH ───
function HealthTab() {
  const [selectedLift, setSelectedLift] = useState("Deadlift");
  const lifts = ["Squat", "Deadlift", "Bench"];
  const projections = { Squat: [80, 85, 95, 105, 110, 120], Deadlift: [100, 110, 120, 130, 135, 148], Bench: [60, 65, 70, 78, 82, 90] };
  const projLabels = ["Oct 12", "Oct 19", "Oct 26", "Nov 02", "Current", "Projected"];
  const data = projections[selectedLift];
  const maxV = Math.max(...data);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <SectionLabel>Physical health</SectionLabel>
        <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "Manrope", margin: "4px 0 4px", letterSpacing: "-0.02em" }}>
          Movement<br /><span style={{ color: colors.tertiaryDim }}>Engine Active</span>
        </h1>
        <p style={{ fontSize: 13, color: colors.onSurfaceVariant, margin: 0 }}>Your body is in prime state for a high-intensity session today. Performance metrics are up 12% from last week.</p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "10px 0" }}>
        <StepsRing size={140} />
      </div>

      {/* Gym Suggestion */}
      <Card style={{ background: colors.surfaceContainerLow }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: `${colors.tertiaryDim}20`, color: colors.tertiaryDim, textTransform: "uppercase", letterSpacing: "0.05em" }}>Gym suggestion</span>
          <span style={{ fontSize: 11, color: colors.onSurfaceVariant }}>45 mins</span>
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, fontFamily: "Manrope", margin: "0 0 6px" }}>Posterior Chain Focus</h3>
        <p style={{ fontSize: 13, color: colors.onSurfaceVariant, margin: "0 0 16px", lineHeight: 1.5 }}>Optimized for your current recovery levels. Focus on Deadlifts and high-volume Rows.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ flex: 1, padding: "12px 0", borderRadius: 16, border: "none", background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDim})`, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Inter", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            Start Workout <Icon name="play_arrow" fill color="#fff" size={18} />
          </button>
          <button style={{ flex: 1, padding: "12px 0", borderRadius: 16, border: "none", background: colors.surfaceContainerHighest, color: colors.onSurface, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "Inter" }}>
            Swap for Home
          </button>
        </div>
      </Card>

      {/* Weekly Plan */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: "Manrope", margin: 0 }}>Weekly plan</h3>
          <Icon name="calendar_today" color={colors.onSurfaceVariant} size={18} />
        </div>
        {weeklyPlan.map((d) => (
          <div key={d.day} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${colors.outlineVariant}10` }}>
            <div style={{
              width: 24, height: 24, borderRadius: 12,
              background: d.status === "done" ? colors.tertiaryDim : d.status === "current" ? `${colors.primary}30` : colors.surfaceContainerHigh,
              border: d.status === "current" ? `2px solid ${colors.primary}` : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {d.status === "done" && <Icon name="check" fill color="#000" size={14} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: d.status === "current" ? 700 : 500, color: d.status === "current" ? colors.primary : colors.onSurface }}>
                {d.day}: {d.label}
              </div>
              <div style={{ fontSize: 11, color: colors.onSurfaceVariant }}>
                {d.status === "done" ? `Completed · ${d.duration}` : d.status === "current" ? "Current target" : d.duration || ""}
              </div>
            </div>
          </div>
        ))}
        <button style={{ marginTop: 12, background: "none", border: "none", color: colors.primary, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter" }}>
          Edit Plan Architecture
        </button>
      </Card>

      {/* Strength Projection */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "Manrope", margin: "0 0 4px 4px" }}>Strength projection</h3>
        <p style={{ fontSize: 12, color: colors.onSurfaceVariant, margin: "0 0 10px 4px" }}>Real-time max lift estimates based on volume.</p>
        <div style={{ display: "flex", gap: 6, marginBottom: 12, paddingLeft: 4 }}>
          {lifts.map((l) => (
            <button
              key={l}
              onClick={() => setSelectedLift(l)}
              style={{
                padding: "5px 14px", borderRadius: 10, border: `1px solid ${selectedLift === l ? colors.primary + "50" : colors.outlineVariant + "30"}`,
                background: selectedLift === l ? `${colors.primary}18` : "transparent",
                color: selectedLift === l ? colors.primary : colors.onSurfaceVariant,
                fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "Inter",
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <Card style={{ padding: "20px 16px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100, justifyContent: "space-around" }}>
            {data.map((v, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                <div style={{
                  width: "70%", borderRadius: 6, transition: "height 0.3s",
                  height: `${(v / maxV) * 80}px`,
                  background: i === data.length - 1 ? `${colors.primary}40` : i === data.length - 2 ? colors.primary : colors.primaryFixed + "60",
                  border: i === data.length - 1 ? `1px dashed ${colors.primary}` : "none",
                }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8 }}>
            {projLabels.map((l, i) => (
              <span key={i} style={{ fontSize: 8, color: i === 4 ? colors.primary : colors.onSurfaceVariant, textAlign: "center", flex: 1, fontWeight: i >= 4 ? 700 : 400, textTransform: "uppercase" }}>{l}</span>
            ))}
          </div>
        </Card>
      </div>

      {/* Vitals */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Resting HR", value: "58", unit: "BPM", icon: "favorite", color: colors.error },
          { label: "SpO2 level", value: "98", unit: "%", icon: "air", color: colors.primary },
          { label: "Sleep score", value: "7h 42m", unit: "", icon: "dark_mode", color: colors.tertiaryDim },
          { label: "Kcal burn", value: "2,140", unit: "", icon: "local_fire_department", color: colors.secondary },
        ].map((v) => (
          <Card key={v.label} style={{ padding: 16 }}>
            <Icon name={v.icon} fill color={v.color} size={20} />
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "Manrope", margin: "8px 0 0" }}>
              {v.value} <span style={{ fontSize: 13, fontWeight: 400, color: colors.onSurfaceVariant }}>{v.unit}</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: colors.onSurfaceVariant, marginTop: 2 }}>{v.label}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── TAB: WALLET ───
function WalletTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Monthly Overview */}
      <Card style={{ background: colors.surfaceContainerLow }}>
        <SectionLabel>Monthly overview</SectionLabel>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 6 }}>
          <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "Manrope", color: colors.primary }}>$4,850.00</div>
          <Icon name="account_balance_wallet" color={colors.primaryFixed} size={28} />
        </div>
        <div style={{ display: "flex", gap: 10, margin: "20px 0 0" }}>
          <div style={{ flex: 1, background: colors.surfaceContainerHigh, borderRadius: 12, padding: "10px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: colors.onSurfaceVariant }}>Income</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.tertiaryDim, fontFamily: "Manrope" }}>+$6,200</div>
          </div>
          <div style={{ flex: 1, background: colors.surfaceContainerHigh, borderRadius: 12, padding: "10px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: colors.onSurfaceVariant }}>Expenses</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.secondary, fontFamily: "Manrope" }}>-$1,350</div>
          </div>
        </div>
      </Card>

      {/* Achievement */}
      <Card style={{ textAlign: "center", padding: 24, background: `linear-gradient(135deg, ${colors.surfaceContainerLow}, ${colors.surfaceContainer})` }}>
        <div style={{ width: 48, height: 48, borderRadius: 24, background: `${colors.primary}20`, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="auto_awesome" fill color={colors.primary} size={24} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: "Manrope", margin: "0 0 6px" }}>Great Job!</h3>
        <p style={{ fontSize: 13, color: colors.onSurfaceVariant, margin: "0 0 14px", lineHeight: 1.5 }}>You saved 22% more than last month. You're on track for your SSD goal.</p>
        <button style={{ padding: "10px 28px", borderRadius: 14, border: `1px solid ${colors.outlineVariant}30`, background: "transparent", color: colors.onSurface, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "Inter" }}>
          View Insights
        </button>
      </Card>

      {/* Categories */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px", marginBottom: 10 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "Manrope", margin: 0 }}>Categories</h3>
          <span style={{ fontSize: 13, color: colors.primary, fontWeight: 500 }}>Manage</span>
        </div>
        <Card style={{ padding: 16 }}>
          {budgetCategories.map((c, i) => (
            <div key={c.name} style={{ marginBottom: i < budgetCategories.length - 1 ? 18 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                <span style={{ fontSize: 12, color: colors.onSurfaceVariant }}>${c.spent.toLocaleString()} / ${c.total.toLocaleString()}</span>
              </div>
              <ProgressBar value={c.spent} max={c.total} color={c.color} />
            </div>
          ))}
        </Card>
      </div>

      {/* Savings Goal */}
      <Card style={{ background: colors.surfaceContainerLow }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "Manrope" }}>New SSD</div>
            <div style={{ fontSize: 11, color: colors.onSurfaceVariant }}>Tech Upgrade Fund</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: `${colors.tertiaryDim}20`, color: colors.tertiaryDim, textTransform: "uppercase", letterSpacing: "0.04em" }}>75% done</span>
        </div>
        <ProgressBar value={75} max={100} color={colors.tertiaryDim} height={8} />
        <div style={{ textAlign: "right", marginTop: 6, fontSize: 13, fontWeight: 600, color: colors.onSurfaceVariant }}>$150 left</div>
      </Card>

      {/* Upcoming Bills */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "Manrope", margin: "0 0 10px 4px" }}>Upcoming bills</h3>
        <Card style={{ padding: 8 }}>
          {upcomingBills.map((b, i) => (
            <div key={b.name} style={{ display: "flex", alignItems: "center", padding: "12px", borderBottom: i < upcomingBills.length - 1 ? `1px solid ${colors.outlineVariant}10` : "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${b.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Icon name={b.icon} color={b.color} size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{b.name}</div>
                <div style={{ fontSize: 11, color: colors.onSurfaceVariant }}>Due in {b.due}</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "Manrope" }}>${b.amount.toFixed(2)}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── TAB: MEALS ───
function MealsTab() {
  const [tracked, setTracked] = useState(mealProtocol.map(m => m.tracked));
  const [activeDay, setActiveDay] = useState(2);

  const toggleMeal = (i) => setTracked(prev => prev.map((t, idx) => idx === i ? !t : t));
  const trackedCount = tracked.filter(Boolean).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: "Manrope", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Fuel for your goals</h1>
        <p style={{ fontSize: 13, color: colors.onSurfaceVariant, margin: 0 }}>
          Optimizing nutrition for your <span style={{ color: colors.tertiaryDim, fontWeight: 600 }}>Hypertrophy phase</span>.
        </p>
      </div>

      {/* Calendar strip */}
      <div style={{ display: "flex", justifyContent: "space-between", background: colors.surfaceContainerLow, borderRadius: 18, padding: "6px 4px" }}>
        {calendarDays.map((d, i) => (
          <button
            key={d.day}
            onClick={() => setActiveDay(i)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "10px 14px", borderRadius: 14, border: "none", cursor: "pointer",
              background: activeDay === i ? `${colors.brand}18` : "transparent",
              color: activeDay === i ? colors.brand : colors.onSurfaceVariant,
              fontFamily: "Inter", transition: "all 0.2s",
            }}
          >
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{d.day}</span>
            <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "Manrope" }}>{d.date}</span>
          </button>
        ))}
      </div>

      {/* Macro summary */}
      <Card style={{ background: colors.surfaceContainerHigh }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <SectionLabel>Daily summary</SectionLabel>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "Manrope", margin: "4px 0 0" }}>
              2,450 <span style={{ fontSize: 14, fontWeight: 400, color: colors.onSurfaceVariant }}>kcal left</span>
            </div>
          </div>
          <Icon name="restaurant_menu" color={colors.onSurfaceVariant} size={28} />
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {[
            { label: "Protein", val: 142, max: 210, color: colors.primary },
            { label: "Carbs", val: 115, max: 285, color: colors.secondary },
            { label: "Fats", val: 62, max: 75, color: colors.tertiaryDim },
          ].map(m => (
            <div key={m.label} style={{ flex: 1 }}>
              <ProgressBar value={m.val} max={m.max} color={m.color} height={4} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {[
            { label: "Protein", val: "142g", max: "/ 210g", color: colors.primary },
            { label: "Carbs", val: "115g", max: "/ 285g", color: colors.secondary },
            { label: "Fats", val: "62g", max: "/ 75g", color: colors.tertiaryDim },
          ].map(m => (
            <div key={m.label} style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: colors.onSurfaceVariant }}>{m.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: m.color, fontFamily: "Manrope" }}>
                {m.val} <span style={{ fontSize: 11, fontWeight: 400, color: colors.onSurfaceVariant }}>{m.max}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Today's Protocol */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px", marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "Manrope", margin: 0 }}>Today's protocol</h3>
          <span style={{ fontSize: 11, color: colors.primary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{trackedCount} of 5 tracked</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {mealProtocol.map((m, i) => (
            <Card
              key={i}
              style={{
                padding: "14px 16px",
                background: m.upNext ? `${colors.primary}0a` : colors.surfaceContainerLow,
                border: m.upNext ? `1px solid ${colors.primary}20` : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: colors.surfaceContainerHigh, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="restaurant" color={m.upNext ? colors.primary : colors.onSurfaceVariant} size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: m.upNext ? colors.primary : colors.onSurfaceVariant, marginBottom: 2 }}>
                    {m.slot}{m.upNext ? " · Up next" : ""}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "Manrope" }}>{m.name}</div>
                  {m.desc && <div style={{ fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>{m.desc}</div>}
                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    {m.kcal && <span style={{ fontSize: 11, color: colors.onSurfaceVariant }}>{m.kcal} kcal</span>}
                    {m.protein && (
                      <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: colors.onSurfaceVariant }}>
                        <span style={{ width: 5, height: 5, borderRadius: 3, background: colors.primary, display: "inline-block" }} />{m.protein}g Protein
                      </span>
                    )}
                    {m.carbs && (
                      <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: colors.onSurfaceVariant }}>
                        <span style={{ width: 5, height: 5, borderRadius: 3, background: colors.secondary, display: "inline-block" }} />{m.carbs}g Carbs
                      </span>
                    )}
                  </div>
                </div>
                {m.upNext ? (
                  <button
                    onClick={() => toggleMeal(i)}
                    style={{ padding: "8px 14px", borderRadius: 12, border: "none", background: tracked[i] ? colors.tertiaryDim : colors.primary, color: "#001f56", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "Inter", flexShrink: 0 }}
                  >
                    {tracked[i] ? "Tracked" : "Track"}
                  </button>
                ) : (
                  <button
                    onClick={() => toggleMeal(i)}
                    style={{ width: 28, height: 28, borderRadius: 14, border: "none", background: tracked[i] ? colors.tertiaryDim : colors.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                  >
                    {tracked[i] && <Icon name="check" fill color="#000" size={16} />}
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Smart Suggestions */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "Manrope", margin: "0 0 2px" }}>Smart suggestions</h3>
            <p style={{ fontSize: 11, color: colors.onSurfaceVariant, margin: 0 }}>Based on your remaining 60g protein target</p>
          </div>
          <span style={{ fontSize: 12, color: colors.primary, fontWeight: 600 }}>View all</span>
        </div>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, margin: "0 -16px", padding: "0 0 4px 0" }}>
          {smartSuggestions.map((s) => (
            <div key={s.name} style={{ flexShrink: 0, width: 180, background: colors.surfaceContainer, borderRadius: 20, overflow: "hidden" }}>
              <div style={{ height: 110, background: colors.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <Icon name="restaurant" color={colors.onSurfaceVariant} size={36} />
                <div style={{ position: "absolute", bottom: 8, left: 8, padding: "3px 10px", borderRadius: 20, background: "rgba(0,0,0,0.6)", fontSize: 9, fontWeight: 700, color: s.tagColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {s.tag}
                </div>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "Manrope", marginBottom: 2 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 10 }}>{s.desc}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{s.protein}g Protein</span>
                  <button style={{ width: 28, height: 28, borderRadius: 10, background: colors.surfaceContainerHighest, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Icon name="add" color={colors.onSurface} size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ───
const tabs = [
  { id: "home", label: "Home", icon: "home" },
  { id: "habits", label: "Habits", icon: "check_circle" },
  { id: "journal", label: "Journal", icon: "edit_note" },
  { id: "health", label: "Health", icon: "fitness_center" },
  { id: "meals", label: "Meals", icon: "restaurant_menu" },
  { id: "wallet", label: "Wallet", icon: "account_balance_wallet" },
];

export default function LuminaryApp() {
  const [activeTab, setActiveTab] = useState("home");
  const [habits, setHabits] = useState(baseHabits.map((h) => ({ ...h, done: h.id === 1 })));
  const [spotifyConfirmed, setSpotifyConfirmed] = useState(false);
  const scrollRef = useRef(null);

  const toggleHabit = (id) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, done: !h.done } : h)));
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [activeTab]);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      <div style={{
        width: "100%", maxWidth: 420, margin: "0 auto",
        height: "92vh", minHeight: 640,
        background: colors.surface, borderRadius: 24,
        display: "flex", flexDirection: "column",
        fontFamily: "Inter, sans-serif", color: colors.onSurface,
        overflow: "hidden", position: "relative",
        border: `1px solid ${colors.outlineVariant}20`,
      }}>
        {/* Header */}
        <header style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 20px", flexShrink: 0,
          background: `${colors.surface}cc`, backdropFilter: "blur(20px)",
          zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 18, background: colors.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="person" fill color={colors.primary} size={20} />
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.onSurfaceVariant }}>Welcome back</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: colors.brand, fontFamily: "Manrope", letterSpacing: "-0.01em" }}>Luminary</div>
            </div>
          </div>
          <button style={{ width: 36, height: 36, borderRadius: 12, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="notifications" color={colors.onSurfaceVariant} size={22} />
          </button>
        </header>

        {/* Scrollable Content */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 16px 24px" }}>
          {activeTab === "home" && <HomeTab habits={habits} toggleHabit={toggleHabit} spotifyConfirmed={spotifyConfirmed} setSpotifyConfirmed={setSpotifyConfirmed} />}
          {activeTab === "habits" && <HabitsTab habits={habits} toggleHabit={toggleHabit} />}
          {activeTab === "journal" && <JournalTab />}
          {activeTab === "health" && <HealthTab />}
          {activeTab === "meals" && <MealsTab />}
          {activeTab === "wallet" && <WalletTab />}
        </div>

        {/* Bottom Nav */}
        <nav style={{
          display: "flex", justifyContent: "space-around", alignItems: "center",
          padding: "8px 8px 18px", flexShrink: 0,
          background: `${colors.surface}dd`, backdropFilter: "blur(24px)",
          borderTop: `1px solid ${colors.outlineVariant}10`,
        }}>
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: "6px 14px", borderRadius: 14, border: "none", cursor: "pointer",
                  background: isActive ? `${colors.brand}15` : "transparent",
                  color: isActive ? colors.brand : "#64748b",
                  transition: "all 0.2s", fontFamily: "Inter",
                }}
              >
                <Icon name={t.icon} fill={isActive} color={isActive ? colors.brand : "#64748b"} size={22} />
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginTop: 2 }}>{t.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
