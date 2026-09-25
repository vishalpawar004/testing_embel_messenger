import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";

import UserStatusBadge from "./UserStatusBadge";

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatRelative(dateString) {
  if (!dateString) return "—";

  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days < 30) return `${days}d ago`;

  return new Date(dateString).toLocaleDateString();
}

export default function UserTable({
  users,
  loading,
  onRowClick,
  onBlockToggle,
  onEdit,
  onDelete,
  page,
  totalPages,
  onPageChange,
}) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white">

      <table className="w-full table-fixed border-collapse text-[13.5px]">

        {/* TABLE HEADER */}
        <thead>
          <tr>

            {/* SR NO */}
            <th className="w-[6%] border-b border-[#E5E7EB] px-3 py-3.5 text-center text-[12.5px] font-medium text-[#6B7178]">
              Sr. No.
            </th>

            {/* USER */}
            <th className="w-[18%] border-b border-[#E5E7EB] px-5 py-3.5 text-left text-[12.5px] font-medium text-[#6B7178]">
              User
            </th>

            {/* EMAIL */}
            <th className="w-[17%] border-b border-[#E5E7EB] px-5 py-3.5 text-left text-[12.5px] font-medium text-[#6B7178]">
              Email
            </th>

            {/* PHONE */}
            <th className="w-[16%] border-b border-[#E5E7EB] px-5 py-3.5 text-left text-[12.5px] font-medium text-[#6B7178]">
              Phone
            </th>

            {/* STATUS */}
            <th className="w-[12%] border-b border-[#E5E7EB] px-5 py-3.5 text-left text-[12.5px] font-medium text-[#6B7178]">
              Status
            </th>

            {/* LAST SEEN */}
            <th className="w-[12%] border-b border-[#E5E7EB] px-5 py-3.5 text-left text-[12.5px] font-medium text-[#6B7178]">
              Last seen
            </th>

            {/* JOINED */}
            <th className="w-[10%] border-b border-[#E5E7EB] px-5 py-3.5 text-left text-[12.5px] font-medium text-[#6B7178]">
              Joined
            </th>

            {/* ACTION */}
            <th className="w-[9%] border-b border-[#E5E7EB] px-2 py-3.5 text-center text-[12.5px] font-medium text-[#6B7178]">
              Action
            </th>

          </tr>
        </thead>

        {/* TABLE BODY */}
        <tbody>

          {loading ? (

            <tr>
              <td
                colSpan={8}
                className="px-5 py-14 text-center text-[#6B7178]"
              >
                Loading users…
              </td>
            </tr>

          ) : users.length === 0 ? (

            <tr>
              <td
                colSpan={8}
                className="px-5 py-14 text-center text-[#6B7178]"
              >
                No users match these filters.
              </td>
            </tr>

          ) : (

            users.map((user, index) => (

              <tr
                key={user.id}
                onClick={() => onRowClick?.(user)}
                className="cursor-pointer border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#FAFAF9]"
              >

                {/* SR NO */}
                <td className="px-3 py-3.5 text-center text-[#6B7178]">
                  {(page - 1) * 10 + index + 1}
                </td>

                {/* USER */}
                <td className="overflow-hidden px-5 py-3.5">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF0E5] text-[13px] font-semibold text-[#fd7e13]">

                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials(user.name)
                      )}

                    </div>

                    <div className="min-w-0">

                      <div className="truncate font-medium text-[#1E2328]">
                        {user.name}
                      </div>

                      <div className="text-[12px] text-[#9AA0A6]">
                        ID #{user.id}
                      </div>

                    </div>

                  </div>

                </td>

                {/* EMAIL */}
                <td className="overflow-hidden px-5 py-3.5 text-[#5C6570]">
                  <div className="truncate">
                    {user.email || "—"}
                  </div>
                </td>

                {/* PHONE */}
                <td className="overflow-hidden px-5 py-3.5 text-[#5C6570]">
                  <div className="truncate">
                    {user.phone || "—"}
                  </div>
                </td>

                {/* STATUS */}
                <td className="px-5 py-3.5">
                  <UserStatusBadge status={user.status} />
                </td>

                {/* LAST SEEN */}
                <td className="px-5 py-3.5 text-[#5C6570]">
                  {formatRelative(user.lastSeenAt)}
                </td>

                {/* JOINED */}
                <td className="px-5 py-3.5 text-[#5C6570]">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "—"}
                </td>

                {/* ACTION */}
                <td className="px-2 py-3.5">

                  <div
                    className="flex items-center justify-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >

                    {/* BLOCK / UNBLOCK */}
                    <button
                      type="button"
                      title={
                        user.isBlocked
                          ? "Unblock user"
                          : "Block user"
                      }
                      onClick={() => onBlockToggle?.(user)}
                      className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#6B7178] transition hover:bg-[#F0EFEC] hover:text-[#1E2328]"
                    >
                      {user.isBlocked ? (
                        <CheckCircle2 size={17} />
                      ) : (
                        <Ban size={17} />
                      )}
                    </button>

                    {/* EDIT */}
                    <button
                      type="button"
                      title="Edit user"
                      onClick={() => onEdit?.(user)}
                      className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#6B7178] transition hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
                    >
                      <Pencil size={17} />
                    </button>

                    {/* DELETE */}
                    <button
                      type="button"
                      title="Delete user"
                      onClick={() => onDelete?.(user)}
                      className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#6B7178] transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={17} />
                    </button>

                  </div>

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

      {/* PAGINATION */}
      {!loading && users.length > 0 && (

        <div className="flex items-center justify-between border-t border-[#E5E7EB] px-5 py-3.5 text-[13px] text-[#6B7178]">

          <span>
            Page {page} of {totalPages}
          </span>

          <div className="flex gap-1.5">

            {/* PREVIOUS */}
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
              className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#E5E7EB] text-[#1E2328] disabled:text-[#C7C9CC]"
            >
              <ChevronLeft size={16} />
            </button>

            {/* CURRENT PAGE */}
            <button
              className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#fd7e13] bg-[#fd7e13] text-white"
            >
              {page}
            </button>

            {/* NEXT */}
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
              className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#E5E7EB] text-[#1E2328] disabled:text-[#C7C9CC]"
            >
              <ChevronRight size={16} />
            </button>

          </div>

        </div>

      )}

    </div>
  );
}