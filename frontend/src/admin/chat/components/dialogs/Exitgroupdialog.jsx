import { useState } from "react";

export default function ExitGroupDialog({ chat }) {
  const {
    exitGroupDialogOpen, setExitGroupDialogOpen, activeConversation,
    exitAndDeleteForMe, groupInfoError,
  } = chat;

  const [pending, setPending] = useState(false);

  if (!exitGroupDialogOpen) return null;

  const close = () => {
    if (pending) return;
    setExitGroupDialogOpen(false);
  };

  const handleDelete = async () => {
    setPending(true);
    await exitAndDeleteForMe();
    setPending(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1E2328]/35 p-4" role="presentation" onMouseDown={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-group-title"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_18px_50px_rgba(30,35,40,0.24)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="exit-group-title" className="text-[17px] font-semibold text-[#1E2328]">Exit "{activeConversation?.name}"?</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[#6B7178]">
          You'll be removed from this group and its chat history will be deleted for you.
        </p>

        {groupInfoError && (
          <p className="mt-2.5 rounded-lg bg-[#FFF1F0] px-2.5 py-2 text-[12px] text-[#D14343]">{groupInfoError}</p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="w-full rounded-lg border border-[#F1C3C3] px-3.5 py-2.5 text-[13px] font-medium text-[#D14343] hover:bg-[#FFF1F0] disabled:opacity-60"
          >
            {pending ? "Removing…" : "Exit and delete for me"}
          </button>
          <button
            type="button"
            onClick={close}
            disabled={pending}
            className="w-full rounded-lg px-3.5 py-2.5 text-[13px] font-medium text-[#5C6570] hover:bg-[#F1F0EC] disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}