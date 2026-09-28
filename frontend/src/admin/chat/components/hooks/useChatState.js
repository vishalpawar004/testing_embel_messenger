// src/components/hooks/useChatState.js

import { useEffect, useRef, useState } from "react";
import {
  conversations as initialConversations,
  initialSpaceMembers,
  frequentContacts,
  youMember,
  statusOptions,
} from "../../data";
import {
  getChats,
  createGroup as createGroupRequest,
  getCurrentUser,
  getAllGroups,
  getGroupMembers as getGroupMembersRequest,
  addGroupMember as addGroupMemberRequest,
  removeGroupMember as removeGroupMemberRequest,
  adminRemoveGroupMember as adminRemoveGroupMemberRequest,
  searchUsers as searchUsersRequest,
  updateGroup as updateGroupRequest,
  adminUpdateGroup as adminUpdateGroupRequest,
  leaveGroup as leaveGroupRequest,
  sendMessage as sendMessageRequest,
  getMessages as getMessagesRequest,
  pinMessage as pinMessageRequest,
  starMessage as starMessageRequest,
  deleteMessage as deleteMessageRequest,
  updateMessage as updateMessageRequest,
  startChat as startChatRequest,
  forwardMessage as forwardMessageRequest,
  uploadMultipleAttachments,
  uploadAttachment,
  uploadProjectFiles,
  getProjects as getProjectsRequest,
  getProjectById as getProjectByIdRequest,
  adminAddGroupMember as adminAddGroupMemberRequest,
  resolveFileUrl,
  deleteGroup as deleteGroupRequest,
  adminDeleteGroup as adminDeleteGroupRequest,
  promoteGroupMember as promoteGroupMemberRequest,
  demoteGroupMember as demoteGroupMemberRequest,
  adminPromoteGroupMember as adminPromoteGroupMemberRequest,
  adminDemoteGroupMember as adminDemoteGroupMemberRequest,
  getNotifications as getNotificationsRequest,
  getUnreadNotificationCount as getUnreadNotificationCountRequest,
  markNotificationRead as markNotificationReadRequest,
  markAllNotificationsRead as markAllNotificationsReadRequest,
  markChatAsRead as markChatAsReadRequest,
  adminClearChatMessages,
  groupAdminClearMessages,
  clearDirectChatMessages,
  adminBulkClearChatMessages,
  reactToMessage as reactToMessageRequest,
} from "../../../../services/authService";

const GROUP_COLORS = ["#7C5CFC", "#168A72", "#D86A33", "#3A5CFF", "#B05C9E", "#1E9E5A", "#C1443A"];

function initialsFromName(name) {
  return (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("") || "?";
}

function colorForSenderId(senderId) {
  if (senderId === undefined || senderId === null) return GROUP_COLORS[0];
  return GROUP_COLORS[Math.abs(Number(senderId) || 0) % GROUP_COLORS.length];
}

function formatMessageTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function isDocOrCode(fileName = "") {
  return /\.(docx?|pdf|xlsx?|pptx?|txt|csv|zip|rar|7z|tar|gz|json|xml|java|class|jar|py|js|jsx|ts|tsx|c|cpp|sql|html|css|php|rb|go|rs|env|log|md)$/i.test(
    fileName
  );
}

function isPureImage(fileName = "", url = "") {
  if (isDocOrCode(fileName)) return false;
  return /\.(jpe?g|png|gif|webp|svg|bmp|ico)$/i.test(fileName) || /\.(jpe?g|png|gif|webp|svg|bmp|ico)$/i.test(url);
}

function formatForDateTimeInput(dateInput) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function formatToBackendDateTime(dateInput, isEnd = false) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return "";

  if (isEnd) {
    if (d.getSeconds() === 0) d.setSeconds(59);
    d.setMilliseconds(999);
  }

  const pad = (n, len = 2) => String(n).padStart(len, "0");
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  const SSS = pad(d.getMilliseconds(), 3);

  return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}.${SSS}`;
}

function mapApiMessages(apiMessages, currentUserId) {
  return apiMessages.map((message) => {
    const type = String(message.type || "").toUpperCase();
    const content = message.content || "";
    const isDeleted =
      message.deleted === true ||
      String(message.status || "").toUpperCase() === "DELETED" ||
      content.trim().toLowerCase() === "this message was deleted" ||
      String(message.caption || "").trim().toLowerCase() === "this message was deleted";

    if (isDeleted) {
      return {
        id: message.id,
        sender: message.senderName || `User ${message.senderId}`,
        initials: initialsFromName(message.senderName),
        color: colorForSenderId(message.senderId),
        mine: String(message.senderId) === String(currentUserId),
        type: "deleted",
        text: "This message was deleted",
        time: formatMessageTime(message.createdAt),
        createdAt: message.createdAt,
        status: "deleted",
        reactions: Array.isArray(message.reactions) ? message.reactions : [],
        myReaction: message.myReaction || null,
      };
    }

    if (type === "SYSTEM") {
      return {
        id: message.id,
        type: "system",
        text: content,
        time: formatMessageTime(message.createdAt),
        createdAt: message.createdAt,
      };
    }

    if (type === "TEXT") {
      return {
        id: message.id,
        sender: message.senderName || `User ${message.senderId}`,
        initials: initialsFromName(message.senderName),
        color: colorForSenderId(message.senderId),
        mine: String(message.senderId) === String(currentUserId),
        text: content,
        time: formatMessageTime(message.createdAt),
        createdAt: message.createdAt,
        status: message.status || "sent",
        reactions: Array.isArray(message.reactions) ? message.reactions : [],
        myReaction: message.myReaction || null,
        replyTo: message.replyTo
          ? {
              id: message.replyTo.id,
              sender: message.replyTo.senderName || `User ${message.replyTo.senderId}`,
              text: message.replyTo.content || "",
              type: message.replyTo.type,
              fileUrl: resolveFileUrl(message.replyTo.fileUrl),
            }
          : null,
      };
    }

    const fileUrl = resolveFileUrl(message.fileUrl || message.filePath);
    const fileName = message.attachmentName || content || (fileUrl ? fileUrl.split("/").pop() : "document");
    const isImage = (type === "IMAGE" || isPureImage(fileName, fileUrl)) && !isDocOrCode(fileName);

    return {
      id: message.id,
      sender: message.senderName || `User ${message.senderId}`,
      initials: initialsFromName(message.senderName),
      color: colorForSenderId(message.senderId),
      mine: String(message.senderId) === String(currentUserId),
      type: "file",
      isImage,
      fileUrl,
      caption: content || fileName,
      attachmentName: fileName,
      time: formatMessageTime(message.createdAt),
      createdAt: message.createdAt,
      status: message.status || "sent",
      reactions: Array.isArray(message.reactions) ? message.reactions : [],
      myReaction: message.myReaction || null,
    };
  });
}

export default function useChatState() {
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [conversationList, setConversationList] = useState([]);
  const [draft, setDraft] = useState("");

  const [clearChatDialogOpen, setClearChatDialogOpen] = useState(false);
  const [clearChatFromDate, setClearChatFromDate] = useState("");
  const [clearChatToDate, setClearChatToDate] = useState("");
  const [clearChatLoading, setClearChatLoading] = useState(false);
  const [clearChatError, setClearChatError] = useState(null);
  const [isBulkClearMode, setIsBulkClearMode] = useState(false);

  const [attachments, setAttachments] = useState([]);
  const attachment = attachments[0] || null;
  const setAttachment = (fileOrFiles) => {
    if (!fileOrFiles) {
      setAttachments([]);
    } else if (Array.isArray(fileOrFiles)) {
      setAttachments(fileOrFiles);
    } else {
      setAttachments([fileOrFiles]);
    }
  };

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeShortcut, setActiveShortcut] = useState("home");
  const [shortcutsExpanded, setShortcutsExpanded] = useState(true);
  const [directMessagesExpanded, setDirectMessagesExpanded] = useState(true);
  const [spacesExpanded, setSpacesExpanded] = useState(true);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [status, setStatus] = useState("Active");
  const [boardView, setBoardView] = useState(null);
  const [boardPanelWidth, setBoardPanelWidth] = useState(288);
  const resizeStateRef = useRef({ startX: 0, startWidth: 288 });
  const isResizingRef = useRef(false);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const sidebarResizeStateRef = useRef({ startX: 0, startWidth: 260 });
  const isSidebarResizingRef = useRef(false);
  const [homeListWidth, setHomeListWidth] = useState(400);
  const homeListResizeStateRef = useRef({ startX: 0, startWidth: 400 });
  const isHomeListResizingRef = useRef(false);
  const [pinnedConversations, setPinnedConversations] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState({});

  const [starredMessages, setStarredMessages] = useState({});
  const starredMessageIds = starredMessages[activeConversationId] || [];

  const toggleMessageStar = async (messageId) => {
    const alreadyStarred = starredMessageIds.includes(messageId);
    const newStarredState = !alreadyStarred;

    try {
      await starMessageRequest(messageId, newStarredState);
      setStarredMessages((current) => {
        const existing = current[activeConversationId] || [];
        return {
          ...current,
          [activeConversationId]: newStarredState
            ? existing.includes(messageId)
              ? existing
              : [...existing, messageId]
            : existing.filter((id) => id !== messageId),
        };
      });

      setMessagesByConversation((current) => ({
        ...current,
        [activeConversationId]: (current[activeConversationId] || []).map((message) =>
          message.id === messageId ? { ...message, starred: newStarredState } : message
        ),
      }));
    } catch (error) {
      console.error("Star/unstar failed:", error);
    }
  };

  const [replyingTo, setReplyingTo] = useState(null);
  const startReply = (message) => setReplyingTo(message);
  const cancelReply = () => setReplyingTo(null);

  const [editingMessage, setEditingMessage] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);

  const enterSelectMode = (message) => {
    setSelectMode(true);
    setSelectedMessageIds([message.id]);
  };
  const toggleSelectMessage = (messageId) => {
    setSelectedMessageIds((current) =>
      current.includes(messageId) ? current.filter((id) => id !== messageId) : [...current, messageId]
    );
  };
  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedMessageIds([]);
  };
  const bulkDeleteSelected = () => {
    setMessagesByConversation((current) => ({
      ...current,
      [activeConversationId]: (current[activeConversationId] || []).filter(
        (message) => !selectedMessageIds.includes(message.id)
      ),
    }));
    exitSelectMode();
  };

  const [forwardMessageIds, setForwardMessageIds] = useState(null);
  const openForwardDialog = (messageIds) => setForwardMessageIds(Array.isArray(messageIds) ? messageIds : [messageIds]);
  const closeForwardDialog = () => setForwardMessageIds(null);
  const [forwardError, setForwardError] = useState(null);

  const forwardMessagesTo = async (targetConversationIds) => {
    const chatIds = Array.isArray(targetConversationIds) ? targetConversationIds : [targetConversationIds];
    if (!forwardMessageIds?.length || chatIds.length === 0) return;

    setForwardError(null);
    try {
      for (const messageId of forwardMessageIds) {
        await forwardMessageRequest(messageId, chatIds);
      }
      if (chatIds.includes(activeConversationId)) {
        await fetchMessages(activeConversationId);
      }
    } catch (error) {
      setForwardError(error.message || "Couldn't forward message.");
      return;
    }
    closeForwardDialog();
    exitSelectMode();
    openConversation(chatIds[0]);
  };

  const [expandedFileIds, setExpandedFileIds] = useState([]);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [emojiPickerMessageId, setEmojiPickerMessageId] = useState(null);
  const [messageReactions, setMessageReactions] = useState({});
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [groupNameDialogOpen, setGroupNameDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupId, setNewGroupId] = useState(null);
  const [groupOptionsOpen, setGroupOptionsOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [pendingMemberIds, setPendingMemberIds] = useState([]);
  const [groupMembersLoading, setGroupMembersLoading] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState(null);
  const [spaceMembersByConversation, setSpaceMembersByConversation] = useState(initialSpaceMembers);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [allGroups, setAllGroups] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [allGroupsLoading, setAllGroupsLoading] = useState(false);
  const [allGroupsError, setAllGroupsError] = useState(null);
  const [groupsError, setGroupsError] = useState(null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState(null);
  const [blockedMemberIds, setBlockedMemberIds] = useState({});
  const [groupDescriptions, setGroupDescriptions] = useState({});
  const [mutedConversationIds, setMutedConversationIds] = useState([]);
  const [mediaVisibility, setMediaVisibility] = useState({});
  const [exitGroupDialogOpen, setExitGroupDialogOpen] = useState(false);
  const [groupInfoError, setGroupInfoError] = useState(null);
  const [viewingMemberId, setViewingMemberId] = useState(null);
  const fileInputRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  const fetchUnreadNotificationCount = async () => {
    try {
      const count = await getUnreadNotificationCountRequest();
      setUnreadNotificationCount(count || 0);
    } catch {
      // Non-fatal
    }
  };

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const result = await getNotificationsRequest(0, 20);
      setNotifications(result?.content || []);
    } catch (error) {
      setNotificationsError(error.message || "Couldn't load notifications.");
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadNotificationCount();
    const intervalId = setInterval(fetchUnreadNotificationCount, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const toggleNotificationPanel = () => {
    setNotificationPanelOpen((open) => {
      const next = !open;
      if (next) fetchNotifications();
      return next;
    });
  };
  const closeNotificationPanel = () => setNotificationPanelOpen(false);

  const markNotificationAsRead = async (notificationId) => {
    setNotifications((current) =>
      current.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadNotificationCount((current) => Math.max(0, current - 1));
    try {
      await markNotificationReadRequest(notificationId);
    } catch {
      fetchUnreadNotificationCount();
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    setUnreadNotificationCount(0);
    try {
      await markAllNotificationsReadRequest();
    } catch {
      fetchUnreadNotificationCount();
    }
  };

  const openNotificationTarget = (notification) => {
    if (!notification.read) markNotificationAsRead(notification.id);
    const targetId = notification.relatedGroupId || notification.relatedChatId;
    if (targetId) openConversation(targetId);
    closeNotificationPanel();
  };

const getUnreadCount = (conv) => {
    if (!conv) return 0;

    // If this conversation is currently active, always return 0
    if (
      String(activeConversationId) === String(conv.id) ||
      String(activeConversationId) === String(conv.chatId) ||
      String(activeConversationId) === String(conv.groupId)
    ) {
      return 0;
    }

    const fromNotifs = notifications.filter(
      (n) =>
        !n.read &&
        (String(n.relatedChatId) === String(conv.id) ||
          String(n.relatedGroupId) === String(conv.groupId ?? conv.id) ||
          String(n.relatedChatId) === String(conv.chatId ?? conv.id) ||
          String(n.relatedUserId) === String(conv.contactId ?? conv.id))
    ).length;

    return fromNotifs > 0 ? fromNotifs : conv.unread || conv.unreadCount || 0;
  };
  const activeConversation =
    conversationList.find(({ id }) => String(id) === String(activeConversationId)) ||
    (() => {
      const g = allGroups.find(({ id }) => String(id) === String(activeConversationId));
      if (!g) return conversationList[0];
      return {
        id: g.id,
        groupId: g.id,
        type: "space",
        name: g.name,
        initials: initialsFromName(g.name),
        color: GROUP_COLORS[Math.abs(Number(g.id) || 0) % GROUP_COLORS.length],
        preview: g.description || "",
        time: "",
      };
    })();

  const messages = messagesByConversation[activeConversationId] || [];
  const isChatVisible = activeShortcut === "home" || activeShortcut === "conversation";
  const isPinned = pinnedConversations.includes(activeConversationId);
  const isDeletedMessage = (message) =>
    message.deleted === true ||
    String(message.status || "").toUpperCase() === "DELETED" ||
    message.content === "This message was deleted" ||
    message.caption === "This message was deleted";
  const sharedMedia = messages.filter((message) => message.type === "file" && !isDeletedMessage(message));
  const pinnedMessageIds = pinnedMessages[activeConversationId] || [];
  const pinnedMessageList = messages.filter((message) => pinnedMessageIds.includes(message.id));

  const groupMembers = activeConversation?.type === "space"
    ? spaceMembersByConversation[activeConversationId] || [youMember]
    : [];

  const blockedMemberIdList = blockedMemberIds[activeConversationId] || [];
  const groupDescription = groupDescriptions[activeConversationId] || "";
  const isMuted = mutedConversationIds.includes(activeConversationId);
  const isMediaVisible = mediaVisibility[activeConversationId] !== false;
  const viewingMember = groupMembers.find((member) => member.id === viewingMemberId) || null;

  const viewingMemberMessages = viewingMember
    ? messages.filter((message) => {
        if (message.type === "activity" || message.type === "invite") return false;
        return viewingMember.id === "you" ? message.mine : message.sender === viewingMember.name;
      })
    : [];
  const viewingMemberFiles = viewingMemberMessages.filter((message) => message.type === "file");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setGroupsLoading(true);
      setGroupsError(null);
      try {
        const chats = await getChats();
        if (cancelled) return;

        const mapped = chats.map((c, index) => {
          const isGroup = c.type === "GROUP";
          return {
            id: c.id,
            groupId: c.groupId ?? c.group?.id ?? c.id,
            type: isGroup ? "space" : "dm",
            name: c.name || (isGroup ? `Group ${c.id}` : "Unknown"),
            initials: initialsFromName(c.name),
            color: isGroup
              ? GROUP_COLORS[index % GROUP_COLORS.length]
              : colorForSenderId(c.id),
            preview: c.lastMessage || "",
            time: c.lastMessageAt || "",
            unread: c.unreadCount || 0,
            pinned: c.pinned || false,
            muted: c.muted || false,
          };
        });

        setConversationList(mapped);

        setMessagesByConversation((current) => {
          const next = { ...current };
          mapped.forEach((c) => {
            if (!next[c.id]) next[c.id] = [];
          });
          return next;
        });

        if (mapped.length > 0) {
          const mostRecent = [...mapped].sort((a, b) => {
            const timeA = new Date(a.time).getTime() || 0;
            const timeB = new Date(b.time).getTime() || 0;
            return timeB - timeA;
          })[0];

          setActiveConversationId((current) => current || mostRecent.id);
          const initialChatId = mostRecent.chatId ?? mostRecent.id;
          markChatAsReadRequest(initialChatId).catch(() => {});
        }

        setSpaceMembersByConversation((current) => {
          const next = { ...current };
          mapped
            .filter((c) => c.type === "space")
            .forEach((c) => {
              if (!next[c.id]) next[c.id] = [youMember];
            });
          return next;
        });

        setPinnedConversations(mapped.filter((c) => c.pinned).map((c) => c.id));
        setMutedConversationIds(mapped.filter((c) => c.muted).map((c) => c.id));
      } catch (error) {
        if (!cancelled) setGroupsError(error.message || "Couldn't load chats.");
      } finally {
        if (!cancelled) setGroupsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const syncFullscreenState = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  const fetchAllGroups = async () => {
    setAllGroupsLoading(true);
    setAllGroupsError(null);
    try {
      const groups = await getAllGroups();
      const mapped = (groups || [])
        .filter((group) => {
          const status = String(group.status || "").toUpperCase();
          return status !== "DELETED" && status !== "INACTIVE" && !group.deleted;
        })
        .map((group) => ({
          id: group.id,
          groupId: group.id,
          chatId: group.chatId ?? group.chat?.id ?? group.conversationId ?? group.id,
          name: group.name || `Group ${group.id}`,
          description: group.description || "",
          memberCount: group.memberCount ?? group.membersCount ?? 0,
          status: group.status || "ACTIVE",
          createdAt: group.createdAt,
        }));
      setAllGroups(mapped);
    } catch (error) {
      setAllGroupsError(error.message || "Couldn't load all groups.");
    } finally {
      setAllGroupsLoading(false);
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    const rawRole = String(user?.role || "").toUpperCase();
    const cleanRole = rawRole.replace(/^ROLE_/, "").replace(/[\s_-]/g, "");
    const superAdmin = cleanRole === "SUPERADMIN";

    setIsSuperAdmin(superAdmin);
    if (superAdmin) fetchAllGroups();
  }, []);

  const fetchGroupMembers = async (conversationId) => {
    if (!conversationId) return;
    const conversation = conversationList.find((c) => c.id === conversationId);
    const targetGroupId = conversation?.groupId ?? conversationId;

    setGroupMembersLoading(true);
    try {
      const members = await getGroupMembersRequest(targetGroupId);
      const mapped = (Array.isArray(members) ? members : []).map((member) => {
        const id = member.userId ?? member.id;
        const name = member.name || `User ${id}`;
        return {
          id,
          name,
          email: member.email || "",
          initials: initialsFromName(name),
          color: GROUP_COLORS[Math.abs(Number(id) || 0) % GROUP_COLORS.length],
          role: member.role || "MEMBER",
          online: member.online ?? false,
        };
      });

      setSpaceMembersByConversation((current) => ({
        ...current,
        [conversationId]: mapped,
      }));
    } catch (error) {
      console.error("FETCH GROUP MEMBERS FAILED:", error);
    } finally {
      setGroupMembersLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    if (!conversationId) return;

    const conv =
      conversationList.find((c) => String(c.id) === String(conversationId)) ||
      allGroups.find((g) => String(g.id) === String(conversationId));

    const targetChatId = conv?.chatId ?? conv?.id ?? conversationId;

    try {
      const apiMessages = await getMessagesRequest(targetChatId);
      const sortedMessages = [...(Array.isArray(apiMessages) ? apiMessages : [])].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const signedInUserId = getCurrentUser()?.userId;
      const mapped = mapApiMessages(sortedMessages, signedInUserId);

      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: mapped,
      }));

      const pinnedIds = sortedMessages
        .filter((message) => message.pinned === true)
        .map((message) => message.id);

      setPinnedMessages((current) => ({
        ...current,
        [conversationId]: pinnedIds,
      }));

      const starredIds = sortedMessages
        .filter((message) => message.starred === true)
        .map((message) => message.id);

      setStarredMessages((current) => ({
        ...current,
        [conversationId]: starredIds,
      }));
    } catch (error) {
      console.error(`Error fetching messages for ${conversationId}:`, error);
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: current[conversationId] || [],
      }));
    }
  };

  useEffect(() => {
    if (!activeConversationId) return;

    fetchMessages(activeConversationId);
    const isSpace =
      activeConversation?.type === "space" ||
      allGroups.some((g) => String(g.id) === String(activeConversationId));

    if (isSpace) {
      fetchGroupMembers(activeConversationId);
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (!memberDialogOpen) return undefined;
    setUserSearchLoading(true);
    const delay = memberSearch.trim() ? 300 : 0;
    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchUsersRequest(memberSearch.trim(), activeConversationId);
        setUserSearchResults(results);
      } catch {
        setUserSearchResults([]);
      } finally {
        setUserSearchLoading(false);
      }
    }, delay);
    return () => clearTimeout(timeoutId);
  }, [memberSearch, memberDialogOpen, activeConversationId]);

  useEffect(() => {
    setViewingMemberId(null);
  }, [boardView]);

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!isResizingRef.current) return;
      const delta = event.clientX - resizeStateRef.current.startX;
      const nextWidth = Math.min(480, Math.max(240, resizeStateRef.current.startWidth - delta));
      setBoardPanelWidth(nextWidth);
    };
    const handlePointerUp = () => {
      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", handlePointerMove);
    document.addEventListener("mouseup", handlePointerUp);
    return () => {
      document.removeEventListener("mousemove", handlePointerMove);
      document.removeEventListener("mouseup", handlePointerUp);
    };
  }, []);

  const startPanelResize = (event) => {
    isResizingRef.current = true;
    resizeStateRef.current = { startX: event.clientX, startWidth: boardPanelWidth };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleSidebarPointerMove = (event) => {
      if (!isSidebarResizingRef.current) return;
      const delta = event.clientX - sidebarResizeStateRef.current.startX;
      const nextWidth = Math.min(360, Math.max(200, sidebarResizeStateRef.current.startWidth + delta));
      setSidebarWidth(nextWidth);
    };
    const handleSidebarPointerUp = () => {
      if (!isSidebarResizingRef.current) return;
      isSidebarResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", handleSidebarPointerMove);
    document.addEventListener("mouseup", handleSidebarPointerUp);
    return () => {
      document.removeEventListener("mousemove", handleSidebarPointerMove);
      document.removeEventListener("mouseup", handleSidebarPointerUp);
    };
  }, []);

  const startSidebarResize = (event) => {
    isSidebarResizingRef.current = true;
    sidebarResizeStateRef.current = { startX: event.clientX, startWidth: sidebarWidth };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleHomeListPointerMove = (event) => {
      if (!isHomeListResizingRef.current) return;
      const delta = event.clientX - homeListResizeStateRef.current.startX;
      const nextWidth = Math.min(560, Math.max(280, homeListResizeStateRef.current.startWidth + delta));
      setHomeListWidth(nextWidth);
    };
    const handleHomeListPointerUp = () => {
      if (!isHomeListResizingRef.current) return;
      isHomeListResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", handleHomeListPointerMove);
    document.addEventListener("mouseup", handleHomeListPointerUp);
    return () => {
      document.removeEventListener("mousemove", handleHomeListPointerMove);
      document.removeEventListener("mouseup", handleHomeListPointerUp);
    };
  }, []);

  const startHomeListResize = (event) => {
    isHomeListResizingRef.current = true;
    homeListResizeStateRef.current = { startX: event.clientX, startWidth: homeListWidth };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await document.documentElement.requestFullscreen();
  };

// Automatically clears notifications and informs backend for active conversation
  const clearReadForConversation = async (conversationId) => {
    if (!conversationId) return;

    const conv =
      conversationList.find((c) => String(c.id) === String(conversationId)) ||
      allGroups.find((g) => String(g.id) === String(conversationId));

    const targetChatId = conv?.chatId ?? conv?.id ?? conversationId;
    const targetGroupId = conv?.groupId ?? conv?.id ?? conversationId;

    // 1. Immediately reset unread count to 0 in conversationList
    setConversationList((current) =>
      current.map((c) =>
        String(c.id) === String(conversationId) ||
        String(c.chatId) === String(targetChatId) ||
        String(c.groupId) === String(targetGroupId)
          ? { ...c, unread: 0, unreadCount: 0 }
          : c
      )
    );

    // 2. Find all matching unread notifications
    const matchingNotifs = notifications.filter(
      (n) =>
        !n.read &&
        (String(n.relatedChatId) === String(conversationId) ||
          String(n.relatedGroupId) === String(conversationId) ||
          String(n.relatedChatId) === String(targetChatId) ||
          String(n.relatedGroupId) === String(targetGroupId) ||
          String(n.relatedUserId) === String(conv?.contactId ?? ""))
    );

    // 3. Mark matching notifications as read both locally and on backend
    if (matchingNotifs.length > 0) {
      setNotifications((current) =>
        current.map((n) =>
          matchingNotifs.some((m) => m.id === n.id) ? { ...n, read: true } : n
        )
      );

      setUnreadNotificationCount((prev) =>
        Math.max(0, prev - matchingNotifs.length)
      );

      // Call PATCH /api/notifications/{id}/read for each
      await Promise.allSettled(
        matchingNotifs.map((n) => markNotificationReadRequest(n.id))
      );

      fetchUnreadNotificationCount();
    }

    // 4. Mark chat as read on backend
    if (targetChatId) {
      await markChatAsReadRequest(targetChatId).catch(() => {});
    }
  };

  useEffect(() => {
    if (activeConversationId) {
      clearReadForConversation(activeConversationId);
    }
  }, [activeConversationId]);

  const openConversation = async (conversationId) => {
    setActiveConversationId(conversationId);
    setActiveShortcut("conversation"); // Sets view to conversation, hiding Home list

    await clearReadForConversation(conversationId);

    setMessagesByConversation((current) => ({
      ...current,
      [conversationId]: current[conversationId] ?? [],
    }));

    setSpaceMembersByConversation((current) => ({
      ...current,
      [conversationId]: current[conversationId] ?? [],
    }));

    await fetchMessages(conversationId);
  };

  const togglePin = (conversationId) => {
    setPinnedConversations((current) =>
      current.includes(conversationId)
        ? current.filter((id) => id !== conversationId)
        : [...current, conversationId]
    );
  };

  const sendProjectFiles = async (projectInput, rawFiles) => {
    let projectId = undefined;
    let projectName = "Project";
    let files = [];

    if (projectInput && typeof projectInput === "object" && !Array.isArray(projectInput) && !projectInput.name) {
      projectId = projectInput.projectId;
      projectName = projectInput.projectName || "Project";
      files = projectInput.files || [];
    } else {
      projectName = projectInput || "Project";
      files = rawFiles || [];
    }

    if (!files || files.length === 0) {
      console.warn("sendProjectFiles: No files to upload.");
      return;
    }

    if (!activeConversationId) {
      alert("Please select a conversation first.");
      return;
    }

    const safeTitle = (projectName || "Project").trim();

    try {
      const res = await uploadProjectFiles({
        projectId,
        title: safeTitle,
        files,
      });

      const projectData = res?.data || res;
      const uploadedFiles = projectData?.files || (Array.isArray(projectData) ? projectData : []);

      if (uploadedFiles.length === 0) {
        throw new Error("Server returned no project files.");
      }

      for (const item of uploadedFiles) {
        const isImg = isPureImage(item.fileName) || item.fileType === "IMAGE";
        const fileType = isImg ? "IMAGE" : "DOCUMENT";

        await sendMessageRequest(activeConversationId, {
          type: fileType,
          content: `📁 [${safeTitle}] ${item.fileName}`,
          mediaFileId: item.id,
        });
      }

      await fetchMessages(activeConversationId);
    } catch (err) {
      console.error("sendProjectFiles failed:", err);
      alert(`Project upload failed: ${err.message}`);
      throw err;
    }
  };

  const fetchProjects = async () => {
    try {
      return await getProjectsRequest();
    } catch (err) {
      console.error("Failed to fetch projects list:", err);
      return [];
    }
  };

  const fetchProjectById = async (projectId) => {
    try {
      return await getProjectByIdRequest(projectId);
    } catch (err) {
      console.error(`Failed to fetch project ${projectId}:`, err);
      return null;
    }
  };

  const toggleMessagePin = async (messageId) => {
    const alreadyPinned = pinnedMessageIds.includes(messageId);
    const newPinnedState = !alreadyPinned;

    try {
      await pinMessageRequest(messageId, newPinnedState);
      setPinnedMessages((current) => {
        const existing = current[activeConversationId] || [];
        return {
          ...current,
          [activeConversationId]: newPinnedState
            ? [...existing, messageId]
            : existing.filter((id) => id !== messageId),
        };
      });

      if (newPinnedState) {
        setBoardView("pinned");
      }
    } catch (error) {
      console.error("Failed to pin/unpin message:", error);
    }
  };

  const toggleFileExpanded = (messageId) => {
    setExpandedFileIds((current) =>
      current.includes(messageId) ? current.filter((id) => id !== messageId) : [...current, messageId]
    );
  };

  const deleteMessage = async () => {
    if (!messageToDelete?.messageId) return;
    const { conversationId, messageId } = messageToDelete;

    try {
      await deleteMessageRequest(messageId);
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] || []).filter(
          (message) => message.id !== messageId
        ),
      }));

      setPinnedMessages((current) => ({
        ...current,
        [conversationId]: (current[conversationId] || []).filter(
          (id) => id !== messageId
        ),
      }));

      setStarredMessages((current) => ({
        ...current,
        [conversationId]: (current[conversationId] || []).filter(
          (id) => id !== messageId
        ),
      }));

      setMessageToDelete(null);
    } catch (error) {
      console.error("Delete message API failed:", error);
    }
  };

  const addReaction = async (messageId, emoji) => {
    if (!activeConversationId || !messageId || !emoji) return;

    setEmojiPickerMessageId(null);

    const currentList = messagesByConversation[activeConversationId] || [];
    const targetMsg = currentList.find((m) => m.id === messageId);
    if (!targetMsg) return;

    const isSameEmoji = targetMsg.myReaction === emoji;

    // 1. Optimistic UI update directly on the message bubble
    setMessagesByConversation((prev) => ({
      ...prev,
      [activeConversationId]: (prev[activeConversationId] || []).map((msg) => {
        if (msg.id !== messageId) return msg;

        let reactions = [...(msg.reactions || [])];
        const prevEmoji = msg.myReaction;

        // Decrement/remove old reaction count if present
        if (prevEmoji) {
          reactions = reactions
            .map((r) => (r.emoji === prevEmoji ? { ...r, count: r.count - 1 } : r))
            .filter((r) => r.count > 0);
        }

        // If clicking a different emoji, add/increment it
        if (!isSameEmoji) {
          const existing = reactions.find((r) => r.emoji === emoji);
          if (existing) {
            reactions = reactions.map((r) =>
              r.emoji === emoji ? { ...r, count: r.count + 1 } : r
            );
          } else {
            reactions.push({ emoji, count: 1 });
          }
        }

        return {
          ...msg,
          reactions,
          myReaction: isSameEmoji ? null : emoji,
        };
      }),
    }));

    // 2. Call PATCH /api/messages/{messageId}/react
    try {
      const updatedData = await reactToMessageRequest(messageId, emoji);

      // If backend returns the updated message object with fresh reactions, sync it
      if (updatedData && updatedData.reactions) {
        setMessagesByConversation((prev) => ({
          ...prev,
          [activeConversationId]: (prev[activeConversationId] || []).map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  reactions: updatedData.reactions || [],
                  myReaction: updatedData.myReaction || (isSameEmoji ? null : emoji),
                }
              : msg
          ),
        }));
      }
    } catch (err) {
      console.error("Failed to react to message:", err);
      // Fallback: refresh current chat messages if request fails
      await fetchMessages(activeConversationId);
    }
  };

  const startChat = () => {
    if (!selectedContact) return;
    if (typeof selectedContact.id === "number") {
      openConversation(selectedContact.id);
    }
    setNewChatOpen(false);
    setSelectedContact(null);
    setNewChatSearch("");
  };

  const startDirectMessage = async (contact) => {
    try {
      const chat = await startChatRequest(contact.id);
      const conversation = {
        id: chat.id,
        type: "dm",
        contactId: contact.id,
        name: chat.name || contact.name,
        initials: contact.initials || initialsFromName(contact.name),
        color: contact.color || colorForSenderId(contact.id),
        preview: chat.lastMessage || "",
        time: chat.lastMessageAt || "",
        unread: chat.unreadCount || 0,
        pinned: chat.pinned || false,
        muted: chat.muted || false,
      };

      setConversationList((current) => {
        const exists = current.some(
          (item) => String(item.id) === String(chat.id)
        );

        if (exists) {
          return current.map((item) =>
            String(item.id) === String(chat.id) ? { ...item, ...conversation } : item
          );
        }

        return [conversation, ...current];
      });

      setMessagesByConversation((current) => ({
        ...current,
        [chat.id]: current[chat.id] || [],
      }));

      openConversation(chat.id);
      setDirectMessagesExpanded(true);
      setNewChatOpen(false);
      setSelectedContact(null);
      setNewChatSearch("");
    } catch (error) {
      console.error("Start direct message failed:", error);
    }
  };

  const createGroup = async () => {
    const name = groupName.trim();
    if (!name || creatingGroup) return;

    setCreatingGroup(true);
    setCreateGroupError(null);
    try {
      const currentUser = getCurrentUser();
      const description = newGroupDescription.trim();
      const created = await createGroupRequest({
        name,
        description,
        avatar: "",
        memberUserIds: currentUser?.userId ? [currentUser.userId] : [],
      });

      const id = created.id;
      const group = {
        id,
        type: "space",
        name: created.name || created.groupName || created.title || name,
        initials: initialsFromName(created.name || name),
        color: GROUP_COLORS[conversationList.filter((c) => c.type === "space").length % GROUP_COLORS.length],
        preview: created.description || description || "Your new group is ready.",
        time: "Just now",
      };

      setConversationList((current) => [group, ...current]);
      setMessagesByConversation((current) => ({ ...current, [id]: [] }));

      if (currentUser?.userId) {
        try {
          if (isSuperAdmin) {
            await adminAddGroupMemberRequest(id, currentUser.userId);
          } else {
            await addGroupMemberRequest(id, currentUser.userId);
          }
        } catch {
          // Non-fatal
        }
      }
      await fetchGroupMembers(id);
      if (description) setGroupDescriptions((current) => ({ ...current, [id]: description }));
      setActiveConversationId(id);
      setActiveShortcut("conversation");
      setNewGroupId(id);
      setNewChatOpen(false);
      setGroupNameDialogOpen(false);
      setGroupName("");
      setNewGroupDescription("");
    } catch (error) {
      setCreateGroupError(error.message || "Couldn't create the group.");
    } finally {
      setCreatingGroup(false);
    }
  };

  const openMemberDialog = () => {
    setMemberSearch("");
    setPendingMemberIds([]);
    setUserSearchResults([]);
    setAddMemberError(null);
    setMemberDialogOpen(true);
    fetchGroupMembers(activeConversationId);
  };

  const [removeMemberError, setRemoveMemberError] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null);

  const requestRemoveMember = (member) => setMemberToRemove(member);
  const cancelRemoveMember = () => setMemberToRemove(null);

  const promoteMember = async (memberId) => {
    const conversation = conversationList.find((c) => c.id === activeConversationId);
    const targetGroupId = conversation?.groupId ?? activeConversationId;

    try {
      if (isSuperAdmin) {
        await adminPromoteGroupMemberRequest(targetGroupId, memberId);
      } else {
        await promoteGroupMemberRequest(targetGroupId, memberId);
      }

      setSpaceMembersByConversation((current) => ({
        ...current,
        [activeConversationId]: (current[activeConversationId] || []).map((m) =>
          m.id === memberId ? { ...m, role: "ADMIN" } : m
        ),
      }));

      await fetchGroupMembers(activeConversationId);
    } catch (error) {
      console.error("Promote member failed:", error);
      throw error;
    }
  };

  const demoteMember = async (memberId) => {
    const conversation = conversationList.find((c) => c.id === activeConversationId);
    const targetGroupId = conversation?.groupId ?? activeConversationId;

    try {
      if (isSuperAdmin) {
        await adminDemoteGroupMemberRequest(targetGroupId, memberId);
      } else {
        await demoteGroupMemberRequest(targetGroupId, memberId);
      }

      setSpaceMembersByConversation((current) => ({
        ...current,
        [activeConversationId]: (current[activeConversationId] || []).map((m) =>
          m.id === memberId ? { ...m, role: "MEMBER" } : m
        ),
      }));

      await fetchGroupMembers(activeConversationId);
    } catch (error) {
      console.error("Demote member failed:", error);
      throw error;
    }
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    const memberId = memberToRemove.id;
    const removed = memberToRemove;

    const conversation = conversationList.find((c) => c.id === activeConversationId);
    const targetGroupId = conversation?.groupId ?? activeConversationId;

    setRemoveMemberError(null);
    try {
      if (isSuperAdmin) {
        await adminRemoveGroupMemberRequest(targetGroupId, memberId);
      } else {
        await removeGroupMemberRequest(targetGroupId, memberId);
      }
    } catch (error) {
      setRemoveMemberError(error.message || "Couldn't remove that member.");
      return;
    }

    setSpaceMembersByConversation((current) => ({
      ...current,
      [activeConversationId]: (current[activeConversationId] || []).filter(
        (member) => member.id !== memberId
      ),
    }));

    setBlockedMemberIds((current) => ({
      ...current,
      [activeConversationId]: (current[activeConversationId] || []).filter(
        (id) => id !== memberId
      ),
    }));

    setMessagesByConversation((current) => ({
      ...current,
      [activeConversationId]: [
        ...(current[activeConversationId] || []),
        {
          id: `activity-${Date.now()}`,
          type: "activity",
          text: `${removed.name} was removed from the group`,
          time: "Just now",
          createdAt: new Date().toISOString(),
        },
      ],
    }));

    setMemberToRemove(null);
  };

  const toggleBlockMember = (memberId) => {
    setBlockedMemberIds((current) => {
      const existing = current[activeConversationId] || [];
      return {
        ...current,
        [activeConversationId]: existing.includes(memberId)
          ? existing.filter((id) => id !== memberId)
          : [...existing, memberId],
      };
    });
  };

  const pushGroupUpdate = async (conversationId, updates) => {
    const conversation = conversationList.find((c) => c.id === conversationId);
    const targetGroupId = conversation?.groupId ?? conversationId;

    setGroupInfoError(null);
    try {
      const payload = {
        name: updates.name ?? conversation?.name ?? "",
        description: updates.description ?? (groupDescriptions[conversationId] || ""),
        avatar: updates.avatar ?? "",
      };

      if (isSuperAdmin) {
        await adminUpdateGroupRequest(targetGroupId, payload);
      } else {
        await updateGroupRequest(targetGroupId, payload);
      }

      if (isSuperAdmin && allGroups?.length > 0) {
        setAllGroups((current) =>
          current.map((g) =>
            g.id === targetGroupId
              ? {
                  ...g,
                  name: payload.name || g.name,
                  description: payload.description ?? g.description,
                }
              : g
          )
        );
      }
    } catch (error) {
      setGroupInfoError(error.message || "Couldn't save that change.");
    }
  };

  const renameConversation = (conversationId, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setConversationList((current) =>
      current.map((conversation) => (conversation.id === conversationId ? { ...conversation, name: trimmed } : conversation))
    );
    return pushGroupUpdate(conversationId, { name: trimmed });
  };

  const setGroupDescription = (conversationId, text) => {
    setGroupDescriptions((current) => ({ ...current, [conversationId]: text }));
    return pushGroupUpdate(conversationId, { description: text });
  };

  const toggleMuteConversation = (conversationId) => {
    setMutedConversationIds((current) =>
      current.includes(conversationId) ? current.filter((id) => id !== conversationId) : [...current, conversationId]
    );
  };

  const toggleMediaVisibility = (conversationId) => {
    setMediaVisibility((current) => ({ ...current, [conversationId]: !(current[conversationId] !== false) }));
  };

  const cleanChat = () => {
    setMessagesByConversation((current) => ({ ...current, [activeConversationId]: [] }));
    setPinnedMessages((current) => ({ ...current, [activeConversationId]: [] }));
    setExpandedFileIds([]);
    setMessageReactions((current) => {
      const next = { ...current };
      Object.keys(next).forEach((key) => {
        if (key.startsWith(`${activeConversationId}-`)) delete next[key];
      });
      return next;
    });
  };

  const exitGroup = async () => {
    setGroupInfoError(null);
    try {
      await leaveGroupRequest(activeConversationId);
    } catch (error) {
      setGroupInfoError(error.message || "Couldn't leave group.");
      return;
    }
    setSpaceMembersByConversation((current) => ({
      ...current,
      [activeConversationId]: (current[activeConversationId] || []).filter((member) => member.id !== currentUserId),
    }));
    setMessagesByConversation((current) => ({
      ...current,
      [activeConversationId]: [
        ...(current[activeConversationId] || []),
        { id: `activity-${Date.now()}`, type: "activity", text: "You left the group", time: "Just now", createdAt: new Date().toISOString() },
      ],
    }));
    setExitGroupDialogOpen(false);
    setBoardView(null);
  };

  const exitAndDeleteForMe = async () => {
    const conversationId = activeConversationId;
    setGroupInfoError(null);
    try {
      await leaveGroupRequest(conversationId);
    } catch (error) {
      setGroupInfoError(error.message || "Couldn't leave group.");
      return;
    }
    setConversationList((current) => current.filter((conversation) => conversation.id !== conversationId));
    setMessagesByConversation((current) => {
      const next = { ...current };
      delete next[conversationId];
      return next;
    });
    setSpaceMembersByConversation((current) => {
      const next = { ...current };
      delete next[conversationId];
      return next;
    });
    setPinnedMessages((current) => {
      const next = { ...current };
      delete next[conversationId];
      return next;
    });
    setBlockedMemberIds((current) => {
      const next = { ...current };
      delete next[conversationId];
      return next;
    });
    setGroupDescriptions((current) => {
      const next = { ...current };
      delete next[conversationId];
      return next;
    });
    setMutedConversationIds((current) => current.filter((id) => id !== conversationId));
    setMediaVisibility((current) => {
      const next = { ...current };
      delete next[conversationId];
      return next;
    });
    setPinnedConversations((current) => current.filter((id) => id !== conversationId));
    setExitGroupDialogOpen(false);
    setBoardView(null);
    setActiveShortcut("home");
  };

  const togglePendingMember = (contactId) => {
    setPendingMemberIds((current) =>
      current.includes(contactId) ? current.filter((id) => id !== contactId) : [...current, contactId]
    );
  };

  const confirmAddMembers = async () => {
    if (pendingMemberIds.length === 0) return;

    const conversation = conversationList.find((c) => c.id === activeConversationId);
    const targetGroupId = conversation?.groupId ?? activeConversationId;

    const usersToAdd = userSearchResults.filter((user) =>
      pendingMemberIds.includes(user.id)
    );

    setAddMemberError(null);
    const succeeded = [];

    for (const user of usersToAdd) {
      try {
        if (isSuperAdmin) {
          await adminAddGroupMemberRequest(targetGroupId, user.id);
        } else {
          await addGroupMemberRequest(targetGroupId, user.id);
        }
        succeeded.push(user);
      } catch (error) {
        setAddMemberError(error.message || `Couldn't add ${user.name}.`);
      }
    }

    if (succeeded.length > 0) {
      await fetchGroupMembers(activeConversationId);
      await fetchMessages(activeConversationId);
    }

    if (succeeded.length === usersToAdd.length) {
      setPendingMemberIds([]);
      setMemberSearch("");
      setUserSearchResults([]);
      setMemberDialogOpen(false);
    }
  };

  const visibleFrequentContacts = frequentContacts.filter((contact) =>
    `${contact.name} ${contact.email}`.toLowerCase().includes(newChatSearch.toLowerCase())
  );

  const addableUserResults = userSearchResults
    .filter((user) => !user.alreadyInGroup)
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email || "",
      initials: initialsFromName(user.name),
      color: GROUP_COLORS[Math.abs(Number(user.id) || 0) % GROUP_COLORS.length],
    }));

  const editMessage = async (messageId, content) => {
    const plainText = (content || "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

    if (!plainText) return;

    try {
      const result = await updateMessageRequest(messageId, plainText);

      setMessagesByConversation((current) => ({
        ...current,
        [activeConversationId]: (current[activeConversationId] || []).map((message) =>
          message.id === messageId
            ? {
                ...message,
                text: result?.content ?? plainText,
                edited: true,
              }
            : message
        ),
      }));

      setEditingMessage(null);
      setDraft("");
    } catch (error) {
      console.error("Edit message failed:", error);
      throw error;
    }
  };

  const sendMessage = async () => {
    const plainText = draft.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
    const filesToSend = attachments.length > 0 ? [...attachments] : (attachment ? [attachment] : []);

    if (!plainText && filesToSend.length === 0) return;

    if (editingMessage) {
      await editMessage(editingMessage.id, plainText);
      return;
    }

    if (filesToSend.length > 0) {
      const conversationId = activeConversationId;

      setAttachments([]);
      setDraft("");
      setReplyingTo(null);

      const tempItems = filesToSend.map((file, idx) => {
        const isImage = isPureImage(file.name);
        return {
          id: `temp-${Date.now()}-${idx}`,
          sender: "You",
          type: "file",
          isImage,
          fileUrl: isImage ? URL.createObjectURL(file) : undefined,
          caption: idx === 0 && plainText ? plainText : file.name,
          attachmentName: file.name,
          time: "Just now",
          createdAt: new Date().toISOString(),
          mine: true,
          status: "sending",
          replyTo: idx === 0 ? replyingTo : null,
        };
      });

      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: [...(current[conversationId] || []), ...tempItems],
      }));

      try {
        let uploadedList = [];

        if (filesToSend.length === 1) {
          const singleUpload = await uploadAttachment(filesToSend[0]);
          uploadedList = [singleUpload];
        } else {
          const multipleUpload = await uploadMultipleAttachments(filesToSend);
          uploadedList = Array.isArray(multipleUpload) ? multipleUpload : [multipleUpload];
        }

        for (let i = 0; i < uploadedList.length; i++) {
          const rawItem = uploadedList[i];
          const fileData = rawItem?.file || rawItem;
          const mediaFileId = fileData?.id;
          const fileObj = filesToSend[i];

          const isImg = isPureImage(fileObj?.name) || fileData?.fileType === "IMAGE";
          const isAudio = fileData?.fileType === "AUDIO" || fileObj?.type?.startsWith("audio/");
          const isVideo = fileData?.fileType === "VIDEO" || fileObj?.type?.startsWith("video/");

          let fileType = "DOCUMENT";
          if (isImg) fileType = "IMAGE";
          else if (isAudio) fileType = "AUDIO";
          else if (isVideo) fileType = "VIDEO";

          const fileName = fileData?.fileName || fileData?.originalFileName || fileObj?.name || "Attachment";
          const content = i === 0 && plainText ? plainText : fileName;

          await sendMessageRequest(conversationId, {
            type: fileType,
            content,
            mediaFileId,
            replyToMessageId: i === 0 ? replyingTo?.id ?? null : null,
          });
        }

        await fetchMessages(conversationId);
      } catch (error) {
        console.error("Attachment send failed:", error);
        setMessagesByConversation((current) => ({
          ...current,
          [conversationId]: (current[conversationId] || []).map((msg) =>
            tempItems.some((t) => t.id === msg.id)
              ? { ...msg, status: "failed", error: error.message || "Failed to send." }
              : msg
          ),
        }));
      }
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const conversationId = activeConversationId;
    const htmlContent = draft;

    setMessagesByConversation((current) => ({
      ...current,
      [conversationId]: [
        ...(current[conversationId] || []),
        {
          id: tempId,
          sender: "You",
          text: htmlContent,
          time: "Just now",
          createdAt: new Date().toISOString(),
          mine: true,
          status: "sending",
          replyTo: replyingTo
            ? {
                id: replyingTo.id,
                sender: replyingTo.sender || "Message",
                text:
                  replyingTo.type === "file"
                    ? replyingTo.caption || "Shared file"
                    : replyingTo.text || "",
                type: replyingTo.type,
                fileUrl: replyingTo.fileUrl || null,
              }
            : null,
        },
      ],
    }));
    setDraft("");
    setReplyingTo(null);

    try {
      const result = await sendMessageRequest(conversationId, {
        type: "TEXT",
        content: plainText,
        replyToMessageId: replyingTo?.id ?? null,
      });

      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] || []).map((message) =>
          message.id === tempId ? { ...message, id: result?.id ?? tempId, status: "sent" } : message
        ),
      }));
    } catch (error) {
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] || []).map((message) =>
          message.id === tempId
            ? { ...message, status: "failed", error: error.message || "Message failed to send." }
            : message
        ),
      }));
    }
  };

  const retryFailedMessage = async (conversationId, messageId) => {
    const message = (messagesByConversation[conversationId] || []).find((m) => m.id === messageId);
    if (!message) return;

    setMessagesByConversation((current) => ({
      ...current,
      [conversationId]: (current[conversationId] || []).map((m) =>
        m.id === messageId ? { ...m, status: "sending", error: undefined } : m
      ),
    }));

    const plainText = message.text.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

    try {
      const result = await sendMessageRequest(conversationId, { type: "TEXT", content: plainText });
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] || []).map((m) =>
          m.id === messageId ? { ...m, id: result?.id ?? messageId, status: "sent" } : m
        ),
      }));
    } catch (error) {
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] || []).map((m) =>
          m.id === messageId ? { ...m, status: "failed", error: error.message || "Message failed to send." } : m
        ),
      }));
    }
  };

  const deleteChat = (conversationId) => {
    setConversationList((current) => current.filter((conversation) => conversation.id !== conversationId));
    setMessagesByConversation((current) => {
      const next = { ...current };
      delete next[conversationId];
      return next;
    });
    setPinnedMessages((current) => {
      const next = { ...current };
      delete next[conversationId];
      return next;
    });
    setStarredMessages((current) => {
      const next = { ...current };
      delete next[conversationId];
      return next;
    });
    setPinnedConversations((current) => current.filter((id) => id !== conversationId));
    setMutedConversationIds((current) => current.filter((id) => id !== conversationId));
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setActiveShortcut("home");
    }
  };

  const currentStatus = statusOptions.find((s) => s.label === status) || statusOptions[0];
  const spaceConversations = conversationList.filter((c) => c.type === "space");
  const directConversations = conversationList.filter((c) => c.type === "dm");
  const currentUserName = getCurrentUser()?.name || youMember.name;
  const currentUserId = getCurrentUser()?.userId ?? "you";

  const currentUserMember = groupMembers.find(
    (member) => String(member.id) === String(currentUserId)
  );

  const isGroupAdmin =
    activeConversation?.type === "space" &&
    ["ADMIN", "OWNER", "admin", "owner"].includes(
      String(currentUserMember?.role || "")
    );

  const deleteGroupAsSuperAdmin = async (conversationId) => {
    setGroupInfoError(null);
    try {
      await adminDeleteGroupRequest(conversationId);
    } catch (error) {
      setGroupInfoError(error.message || "Couldn't delete group.");
      return;
    }
    setConversationList((current) => current.filter((conversation) => conversation.id !== conversationId));
    setMessagesByConversation((current) => {
      const next = { ...current };
      delete next[conversationId];
      return next;
    });
    setSpaceMembersByConversation((current) => {
      const next = { ...current };
      delete next[conversationId];
      return next;
    });
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setActiveShortcut("home");
    }
  };

  const handleDeleteGroup = async (conversationId = activeConversationId) => {
    const conversation = conversationList.find((c) => c.id === conversationId);
    const targetGroupId = conversation?.groupId ?? conversationId;

    setGroupInfoError(null);
    try {
      if (isSuperAdmin) {
        await adminDeleteGroupRequest(targetGroupId);
      } else {
        await deleteGroupRequest(targetGroupId);
      }

      setConversationList((current) =>
        current.filter((c) => c.id !== conversationId)
      );
      setAllGroups((current) => current.filter((g) => g.id !== targetGroupId));

      setMessagesByConversation((current) => {
        const next = { ...current };
        delete next[conversationId];
        return next;
      });

      setSpaceMembersByConversation((current) => {
        const next = { ...current };
        delete next[conversationId];
        return next;
      });

      setPinnedConversations((current) =>
        current.filter((id) => id !== conversationId)
      );
      setMutedConversationIds((current) =>
        current.filter((id) => id !== conversationId)
      );

      setActiveConversationId(null);
      setBoardView(null);
      setActiveShortcut("home");
    } catch (error) {
      console.error("Delete group failed:", error);
      setGroupInfoError(error.message || "Failed to delete group");
      throw error;
    }
  };

  const openClearChatDialog = () => {
    if (!activeConversationId) return;

    const currentMsgs = (messagesByConversation[activeConversationId] || []).filter(
      (m) => m.type !== "activity" && m.type !== "system" && m.status !== "deleted"
    );

    const firstMsgDate =
      currentMsgs.length > 0
        ? currentMsgs[0].createdAt
        : new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

    const lastMsgDate =
      currentMsgs.length > 0
        ? currentMsgs[currentMsgs.length - 1].createdAt
        : new Date().toISOString();

    setClearChatFromDate(formatForDateTimeInput(firstMsgDate));
    setClearChatToDate(formatForDateTimeInput(lastMsgDate));
    setClearChatError(null);
    setIsBulkClearMode(false);
    setClearChatDialogOpen(true);
  };

  const openBulkClearAllChatsDialog = () => {
    const allChatIds = [
      ...conversationList.map((c) => c.chatId ?? c.id),
      ...allGroups.map((g) => g.chatId ?? g.id),
    ].filter(Boolean);

    const uniqueChatIds = Array.from(new Set(allChatIds.map(Number)));

    if (uniqueChatIds.length === 0) {
      alert("No active chats or groups found to clear.");
      return;
    }

    let earliest = null;
    let latest = null;

    Object.values(messagesByConversation).forEach((msgArray) => {
      msgArray.forEach((msg) => {
        if (!msg.createdAt || msg.type === "activity" || msg.type === "system") return;
        const t = new Date(msg.createdAt).getTime();
        if (!earliest || t < earliest) earliest = t;
        if (!latest || t > latest) latest = t;
      });
    });

    const firstDate = earliest ? new Date(earliest).toISOString() : new Date().toISOString();
    const lastDate = latest ? new Date(latest).toISOString() : new Date().toISOString();

    setClearChatFromDate(formatForDateTimeInput(firstDate));
    setClearChatToDate(formatForDateTimeInput(lastDate));
    setClearChatError(null);
    setIsBulkClearMode(true);
    setClearChatDialogOpen(true);
  };

  const closeClearChatDialog = () => {
    if (clearChatLoading) return;
    setClearChatDialogOpen(false);
    setClearChatError(null);
    setIsBulkClearMode(false);
  };

  const confirmClearChat = async ({ isFullClear = false } = {}) => {
    setClearChatLoading(true);
    setClearChatError(null);

    try {
      let fromFormatted = undefined;
      let toFormatted = undefined;

      if (!isFullClear && clearChatFromDate && clearChatToDate) {
        fromFormatted = formatToBackendDateTime(clearChatFromDate, false);
        toFormatted = formatToBackendDateTime(clearChatToDate, true);
      }

      // CASE 1: BULK CLEAR ALL CHATS
      if (isBulkClearMode) {
        const allChatIds = [
          ...conversationList.map((c) => c.chatId ?? c.id),
          ...allGroups.map((g) => g.chatId ?? g.id),
        ].filter(Boolean);

        const uniqueChatIds = Array.from(new Set(allChatIds.map(Number)));

        await adminBulkClearChatMessages(uniqueChatIds, {
          from: fromFormatted,
          to: toFormatted,
        });

        setMessagesByConversation({});
        setPinnedMessages({});
        setStarredMessages({});

        if (activeConversationId) {
          await fetchMessages(activeConversationId);
        }

        setIsBulkClearMode(false);
        setClearChatDialogOpen(false);
        return;
      }

      // CASE 2: SINGLE CHAT CLEAR
      if (!activeConversationId) return;

      const conv =
        conversationList.find((c) => String(c.id) === String(activeConversationId)) ||
        allGroups.find((g) => String(g.id) === String(activeConversationId));

      const targetChatId = conv?.chatId ?? conv?.id ?? activeConversationId;
      const targetGroupId = conv?.groupId ?? conv?.id;
      const isGroup =
        conv?.type === "space" ||
        conv?.type === "GROUP" ||
        Boolean(allGroups.some((g) => String(g.id) === String(activeConversationId)));

      if (isSuperAdmin) {
        await adminClearChatMessages(targetChatId, {
          from: fromFormatted,
          to: toFormatted,
        });
      } else if (isGroup) {
        if (!isGroupAdmin) {
          throw new Error("Only group admins can clear group messages.");
        }
        await groupAdminClearMessages(targetGroupId, {
          from: fromFormatted,
          to: toFormatted,
        });
      } else {
        await clearDirectChatMessages(targetChatId, {
          from: fromFormatted,
          to: toFormatted,
        });
      }

      await fetchMessages(activeConversationId);
      setClearChatDialogOpen(false);
    } catch (err) {
      console.error("Clear chat error:", err);
      setClearChatError(err.message || "Failed to clear chat messages.");
    } finally {
      setClearChatLoading(false);
    }
  };

  const bulkClearChatsAsAdmin = async (selectedChatIds, { from, to } = {}) => {
    if (!selectedChatIds?.length) return;

    try {
      const response = await adminBulkClearChatMessages(selectedChatIds, { from, to });

      setMessagesByConversation((current) => {
        const updated = { ...current };
        selectedChatIds.forEach((id) => {
          updated[id] = [];
        });
        return updated;
      });

      if (selectedChatIds.includes(activeConversationId)) {
        await fetchMessages(activeConversationId);
      }

      return response;
    } catch (error) {
      console.error("Bulk chat clear failed:", error);
      throw error;
    }
  };

  return {
    conversationList, activeConversation, activeConversationId, setActiveConversationId,
    messages, messagesByConversation, setMessagesByConversation, openConversation, spaceConversations, directConversations,
    isChatVisible, activeShortcut, setActiveShortcut,
    groupsLoading, groupsError, currentUserName,
    isSuperAdmin, allGroups, allGroupsLoading, allGroupsError, fetchAllGroups,
    shortcutsExpanded, setShortcutsExpanded, directMessagesExpanded, setDirectMessagesExpanded,
    spacesExpanded, setSpacesExpanded,
    statusMenuOpen, setStatusMenuOpen, status, setStatus, currentStatus, statusOptions,
    isFullscreen, toggleFullscreen,
    isPinned, togglePin, pinnedConversations, toggleMessagePin, pinnedMessageIds, pinnedMessageList,
    starredMessageIds, toggleMessageStar,
    replyingTo, startReply, cancelReply, editingMessage, setEditingMessage, editMessage,
    selectMode, selectedMessageIds, enterSelectMode, toggleSelectMessage, exitSelectMode, bulkDeleteSelected,
    forwardMessageIds, openForwardDialog, closeForwardDialog, forwardMessagesTo, forwardError,
    boardView, setBoardView, boardPanelWidth, startPanelResize, sharedMedia,
    sidebarWidth, startSidebarResize,
    homeListWidth, startHomeListResize,
    expandedFileIds, toggleFileExpanded, messageReactions, addReaction,
    emojiPickerMessageId, setEmojiPickerMessageId,
    messageToDelete, setMessageToDelete, deleteMessage,
    draft, setDraft,
    attachment, setAttachment,
    attachments, setAttachments,
    sendMessage, retryFailedMessage, fileInputRef,

    // Project file features
    sendProjectFiles,
    fetchProjects,
    fetchProjectById,

    newChatOpen, setNewChatOpen, newChatSearch, setNewChatSearch, selectedContact, setSelectedContact,
    visibleFrequentContacts, startChat, startDirectMessage,
    groupNameDialogOpen, setGroupNameDialogOpen, groupName, setGroupName, createGroup, newGroupId,
    newGroupDescription, setNewGroupDescription,
    creatingGroup, createGroupError,
    groupOptionsOpen, setGroupOptionsOpen,
    memberDialogOpen, setMemberDialogOpen, memberSearch, setMemberSearch, groupMembers,
    frequentContacts, openMemberDialog, pendingMemberIds, togglePendingMember, confirmAddMembers,
    groupMembersLoading, userSearchLoading, addableUserResults, addMemberError,
    fetchGroupMembers,
    blockedMemberIdList, toggleBlockMember, removeMemberError,
    memberToRemove, requestRemoveMember, cancelRemoveMember, confirmRemoveMember,
    promoteMember,
    demoteMember,
    isGroupAdmin,
    renameConversation, groupDescription, setGroupDescription,
    isMuted, toggleMuteConversation, isMediaVisible, toggleMediaVisibility,
    cleanChat, deleteChat, exitGroupDialogOpen, setExitGroupDialogOpen, exitGroup, exitAndDeleteForMe,
    deleteGroupAsSuperAdmin,
    handleDeleteGroup,
    currentUserId, groupInfoError,
    viewingMemberId, setViewingMemberId, viewingMember, viewingMemberMessages, viewingMemberFiles,
    notifications, notificationsLoading, notificationsError, unreadNotificationCount,
    notificationPanelOpen, toggleNotificationPanel, closeNotificationPanel,
    markNotificationAsRead, markAllNotificationsAsRead, openNotificationTarget,
    getUnreadCount,
    fetchUnreadNotificationCount,

    // Clear chat dialog features
    clearChatDialogOpen,
    setClearChatDialogOpen,
    clearChatFromDate,
    setClearChatFromDate,
    clearChatToDate,
    setClearChatToDate,
    clearChatLoading,
    clearChatError,
    openClearChatDialog,
    openBulkClearAllChatsDialog,
    isBulkClearMode,
    closeClearChatDialog,
    confirmClearChat,
    bulkClearChatsAsAdmin,
  };
}