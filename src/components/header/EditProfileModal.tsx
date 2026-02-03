import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import Image from "next/image";
import { Modal } from "../ui/modal";
import { useTranslation } from "react-i18next";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_image_url: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  sessionId: string;
  onUpdateUser: (updatedUser: User) => void;
  onError: (message: string) => void;
  buildRequestBody: (data: any) => any;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  sessionId,
  onUpdateUser,
  onError,
  buildRequestBody,
}) => {
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string>("/images/default_image.svg");
  const { t } = useTranslation();

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setProfileImage(user.profile_image_url || "/images/default_image.svg");
    }
  }, [user]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          setProfileImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    let profileImageToSend: string | null = profileImage;
    if (profileImage === "/images/default_image.svg") {
      profileImageToSend = null;
    }

    const payload = buildRequestBody({
      email: user?.email,
      new_email: email,
      first_name: firstName,
      last_name: lastName,
      ...(profileImageToSend ? { profileImage: profileImageToSend } : {}),
    });

    try {
      const response = await fetch("/api/profile_apis/edit_profile", {
        method: "POST",
        headers: {
          Session: sessionId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || result.data.status === false) {
        throw new Error(result.error);
      }

      onClose();
      
      if (user) {
        onUpdateUser({
          id: user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          profile_image_url: result.data.data.path || profileImage,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-6 lg:p-10">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t("profile.editProfileTitle")}</h2>

          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <Image
                  width={80}
                  height={80}
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <></>
              )}
            </div>
            <label
              htmlFor="profileImageInput"
              className="absolute top-0 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
            >
              <Image
                width={20}
                height={20}
                src="/images/edit.svg"
                alt="Edit"
                className="w-full h-full"
              />
            </label>
            <input
              id="profileImageInput"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              {t("profile.firstName")}
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
              placeholder="Enter First Name"
              required
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              {t("profile.lastName")}
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
              placeholder="Enter Last Name"
              required
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              {t("profile.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="Enter Email Address"
              required
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-full font-medium hover:bg-blue-700 transition-colors mt-8 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? t("profile.updating") : t("profile.update")}
          </button>
        </div>
      </form>
    </Modal>
  );
};
