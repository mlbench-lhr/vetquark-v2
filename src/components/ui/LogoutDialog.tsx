
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import React from "react";
import { Button } from "./button";
import { Modal } from "@/components/ui/modal";

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

export default function LogoutDialog({
  adminStyle = false,
  triggerComponent,
}: {
  adminStyle?: boolean;
  triggerComponent?: React.ReactNode | React.ComponentType<any>;
}) {
  const TriggerComponent = triggerComponent;
  const router = useRouter();
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

  return (
    <>
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
            <LogOut size={15} strokeWidth={2} color="#3F78D8" />
            <span className="block px-2 py-2 text-sm">Logout</span>
          </div>
        )}
      </span>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        className="max-w-lg rounded-[16px] p-[24px] sm:p-[40px]"
      >
        <div className="flex flex-col justify-start items-center gap-[8px]">
          <div className="text-center w-full heading-text-style-4">Logout</div>
          <div className="mt-2 plan-text-style-3 text-center">
            Are you sure you want to logout this account?
          </div>

          <div className="mt-6 w-full">
            <div className="w-full grid grid-cols-2 gap-2">
              <Button variant="outline" className="col-span-1" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button className="col-span-1" onClick={handleConfirm}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
