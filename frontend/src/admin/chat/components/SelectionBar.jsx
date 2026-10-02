import { Forward, Trash2, X } from "lucide-react";

export default function SelectionBar({ chat }) {
  const {
    messages, selectedMessageIds, exitSelectMode,
    openForwardDialog, bulkDeleteSelected, canDeleteMessage,
  } = chat;

  const count = selectedMessageIds.length;
  const selectedMessages = messages.filter((m) => selectedMessageIds.includes(m.id));
  // Delete shows only if the user is allowed to delete every selected message
  const canDeleteAll = count > 0 && selectedMessages.every((m) => canDeleteMessage(m));

  return (
    <div className="flex items-center justify-between border-b border-[#EDEAE2] bg-white px-5 py-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          title="Unselect"
          onClick={exitSelectMode}
          className="rounded-full p-1.5 text-[#6B7178] hover:bg-[#F1F0EC]"
        >
          <X size={18} />
        </button>
        <span className="text-[14px] font-semibold text-[#1E2328]">{count} selected</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          title="Forward"
          disabled={count === 0}
          onClick={() => openForwardDialog(selectedMessageIds)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-[#1E2328] hover:bg-[#FFF0E5] hover:text-[#fd7e13] disabled:opacity-40"
        >
          <Forward size={16} /> Forward
        </button>

        {canDeleteAll && (
          <button
            type="button"
            title="Delete"
            onClick={bulkDeleteSelected}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-[#D14343] hover:bg-[#FFF1F0]"
          >
            <Trash2 size={16} /> Delete
          </button>
        )}
      </div>
    </div>
  );
}