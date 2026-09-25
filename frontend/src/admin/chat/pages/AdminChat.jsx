import useChatState from "../components/hooks/useChatState";
import TopHeader from "../components/TopHeader";
import Sidebar from "../components/Sidebar";
import ConversationList from "../components/ConversationList";
import ChatHeader from "../components/ChatHeader";
import MessageList from "../components/MessageList";
import MessageComposer from "../components/MessageComposer";
import BoardPanel from "../components/BoardPanel";
import EmptyState from "../components/EmptyState";
import GroupNameDialog from "../components/dialogs/GroupNameDialog";
import MemberDialog from "../components/dialogs/MemberDialog";
import DeleteMessageDialog from "../components/dialogs/DeleteMessageDialog";
import ExitGroupDialog from "../components/dialogs/Exitgroupdialog";
import MessageInfoDialog from "../components/dialogs/Messageinfodialog";
import ForwardMessageDialog from "../components/dialogs/Forwardmessagedialog";
import RemoveMemberDialog from "../components/dialogs/RemoveMemberDialog";
import ProjectFileDialog from "../components/dialogs/ProjectFileDialog";

import ClearChatDialog from "../components/dialogs/ClearChatDialog";

export default function AdminChat() {
  const chat = useChatState();
  const { isChatVisible, activeShortcut } = chat;

  return (
    <div className="h-screen overflow-hidden bg-[#F4F2EC] p-2">
      <section className="flex h-full flex-col overflow-hidden rounded-[16px] border border-[#EDEAE2] bg-white shadow-[0_1px_3px_rgba(30,35,40,0.06)]">
        <TopHeader chat={chat} />

        <div
          className="relative grid flex-1 overflow-hidden lg:grid-cols-[var(--sidebar-width)_var(--home-width)_minmax(0,1fr)]"
          style={{ "--sidebar-width": `${chat.sidebarWidth}px`, "--home-width": `${chat.homeListWidth}px` }}
        >
          <Sidebar chat={chat} />

          {/* Drag handle for the sidebar — decoupled from the grid track so it
              can sit exactly on the boundary regardless of the current width. */}
          <div
            onMouseDown={chat.startSidebarResize}
            title="Drag to resize"
            style={{ left: chat.sidebarWidth }}
            className="absolute inset-y-0 z-20 hidden w-1.5 -translate-x-1/2 cursor-col-resize items-center justify-center hover:bg-[#FFE3C7] lg:flex"
          >
            <span className="h-8 w-[3px] rounded-full bg-[#E4E0D6]" />
          </div>

          <ConversationList chat={chat} />

          {/* Drag handle for the Home "recent conversations" list. Only shown
              in Home view, right on the boundary with the chat column. */}
          {activeShortcut === "home" && (
            <div
              onMouseDown={chat.startHomeListResize}
              title="Drag to resize"
              style={{ left: chat.sidebarWidth + chat.homeListWidth }}
              className="absolute inset-y-0 z-20 hidden w-1.5 -translate-x-1/2 cursor-col-resize items-center justify-center hover:bg-[#FFE3C7] lg:flex"
            >
              <span className="h-8 w-[3px] rounded-full bg-[#E4E0D6]" />
            </div>
          )}

          {/* Chat panel — column 3 only for Home, full width (columns 2-3) when a
              conversation is open. The board (pinned/files/members) panel sits in
              the same flex row, so opening it shrinks the chat — but the chat
              keeps a min-width so it's never squeezed illegibly small. */}
          <div className={`${isChatVisible ? "flex" : "hidden"} min-h-0 ${activeShortcut === "conversation" ? "lg:col-start-2 lg:col-span-2" : ""}`}>
            <div className="flex min-h-0 min-w-[360px] flex-1 flex-col">
              <ChatHeader chat={chat} />
              <MessageList chat={chat} />
              <MessageComposer chat={chat} />
            </div>
            <BoardPanel chat={chat} />
          </div>

          {!isChatVisible && <EmptyState shortcut={activeShortcut} />}
        </div>
      </section>

      <MemberDialog chat={chat} />
      <GroupNameDialog chat={chat} />
      <DeleteMessageDialog chat={chat} />
      <ExitGroupDialog chat={chat} />
      <MessageInfoDialog chat={chat} />
      <ForwardMessageDialog chat={chat} />
       <RemoveMemberDialog chat={chat} />
       <ProjectFileDialog chat={chat} />
       <ClearChatDialog chat={chat} />

      {chat.toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[90] flex justify-center">
          <div className="rounded-full bg-[#1E2328] px-4 py-2 text-[12.5px] font-medium text-white shadow-[0_10px_24px_rgba(30,35,40,0.28)]">
            {chat.toast}
          </div>
        </div>
      )}
    </div>
  );
}