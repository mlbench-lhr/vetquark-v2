import React, { useState, FormEvent } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { useTranslation } from "react-i18next";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  sessionId: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  buildRequestBody: (data: any) => any;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  sessionId,
  onSuccess,
  onError,
  buildRequestBody,
}) => {
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const { t } = useTranslation();

  const resetForm = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validatePasswords = (): string | null => {
    if (!oldPassword.trim()) {
      return t("auth.oldPasswordRequired");
    }
    if (!newPassword.trim()) {
      return t("auth.newPasswordRequired");
    }
    if (!confirmPassword.trim()) {
      return t("auth.confirmPasswordRequired");
    }
    if (newPassword !== confirmPassword) {
      return t("security.passwordsDoNotMatch");
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validatePasswords();
    if (validationError) {
      onError(validationError);
      return;
    }

    setLoading(true);

    const payload = buildRequestBody({
      email: userEmail,
      old_password: oldPassword,
      new_password: newPassword,
    });

    try {
      const response = await fetch("/api/profile_apis/change_password", {
        method: "POST",
        headers: {
          Session: sessionId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || result.data.status === false) {
        throw new Error(result.error || "Failed to change password");
      }

      onSuccess(t("security.passwordChanged"));
      handleClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[500px] p-6 lg:p-10">
      <form onSubmit={handleSubmit} className="w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t("security.changePasswordTitle")}</h2>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Old Password Field */}
          <div>
            <Label>{t("security.oldPassword")}</Label>
            <div className="relative">
              <Input
                name="oldPassword"
                type={showOldPassword ? "text" : "password"}
                placeholder={t("security.enterCurrentPasswordPlaceholder")}
                value={oldPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOldPassword(e.target.value)}
                required
                disabled={loading}
                className="pr-12"
              />
              <span
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
              >
                {showOldPassword ? (
                  <div className="opacity-50">
                    <EyeIcon />
                  </div>
                ) : (
                  <div className="opacity-50">
                    <EyeCloseIcon />
                  </div>
                )}
              </span>
            </div>
          </div>

          {/* New Password Field */}
          <div>
            <Label>{t("security.newPassword")}</Label>
            <div className="relative">
              <Input
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder={t("security.enterNewPasswordPlaceholder")}
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                className="pr-12"
              />
              <span
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
              >
                {showNewPassword ? (
                  <div className="opacity-50">
                    <EyeIcon />
                  </div>
                ) : (
                  <div className="opacity-50">
                    <EyeCloseIcon />
                  </div>
                )}
              </span>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <Label>{t("security.confirmNewPasswordLabel")}</Label>
            <div className="relative">
              <Input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t("security.confirmNewPasswordPlaceholder2")}
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="pr-12"
              />
              <span
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
              >
                {showConfirmPassword ? (
                  <div className="opacity-50">
                    <EyeIcon />
                  </div>
                ) : (
                  <div className="opacity-50">
                    <EyeCloseIcon />
                  </div>
                )}
              </span>
            </div>
          </div>

          {/* Update Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-full font-medium hover:bg-blue-700 transition-colors mt-8 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? t("security.changingPassword") : t("security.changePassword")}
          </button>
        </div>
      </form>
    </Modal>
  );
};