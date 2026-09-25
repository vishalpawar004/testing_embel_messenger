import { useState } from "react";
import { Bell, BellOff, Image as ImageIcon, LogOut, Pencil, Trash2, UserPlus, Users, AlertTriangle, Eraser } from "lucide-react";
import MemberRow from "./Memberrow";

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-[#fd7e13]" : "bg-[#E4E0D6]"}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function GroupInfoPanel({ chat }) {
  const {
    activeConversation, groupMembers, openMemberDialog,
    renameConversation, groupDescription, setGroupDescription,
    isMuted, toggleMuteConversation, isMediaVisible, toggleMediaVisibility,
    cleanChat, openClearChatDialog, setExitGroupDialogOpen, groupInfoError,
    isSuperAdmin, isGroupAdmin, handleDeleteGroup,
  } = chat;

  const isGroup = activeConversation.type === "space";
  const canDeleteGroup = isSuperAdmin || isGroupAdmin;

  const [openMemberRowId, setOpenMemberRowId] = useState(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(activeConversation.name);
  const [savingName, setSavingName] = useState(false);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState(groupDescription);
  const [savingDescription, setSavingDescription] = useState(false);

  // Custom Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === activeConversation.name) {
      setIsEditingName(false);
      return;
    }
    setSavingName(true);
    await renameConversation(activeConversation.id, trimmed);
    setSavingName(false);
    setIsEditingName(false);
  };

  const saveDescription = async () => {
    const trimmed = descriptionDraft.trim();
    setSavingDescription(true);
    await setGroupDescription(activeConversation.id, trimmed);
    setSavingDescription(false);
    setIsEditingDescription(false);
  };

  const confirmDelete = async () => {
    try {
      setIsDeletingGroup(true);
      await handleDeleteGroup(activeConversation.id);
      setDeleteModalOpen(false);
    } catch (error) {
      console.error("Delete group error:", error);
      alert(error.message || "Failed to delete group");
    } finally {
      setIsDeletingGroup(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Profile */}
        <div className="flex flex-col items-center gap-3 pt-2 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full text-[22px] font-semibold text-white" style={{ background: activeConversation.color }}>
            {activeConversation.initials}
          </span>

          {isGroup && isEditingName ? (
            <div className="flex w-full items-center gap-1.5">
              <input
                autoFocus
                value={nameDraft}
                disabled={savingName}
                onChange={(event) => setNameDraft(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && saveName()}
                className="w-full rounded-lg border border-[#E4E0D6] px-2.5 py-1.5 text-center text-[15px] font-semibold text-[#1E2328] outline-none focus:border-[#fd7e13] disabled:opacity-60"
              />
              <button
                type="button"
                onClick={saveName}
                disabled={savingName}
                className="shrink-0 rounded-lg bg-[#fd7e13] px-2.5 py-1.5 text-[12px] font-medium text-white hover:bg-[#e96f08] disabled:opacity-60"
              >
                {savingName ? "Saving…" : "Save"}
              </button>
            </div>
          ) : isGroup ? (
            <button
              type="button"
              onClick={() => { setNameDraft(activeConversation.name); setIsEditingName(true); }}
              className="group flex items-center gap-1.5 text-[16px] font-semibold text-[#1E2328]"
            >
              {activeConversation.name}
              <Pencil size={13} className="text-[#9AA0A6] group-hover:text-[#fd7e13]" />
            </button>
          ) : (
            <p className="text-[16px] font-semibold text-[#1E2328]">{activeConversation.name}</p>
          )}

          {isGroup && (
            <p className="text-[11.5px] text-[#6B7178]">{groupMembers.length} member{groupMembers.length === 1 ? "" : "s"}</p>
          )}
        </div>

        {/* Description */}
        {isGroup && (
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#9AA0A6]">Description</p>
            {isEditingDescription ? (
              <div className="flex flex-col gap-1.5">
                <textarea
                  autoFocus
                  rows={3}
                  value={descriptionDraft}
                  disabled={savingDescription}
                  onChange={(event) => setDescriptionDraft(event.target.value)}
                  placeholder="Add group description"
                  className="w-full resize-none rounded-lg border border-[#E4E0D6] px-2.5 py-2 text-[12.5px] text-[#1E2328] outline-none placeholder:text-[#9AA0A6] focus:border-[#fd7e13] disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={saveDescription}
                  disabled={savingDescription}
                  className="self-end rounded-lg bg-[#fd7e13] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#e96f08] disabled:opacity-60"
                >
                  {savingDescription ? "Saving…" : "Save"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setDescriptionDraft(groupDescription); setIsEditingDescription(true); }}
                className="w-full rounded-lg px-2.5 py-2 text-left text-[12.5px] hover:bg-white"
              >
                {groupDescription ? (
                  <span className="text-[#1E2328]">{groupDescription}</span>
                ) : (
                  <span className="text-[#9AA0A6]">Add group description</span>
                )}
              </button>
            )}
          </div>
        )}

        {groupInfoError && (
          <p className="-mt-2 rounded-lg bg-[#FFF1F0] px-2.5 py-2 text-[11.5px] text-[#D14343]">{groupInfoError}</p>
        )}

        {/* Notifications & Media Visibility */}
        <div className="flex flex-col gap-1 border-t border-[#EDEAE2] pt-4">
          <div className="flex items-center justify-between rounded-lg px-1 py-1.5">
            <span className="flex items-center gap-2.5 text-[13px] text-[#1E2328]">
              {isMuted ? <BellOff size={16} className="text-[#6B7178]" /> : <Bell size={16} className="text-[#6B7178]" />}
              Notifications
            </span>
            <Toggle checked={!isMuted} onChange={() => toggleMuteConversation(activeConversation.id)} label="Toggle notifications" />
          </div>
          <div className="flex items-center justify-between rounded-lg px-1 py-1.5">
            <span className="flex items-center gap-2.5 text-[13px] text-[#1E2328]">
              <ImageIcon size={16} className="text-[#6B7178]" />
              Media visibility
            </span>
            <Toggle checked={isMediaVisible} onChange={() => toggleMediaVisibility(activeConversation.id)} label="Toggle media visibility" />
          </div>
        </div>

        {/* Members */}
        {isGroup && (
          <div className="border-t border-[#EDEAE2] pt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#9AA0A6]">
                <Users size={13} />{groupMembers.length} member{groupMembers.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              {groupMembers.map((member) => (
                <MemberRow
                  key={member.id}
                  chat={chat}
                  member={member}
                  isOpen={openMemberRowId === member.id}
                  onToggle={() => setOpenMemberRowId((current) => (current === member.id ? null : member.id))}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={openMemberDialog}
              className="mt-2 flex items-center gap-2 rounded-[9px] px-1.5 py-2 text-left text-[13px] font-medium text-[#fd7e13] hover:bg-[#FFF0E5]"
            >
              <UserPlus size={17} />Add members
            </button>
          </div>
        )}

        {/* Danger zone */}
        <div className="flex flex-col gap-1 border-t border-[#EDEAE2] pt-4">
          {/* Super Admin permanent clear with date-range picker */}
          {/* In GroupInfoPanel.jsx danger zone */}
          {isSuperAdmin || (isGroup && isGroupAdmin) ? (
            <button
              type="button"
              onClick={openClearChatDialog}
              className="flex items-center gap-2.5 rounded-lg px-1.5 py-2 text-left text-[13px] font-medium text-[#D14343] hover:bg-[#FFF1F0]"
            >
              <Eraser size={16} className="text-[#D14343]" />
              Clear Messages
            </button>
          ) : (
            <button
              type="button"
              onClick={cleanChat}
              className="flex items-center gap-2.5 rounded-lg px-1.5 py-2 text-left text-[13px] font-medium text-[#1E2328] hover:bg-white"
            >
              <Trash2 size={16} className="text-[#6B7178]" />
              Clean chat
            </button>
          )}

          {isGroup && (
            <button
              type="button"
              onClick={() => setExitGroupDialogOpen(true)}
              className="flex items-center gap-2.5 rounded-lg px-1.5 py-2 text-left text-[13px] font-medium text-[#D14343] hover:bg-[#FFF1F0]"
            >
              <LogOut size={16} />Exit Group
            </button>
          )}

          {isGroup && canDeleteGroup && (
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-2.5 rounded-lg px-1.5 py-2 text-left text-[13px] font-medium text-[#D14343] hover:bg-[#FFF1F0]"
            >
              <Trash2 size={16} />
              Delete Group
            </button>
          )}
        </div>
      </div>

      {/* Modern Custom Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm overflow-hidden rounded-[20px] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF1F0] text-[#D14343]">
                <AlertTriangle size={24} />
              </div>

              <h3 className="mt-3.5 text-[16px] font-semibold text-[#1E2328]">
                Delete Group?
              </h3>

              <p className="mt-1.5 text-[13px] leading-relaxed text-[#6B7178]">
                Are you sure you want to delete <span className="font-semibold text-[#1E2328]">"{activeConversation.name}"</span>? All messages and attachments will be removed permanently.
              </p>

              <div className="mt-6 flex w-full gap-2.5">
                <button
                  type="button"
                  disabled={isDeletingGroup}
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 rounded-[10px] border border-[#E4E0D6] bg-white py-2.5 text-[13px] font-medium text-[#1E2328] hover:bg-[#F8F7F5] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingGroup}
                  onClick={confirmDelete}
                  className="flex-1 rounded-[10px] bg-[#D14343] py-2.5 text-[13px] font-medium text-white hover:bg-[#bc3636] disabled:opacity-50"
                >
                  {isDeletingGroup ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}