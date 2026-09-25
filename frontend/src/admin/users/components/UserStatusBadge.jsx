const STATUS_STYLES = {
  ACTIVE: { label: "Active", classes: "bg-green-50 text-green-700", dot: "bg-green-500" },
  INACTIVE: { label: "Inactive", classes: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  BLOCKED: { label: "Blocked", classes: "bg-red-50 text-red-700", dot: "bg-red-500" },
  DELETED: { label: "Deleted", classes: "bg-gray-100 text-gray-500", dot: "bg-gray-400" },
};

export default function UserStatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { label: status || "Unknown", classes: "bg-gray-100 text-gray-500", dot: "bg-gray-400" };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${style.classes}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}