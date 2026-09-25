import { Trash2, X, Calendar, AlertTriangle, Loader2 } from "lucide-react";

export default function ClearChatDialog({ chat }) {
  const {
    clearChatDialogOpen,
    closeClearChatDialog,
    clearChatFromDate,
    setClearChatFromDate,
    clearChatToDate,
    setClearChatToDate,
    clearChatLoading,
    clearChatError,
    confirmClearChat,
    activeConversation,
    allGroups = [],
    isSuperAdmin,
    isGroupAdmin,
  } = chat;

  if (!clearChatDialogOpen) return null;

  const isGroup =
    activeConversation?.type === "space" ||
    activeConversation?.type === "GROUP" ||
    allGroups.some((g) => String(g.id) === String(activeConversation?.id));

  const actionLabel = isSuperAdmin
    ? "Super Admin Action"
    : isGroup && isGroupAdmin
    ? "Group Admin Action"
    : "1-to-1 Direct Chat Action";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]"
      onClick={closeClearChatDialog}
    >
      <div
        className="w-full max-w-md rounded-[16px] bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF1F0] text-[#D14343]">
              <Trash2 size={16} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#1E2328]">
                Clear Chat Messages
              </h3>
              <p className="text-[11px] text-[#6B7178]">
                {activeConversation?.name || "Conversation"} · <span className="font-semibold text-[#fd7e13]">{actionLabel}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={clearChatLoading}
            onClick={closeClearChatDialog}
            className="rounded-full p-1 text-[#6B7178] hover:bg-[#F1F0EC] disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="mb-4 flex items-start gap-2.5 rounded-[10px] border border-[#FEE2E2] bg-[#FEF2F2] p-3 text-[12px] text-[#991B1B]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#DC2626]" />
          <span>
            This is a <strong>permanent hard delete</strong>. All messages, project files, attachments, and reactions in {isGroup ? "this group" : "this conversation"} within the selected timeframe will be completely removed from the database and disk.
          </span>
        </div>

        {/* Date Range Inputs */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-[11.5px] font-medium text-[#6B7178]">
              <Calendar size={13} className="text-[#fd7e13]" />
              <span>Start Date & Time (From First Message):</span>
            </label>
            <input
              type="datetime-local"
              disabled={clearChatLoading}
              value={clearChatFromDate}
              onChange={(e) => setClearChatFromDate(e.target.value)}
              className="w-full rounded-[9px] border border-[#E4E0D6] bg-white px-3 py-2 text-[12.5px] text-[#1E2328] outline-none transition-colors focus:border-[#fd7e13] disabled:bg-[#FAF9F6]"
            />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-[11.5px] font-medium text-[#6B7178]">
              <Calendar size={13} className="text-[#fd7e13]" />
              <span>End Date & Time (To Last Message):</span>
            </label>
            <input
              type="datetime-local"
              disabled={clearChatLoading}
              value={clearChatToDate}
              onChange={(e) => setClearChatToDate(e.target.value)}
              className="w-full rounded-[9px] border border-[#E4E0D6] bg-white px-3 py-2 text-[12.5px] text-[#1E2328] outline-none transition-colors focus:border-[#fd7e13] disabled:bg-[#FAF9F6]"
            />
          </div>
        </div>

        {/* Error message */}
        {clearChatError && (
          <p className="mt-3 rounded-[8px] bg-[#FFF1F0] p-2 text-[11.5px] font-medium text-[#D14343]">
            {clearChatError}
          </p>
        )}

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-between border-t border-[#EDEAE2] pt-3">
          <button
            type="button"
            disabled={clearChatLoading}
            onClick={() => confirmClearChat({ isFullClear: true })}
            className="text-[12px] font-medium text-[#D14343] hover:underline disabled:opacity-50"
            title="Wipe entire chat history without date boundaries"
          >
            Clear All History
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={clearChatLoading}
              onClick={closeClearChatDialog}
              className="rounded-[9px] px-3 py-1.5 text-[12.5px] font-medium text-[#6B7178] hover:bg-[#F1F0EC] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={clearChatLoading || !clearChatFromDate || !clearChatToDate}
              onClick={() => confirmClearChat({ isFullClear: false })}
              className="flex items-center gap-1.5 rounded-[9px] bg-[#D14343] px-4 py-1.5 text-[12.5px] font-medium text-white hover:bg-[#b83232] disabled:opacity-50"
            >
              {clearChatLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Clearing...
                </>
              ) : (
                "Clear Selected Range"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}