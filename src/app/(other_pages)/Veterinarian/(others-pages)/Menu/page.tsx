'use client'
import Header from "@/components/common/header";
import {
  Pencil,
  ChevronRight,
  DollarSign,
  FileText,
  ClipboardList,
  Building2,
  Lock,
  Bell,
  Languages,
  LogOut,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { UserContext } from "@/context/authContext";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { toast } from "react-toastify";
import { BalanceCardSkeleton } from "@/components/ui/skeleton";

export default function MenuPage() {
  const router = useRouter()
  const profile = useAppSelector((s) => s.userProfile.profile);
  const { logout } = useContext(UserContext);
  const { t } = useTranslation();

  const name = profile?.fullName ?? t("common.user");
  const email = profile?.email ?? "";
  const avatarUrl =
    profile?.profileImageUrl ??
    "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png";
  const [balance, setBalance] = useState("0.00");
  const [currency, setCurrency] = useState("R$");
  const [walletLoading, setWalletLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setWalletLoading(true);
        const res = await fetch("/api/wallet");
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) {
          toast.error(typeof data?.error === "string" ? data.error : t("wallet.failedToLoad"));
          return;
        }
        const currency = String(data?.currency || "BRL");
        const balanceNumber = typeof data?.balance === "number" ? data.balance : 0;
        setCurrency(currency === "BRL" ? "R$" : currency);
        setBalance(balanceNumber.toFixed(2));
      } catch {
        toast.error(t("common.networkError"));
      } finally {
        if (mounted) setWalletLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const menuItems = useMemo(
    () => [
      {
        id: "pricing",
        icon: DollarSign,
        title: t("menu.pricing"),
        description: t("menu.pricingDesc"),
      },
      {
        id: "fee-payouts",
        icon: FileText,
        title: t("menu.feePayouts"),
        description: t("menu.feePayoutsDesc"),
      },
      {
        id: "tax-profile",
        icon: ClipboardList,
        title: t("menu.taxProfile"),
        description: t("menu.taxProfileDesc"),
      },
      {
        id: "clinic-reports",
        icon: Building2,
        title: t("menu.clinicReports"),
        description: t("menu.clinicReportsDesc"),
      },
      {
        id: "security",
        icon: Lock,
        title: t("menu.security"),
        description: t("menu.securityDesc"),
      },
      {
        id: "notifications",
        icon: Bell,
        title: t("menu.notifications"),
        description: t("menu.notificationsDesc"),
      },
      {
        id: "language",
        icon: Languages,
        title: t("menu.language"),
        description: t("menu.languageDesc"),
      },
    ],
    [t]
  );

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Header title={t("menu.menu")} />
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-full bg-[#F5F6F6]">
              <Image width={100} height={100} src={avatarUrl} alt={name} className="h-full w-full object-cover" />
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
            href="/Veterinarian/Menu/EditProfile"
            className="flex h-10 items-center gap-2 rounded-full bg-[#F5F6F6] px-5 text-[14px] font-medium text-[#111827]"
          >
            <Pencil className="h-4 w-4" />
            {t("menu.edit")}
          </Link>
        </div>
      </div>

      {/* Balance Card */}
      <div className="mx-4 pt-5 pb-2">
        {walletLoading ? (
          <BalanceCardSkeleton />
        ) : (
          <button
            onClick={() => {
              router.push("/Veterinarian/Menu/wallet")
            }}
            className="w-full rounded-2xl bg-[#4A7BF7] p-4 text-left transition-colors hover:bg-[#3A6BE7]"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-white/20">
                    <Wallet className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[13px] text-white/80">
                    {t("wallet.availableBalance")}
                  </span>
                </div>
                <p className="text-[24px] font-bold text-white">
                  {currency} {balance}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-white" />
            </div>
          </button>
        )}
      </div>

      <div className="flex-1 px-4 pt-5">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const row = (
              <div className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 transition-colors hover:bg-[#F5F6F6]">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#EAF1FF]">
                  <item.icon className="h-5 w-5 text-[#3F78D8]" />
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

            return (
              <Link key={item.id} href={"/Veterinarian/Menu/" + item.id} className="block">
                {row}
              </Link>
            );
          })}
        </div>

        <div className="my-5 h-px w-full bg-[#E5E7EB]" />

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-4 rounded-2xl px-4 py-3 text-[#9AA4AF] transition-colors hover:bg-[#F5F6F6]"
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
