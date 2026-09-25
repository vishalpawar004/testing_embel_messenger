import { ChevronDown, Search } from "lucide-react";
import embelLogo from "../../../assets/logo-embel.png";
import SettingsMenu from "./Settingsmenu";

export default function TopHeader({ chat }) {
  const { statusMenuOpen, setStatusMenuOpen, currentStatus, statusOptions, setStatus } = chat;

  return (
    <div className="flex items-center gap-4 border-b border-[#EDEAE2] px-5 py-3">
      <div className="flex shrink-0 items-center gap-2">
        <img src={embelLogo} alt="Embel" className="h-12 w-auto object-contain" />
      </div>

      <label className="mx-auto hidden w-full max-w-md items-center gap-2 rounded-full bg-[#F1F0EC] px-4 py-2 text-[#6B7178] md:flex">
        <Search size={16} />
        <input className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9AA0A6]" placeholder="Search chat" />
      </label>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {/* Render SettingsMenu directly; it contains its own Settings button, toggle state, and dropdown */}
        <SettingsMenu />

        <div className="relative">
          <button
            type="button"
            onClick={() => setStatusMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-full bg-[#F1F0EC] px-3 py-1.5 text-[13px] font-medium text-[#1E2328] hover:bg-[#EAE8E1]"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: currentStatus.color }} />
            {currentStatus.label}
            <ChevronDown size={14} className="text-[#6B7178]" />
          </button>

          {statusMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-40 overflow-hidden rounded-[10px] border border-[#EDEAE2] bg-white py-1 shadow-[0_8px_20px_rgba(30,35,40,0.12)]">
              {statusOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => { setStatus(option.label); setStatusMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#1E2328] hover:bg-[#F8F7F5]"
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: option.color }} />
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}