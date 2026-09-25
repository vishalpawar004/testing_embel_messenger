const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "DELETED", label: "Deleted" },
];

const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Newest first" },
  { value: "createdAt_asc", label: "Oldest first" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "lastSeenAt_desc", label: "Recently active" },
];

const selectClasses =
  "rounded-[8px] border border-[#E5E7EB] bg-white py-2.5 pl-3 pr-8 text-[13.5px] text-[#1E2328] outline-none cursor-pointer focus:border-[#fd7e13]";

export default function UserFilters({ status, onStatusChange, sort, onSortChange }) {
  return (
    <div className="flex items-center gap-2.5">
      <select value={status} onChange={(e) => onStatusChange(e.target.value)} aria-label="Filter by status" className={selectClasses}>
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select value={sort} onChange={(e) => onSortChange(e.target.value)} aria-label="Sort users" className={selectClasses}>
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}