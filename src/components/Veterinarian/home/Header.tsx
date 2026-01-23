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

interface HeaderProps {
  userName?: string;
  balance: string;
}

const Header: React.FC<HeaderProps> = ({ userName, balance }) => {
  const { isOpen, openModal, closeModal } = useModal();
  const profile = useAppSelector((s: RootState) => s.userProfile.profile);
  const resolvedName = profile?.fullName || userName || 'User';
  const userId = profile?.id || '';
  const [unreadCount, setUnreadCount] = useState(0);

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
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className='flex justify-center items-center w-12 h-12 rounded-full bg-gray-100'>
              <User2 />
            </div>
          )}
        </Link>
        <div>
          <p className="text-sm text-gray-500">Welcome,</p>
          <h1 className="text-sm font-semibold text-gray-800">{resolvedName}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3" >
        <div className="bg-gray-100 flex flex-col text-sm py-0.5 pl-2 pr-4 rounded-lg cursor-pointer"
          onClick={() => openModal()}>
          <span className="text-tertiary text-xs">
            Balance
          </span>
          <span className="py-1 text-primary font-bold text-center">
            R{balance}
          </span>
        </div>

        <Link href={"/Veterinarian/notifications"} className="relative w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
          {unreadCount > 0 ? <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500" /> : null}
          <span className="text-white text-sm">
            <Image
              src={"/images/home/bell.svg"}
              alt="Bell icon"
              width={24}
              height={24}
            />
          </span>
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
