import { useState, useMemo } from "react";
import {
  Folder,
  Pin,
  UserPlus,
  X,
  Link as LinkIcon,
  Image as ImageIcon,
  FileText,
  Download,
  ExternalLink,
  ChevronDown,
  Code2,
  Archive,
} from "lucide-react";
import GroupInfoPanel from "./Groupinfopanel";
import MemberRow from "./Memberrow";

const TITLES = {
  pinned: "Pinned messages",
  files: "Files",
  members: "Members",
  info: "Group info",
};

// WhatsApp-style date divider formatter
function formatDateDivider(dateInput) {
  if (!dateInput) return "Today";
  const date = new Date(dateInput);
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
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export default function BoardPanel({ chat }) {
  const {
    boardView,
    setBoardView,
    boardPanelWidth,
    startPanelResize,
    pinnedMessageList,
    toggleMessagePin,
    sharedMedia = [],
    messages = [],
    groupMembers,
    openMemberDialog,
    activeConversation,
  } = chat;

  const [openMemberRowId, setOpenMemberRowId] = useState(null);

  // Files tab state: 'project' | 'files' | 'media' | 'links'
  const [activeTab, setActiveTab] = useState("project");
  const [timeFilter, setTimeFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [selectedProject, setSelectedProject] = useState("all");

  // 1. Extract strictly project files sent IN THIS CHAT ONLY
  // Format sent by useChatState: "📁 [projectName] fileName.ext"
  const currentChatProjectFiles = useMemo(() => {
    return sharedMedia
      .filter((m) => {
        const text = m.caption || m.content || m.text || "";
        return text.includes("📁 [") || text.includes("📦 Project:");
      })
      .map((m) => {
        const text = m.caption || m.content || m.text || "";
        const match = text.match(/\[(.*?)\]/);
        const projectName = match ? match[1] : "Project";
        const cleanFileName = text.replace(/^📁\s*\[.*?\]\s*/, "").replace(/^📦\s*Project:\s*/, "");

        return {
          ...m,
          projectName,
          fileName: cleanFileName || m.attachmentName || "file",
        };
      });
  }, [sharedMedia]);

  // 2. Extract unique project names sent ONLY in this active chat
  const chatProjectNames = useMemo(() => {
    const set = new Set();
    currentChatProjectFiles.forEach((f) => {
      if (f.projectName) set.add(f.projectName);
    });
    return Array.from(set);
  }, [currentChatProjectFiles]);

  // 3. Extract Links in this chat
  const links = useMemo(() => {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const list = [];

    messages.forEach((msg) => {
      const text = msg.text || msg.caption || "";
      const matches = text.match(urlPattern);
      if (matches) {
        matches.forEach((url) => {
          list.push({
            id: `${msg.id}-${url}`,
            url,
            sender: msg.sender || (msg.mine ? "You" : "Unknown"),
            time: msg.time,
            createdAt: msg.createdAt,
          });
        });
      }
    });

    return list;
  }, [messages]);

  // 4. Regular Media (Images/Videos) excluding project files
  const mediaFiles = useMemo(() => {
    return sharedMedia.filter(
      (m) =>
        !(m.caption || "").includes("📁 [") &&
        (m.isImage ||
          m.type === "IMAGE" ||
          /\.(png|jpe?g|gif|webp|mp4|mov)$/i.test(m.fileUrl || m.url || ""))
    );
  }, [sharedMedia]);

  // 5. Regular Document files excluding project files & images
  const documentFiles = useMemo(() => {
    return sharedMedia.filter(
      (m) =>
        !(m.caption || "").includes("📁 [") &&
        !m.isImage &&
        m.type !== "IMAGE" &&
        !/\.(png|jpe?g|gif|webp|mp4|mov)$/i.test(m.fileUrl || m.url || "")
    );
  }, [sharedMedia]);

  // Active tab items
  const tabItems = useMemo(() => {
    switch (activeTab) {
      case "links":
        return links;
      case "media":
        return mediaFiles;
      case "files":
        return documentFiles;
      case "project":
      default:
        if (selectedProject === "all") return currentChatProjectFiles;
        return currentChatProjectFiles.filter(
          (f) => f.projectName.toLowerCase() === selectedProject.toLowerCase()
        );
    }
  }, [activeTab, links, mediaFiles, documentFiles, currentChatProjectFiles, selectedProject]);

  // Filter items by Time Period and Custom Date
// 1. Filter items by Time Period and Custom Date, SORTED NEWEST FIRST
  const filteredItems = useMemo(() => {
    const list = tabItems.filter((item) => {
      const itemDate = item.createdAt ? new Date(item.createdAt) : null;

      if (customDate) {
        if (!itemDate) return false;
        const target = new Date(customDate);
        const isSameDay =
          itemDate.getFullYear() === target.getFullYear() &&
          itemDate.getMonth() === target.getMonth() &&
          itemDate.getDate() === target.getDate();
        if (!isSameDay) return false;
      }

      if (timeFilter !== "all" && itemDate) {
        const now = new Date();
        const diffMs = now - itemDate;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (timeFilter === "today" && diffDays > 1) return false;
        if (timeFilter === "week" && diffDays > 7) return false;
        if (timeFilter === "month" && diffDays > 30) return false;
      }

      return true;
    });

    // Sort descending by timestamp (newest files on top)
    return [...list].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [tabItems, timeFilter, customDate]);

  // 2. Group items by calendar day in descending order (Today -> Yesterday -> Older days)
  const groupedByDate = useMemo(() => {
    const groups = [];
    let currentGroup = null;

    filteredItems.forEach((item) => {
      const itemDate = item.createdAt || null;

      if (!currentGroup || !isSameCalendarDay(currentGroup.date, itemDate)) {
        currentGroup = {
          date: itemDate,
          items: [],
        };
        groups.push(currentGroup);
      }

      currentGroup.items.push(item);
    });

    // Ensure within each day group, files remain newest at top
    groups.forEach((g) => {
      g.items.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
    });

    return groups;
  }, [filteredItems]);

  const getFileIcon = (fileName) => {
    const ext = (fileName || "").toLowerCase();
    if (/\.(java|js|jsx|ts|tsx|py|c|cpp|sql|json|xml|html|css|php|rb|go|rs)$/i.test(ext)) {
      return <Code2 size={16} className="text-[#3A5CFF]" />;
    }
    if (/\.(zip|rar|7z|tar|gz)$/i.test(ext)) {
      return <Archive size={16} className="text-[#168A72]" />;
    }
    if (/\.(pdf)$/i.test(ext)) {
      return <FileText size={16} className="text-[#D14343]" />;
    }
    return <FileText size={16} className="text-[#fd7e13]" />;
  };

  if (!boardView) return null;

  return (
    <div className="hidden md:flex">
      {/* Resizer Handle */}
      <div
        onMouseDown={startPanelResize}
        title="Drag to resize"
        className="flex w-1.5 shrink-0 cursor-col-resize items-center justify-center hover:bg-[#FFE3C7]"
      >
        <span className="h-8 w-[3px] rounded-full bg-[#E4E0D6]" />
      </div>

      {/* Board Content */}
      <div
        style={{ width: boardPanelWidth }}
        className="flex shrink-0 flex-col overflow-y-auto border-l border-[#EDEAE2] bg-[#FDFCF9] p-4"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-[#1E2328]">
            {boardView === "info" && activeConversation?.type !== "space"
              ? "Profile"
              : TITLES[boardView]}
          </h3>
          <button
            type="button"
            title="Close"
            onClick={() => setBoardView(null)}
            className="rounded-full p-1.5 text-[#6B7178] hover:bg-[#F1F0EC] hover:text-[#1E2328]"
          >
            <X size={16} />
          </button>
        </div>

        {/* 1. PINNED VIEW */}
        {boardView === "pinned" &&
          (pinnedMessageList.length === 0 ? (
            <div className="flex flex-col items-center rounded-[10px] bg-white/60 px-3 py-6 text-center">
              <div className="mb-3 flex h-14 w-14 animate-[bounce_2.5s_ease-in-out_infinite] items-center justify-center rounded-full bg-[#FFF0E5] text-[#fd7e13]">
                <Pin size={26} strokeWidth={1.5} />
              </div>
              <p className="text-[12.5px] font-semibold text-[#1E2328]">No pins yet</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-[#9AA0A6]">
                Hover a message and tap the pin icon to keep it here for everyone.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {pinnedMessageList.map((message) => (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => {
                    const target = document.getElementById(`message-${message.id}`);
                    if (!target) return;
                    target.scrollIntoView({ behavior: "smooth", block: "center" });
                    target.classList.add("ring-2", "ring-[#fd7e13]", "ring-offset-2");
                    setTimeout(() => target.classList.remove("ring-2", "ring-[#fd7e13]", "ring-offset-2"), 1200);
                  }}
                  className="w-full rounded-[9px] border border-[#EDEAE2] bg-white p-2.5 text-left hover:bg-[#F8F7F5]"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="truncate text-[11px] font-medium text-[#1E2328]">
                      {message.mine ? "You" : message.sender}
                    </p>
                    <span
                      role="button"
                      title="Unpin message"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleMessagePin(message.id);
                      }}
                      className="shrink-0 rounded-full p-1 text-[#fd7e13] hover:bg-[#FFF0E5]"
                    >
                      <Pin size={12} className="fill-[#fd7e13]" />
                    </span>
                  </div>
                  <p className="truncate text-[12px] text-[#6B7178]">
                    {message.type === "file" ? message.caption || "Shared a file" : message.text}
                  </p>
                  <p className="mt-1 text-[10px] text-[#9AA0A6]">{message.time}</p>
                </button>
              ))}
            </div>
          ))}

        {/* 2. FILES VIEW */}
        {boardView === "files" && (
          <div className="flex flex-col gap-3">
            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-[#EDEAE2] pb-1">
              {[
                { key: "project", label: "Project Files" },
                { key: "files", label: "Files" },
                { key: "media", label: "Media" },
                { key: "links", label: "Links" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative pb-1 text-[11.5px] font-medium transition-colors ${
                    activeTab === tab.key
                      ? "font-semibold text-[#fd7e13]"
                      : "text-[#6B7178] hover:text-[#1E2328]"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#fd7e13]" />
                  )}
                </button>
              ))}
            </div>

            {/* Filter 1: Project Selector (Only projects sent in THIS chat) */}
            {activeTab === "project" && (
              <div className="relative">
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full appearance-none rounded-[8px] border border-[#E4E0D6] bg-white px-2.5 py-1.5 pr-7 text-[11.5px] font-medium text-[#1E2328] outline-none hover:border-[#fd7e13] focus:border-[#fd7e13]"
                >
                  <option value="all"> All Projects </option>
                  {chatProjectNames.map((name) => (
                    <option key={name} value={name}>
                       {name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7178]"
                />
              </div>
            )}

            {/* Filter 2: Time Period + Date Picker */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="w-full appearance-none rounded-[8px] border border-[#E4E0D6] bg-white px-2.5 py-1.5 pr-6 text-[11.5px] font-medium text-[#1E2328] outline-none hover:border-[#fd7e13] focus:border-[#fd7e13]"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                </select>
                <ChevronDown
                  size={12}
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7178]"
                />
              </div>

              <div className="relative flex-1">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full rounded-[8px] border border-[#E4E0D6] bg-white px-2 py-1.5 text-[11px] text-[#1E2328] outline-none hover:border-[#fd7e13] focus:border-[#fd7e13]"
                />
              </div>
            </div>

            {/* Content List */}
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF0E5] text-[#fd7e13]">
                  <Folder size={26} strokeWidth={1.5} />
                </div>
                <p className="text-[12.5px] font-semibold text-[#1E2328]">
                  No {activeTab === "project" ? "project files" : activeTab === "links" ? "links" : "files"} found
                </p>
                <p className="mt-1 text-[11.5px] text-[#9AA0A6]">
                  {activeTab === "project"
                    ? "Files uploaded to projects in this conversation will appear here."
                    : "Items shared in this chat will appear here."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {groupedByDate.map((group, groupIdx) => (
                  <div key={`group-${groupIdx}-${group.date || "date"}`} className="flex flex-col gap-2">
                    {/* WhatsApp-Style Date Pill Divider */}
                    <div className="sticky top-0 z-10 flex justify-center py-0.5">
                      <span className="rounded-full border border-[#EDEAE2] bg-[#F8F7F5] px-3 py-0.5 text-[10px] font-medium text-[#6B7178] shadow-sm">
                        {formatDateDivider(group.date)}
                      </span>
                    </div>

                    {/* Links */}
                    {activeTab === "links" ? (
                      group.items.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 rounded-[9px] border border-[#EDEAE2] bg-white p-2 text-left hover:bg-[#F8F7F5]"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#FFF0E5] text-[#fd7e13]">
                            <LinkIcon size={14} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12px] font-medium text-[#1E2328]">
                              {link.url}
                            </p>
                            <p className="text-[10px] text-[#9AA0A6]">{link.time || "Link"}</p>
                          </div>
                          <ExternalLink size={13} className="shrink-0 text-[#9AA0A6]" />
                        </a>
                      ))
                    ) : activeTab === "media" ? (
                      /* Media Grid */
                      <div className="grid grid-cols-2 gap-2">
                        {group.items.map((item) => {
                          const imageUrl = item.fileUrl || item.url || item.path || item.mediaUrl;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => imageUrl && window.open(imageUrl, "_blank", "noopener,noreferrer")}
                              className="group relative aspect-square overflow-hidden rounded-[10px] border border-[#EDEAE2] bg-[#F1F0EC] hover:opacity-90"
                            >
                              <img
                                src={imageUrl}
                                alt={item.caption || "Shared media"}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                              {item.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/55 px-2 py-1 text-left">
                                  <p className="truncate text-[10px] text-white">{item.caption}</p>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      /* Project Files & Regular Files */
                      group.items.map((item) => {
                        const fileLink = item.fileUrl || item.url || item.path || item.mediaUrl;
                        const cleanName = item.fileName || item.attachmentName || item.caption || "File";
                        const ext = cleanName.includes(".")
                          ? cleanName.split(".").pop().toUpperCase()
                          : "FILE";

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-[9px] border border-[#EDEAE2] bg-white p-2.5 hover:bg-[#F8F7F5]"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF0E5]">
                                {getFileIcon(cleanName)}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-[12px] font-medium text-[#1E2328]" title={cleanName}>
                                  {cleanName}
                                </p>
                                <div className="flex items-center gap-1.5 text-[10px] text-[#9AA0A6]">
                                  <span className="font-semibold text-[#fd7e13]">{ext}</span>
                                  {item.projectName && (
                                    <>
                                      <span>·</span>
                                      <span className="rounded bg-[#F1F0EC] px-1 py-0.5 font-medium text-[#6B7178]">
                                        {item.projectName}
                                      </span>
                                    </>
                                  )}
                                  <span>·</span>
                                  <span>{item.time || "Recent"}</span>
                                </div>
                              </div>
                            </div>
                            {fileLink && (
                              <a
                                href={fileLink}
                                download={cleanName}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-md p-1.5 text-[#6B7178] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
                              >
                                <Download size={14} />
                              </a>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. MEMBERS VIEW */}
        {boardView === "members" && (
          <>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[#9AA0A6]">
              {groupMembers.length} member{groupMembers.length === 1 ? "" : "s"}
            </p>
            <div className="flex flex-col gap-1">
              {groupMembers.map((member) => (
                <MemberRow
                  key={member.id}
                  chat={chat}
                  member={member}
                  isOpen={openMemberRowId === member.id}
                  onToggle={() =>
                    setOpenMemberRowId((current) => (current === member.id ? null : member.id))
                  }
                />
              ))}
            </div>
            <button
              type="button"
              onClick={openMemberDialog}
              className="mt-3 flex items-center gap-2 rounded-[9px] px-1.5 py-2 text-left text-[13px] font-medium text-[#fd7e13] hover:bg-[#FFF0E5]"
            >
              <UserPlus size={17} />Add members
            </button>
          </>
        )}

        {/* 4. GROUP INFO VIEW */}
        {boardView === "info" && <GroupInfoPanel chat={chat} />}
      </div>
    </div>
  );
}