'use client'
import Header from "@/components/common/header";
import {
  Pencil,
  ChevronRight,
  Lock,
  Bell,
  LogOut,
  Languages,
  IdCard,
  LifeBuoy,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useMemo } from "react";
import { toast } from "react-toastify";
import { useAppSelector } from "@/store/hooks";
import { UserContext } from "@/context/authContext";

type MenuItem = {
  id: string;
  title: string;
  description: string;
  href?: string;
  icon:
    | { kind: "lucide"; Component: typeof Lock }
    | { kind: "text"; value: string };
};

export default function MenuPage() {
  const router = useRouter();
  const profile = useAppSelector((s) => s.userProfile.profile);
  const { logout } = useContext(UserContext);

  const name = profile?.fullName ?? "User";
  const email = profile?.email ?? "";
  const avatarUrl =
    profile?.profileImageUrl ??
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face";

  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        id: "payment-methods",
        title: "Payment Methods",
        description: "Manage your payment details for exam fee",
        href: "/Guardian/Menu/wallet/bankDetails",
        icon: { kind: "text", value: "R$" },
      },
      {
        id: "id-address",
        title: "ID & Address Info",
        description: "Update your id info & profile",
        href: "/Guardian/Menu/tax-profile",
        icon: { kind: "lucide", Component: IdCard },
      },
      {
        id: "change-language",
        title: "Change Language",
        description: "Update your language preferences",
        href: "/Guardian/Menu/language",
        icon: { kind: "lucide", Component: Languages },
      },
      {
        id: "security",
        title: "Security",
        description: "Manage your security & sessions",
        href: "/Guardian/Menu/security",
        icon: { kind: "lucide", Component: Lock },
      },
      {
        id: "notifications",
        title: "Notifications",
        description: "Manage notification alerts",
        href: "/Guardian/Menu/notifications",
        icon: { kind: "lucide", Component: Bell },
      },
      {
        id: "help-centre",
        title: "Help Centre",
        description: "Get info regarding platform",
        href: "/Guardian/Menu/help-centre",
        icon: { kind: "lucide", Component: LifeBuoy },
      },
    ],
    [],
  );

  const handleMenuItemClick = (item: MenuItem) => {
    if (item.href) {
      router.push(item.href);
      return;
    }
    toast.info("Coming soon");
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Header title="Menu" />
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-full bg-[#F5F6F6]">
              <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[20px] font-semibold leading-[24px] text-[#111827]">
                {name}
              </div>
              <div className="truncate text-[14px] leading-[18px] text-[#9AA4AF]">
                {email}
              </div>
            </div>
          </div>
          <Link
            href="/Guardian/Menu/EditProfile"
            className="flex h-10 items-center gap-2 rounded-full bg-[#F5F6F6] px-5 text-[14px] font-medium text-[#111827]"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const iconNode =
              item.icon.kind === "text" ? (
                <span className="text-[16px] font-semibold leading-none text-[#3F78D8]">
                  {item.icon.value}
                </span>
              ) : (
                <item.icon.Component className="h-5 w-5 text-[#3F78D8]" />
              );

            const row = (
              <div className="flex w-full items-center gap-4 rounded-2xl px-2 py-3 transition-colors hover:bg-[#F5F6F6]">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#EAF1FF]">
                  {iconNode}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[16px] font-medium leading-[20px] text-[#111827]">
                    {item.title}
                  </div>
                  <div className="mt-1 truncate text-[13px] leading-[16px] text-[#9AA4AF]">
                    {item.description}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 flex-shrink-0 text-[#3F78D8]" />
              </div>
            );

            if (item.href) {
              return (
                <Link key={item.id} href={item.href} className="block">
                  {row}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleMenuItemClick(item)}
                className="block w-full text-left"
              >
                {row}
              </button>
            );
          })}
        </div>

        <div className="my-5 h-px w-full bg-[#E5E7EB]" />

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-4 rounded-2xl px-2 py-3 text-[#9AA4AF] transition-colors hover:bg-[#F5F6F6]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F5F6F6]">
            <LogOut className="h-5 w-5 text-[#9AA4AF]" />
          </div>
          <div className="text-[16px] font-medium leading-[20px]">Log out</div>
        </button>
      </div>
    </div>
  );
}
