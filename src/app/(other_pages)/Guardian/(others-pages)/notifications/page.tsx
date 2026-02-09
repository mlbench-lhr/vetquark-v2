"use client";

import { ChevronLeft, CreditCard } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Pusher from "pusher-js";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { ListItemSkeleton } from "@/components/ui/skeleton";
import { FallbackText } from "@/components/ui/fallback-text";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  url: string;
  readAt: string | null;
  createdAt: string | null;
};

function timeLabel(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function GuardianNotificationsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        const me = await meRes.json().catch(() => null);
        if (mounted && meRes.ok && typeof me?.profile?.id === "string") setUserId(me.profile.id);

        const res = await fetch("/api/notifications/list", { method: "GET", credentials: "include" });
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) {
          toast.error(typeof data?.error === "string" ? data.error : t("notifications.failedToLoad"));
          return;
        }
        if (Array.isArray(data?.items)) setItems(data.items);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster || !userId) return;

    const pusher = new Pusher(key, {
      cluster,
      authEndpoint: "/api/pusher/auth",
    });

    const channelName = `private-notifications-${userId}`;
    const channel = pusher.subscribe(channelName);

    const handler = (payload: any) => {
      const next: NotificationItem = {
        id: String(payload?.id || ""),
        type: String(payload?.type || ""),
        title: String(payload?.title || ""),
        message: String(payload?.message || ""),
        url: String(payload?.url || ""),
        readAt: null,
        createdAt: typeof payload?.createdAt === "string" ? payload.createdAt : new Date().toISOString(),
      };
      setItems((prev) => [next, ...prev]);
      if (next.title) toast.info(next.title);
    };

    if (channel) channel.bind("notification:new", handler);

    return () => {
      channel.unbind("notification:new", handler);
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [userId]);

  const displayItems = useMemo(() => items, [items]);

  return (
    <div className="bg-white min-h-scree">
      <div className="px- pt-[calc(env(safe-area-inset-top)+14px) pb-4">
        <div className="relative flex items-center justify-center">
          <button type="button" onClick={() => router.back()} className="absolute left-0 top-1/2 -translate-y-1/2 p-1">
            <ChevronLeft className="h-6 w-6 text-[#111827]" />
          </button>
          <div className="text-[16px] leading-[20px] font-medium text-[#111827]">{t("notifications.title")}</div>
        </div>
      </div>

      <div className="px- pb-8">
        {loading ? (
          <>
            <ListItemSkeleton />
            <ListItemSkeleton />
            <ListItemSkeleton />
            <ListItemSkeleton />
          </>
        ) : displayItems.length === 0 ? (
          <FallbackText>{t("notifications.noNotificationsYet")}</FallbackText>
        ) : (
          <div>
            {displayItems.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={async () => {
                  if (!n.readAt) {
                    await fetch("/api/notifications/mark_read", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ ids: [n.id] }),
                    }).catch(() => null);
                    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
                  }
                  if (n.url) router.push(n.url);
                }}
                className="w-full text-left flex items-start gap-3 py-4 border-b border-[#F3F4F6] last:border-b-0"
              >
                <div
                  className="h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: n.readAt ? "#F3F4F6" : "#ECFDF5" }}
                >
                  <CreditCard className="h-5 w-5" style={{ color: n.readAt ? "#6B7280" : "#22C55E" }} />
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="text-[14px] leading-[18px] font-semibold text-[#111827] truncate">{n.title}</div>
                  <div className="mt-1 text-[12px] leading-[16px] text-[#9CA3AF]">{n.message}</div>
                </div>
                <div className="text-[12px] leading-[16px] text-[#9CA3AF] flex-shrink-0 pt-0.5">{timeLabel(n.createdAt)}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
