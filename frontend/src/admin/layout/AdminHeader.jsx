import { useEffect, useState } from "react";
import { Bell, ChevronDown, ChevronLeft, House, Maximize2, MessageCircle, MessageSquare, MoreHorizontal, Plus, SendHorizontal, Settings, Star, UsersRound, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

function AdminChatMiniWindow({ onClose }) {
  const conversations = [
    { id: 1, name: "Moderation team", initials: "MT", color: "#7C5CFC", preview: "New report needs a review.", status: "4 members online" },
    { id: 2, name: "Support leads", initials: "SL", color: "#168A72", preview: "The response template is ready.", status: "2 members online" },
    { id: 3, name: "Product admins", initials: "PA", color: "#D86A33", preview: "Let’s review the release notes.", status: "3 members online" },
  ];
  const directMessages = [
    { id: 101, name: "Priya Shah", initials: "PS", color: "#D86A33", preview: "Sure, I’ll take care of it.", status: "Active now" },
  ];

  const [activeTab, setActiveTab] = useState("home");
  const [moreOpen, setMoreOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, sender: "Priya Shah", text: "New report needs a review.", time: "10:24 AM" },
    { id: 2, sender: "You", text: "I’ll review it now.", time: "10:28 AM", mine: true },
  ]);

  const openTab = (tab) => {
    setActiveTab(tab);
    setActiveConversation(null);
    setMoreOpen(false);
    setComposeOpen(false);
  };

  const sendMessage = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [...current, { id: Date.now(), sender: "You", text, time: "Now", mine: true }]);
    setDraft("");
  };

  const listForTab = activeTab === "groups" ? conversations : activeTab === "direct" ? directMessages : conversations;
  const headerTitle = { home: "Chats", starred: "Starred", groups: "Groups", direct: "Direct messages" }[activeTab] || "Chats";
  const headerSubtitle = { home: "Select a conversation", starred: "Starred conversations", groups: "Your groups", direct: "Direct messages" }[activeTab] || "Select a conversation";

  return (
    <section className="fixed bottom-[88px] right-6 z-50 flex h-[430px] w-[360px] flex-col overflow-hidden rounded-[16px] border border-[#E4E0D6] bg-white shadow-[0_14px_40px_rgba(30,35,40,0.22)]" aria-label="Admin chat">
      <div className="flex items-center justify-between border-b border-[#EDEAE2] bg-[#FFF0E5] px-4 py-3">
        {activeConversation ? (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              title="Back to conversations"
              onClick={() => setActiveConversation(null)}
              className="rounded-full p-1.5 text-[#5C6570] hover:bg-white hover:text-[#1E2328]"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold text-white" style={{ background: activeConversation.color }}>{activeConversation.initials}</span>
            <div><h2 className="text-[13px] font-semibold text-[#1E2328]">{activeConversation.name}</h2><p className="text-[10.5px] text-[#3E8E5A]">{activeConversation.status}</p></div>
          </div>
        ) : <div><h2 className="text-[15px] font-semibold text-[#1E2328]">{headerTitle}</h2><p className="text-[10.5px] text-[#6B7178]">{headerSubtitle}</p></div>}
        <div className="flex items-center gap-0.5">
          <Link to="/admin/chat" target="_blank" rel="noopener noreferrer" onClick={onClose} title="Maximize chat" className="rounded-full p-1.5 text-[#5C6570] hover:bg-white hover:text-[#fd7e13]"><Maximize2 size={17} /></Link>
          <button type="button" title="Close mini chat" onClick={onClose} className="rounded-full p-1.5 text-[#5C6570] hover:bg-white hover:text-[#1E2328]"><X size={18} /></button>
        </div>
      </div>

      {activeConversation ? <>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex flex-col ${message.mine ? "items-end" : "items-start"}`}>
              {!message.mine && <span className="mb-1 text-[10.5px] font-medium text-[#6B7178]">{message.sender}</span>}
              <p className={`max-w-[85%] rounded-[10px] px-3 py-2 text-[12px] leading-relaxed ${message.mine ? "rounded-br-[3px] bg-[#FFF0E5] text-[#1E2328]" : "rounded-bl-[3px] bg-[#F8F7F5] text-[#1E2328]"}`}>{message.text}</p>
              <span className="mt-1 text-[9.5px] text-[#9AA0A6]">{message.time}</span>
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className="border-t border-[#EDEAE2] p-3">
          <div className="flex items-center gap-2 rounded-[9px] border border-[#E4E0D6] bg-[#F8F7F5] p-1.5 focus-within:border-[#fd7e13]">
            <input value={draft} onChange={(event) => setDraft(event.target.value)} className="min-w-0 flex-1 bg-transparent px-2 text-[12px] text-[#1E2328] outline-none placeholder:text-[#9AA0A6]" placeholder="Write a message..." />
            <button type="submit" title="Send message" className="rounded-[7px] bg-[#fd7e13] p-2 text-white hover:bg-[#e96f08]"><SendHorizontal size={16} /></button>
          </div>
        </form>
      </> : activeTab === "starred" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF0E5] text-[#fd7e13]">
            <Star size={28} strokeWidth={1.5} />
          </div>
          <h3 className="text-[14px] font-semibold text-[#1E2328]">You don't have any starred chats</h3>
          <p className="text-[11.5px] leading-relaxed text-[#6B7178]">Star important conversations to find them quickly here.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-2">
          {listForTab.map((conversation) => <button key={conversation.id} type="button" onClick={() => setActiveConversation(conversation)} className="flex w-full items-center gap-3 rounded-[10px] p-3 text-left hover:bg-[#F8F7F5]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white" style={{ background: conversation.color }}>{conversation.initials}</span>
            <span className="min-w-0"><span className="block truncate text-[13px] font-medium text-[#1E2328]">{conversation.name}</span><span className="mt-0.5 block truncate text-[11.5px] text-[#6B7178]">{conversation.preview}</span></span>
          </button>)}
        </div>
      )}

      {!activeConversation && (
        <div className="relative">
          {composeOpen && (
            <div className="absolute bottom-2 right-4 z-10 w-52 overflow-hidden rounded-[12px] border border-[#EDEAE2] bg-white py-1 shadow-[0_10px_24px_rgba(30,35,40,0.16)]">
              <p className="px-3 pb-1.5 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#9AA0A6]">Start a chat</p>
              {[...conversations, ...directMessages].map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => {
                    setActiveConversation(person);
                    setComposeOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-[#F8F7F5]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ background: person.color }}>{person.initials}</span>
                  <span className="truncate text-[13px] text-[#1E2328]">{person.name}</span>
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            title="New chat"
            onClick={() => {
              setComposeOpen((open) => !open);
              setMoreOpen(false);
            }}
            className="absolute -top-14 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#fd7e13] text-white shadow-[0_8px_18px_rgba(253,126,19,0.35)] transition-transform hover:-translate-y-0.5 hover:bg-[#e96f08]"
          >
            <Plus size={20} />
          </button>
        </div>
      )}

      <nav className="relative flex items-center justify-around border-t border-[#EDEAE2] bg-white px-5 py-2" aria-label="Mini chat navigation">
        <button type="button" title="Home" onClick={() => openTab("home")} className={`rounded-full p-2 ${activeTab === "home" && !moreOpen ? "bg-[#F0EDFF] text-[#5E43C5]" : "text-[#5C6570] hover:bg-[#F8F7F5]"}`}><House size={17} /></button>
        <button type="button" title="Starred" onClick={() => openTab("starred")} className={`rounded-full p-2 ${activeTab === "starred" && !moreOpen ? "bg-[#F0EDFF] text-[#5E43C5]" : "text-[#5C6570] hover:bg-[#F8F7F5]"}`}><Star size={17} /></button>
        <button type="button" title="Groups" onClick={() => openTab("groups")} className={`rounded-full p-2 ${activeTab === "groups" && !moreOpen ? "bg-[#F0EDFF] text-[#5E43C5]" : "text-[#5C6570] hover:bg-[#F8F7F5]"}`}><UsersRound size={17} /></button>
        <button type="button" title="More options" onClick={() => { setMoreOpen((open) => !open); setComposeOpen(false); }} className={`rounded-full p-2 ${moreOpen ? "bg-[#F0EDFF] text-[#5E43C5]" : "text-[#5C6570] hover:bg-[#F8F7F5]"}`}><MoreHorizontal size={18} /></button>

        {moreOpen && (
          <div className="absolute bottom-[calc(100%+8px)] right-4 w-44 overflow-hidden rounded-[10px] border border-[#EDEAE2] bg-white py-1 shadow-[0_8px_20px_rgba(30,35,40,0.12)]">
            <button type="button" onClick={() => openTab("direct")} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[#1E2328] hover:bg-[#F8F7F5]">
              <MessageSquare size={16} className="text-[#6B7178]" />
              Direct message
            </button>
            <button type="button" onClick={() => setMoreOpen(false)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[#1E2328] hover:bg-[#F8F7F5]">
              <Settings size={16} className="text-[#6B7178]" />
              Chat settings
            </button>
          </div>
        )}
      </nav>
    </section>
  );
}

export function AdminChatFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const openMiniChat = () => setIsOpen(true);
    window.addEventListener("open-admin-chat", openMiniChat);
    return () => window.removeEventListener("open-admin-chat", openMiniChat);
  }, []);

  return (
    <>
      {isOpen && <AdminChatMiniWindow onClose={() => setIsOpen(false)} />}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        title="Open admin chat"
        className="fixed bottom-6 right-6 z-50 flex h-12 items-center gap-2 rounded-full bg-[#fd7e13] px-4 text-[13px] font-medium text-white shadow-[0_8px_22px_rgba(253,126,19,0.35)] transition-all hover:-translate-y-0.5 hover:bg-[#e96f08] focus:outline-none focus:ring-4 focus:ring-[#FFD9BA]"
      >
        <MessageCircle size={18} />
      </button>
    </>
  );
}

export default function AdminHeader() {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;

    if (path === "/admin" || path === "/admin/") return "Dashboard";
    if (path.startsWith("/admin/users")) return "Users";
    if (path.startsWith("/admin/groups")) return "Groups";
    if (path.startsWith("/admin/reports")) return "Reports";
    if (path.startsWith("/admin/messages")) return "Messages";
    if (path.startsWith("/admin/chat")) return "Admin Chat";
    if (path.startsWith("/admin/media")) return "Media";
    if (path.startsWith("/admin/notifications")) return "Notifications";
    if (path.startsWith("/admin/admins")) return "Admins & Roles";
    if (path.startsWith("/admin/settings")) return "Settings";
    if (path.startsWith("/admin/logs")) return "Logs";

    return "Dashboard";
  };

  return (
    <div className="sticky top-0 z-10 mb-5 w-full bg-[#F4F2EC] pt-2">
      <header className="flex w-full items-center justify-between rounded-[14px] border border-[#EDEAE2] bg-white px-7 py-3 shadow-[0_1px_3px_rgba(30,35,40,0.06)]">

        {/* Page Title */}
        <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-[#1E2328]">
          {getPageTitle()}
        </h1>

        {/* Right Side */}
        <div className="flex items-center gap-4">

          {/* Notification */}
          <button
            type="button"
            title="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#6B7178] transition-colors hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
          >
            <Bell size={19} />

            <span className="absolute right-0 top-0 flex h-[16px] min-w-[16px] items-center justify-center rounded-full border-2 border-white bg-[#D84A3A] px-1 text-[9.5px] font-semibold leading-none text-white">
              4
            </span>
          </button>

          <div className="h-6 w-px bg-[#EDEAE2]" />

          {/* Admin Profile */}
          <button
            type="button"
            title="Admin profile"
            className="flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3 transition-colors hover:bg-[#F6F3EC]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fd7e13] text-[13px] font-semibold text-white">
              A
            </div>

            <span className="text-[13.5px] font-medium text-[#1E2328]">
              Admin
            </span>

            <ChevronDown
              size={15}
              className="text-[#9AA0A6]"
            />
          </button>

        </div>
      </header>
    </div>
  );
}