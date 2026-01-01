'use client';
import React, { useState } from 'react';
import { ArrowLeft, Search, Bell, Edit2, Eye, Download, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Header Component
interface HeaderProps {
    title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
    const router = useRouter();
    const onBack = () => {
        router.back();
    };
    return (
        <div className="flex items-center justify-between p-4 ">
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                >
                    <ArrowLeft size={20} className="text-gray-700" />
                </button>
                <h1 className="text-xl font-bold text-primary">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
                <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                    <Search size={20} className="text-primary" />
                </button>
                <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-blue-700">
                    <Bell size={20} className="text-white" />
                </button>
            </div>
        </div>
    );
};

export default Header;