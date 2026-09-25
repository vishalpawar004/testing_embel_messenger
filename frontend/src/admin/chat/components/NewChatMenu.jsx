import { useEffect, useState } from "react";
import { UsersRound, Loader2 } from "lucide-react";
import { searchUsers as searchUsersRequest } from "../../../services/authService";

function initialsFromName(name) {
  return (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("") || "?";
}

const AVATAR_COLORS = ["#7C5CFC", "#168A72", "#D86A33", "#3A5CFF", "#B05C9E", "#1E9E5A", "#C1443A"];

export default function NewChatMenu({ chat }) {
  const {
    setNewChatOpen,
    newChatSearch,
    setNewChatSearch,
    setGroupNameDialogOpen,
    startDirectMessage,
  } = chat;

  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);

  const isSearching = Boolean(newChatSearch.trim());

  // Fetch users from backend: empty query returns default system users, typing filters them
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const delayTimer = setTimeout(async () => {
      try {
        const query = newChatSearch.trim();
        const results = await searchUsersRequest(query);

        if (isMounted) {
          const mapped = (Array.isArray(results) ? results : []).map((u) => {
            const id = u.id ?? u.userId;
            return {
              id,
              name: u.name || `User ${id}`,
              email: u.email || "",
              initials: initialsFromName(u.name),
              color: AVATAR_COLORS[Math.abs(Number(id) || 0) % AVATAR_COLORS.length],
            };
          });
          setUsersList(mapped);
        }
      } catch (err) {
        console.error("Failed to load users:", err);
        if (isMounted) setUsersList([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }, isSearching ? 300 : 0); // instant load on open, debounced when typing

    return () => {
      isMounted = false;
      clearTimeout(delayTimer);
    };
  }, [newChatSearch]);

  const handleSelectContact = async (contact) => {
    setNewChatOpen(false);
    setNewChatSearch("");
    await startDirectMessage(contact);
  };

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close new chat menu"
        onClick={() => {
          setNewChatOpen(false);
          setNewChatSearch("");
        }}
        className="fixed inset-0 z-30 cursor-default"
      />

      <div className="absolute left-3 top-[64px] z-40 flex w-[305px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[12px] border border-[#E4E0D6] bg-white py-2 shadow-[0_10px_24px_rgba(30,35,40,0.18)]">
        {/* Search Input */}
        <div className="px-4 pt-1">
          <input
            autoFocus
            value={newChatSearch}
            onChange={(event) => setNewChatSearch(event.target.value)}
            placeholder="Search by name or email"
            className="w-full border-b border-[#D5D0C6] bg-transparent py-2.5 text-[15px] text-[#1E2328] outline-none placeholder:text-[#8C9198] focus:border-[#fd7e13]"
          />
        </div>

        {/* Create Group Action */}
        {!isSearching && (
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setNewChatOpen(false);
                setGroupNameDialogOpen(true);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] font-medium text-[#1E2328] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
            >
              <UsersRound size={18} className="text-[#6B7178]" />
              Create a group
            </button>
          </div>
        )}

        {/* User List Section */}
        <div className="border-t border-[#EDEAE2] px-4 pt-3 pb-2">
          <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-[#8C9198]">
            {isSearching ? "Search Results" : "People"}
          </p>

          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6 text-[#fd7e13]">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : usersList.length > 0 ? (
              usersList.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => handleSelectContact(contact)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-[#FFF0E5]"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                    style={{ background: contact.color }}
                  >
                    {contact.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-[#1E2328]">
                      {contact.name}
                    </span>
                    <span className="block truncate text-[11px] text-[#6B7178]">
                      {contact.email}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="px-1 py-4 text-[13px] text-[#6B7178]">
                {isSearching ? `No users found for "${newChatSearch}".` : "No users found."}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}