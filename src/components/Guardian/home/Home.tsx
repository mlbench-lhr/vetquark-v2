'use client';

// app/page.tsx
import { Bell, ChevronRight, FileText, Search } from 'lucide-react';
import { CurrentHealthProps, HeaderProps, PetSelectorProps, RecentHistoryProps, TrendsProps } from './types';
import { useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store/store';
import Image from 'next/image';
import Link from 'next/link';
import { ReportCard } from '@/app/(other_pages)/Veterinarian/(others-pages)/home/patientHistory/[patient_id]/page';

function Header({ name }: HeaderProps) {
    const profile = useAppSelector((s: RootState) => s.userProfile.profile);
    return (
        <header className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 border rounded-full flex items-center justify-center">
                    {profile?.profileImageUrl ? (
                        <img
                            src={profile.profileImageUrl}
                            alt="Profile"
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <span className="text-2xl">👨</span>
                    )}
                </div>
                <div>
                    <p className="text-sm text-gray-500">Welcome,</p>
                    <h1 className="text-sm font-semibold text-gray-800">{name}</h1>
                </div>
            </div>
            <Link href={"/Veterinarian/notifications"} className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">
                    <Image
                        src={"/images/home/bell.svg"}
                        alt="Bell icon"
                        width={24}
                        height={24}
                    />
                </span>
            </Link>

        </header>
    );
}

function PetSelector({ pets }: PetSelectorProps) {
    const imageurl = "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=800&h=600&fit=crop"
    return (
        <div className="flex gap-3 mb-6">
            {pets.map((pet) => (
                <button
                    key={pet.id}
                    className={`flex items-center p-2 rounded-full transition-all ${pet.active
                        ? 'bg-[#EBF2FF] text-primary'
                        : 'bg-[#F5F6F6] text-black'
                        }`}
                >
                    <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                        <img src={imageurl} alt={pet.name} width={40} height={40} />
                    </div>
                    <span className="font-medium px-4">{pet.name}</span>
                </button>
            ))}
        </div>
    );
}

function CurrentHealth({ lastTestDate, parameters }: CurrentHealthProps) {
    return (
        <div className="rounded-3xl p-3 mb-6 bg-[#F5F6F6]">
            <h2 className="text-gray-900 font-medium text-xl mb-1">Current Health</h2>
            <p className="text-gray-500 text-sm mb-3 font-normal">Last test conducted on {lastTestDate}</p>

            <div className="">
                <p className="text-foreground font-medium text-base mb-1">Parameters to watch out for</p>
                <div className="flex flex-wrap gap-2">
                    {parameters.map((param, index) => (
                        <span
                            key={index}
                            className="px-4 py-1 bg-[#839297] text-white font-[400] rounded-full text-sm"
                        >
                            {param}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Trends({ data }: TrendsProps) {
    return (
        <div className="p- mb-6">
            <h2 className="text-gray-900 font-semibold text-xl mb-1">Trends</h2>
            <p className="text-gray-500 text-sm mb-6">The evolution of some parameters.</p>

            <div className="space-y-4">
                {data.map((trend, index) => (
                    <div key={index} className="relative p-2.5 rounded-[12px] bg-[#F5F6F6]">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-700 font-medium">{trend.name}</span>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="relative flex items-end px-2">
                            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 50">
                                <path
                                    d={`M 10 ${50 - (trend.data[0] / 2)} L 390 ${50 - (trend.data[1] / 2)}`}
                                    stroke="#3B82F6"
                                    strokeWidth="2"
                                    fill="none"
                                />
                                <circle cx="10" cy={50 - (trend.data[0] / 2)} r="4" fill="#3B82F6" />
                                <circle cx="390" cy={50 - (trend.data[1] / 2)} r="5" fill="#3B82F6" />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


export default function Home() {
    const profile = useAppSelector((s: RootState) => s.userProfile.profile);
    const pets = [
        { id: 1, name: 'Lola', image: '/lola.jpg', active: true },
        { id: 2, name: 'Buddy', image: '/buddy.jpg', active: false },
    ];

    const trendsData = [
        { name: 'Leukocytes', data: [40, 65] },
        { name: 'Proteins', data: [35, 70] },
        { name: 'Density', data: [30, 75] },
    ];

    return (
        <main className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-md mx-auto">
                <Header name={profile?.fullName || 'User'} />
                <PetSelector pets={pets} />
                <CurrentHealth
                    lastTestDate="24/05/2024"
                    parameters={['Proteins', 'Blood', 'Ketones']}
                />
                <div className="bg-[#F5F6F6] w-[calc(100%+48px)] -ms-6 h-2 my-4"></div>
                <Trends data={trendsData} />
                <div className="bg-[#F5F6F6] w-[calc(100%+48px)] -ms-6 h-2 my-4"></div>
                <ReportCard title='Urinalysis Report' date='24/05/2024' avatarUrl='https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=800&h=600&fit=crop' />
            </div>
        </main>
    );
}
