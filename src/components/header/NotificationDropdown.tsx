"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useContext, useEffect, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { toast } from "react-toastify";
import { UserContext } from "@/context/authContext";
import { buildRequestBody } from "@/utils/apiWrapper";
import Button from "../ui/button/Button";
import { useTranslation } from "react-i18next";
interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  created_at: string; // ISO string from backend
  profile_image_url: string;
}


export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, session_id } = useContext(UserContext);
  const { t } = useTranslation();

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = () => {
    toggleDropdown();
  };

  function timeAgo(dateString: string): string {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return t("notifications.timeAgo.seconds", { count: seconds });
    if (minutes < 60) return t("notifications.timeAgo.minutes", { count: minutes });
    if (hours < 24) return t("notifications.timeAgo.hours", { count: hours });
    if (days < 7) return t("notifications.timeAgo.days", { count: days });
    if (weeks < 5) return t("notifications.timeAgo.weeks", { count: weeks });
    if (months < 12) return t("notifications.timeAgo.months", { count: months });
    return t("notifications.timeAgo.years", { count: years });
  }


  useEffect(() => {
    const timeout = setTimeout(() => {
      if (user?.email) {
        const builtPayload = buildRequestBody({
          email: user.email,
          userId: user.id
        });

        fetchData(builtPayload);
      }
    }, 1000); // slight delay to prevent double run

    return () => clearTimeout(timeout);
  }, [user]);
  const fetchData = async (payload: any) => {
    try {
      setLoading(true)
      const response = await fetch("/api/notifications/get_notifications", {
        method: "POST",
        headers: {
          "Session": session_id,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log(result)
      if (!response.ok || result.data.status === false) {
        throw new Error(result.data?.message || result.error)
      }
      setNotifications(result.data.data);
      setNotifying(true);


    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      // toast.error(errorMessage);
      console.log("error", err);
    } finally {
      setLoading(false)
    }
  };


  const markAsRead = async (id: string[]) => {
    const payload = buildRequestBody({
      email: user?.email,
      userId: user?.id,
      notification_ids: id
    });
    try {
      setLoading(true)
      const response = await fetch("/api/notifications/mark_as_read", {
        method: "POST",
        headers: {
          "Session": session_id,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      const resData = result.data

      if (!response.ok || resData.status === false) {
        throw new Error(resData?.message || result.error)
      }
      setNotifications(prev => prev.filter(n => !id.includes(n.id)));
      setNotifying(false);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.log("error", err);
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100  "
        onClick={handleClick}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${!notifying ? "hidden" : "flex"
            }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg   sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 ">
          <h5 className="text-lg font-semibold text-gray-800 ">
            {t("notifications.title")}
          </h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dropdown-toggle  hover:text-gray-700 "
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {loading ? (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <li key={i} className="animate-pulse">
                  <div className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 items-start">
                    <div className="h-8 w-8 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-5/6 rounded bg-gray-200" />
                      <div className="h-3 w-2/3 rounded bg-gray-200" />
                      <div className="h-3 w-28 rounded bg-gray-200" />
                    </div>
                  </div>
                </li>
              ))}
            </>
          ) : (
            notifications?.map((notification, index) => (
              <li key={index}>
                <DropdownItem
                  onItemClick={() => markAsRead([notification.id])}
                  className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 items-start"
                >
                  <span className="relative block w-8 h-8 rounded-full z-1 max-w-10">
                    <Image
                      src={notification.profile_image_url}
                      alt={t("profile.altProfile")}
                      width={32}
                      height={32}
                      className="rounded-full h-full w-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white bg-success-500 "></span>
                  </span>

                  <span className="block">
                    <span
                      className="mb-1.5 block text-sm text-gray-500"
                      dangerouslySetInnerHTML={{ __html: notification.message }}
                    />

                    <span className="flex items-center gap-2 text-gray-500 text-theme-xs ">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>{timeAgo(notification.created_at)}</span>

                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))
          )}
        </ul>
        <button
          onClick={() => markAsRead(notifications.map(n => n.id))}
          className="outline block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100    "
        >
          {t("notifications.markAllAsRead")}
        </button>
      </Dropdown>
    </div>
  );
}
