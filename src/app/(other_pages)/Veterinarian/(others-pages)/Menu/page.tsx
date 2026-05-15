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
    <div className="bg-[#F2F2F7] min-h-screen flex flex-col">
      <Header title={t("menu.menu")} />
      <div className="pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-[52px] w-[52px] overflow-hidden rounded-full bg-[#E8E8EE] flex-shrink-0">
              <Image width={100} height={100} src={avatarUrl} alt={name} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[16px] font-bold leading-[20px] text-[#1C1C1E]">
                {name}
              </div>
              <div className="truncate text-[13px] leading-[18px] text-[#8E8E93]">
                {email}
              </div>
            </div>
          </div>
          <Link
            href="/Veterinarian/Menu/EditProfile"
            className="flex h-8 items-center gap-1.5 rounded-lg bg-[#EBEBF0] border border-[#D1D1D6] px-3 text-[12px] font-medium text-[#1C1C1E] flex-shrink-0"
          >
            <Pencil className="h-3 w-3" />
            {t("menu.edit")}
          </Link>
        </div>
      </div>

      {/* Balance Card */}
      <div className="pt-4">
        {walletLoading ? (
          <BalanceCardSkeleton />
        ) : (
          <button
            onClick={() => {
              router.push("/Veterinarian/Menu/wallet")
            }}
            className="w-full rounded-2xl bg-[#3F78D8] px-5 py-4 text-left transition-colors hover:opacity-95"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Wallet className="h-[14px] w-[14px] text-white" />
                  <span className="text-[13px] font-medium text-white">
                    {t("wallet.availableBalance")}
                  </span>
                </div>
                <p className="text-[26px] font-bold text-white leading-[30px]">
                  {currency} {balance}
                </p>
              </div>
              <ChevronRight className="h-6 w-6 text-white" />
            </div>
          </button>
        )}
      </div>

      <div className="flex-1 pt-5">
        <div className="space-y-0">
          {menuItems.map((item) => {
            const row = (
              <div className="flex w-full items-start gap-4 py-3">
                <div className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-full bg-[#E5EDF9]">
                  <item.icon className="h-[20px] w-[20px] text-[#3F78D8]" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="text-[15px] font-semibold leading-[19px] text-[#1C1C1E]">
                    {item.title}
                  </div>
                  <div className="mt-0.5 text-[12px] leading-[15px] text-[#8E8E93]">
                    {item.description}
                  </div>
                </div>
              </div>
            );

            return (
              <Link key={item.id} href={"/Veterinarian/Menu/" + item.id} className="block">
                {row}
              </Link>
            );
          })}
        </div>

        <div className="my-3 h-px w-full bg-[#D1D1D6]" />

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-4 py-3 text-[#1C1C1E]"
        >
          <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#EBEBF0]">
            <LogOut className="h-[20px] w-[20px] text-[#1C1C1E]" />
          </div>
          <div className="text-[15px] font-semibold leading-[19px]">{t("common.logout")}</div>
        </button>
      </div>
    </div>
  );
}
