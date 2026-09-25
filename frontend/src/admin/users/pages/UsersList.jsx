import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import UserSearch from "../components/UserSearch";
import UserFilters from "../components/UserFilters";
import UserTable from "../components/UserTable";

import {
  fetchUsers,
  setUserBlocked,
  deleteUser,
} from "../data/usersData";
import UserStatsCards from "../components/UserStatsCards";
import AdminHeader from "../../layout/AdminHeader";

export default function UsersList() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState("createdAt_desc");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetchUsers({
        page,
        pageSize: 10,
        search,
        status,
        sort,
      });

      setUsers(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("Failed to load users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, sort]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, status, sort]);

  const handleBlockToggle = async (user) => {
    const next = !user.isBlocked;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? {
              ...u,
              isBlocked: next,
              status: next ? "BLOCKED" : "ACTIVE",
            }
          : u
      )
    );

    try {
      await setUserBlocked(user.id, next);
    } catch (err) {
      console.error(err);
      load();
    }
  };

  const handleDelete = async (user) => {
    if (
      !window.confirm(
        `Delete ${user.name}? This can't be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteUser(user.id);

      setUsers((prev) =>
        prev.filter((u) => u.id !== user.id)
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F2EC] p-4">

      {/* Header */}
     <AdminHeader />
{/* User Statistics */}
<UserStatsCards users={users} />

      {/* Search / Filters / Add User */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

       {/* Search / Filters / Add User */}
<div className="mb-4 flex items-center justify-between gap-4">

  {/* Search + Filters */}
  <div className="flex items-center gap-3">

    <UserSearch
      value={search}
      onChange={setSearch}
    />

    <UserFilters
      status={status}
      onStatusChange={setStatus}
      sort={sort}
      onSortChange={setSort}
    />

  </div>




</div>

        <button
          type="button"
          onClick={() =>
            navigate("/admin/users/create")
          }
          className="flex w-fit shrink-0 items-center gap-2 rounded-[8px] bg-[#fd7e13] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#e96f08]"
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      {/* Table */}
      <UserTable
        users={users}
        loading={loading}
        onRowClick={(user) =>
          navigate(`/admin/users/${user.id}`)
        }
        onBlockToggle={handleBlockToggle}
        onDelete={handleDelete}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}