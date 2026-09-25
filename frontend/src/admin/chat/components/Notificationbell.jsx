import { Bell, CheckCheck, MessageCircle, UsersRound } from "lucide-react";

function formatNotificationTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function NotificationBell({ chat }) {
  const {
    notifications, notificationsLoading, notificationsError, unreadNotificationCount,
    notificationPanelOpen, toggleNotificationPanel, closeNotificationPanel,
    markAllNotificationsAsRead, openNotificationTarget,
  } = chat;

  return (
    <div className="relative">
      <button
        type="button"
        title="Notifications"
        onClick={toggleNotificationPanel}
        className={`relative rounded-full p-2 ${notificationPanelOpen ? "bg-[#FFF0E5] text-[#fd7e13]" : "text-[#6B7178] hover:bg-[#F1F0EC] hover:text-[#1E2328]"}`}
      >
        <Bell size={18} />
        {unreadNotificationCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#fd7e13] px-1 text-[9px] font-semibold text-white">
            {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
          </span>
        )}
      </button>

      {notificationPanelOpen && (
        <>
          <button type="button" aria-label="Close notifications" onClick={closeNotificationPanel} className="fixed inset-0 z-30 cursor-default" />
          <div className="absolute right-0 top-[calc(100%+8px)] z-40 flex max-h-[420px] w-80 flex-col overflow-hidden rounded-[14px] border border-[#E4E0D6] bg-white shadow-[0_14px_32px_rgba(30,35,40,0.18)]">
            <div className="flex items-center justify-between border-b border-[#EDEAE2] px-4 py-3">
              <h3 className="text-[14px] font-semibold text-[#1E2328]">Notifications</h3>
              {notifications.some((n) => !n.read) && (
                <button
                  type="button"
                  onClick={markAllNotificationsAsRead}
                  className="flex items-center gap-1 text-[11.5px] font-medium text-[#fd7e13] hover:underline"
                >
                  <CheckCheck size={13} />Mark all read
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {notificationsLoading && <p className="px-4 py-6 text-center text-[13px] text-[#9AA0A6]">Loading…</p>}
              {!notificationsLoading && notificationsError && <p className="px-4 py-6 text-center text-[13px] text-[#D14343]">{notificationsError}</p>}
              {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <Bell size={28} strokeWidth={1.5} className="text-[#C9CDD2]" />
                  <p className="text-[13px] text-[#9AA0A6]">You're all caught up.</p>
                </div>
              )}
              {!notificationsLoading && !notificationsError && notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => openNotificationTarget(notification)}
                  className={`flex w-full items-start gap-3 border-b border-[#F1F0EC] px-4 py-3 text-left hover:bg-[#F8F7F5] ${!notification.read ? "bg-[#FFF8F1]" : ""}`}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF0E5] text-[#fd7e13]">
                    {notification.relatedGroupId ? <UsersRound size={15} /> : <MessageCircle size={15} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-semibold text-[#1E2328]">{notification.title}</span>
                      {!notification.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#fd7e13]" />}
                    </span>
                    <span className="line-clamp-2 text-[12px] text-[#6B7178]">{notification.body}</span>
                    <span className="mt-0.5 block text-[10.5px] text-[#9AA0A6]">{formatNotificationTime(notification.createdAt)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}