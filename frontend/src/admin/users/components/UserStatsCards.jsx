import {
    Users,
    UserCheck,
    UserX,
    Ban,
} from "lucide-react";

export default function UserStatsCards({ users = [] }) {
    const totalUsers = users.filter(
        (user) => !user.isDeleted
    ).length;

    const activeUsers = users.filter(
        (user) =>
            user.status === "ACTIVE" &&
            !user.isDeleted
    ).length;

    const inactiveUsers = users.filter(
        (user) =>
            user.status === "INACTIVE" &&
            !user.isDeleted
    ).length;

    const blockedUsers = users.filter(
        (user) =>
            user.isBlocked &&
            !user.isDeleted
    ).length;

    const cards = [
        {
            label: "Total Users",
            value: totalUsers,
            icon: Users,
            iconBg: "bg-[#FFF0E5]",
            iconColor: "text-[#fd7e13]",
        },
        {
            label: "Active Users",
            value: activeUsers,
            icon: UserCheck,
            iconBg: "bg-green-50",
            iconColor: "text-green-600",
        },
        {
            label: "Inactive Users",
            value: inactiveUsers,
            icon: UserX,
            iconBg: "bg-yellow-50",
            iconColor: "text-yellow-600",
        },
        {
            label: "Blocked Users",
            value: blockedUsers,
            icon: Ban,
            iconBg: "bg-red-50",
            iconColor: "text-red-600",
        },
    ];

    return (
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 py-2">
            {cards.map((card) => {
                const Icon = card.icon;

                return (
                    <div
                        key={card.label}
                        className="rounded-[12px] border border-[#E5E7EB] bg-white p-5"
                    >
                        <div className="flex items-center justify-between">

                            <div>
                                <p className="text-[13px] text-[#6B7178]">
                                    {card.label}
                                </p>

                                <h2 className="mt-2 text-[24px] font-semibold text-[#1E2328]">
                                    {card.value}
                                </h2>
                            </div>

                            <div
                                className={`flex h-11 w-11 items-center justify-center rounded-[10px] ${card.iconBg}`}
                            >
                                <Icon
                                    size={21}
                                    className={card.iconColor}
                                />
                            </div>

                        </div>
                    </div>
                );
            })}
        </div>
    );
}