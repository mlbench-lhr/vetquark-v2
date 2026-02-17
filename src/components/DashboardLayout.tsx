"use client";

import type React from "react";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store/store";
import { setAdminProfile } from "@/store/adminAuthSlice";
import { useMediaQuery } from "react-responsive";
import { Sidebar } from "./UserDashboardLayoutSidebar";
import { Navbar } from "./UserDashboardLayoutNavbar";
import { useRouter } from "next/navigation";

// LAYOUT that uses Navbar + Sidebar
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const adminProfile = useAppSelector((state) => state.adminAuth.profile);
  const { isCollapsed } = useSelector((s: RootState) => s.sidebar);
  const isMiddleScreen = useMediaQuery({ maxWidth: 1350 });
  useEffect(() => {
    if (adminProfile) return;
    let alive = true;

    (async () => {
      const res = await fetch("/api/admin/auth/me", { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (!alive) return;
      if (!res.ok) {
        router.replace("/admin/login");
        return;
      }
      const p = json?.profile || {};
      dispatch(
        setAdminProfile({
          id: typeof p?.id === "string" ? p.id : "",
          fullName: typeof p?.fullName === "string" ? p.fullName : "",
          email: typeof p?.email === "string" ? p.email : "",
          role: "Admin",
          avatar: typeof p?.avatar === "string" ? p.avatar : null,
        })
      );
    })();

    return () => {
      alive = false;
    };
  }, [adminProfile, dispatch, router]);
  return (
    <div className="min-h-screen bg-slate-50 w-full flex">
      <Sidebar />
      <div
        className={`flex flex-col items-center w-full bg-white ${
          isMiddleScreen && !isCollapsed
            ? "w-full"
            : isCollapsed
            ? "md:w-[calc(100%-80px)]"
            : "md:w-[calc(100%-260px)]"
        }`}
      >
        <Navbar />
        <main className={`flex-1 py-3 px-5 element`}>{children}</main>
      </div>
    </div>
  );
}
