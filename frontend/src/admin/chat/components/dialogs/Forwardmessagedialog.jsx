import { useState } from "react";
import { Search, X } from "lucide-react";

export default function ForwardMessageDialog({ chat }) {
  const { forwardMessageIds, closeForwardDialog, conversationList, activeConversationId, forwardMessagesTo } = chat;
  const [query, setQuery] = useState("");

  if (!forwardMessageIds) return null;

  const targets = conversationList.filter((conversation) =>
    conversation.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1E2328]/35 p-4" role="presentation" onMouseDown={closeForwardDialog}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="forward-message-title"
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#E4E0D6] bg-white shadow-[0_18px_50px_rgba(30,35,40,0.24)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="border-b border-[#EDEAE2] px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <h2 id="forward-message-title" className="text-[17px] font-semibold text-[#1E2328]">
              Forward {forwardMessageIds.length > 1 ? `${forwardMessageIds.length} messages` : "message"}
            </h2>
            <button type="button" onClick={closeForwardDialog} className="rounded-full p-1.5 text-[#6B7178] hover:bg-[#F1F0EC]" aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <label className="mt-4 flex items-center gap-2 rounded-[9px] border border-[#E4E0D6] bg-[#F8F7F5] px-3 py-2.5 text-[#6B7178] focus-within:border-[#fd7e13]">
            <Search size={16} />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search chats"
              className="w-full bg-transparent text-[13px] text-[#1E2328] outline-none placeholder:text-[#9AA0A6]"
            />
          </label>
        </div>

        <div className="max-h-80 overflow-y-auto px-2 py-2">
          {targets.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => forwardMessagesTo(conversation.id)}
              className="flex w-full items-center gap-3 rounded-[9px] px-2.5 py-2.5 text-left hover:bg-[#FFF0E5]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white" style={{ background: conversation.color }}>
                {conversation.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-[#1E2328]">{conversation.name}</span>
                {conversation.id === activeConversationId && (
                  <span className="text-[11px] text-[#9AA0A6]">Current conversation</span>
                )}
              </span>
            </button>
          ))}
          {targets.length === 0 && <p className="py-6 text-center text-[13px] text-[#6B7178]">No chats match your search.</p>}
        </div>
      </div>
    </div>
  );
}