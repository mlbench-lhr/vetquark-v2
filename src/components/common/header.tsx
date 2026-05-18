'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Search, Bell, ChevronLeft, ArrowLeft } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from "react-i18next";
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { RootState } from '@/store/store';
import Pusher from 'pusher-js';

interface HeaderProps {
    title: string;
    onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onBack }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();
    const [unreadCount, setUnreadCount] = useState(0);
    const profile = useAppSelector((s: RootState) => s.userProfile.profile);
    const userId = profile?.id || '';

    const refreshUnread = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications/unread_count', { method: 'GET' });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                setUnreadCount(0);
                return;
            }
            const next = Number(data?.count || 0);
            setUnreadCount(Number.isFinite(next) && next > 0 ? next : 0);
        } catch {
            setUnreadCount(0);
        }
    }, []);

    useEffect(() => {
        refreshUnread();
    }, [refreshUnread, userId]);

    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === 'visible') refreshUnread();
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [refreshUnread]);

    const handleBack = () => {
        if (typeof onBack === 'function') {
            onBack();
        } else {
            router.back();
        }
    };

    useEffect(() => {
        if (!userId) return;
        const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
        const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
        if (!key || !cluster) return;

        const pusher = new Pusher(key, { cluster, authEndpoint: '/api/pusher/auth' });
        const channelName = `private-notifications-${userId}`;
        const channel = pusher.subscribe(channelName);

        const handler = () => {
            setUnreadCount((prev) => (prev > 0 ? prev + 1 : 1));
        };
        channel.bind('notification:new', handler);

        return () => {
            channel.unbind('notification:new', handler);
            pusher.unsubscribe(channelName);
            pusher.disconnect();
        };
    }, [userId]);

    const notificationsHref = pathname?.toLowerCase().includes('guardian')
        ? '/Guardian/notifications'
        : '/Veterinarian/notifications';

    return (
        <div className="flex items-center justify-between py-2">
            {/* Left: back button + title */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                    onClick={handleBack}
                    aria-label={t("common.back")}
                    className="w-8.5 h-8.5 rounded-full bg-secondary flex items-center justify-center hover:bg-gray-200 flex-shrink-0"
                >
                    <ArrowLeft size={18} className="text-gray-700" />
                </button>
                <h1 className="text-[18px] font-bold text-primary truncate leading-tight">{title}</h1>
            </div>

            {/* Right: search + bell */}
            <div className="flex items-center gap-1 flex-shrink-0">
                <button
                    type="button"
                    aria-label={t("common.search") ?? "Search"}
                    className="w-7 h-7 flex items-center justify-center bg-white rounded-full"
                >
                    <Search size={16} className="text-primary" />
                </button>
                <Link href={"/Veterinarian/notifications"} className="relative w-7 h-7 bg-primary rounded-full flex items-center justify-center shrink-0">
                    {unreadCount > 0 ? (
                        <span className="absolute -top-0.5 -right-0.5 inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#EF4444] px-[3px] text-[9px] font-bold leading-none text-white ring-2 ring-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    ) : null}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </Link>
            </div>
        </div>
    );
};

export default Header;
