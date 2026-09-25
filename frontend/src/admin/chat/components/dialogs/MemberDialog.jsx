import { Check, Search, X } from "lucide-react";

export default function MemberDialog({ chat }) {
  const {
    memberDialogOpen, setMemberDialogOpen, memberSearch, setMemberSearch,
    groupMembers, pendingMemberIds, togglePendingMember, confirmAddMembers,
    activeConversation, groupMembersLoading, userSearchLoading, addableUserResults, addMemberError,
  } = chat;

  if (!memberDialogOpen) return null;

  const query = memberSearch.trim().toLowerCase();
  const visibleCurrentMembers = groupMembers.filter((member) =>
    `${member.name} ${member.email}`.toLowerCase().includes(query)
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1E2328]/35 p-4" role="presentation" onMouseDown={() => setMemberDialogOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-members-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[#E4E0D6] bg-white shadow-[0_18px_50px_rgba(30,35,40,0.24)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="border-b border-[#EDEAE2] px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 id="group-members-title" className="text-[17px] font-semibold text-[#1E2328]">Add members</h2>
              <p className="mt-0.5 text-[12px] text-[#6B7178]">{activeConversation?.name} · search people to add.</p>
            </div>
            <button type="button" onClick={() => setMemberDialogOpen(false)} className="rounded-full p-1.5 text-[#6B7178] hover:bg-[#F1F0EC]" aria-label="Close"><X size={18} /></button>
          </div>
          <label className="mt-4 flex items-center gap-2 rounded-[9px] border border-[#E4E0D6] bg-[#F8F7F5] px-3 py-2.5 text-[#6B7178] focus-within:border-[#fd7e13]">
            <Search size={16} />
            <input
              autoFocus
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
              placeholder="Search people by name or email"
              className="w-full bg-transparent text-[13px] text-[#1E2328] outline-none placeholder:text-[#9AA0A6]"
            />
          </label>
        </div>

        <div className="max-h-96 overflow-y-auto px-5 py-4">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#6B7178]">
            Already in this group · {groupMembersLoading ? "…" : groupMembers.length}
          </p>
          {groupMembersLoading && <p className="py-3 text-center text-[13px] text-[#9AA0A6]">Loading members…</p>}
          {!groupMembersLoading && visibleCurrentMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-3 rounded-[9px] px-2 py-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white" style={{ background: member.color }}>{member.initials}</span>
              <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-[#1E2328]">{member.name}</span><span className="block truncate text-[11px] text-[#6B7178]">{member.email}</span></span>
              <span className="rounded-full bg-[#FFF0E5] px-2 py-1 text-[10px] font-medium text-[#fd7e13]">Member</span>
            </div>
          ))}
          {!groupMembersLoading && visibleCurrentMembers.length === 0 && <p className="py-3 text-center text-[13px] text-[#6B7178]">No current members match your search.</p>}

          <p className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-wide text-[#6B7178]">Add people</p>
          {userSearchLoading && <p className="py-3 text-center text-[13px] text-[#9AA0A6]">{memberSearch.trim() ? "Searching…" : "Loading people…"}</p>}
          {!userSearchLoading && addableUserResults.length === 0 && (
            <p className="py-3 text-center text-[13px] text-[#6B7178]">
              {memberSearch.trim() ? `No people found for "${memberSearch.trim()}".` : "Everyone is already in this group."}
            </p>
          )}
          {!userSearchLoading && addableUserResults.map((user) => {
            const selected = pendingMemberIds.includes(user.id);
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => togglePendingMember(user.id)}
                className={`flex w-full items-center gap-3 rounded-[9px] px-2 py-2 text-left hover:bg-[#F8F7F5] ${selected ? "bg-[#FFF0E5]" : ""}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white" style={{ background: user.color }}>{user.initials}</span>
                <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-[#1E2328]">{user.name}</span><span className="block truncate text-[11px] text-[#6B7178]">{user.email}</span></span>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[#fd7e13] bg-[#fd7e13] text-white" : "border-[#D5D0C6] text-transparent"}`}>
                  <Check size={12} strokeWidth={3} />
                </span>
              </button>
            );
          })}

          {addMemberError && <p className="mt-3 text-[12px] text-[#D14343]">{addMemberError}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#EDEAE2] px-5 py-3">
          <button type="button" onClick={() => setMemberDialogOpen(false)} className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-[#5C6570] hover:bg-[#F1F0EC]">Done</button>
          <button
            type="button"
            onClick={confirmAddMembers}
            disabled={pendingMemberIds.length === 0}
            className="rounded-lg bg-[#fd7e13] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#e96f08] disabled:cursor-not-allowed disabled:bg-[#E6E4DE] disabled:text-[#9AA0A6]"
          >
            Add {pendingMemberIds.length > 0 ? pendingMemberIds.length : ""} member{pendingMemberIds.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}