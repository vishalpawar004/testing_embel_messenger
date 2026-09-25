import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import UserStatusBadge from "../components/UserStatusBadge";
import { fetchUserById, setUserBlocked, deleteUser } from "../data/usersData";

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function UserDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const onBack = () => navigate("/admin/users");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchUserById(userId)
      .then((data) => active && setUser(data))
      .catch(console.error)
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId]);

  const handleBlockToggle = async () => {
    const next = !user.isBlocked;
    setUser((u) => ({ ...u, isBlocked: next }));
    try {
      await setUserBlocked(user.id, next);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${user.name}? This can't be undone.`)) return;
    try {
      await deleteUser(user.id);
      onBack();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-7">
        <p className="text-[#6B7178]">Loading user…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-7">
        <p className="text-[#6B7178]">User not found.</p>
      </div>
    );
  }

  return (
    <div className="p-7">
      <nav className="mb-3.5 flex items-center gap-1.5 text-[13px]">
        <Link to="/admin/dashboard" className="text-[#2F80ED] hover:underline">
          Home
        </Link>
        <span className="text-[#C7C9CC]">/</span>
        <button onClick={onBack} className="text-[#5C6570] hover:text-[#1E2328]">
          User List
        </button>
      </nav>

      <div className="mb-5">
        <h1 className="text-[22px] font-semibold text-[#1E2328]">{user.name}</h1>
        <p className="mt-1 text-[13.5px] text-[#6B7178]">User profile and activity</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[300px_1fr]">
        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 text-center">
          <div className="mx-auto mb-3.5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#FFF0E5] text-[26px] font-semibold text-[#fd7e13]">
            {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : initials(user.name)}
          </div>
          <h2 className="text-[16px] font-semibold text-[#1E2328]">{user.name}</h2>
          <div className="mt-0.5 text-[13px] text-[#6B7178]">{user.email || "—"}</div>
          <div className="mt-0.5 text-[13px] text-[#6B7178]">{user.phone || "—"}</div>
          <div className="mt-2.5 flex justify-center">
            <UserStatusBadge status={user.status} />
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <button
              onClick={handleBlockToggle}
              className="w-full rounded-[8px] border border-[#E5E7EB] bg-white py-2.5 text-[13px] text-[#1E2328] hover:bg-[#F0EFEC]"
            >
              {user.isBlocked ? "Unblock user" : "Block user"}
            </button>
            <button
              onClick={handleDelete}
              className="w-full rounded-[8px] border border-red-100 bg-white py-2.5 text-[13px] text-red-600 hover:bg-red-50"
            >
              Delete user
            </button>
          </div>
        </div>

        <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6">
          <div className="mb-5 grid grid-cols-3 gap-3.5">
            {[
              { value: user.groupCount ?? 0, label: "Groups" },
              { value: user.messageCount ?? 0, label: "Messages sent" },
              { value: user.reportCount ?? 0, label: "Reports filed" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-[10px] bg-[#FAFAF9] px-4 py-3.5">
                <div className="text-[20px] font-semibold text-[#1E2328]">{stat.value}</div>
                <div className="mt-0.5 text-[12px] text-[#6B7178]">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mb-3.5 text-[14px] font-semibold text-[#1E2328]">Profile</div>
          {[
            ["User ID", `#${user.id}`],
            ["Deleted", user.isDeleted ? "Yes" : "No"],
            ["Last seen", user.lastSeenAt ? new Date(user.lastSeenAt).toLocaleString() : "—"],
            ["Joined", user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"],
            ["Last updated", user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "—"],
          ].map(([label, value], i, arr) => (
            <div
              key={label}
              className={`flex justify-between py-2.5 text-[13.5px] ${i < arr.length - 1 ? "border-b border-[#E5E7EB]" : ""}`}
            >
              <span className="text-[#6B7178]">{label}</span>
              <span className="text-[#1E2328]">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}