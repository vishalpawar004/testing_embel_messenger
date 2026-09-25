import { useEffect, useRef, useState } from "react";
import { MessageCircle, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";

export default function MemberRow({ chat, member, isOpen, onToggle }) {
  const {
    blockedMemberIdList,
    requestRemoveMember,
    startDirectMessage,
    setBoardView,
    currentUserId,
    isSuperAdmin,
    isGroupAdmin: actingUserIsGroupAdmin,
    promoteMember,
    demoteMember,
  } = chat;

  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const popoverRef = useRef(null);

  const isYou = String(member.id) === String(currentUserId);
  const memberIsAdmin = ["ADMIN", "OWNER"].includes(
    String(member.role || "").toUpperCase()
  );
  const isBlocked = blockedMemberIdList?.includes(member.id);

  // Can manage roles if acting user is a Super Admin or Group Admin
  const canManageRoles = isSuperAdmin || actingUserIsGroupAdmin;

  useEffect(() => {
    if (isOpen && popoverRef.current) {
      popoverRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isOpen]);

  const handlePromote = async () => {
    try {
      setIsUpdatingRole(true);
      await promoteMember(member.id);
      onToggle();
    } catch (error) {
      console.error("Failed to make group admin:", error);
      alert(error.message || "Failed to make group admin");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleDemote = async () => {
    try {
      setIsUpdatingRole(true);
      await demoteMember(member.id);
      onToggle();
    } catch (error) {
      console.error("Failed to remove group admin:", error);
      alert(error.message || "Failed to remove group admin");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-3 rounded-[9px] px-1.5 py-2 text-left hover:bg-white ${
          isOpen ? "bg-white" : ""
        }`}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
          style={{ background: member.color }}
        >
          {member.initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-medium text-[#1E2328]">
              {member.name}
            </span>
            {memberIsAdmin && (
              <span className="shrink-0 rounded-full bg-[#FFF0E5] px-1.5 py-[1px] text-[9.5px] font-medium text-[#fd7e13]">
                Group Admin
              </span>
            )}
          </span>
          <span className="block truncate text-[11px] text-[#6B7178]">
            {isBlocked ? "Blocked" : member.email}
          </span>
        </span>
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close member details"
            onClick={onToggle}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            ref={popoverRef}
            className="absolute left-1.5 right-1.5 top-[calc(100%+2px)] z-40 overflow-hidden rounded-[12px] border border-[#E4E0D6] bg-white shadow-[0_10px_24px_rgba(30,35,40,0.16)]"
          >
            <div className="flex items-center gap-3 border-b border-[#EDEAE2] px-3.5 py-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                style={{ background: member.color }}
              >
                {member.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-semibold text-[#1E2328]">
                  {member.name}
                </p>
                <p className="truncate text-[11.5px] text-[#6B7178]">{member.email}</p>
                <p className="mt-0.5 text-[10.5px] font-medium text-[#fd7e13]">
                  {memberIsAdmin
                    ? "Group Admin"
                    : isBlocked
                    ? "Blocked in this space"
                    : "Member"}
                </p>
              </div>
            </div>

            {!isYou && (
              <div className="py-1">
                {/* Send Direct Message */}
                <button
                  type="button"
                  onClick={() => {
                    onToggle();
                    startDirectMessage(member);
                    setBoardView(null);
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-[#1E2328] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
                >
                  <MessageCircle size={16} />
                  Message
                </button>

                {/* Role Promotion / Demotion for Super Admins or Group Admins */}
                {canManageRoles && (
                  <>
                    {!memberIsAdmin ? (
                      <button
                        type="button"
                        disabled={isUpdatingRole}
                        onClick={handlePromote}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-[#1E2328] hover:bg-[#FFF0E5] hover:text-[#fd7e13] disabled:opacity-50"
                      >
                        <ShieldCheck size={16} />
                        {isUpdatingRole ? "Updating..." : "Make group admin"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isUpdatingRole}
                        onClick={handleDemote}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-[#1E2328] hover:bg-[#FFF0E5] hover:text-[#fd7e13] disabled:opacity-50"
                      >
                        <ShieldOff size={16} />
                        {isUpdatingRole ? "Updating..." : "Remove group admin"}
                      </button>
                    )}
                  </>
                )}

                {/* Kick Member */}
                <button
                  type="button"
                  onClick={() => {
                    requestRemoveMember(member);
                    onToggle();
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-[#D14343] hover:bg-[#FFF1F0]"
                >
                  <Trash2 size={16} />
                  Remove from group
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}