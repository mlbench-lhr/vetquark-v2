"use client";

import React from "react";
import { useSelector } from "react-redux";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store/store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toggleCollapse, toggleSidebar } from "@/store/sidebarSlice";
import Image from "next/image";
import { ChevronDown, Menu } from "lucide-react";
import LogoutDialog from "./ui/LogoutDialog";

function ProfileMenu() {
  const profile = useAppSelector((state) => state.adminAuth.profile);

  return (
    <div className="relative">
      <div className="w-fit h-fit flex items-center justify-center ">
        <div className="flex justify-start items-center gap-2 ">
          <div className="w-[38px] h-[38px] rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
            {profile?.avatar ? (
              <Image
                src={profile.avatar}
                alt="admin avatar"
                width={38}
                height={38}
                className="object-cover w-[38px] h-[38px]"
              />
            ) : (
              <span className="text-lg font-medium">
                {(profile?.fullName || "A").charAt(0)}
              </span>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <ChevronDown
                size={22}
                className="cursor-pointer"
                color="#B32053"
              />
            </PopoverTrigger>
            <PopoverContent className="w-[234px] overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5 p-0 top-6 right-0 md:-right-8 absolute">
              <div className="py-1 p-[20px]">
                <LogoutDialog adminStyle />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

const IconMenu = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export function Navbar() {
  const dispatch = useAppDispatch();
  const { isCollapsed } = useSelector((s: RootState) => s.sidebar);
  const profile = useAppSelector((state) => state.adminAuth.profile);

  return (
    <header className="w-full bg-white border-b h-[78px] flex justify-end items-center">
      <div className="w-full px-4 sm:px-6 lg:px-[32px]">
        <div className="h-fit flex items-center justify-between w-full">
          <div className="flex items-center gap-4 justify-between w-full">
            <Image
              src={"/blueLogo.svg"}
              alt=""
              width={59}
              height={32}
              className="flex md:hidden w-[140px] h-auto"
            />
            <button
              onClick={() => dispatch(toggleCollapse())}
              className={`hidden ${isCollapsed && "md:inline-flex"
                } mt-1 ml-[-20px]`}
            >
              <Menu className="h-[16px] w-[16px]" />
            </button>
            {/* Mobile menu button: toggles sidebar sheet */}
            <div className="flex justify-start items-center gap-0">
              <button
                onClick={() => dispatch(toggleSidebar())}
                className="p-2 md:hidden rounded-md hover:bg-secondary h-[36px]"
                aria-label="Toggle menu"
              >
                <IconMenu className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <div className="text-[14px] font-medium">
                {profile?.fullName}
              </div>
              <div className="text-[12px] font-[400]">{profile?.email}</div>
            </div>
            <div className="relative hidden md:block">
              <ProfileMenu />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
