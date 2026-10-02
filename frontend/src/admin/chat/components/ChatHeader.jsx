import { Eraser, Folder, Info, Maximize2, MoreHorizontal, Pin, Trash2, UserRound, Users, UsersRound } from "lucide-react";
import SelectionBar from "./SelectionBar";

export default function ChatHeader({ chat }) {
  const {
    activeConversation, groupMembers, openClearChatDialog,
    boardView, setBoardView, pinnedMessageList,
    isFullscreen, toggleFullscreen,
    groupOptionsOpen, setGroupOptionsOpen, openMemberDialog,
    cleanChat, deleteChat, activeConversationId,
    setViewingMemberId, isSuperAdmin, isGroupAdmin,
    selectMode,
  } = chat;

  if (!activeConversation) return null;

  // While selecting messages, the header becomes the selection bar
  if (selectMode) return <SelectionBar chat={chat} />;

  const isSpace = activeConversation.type === "space";

  return (
    <div className="flex items-center justify-between border-b border-[#EDEAE2] px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold text-white" style={{ background: activeConversation.color }}>{activeConversation.initials}</span>
        <div>
          <h2 className="text-[14px] font-semibold text-[#1E2328]">{activeConversation.name}</h2>
          <p className="text-[11.5px] text-[#3E8E5A]">{isSpace ? `${groupMembers.length} members online` : "Active now"}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          title={boardView === "pinned" ? "Hide pinned messages" : "Pinned messages"}
          onClick={() => setBoardView((current) => (current === "pinned" ? null : "pinned"))}
          className={`relative rounded-full p-2 ${boardView === "pinned" ? "bg-[#FFF0E5] text-[#fd7e13]" : "text-[#6B7178] hover:bg-[#F8F7F5] hover:text-[#1E2328]"}`}
        >
          <Pin size={18} className={boardView === "pinned" ? "fill-[#fd7e13]" : ""} />
          {pinnedMessageList.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#fd7e13] px-0.5 text-[8.5px] font-semibold text-white">
              {pinnedMessageList.length}
            </span>
          )}
        </button>
        <button
          type="button"
          title={boardView === "files" ? "Hide files" : "Files"}
          onClick={() => setBoardView((current) => (current === "files" ? null : "files"))}
          className={`rounded-full p-2 ${boardView === "files" ? "bg-[#FFF0E5] text-[#fd7e13]" : "text-[#6B7178] hover:bg-[#F8F7F5] hover:text-[#1E2328]"}`}
        >
          <Folder size={18} />
        </button>
        <button
          type="button"
          title={isFullscreen ? "Exit full screen" : "Maximize chat"}
          onClick={toggleFullscreen}
          className="rounded-full p-2 text-[#6B7178] hover:bg-[#F8F7F5] hover:text-[#1E2328]"
        >
          <Maximize2 size={18} />
        </button>
        <div className="relative">
          <button type="button" title="Conversation options" onClick={() => setGroupOptionsOpen((open) => !open)} className="rounded-full p-2 text-[#6B7178] hover:bg-[#F8F7F5]"><MoreHorizontal size={19} /></button>

          {/* Group Options Dropdown */}
          {groupOptionsOpen && isSpace && (
            <>
              <button
                type="button"
                aria-label="Close conversation options"
                onClick={() => setGroupOptionsOpen(false)}
                className="fixed inset-0 z-20 cursor-default"
              />
              <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-44 overflow-hidden rounded-[10px] border border-[#E4E0D6] bg-white py-1 shadow-[0_8px_20px_rgba(30,35,40,0.14)]">
                <button
                  type="button"
                  onClick={() => { setGroupOptionsOpen(false); setBoardView("info"); }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-[#1E2328] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
                >
                  <Info size={16} />Group info
                </button>
                <button
                  type="button"
                  onClick={() => { setGroupOptionsOpen(false); setBoardView("members"); }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-[#1E2328] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
                >
                  <Users size={16} />View members
                </button>
                <button
                  type="button"
                  onClick={() => { setGroupOptionsOpen(false); openMemberDialog(); }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-[#1E2328] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
                >
                  <UsersRound size={16} />Add members
                </button>

                {/* Clean chat option for group admin or super admin */}
                {(isSuperAdmin || isGroupAdmin) && (
                  <>
                    <div className="my-1 border-t border-[#EDEAE2]" />
                    <button
                      type="button"
                      onClick={() => {
                        setGroupOptionsOpen(false);
                        if (openClearChatDialog) openClearChatDialog();
                        else cleanChat();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-[#D14343] hover:bg-[#FFF1F0]"
                    >
                      <Eraser size={16} />Clean chat
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {/* 1-to-1 Direct Chat Options Dropdown */}
          {groupOptionsOpen && !isSpace && (
            <>
              <button
                type="button"
                aria-label="Close conversation options"
                onClick={() => setGroupOptionsOpen(false)}
                className="fixed inset-0 z-20 cursor-default"
              />
              <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-44 overflow-hidden rounded-[10px] border border-[#E4E0D6] bg-white py-1 shadow-[0_8px_20px_rgba(30,35,40,0.14)]">
                <button
                  type="button"
                  onClick={() => {
                    setGroupOptionsOpen(false);
                    setViewingMemberId(activeConversation.contactId ?? "you");
                    setBoardView("info");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-[#1E2328] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
                >
                  <UserRound size={16} />View profile
                </button>

                {/* Clean chat triggers openClearChatDialog with start and end dates */}
                <button
                  type="button"
                  onClick={() => {
                    setGroupOptionsOpen(false);
                    if (openClearChatDialog) {
                      openClearChatDialog();
                    } else {
                      cleanChat();
                    }
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-[#1E2328] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
                >
                  <Eraser size={16} />Clean chat
                </button>

                <div className="my-1 border-t border-[#EDEAE2]" />
                <button
                  type="button"
                  onClick={() => { setGroupOptionsOpen(false); deleteChat(activeConversationId); }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-[#D14343] hover:bg-[#FFF1F0]"
                >
                  <Trash2 size={16} />Delete chat
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}