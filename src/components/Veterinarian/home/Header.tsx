// components/Header.tsx
'use client';
import React from 'react';
import Image from 'next/image';
import { Bell } from 'lucide-react';
import WithdrawModal from '@/components/Modals/WithdrawModal';
import { useModal } from '@/hooks/useModal';

interface HeaderProps {
  userName: string;
  balance: string;
}

const Header: React.FC<HeaderProps> = ({ userName, balance }) => {
  const { isOpen, openModal, closeModal } = useModal();
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 border rounded-full flex items-center justify-center">
          <span className="text-2xl">👨</span>
        </div>
        <div>
          <p className="text-sm text-gray-500">Welcome,</p>
          <h1 className="text-sm font-semibold text-gray-800">{userName}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3" onClick={() => openModal()}>
        <div className="bg-gray-100 flex flex-col text-sm py-0.5 pl-2 pr-4 rounded-lg">
          <span className="text-tertiary text-xs">
            Balance
          </span>
          <span className="py-1 text-primary font-bold text-center">
            R{balance}
          </span>
        </div>

        <button className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-white text-sm">
            <Image
              src={"/images/home/bell.svg"}
              alt="Bell icon"
              width={24}
              height={24}
            />
          </span>
        </button>
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