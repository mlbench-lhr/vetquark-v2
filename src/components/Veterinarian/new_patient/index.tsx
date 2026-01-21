'use client'
import { useState, useEffect } from 'react';
import { Search, Bell, ChevronRight, Plus, Link, Link2 } from 'lucide-react';
import Image from 'next/image';
import PatientCard from '../home/PatientCard';
import { useRouter } from 'next/navigation';

interface Guardian {
    id: string;
    name: string;
    owner: string;
    image: string;
}

export default function AddPatientGuardian() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const [guardians, setGuardians] = useState<Guardian[]>([]);
    const [loading, setLoading] = useState(false);

    async function handleSearch(q: string) {
        try {
            setLoading(true);
            const res = await fetch(`/api/guardians/get-guardians?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            if (res.ok) {
                setGuardians((data.items || []).map((u: any) => ({
                    id: String(u._id),
                    name: u.fullName,
                    owner: u.taxId ? `National ID: ${u.taxId}` : 'National ID: N/A',
                    image: '',
                })));
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        handleSearch('');
    }, []);

    const filteredGuardians = guardians.filter(guardian =>
        guardian.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guardian.owner.includes(searchQuery)
    );

    return (
        <div className="min-h-screen p-4 space-y-4">
            {/* Header */}
            <div className="bg-white flex items-center justify-between">
                <h1 className="text-base font-medium text-gray-900">Add New Patient</h1>
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

            {/* Progress Tabs */}
            <div className="bg-white ">
                <div className="flex items-center ">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#EBF2FF] rounded-full flex items-center justify-center">
                            <Image
                                src={"/images/new_patient/user-active.svg"}
                                alt="User icon"
                                width={24}
                                height={24}
                            />
                        </div>
                        <span className="text-xs font-medium text-gray-900">Guardian</span>
                        <div className="w-32 h-1 bg-primary rounded-full ml-2"></div>
                    </div>

                    <div className="flex items-center gap-3 opacity-40">
                        <Image
                            src={"/images/new_patient/paw.svg"}
                            alt="User icon"
                            width={24}
                            height={24}
                        />
                        <span className="text-xs font-medium text-gray-500">Patient Details</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="m">
                <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900">Link Guardian</h2>
                    <p className="text-base text-tertiary">
                        Select an existing guardian or register a new one to continue.
                    </p>
                </div>

                {/* Search Box */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary" />
                    <input
                        type="text"
                        placeholder="Search by name or national ID..."
                        value={searchQuery}
                        onChange={(e) => { const v = e.target.value; setSearchQuery(v); handleSearch(v); }}
                        className="w-full pl-12 pr-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                {/* Guardian List */}
                <div className="space-y-3 mb-6">
                    {filteredGuardians.map((guardian) => (
                        <PatientCard
                            key={guardian.id}
                            patient={guardian}
                            onClickNavigate={`/Veterinarian/patient/new_patient?guardianId=${guardian.id}&guardianName=${encodeURIComponent(guardian.name)}`}
                        />
                        // <button
                        //     key={guardian.id}
                        //     className="w-full bg-white rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow border border-gray-200"
                        // >
                        //     <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-2xl">
                        //         {guardian.avatar}
                        //     </div>
                        //     <div className="flex-1 text-left">
                        //         <h3 className="font-semibold text-gray-900 text-lg">{guardian.name}</h3>
                        //         <p className="text-gray-500 text-sm">National ID: {guardian.nationalId}</p>
                        //     </div>
                        //     <ChevronRight className="w-6 h-6 text-primary" />
                        // </button>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button className="w-full bg-primary hover:bg-primary/70 text-white font-medium py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors" onClick={() => router.push('/Veterinarian/patient/new_guardian')}>
                        <Plus className="w-5 h-5" />
                        New Guardian
                    </button>

                    <button className="w-full bg-[#EBF2FF] hover:bg-gray-200 text-primary font-medium py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors">
                        <Link2 className="w-5 h-5" />
                        Invite Guardian
                    </button>
                </div>
            </div>
        </div>
    );
}