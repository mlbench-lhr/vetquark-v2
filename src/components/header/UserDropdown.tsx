"use client";
import Image from "next/image";
import React, { useContext, useState, FormEvent, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { UserContext } from "@/context/authContext";
import { buildRequestBody } from "@/utils/apiWrapper";
import { ClipLoader } from "react-spinners";
import { useModal } from "@/hooks/useModal";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { EditProfileModal } from "./EditProfileModal";
import { ChangePasswordModal } from "./ChangePasswordModal";


export default function UserDropdown() {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const {
    isOpen: isEditProfileOpen,
    openModal: openEditProfile,
    closeModal: closeEditProfile
  } = useModal();
  const {
    isOpen: isChangePasswordOpen,
    openModal: openChangePassword,
    closeModal: closeChangePassword
  } = useModal();

  const { logout, user, session_id, setUser } = useContext(UserContext);
  const [loading, setLoading] = useState(false);

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setIsDropdownOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsDropdownOpen(false);
  }

  const handleEditProfileClick = () => {
    closeDropdown();
    openEditProfile();
  };

  const handleChangePasswordClick = () => {
    closeDropdown();
    openChangePassword();
  };

  const handleLogoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.email) {
      const email = user?.email;
      setLoading(true);

      const payload = buildRequestBody({ email });

      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Session: session_id,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok || result.data.status === false) {
          console.error("Server Error:", result.message);
          return;
        }
        logout();
      } catch (error) {
        console.error("Network Error:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateUser = (updatedUser: any) => {
    setUser(updatedUser);
    toast.success("Profile updated successfully");
  };

  const handleError = (message: string) => {
    toast.error(message);
  };

  const handlePasswordChangeSuccess = (message: string) => {
    toast.success(message);
  };




  return (
    <div className="relative">

      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dropdown-toggle"
      >
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11">
          <Image
            width={44}
            height={44}
            src={user?.profile_image_url?.trim() || "/images/default_image.svg"}
            alt={t("common.user")}
            className="w-full h-full object-cover"
          />
        </span>

        <span className="block mr-1 font-medium text-theme-sm">{user?.first_name}</span>

        <svg
          className={`stroke-gray-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""
            }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isDropdownOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm">
            {user?.first_name} {user?.last_name}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500">
            {user?.email}
          </span>
        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200">
          <li>
            <DropdownItem
              onClick={handleEditProfileClick}
              className="flex items-center gap-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700"
            >
              <Image
                src="/images/black_pen.svg"
                alt="bell"
                width={24}
                height={24}
              />
              {t("common.editProfile")}
            </DropdownItem>
          </li>
          <li>
            <DropdownItem
              onClick={handleChangePasswordClick}
              className="flex items-center gap-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700"
            >
              <Image
                src="/images/lock.svg"
                alt="bell"
                width={24}
                height={24}
              />
              {t("common.changePassword")}
            </DropdownItem>
          </li>

        </ul>
        <div
          onClick={handleLogoutSubmit}
          className="flex items-center gap-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
        >
          <svg
            className="fill-gray-500 group-hover:fill-gray-700"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z"
              fill=""
            />
          </svg>
          {t("common.signOut")}
          {loading && (
            <div className="fixed inset-0 z-50 flex justify-center items-center  bg-opacity-60">
              <ClipLoader color="#ffffff" size={50} />
            </div>
          )}
        </div>
      </Dropdown>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={closeEditProfile}
        user={user}
        sessionId={session_id}
        onUpdateUser={handleUpdateUser}
        onError={handleError}
        buildRequestBody={buildRequestBody}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={closeChangePassword}
        userEmail={user?.email || ""}
        sessionId={session_id}
        onSuccess={handlePasswordChangeSuccess}
        onError={handleError}
        buildRequestBody={buildRequestBody}
      />
    </div>
  );
}