'use client';

// app/page.tsx
import { Bell, ChevronRight, FileText, Search, User2 } from 'lucide-react';
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
                <Link href={"/Guardian/Menu"} className="w-12 h-12 border rounded-full flex items-center justify-center ">
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
type ReportStatus = "signed" | "pending";

type ReportHistoryItem = {
    id: string;
    color: string;
    patientName: string;
    guardianName: string;
    dateLabel: string;
    status: ReportStatus;
    avatarSrc: string;
    line: any,
    percentage: number
};
function Trends({ data }: TrendsProps) {
    const physicalItems: ReportHistoryItem[] = [
        {
            id: "1",
            color: "#F59E0B",
            patientName: "Color",
            guardianName: "Normal: Pale Yellow",
            dateLabel: "22/05/2024",
            percentage: 0,
            status: "signed",
            line: <svg xmlns="http://www.w3.org/2000/svg" width="62" height="26" viewBox="0 0 62 26" fill="none">
                <path d="M1 24.9949L15.9968 16.9966L30.9936 8.99829L45.9904 4.19932L60.9872 1" stroke="#F59E0B" stroke-width="1.99957" stroke-linecap="round" stroke-linejoin="round" />
            </svg>,
            avatarSrc: "/images/product/product-01.jpg",
        },
        {
            id: "2",
            color: "#10B981",
            patientName: "Clarity",
            guardianName: "Normal: Clear",
            dateLabel: "22/05/2024",
            percentage: 0,
            status: "signed",
            line: <svg xmlns="http://www.w3.org/2000/svg" width="62" height="25" viewBox="0 0 62 25" fill="none">
                <path d="M1 23.9951H15.9968H30.9936H45.9904H60.9872" stroke="#10B981" stroke-width="1.99957" stroke-linecap="round" stroke-linejoin="round" />
            </svg>,
            avatarSrc: "/images/product/product-01.jpg",
        },
        {
            id: "1",
            color: "#F59E0B",
            patientName: "Color",
            guardianName: "Normal: Pale Yellow",
            dateLabel: "22/05/2024",
            percentage: 0,
            status: "signed",
            line: <svg xmlns="http://www.w3.org/2000/svg" width="62" height="26" viewBox="0 0 62 26" fill="none">
                <path d="M1 24.9949L15.9968 16.9966L30.9936 8.99829L45.9904 4.19932L60.9872 1" stroke="#F59E0B" stroke-width="1.99957" stroke-linecap="round" stroke-linejoin="round" />
            </svg>,
            avatarSrc: "/images/product/product-01.jpg",
        },
        {
            id: "2",
            color: "#10B981",
            patientName: "Clarity",
            guardianName: "Normal: Clear",
            dateLabel: "22/05/2024",
            percentage: 0,
            status: "signed",
            line: <svg xmlns="http://www.w3.org/2000/svg" width="62" height="25" viewBox="0 0 62 25" fill="none">
                <path d="M1 23.9951H15.9968H30.9936H45.9904H60.9872" stroke="#10B981" stroke-width="1.99957" stroke-linecap="round" stroke-linejoin="round" />
            </svg>,
            avatarSrc: "/images/product/product-01.jpg",
        },
    ];
    return (
        <div className="p- mb-6">
            <h2 className="text-gray-900 font-semibold text-xl mb-1">Trends</h2>
            <p className="text-gray-500 text-sm mb-2">The evolution of some parameters.</p>

            <div className="space-y-">
                {physicalItems.map((item, index) => (
                    <ReportCardDetail key={index} item={item} />
                ))}
            </div>
        </div>
    );
}

function ReportCardDetail({ item }: { item: ReportHistoryItem }) {
    return (
        <div className="bg-white px- py-4 border-b">
            <Link href={"/Guardian/home/TrendDetail"} className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3 justify-between w-full">
                    <div className="flex min-w-0 items-center gap-2 justify-start">
                        <div className="h-2 w-2  rounded-full" style={{ backgroundColor: item.color }}> </div>
                        <div className="min-w-0">
                            <p className="truncate text-[14px] font-medium text-gray-900">
                                {item.patientName}
                            </p>
                            <p className="truncate text-[12px] text-gray-400">
                                {item.guardianName}
                            </p>
                        </div>
                    </div>

                    <div className="flex min-w-0 items-center gap-4">
                        {item.line}
                        <div className="min-w-0 text-end">
                            <div className="flex justify-start items-center gap-1">
                                <p className="truncate text-[14px] font-medium " style={{ color: item.color }}>
                                    Abnormal              </p>
                            </div>
                            <p className="truncate text-[12px] text-gray-500">
                                3.5 %
                            </p>
                        </div>
                    </div>
                </div>
            </Link>
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
        <main className="min-h-screen bg-gray-5 p-6">
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
