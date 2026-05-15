'use client';

import {
  Check,
  ClipboardList,
  CreditCard,
  UserPlus,
  User,
  Users,
  Camera,
  ShoppingBag,
  Receipt,
  Bell,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Pusher from 'pusher-js';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store/store';
import Header from '@/components/Veterinarian/home/Header';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  url: string;
  readAt: string | null;
  createdAt: string | null;
};

interface ProfileData {
  fullName?: string;
  profileImageUrl?: string;
  id?: string;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'payment_link':
    case 'payment_received':
    case 'payment_success':
      return Receipt;
    case 'patient_created':
    case 'patient_added':
      return UserPlus;
    case 'patient_updated':
      return User;
    case 'reading_created':
    case 'reading_viewed':
      return ClipboardList;
    case 'reading_signed':
      return Check;
    case 'guardian_updated':
      return Users;
    case 'profile_picture_updated':
      return Camera;
    case 'order_created':
      return ShoppingBag;
    default:
      return ClipboardList;
  }
}

function formatDateLabel(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}

function groupByDate(items: NotificationItem[]): Map<string, NotificationItem[]> {
  const map = new Map<string, NotificationItem[]>();
  for (const item of items) {
    if (!item.createdAt) continue;
    const d = new Date(item.createdAt);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString();
    const existing = map.get(key) || [];
    existing.push(item);
    map.set(key, existing);
  }
  return map;
}

export default function VetNotificationsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const reduxProfile = useAppSelector((s: RootState) => s.userProfile.profile);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [walletBalance, setWalletBalance] = useState('R$ 0,00');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);

        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        const me = await meRes.json().catch(() => null);
        if (mounted && meRes.ok && me?.profile) {
          setProfile({
            fullName: typeof me.profile.fullName === 'string' ? me.profile.fullName : '',
            profileImageUrl: typeof me.profile.profileImageUrl === 'string' ? me.profile.profileImageUrl : '',
            id: typeof me.profile.id === 'string' ? me.profile.id : '',
          });
          if (typeof me.profile.id === 'string') setUserId(me.profile.id);
        }

        const res = await fetch('/api/notifications/list', { method: 'GET', credentials: 'include' });
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) {
          toast.error(typeof data?.error === 'string' ? data.error : t('notifications.failedToLoad'));
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
  }, [t]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/wallet', { credentials: 'include' });
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (res.ok && data && typeof data.balance === 'number') {
          const num = data.balance as number;
          setWalletBalance(
            `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          );
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/notifications/unread_count', { method: 'GET' });
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (res.ok) {
          const next = Number(data?.count || 0);
          setUnreadCount(Number.isFinite(next) && next > 0 ? next : 0);
        }
      } catch {
        // ignore
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
      authEndpoint: '/api/pusher/auth',
    });

    const channelName = `private-notifications-${userId}`;
    const channel = pusher.subscribe(channelName);

    const handler = (payload: any) => {
      const next: NotificationItem = {
        id: String(payload?.id || ''),
        type: String(payload?.type || ''),
        title: String(payload?.title || ''),
        message: String(payload?.message || ''),
        url: String(payload?.url || ''),
        readAt: null,
        createdAt: typeof payload?.createdAt === 'string' ? payload.createdAt : new Date().toISOString(),
      };
      setItems((prev) => [next, ...prev]);
      setUnreadCount((prev) => (prev > 0 ? prev + 1 : 1));
      if (next.title) toast.info(next.title);
    };

    if (channel) channel.bind('notification:new', handler);

    return () => {
      channel.unbind('notification:new', handler);
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [userId]);

  const resolvedName = profile?.fullName || reduxProfile?.fullName || t('common.user');
  const resolvedAvatar = profile?.profileImageUrl || reduxProfile?.profileImageUrl || '';

  const grouped = useMemo(() => {
    const map = groupByDate(items);
    const sortedKeys = Array.from(map.keys()).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
    return sortedKeys.map((key) => ({
      dateKey: key,
      label: formatDateLabel(key),
      notifications: (map.get(key) || []).sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      ),
    }));
  }, [items]);

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.readAt) {
      await fetch('/api/notifications/mark_read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: [n.id] }),
      }).catch(() => null);
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x))
      );
      setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
    }
    if (n.url) router.push(n.url);
  };

  return (
    <div className="pb-6 -mx-4 -mt-4 px-4 pt-4 bg-white">
      <Header userName={profile?.fullName} />
      {/* Notifications grouped by date */}
      <div className="space-y-5 mt-5">
        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gray-100 animate-pulse" />
                <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="border-t border-gray-50" />
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gray-100 animate-pulse" />
                <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F0F4F8] flex items-center justify-center">
              <Bell className="w-7 h-7 text-[#9CA3AF]" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-[#9CA3AF]">{t('notifications.noNotificationsYet')}</p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.dateKey}>
              <h2 className="text-[15px] font-normal text-black/70 mb-2.5">{group.label}</h2>
              <div className="bg-white rounded-2xl shadow-[0_2px_14px_rgba(0,0,0,0.07)] overflow-hidden">
                {group.notifications.map((n, idx) => {
                  const Icon = getNotificationIcon(n.type);
                  const isRead = !!n.readAt;
                  const isLast = idx === group.notifications.length - 1;

                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3.5 transition-colors ${isLast ? '' : 'border-b border-[#F3F4F6]'
                        }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isRead ? 'bg-[#F3F4F6]' : 'bg-gray-100'
                          }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${isRead ? 'text-[#9CA3AF]' : 'text-primary'}`}
                          strokeWidth={2}
                        />
                      </div>
                      <p
                        className={`text-[12px] leading-[18px] font-medium flex-1 min-w-0 truncate ${isRead ? 'text-[#9CA3AF]' : 'text-primary'
                          }`}
                      >
                        {n.message}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
