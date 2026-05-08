'use client'
import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React, { useEffect, useState } from "react";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import DemographicCard from "@/components/ecommerce/DemographicCard";
import DoughnutLoginChart from "@/components/ecommerce/DoughnutLoginChart";
import TotalGuestsChart from "@/components/ecommerce/TotalGuestsChart";
import { redirect } from "next/navigation";
import { UserContext } from "@/context/authContext";
import { buildRequestBody } from "@/utils/apiWrapper";
import { toast } from "react-toastify";
import RecentlyAddedUsers from "./RecentlyAddedUsers";

type RoomStats = {
    total_rooms: number;
    current_month_rooms: number;
    last_month_rooms: number;
    percent_change: number;
};
type UserStats = {
    total_users: number;
    current_month_users: number;
    last_month_users: number;
    percent_change: number;
};

type GuestCounts = {
    scan: number[];
    manually: number[];
    tck: number[];
};

type User = {
    id: number;
    full_name: string;
    email: string;
    profile_image_url: string;
};



export default function Index({ sessionId }: { sessionId: string }) {
    const [roomStats, setRoomStats] = useState<RoomStats | null>(null);
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [guestCounts, setGuestCounts] = useState<GuestCounts>({
        scan: Array(12).fill(0),
        manually: Array(12).fill(0),
        tck: Array(12).fill(0),
    });
    const [recentUsers, setRecentUsers] = useState<User[]>([]);
    const [links, setLinks] = useState<number[]>([]);
    const { user } = React.useContext(UserContext);
    const [payload, setPayload] = useState<any>(null);
    if (!sessionId) {
        redirect("/signin");
    }
    useEffect(() => {
        if (user?.email) {
            const builtPayload = buildRequestBody({ email: user.email });
            setPayload(builtPayload);
        }
    }, [user])
    useEffect(() => {
        if (payload) {
            getUsers()
            getRooms()
            getGeneratedLinks()
            getTotalGuest()
            getRecentlyAddedUsers()
        }
    }, [payload])

    const getUsers = async () => {
        try {
            const response = await fetch("/api/dashboard/get_total_users", {
                method: "POST",
                headers: {
                    "Session": sessionId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),

            })
            const result = await response.json()
            if (!response.ok || result.data.data.status === false) {
                throw new Error(result.data.data.message)
            }
            setUserStats(result.data.data)
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            toast.error(errorMessage);
            console.log("error", err);
        }
    }

    const getRooms = async () => {
        try {
            const response = await fetch("/api/dashboard/get_total_rooms", {
                method: "POST",
                headers: {
                    "Session": sessionId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),

            })
            const result = await response.json()
            if (!response.ok || result.data.status === false) {
                throw new Error(result.data.message)
            }
            setRoomStats(result.data.data)
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            toast.error(errorMessage);
            console.log("error", err);
        }
    }

    const getGeneratedLinks = async () => {
        try {
            const response = await fetch("/api/dashboard/get_total_links", {
                method: "POST",
                headers: {
                    "Session": sessionId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),

            })
            const result = await response.json()
            if (!response.ok || result.data.status === false) {
                throw new Error(result.data.message)
            }
            setLinks(result.data.data.counts)
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            toast.error(errorMessage);
            console.log("error", err);
        }
    }

    const getTotalGuest = async () => {
        try {
            const response = await fetch("/api/dashboard/get_total_guests", {
                method: "POST",
                headers: {
                    "Session": sessionId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),

            })
            const result = await response.json()
            if (!response.ok || result.data.status === false) {
                throw new Error(result.data.message)
            }
            setGuestCounts(result.data.data);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            toast.error(errorMessage);
            console.log("error", err);
        }
    }

    const getRecentlyAddedUsers = async () => {
        try {
            const response = await fetch("/api/dashboard/get_recent_users", {
                method: "POST",
                headers: {
                    "Session": sessionId,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),

            })
            const result = await response.json()
            if (!response.ok || result.data.status === false) {
                throw new Error(result.data?.message || result.error)
            }

            setRecentUsers(result.data.data);

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            toast.error(errorMessage);
            console.log("error", err);
        }
    }

    return (
        <div className="grid grid-cols-12 gap-4 md:gap-6 xl:gap-8">
            <div className="col-span-12 xl:col-span-7 flex flex-col space-y-6">
                <EcommerceMetrics UserStats={userStats} RoomStats={roomStats} />
                <MonthlySalesChart links={links} />
            </div>

            <div className="col-span-12 xl:col-span-5">
                <RecentlyAddedUsers recentUsers={recentUsers} />
                {/* </div> */}
            </div>

            <div className="col-span-12">
                <TotalGuestsChart scan={guestCounts.scan} manually={guestCounts.manually} tck={guestCounts.tck} />
            </div>
        </div>
    );
}
