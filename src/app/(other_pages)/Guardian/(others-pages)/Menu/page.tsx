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
import { useTranslation } from "react-i18next";
import Image from "next/image";

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
  const { t } = useTranslation();

  const name = profile?.fullName ?? t("common.user");
  const email = profile?.email ?? "";
  const avatarUrl =
    profile?.profileImageUrl ??
    "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png";

  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        id: "payment-methods",
        title: t("menu.paymentMethods"),
        description: t("menu.paymentMethodsDesc"),
        href: "/Guardian/Menu/wallet/bankDetails",
        icon: { kind: "text", value: "R$" },
      },
      {
        id: "id-address",
        title: t("menu.idAddressInfo"),
        description: t("menu.idAddressInfoDesc"),
        href: "/Guardian/Menu/tax-profile",
        icon: { kind: "lucide", Component: IdCard },
      },
      {
        id: "change-language",
        title: t("menu.changeLanguage"),
        description: t("menu.languageDesc"),
        href: "/Guardian/Menu/language",
        icon: { kind: "lucide", Component: Languages },
      },
      {
        id: "security",
        title: t("menu.security"),
        description: t("menu.securityDesc"),
        href: "/Guardian/Menu/security",
        icon: { kind: "lucide", Component: Lock },
      },
      {
        id: "notifications",
        title: t("menu.notifications"),
        description: t("menu.notificationsDesc"),
        href: "/Guardian/Menu/notifications",
        icon: { kind: "lucide", Component: Bell },
      },
      {
        id: "help-centre",
        title: t("menu.helpCentre"),
        description: t("menu.helpCentreDesc"),
        href: "/Guardian/Menu/help-centre",
        icon: { kind: "lucide", Component: LifeBuoy },
      },
    ],
    [t],
  );

  const handleMenuItemClick = (item: MenuItem) => {
    if (item.href) {
      router.push(item.href);
      return;
    }
    toast.info(t("common.comingSoon"));
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Header title={t("menu.menu")} />
      <div className="px- pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-full bg-[#F5F6F6]">
              <Image width={100} height={100} src={avatarUrl} alt={name} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[20px] font-semibold leading-[24px] text-black/70">
                {name}
              </div>
              <div className="truncate text-[14px] leading-[18px] text-[#9AA4AF]">
                {email}
              </div>
            </div>
          </div>
          <Link
            href="/Guardian/Menu/EditProfile"
            className="flex h-10 items-center gap-2 rounded-full bg-[#F5F6F6] px-5 text-[14px] font-medium text-black/70"
          >
            <Pencil className="h-4 w-4" />
            {t("menu.edit")}
          </Link>
        </div>
      </div>

      <div className="flex-1 px- pt-5">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const iconNode =
              item.icon.kind === "text" ? (
                <span className="text-[16px] font-semibold leading-none text-primary">
                  {item.icon.value}
                </span>
              ) : (
                <item.icon.Component className="h-5 w-5 text-primary" />
              );

            const row = (
              <div className="flex w-full items-center gap-4 rounded-2xl px- py-3 transition-colors hover:bg-[#F5F6F6]">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#EAF1FF]">
                  {iconNode}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[16px] font-medium leading-[20px] text-black/70">
                    {item.title}
                  </div>
                  <div className="mt-1 truncate text-[13px] leading-[16px] text-[#9AA4AF]">
                    {item.description}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 flex-shrink-0 text-primary" />
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
          className="flex items-center gap-4 rounded-2xl px- py-3 text-[#9AA4AF] transition-colors hover:bg-[#F5F6F6]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F5F6F6]">
            <LogOut className="h-5 w-5 text-[#9AA4AF]" />
          </div>
          <div className="text-[16px] font-medium leading-[20px]">{t("common.logout")}</div>
        </button>
      </div>
    </div>
  );
}
