'use client';

// app/page.tsx
import { Bell, ChevronRight, FileText, Search } from 'lucide-react';
import { CurrentHealthProps, HeaderProps, PetSelectorProps, RecentHistoryProps, TrendsProps } from './types';
import { useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store/store';

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
            <div className="flex items-center gap-3" >
                <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                    <Search size={20} className="text-primary" />
                </button>

                <button className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm"><Bell size={20} /></span>
                </button>
            </div>
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
                    className={`flex items-center gap-3 px-8 py-2 rounded-full transition-all ${pet.active
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-gray-50 border border-primary text-primary shadow-sm hover:shadow-md'
                        }`}
                >
                    <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
                        <img src={imageurl} alt={pet.name} width={40} height={40} />
                    </div>
                    <span className="font-medium">{pet.name}</span>
                </button>
            ))}
        </div>
    );
}

function CurrentHealth({ lastTestDate, parameters }: CurrentHealthProps) {
    return (
        <div className="border rounded-3xl p-3 shadow-sm mb-6">
            <h2 className="text-gray-900 font-semibold text-xl mb-1">Current Health</h2>
            <p className="text-gray-500 text-sm mb-4">Last test conducted on {lastTestDate}</p>

            <div className="mb-4">
                <p className="text-gray-700 font-medium text-sm mb-3">Parameters to watch out for:</p>
                <div className="flex flex-wrap gap-2">
                    {parameters.map((param, index) => (
                        <span
                            key={index}
                            className="px-4 py-1 border text-gray-700 rounded-full text-sm"
                        >
                            {param}
                        </span>
                    ))}
                </div>
            </div>

            <button className="w-full bg-primary text-white py-3 rounded-2xl font-medium hover:bg-primary transition-colors">
                View Detailed Result
            </button>
        </div>
    );
}

function Trends({ data }: TrendsProps) {
    return (
        <div className="border rounded-3xl p-3 shadow-sm mb-6">
            <h2 className="text-gray-900 font-semibold text-xl mb-1">Trends</h2>
            <p className="text-gray-500 text-sm mb-6">The evolution of some parameters.</p>

            <div className="space-y-4">
                {data.map((trend, index) => (
                    <div key={index} className="relative">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-gray-700 font-medium">{trend.name}</span>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="relative h-12 flex items-end px-2">
                            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 50">
                                <path
                                    d={`M 10 ${50 - (trend.data[0] / 2)} L 390 ${50 - (trend.data[1] / 2)}`}
                                    stroke="#93C5FD"
                                    strokeWidth="2"
                                    fill="none"
                                />
                                <circle cx="10" cy={50 - (trend.data[0] / 2)} r="4" fill="#3B82F6" />
                                <circle cx="390" cy={50 - (trend.data[1] / 2)} r="5" fill="#3B82F6" />
                            </svg>
                        </div>
                        {index < data.length - 1 && <div className="mt-4 border-t border-gray-100" />}
                    </div>
                ))}
            </div>
        </div>
    );
}

function RecentHistory({ reportDate, reportTitle }: RecentHistoryProps) {
    return (
        <div className="border rounded-3xl p-3 shadow-sm">
            <h2 className="text-gray-900 font-semibold text-xl mb-1">Recent History</h2>
            <p className="text-gray-500 text-sm mb-6">Last report signed on {reportDate}</p>

            <div className="bg-gray-100 rounded-2xl p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-12 h-12  flex items-center justify-center ">
                        <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className='text-[10px]'>
                        <p className="text-gray-900 font-medium">{reportTitle}</p>
                        <p className="text-gray-500">{reportDate}</p>
                    </div>
                </div>
                <div className="flex gap-2 text-[10px]">
                    <button className="px-5 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary transition-colors">
                        PDF
                    </button>
                    <button className="px-5 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary transition-colors">
                        Details
                    </button>
                </div>
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
                <Trends data={trendsData} />
                <RecentHistory
                    reportDate="24/05/2024"
                    reportTitle="Report - Urinalysis"
                />
            </div>
        </main>
    );
}
