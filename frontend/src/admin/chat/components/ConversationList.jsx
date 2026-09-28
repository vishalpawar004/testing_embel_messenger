import { useState, useMemo } from "react";
import { Pin, Search, MoreHorizontal, UserRound, Trash2, CheckSquare, Square, X, Calendar, AlertTriangle, Loader2 } from "lucide-react";
import "./theme-scrollbar.css";

function formatConversationTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function initialsFromName(name) {
  return (
    (name || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("") || "?"
  );
}

function formatForDateTimeInput(dateInput) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function formatToBackendDateTime(dateInput, isEnd = false) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";

  if (isEnd) {
    if (d.getSeconds() === 0) d.setSeconds(59);
    d.setMilliseconds(999);
  }

  const pad = (n, len = 2) => String(n).padStart(len, "0");
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  const SSS = pad(d.getMilliseconds(), 3);

  return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}.${SSS}`;
}

export default function ConversationList({ chat }) {
  const {
    activeShortcut,
    conversationList = [],
    activeConversationId,
    pinnedConversations = [],
    groupsLoading,
    groupsError,
    isSuperAdmin,
    openConversation,
    notifications = [],
    setBoardView,
    setViewingMemberId,
    currentUserId,
    bulkClearChatsAsAdmin,
    messagesByConversation = {},
  } = chat;

  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Bulk Selection Dialog States
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState([]);

  // Confirmation Modal States
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const [clearError, setClearError] = useState("");

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversationList;
    const q = searchQuery.toLowerCase();
    return conversationList.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.preview || "").toLowerCase().includes(q)
    );
  }, [conversationList, searchQuery]);

  // Unified unique chat items purely from conversationList
  const selectableChats = useMemo(() => {
    const map = new Map();

    conversationList.forEach((item) => {
      const targetId = Number(item.chatId ?? item.id);
      if (targetId && !map.has(targetId)) {
        const isGroup = item.type === "space" || item.type === "GROUP";
        map.set(targetId, {
          id: targetId,
          name: item.name || `Chat #${targetId}`,
          type: isGroup ? "Group" : "1-to-1",
          initials: initialsFromName(item.name),
          color: item.color || "#7C5CFC",
        });
      }
    });

    return Array.from(map.values());
  }, [conversationList]);

  const getUnreadCount = (conv) => {
    if (!conv) return 0;
    if (String(activeConversationId) === String(conv.id)) return 0;

    const fromNotifs = notifications.filter(
      (n) =>
        !n.read &&
        (String(n.relatedChatId) === String(conv.id) ||
          String(n.relatedGroupId) === String(conv.groupId ?? conv.id) ||
          String(n.relatedChatId) === String(conv.chatId ?? conv.id) ||
          String(n.relatedUserId) === String(conv.contactId ?? conv.id))
    ).length;

    return fromNotifs > 0 ? fromNotifs : conv.unread || 0;
  };

  const toggleSelectChat = (chatId) => {
    setSelectedChatIds((prev) =>
      prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedChatIds.length === selectableChats.length) {
      setSelectedChatIds([]);
    } else {
      setSelectedChatIds(selectableChats.map((c) => c.id));
    }
  };

  // Opens dialog with NOTHING pre-selected
  const openSelectionDialog = () => {
    setMenuOpen(false);
    setSelectedChatIds([]);
    setSelectModalOpen(true);
  };

  const proceedToConfirmation = () => {
    if (selectedChatIds.length === 0) return;

    let earliest = null;
    let latest = null;

    selectedChatIds.forEach((chatId) => {
      const msgs = messagesByConversation[chatId] || [];
      msgs.forEach((m) => {
        if (!m.createdAt || m.type === "activity" || m.type === "system") return;
        const time = new Date(m.createdAt).getTime();
        if (!earliest || time < earliest) earliest = time;
        if (!latest || time > latest) latest = time;
      });
    });

    const start = earliest ? new Date(earliest).toISOString() : new Date().toISOString();
    const end = latest ? new Date(latest).toISOString() : new Date().toISOString();

    setFromDate(formatForDateTimeInput(start));
    setToDate(formatForDateTimeInput(end));
    setClearError("");
    setSelectModalOpen(false);
    setConfirmModalOpen(true);
  };

  const executeBulkClear = async ({ isFullClear = false } = {}) => {
    if (selectedChatIds.length === 0) return;

    setIsClearing(true);
    setClearError("");

    try {
      let fromFormatted = undefined;
      let toFormatted = undefined;

      if (!isFullClear && fromDate && toDate) {
        fromFormatted = formatToBackendDateTime(fromDate, false);
        toFormatted = formatToBackendDateTime(toDate, true);
      }

      await bulkClearChatsAsAdmin(selectedChatIds, {
        from: fromFormatted,
        to: toFormatted,
      });

      setConfirmModalOpen(false);
      setSelectedChatIds([]);
    } catch (err) {
      console.error("Bulk clear failed:", err);
      setClearError(err.message || "Failed to clear selected chats.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <aside
      className={`flex h-full min-h-0 flex-col border-b border-[#EDEAE2] lg:border-b-0 lg:border-r ${
        activeShortcut === "home" ? "" : "hidden"
      }`}
    >
      {/* Header & Search */}
      <div className="shrink-0 border-b border-[#EDEAE2] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-semibold text-[#1E2328]">Home</h2>
            <p className="mt-0.5 text-[12px] text-[#6B7178]">
              Recent conversations
            </p>
          </div>

          {/* More Options Menu */}
          <div className="relative">
            <button
              type="button"
              title="Options"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="rounded-full p-2 text-[#6B7178] hover:bg-[#FFF0E5] hover:text-[#fd7e13] transition-colors"
            >
              <MoreHorizontal size={19} />
            </button>

            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-30 cursor-default"
                />
                <div className="absolute right-0 top-[calc(100%+6px)] z-40 w-48 overflow-hidden rounded-[10px] border border-[#E4E0D6] bg-white py-1 shadow-[0_8px_20px_rgba(30,35,40,0.14)] animate-in fade-in zoom-in-95 duration-100">
                  {/* Option 1: View profile */}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      if (setViewingMemberId) setViewingMemberId(currentUserId);
                      if (setBoardView) setBoardView("info");
                    }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-[#1E2328] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
                  >
                    <UserRound size={16} />
                    View profile
                  </button>

                  {/* Option 2: All chat clean (SUPER ADMIN ONLY) */}
                  {isSuperAdmin && (
                    <>
                      <div className="my-1 border-t border-[#EDEAE2]" />
                      <button
                        type="button"
                        onClick={openSelectionDialog}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-[#D14343] hover:bg-[#FFF1F0]"
                      >
                        <Trash2 size={16} className="text-[#D14343]" />
                        All chat clean
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <label className="flex items-center gap-2 rounded-[8px] bg-[#F8F7F5] px-3 py-2 text-[#6B7178] focus-within:border focus-within:border-[#fd7e13]">
          <Search size={16} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9AA0A6]"
            placeholder="Search chats"
          />
        </label>
      </div>

      {/* Conversation Items List */}
      <div className="theme-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="p-2">
          {groupsLoading && (
            <p className="px-3 py-2 text-[12px] text-[#9AA0A6]">
              Loading conversations…
            </p>
          )}
          {!groupsLoading && groupsError && (
            <p className="px-3 py-2 text-[12px] text-[#D14343]">{groupsError}</p>
          )}

          {!groupsLoading && filteredConversations.length === 0 && (
            <p className="px-3 py-4 text-center text-[12px] text-[#9AA0A6]">
              {searchQuery ? "No conversations match your search." : "No conversations yet."}
            </p>
          )}

          {filteredConversations.map((conversation) => {
            const unread = getUnreadCount(conversation);
            const hasUnread = unread > 0;
            const isPinned = pinnedConversations.includes(conversation.id);

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => openConversation(conversation.id)}
                className={`flex w-full items-center gap-3 rounded-[9px] p-3 text-left transition-colors ${
                  String(activeConversationId) === String(conversation.id)
                    ? "bg-[#FFF0E5]"
                    : "hover:bg-[#F8F7F5]"
                }`}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                  style={{ background: conversation.color }}
                >
                  {conversation.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span
                        className={`truncate text-[13px] ${
                          hasUnread ? "font-semibold text-[#1E2328]" : "font-medium text-[#1E2328]"
                        }`}
                      >
                        {conversation.name}
                      </span>
                      {isPinned && (
                        <Pin
                          size={11}
                          className="shrink-0 fill-[#fd7e13] text-[#fd7e13]"
                        />
                      )}
                    </span>
                    <span
                      className={`shrink-0 text-[10.5px] ${
                        hasUnread ? "font-semibold text-[#fd7e13]" : "text-[#9AA0A6]"
                      }`}
                    >
                      {formatConversationTime(conversation.time)}
                    </span>
                  </span>

                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span
                      className={`truncate text-[12px] ${
                        hasUnread ? "font-medium text-[#1E2328]" : "text-[#6B7178]"
                      }`}
                    >
                      {conversation.preview || "No messages yet"}
                    </span>
                    {hasUnread && (
                      <span className="flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-[#fd7e13] px-1 text-[10px] font-bold text-white">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Modal: Multi-Select Chats for Bulk Clean */}
      {selectModalOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]"
          onClick={() => setSelectModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[16px] bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-[#1E2328]">
                  Select Chats to Clear
                </h3>
                <p className="text-[11px] text-[#6B7178]">
                  Super Admin Bulk Message Removal
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectModalOpen(false)}
                className="rounded-full p-1 text-[#6B7178] hover:bg-[#F1F0EC]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-2 flex items-center justify-between px-1">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 text-[12px] font-medium text-[#fd7e13] hover:underline"
              >
                {selectedChatIds.length === selectableChats.length && selectableChats.length > 0 ? (
                  <>
                    <CheckSquare size={14} /> Deselect All
                  </>
                ) : (
                  <>
                    <Square size={14} /> Select All ({selectableChats.length})
                  </>
                )}
              </button>
              <span className="text-[11.5px] text-[#6B7178]">
                {selectedChatIds.length} of {selectableChats.length} selected
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-[10px] border border-[#EDEAE2] p-1.5 flex flex-col gap-1">
              {selectableChats.map((c) => {
                const isChecked = selectedChatIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleSelectChat(c.id)}
                    className={`flex items-center justify-between p-2 rounded-[8px] cursor-pointer transition-colors ${
                      isChecked ? "bg-[#FFF0E5]" : "hover:bg-[#F8F7F5]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                        style={{ background: c.color }}
                      >
                        {c.initials}
                      </span>
                      <span className="truncate text-[13px] font-medium text-[#1E2328]">
                        {c.name}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9.5px] font-semibold ${
                          c.type === "Group"
                            ? "bg-[#EBF3FF] text-[#2563EB]"
                            : "bg-[#F1F0EC] text-[#6B7178]"
                        }`}
                      >
                        {c.type}
                      </span>
                    </div>
                    <div>
                      {isChecked ? (
                        <CheckSquare size={16} className="text-[#fd7e13]" />
                      ) : (
                        <Square size={16} className="text-[#9AA0A6]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#EDEAE2] pt-3">
              <button
                type="button"
                onClick={() => setSelectModalOpen(false)}
                className="rounded-[9px] px-3 py-1.5 text-[12.5px] font-medium text-[#6B7178] hover:bg-[#F1F0EC]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedChatIds.length === 0}
                onClick={proceedToConfirmation}
                className="rounded-[9px] bg-[#fd7e13] px-4 py-1.5 text-[12.5px] font-medium text-white hover:bg-[#e96f08] disabled:opacity-50"
              >
                {selectedChatIds.length > 0
                  ? `Proceed (${selectedChatIds.length})`
                  : "Select at least 1 chat"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Confirmation & Date Range Input */}
      {confirmModalOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]"
          onClick={() => !isClearing && setConfirmModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[16px] bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF1F0] text-[#D14343]">
                  <Trash2 size={16} />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-[#1E2328]">
                    Confirm Bulk Chat Clean
                  </h3>
                  <p className="text-[11px] text-[#6B7178]">
                    Clearing {selectedChatIds.length} conversation{selectedChatIds.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isClearing}
                onClick={() => setConfirmModalOpen(false)}
                className="rounded-full p-1 text-[#6B7178] hover:bg-[#F1F0EC] disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-4 flex items-start gap-2.5 rounded-[10px] border border-[#FEE2E2] bg-[#FEF2F2] p-3 text-[12px] text-[#991B1B]">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#DC2626]" />
              <span>
                This will execute <strong>real SQL DELETE statements</strong> across the selected {selectedChatIds.length} chats. All messages, files, and reactions will be permanently wiped.
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-[11.5px] font-medium text-[#6B7178]">
                  <Calendar size={13} className="text-[#fd7e13]" />
                  <span>Start Date & Time (Optional):</span>
                </label>
                <input
                  type="datetime-local"
                  disabled={isClearing}
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-[9px] border border-[#E4E0D6] bg-white px-3 py-2 text-[12.5px] text-[#1E2328] outline-none focus:border-[#fd7e13] disabled:bg-[#FAF9F6]"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-[11.5px] font-medium text-[#6B7178]">
                  <Calendar size={13} className="text-[#fd7e13]" />
                  <span>End Date & Time (Optional):</span>
                </label>
                <input
                  type="datetime-local"
                  disabled={isClearing}
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-[9px] border border-[#E4E0D6] bg-white px-3 py-2 text-[12.5px] text-[#1E2328] outline-none focus:border-[#fd7e13] disabled:bg-[#FAF9F6]"
                />
              </div>
            </div>

            {clearError && (
              <p className="mt-3 rounded-[8px] bg-[#FFF1F0] p-2 text-[11.5px] font-medium text-[#D14343]">
                {clearError}
              </p>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-[#EDEAE2] pt-3">
              <button
                type="button"
                disabled={isClearing}
                onClick={() => executeBulkClear({ isFullClear: true })}
                className="text-[12px] font-medium text-[#D14343] hover:underline disabled:opacity-50"
              >
                Clear Entire History
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isClearing}
                  onClick={() => setConfirmModalOpen(false)}
                  className="rounded-[9px] px-3 py-1.5 text-[12.5px] font-medium text-[#6B7178] hover:bg-[#F1F0EC] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isClearing}
                  onClick={() => executeBulkClear({ isFullClear: false })}
                  className="flex items-center gap-1.5 rounded-[9px] bg-[#D14343] px-4 py-1.5 text-[12.5px] font-medium text-white hover:bg-[#b83232] disabled:opacity-50"
                >
                  {isClearing ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    "Confirm Hard Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}