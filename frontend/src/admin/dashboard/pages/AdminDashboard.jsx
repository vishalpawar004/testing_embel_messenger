import {
  Bell,
  ChevronDown,
  Users,
  UsersRound,
  Flag,
  MessagesSquare,
  Files,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AdminHeader from "../../layout/AdminHeader";
import RecentReports from "../components/RecentReports";

const t = {
  bg: "#F4F2EC",
  panel: "#FFFFFF",
  border: "#E4E0D6",
  text: "#1E2328",
  textMuted: "#6B7178",
  textFaint: "#9AA0A6",
  accent: "#fd7e13",
  accentSoft: "#FFF0E5",
  accentLink: "#fd7e13",
  green: "#3E8E5A",
  greenBg: "#E4F2E8",
  amber: "#B8862E",
  amberBg: "#FBF0DD",
  red: "#C1443A",
  redBg: "#FAE6E3",
  navyDark: "#122026",
};

const activityData = [
  { day: "May 18", users: 1350, online: 720 },
  { day: "May 19", users: 1520, online: 780 },
  { day: "May 20", users: 1420, online: 740 },
  { day: "May 21", users: 1480, online: 700 },
  { day: "May 22", users: 1300, online: 770 },
  { day: "May 23", users: 1560, online: 760 },
  { day: "May 24", users: 1500, online: 800 },
];

const reports = [
  { id: "#1001", reporter: "Rahul Sharma", reported: "Amit Patil", reason: "Spam", time: "10 min ago", status: "Pending" },
  { id: "#1002", reporter: "Nikita Singh", reported: "User123", reason: "Abuse", time: "1 hour ago", status: "Resolved" },
  { id: "#1003", reporter: "Kuldeep Verma", reported: "John Doe", reason: "Inappropriate", time: "2 hours ago", status: "Pending" },
  { id: "#1004", reporter: "Sagar Malhotra", reported: "User456", reason: "Harassment", time: "3 hours ago", status: "Resolved" },
];

function Avatar({ label, bg, size = 40 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {label}
    </div>
  );
}

function StatusBadge({ status }) {
  const isPending = status === "Pending";
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: 999,
        background: isPending ? t.amberBg : t.greenBg,
        color: isPending ? t.amber : t.green,
      }}
    >
      {status}
    </span>
  );
}

function StatCard({ icon, label, value, delta, positive }) {
  return (
    <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: 10, padding: "16px 18px", flex: 1, minWidth: 150 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: t.accentSoft, color: t.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        <span style={{ fontSize: 13, color: t.textMuted }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 600, color: t.text }}>{value}</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: positive ? t.green : t.red }}>{delta}</span>
      </div>
    </div>
  );
}

function DonutChart() {
  const segments = [
    { label: "Active", value: 70, color: t.accent },
    { label: "Inactive", value: 20, color: t.amber },
    { label: "Blocked", value: 10, color: t.red },
  ];
  let acc = 0;
  const r = 60;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg width="150" height="150" viewBox="0 0 150 150">
        <g transform="translate(75,75) rotate(-90)">
          {segments.map((s, i) => {
            const len = (s.value / 100) * c;
            const el = (
              <circle
                key={i}
                r={r}
                cx="0"
                cy="0"
                fill="none"
                stroke={s.color}
                strokeWidth="18"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-acc}
                strokeLinecap="butt"
              />
            );
            acc += len;
            return el;
          })}
        </g>
        <text x="75" y="70" textAnchor="middle" fontSize="20" fontWeight="600" fill={t.text}>
          12,450
        </text>
        <text x="75" y="90" textAnchor="middle" fontSize="11" fill={t.textMuted}>
          Total users
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block" }} />
            <span style={{ color: t.textMuted }}>{s.label}</span>
            <span style={{ fontWeight: 500, color: t.text }}>{s.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-[#F4F2EC] p-4">


      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
      `}</style>
      <AdminHeader />

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22,marginTop:20 }}>
        <StatCard icon={<Users size={17} />} label="Total users" value="12,450" delta="+12.5%" positive />
        <StatCard icon={<Users size={17} />} label="Online users" value="1,245" delta="+8.3%" positive />
        <StatCard icon={<MessagesSquare size={17} />} label="Total messages" value="85,240" delta="+15.8%" positive />
        <StatCard icon={<UsersRound size={17} />} label="Groups" value="856" delta="+5.2%" positive />
        <StatCard icon={<Flag size={17} />} label="Reports" value="32" delta="-3.1%" />
        <StatCard icon={<Files size={17} />} label="Storage used" value="256 GB" delta="+10.2%" positive />
      </div>

      <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
    alignItems: "stretch",
  }}
>
  {/* User Activity */}
  <div
    style={{
      gridColumn: "1 / span 2",
      minWidth: 0,
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      padding: "18px 20px",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
      }}
    >
      <span
        style={{
          fontSize: 14.5,
          fontWeight: 600,
          color: t.text,
        }}
      >
        User activity
      </span>

      <div
        style={{
          display: "flex",
          gap: 14,
          fontSize: 12,
          color: t.textMuted,
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: t.accent,
              display: "inline-block",
            }}
          />
          Users
        </span>

        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: t.amber,
              display: "inline-block",
            }}
          />
          Online users
        </span>
      </div>
    </div>

    <div style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={activityData}
          margin={{
            top: 6,
            right: 8,
            left: -18,
            bottom: 0,
          }}
        >
          <CartesianGrid
            stroke={t.border}
            vertical={false}
          />

          <XAxis
            dataKey="day"
            tick={{
              fontSize: 11,
              fill: t.textFaint,
            }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{
              fontSize: 11,
              fill: t.textFaint,
            }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: `1px solid ${t.border}`,
            }}
          />

          <Line
            type="monotone"
            dataKey="users"
            stroke={t.accent}
            strokeWidth={2}
            dot={{ r: 3 }}
          />

          <Line
            type="monotone"
            dataKey="online"
            stroke={t.amber}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>

  {/* System Overview */}
  <div
    style={{
      gridColumn: "3",
      gridRow: "1",
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      padding: "18px 20px",
    }}
  >
    <span
      style={{
        fontSize: 14.5,
        fontWeight: 600,
        display: "block",
        marginBottom: 14,
        color: t.text,
      }}
    >
      System overview
    </span>

    <DonutChart />
  </div>

  {/* Recent Reports */}
  <div
    style={{
      gridColumn: "1 / -1",
      marginTop: 0,
    }}
  >
    <RecentReports />
  </div>
</div>
    </div>
  );
}