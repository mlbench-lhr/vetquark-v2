"use client";
import React, { useEffect, useState } from "react";
import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon, BoxIconLine, GroupIcon, UserIcon } from "@/icons";
import Image from "next/image";

type UserStats = {
  total_users: number;
  current_month_users: number;
  last_month_users: number;
  percent_change: number;
};
type RoomStats = {
  total_rooms: number;
  current_month_rooms: number;
  last_month_rooms: number;
  percent_change: number;
};

type Props = {
  UserStats: UserStats | null;
  RoomStats: RoomStats | null;
};

export const EcommerceMetrics: React.FC<Props> = ({ UserStats, RoomStats }) => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (UserStats && RoomStats) {
      setLoading(false);
    }
  }, [UserStats, RoomStats]);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5  md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl ">
          <Image
            src="/images/dashboard/user_icon.svg"
            alt="User"
            width={30}
            height={24}
          />
        </div>
        {loading ? (
          <div className="mt-5 animate-pulse">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="mt-2 h-7 w-20 rounded bg-gray-200" />
            <div className="mt-4 h-7 w-20 rounded-full bg-gray-200 ml-auto" />
          </div>
        ) : (
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="font-raleway text-sm text-gray-500 ">
                All Users
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm ">
                {UserStats?.total_users}
              </h4>
            </div>
            {UserStats?.percent_change && UserStats.percent_change >= 0 ? (
              <Badge color="success">
                <ArrowUpIcon className="mr-1" />
                {UserStats.percent_change}%
              </Badge>
            ) : (
              <Badge color="error">
                <ArrowDownIcon className="mr-1 text-error-500" />
                {UserStats?.percent_change}%
              </Badge>
            )}
          </div>
        )}
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5  md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl ">
          <Image
            src="/images/dashboard/house_icon.svg"
            alt="User"
            width={30}
            height={24}
          />
        </div>
        {loading ? (
          <div className="mt-5 animate-pulse">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="mt-2 h-7 w-20 rounded bg-gray-200" />
            <div className="mt-4 h-7 w-20 rounded-full bg-gray-200 ml-auto" />
          </div>
        ) : (
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="font-raleway text-sm text-gray-500 ">
                All Rooms
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm ">
                {RoomStats?.total_rooms}
              </h4>
            </div>

            {RoomStats?.percent_change && RoomStats?.percent_change >= 0 ? (
              <Badge color="success">
                <ArrowUpIcon className="mr-1" />
                {RoomStats.percent_change}%
              </Badge>
            ) : (
              <Badge color="error">
                <ArrowDownIcon className="mr-1 text-error-500" />
                {RoomStats?.percent_change}%
              </Badge>
            )}
          </div>
        )}
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
};
