// components/Header.tsx
'use client';
import React from 'react';
import Image from 'next/image';
import WithdrawModal from '@/components/Modals/WithdrawModal';
import { useModal } from '@/hooks/useModal';
import { useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store/store';
import { User, User2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import Pusher from 'pusher-js';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  userName?: string;
  balance: string;
}

const Header: React.FC<HeaderProps> = ({ userName, balance }) => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();
  const profile = useAppSelector((s: RootState) => s.userProfile.profile);
  const resolvedName = profile?.fullName || userName || t('common.user');
  const userId = profile?.id || '';
  const [unreadCount, setUnreadCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState<string>(balance || "R$ 0.00");

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
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/wallet", { credentials: "include" });
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (res.ok && data && typeof data.balanceLabel === "string") {
          setWalletBalance(String(data.balanceLabel));
        }
      } catch {
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshUnread();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [refreshUnread]);

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href={"/Veterinarian/Menu"} className="w-12 h-12 border rounded-full flex items-center justify-center ">
          {profile?.profileImageUrl ? (
            <Image
              width={58}
              height={58}
              src={profile.profileImageUrl}
              alt={t('common.profile')}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className='flex justify-center items-center w-12 h-12 rounded-full bg-gray-100'>
              <User2 />
            </div>
          )}
        </Link>
        <div>
          <p className="text-sm text-gray-500">{t('dashboard.welcome')}</p>
          <h1 className="text-sm font-semibold text-gray-800">{resolvedName}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center justify-center py-1 px-3 rounded-full border border-primary/40 bg-white">
          <span className="text-primary/70 text-[10px] leading-3 font-medium">
            {t('dashboard.balance')}
          </span>
          <span className="text-primary font-bold text-sm leading-4">
            {walletBalance}
          </span>
        </div>

        <Link href={"/Veterinarian/notifications"} className="relative w-10 h-10 bg-primary rounded-full flex items-center justify-center shrink-0">
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-white border border-primary text-primary text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
      <WithdrawModal
        isOpen={isOpen}
        onClose={() => closeModal()}
        onUpdated={() => console.log('Withdrawal completed')}
      />
    </header>
  );
};

export default Header;
