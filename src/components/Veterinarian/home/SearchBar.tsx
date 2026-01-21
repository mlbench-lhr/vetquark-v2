// components/SearchBar.tsx
'use client'
import StoreModal from '@/components/Modals/StoreModal';
import { useModal } from '@/hooks/useModal';
import { ShoppingCartIcon } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

const SearchBar: React.FC = () => {
  const { isOpen, openModal, closeModal } = useModal();
  return (
    <div className="mt-2 flex items-center gap-3">
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="Search for patient or exam..."
          className="w-full px-4 py-3 pl-12  rounded-xl focus:outline-none focus:border-primary bg-gray-100"
        />
        <svg
          className="w-5 h-5 text-primary absolute left-4 top-1/2 -translate-y-1/2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <Link href={"/Veterinarian/store"} className="px-4 py-3 rounded-xl flex items-center gap-2 bg-gray-100" >
        <ShoppingCartIcon className="w-5 h-5 text-primary" />
        <span className="text-black font-light">Store</span>
      </Link>

    </div>
  );
};

export default SearchBar;