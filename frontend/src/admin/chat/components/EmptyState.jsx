import { AtSign, Star, UsersRound } from "lucide-react";

const COPY = {
  mentions: {
    icon: AtSign,
    title: "You don't have any mentions",
    body: "When someone mentions you in a conversation, it will appear here.",
  },
  starred: {
    icon: Star,
    title: "You don't have any starred chats",
    body: "Star important conversations to find them quickly here.",
  },
  groups: {
    icon: UsersRound,
    title: "You don't have any groups",
    body: "Create a group to start collaborating with your admin team.",
  },
};

export default function EmptyState({ shortcut }) {
  const { icon: Icon, title, body } = COPY[shortcut] || COPY.groups;

  return (
    <div className="col-start-2 col-span-2 flex flex-col items-center justify-center bg-white px-6 text-center">
      <div className="mb-6 flex h-28 w-28 animate-[bounce_2.5s_ease-in-out_infinite] items-center justify-center rounded-full bg-[#FFF0E5] text-[#fd7e13] shadow-[0_8px_20px_rgba(253,126,19,0.12)]">
        <Icon size={52} strokeWidth={1.5} />
      </div>
      <h2 className="text-[22px] font-semibold text-[#1E2328]">{title}</h2>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-[#6B7178]">{body}</p>
      {shortcut === "groups" && (
        <button type="button" className="mt-5 rounded-[8px] bg-[#fd7e13] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#e96f08]">
          Create group
        </button>
      )}
    </div>
  );
}
