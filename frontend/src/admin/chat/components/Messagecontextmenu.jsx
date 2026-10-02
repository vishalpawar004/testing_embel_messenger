import { useEffect, useRef, useState } from "react";
import {
  CheckSquare,
  Copy,
  Download,
  ExternalLink,
  Forward,
  Info,
  Pencil,
  Pin,
  Reply,
  Share2,
  Star,
  Trash2,
} from "lucide-react";

export default function MessageContextMenu({ chat }) {
  const {
    messageContextMenu, closeMessageContextMenu,
    pinnedMessageIds, toggleMessagePin,
    starredMessageIds, toggleMessageStar,
    startReply, copyMessage, openForwardDialog, enterSelectMode,
    saveMessageAs, shareMessage, openMessageWith, openMessageInfo,
    setMessageToDelete, activeConversationId,
    setEditingMessage,
    setDraft,
    canDeleteMessage, canEditMessage,
  } = chat;

  const menuRef = useRef(null);
  // Renders once off-screen to measure itself, then snaps to a clamped
  // position so it never spills past the edge of the viewport.
  const [position, setPosition] = useState(null);

  useEffect(() => {
    setPosition(null);
  }, [messageContextMenu]);

  useEffect(() => {
    if (!messageContextMenu || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const padding = 8;
    let { x, y } = messageContextMenu;
    if (x + rect.width + padding > window.innerWidth) x = window.innerWidth - rect.width - padding;
    if (y + rect.height + padding > window.innerHeight) y = window.innerHeight - rect.height - padding;
    setPosition({ left: Math.max(padding, x), top: Math.max(padding, y) });
  }, [messageContextMenu]);

  if (!messageContextMenu) return null;
  const { message } = messageContextMenu;
  const isPinned = pinnedMessageIds.includes(message.id);
  const isStarred = starredMessageIds.includes(message.id);
  const isFile = message.type === "file";

  const items = [
    { label: "Message info", icon: Info, onClick: () => openMessageInfo(message) },
    {
  label: "Reply",
  icon: Reply,
  onClick: () => {
    startReply(message);
    closeMessageContextMenu();
  },
},
    { label: "Copy", icon: Copy, onClick: () => copyMessage(message) },
    { label: "Forward", icon: Forward, onClick: () => openForwardDialog(message.id) },
    {
      label: isPinned ? "Unpin" : "Pin",
      icon: Pin,
      iconClassName: isPinned ? "fill-[#fd7e13] text-[#fd7e13]" : "",
      onClick: () => { toggleMessagePin(message.id); closeMessageContextMenu(); },
    },
    {
      label: isStarred ? "Unstar" : "Star",
      icon: Star,
      iconClassName: isStarred ? "fill-[#F4B400] text-[#F4B400]" : "",
      onClick: () => { toggleMessageStar(message.id); closeMessageContextMenu(); },
    },
    { divider: true },
    { label: "Select", icon: CheckSquare, onClick: () => enterSelectMode(message) },
    { label: "Save as", icon: Download, onClick: () => saveMessageAs(message) },
    { label: "Share", icon: Share2, onClick: () => shareMessage(message) },
    ...(isFile ? [{ label: "Open with", icon: ExternalLink, onClick: () => openMessageWith() }] : []),
    ...(canEditMessage(message)
      ? [
          {
            label: "Edit",
            icon: Pencil,
            onClick: () => {
              setEditingMessage(message);
              setDraft(message.text || "");
              closeMessageContextMenu();
            },
          },
        ]
      : []),

    ...(canDeleteMessage(message)
      ? [
          { divider: true },
          {
            label: "Delete",
            icon: Trash2,
            danger: true,
            onClick: () => {
              setMessageToDelete({ conversationId: activeConversationId, messageId: message.id });
              closeMessageContextMenu();
            },
          },
        ]
      : []),
  ];

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        onClick={closeMessageContextMenu}
        onContextMenu={(event) => { event.preventDefault(); closeMessageContextMenu(); }}
        className="fixed inset-0 z-[70] cursor-default"
      />
      <div
        ref={menuRef}
        role="menu"
        style={{
          top: position ? position.top : messageContextMenu.y,
          left: position ? position.left : messageContextMenu.x,
          visibility: position ? "visible" : "hidden",
        }}
        className="fixed z-[80] w-56 overflow-hidden rounded-[12px] border border-[#E4E0D6] bg-white py-1.5 shadow-[0_14px_32px_rgba(30,35,40,0.2)]"
      >
        {items.map((item, index) =>
          item.divider ? (
            <div key={`divider-${index}`} className="my-1 border-t border-[#EDEAE2]" />
          ) : (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={item.onClick}
              className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors ${
                item.danger ? "text-[#D14343] hover:bg-[#FFF1F0]" : "text-[#1E2328] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
              }`}
            >
              <item.icon size={16} className={item.iconClassName} />
              {item.label}
            </button>
          )
        )}
      </div>
    </>
  );
}