import Image from 'next/image';
import React, { useEffect, useState } from 'react';
type User = {
    id: number;
    full_name: string;
    email: string;
    profile_image_url: string;
};

type RecentlyAddedUsersProps = {
    recentUsers: User[];
};

const RecentlyAddedUsers: React.FC<RecentlyAddedUsersProps> = ({ recentUsers }) => {
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (recentUsers) {
            setLoading(false);
        }
    }, [recentUsers]);


    return (
        <div className="bg-white rounded-2xl shadow-md p-6 w-full flex flex-col h-[460px] ">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Recent Users</h4>

            {/* Scrollable user list */}
            <div className="flex-1 overflow-y-auto h-[400px] space-y-2 custom-scrollbar">
                {loading ? (
                    <div className="animate-pulse space-y-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div key={i} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200" />
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="h-4 w-40 rounded bg-gray-200" />
                                    <div className="h-3 w-56 rounded bg-gray-200" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    recentUsers.map((user) => (
                        <div
                            key={`${user.id}-${user.email}`}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <div className="flex-shrink-0 w-10 h-10">
                                <Image
                                    src={user.profile_image_url || "/images/avatar.png"}
                                    alt={user.full_name}
                                    width={32}
                                    height={32}
                                    className="rounded-full h-full w-full object-cover"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {user.full_name}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

    );
};

export default RecentlyAddedUsers;
