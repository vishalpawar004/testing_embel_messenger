export default function RemoveMemberDialog({ chat }) {
  const { memberToRemove, cancelRemoveMember, confirmRemoveMember, removeMemberError } = chat;

  if (!memberToRemove) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1E2328]/35 p-4" role="presentation" onMouseDown={cancelRemoveMember}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-member-title"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_18px_50px_rgba(30,35,40,0.24)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="remove-member-title" className="text-[17px] font-semibold text-[#1E2328]">
          Remove {memberToRemove.name}?
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[#6B7178]">
          They'll be removed from this group immediately and won't be able to see new messages.
        </p>
        {removeMemberError && <p className="mt-2 text-[12px] text-[#D14343]">{removeMemberError}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={cancelRemoveMember} className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-[#5C6570] hover:bg-[#F1F0EC]">
            Cancel
          </button>
          <button type="button" onClick={confirmRemoveMember} className="rounded-lg bg-[#D14343] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#B82F2F]">
            Remove member
          </button>
        </div>
      </div>
    </div>
  );
}