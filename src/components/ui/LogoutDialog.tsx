
import { useRouter } from "next/navigation";
import { LockKeyhole, LogOut } from "lucide-react";
import React from "react";
import { Button } from "./button";
import { Modal } from "@/components/ui/modal";
import swal from "sweetalert";
import { useAppDispatch } from "@/store/hooks";
import { clearAdminProfile } from "@/store/adminAuthSlice";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { Dialog, DialogContent, DialogTrigger } from "./dialog";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

async function signOutUser() {
  try {
    await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
  } finally {
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }
}

async function signOutAdmin() {
  try {
    await fetch("/api/admin/auth/logout", { method: "POST", credentials: "include" });
  } finally {
    document.cookie = "admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }
}

export function AdminChangePasswordDialog({
  triggerComponent,
}: {
  triggerComponent?: React.ReactNode | React.ComponentType<any>;
}) {
  const { t } = useTranslation();
  const TriggerComponent = triggerComponent;
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [showOldPassword, setShowOldPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const resetForm = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const closeModal = () => {
    resetForm();
    setOpen(false);
  };

  const validate = () => {
    if (!oldPassword.trim()) return t("auth.oldPasswordRequired");
    if (!newPassword.trim()) return t("auth.newPasswordRequired");
    if (!confirmPassword.trim()) return t("auth.confirmPasswordRequired");
    if (newPassword !== confirmPassword) return t("auth.passwordsDoNotMatch");
    if (newPassword.length < 8) return t("auth.passwordMinLength");
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      await (swal as any)({ title: t("common.error"), text: error, icon: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: oldPassword, newPassword }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof (payload as any)?.error === "string" ? (payload as any).error : t("auth.failedToChangePassword");
        await (swal as any)({ title: t("common.error"), text: msg, icon: "error" });
        return;
      }
      await (swal as any)({ title: t("common.success"), text: t("auth.passwordChangedSuccessfully"), icon: "success" });
      closeModal();
    } catch {
      await (swal as any)({ title: t("common.error"), text: t("auth.networkError"), icon: "error" });
    } finally {
      setLoading(false);
    }
  };
  console.log("open----", open);

  return (
    <Dialog>
      <DialogTrigger>
        <span
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setOpen(true);
          }}
          className="inline-flex"
        >
          {TriggerComponent ? (
            typeof TriggerComponent === "function" ? (
              <TriggerComponent />
            ) : (
              TriggerComponent
            )
          ) : (
            <div className="flex gap-1 items-center justify-start">
              <LockKeyhole size={15} strokeWidth={2} color="#3F78D8" />
              <span className="block px-2 py-2 text-sm">{t('auth.changePassword')}</span>
            </div>
          )}
        </span>
      </DialogTrigger>
      <DialogContent className="max-w-[500px] p-6 lg:p-10">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('auth.changePassword')}</h2>
          </div>

          <div className="space-y-6">
            <div>
              <Label>{t('auth.oldPassword')}</Label>
              <div className="relative">
                <Input
                  name="oldPassword"
                  type={showOldPassword ? "text" : "password"}
                  placeholder={t('auth.enterCurrentPassword')}
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

            <div>
              <Label>{t('auth.newPassword')}</Label>
              <div className="relative">
                <Input
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder={t('auth.enterNewPassword')}
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

            <div>
              <Label>{t('auth.confirmNewPassword')}</Label>
              <div className="relative">
                <Input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t('auth.confirmYourNewPassword')}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-full font-medium hover:bg-blue-700 transition-colors mt-8 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? t('auth.changingPassword') : t('auth.changePassword')}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function LogoutDialog({
  adminStyle = false,
  triggerComponent,
}: {
  adminStyle?: boolean;
  triggerComponent?: React.ReactNode | React.ComponentType<any>;
}) {
  const { t } = useTranslation();
  const TriggerComponent = triggerComponent;
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [open, setOpen] = React.useState(false);

  const handleConfirm = async () => {
    setOpen(false);
    router.refresh();

    if (adminStyle) {
      await signOutAdmin();
      router.push("/admin/login");
      window.location.href = "/admin/login";
      return;
    }

    await signOutUser();
    router.push("/");
    window.location.href = "/";
  };

  const handleAdminLogout = async () => {
    const result = await Swal.fire({
      title: t('auth.logout'),
      text: t('auth.logoutConfirmMessage'),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#B32053",
      cancelButtonColor: "#d33",
      confirmButtonText: t('auth.logout'),
      cancelButtonText: t('common.cancel'),
    });

    if (!result.isConfirmed) return;

    dispatch(clearAdminProfile());
    await signOutAdmin();
    router.push("/admin/login");
    window.location.href = "/admin/login";
  };

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        onClick={() => {
          if (adminStyle) {
            void handleAdminLogout();
            return;
          }
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          if (adminStyle) {
            void handleAdminLogout();
            return;
          }
          setOpen(true);
        }}
        className="inline-flex"
      >
        {TriggerComponent ? (
          typeof TriggerComponent === "function" ? (
            <TriggerComponent />
          ) : (
            TriggerComponent
          )
        ) : (
          <div className="flex gap-1 items-center justify-start">
            <LogOut size={15} strokeWidth={2} color="#3F78D8" />
            <span className="block px-2 py-2 text-sm">{t('auth.logout')}</span>
          </div>
        )}
      </span>

      {!adminStyle ? (
        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          className="max-w-lg rounded-[16px] p-[24px] sm:p-[40px]"
        >
          <div className="flex flex-col justify-start items-center gap-[8px]">
            <div className="text-center w-full heading-text-style-4">{t('auth.logout')}</div>
            <div className="mt-2 plan-text-style-3 text-center">
              {t('auth.logoutAccountConfirm')}
            </div>

            <div className="mt-6 w-full">
              <div className="w-full grid grid-cols-2 gap-2">
                <Button variant="outline" className="col-span-1" onClick={() => setOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button className="col-span-1" onClick={handleConfirm}>
                  {t('auth.logout')}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
