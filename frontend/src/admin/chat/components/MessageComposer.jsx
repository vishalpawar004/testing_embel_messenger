import { useEffect, useMemo, useRef, useState } from "react";
import {
  Baseline, Bold, Italic, Link as LinkIcon, List, Link2,
  Paperclip, SendHorizontal, Strikethrough, Underline, X,
  FileText, Image as ImageIcon, Folder, Upload, Plus, Smile,
} from "lucide-react";
import ProjectFileDialog from "./dialogs/ProjectFileDialog";
import "./rich-text.css";

const MENTION_PATTERN = /(?:^|\s)@([a-zA-Z0-9._-]*)$/;
const TEXT_COLORS = ["#1E2328", "#D14343", "#3A5CFF", "#1E9E5A", "#F4B400", "#9AA0A6"];

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function MessageComposer({ chat }) {
  const {
    attachment,
    setAttachment,
    attachments = [],
    setAttachments,
    draft,
    setDraft,
    sendMessage,
    groupMembers,
    replyingTo,
    cancelReply,
    sendProjectFiles,
  } = chat;

  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [formattingOpen, setFormattingOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounterRef = useRef(0);

  const documentInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const addMoreInputRef = useRef(null);

  // Normalized attachments list
  const fileList = attachments.length > 0 ? attachments : (attachment ? [attachment] : []);
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);

  useEffect(() => {
    if (activePreviewIdx >= fileList.length) {
      setActivePreviewIdx(Math.max(0, fileList.length - 1));
    }
  }, [fileList.length, activePreviewIdx]);

  useEffect(() => {
    if (draft === "" && editorRef.current && editorRef.current.innerHTML !== "") {
      editorRef.current.innerHTML = "";
    }
  }, [draft]);

  // Multiple files append logic
  const appendFiles = (files) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files);
    if (setAttachments) {
      setAttachments((prev) => {
        const existingNames = new Set(prev.map((f) => f.name));
        const filteredNew = incoming.filter((f) => !existingNames.has(f.name));
        return [...prev, ...filteredNew];
      });
    } else if (setAttachment) {
      setAttachment(incoming[0]);
    }
  };

  // =========================================================
  // WHATSAPP-STYLE DRAG & DROP HANDLERS
  // =========================================================
  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current += 1;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDraggingOver(true);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDraggingOver(false);
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDraggingOver(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        appendFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null || !groupMembers?.length) return [];
    const query = mentionQuery.toLowerCase();
    return groupMembers.filter((member) => member.name.toLowerCase().includes(query));
  }, [mentionQuery, groupMembers]);

  const showMentionMenu = mentionQuery !== null && mentionMatches.length > 0;

  const detectMention = () => {
    if (!groupMembers?.length) { setMentionQuery(null); return; }
    const selection = window.getSelection();
    const node = selection?.rangeCount ? selection.getRangeAt(0).startContainer : null;
    if (!node || node.nodeType !== Node.TEXT_NODE) { setMentionQuery(null); return; }
    const textBeforeCaret = node.textContent.slice(0, selection.getRangeAt(0).startOffset);
    const match = textBeforeCaret.match(MENTION_PATTERN);
    setMentionQuery(match ? match[1] : null);
  };

  const handleInput = () => {
    const el = editorRef.current;
    if (!el) return;
    if (el.textContent.trim() === "") el.innerHTML = "";
    setDraft(el.innerHTML);
    detectMention();
  };

  const clearEditor = () => {
    if (editorRef.current) editorRef.current.innerHTML = "";
    setDraft("");
    setMentionQuery(null);
  };

  const handleSend = () => {
    sendMessage();
    clearEditor();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setMentionQuery(null);
      setColorPickerOpen(false);
      setLinkPickerOpen(false);
      setAttachMenuOpen(false);
      return;
    }
    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      document.execCommand("insertLineBreak");
      handleInput();
      return;
    }
    if (event.key === "Enter" && !showMentionMenu) {
      event.preventDefault();
      handleSend();
    }
  };

  const insertMention = (member) => {
    const el = editorRef.current;
    const selection = window.getSelection();
    if (el) el.focus();
    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0);
      const node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        const textBeforeCaret = node.textContent.slice(0, range.startOffset);
        const queryStart = textBeforeCaret.lastIndexOf("@");
        if (queryStart !== -1) {
          const replaceRange = document.createRange();
          replaceRange.setStart(node, queryStart);
          replaceRange.setEnd(node, range.startOffset);
          selection.removeAllRanges();
          selection.addRange(replaceRange);
        }
      }
    }
    document.execCommand("insertHTML", false, `<span class="mention" contenteditable="false">@${member.name}</span>&nbsp;`);
    setMentionQuery(null);
    handleInput();
  };

  const execFormat = (command, value) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  };

  const rememberSelection = () => {
    const selection = window.getSelection();
    savedRangeRef.current = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
  };

  const restoreSelection = () => {
    editorRef.current?.focus();
    if (savedRangeRef.current) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }
  };

  const openColorPicker = () => {
    rememberSelection();
    setLinkPickerOpen(false);
    setColorPickerOpen((open) => !open);
  };

  const applyColor = (color) => {
    restoreSelection();
    document.execCommand("foreColor", false, color);
    handleInput();
    setColorPickerOpen(false);
  };

  const openLinkPicker = () => {
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    savedRangeRef.current = range ? range.cloneRange() : null;
    setLinkText(range && !range.collapsed ? range.toString() : "");
    setLinkUrl("");
    setColorPickerOpen(false);
    setLinkPickerOpen((open) => !open);
  };

  const applyLink = () => {
    if (!linkUrl.trim()) return;
    restoreSelection();
    const displayText = linkText.trim() || linkUrl.trim();
    const href = /^https?:\/\//i.test(linkUrl.trim()) ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    document.execCommand("insertHTML", false, `<a href="${href}" target="_blank" rel="noreferrer">${escapeHtml(displayText)}</a>&nbsp;`);
    handleInput();
    setLinkPickerOpen(false);
    setLinkText("");
    setLinkUrl("");
  };

  const handleDocumentSelect = (e) => {
    appendFiles(e.target.files);
    e.target.value = "";
    setAttachMenuOpen(false);
  };

  const handleImageSelect = (e) => {
    appendFiles(e.target.files);
    e.target.value = "";
    setAttachMenuOpen(false);
  };

  const handleRemoveAttachment = (idxToRemove) => {
    if (setAttachments) {
      setAttachments((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    } else if (setAttachment) {
      setAttachment(null);
    }
  };

  const FORMAT_BUTTONS = [
    { icon: Bold, title: "Bold", onClick: () => execFormat("bold") },
    { icon: Italic, title: "Italic", onClick: () => execFormat("italic") },
    { icon: Underline, title: "Underline", onClick: () => execFormat("underline") },
    { icon: Strikethrough, title: "Strikethrough", onClick: () => execFormat("strikeThrough") },
  ];

  return (
    <form className="relative border-t border-[#EDEAE2] p-4" onSubmit={(event) => { event.preventDefault(); handleSend(); }}>
      {/* Hidden File Inputs */}
      <input
        ref={documentInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleDocumentSelect}
      />
      <input
        ref={imageInputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*"
        onChange={handleImageSelect}
      />
      <input
        ref={addMoreInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          appendFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* ============================================================== */}
      {/* WHATSAPP-STYLE DRAG-OVERLAY LOCATION BANNER */}
      {/* ============================================================== */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none animate-in fade-in duration-150">
          <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-[#fd7e13] bg-white/95 px-12 py-10 shadow-2xl">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF0E5] text-[#fd7e13] animate-bounce">
              <Upload size={38} />
            </div>
            <div className="text-center">
              <h3 className="text-[19px] font-bold text-[#1E2328]">
                Drop files here
              </h3>
              <p className="mt-1 text-[13px] text-[#6B7178]">
                Release to add images, documents, code, or archives to your chat
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="relative mx-auto w-full max-w-3xl">
        {/* Multi-Attachment Preview Tray */}
        {fileList.length > 0 && (
          <div className="mb-3 flex flex-col items-center rounded-[18px] border border-[#EDEAE2] bg-[#FAF9F6] p-4 shadow-sm animate-in fade-in zoom-in-95 duration-200">
            {/* Main Active Preview */}
            <div className="relative mb-3 flex h-64 w-full items-center justify-center overflow-hidden rounded-[14px] bg-white border border-[#EDEAE2]">
              {fileList[activePreviewIdx]?.type?.startsWith("image/") || /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(fileList[activePreviewIdx]?.name || "") ? (
                <img
                  src={URL.createObjectURL(fileList[activePreviewIdx])}
                  alt={fileList[activePreviewIdx]?.name}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 p-4 text-center text-[#6B7178]">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF0E5] text-[#fd7e13]">
                    <FileText size={34} />
                  </div>
                  <span className="max-w-[280px] truncate text-[14px] font-semibold text-[#1E2328]">
                    {fileList[activePreviewIdx]?.name}
                  </span>
                  <span className="rounded-full bg-[#F1F0EC] px-2.5 py-0.5 text-[10.5px] font-bold text-[#6B7178] uppercase">
                    {fileList[activePreviewIdx]?.name?.includes(".")
                      ? fileList[activePreviewIdx]?.name.split(".").pop().toUpperCase()
                      : "FILE"}
                  </span>
                </div>
              )}

              {/* Remove active item button */}
              <button
                type="button"
                onClick={() => handleRemoveAttachment(activePreviewIdx)}
                className="absolute right-3 top-3 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
                title="Remove file"
              >
                <X size={15} />
              </button>
            </div>

            {/* Bottom Carousel Thumbnail Strip with "+" Add More Button */}
            <div className="flex w-full items-center justify-center gap-2 overflow-x-auto py-1">
              {fileList.map((file, idx) => {
                const isImg = file.type?.startsWith("image/") || /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(file.name || "");
                const isActive = activePreviewIdx === idx;
                return (
                  <button
                    key={`${file.name}-${idx}`}
                    type="button"
                    onClick={() => setActivePreviewIdx(idx)}
                    className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] border-2 transition-all ${
                      isActive
                        ? "border-[#fd7e13] shadow-md scale-105"
                        : "border-[#E4E0D6] opacity-70 hover:opacity-100"
                    } bg-white flex items-center justify-center`}
                  >
                    {isImg ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        <FileText size={18} className="text-[#fd7e13]" />
                        <span className="text-[8.5px] font-bold text-[#6B7178] uppercase">
                          {file.name.includes(".") ? file.name.split(".").pop().slice(0, 4) : "DOC"}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}

              {/* "+" Add more files button */}
              <button
                type="button"
                onClick={() => addMoreInputRef.current?.click()}
                title="Add more files"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] border border-dashed border-[#C9CDD2] bg-white text-[#6B7178] hover:border-[#fd7e13] hover:bg-[#FFF0E5] hover:text-[#fd7e13] transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Mention Dropdown */}
        {showMentionMenu && (
          <div className="absolute bottom-[calc(100%+8px)] left-0 z-30 max-h-56 w-64 overflow-y-auto rounded-[12px] border border-[#E4E0D6] bg-white py-1.5 shadow-[0_10px_24px_rgba(30,35,40,0.16)]">
            <p className="px-3 pb-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#9AA0A6]">Mention someone</p>
            {mentionMatches.map((member) => (
              <button
                key={member.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => insertMention(member)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-[#FFF0E5]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white" style={{ background: member.color }}>{member.initials}</span>
                <span className="truncate text-[13px] text-[#1E2328]">{member.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Link Picker */}
        {linkPickerOpen && (
          <>
            <button type="button" aria-label="Close link picker" onMouseDown={(event) => event.preventDefault()} onClick={() => setLinkPickerOpen(false)} className="fixed inset-0 z-20 cursor-default" />
            <div className="absolute bottom-[calc(100%+8px)] left-0 z-30 w-72 rounded-[14px] border border-[#E4E0D6] bg-white p-3 shadow-[0_10px_24px_rgba(30,35,40,0.16)]">
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#E4E0D6] px-3 py-2 focus-within:border-[#fd7e13]">
                <span className="text-[13px] text-[#9AA0A6]">≡</span>
                <input
                  value={linkText}
                  onChange={(event) => setLinkText(event.target.value)}
                  placeholder="Text"
                  autoFocus
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-[#1E2328] outline-none placeholder:text-[#9AA0A6]"
                />
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#E4E0D6] px-3 py-2 focus-within:border-[#fd7e13]">
                <Link2 size={14} className="shrink-0 text-[#9AA0A6]" />
                <input
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); applyLink(); } }}
                  placeholder="Type or paste a link"
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-[#1E2328] outline-none placeholder:text-[#9AA0A6]"
                />
                <button
                  type="button"
                  onClick={applyLink}
                  disabled={!linkUrl.trim()}
                  className="shrink-0 text-[12.5px] font-medium text-[#fd7e13] enabled:hover:text-[#e96f08] disabled:cursor-not-allowed disabled:text-[#9AA0A6]"
                >
                  Apply
                </button>
              </div>
            </div>
          </>
        )}

        {/* Input Bar Container */}
        <div className="rounded-[10px] border border-[#E4E0D6] bg-[#F8F7F5] focus-within:border-[#fd7e13]">
          {/* Reply Banner */}
          {replyingTo && (
            <div className="flex items-center justify-between gap-2 rounded-t-[9px] border-b border-[#E4E0D6] bg-white px-3 py-2">
              <div className="min-w-0 flex-1 border-l-[3px] border-[#fd7e13] pl-2.5">
                <p className="text-[11px] font-semibold text-[#fd7e13]">
                  Replying to {replyingTo.mine ? "yourself" : replyingTo.sender}
                </p>
                <p className="line-clamp-1 text-[12px] text-[#6B7178]">
                  {replyingTo.type === "file"
                    ? "📎 " + (replyingTo.caption || "Shared file")
                    : (replyingTo.text || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()}
                </p>
              </div>
              <button
                type="button"
                onClick={cancelReply}
                className="shrink-0 rounded-full p-1 text-[#6B7178] hover:bg-[#F1F0EC]"
                aria-label="Cancel reply"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Formatting Toolbar */}
          {formattingOpen && (
            <div className="flex items-center gap-0.5 rounded-t-[9px] border-b border-[#E4E0D6] bg-[#EEF2FF] px-2 py-1.5">
              {FORMAT_BUTTONS.map(({ icon: Icon, title, onClick }) => (
                <button
                  key={title}
                  type="button"
                  title={title}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={onClick}
                  className="rounded-md p-1.5 text-[#3A3F52] hover:bg-white"
                >
                  <Icon size={15} />
                </button>
              ))}

              <div className="relative">
                <button
                  type="button"
                  title="Text color"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={openColorPicker}
                  className={`rounded-md p-1.5 hover:bg-white ${colorPickerOpen ? "bg-white text-[#fd7e13]" : "text-[#3A3F52]"}`}
                >
                  <Baseline size={15} />
                </button>
                {colorPickerOpen && (
                  <>
                    <button type="button" aria-label="Close color picker" onMouseDown={(event) => event.preventDefault()} onClick={() => setColorPickerOpen(false)} className="fixed inset-0 z-20 cursor-default" />
                    <div className="absolute left-0 top-[calc(100%+6px)] z-30 flex items-center gap-1.5 rounded-full border border-[#E4E0D6] bg-white px-2.5 py-2 shadow-[0_10px_24px_rgba(30,35,40,0.16)]">
                      {TEXT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          title={color}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => applyColor(color)}
                          className="h-5 w-5 shrink-0 rounded-full ring-1 ring-inset ring-black/5"
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <span className="mx-1 h-4 w-px bg-[#D5D9EE]" />

              <button
                type="button"
                title="Bulleted list"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => execFormat("insertUnorderedList")}
                className="rounded-md p-1.5 text-[#3A3F52] hover:bg-white"
              >
                <List size={15} />
              </button>

              <button
                type="button"
                title="Link"
                onMouseDown={(event) => event.preventDefault()}
                onClick={openLinkPicker}
                className={`rounded-md p-1.5 hover:bg-white ${linkPickerOpen ? "bg-white text-[#fd7e13]" : "text-[#3A3F52]"}`}
              >
                <LinkIcon size={15} />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2 p-1.5">
            {/* Attachment Button + Dropdown Popover */}
            <div className="relative shrink-0">
              <button
                type="button"
                title="Attach"
                onClick={(e) => {
                  e.stopPropagation();
                  setAttachMenuOpen((open) => !open);
                }}
                className={`rounded-[7px] p-2 transition-colors ${
                  attachMenuOpen ? "bg-white text-[#fd7e13]" : "text-[#6B7178] hover:bg-white hover:text-[#fd7e13]"
                }`}
              >
                <Paperclip size={18} />
              </button>

              {/* Popover Menu: Document, Image, Project File */}
              {attachMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAttachMenuOpen(false);
                    }}
                  />
                  <div className="absolute bottom-[calc(100%+10px)] left-0 z-50 w-44 rounded-[12px] border border-[#E4E0D6] bg-white py-1.5 shadow-[0_12px_28px_rgba(30,35,40,0.18)]">
                    <button
                      type="button"
                      onClick={() => {
                        setAttachMenuOpen(false);
                        documentInputRef.current?.click();
                      }}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-[#1E2328] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
                    >
                      <FileText size={16} className="text-[#D86A33]" />
                      Document / Code
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAttachMenuOpen(false);
                        imageInputRef.current?.click();
                      }}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-[#1E2328] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
                    >
                      <ImageIcon size={16} className="text-[#3A5CFF]" />
                      Image
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAttachMenuOpen(false);
                        setProjectDialogOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-[#1E2328] hover:bg-[#FFF0E5] hover:text-[#fd7e13]"
                    >
                      <Folder size={16} className="text-[#168A72]" />
                      Project File
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* ContentEditable Text Input */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              data-placeholder={
                fileList.length > 0
                  ? "Add a caption..."
                  : groupMembers?.length
                  ? "Write a message… (@ to mention someone)"
                  : "Write a message…"
              }
              className="rich-text min-w-0 flex-1 max-h-[120px] overflow-y-auto whitespace-pre-wrap break-words px-1 py-1.5 text-[13px] leading-relaxed text-[#1E2328] outline-none"
            />

            <button
              type="button"
              title={formattingOpen ? "Hide formatting" : "Formatting"}
              onClick={() => setFormattingOpen((open) => !open)}
              className={`shrink-0 rounded-[7px] p-2 ${formattingOpen ? "bg-[#EEF2FF] text-[#3A5CFF]" : "text-[#6B7178] hover:bg-white hover:text-[#fd7e13]"}`}
            >
              <Baseline size={18} />
            </button>

            {/* Orange Circular Send Button with File Badge Count */}
            <div className="relative shrink-0">
              <button
                type="submit"
                title="Send message"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fd7e13] text-white transition-transform active:scale-95 hover:bg-[#e96f08] shadow-sm"
              >
                <SendHorizontal size={17} />
              </button>
              {fileList.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-[#fd7e13] shadow ring-1 ring-[#fd7e13]/20">
                  {fileList.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

   
{/* Project File Upload Modal */}
      <ProjectFileDialog
        isOpen={projectDialogOpen}
        onClose={() => setProjectDialogOpen(false)}
        onAttach={async (data) => {
          if (sendProjectFiles) {
            await sendProjectFiles(data);
          }
        }}
      />
    </form>
  );
}