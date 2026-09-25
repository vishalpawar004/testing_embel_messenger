import { ArrowRight, Flag } from "lucide-react";

// Dummy reports data
const reports = [
  {
    id: "#1001",
    reporter: "Rahul Sharma",
    reported: "Amit Patil",
    reason: "Spam",
    time: "10 min ago",
    status: "Pending",
  },
  {
    id: "#1002",
    reporter: "Nikita Singh",
    reported: "User123",
    reason: "Abuse",
    time: "1 hour ago",
    status: "Resolved",
  },
  {
    id: "#1003",
    reporter: "Kuldeep Verma",
    reported: "John Doe",
    reason: "Inappropriate",
    time: "2 hours ago",
    status: "Pending",
  },
  {
    id: "#1004",
    reporter: "Sagar Malhotra",
    reported: "User456",
    reason: "Harassment",
    time: "3 hours ago",
    status: "Resolved",
  },
];

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function StatusBadge({ status }) {
  const isPending = status === "Pending";
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium ${
        isPending ? "bg-[#FBF0DD] text-[#B8862E]" : "bg-[#E4F2E8] text-[#3E8E5A]"
      }`}
    >
      {status}
    </span>
  );
}

export default function RecentReports() {
  return (
    <div className="col-span-full rounded-[10px] border border-[#E4E0D6] bg-white p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#FFF0E5] text-[#fd7e13]">
            <Flag size={14} />
          </div>
          <span className="text-[14.5px] font-semibold text-[#1E2328]">Recent reports</span>
        </div>

        <button
          type="button"
          className="flex items-center gap-1 text-[12.5px] font-medium text-[#fd7e13] hover:underline"
        >
          View all
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Reports list */}
      <div className="flex flex-col">
        {reports.map((report, i) => (
          <div
            key={report.id}
            className={`flex items-center justify-between gap-4 py-3 ${
              i < reports.length - 1 ? "border-b border-[#F0EEE7]" : ""
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF0E5] text-[12px] font-semibold text-[#fd7e13]">
                {initials(report.reporter)}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-1 text-[12.5px]">
                  <span className="font-mono text-[11.5px] text-[#9AA0A6]">{report.id}</span>
                  <span className="font-medium text-[#1E2328]">{report.reporter}</span>
                  <span className="text-[#9AA0A6]">reported</span>
                  <span className="font-medium text-[#1E2328]">{report.reported}</span>
                </div>
                <div className="mt-0.5 truncate text-[12px] text-[#6B7178]">
                  {report.reason} · {report.time}
                </div>
              </div>
            </div>

            <StatusBadge status={report.status} />
          </div>
        ))}
      </div>
    </div>
  );
}