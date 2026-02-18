"use client";

import type React from "react";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store/store";
import { closeSidebar, toggleCollapse } from "@/store/sidebarSlice";
import Image from "next/image";
import { Box, CardSim, CreditCard, LayoutDashboard, Users, Van, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "react-responsive";
import LogoutDialog, { AdminChangePasswordDialog } from "./ui/LogoutDialog";

const IconClose = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const pathsArray: { name: string; link: string; icon: any }[] = [
  {
    name: "Dashboard",
    link: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Products",
    link: "/admin/products",
    icon: Box,
  },
  {
    name: "Users",
    link: "/admin/users",
    icon: Users,
  },
  {
    name: "Orders & Deliveries",
    link: "/admin/orders",
    icon: Van,
  },
  {
    name: "Finance",
    link: "/admin/finance",
    icon: CreditCard,
  },
];

export function Sidebar() {
  const dispatch = useAppDispatch();
  const { isOpen, isCollapsed } = useSelector((s: RootState) => s.sidebar);
  const desktopWidth = isCollapsed ? "w-20" : "w-[260px]";
  const profile = useAppSelector((state) => state.adminAuth.profile);
  const pathname = usePathname(); // ✅ current route

  const isMiddleScreen = useMediaQuery({ maxWidth: 1350 }); // below 1200px
  useEffect(() => {
    if (pathname) dispatch(closeSidebar());
  }, [dispatch, pathname]);

  useEffect(() => {
    if (isMiddleScreen) {
      dispatch(toggleCollapse());
    }
  }, [isMiddleScreen, dispatch]);

  return (
    <>
      {/* Desktop sidebar */}
      {!isMiddleScreen && (
        <aside
          className={`gap-[40px] hidden md:flex flex-col bg-white border-r ${desktopWidth} transition-width duration-200 shrink-0 p-[20px]`}
        >
          <div className="flex items-center justify-between font-semibold w-full">
            <Link href={"/admin/dashboard"}>
              {isCollapsed ? (
                <Image
                  src={"/smallBlueLogo.svg"}
                  alt=""
                  width={59}
                  height={32}
                  className="w-auto h-[32px] ms-1 mt-2"
                />
              ) : (
                <Image
                  src={"/blueLogo.svg"}
                  alt=""
                  width={59}
                  height={32}
                  className="w-[140px] h-auto"
                />
              )}
            </Link>
            <button
              onClick={() => dispatch(toggleCollapse())}
              className={`hidden ${!isCollapsed && "md:inline-flex"} -mt-1`}
            >
              <X className="h-[16px] w-[16px]" />
            </button>
          </div>
          <nav className="flex-1 space-y-2 overflow-auto plan-text-style-4">
            {pathsArray.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  href={item.link}
                  key={index}
                  className={`w-full text-start px-3 py-2 rounded-md h-[36px] cursor-pointer flex justify-start items-center gap-2 ${pathname.includes(item.link)
                    ? "text-white bg-primary"
                    : "hover:bg-secondary"
                    }`}
                >
                  <Icon
                    size={15}
                    color={pathname.includes(item.link) ? "white" : "#3F78D8"}
                  />
                  {!isCollapsed && item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t hidden">
            <button
              onClick={() => dispatch(closeSidebar())}
              className="text-sm hidden"
            >
              Close
            </button>
          </div>
        </aside>
      )}
      {isMiddleScreen && (
        <div
          className={`inset-y-0 left-0 z-40 ${!isCollapsed ? "translate-x-0 fixed" : ""
            } transform transition-transform duration-200`}
        >
          <aside
            className={`gap-[40px] h-full hidden md:flex flex-col bg-white border-r ${desktopWidth} transition-width duration-200 shrink-0 p-[20px]`}
          >
            <div className="flex items-start justify-between font-semibold w-full">
              <Link href={"/admin/dashboard"}>
                {isCollapsed ? (
                  <Image
                    src={"/images/logo/logo-icon.svg"}
                    alt=""
                    width={32}
                    height={32}
                    className="w-auto h-[32px] ms-2 mt-2"
                  />
                ) : (
                  <Image
                    src={"/blueLogo.svg"}
                    alt=""
                    width={140}
                    height={32}
                    className="w-[140px] h-auto"
                  />
                )}
              </Link>
              <button
                onClick={() => dispatch(toggleCollapse())}
                className={`hidden ${!isCollapsed && "md:inline-flex"} mt-1`}
              >
                <X className="h-[16px] w-[16px]" />
              </button>
            </div>
            <nav className="flex-1 space-y-[32px] overflow-auto plan-text-style-4">
              {pathsArray.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    href={item.link}
                    key={index}
                    className={`w-full text-start px-3 py-2 rounded-md h-[36px] cursor-pointer flex justify-start items-center gap-2 ${pathname.includes(item.link)
                      ? "text-white bg-primary"
                      : "hover:bg-secondary"
                      }`}
                  >
                    <Icon
                      size={15}
                      color={
                        pathname.includes(item.link) ? "white" : "#3F78D8"
                      }
                    />
                    {!isCollapsed && item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t hidden">
              <button
                onClick={() => dispatch(closeSidebar())}
                className="text-sm hidden"
              >
                Close
              </button>
            </div>
          </aside>
        </div>
      )}
      {isMiddleScreen && !isCollapsed && (
        <div
          onClick={() => dispatch(toggleCollapse())}
          className="fixed inset-0 z-30 bg-black/50 hidden md:block"
        />
      )}
      {/* Mobile sheet / drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-40 md:hidden ${isOpen ? "translate-x-0" : "-translate-x-full"
          } transform transition-transform duration-200`}
      >
        <div className="min-w-[335px] bg-white h-full shadow-xl flex flex-col">
          <div className="pt-4 md:pt-[40px] pb-[16px] px-[20px] flex items-start justify-between border-b flex-col gap-2 md:gap-[12px] w-full">
            <div className="flex justify-between items-start w-full">
              <Image
                src={profile?.avatar ? profile.avatar : "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"}
                alt=""
                width={38}
                height={38}
                className="rounded-full overflow-hidden bg-green-400 flex items-center justify-center cursor-pointer w-[38px] h-[38px] object-cover object-center"
              />

              <button
                onClick={() => dispatch(closeSidebar())}
                className="p-2 rounded-md hover:bg-secondary h-[36px]"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            <div>
              <div className="text-sm md:text-md font-medium">
                {profile?.email}
              </div>
              <div className="text-xs md:text-sm font-normal">
                {profile?.fullName}
              </div>
            </div>
          </div>

          <nav className="flex flex-col justify-start items-start gap-1 md:gap-[24px] px-2 py-4 space-y-1 overflow-auto plan-text-style-4">
            {pathsArray.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  href={item.link}
                  key={index}
                  className={`w-full text-start px-3 py-2 rounded-md h-[36px] cursor-pointer flex justify-start items-center gap-2 ${pathname.includes(item.link)
                    ? "text-white bg-primary"
                    : "hover:bg-secondary"
                    }`}
                >
                  <Icon
                    size={15}
                    color={pathname.includes(item.link) ? "white" : "#3F78D8"}
                  />
                  {item.name}
                </Link>
              );
            })}
            <div className="w-full text-start px-3 py-2 rounded-md hover:bg-secondary h-[36px] cursor-pointer flex justify-start items-center gap-2">
              <AdminChangePasswordDialog />
            </div>
            <div className="w-full text-start px-3 py-2 rounded-md hover:bg-secondary h-[36px] cursor-pointer flex justify-start items-center gap-2">
              <LogoutDialog adminStyle />
            </div>
          </nav>
        </div>
      </div>
      {isOpen && (
        <div
          onClick={() => dispatch(closeSidebar())}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}
    </>
  );
}
