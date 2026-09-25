export default function DeleteMessageDialog({ chat }) {
  const { messageToDelete, setMessageToDelete, deleteMessage } = chat;

  if (!messageToDelete) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1E2328]/35 p-4" role="presentation" onMouseDown={() => setMessageToDelete(null)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-message-title"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_18px_50px_rgba(30,35,40,0.24)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="delete-message-title" className="text-[17px] font-semibold text-[#1E2328]">Delete this message?</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[#6B7178]">This message will be permanently removed from the conversation.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setMessageToDelete(null)} className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-[#5C6570] hover:bg-[#F1F0EC]">Cancel</button>
          <button type="button" onClick={deleteMessage} className="rounded-lg bg-[#D14343] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#B82F2F]">Delete message</button>
        </div>
      </div>
    </div>
  );
}
