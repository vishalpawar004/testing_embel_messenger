export default function GroupNameDialog({ chat }) {
  const {
    groupNameDialogOpen, setGroupNameDialogOpen, groupName, setGroupName,
    newGroupDescription, setNewGroupDescription, createGroup, creatingGroup, createGroupError,
  } = chat;

  if (!groupNameDialogOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1E2328]/35 p-4" role="presentation" onMouseDown={() => !creatingGroup && setGroupNameDialogOpen(false)}>
      <form
        onSubmit={(event) => { event.preventDefault(); createGroup(); }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-name-title"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_18px_50px_rgba(30,35,40,0.24)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="group-name-title" className="text-[17px] font-semibold text-[#1E2328]">Create a group</h2>
        <p className="mt-1.5 text-[13px] text-[#6B7178]">Give your new group a name and, optionally, a description.</p>

        <label className="mt-4 block text-[12px] font-medium text-[#5C6570]" htmlFor="new-group-name">Group name</label>
        <input
          id="new-group-name"
          autoFocus
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
          placeholder="e.g. Moderation team"
          disabled={creatingGroup}
          className="mt-1.5 w-full rounded-lg border border-[#E4E0D6] px-3 py-2.5 text-[13px] text-[#1E2328] outline-none placeholder:text-[#9AA0A6] focus:border-[#fd7e13] disabled:bg-[#F8F7F5]"
        />

        <label className="mt-3.5 block text-[12px] font-medium text-[#5C6570]" htmlFor="new-group-description">Description <span className="font-normal text-[#9AA0A6]">(optional)</span></label>
        <textarea
          id="new-group-description"
          rows={3}
          value={newGroupDescription}
          onChange={(event) => setNewGroupDescription(event.target.value)}
          placeholder="What's this group for?"
          disabled={creatingGroup}
          className="mt-1.5 w-full resize-none rounded-lg border border-[#E4E0D6] px-3 py-2.5 text-[13px] text-[#1E2328] outline-none placeholder:text-[#9AA0A6] focus:border-[#fd7e13] disabled:bg-[#F8F7F5]"
        />

        {createGroupError && <p className="mt-2 text-[12px] text-[#D14343]">{createGroupError}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setGroupNameDialogOpen(false)} disabled={creatingGroup} className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-[#5C6570] hover:bg-[#F1F0EC] disabled:opacity-50">Cancel</button>
          <button
            type="submit"
            disabled={!groupName.trim() || creatingGroup}
            className="rounded-lg bg-[#fd7e13] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#e96f08] disabled:cursor-not-allowed disabled:bg-[#E6E4DE] disabled:text-[#9AA0A6]"
          >
            {creatingGroup ? "Creating…" : "Create group"}
          </button>
        </div>
      </form>
    </div>
  );
}
