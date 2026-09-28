import { Search, ShieldCheck, Shield, User } from "lucide-react";
import embelLogo from "../../../assets/logo-embel.png";
import SettingsMenu from "./Settingsmenu";
import { getCurrentUser } from "../../../services/authService";

function initialsFromName(name) {
  return (
    (name || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("") || "?"
  );
}

export default function TopHeader({ chat }) {
  const { currentUserName, isSuperAdmin } = chat;

  const currentUser = getCurrentUser();
  const userName = currentUserName || currentUser?.name || "User";

  // Normalize role string (e.g., ROLE_SUPER_ADMIN, SUPER_ADMIN, ADMIN, USER)
  const rawRole = String(currentUser?.role || (isSuperAdmin ? "SUPER_ADMIN" : "USER"))
    .toUpperCase()
    .replace(/^ROLE_/, "");

  const isSuper = isSuperAdmin || rawRole.includes("SUPER");
  const isAdmin = !isSuper && rawRole.includes("ADMIN");

  // Display label and styling based on role
  let roleLabel = "Member";
  let roleBadgeClass = "bg-[#F1F0EC] text-[#6B7178] border-[#E4E0D6]";
  let RoleIcon = User;

  if (isSuper) {
    roleLabel = "Super Admin";
    roleBadgeClass = "bg-[#FFF0E5] text-[#fd7e13] border-[#FDBA74]/40 font-semibold";
    RoleIcon = ShieldCheck;
  } else if (isAdmin) {
    roleLabel = "Admin";
    roleBadgeClass = "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE] font-semibold";
    RoleIcon = Shield;
  }

  const initials = initialsFromName(userName);

  return (
    <div className="flex items-center gap-4 border-b border-[#EDEAE2] bg-white px-6 py-2.5">
      {/* Brand Logo */}
      <div className="flex shrink-0 items-center gap-2">
        <img src={embelLogo} alt="Embel" className="h-11 w-auto object-contain" />
      </div>

      {/* Center Search Input */}
      <label className="mx-auto hidden w-full max-w-md items-center gap-2.5 rounded-full border border-transparent bg-[#F4F3EF] px-4 py-2 text-[#6B7178] transition-all focus-within:border-[#fd7e13] focus-within:bg-white focus-within:shadow-sm md:flex">
        <Search size={15} className="shrink-0 text-[#9AA0A6]" />
        <input
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9AA0A6]"
          placeholder="Search chat or conversations..."
        />
      </label>

      {/* Right Controls: Settings + Modern User Role Pill */}
      <div className="ml-auto flex shrink-0 items-center gap-3">
        {/* Settings Dropdown Button */}
        <SettingsMenu />

        <div className="h-6 w-px bg-[#EDEAE2]" />

        {/* User Card Pill */}
        <div
          title={`Logged in as ${userName} (${roleLabel})`}
          className="flex items-center gap-3 rounded-full border border-[#EDEAE2] bg-[#FAF9F6] py-1 pl-1 pr-3.5 shadow-sm transition-all hover:border-[#D5D0C5] hover:bg-white"
        >
          {/* Avatar with Status Indicator Dot */}
          <div className="relative">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white shadow-sm ring-2 ring-white"
              style={{
                background: isSuper
                  ? "linear-gradient(135deg, #fd7e13 0%, #ea580c 100%)"
                  : isAdmin
                  ? "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)"
                  : "linear-gradient(135deg, #64748B 0%, #475569 100%)",
              }}
            >
              {initials}
            </span>
            {/* Online Green Indicator Dot */}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#10B981]" />
          </div>

          {/* Name & Styled Role Badge */}
          <div className="flex flex-col text-left">
            <span className="max-w-[130px] truncate text-[13px] font-semibold text-[#1E2328]">
              {userName}
            </span>
            <div className="mt-0.5 flex items-center">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.2 text-[10px] tracking-wide ${roleBadgeClass}`}
              >
                <RoleIcon size={10} className="shrink-0" />
                {roleLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}