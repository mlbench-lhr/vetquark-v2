// components/Header.tsx
import React from 'react';
import Image from 'next/image';
import { Bell } from 'lucide-react';

interface HeaderProps {
  userName: string;
  balance: string;
}

const Header: React.FC<HeaderProps> = ({ userName, balance }) => {
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
      <div className="flex items-center gap-3">
        <div className="grid grid-cols-2 border-2 border-blue-300 rounded-full overflow-hidden text-sm w-fit">
          <span className="px-3 py-1 bg-[#3F78D829] text-primary font-semibold text-center">
            Balance
          </span>
          <span className="py-1 text-primary font-bold text-center">
            {balance}
          </span>
        </div>

        <button className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
          <span className="text-white text-sm"><Bell size={20}/></span>
        </button>
      </div>
    </header>
  );
};

export default Header;