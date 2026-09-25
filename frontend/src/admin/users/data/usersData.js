import { users } from "./dummyData";

export async function fetchUsers({
  page = 1,
  pageSize = 10,
  search = "",
  status = "ALL",
  sort = "createdAt_desc",
} = {}) {
  let filteredUsers = [...users];

  // Search by name, phone or email
  const query = search.trim().toLowerCase();

  if (query) {
    filteredUsers = filteredUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }

  // Status filter
  if (status !== "ALL") {
    filteredUsers = filteredUsers.filter(
      (user) => user.status === status
    );
  }

  // Hide deleted users
  filteredUsers = filteredUsers.filter(
    (user) => !user.isDeleted
  );

  // Sorting
  if (sort === "createdAt_desc") {
    filteredUsers.sort(
      (a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  if (sort === "createdAt_asc") {
    filteredUsers.sort(
      (a, b) =>
        new Date(a.createdAt) - new Date(b.createdAt)
    );
  }

  if (sort === "name_asc") {
    filteredUsers.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  if (sort === "name_desc") {
    filteredUsers.sort((a, b) =>
      b.name.localeCompare(a.name)
    );
  }

  // Pagination
  const total = filteredUsers.length;

  const totalPages = Math.max(
    1,
    Math.ceil(total / pageSize)
  );

  const start = (page - 1) * pageSize;

  const data = filteredUsers.slice(
    start,
    start + pageSize
  );

  return {
    data,
    total,
    totalPages,
    page,
    pageSize,
  };
}


export async function fetchUserById(id) {
  return (
    users.find(
      (user) => String(user.id) === String(id)
    ) || null
  );
}


export async function setUserBlocked(id, isBlocked) {
  const user = users.find(
    (user) => String(user.id) === String(id)
  );

  if (!user) {
    throw new Error("User not found");
  }

  user.isBlocked = isBlocked;

  user.status = isBlocked
    ? "BLOCKED"
    : "ACTIVE";

  user.updatedAt = new Date().toISOString();

  return user;
}


export async function deleteUser(id) {
  const user = users.find(
    (user) => String(user.id) === String(id)
  );

  if (!user) {
    throw new Error("User not found");
  }

  // Soft delete
  user.isDeleted = true;
  user.status = "DELETED";
  user.updatedAt = new Date().toISOString();

  return user;
}