import { useEffect, useRef, useState } from "react";
import {
  AlertCircle, Copy, Pencil, Download, ExternalLink, Folder,
  Forward, Info, Pin, PartyPopper, Reply, Share2, Smile, Star,
  Trash2, UserPlus, UsersRound, CheckSquare, FileText
} from "lucide-react";
import sanitizeHtml from "../utils/sanitizeHtml";
import { reactToMessage } from "../../../services/authService";
import "./rich-text.css";

const EMOJI_OPTIONS = ["👍", "😂", "🙏", "❤️"];

// Helper to reliably check if a file message is really an image
function isImageFile(message) {
  if (!message) return false;
  const fileName = (message.attachmentName || message.caption || message.content || message.fileUrl || "").toLowerCase();

  // Non-image extensions must NEVER be treated as images
  const isDoc = /\.(docx?|pdf|xlsx?|pptx?|txt|csv|zip|rar|tar|gz|json|xml|java|py|js|ts)$/i.test(fileName);
  if (isDoc) return false;

  return Boolean(
    message.isImage ||
    String(message.type || "").toUpperCase() === "IMAGE" ||
    /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(fileName)
  );
}

// "Today" / "Yesterday" / weekday name / dd/mm/yyyy
function formatDateDivider(dateInput) {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (Number.isNaN(date.getTime())) return "Today";
  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString(undefined, { weekday: "long" });
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}

function isSameCalendarDay(a, b) {
  const da = a ? new Date(a) : new Date();
  const db = b ? new Date(b) : new Date();
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function NewGroupWelcome({ chat }) {
  const { activeConversation, openMemberDialog, setBoardView, currentUserName } = chat;
  return (
    <div className="m-auto w-full max-w-xl text-center">
      <div className="mx-auto flex h-28 w-28 animate-[bounce_2.5s_ease-in-out_infinite] items-center justify-center rounded-full bg-[#FFF0E5] text-[#fd7e13] shadow-[0_10px_25px_rgba(253,126,19,0.16)]">
        <PartyPopper size={50} strokeWidth={1.5} />
      </div>
      <span className="relative -mt-2 inline-block rounded-full bg-white px-3 py-1 text-[10.5px] text-[#6B7178] shadow-sm">Today</span>
      <div className="mt-2 rounded-[20px] bg-[#F8F7F5] px-5 py-6">
        <p className="text-[17px] font-medium text-[#1E2328]">
          {currentUserName}, welcome to <span className="text-[#fd7e13]">{activeConversation.name}</span>! Let's get started:
        </p>
        <div className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={openMemberDialog}
            className="flex items-center gap-2 rounded-full bg-[#FFE3C7] px-5 py-2.5 text-[13px] font-medium text-[#1E2328] transition-colors hover:bg-[#FFD2A3]"
          >
            <UsersRound size={17} />Add members
          </button>
          <button
            type="button"
            onClick={() => setBoardView("info")}
            className="flex items-center gap-2 rounded-full border border-[#E4E0D6] bg-white px-5 py-2.5 text-[13px] font-medium text-[#1E2328] transition-colors hover:bg-[#F1F0EC]"
          >
            <Info size={17} />Group info
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageInfoPopover({ message, onClose }) {
  const summary = message.type === "file" ? (message.caption || "Shared file") : (message.text || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1E2328]/35 p-4" role="presentation" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_18px_50px_rgba(30,35,40,0.24)]" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="text-[17px] font-semibold text-[#1E2328]">Message info</h2>
        <p className="mt-3 truncate rounded-[10px] bg-[#F8F7F5] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#1E2328]">{summary}</p>
        <div className="mt-4 flex flex-col gap-2.5 text-[13px]">
          <div className="flex items-center justify-between"><span className="text-[#6B7178]">From</span><span className="font-medium text-[#1E2328]">{message.mine ? "You" : message.sender}</span></div>
          <div className="flex items-center justify-between"><span className="text-[#6B7178]">Sent</span><span className="font-medium text-[#1E2328]">{message.time}</span></div>
          <div className="flex items-center justify-between"><span className="text-[#6B7178]">Status</span><span className="font-medium text-[#1E2328] capitalize">{message.status || "sent"}</span></div>
        </div>
      </div>
    </div>
  );
}

function linkifyHtml(html) {
  if (!html) return html;
  const urlPattern = /((?:https?:\/\/|www\.)[^\s<>"']+)/gi;

  return html
    .split(/(<[^>]+>)/g)
    .map((part) => {
      if (part.startsWith("<") && part.endsWith(">")) return part;
      return part.replace(urlPattern, (match) => {
        const trailingMatch = match.match(/[).,!?;:]+$/);
        const trailing = trailingMatch ? trailingMatch[0] : "";
        const cleanMatch = trailing ? match.slice(0, -trailing.length) : match;
        const href = cleanMatch.startsWith("http") ? cleanMatch : `https://${cleanMatch}`;
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="rich-text-link">${cleanMatch}</a>${trailing}`;
      });
    })
    .join("");
}

function MessageBubble({ chat, message }) {
  const {
    activeConversationId,
    pinnedMessageIds,
    toggleMessagePin,
    starredMessageIds,
    toggleMessageStar,
    emojiPickerMessageId,
    setEmojiPickerMessageId,
    addReaction,
    setMessageToDelete,
    messageReactions,
    retryFailedMessage,
    startReply,
    enterSelectMode,
    toggleSelectMessage,
    selectMode,
    selectedMessageIds,
    openForwardDialog,
    setEditingMessage,
    editingMessage,
    editMessage,
    draft,
    setDraft,
    setMessagesByConversation,
    canDeleteMessage: canDelete,
    canEditMessage: canEdit,
  } = chat;

  const pinned = pinnedMessageIds?.includes(message.id);
  const starred = starredMessageIds?.includes(message.id);
  const selected = selectedMessageIds?.includes(message.id);
  const isSending = message.status === "sending";
  const isFailed = message.status === "failed";


  const [menuPosition, setMenuPosition] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const menuRef = useRef(null);

  // Normalize reactions from backend array: [{ emoji: "👍", count: 1 }]
  const reactions = message.reactions && message.reactions.length > 0
    ? message.reactions
    : messageReactions?.[`${activeConversationId}-${message.id}`]
    ? [{ emoji: messageReactions[`${activeConversationId}-${message.id}`], count: 1 }]
    : [];

  const myReaction = message.myReaction;
  const showEmojiPicker = emojiPickerMessageId === message.id;

  const handleEmojiClick = async (emoji) => {
    if (setEmojiPickerMessageId) setEmojiPickerMessageId(null);

    if (typeof addReaction === "function") {
      addReaction(message.id, emoji);
      return;
    }

    const isRemoving = myReaction === emoji;
    if (setMessagesByConversation && activeConversationId) {
      setMessagesByConversation((prev) => ({
        ...prev,
        [activeConversationId]: (prev[activeConversationId] || []).map((m) => {
          if (m.id !== message.id) return m;

          let updatedReactions = [...(m.reactions || [])];
          if (myReaction) {
            updatedReactions = updatedReactions
              .map((r) => (r.emoji === myReaction ? { ...r, count: r.count - 1 } : r))
              .filter((r) => r.count > 0);
          }

          if (!isRemoving) {
            const exists = updatedReactions.find((r) => r.emoji === emoji);
            if (exists) {
              updatedReactions = updatedReactions.map((r) =>
                r.emoji === emoji ? { ...r, count: r.count + 1 } : r
              );
            } else {
              updatedReactions.push({ emoji, count: 1 });
            }
          }

          return {
            ...m,
            reactions: updatedReactions,
            myReaction: isRemoving ? null : emoji,
          };
        }),
      }));
    }

    try {
      await reactToMessage(message.id, emoji);
    } catch (err) {
      console.error("Failed to react to message:", err);
    }
  };

  useEffect(() => {
    if (!menuPosition || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const padding = 8;
    let { x, y } = menuPosition;
    if (x + rect.width + padding > window.innerWidth) x = window.innerWidth - rect.width - padding;
    if (y + rect.height + padding > window.innerHeight) y = window.innerHeight - rect.height - padding;
    if (x !== menuPosition.x || y !== menuPosition.y) setMenuPosition({ x: Math.max(padding, x), y: Math.max(padding, y) });
  }, [menuPosition]);

  const openMenu = (event) => {
    if (selectMode) return;
    event.preventDefault();
    event.stopPropagation();
    setMenuPosition({ x: event.clientX, y: event.clientY });
  };
  const closeMenu = () => setMenuPosition(null);

  const plainText = () => (message.type === "file" ? (message.caption || "Shared file") : (message.text || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim());

  const copyMessageText = () => { navigator.clipboard?.writeText(plainText()); closeMenu(); };

  const saveMessageAs = () => {
    const blob = new Blob([plainText()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `message-${message.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    closeMenu();
  };

  const shareMessage = async () => {
    const text = plainText();
    if (navigator.share) {
      try { await navigator.share({ text }); } catch { /* user cancelled */ }
    } else {
      navigator.clipboard?.writeText(text);
    }
    closeMenu();
  };

  const openWith = () => {
    if (message.fileUrl) window.open(message.fileUrl, "_blank", "noopener");
    closeMenu();
  };

  const menuItems = [
    {
      label: "Message info",
      icon: Info,
      onClick: () => {
        setInfoOpen(true);
        closeMenu();
      },
    },
    {
      label: "Reply",
      icon: Reply,
      onClick: () => {
        startReply(message);
        closeMenu();
      },
    },
    {
      label: "Copy",
      icon: Copy,
      onClick: copyMessageText,
    },
    {
      label: "Forward",
      icon: Forward,
      onClick: () => {
        openForwardDialog(message.id);
        closeMenu();
      },
    },
    {
      label: pinned ? "Unpin" : "Pin",
      icon: Pin,
      iconClassName: pinned ? "fill-[#fd7e13] text-[#fd7e13]" : "",
      onClick: () => {
        toggleMessagePin(message.id);
        closeMenu();
      },
    },
    {
      label: starred ? "Unstar" : "Star",
      icon: Star,
      iconClassName: starred ? "fill-[#F4B400] text-[#F4B400]" : "",
      onClick: () => {
        toggleMessageStar(message.id);
        closeMenu();
      },
    },
    { divider: true },
    {
      label: "Select",
      icon: CheckSquare,
      onClick: () => {
        enterSelectMode(message);
        closeMenu();
      },
    },
    {
      label: "Save as",
      icon: Download,
      onClick: saveMessageAs,
    },
    {
      label: "Share",
      icon: Share2,
      onClick: shareMessage,
    },
    {
      label: "Open with",
      icon: ExternalLink,
      disabled: !message.fileUrl,
      onClick: openWith,
    },
    ...(canEdit(message) || canDelete(message) ? [{ divider: true }] : []),
    ...(canEdit(message)
      ? [{
          label: "Edit",
          icon: Pencil,
          onClick: () => {
            setEditingMessage(message);
            setDraft(message.text || "");
            closeMenu();
          },
        }]
      : []),
    ...(canDelete(message)
      ? [{
          label: "Delete",
          icon: Trash2,
          danger: true,
          onClick: () => {
            setMessageToDelete({
              conversationId: activeConversationId,
              messageId: message.id,
            });
            closeMenu();
          },
        }]
      : []),
  ];

  const isRealImage = isImageFile(message);
  const fileName = message.attachmentName || message.caption || (message.fileUrl ? message.fileUrl.split("/").pop() : "document");
  const fileExt = fileName.split(".").pop().toUpperCase() || "DOC";

  return (
    <div
      id={`message-${message.id}`}
      onContextMenu={openMenu}
      onClick={() => { if (selectMode) toggleSelectMessage(message.id); }}
      className={`group relative flex max-w-[78%] items-start gap-2.5 ${message.mine ? "self-end" : "self-start"} ${selectMode ? "cursor-pointer" : ""}`}
    >
      {selectMode && (
        <span className={`mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[#fd7e13] bg-[#fd7e13] text-white" : "border-[#C9CDD2] bg-white"}`}>
          {selected && <CheckSquare size={13} />}
        </span>
      )}
      {!message.mine && <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white" style={{ background: message.color }}>{message.initials}</span>}
      <div className={`relative ${message.mine ? "order-first" : ""}`}>
        {!message.mine && <p className="mb-1 text-[11px] font-medium text-[#6B7178]">{message.sender}</p>}
        
        {message.replyTo && (
          <button
            type="button"
            onClick={() => {
              const target = document.getElementById(`message-${message.replyTo.id}`);
              if (!target) return;
              target.scrollIntoView({ behavior: "smooth", block: "center" });
              target.classList.add("ring-2", "ring-[#fd7e13]", "ring-offset-2");
              setTimeout(() => target.classList.remove("ring-2", "ring-[#fd7e13]", "ring-offset-2"), 1200);
            }}
            className="mb-1 flex w-full flex-col items-start gap-0.5 rounded-[8px] border-l-[3px] border-[#fd7e13] bg-black/5 px-2.5 py-1.5 text-left"
          >
            <span className="text-[11px] font-semibold text-[#fd7e13]">{message.replyTo.sender}</span>
            <span className="line-clamp-1 text-[11.5px] text-[#6B7178]">
              {message.replyTo.type && message.replyTo.type !== "TEXT" ? "📎 " : ""}
              {message.replyTo.text || "Shared file"}
            </span>
          </button>
        )}

        {/* Hover Quick Action Toolbar */}
        <div className={`absolute -top-8 z-20 flex items-center gap-0.5 rounded-full border border-[#E4E0D6] bg-white px-1.5 py-0.5 shadow-md opacity-0 transition-opacity group-hover:opacity-100 ${selectMode ? "hidden" : ""} ${message.mine ? "right-0" : "left-0"}`}>
          <button
            type="button"
            title={pinned ? "Unpin message" : "Pin message"}
            onClick={() => toggleMessagePin(message.id)}
            className="rounded-full p-1 text-[#6B7178] hover:bg-[#FFF0E5] hover:text-[#fd7e13] transition-colors"
          >
            <Pin size={14} className={pinned ? "fill-[#fd7e13] text-[#fd7e13]" : ""} />
          </button>

          <button
            type="button"
            title="React with emoji"
            onClick={() => setEmojiPickerMessageId((id) => (id === message.id ? null : message.id))}
            className={`rounded-full p-1 transition-colors ${
              showEmojiPicker ? "bg-[#FFF0E5] text-[#fd7e13]" : "text-[#6B7178] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
            }`}
          >
            <Smile size={14} />
          </button>

          {canEdit(message) && (
            <button
              type="button"
              title="Edit message"
              onClick={() => {
                setEditingMessage(message);
                setDraft(message.text || "");
              }}
              className="rounded-full p-1 text-[#6B7178] hover:bg-[#FFF0E5] hover:text-[#fd7e13] transition-colors"
            >
              <Pencil size={14} />
            </button>
          )}

          {canDelete(message) && (
            <button
              type="button"
              title="Delete message"
              onClick={() =>
                setMessageToDelete({
                  conversationId: activeConversationId,
                  messageId: message.id,
                })
              }
              className="rounded-full p-1 text-[#6B7178] hover:bg-[#FFF1F0] hover:text-[#D14343] transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* WhatsApp-Style Floating Emoji Selector Popup */}
        {showEmojiPicker && (
          <>
            <div
              className="fixed inset-0 z-30 cursor-default"
              onClick={() => setEmojiPickerMessageId(null)}
            />
            <div
              className={`absolute -top-12 z-40 flex items-center gap-1.5 rounded-full border border-[#E4E0D6] bg-white px-2.5 py-1 shadow-[0_6px_20px_rgba(0,0,0,0.14)] animate-in fade-in zoom-in-95 duration-100 ${
                message.mine ? "right-0" : "left-0"
              }`}
            >
              {EMOJI_OPTIONS.map((emoji) => {
                const isSelected = myReaction === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[19px] transition-transform hover:scale-125 ${
                      isSelected ? "bg-[#FFF0E5]" : "hover:bg-[#F8F7F5]"
                    }`}
                    aria-label={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Message Bubble Container */}
        <div className="relative">
          {editingMessage?.id === message.id ? (
            <div className="w-full max-w-[360px]">
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const value = draft.trim();
                    if (!value) return;
                    try {
                      await editMessage(message.id, value);
                    } catch (error) {
                      console.error("Edit failed:", error);
                    }
                  }
                  if (e.key === "Escape") {
                    setEditingMessage(null);
                    setDraft("");
                  }
                }}
                rows={2}
                className="w-full resize-none rounded-[18px] border-2 border-[#2563EB] bg-white px-4 py-3 text-[14px] leading-relaxed text-[#1E2328] outline-none"
                placeholder="Edit message..."
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMessage(null);
                    setDraft("");
                  }}
                  className="rounded-md border border-[#E4E0D6] bg-white px-3 py-1.5 text-[12px] font-medium text-[#6B7178] hover:bg-[#F8F7F5]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const value = draft.trim();
                    if (!value) return;
                    try {
                      await editMessage(message.id, value);
                    } catch (error) {
                      console.error("Edit failed:", error);
                    }
                  }}
                  className="rounded-md bg-[#fd7e13] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#e96f08]"
                >
                  Save
                </button>
              </div>
            </div>
          ) : message.type === "file" ? (
            isRealImage && message.fileUrl ? (
              /* REAL IMAGES */
              <div
                onContextMenu={openMenu}
                className="w-64 overflow-hidden rounded-[14px] border border-[#EDEAE2] bg-white shadow-sm"
              >
                <img
                  src={message.fileUrl}
                  alt={message.caption || "Shared image"}
                  onClick={() => window.open(message.fileUrl, "_blank", "noopener")}
                  className="max-h-72 w-full cursor-pointer bg-[#F1F0EC] object-contain transition-transform hover:scale-[1.02]"
                />
                {message.caption && message.caption !== fileName && (
                  <p className="border-t border-[#EDEAE2] px-3 py-2 text-[12.5px] font-medium text-[#1E2328]">
                    {message.caption}
                  </p>
                )}
              </div>
            ) : (
              /* DOCUMENTS, PDF, DOCX, ZIP, CODE FILES */
              <div
                onContextMenu={openMenu}
                className="w-72 overflow-hidden rounded-[14px] border border-[#EDEAE2] bg-white shadow-sm"
              >
                <a
                  href={message.fileUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={fileName}
                  className="flex items-center gap-3 p-3 transition-colors hover:bg-[#FFF0E5]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#FFF0E5] text-[#fd7e13]">
                    <FileText size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[#1E2328]" title={fileName}>
                      {fileName}
                    </p>
                    <p className="text-[11px] font-medium uppercase text-[#8C9198]">
                      {fileExt} · Click to open
                    </p>
                  </div>
                  <div className="shrink-0 p-1 text-[#6B7178] hover:text-[#fd7e13]">
                    <Download size={18} />
                  </div>
                </a>
                {message.caption && message.caption !== fileName && (
                  <p className="border-t border-[#EDEAE2] px-3.5 py-2 text-[12px] text-[#1E2328]">
                    {message.caption}
                  </p>
                )}
              </div>
            )
          ) : (
            <div
              onContextMenu={openMenu}
              className={`rich-text rounded-[14px] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                message.mine
                  ? "rounded-br-[3px] bg-[#FFF0E5] text-[#1E2328]"
                  : "rounded-bl-[3px] bg-[#F8F7F5] text-[#1E2328]"
              } ${isSending ? "opacity-60" : ""} ${isFailed ? "border border-[#F1C3C3]" : ""}`}
            >
              <div dangerouslySetInnerHTML={{ __html: linkifyHtml(sanitizeHtml(message.text)) }} />
              {message.attachmentName && <p className="mt-1.5 text-[11px] font-medium text-[#6B7178]">📎 {message.attachmentName}</p>}
            </div>
          )}

          {/* WhatsApp Overlapping Emoji Reaction Badge Directly on Bubble */}
          {reactions.length > 0 && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (myReaction) {
                  handleEmojiClick(myReaction);
                }
              }}
              title={myReaction ? "Click to remove your reaction" : "Reactions"}
              className={`absolute -bottom-2.5 ${
                message.mine ? "right-2" : "left-2"
              } z-10 flex cursor-pointer select-none items-center gap-1 rounded-full border border-[#E4E0D6] bg-white px-2 py-0.5 shadow-[0_2px_5px_rgba(0,0,0,0.08)] transition-all hover:scale-105 active:scale-95`}
            >
              {reactions.map((r) => (
                <span key={r.emoji} className="text-[13px] leading-none">
                  {r.emoji}
                </span>
              ))}
              {reactions.reduce((sum, r) => sum + (r.count || 0), 0) > 1 && (
                <span className="text-[10px] font-semibold text-[#6B7178]">
                  {reactions.reduce((sum, r) => sum + (r.count || 0), 0)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Timestamps, Status & Pin/Star icons */}
        <div
          className={`${
            reactions.length > 0 ? "mt-3.5" : "mt-1.5"
          } flex items-center gap-1.5 ${message.mine ? "justify-end" : ""}`}
        >
          {pinned && <span className="flex items-center gap-1 rounded-full bg-[#FFF0E5] px-1.5 py-[1px] text-[9.5px] font-medium text-[#fd7e13]"><Pin size={9} className="fill-[#fd7e13]" />Pinned</span>}
          {starred && <span className="flex items-center gap-1 rounded-full bg-[#FFF7E0] px-1.5 py-[1px] text-[9.5px] font-medium text-[#B8862E]"><Star size={9} className="fill-[#F4B400] text-[#F4B400]" />Starred</span>}
          <button type="button" title={pinned ? "Unpin message" : "Pin message"} onClick={() => toggleMessagePin(message.id)} className={`rounded-full p-0.5 text-[#9AA0A6] opacity-0 transition-opacity hover:bg-[#F1F0EC] hover:text-[#fd7e13] group-hover:opacity-100 ${selectMode ? "hidden" : ""} ${pinned ? "!opacity-100 text-[#fd7e13]" : ""}`}>
            <Pin size={11} className={pinned ? "fill-[#fd7e13]" : ""} />
          </button>
          {isSending && <p className="text-[10px] text-[#9AA0A6]">Sending…</p>}
          {isFailed && <button type="button" onClick={() => retryFailedMessage(activeConversationId, message.id)} className="text-[10px] font-medium text-[#D14343] hover:underline">Failed · Tap to retry</button>}
          {!isSending && !isFailed && <p className="text-[10px] text-[#9AA0A6]">{message.time}</p>}
        </div>
      </div>

      {/* Message Context Menu */}
      {menuPosition && (
        <>
          <button type="button" aria-label="Close menu" onClick={closeMenu} onContextMenu={(e) => { e.preventDefault(); closeMenu(); }} className="fixed inset-0 z-[70] cursor-default" />
          <div ref={menuRef} role="menu" style={{ top: menuPosition.y, left: menuPosition.x }} className="fixed z-[80] w-52 overflow-hidden rounded-[12px] border border-[#E4E0D6] bg-white py-1.5 shadow-[0_14px_32px_rgba(30,35,40,0.2)]">
            {menuItems.map((item, index) =>
              item.divider ? (
                <div key={`divider-${index}`} className="my-1 border-t border-[#EDEAE2]" />
              ) : (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={item.onClick}
                  className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${item.danger ? "text-[#D14343] hover:bg-[#FFF1F0]" : "text-[#1E2328] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"}`}
                >
                  <item.icon size={16} className={item.iconClassName} />
                  {item.label}
                </button>
              )
            )}
          </div>
        </>
      )}

      {infoOpen && <MessageInfoPopover message={message} onClose={() => setInfoOpen(false)} />}
    </div>
  );
}

function renderMessagesWithDateDividers(messages, chat) {
  const groups = [];
  let currentGroup = null;

  messages.forEach((message) => {
    const currentDate = message.createdAt || null;

    if (!currentGroup || !isSameCalendarDay(currentGroup.date, currentDate)) {
      currentGroup = {
        date: currentDate,
        messages: [],
      };
      groups.push(currentGroup);
    }

    currentGroup.messages.push(message);
  });

  return groups.map((group, groupIndex) => (
    <div key={`day-group-${groupIndex}-${group.date || "today"}`} className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 flex justify-center py-1">
        <span className="rounded-full border border-[#EDEAE2] bg-[#F8F7F5] px-3 py-1 text-[10.5px] text-[#6B7178] shadow-[0_1px_3px_rgba(30,35,40,0.08)]">
          {formatDateDivider(group.date)}
        </span>
      </div>

      {group.messages.map((message) => {
        if (message.type === "activity") {
          return (
            <span key={message.id} className="mx-auto flex items-center gap-1.5 rounded-full bg-[#F8F7F5] px-3 py-1 text-[10.5px] text-[#6B7178]">
              <Pin size={11} className="text-[#fd7e13]" />
              {message.text}
            </span>
          );
        }

        if (message.type === "system") {
          return (
            <div key={message.id} className="mx-auto flex w-fit max-w-md items-center gap-3 rounded-[12px] border border-[#EDEAE2] bg-white px-3 py-2 shadow-[0_1px_3px_rgba(30,35,40,0.06)]">
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium text-[#1E2328]">{message.text}</p>
              </div>
            </div>
          );
        }

        if (message.type === "invite") {
          return (
            <div key={message.id} className="mx-auto flex items-center gap-2 px-1">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFF0E5] text-[#fd7e13]">
                <UserPlus size={13} />
              </span>
              <p className="text-[12px] leading-relaxed text-[#6B7178]">
                <span className="font-medium text-[#1E2328]">{message.invitee}</span> was{" "}
                <span className="font-semibold text-[#1E2328]">invited</span> by{" "}
                <span className="font-medium text-[#1E2328]">{message.inviter}</span>, and hasn't joined yet
                <span className="ml-1.5 text-[10px] text-[#9AA0A6]">{message.time}</span>
              </p>
            </div>
          );
        }

        return <MessageBubble key={message.id} chat={chat} message={message} />;
      })}
    </div>
  ));
}

export default function MessageList({ chat }) {
  const { activeConversation, activeConversationId, messages } = chat;
  const showWelcome = activeConversation?.type === "space" && messages.length === 0;
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [activeConversationId, messages.length]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-5">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4">
        {showWelcome ? (
          <NewGroupWelcome chat={chat} />
        ) : (
          <>
            {renderMessagesWithDateDividers(messages, chat)}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
}