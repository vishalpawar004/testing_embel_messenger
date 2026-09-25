import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, UserRound } from "lucide-react";
import { getCurrentUser, logout } from "../../../services/authService";

export default function SettingsMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    logout();
    // Adjust "/login" if your actual login route is named differently.
    navigate("/login");
  };

  const initials = (currentUser?.name || "?")
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map((word) => word[0].toUpperCase()).join("") || "?";

  return (
    <div className="relative">
      <button
        type="button"
        title="Settings"
        onClick={() => setOpen((current) => !current)}
        className={`rounded-full p-2 ${open ? "bg-[#F1F0EC] text-[#1E2328]" : "text-[#6B7178] hover:bg-[#F1F0EC] hover:text-[#1E2328]"}`}
      >
        <Settings size={18} />
      </button>

      {open && (
        <>
          <button type="button" aria-label="Close settings menu" onClick={() => { setOpen(false); setProfileOpen(false); }} className="fixed inset-0 z-30 cursor-default" />
          <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-64 overflow-hidden rounded-[14px] border border-[#E4E0D6] bg-white shadow-[0_14px_32px_rgba(30,35,40,0.18)]">
            <div className="flex items-center gap-3 border-b border-[#EDEAE2] px-4 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fd7e13] text-[13px] font-semibold text-white">{initials}</span>
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-semibold text-[#1E2328]">{currentUser?.name || "Signed in"}</p>
                <p className="truncate text-[11.5px] text-[#6B7178]">{currentUser?.role || ""}</p>
              </div>
            </div>

            <div className="py-1">
              <button
                type="button"
                onClick={() => setProfileOpen((current) => !current)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-[#1E2328] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
              >
                <UserRound size={16} />Profile
              </button>
              {profileOpen && (
                <div className="mx-4 mb-2 rounded-[9px] bg-[#F8F7F5] px-3 py-2.5 text-[12px] text-[#6B7178]">
                  <div className="flex justify-between gap-2 py-0.5"><span>Name</span><span className="font-medium text-[#1E2328]">{currentUser?.name || "—"}</span></div>
                  <div className="flex justify-between gap-2 py-0.5"><span>Role</span><span className="font-medium text-[#1E2328]">{currentUser?.role || "—"}</span></div>
                  <div className="flex justify-between gap-2 py-0.5"><span>User ID</span><span className="font-medium text-[#1E2328]">{currentUser?.userId ?? "—"}</span></div>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-[#D14343] hover:bg-[#FFF1F0]"
              >
                <LogOut size={16} />Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}