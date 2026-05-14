// components/Header.tsx
'use client';
import React from 'react';
import Image from 'next/image';
import { useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store/store';
import { User2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import Pusher from 'pusher-js';
import { useTranslation } from 'react-i18next';
import SaldoModal from './SaldoModal';

interface HeaderProps {
  userName?: string;
}

const Header: React.FC<HeaderProps> = ({ userName }) => {
  const { t } = useTranslation();
  const profile = useAppSelector((s: RootState) => s.userProfile.profile);
  const resolvedName = profile?.fullName || userName || t('common.user');
  const userId = profile?.id || '';
  const [unreadCount, setUnreadCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState('R$ 0,00');
  const [saldoOpen, setSaldoOpen] = useState(false);

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
      }
    })();
    return () => { mounted = false; };
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
    <>
      <SaldoModal isOpen={saldoOpen} onClose={() => setSaldoOpen(false)} />
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={"/Veterinarian/Menu"} className="w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            {profile?.profileImageUrl ? (
              <Image
                width={58}
                height={58}
                src={profile.profileImageUrl}
                alt={t('common.profile')}
                className="w-12 h-12 rounded-full object-cover border-2 border-amber-400"
              />
            ) : (
              <div className='flex justify-center items-center w-12 h-12 rounded-full bg-gray-100'>
                <User2 />
              </div>
            )}
          </Link>
          <div>
            <p className="text-xs text-gray-400 leading-tight">{t('dashboard.welcome')}</p>
            <h1 className="text-sm font-bold text-primary leading-tight">{resolvedName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Saldo pill */}
          <button
            type="button"
            onClick={() => setSaldoOpen(true)}
            className="flex items-center gap-1.5 bg-[#EBF2FF] border border-[#BFDBFE] rounded-full pl-2.5 pr-3 py-1.5 shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#2563EB" strokeWidth="1.8" />
              <path d="M12 7v1m0 8v1M9.5 9.5C9.5 8.67 10.67 8 12 8s2.5.67 2.5 1.5S13.33 11 12 11s-2.5.83-2.5 1.5S10.67 16 12 16s2.5-.67 2.5-1.5" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] font-medium text-blue-700 leading-none">Saldo</span>
            <span className="text-[11px] font-bold text-primary leading-none">{walletBalance}</span>
          </button>

          <Link href={"/Veterinarian/notifications"} className="relative w-10 h-10 bg-primary rounded-full flex items-center justify-center shrink-0">
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
      </header>
    </>
  );
};

export default Header;
