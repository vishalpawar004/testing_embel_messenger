import { useState } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Flag,
  Image,
  LayoutDashboard,
  MessagesSquare,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  UsersRound,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import embelLogo from "../../assets/logo-embel.png";
import embelFavicon from "../../assets/favicon.ico";

const navigation = [
  {
    label: "Dashboard",
    to: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Users",
    to: "/admin/users",
    icon: Users,
  },
  {
    label: "Groups",
    to: "/admin/groups",
    icon: UsersRound,
  },
  {
    label: "Reports",
    to: "/admin/reports",
    icon: Flag,
  },
  {
    label: "Messages",
    to: "/admin/messages",
    icon: MessagesSquare,
  },
  {
    label: "Media",
    to: "/admin/media",
    icon: Image,
  },
  {
    label: "Notifications",
    to: "/admin/notifications",
    icon: Bell,
  },
  {
    label: "Admins & roles",
    to: "/admin/admins",
    icon: ShieldCheck,
  },
  {
    label: "Settings",
    to: "/admin/settings",
    icon: Settings,
  },
  {
    label: "Logs",
    to: "/admin/logs",
    icon: ScrollText,
  },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        relative
        shrink-0
        min-h-screen
        bg-white
        text-[#1E2328]
        transition-all
        duration-200
        ${collapsed ? "w-[60px]" : "w-[220px]"}
      `}
    >
      {/* Logo */}
      <div
        className={`
          border-b border-[#F0EFEC]
          py-5
          ${collapsed ? "px-2 pt-10" : "px-4 py-5"}
        `}
      >
        {collapsed ? (
          <div className="flex justify-center">
            <img
              src={embelFavicon}
              alt="Embel"
              className="h-8 w-8 object-contain"
            />
          </div>
        ) : (
          <>
            <img
              src={embelLogo}
              alt="Embel"
             className="h-12 w-auto max-w-[180px] object-contain"
            />

            <p className="mt-1 text-[11.5px] text-[#6B7178]">
              Admin panel
            </p>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="
    absolute
    -right-4
    top-[72px]
    z-50
    flex
    h-9
    w-9
    items-center
    justify-center
    rounded-full
    border
    border-[#E5E7EB]
    bg-white
    text-[#5C6570]
    shadow-[0_1px_4px_rgba(0,0,0,0.12)]
    hover:bg-[#FFF0E5]
    hover:text-[#fd7e13]
  "
      >
        {collapsed ? (
          <ChevronRight size={18} />
        ) : (
          <ChevronLeft size={18} />
        )}
      </button>

      {/* Navigation */}
      <nav
        aria-label="Admin navigation"
        className={`flex flex-col gap-1 py-5 ${collapsed ? "px-2" : "px-4"
          }`}
      >
        {navigation.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={(event) => {
              if (to === "/admin/chat") {
                event.preventDefault();
                window.dispatchEvent(new Event("open-admin-chat"));
              }
            }}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `
                flex
                items-center
                gap-3
                rounded-[8px]
                py-[10px]
                text-[13.5px]
                transition-colors
                ${collapsed
                ? "justify-center px-0"
                : "px-4"
              }
                ${isActive
                ? "bg-[#fd7e13] text-white"
                : "text-[#5C6570] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
              }
              `
            }
          >
            <Icon size={17} className="shrink-0" />

            {!collapsed && (
              <span className="truncate">
                {label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
