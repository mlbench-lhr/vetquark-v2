// components/BalanceCard.tsx
'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import StoreModal from '@/components/Modals/StoreModal';

const BalanceCard: React.FC = () => {
  const { t } = useTranslation();
  const [walletBalance, setWalletBalance] = useState<string>('R$ 0,00');
  const [storeOpen, setStoreOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/wallet', { credentials: 'include' });
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (res.ok && data && typeof data.balanceLabel === 'string') {
          setWalletBalance(String(data.balanceLabel));
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="rounded-2xl bg-primary p-5 mt-5">
      {/* Top row: label + store button */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold tracking-wider text-white/80 uppercase">
          {t('dashboard.availableBalance')}
        </span>
        <button
          type="button"
          onClick={() => setStoreOpen(true)}
          className="flex items-center gap-1.5 bg-white/20 rounded-lg px-3 py-1.5 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
          </svg>
          <span className="text-white text-xs font-semibold">{t('dashboard.store')}</span>
        </button>
      </div>

      {/* Balance amount */}
      <div className="flex items-baseline gap-1.5 mb-4">
        <span className="text-white/70 text-sm font-medium">R$</span>
        <span className="text-white text-[36px] font-bold leading-none tracking-tight">
          {walletBalance.replace('R$', '').replace('R$ ', '').trim()}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Link
          href="/Veterinarian/wallet"
          className="flex-1 bg-white text-primary font-semibold text-sm py-2.5 rounded-xl text-center"
        >
          {t('dashboard.withdraw')}
        </Link>
        <Link
          href="/Veterinarian/wallet"
          className="flex-1 bg-white/20 text-white font-semibold text-sm py-2.5 rounded-xl text-center"
        >
          {t('dashboard.withdrawalHistory')}
        </Link>
      </div>
      <StoreModal isOpen={storeOpen} onClose={() => setStoreOpen(false)} />
    </div>
  );
};

export default BalanceCard;
