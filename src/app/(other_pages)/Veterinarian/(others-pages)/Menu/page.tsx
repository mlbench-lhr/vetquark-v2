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
    <div className="flex flex-col">
      {/* Header Section */}
      <Header title={t("menu.menu")} />
      <div className="px- pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-amber-400">
              <Image
                width={58}
                height={58}
                src={avatarUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">{name}</h2>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
          <Link
            href={"/Veterinarian/Menu/EditProfile"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            {t("menu.edit")}
          </Link>
        </div>
      </div>

      {/* Balance Card */}
      <div className=" pb-4">
        {walletLoading ? (
          <BalanceCardSkeleton />
        ) : (
          <button
            onClick={() => {
              router.push("/Veterinarian/Menu/wallet")
            }}
            className="w-full bg-primary rounded-2xl p-4 text-left hover:bg-primary/90 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center">
                    <Wallet className="h-3 w-3 text-primary-foreground" />
                  </div>
                  <span className="text-sm text-primary-foreground/80">
                    {t("wallet.availableBalance")}
                  </span>
                </div>
                <p className="text-2xl font-bold text-primary-foreground">
                  {currency} {balance}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-primary-foreground" />
            </div>
          </button>
        )}
      </div>

      {/* Menu Items */}
      <div className="flex-1">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              href={"/Veterinarian/Menu/" + item.id}
              key={item.id}
              className="w-full flex items-center gap-3 py-3.5 hover:bg-muted/50 rounded-lg transition-colors px-1"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          ))}
        </div>

        {/* Separator */}
        <div className="my-4 border-t border-border" />

        {/* Logout */}
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 py-3.5 hover:bg-muted/50 rounded-lg transition-colors px-1"
        >
          <div className="w-10 h-10 rounded-full bg-[#F5F6F6] flex items-center justify-center flex-shrink-0">
            <LogOut className="h-5 w-5 text-[#839297]" />
          </div>
          <p className="text-sm font-medium text-foreground">{t("common.logout")}</p>
        </button>
      </div>

      {/* Footer */}
      <div className="py-6 text-center">
        <p className="text-xs text-muted-foreground">{t("common.copyright")}</p>
      </div>
    </div>
  );
}
