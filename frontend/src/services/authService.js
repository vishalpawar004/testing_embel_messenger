// src/services/authService.js

const BASE_URL = "http://localhost:8081/api";
const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";
const ORIGIN = BASE_URL.replace(/\/api\/?$/, "");

export function resolveFileUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const token =
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("jwt");

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    const message = payload?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

export async function login(identifier, password) {
  const payload = await request("/auth/login", {
    method: "POST",
    body: { identifier, password },
  });

  const { token, userId, name, role } = payload.data;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify({ userId, name, role }));

  return { token, userId, name, role };
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("token");
  localStorage.removeItem("auth_token");
  localStorage.removeItem("jwt");
}

export function getToken() {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("jwt")
  );
}

export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export async function getGroups() {
  const payload = await request("/groups");
  return payload.data || [];
}

export async function createGroup({ name, description = "", avatar = "", memberUserIds = [] }) {
  const payload = await request("/groups", {
    method: "POST",
    body: { name, description, avatar, memberUserIds },
  });
  return payload.data;
}

export async function addGroupMember(groupId, userId) {
  const payload = await request(`/groups/${groupId}/members`, {
    method: "POST",
    body: { userId },
  });
  return payload.data;
}

export async function getGroupMembers(groupId) {
  const payload = await request(`/groups/${groupId}/members`);
  return payload.data || [];
}

export async function searchUsers(query, groupId) {
  const trimmed = (query || "").trim();
  const params = new URLSearchParams();
  if (trimmed) params.set("q", trimmed);
  if (groupId !== undefined && groupId !== null) params.set("groupId", groupId);
  const queryString = params.toString();
  const payload = await request(`/users/search${queryString ? `?${queryString}` : ""}`);
  return payload.data || [];
}

export async function updateGroup(groupId, { name, description = "", avatar = "" }) {
  const payload = await request(`/groups/${groupId}`, {
    method: "PUT",
    body: { name, description, avatar },
  });
  return payload.data;
}

export async function leaveGroup(groupId) {
  const payload = await request(`/groups/${groupId}/leave`, { method: "POST" });
  return payload.data;
}

export async function sendMessage(chatId, { type = "TEXT", content, mediaFileId, replyToMessageId } = {}) {
  const payload = await request("/messages", {
    method: "POST",
    body: { chatId, type, content, mediaFileId, replyToMessageId },
  });

  const data = payload.data;
  if (data?.status === "FAILED") {
    throw new Error(payload.message || "Message failed to send.");
  }

  return data;
}

export async function getMessages(chatId) {
  const payload = await request(`/messages/chat/${chatId}`);
  return payload.data?.content || [];
}

export async function pinMessage(messageId, pinned) {
  const payload = await request(`/messages/${messageId}/pin?pinned=${pinned}`, {
    method: "PATCH",
  });
  return payload.data;
}

export async function starMessage(messageId, starred) {
  const payload = await request(`/messages/${messageId}/star?starred=${starred}`, {
    method: "PATCH",
  });
  return payload.data;
}

export async function deleteMessage(messageId) {
  const payload = await request(`/messages/${messageId}`, {
    method: "DELETE",
  });
  return payload.data;
}

export async function startChat(targetUserId) {
  const payload = await request("/chats", {
    method: "POST",
    body: { targetUserId },
  });
  return payload.data;
}

export async function getChats() {
  const payload = await request("/chats");
  return payload.data || [];
}

export async function uploadAttachment(file) {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/attachments/upload`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    const message = payload?.message || `Upload failed (${response.status})`;
    throw new Error(message);
  }

  return payload.data?.file || payload.data;
}

export async function forwardMessage(messageId, chatIds) {
  const payload = await request(`/messages/${messageId}/forward`, {
    method: "POST",
    body: { chatIds },
  });
  return payload.data;
}

export async function removeGroupMember(groupId, targetUserId) {
  const payload = await request(`/groups/${groupId}/members/${targetUserId}`, {
    method: "DELETE",
  });
  return payload.data;
}

export async function updateMessage(messageId, content) {
  const payload = await request(`/messages/${messageId}`, {
    method: "PATCH",
    body: { content },
  });
  return payload.data;
}

export async function promoteGroupMember(groupId, targetUserId, isSuperAdmin = false) {
  const endpoint = isSuperAdmin
    ? `/admin/groups/${groupId}/members/${targetUserId}/promote`
    : `/groups/${groupId}/members/${targetUserId}/promote`;

  const payload = await request(endpoint, { method: "PUT" });
  return payload?.data ?? payload;
}

export async function demoteGroupMember(groupId, targetUserId, isSuperAdmin = false) {
  const endpoint = isSuperAdmin
    ? `/admin/groups/${groupId}/members/${targetUserId}/demote`
    : `/groups/${groupId}/members/${targetUserId}/demote`;

  const payload = await request(endpoint, { method: "PUT" });
  return payload?.data ?? payload;
}

export async function deleteGroup(groupId) {
  const payload = await request(`/groups/${groupId}`, { method: "DELETE" });
  return payload?.data ?? payload;
}

export async function getAllGroups() {
  const payload = await request("/admin/groups", { method: "GET" });
  return payload?.data ?? payload;
}

export async function adminDeleteGroup(groupId) {
  const payload = await request(`/admin/groups/${groupId}`, { method: "DELETE" });
  return payload?.data ?? payload;
}

export async function adminAddGroupMember(groupId, userId) {
  const payload = await request(`/admin/groups/${groupId}/members`, {
    method: "POST",
    body: { userId },
  });
  return payload.data;
}

export async function adminPromoteGroupMember(groupId, targetUserId) {
  const payload = await request(`/admin/groups/${groupId}/members/${targetUserId}/promote`, {
    method: "PUT",
  });
  return payload?.data ?? payload;
}

export async function adminDemoteGroupMember(groupId, targetUserId) {
  const payload = await request(`/admin/groups/${groupId}/members/${targetUserId}/demote`, {
    method: "PUT",
  });
  return payload?.data ?? payload;
}

export async function adminUpdateGroup(groupId, { name, description = "", avatar = "" } = {}) {
  const payload = await request(`/admin/groups/${groupId}`, {
    method: "PUT",
    body: { name, description, avatar },
  });
  return payload?.data ?? payload;
}

export async function adminRemoveGroupMember(groupId, targetUserId) {
  const payload = await request(`/admin/groups/${groupId}/members/${targetUserId}`, {
    method: "DELETE",
  });
  return payload?.data ?? payload;
}

export async function getNotifications(page = 0, size = 20) {
  const payload = await request(`/notifications?page=${page}&size=${size}`);
  return payload.data;
}

export async function getUnreadNotificationCount() {
  const payload = await request("/notifications/unread-count");
  return payload.data ?? 0;
}

export async function markNotificationRead(notificationId) {
  const payload = await request(`/notifications/${notificationId}/read`, { method: "PATCH" });
  return payload.data;
}

export async function markAllNotificationsRead() {
  const payload = await request("/notifications/read-all", { method: "PATCH" });
  return payload.data;
}

export async function markChatAsRead(chatId) {
  try {
    const payload = await request(`/chats/${chatId}/read`, { method: "PATCH" });
    return payload?.data ?? payload;
  } catch {
    try {
      const fallback = await request(`/chats/${chatId}/read`, { method: "POST" });
      return fallback?.data ?? fallback;
    } catch (e) {
      console.warn("Could not mark chat as read:", e.message);
    }
  }
}

export async function uploadMultipleAttachments(files) {
  const token = getToken();
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("files", file));

  const response = await fetch(`${BASE_URL}/attachments/upload-multiple`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    const message = payload?.message || `Upload failed (${response.status})`;
    throw new Error(message);
  }

  const rawList = Array.isArray(payload.data) ? payload.data : [];
  return rawList.map((entry) => entry.file || entry);
}

export async function uploadProjectFiles({ title, projectId, files }) {
  const token = getToken();
  const formData = new FormData();
  Array.from(files || []).forEach((file) => formData.append("files", file));

  const params = new URLSearchParams();
  if (projectId !== undefined && projectId !== null && projectId !== "") {
    params.set("projectId", projectId);
  } else if (title) {
    params.set("title", title.trim());
  }

  const queryString = params.toString();
  const url = `${BASE_URL}/attachments/projects/upload${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    const errorMsg = payload?.message || `Project upload failed (${response.status})`;
    throw new Error(errorMsg);
  }

  return payload?.data || payload;
}

export async function getProjects() {
  try {
    const payload = await request("/attachments/projects");
    return payload?.data || payload || [];
  } catch (error) {
    console.error("Failed to load projects:", error);
    return [];
  }
}

export async function getProjectById(projectId) {
  if (!projectId) return null;
  try {
    const payload = await request(`/attachments/projects/${projectId}`);
    return payload?.data || payload || null;
  } catch (error) {
    console.error(`Failed to load project ${projectId}:`, error);
    return null;
  }
}

// DELETE /api/admin/chats/{chatId}/messages
export async function adminClearChatMessages(chatId, { from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const queryString = params.toString();
  const endpoint = `/admin/chats/${chatId}/messages${queryString ? `?${queryString}` : ""}`;

  return await request(endpoint, { method: "DELETE" });
}

// DELETE /api/groups/{groupId}/messages
export async function groupAdminClearMessages(groupId, { from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const queryString = params.toString();
  const endpoint = `/groups/${groupId}/messages${queryString ? `?${queryString}` : ""}`;

  return await request(endpoint, { method: "DELETE" });
}

// DELETE /api/chats/{chatId}/messages
export async function clearDirectChatMessages(chatId, { from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const queryString = params.toString();
  const endpoint = `/chats/${chatId}/messages${queryString ? `?${queryString}` : ""}`;

  return await request(endpoint, { method: "DELETE" });
}

// DELETE /api/admin/chats/clear-messages
export async function adminBulkClearChatMessages(chatIds, { from, to } = {}) {
  const body = {
    chatIds: (Array.isArray(chatIds) ? chatIds : [chatIds]).map((id) => Number(id)),
  };
  if (from) body.from = from;
  if (to) body.to = to;

  return await request("/admin/chats/clear-messages", {
    method: "DELETE",
    body,
  });
}

// PATCH /api/messages/{messageId}/react[cite: 15]
export async function reactToMessage(messageId, emoji) {
  const payload = await request(`/messages/${messageId}/react`, {
    method: "PATCH",
    body: { emoji },
  });
  return payload?.data ?? payload;
}