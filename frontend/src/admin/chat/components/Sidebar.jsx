import {
  AtSign, ChevronDown, ChevronUp, LayoutDashboard, Pin, Plus, Star,
} from "lucide-react";
import NewChatMenu from "./NewChatMenu";
import "./theme-scrollbar.css";

function initialsFromName(name) {
  return (name || "?")
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map((word) => word[0].toUpperCase()).join("") || "?";
}

export default function Sidebar({ chat }) {
  const {
    newChatOpen, setNewChatOpen,
    shortcutsExpanded, setShortcutsExpanded,
    directMessagesExpanded, setDirectMessagesExpanded,
    spacesExpanded, setSpacesExpanded,
    activeShortcut, setActiveShortcut,
    directConversations = [], spaceConversations = [],
    activeConversationId, openConversation,
    pinnedConversations = [], groupsLoading, groupsError,
    notifications = [],
  } = chat;

  const getUnreadCount = (conv) => {
    if (String(activeConversationId) === String(conv.id)) {
      return 0;
    }

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

  const handleSelectConversation = (id) => {
    if (setActiveShortcut) setActiveShortcut("conversation");
    if (openConversation) openConversation(id);
  };

  return (
    <aside className="relative hidden h-full min-h-0 flex-col border-r border-[#EDEAE2] bg-[#FDFCF9] p-3 lg:flex">
      <button
        type="button"
        onClick={() => setNewChatOpen(true)}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-[9px] border border-[#E4E0D6] bg-white px-3 py-2.5 text-[13px] font-medium text-[#1E2328] shadow-sm hover:bg-[#FFF0E5]"
      >
        <Plus size={17} />New chat
      </button>

      {newChatOpen && <NewChatMenu chat={chat} />}

      {/* Shortcuts */}
      <button
        type="button"
        onClick={() => setShortcutsExpanded((expanded) => !expanded)}
        className="mb-2 flex w-full items-center gap-1 px-2 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9AA0A6] hover:text-[#5C6570]"
      >
        {shortcutsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}Shortcuts
      </button>

      {shortcutsExpanded && (
        <div className="mb-4">
          {/* Home Button: Highlighted ONLY when activeShortcut === 'home' */}
          <button
            type="button"
            onClick={() => setActiveShortcut("home")}
            className={`mb-1 flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-[13px] transition-colors ${
              activeShortcut === "home"
                ? "bg-[#FFF0E5] font-semibold text-[#fd7e13]"
                : "text-[#5C6570] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
            }`}
          >
            <LayoutDashboard size={17} />Home
          </button>

          <button
            type="button"
            onClick={() => setActiveShortcut("mentions")}
            className={`mb-1 flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-[13px] transition-colors ${
              activeShortcut === "mentions"
                ? "bg-[#FFF0E5] font-semibold text-[#fd7e13]"
                : "text-[#5C6570] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
            }`}
          >
            <AtSign size={17} />Mentions
          </button>

          <button
            type="button"
            onClick={() => setActiveShortcut("starred")}
            className={`mb-1 flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-[13px] transition-colors ${
              activeShortcut === "starred"
                ? "bg-[#FFF0E5] font-semibold text-[#fd7e13]"
                : "text-[#5C6570] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
            }`}
          >
            <Star size={17} />Starred
          </button>
        </div>
      )}

      {/* Direct Messages Section */}
      <button
        type="button"
        onClick={() => setDirectMessagesExpanded((expanded) => !expanded)}
        className="mb-2 flex w-full items-center gap-1 px-2 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9AA0A6] hover:text-[#5C6570]"
      >
        {directMessagesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}Direct messages
      </button>

      {directMessagesExpanded && (
        <div className="mb-5">
          {directConversations.map((conversation) => {
            const unread = getUnreadCount(conversation);
            const hasUnread = unread > 0;
            const isSelected = activeShortcut !== "home" && String(activeConversationId) === String(conversation.id);

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => handleSelectConversation(conversation.id)}
                className={`mb-1 flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-[13px] transition-colors ${
                  isSelected
                    ? "bg-[#FFF0E5] font-semibold text-[#fd7e13]"
                    : "text-[#5C6570] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
                }`}
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                  style={{ background: conversation.color }}
                >
                  {conversation.initials}
                </span>
                <span className="truncate">{conversation.name}</span>
                {pinnedConversations.includes(conversation.id) && (
                  <Pin size={12} className="ml-auto fill-[#fd7e13] text-[#fd7e13]" />
                )}
                {hasUnread && (
                  <span
                    className={`${
                      pinnedConversations.includes(conversation.id) ? "ml-1" : "ml-auto"
                    } flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#fd7e13] px-1 text-[9.5px] font-bold text-white`}
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Groups Section */}
      <button
        type="button"
        onClick={() => setSpacesExpanded((expanded) => !expanded)}
        className="mb-2 flex w-full items-center gap-1 px-2 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9AA0A6] hover:text-[#5C6570]"
      >
        {spacesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}Groups
      </button>

      {spacesExpanded && (
        <div className="theme-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
          {groupsLoading && <p className="px-2 py-1.5 text-[11.5px] text-[#9AA0A6]">Loading groups…</p>}
          {!groupsLoading && groupsError && <p className="px-2 py-1.5 text-[11.5px] text-[#D14343]">{groupsError}</p>}
          {!groupsLoading && !groupsError && spaceConversations.length === 0 && (
            <p className="px-2 py-1.5 text-[11.5px] text-[#9AA0A6]">No groups yet.</p>
          )}

          {spaceConversations.map((conversation) => {
            const unread = getUnreadCount(conversation);
            const hasUnread = unread > 0;
            const isSelected = activeShortcut !== "home" && String(activeConversationId) === String(conversation.id);

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => handleSelectConversation(conversation.id)}
                className={`mb-1 flex w-full items-center gap-2 rounded-[8px] px-2 py-2 text-left text-[12.5px] transition-colors ${
                  isSelected
                    ? "bg-[#FFF0E5] font-semibold text-[#fd7e13]"
                    : "text-[#5C6570] hover:bg-[#F8F7F5] hover:text-[#fd7e13]"
                }`}
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[9px] font-semibold text-white"
                  style={{ background: conversation.color }}
                >
                  {conversation.initials}
                </span>
                <span className="truncate">{conversation.name}</span>
                {pinnedConversations.includes(conversation.id) && (
                  <Pin size={11} className="ml-auto fill-[#fd7e13] text-[#fd7e13]" />
                )}
                {hasUnread && (
                  <span
                    className={`${
                      pinnedConversations.includes(conversation.id) ? "ml-1" : "ml-auto"
                    } flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#fd7e13] px-1 text-[9.5px] font-bold text-white`}
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}