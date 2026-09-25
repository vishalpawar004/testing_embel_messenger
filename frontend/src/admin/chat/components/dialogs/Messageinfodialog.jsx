import { X } from "lucide-react";

export default function MessageInfoDialog({ chat }) {
  const { messageInfo, setMessageInfo } = chat;

  if (!messageInfo) return null;
  const rawText =
    messageInfo.text ??
    messageInfo.content ??
    messageInfo.caption ??
    "";

  const summary =
    messageInfo.type === "file"
      ? messageInfo.caption || "Shared a file"
      : String(rawText)
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim() || "No message content";
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1E2328]/35 p-4" role="presentation" onMouseDown={() => setMessageInfo(null)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="message-info-title"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_18px_50px_rgba(30,35,40,0.24)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="message-info-title" className="text-[17px] font-semibold text-[#1E2328]">Message info</h2>
          <button type="button" onClick={() => setMessageInfo(null)} className="rounded-full p-1.5 text-[#6B7178] hover:bg-[#F1F0EC]" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 rounded-[10px] border border-[#EDEAE2] bg-[#F8F7F5] px-3.5 py-3">
          <p className="break-words text-[13px] leading-5 text-[#1E2328]">
            {summary}
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-2.5 text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-[#6B7178]">From</span>
            <span className="font-medium text-[#1E2328]">{messageInfo.mine ? "You" : messageInfo.sender}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#6B7178]">Sent</span>
            <span className="font-medium text-[#1E2328]">{messageInfo.time}</span>
          </div>
          {messageInfo.mine && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7178]">Delivered</span>
                <span className="font-medium text-[#1E2328]">{messageInfo.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7178]">Read</span>
                <span className="font-medium text-[#1E2328]">{messageInfo.time}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}