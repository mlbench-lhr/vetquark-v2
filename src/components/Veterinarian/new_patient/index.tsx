'use client'
import { useCallback, useEffect, useState } from 'react';
import { Link2, Mail, Plus, Search, X } from 'lucide-react';
import Image from 'next/image';
import PatientCard from '../home/PatientCard';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/tables/Pagination';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Modal } from '@/components/ui/modal';
import { useModal } from '@/hooks/useModal';
import { useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store/store';
import Pusher from 'pusher-js';

interface Guardian {
    id: string;
    name: string;
    owner: string;
    image: string;
    taxId: string;
}

export default function AddPatientGuardian() {
    const router = useRouter();
    const inviteModal = useModal();
    const [searchQuery, setSearchQuery] = useState('');
    const [inviteUrl, setInviteUrl] = useState<string>('');
    const profile = useAppSelector((s: RootState) => s.userProfile.profile);
    const userId = profile?.id || '';
    const [unreadCount, setUnreadCount] = useState(0);

    const [guardians, setGuardians] = useState<Guardian[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10;

    useEffect(() => {
        setInviteUrl(`${window.location.origin}/signup?profile=tutor`);
    }, []);

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

    async function handleSearch(q: string, pageToFetch: number) {
        try {
            setLoading(true);
            const res = await fetch(
                `/api/guardians/get-guardians?q=${encodeURIComponent(q)}&page=${pageToFetch}&pageSize=${pageSize}`
            );
            const data = await res.json();
            if (res.ok) {
                console.log("data.items----", data.items);

                setGuardians((data.items || []).map((u: any) => ({
                    id: String(u.id),
                    name: u.name,
                    owner: u.idNumber ? `National ID: ${u.idNumber}` : 'National ID: N/A',
                    image: u.avatarUrl,
                    taxId: String(u.idNumber || '').trim(),
                })));
                setTotalPages(Number(data.pagination?.totalPages || 0));
            } else {
                setGuardians([]);
                setTotalPages(0);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        handleSearch(searchQuery, page);
    }, [page, searchQuery]);
    console.log("guardians----", guardians);

    const filteredGuardians = guardians.filter(guardian =>
        guardian.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guardian.owner.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getInviteLink = () => {
        if (inviteUrl) return inviteUrl;
        if (typeof window !== 'undefined') return `${window.location.origin}/signup?profile=tutor`;
        return '/signup?profile=tutor';
    };

    const handleInviteGuardian = async () => {
        const url = getInviteLink();
        const shareText = `Sign up as a Guardian on VetQuark: ${url}`;

        try {
            if (typeof navigator !== 'undefined' && 'share' in navigator) {
                await (navigator as any).share({
                    title: 'VetQuark Guardian Signup',
                    text: shareText,
                    url,
                });
                inviteModal.closeModal();
                return;
            }
        } catch {
        }

        inviteModal.openModal();
    };

    const handleCopyInviteLink = async () => {
        const url = getInviteLink();
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Link copied');
        } catch {
            toast.error('Unable to copy link');
        }
    };

    const handleShareWhatsApp = () => {
        const url = getInviteLink();
        const text = `Sign up as a Guardian on VetQuark: ${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    };

    const handleShareEmail = () => {
        const url = getInviteLink();
        const subject = 'VetQuark Guardian Signup';
        const body = `Please sign up using this link: ${url}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const GuardiansSkeleton = () => (
        <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                    key={i}
                    className="w-full rounded-2xl bg-[#F5F6F6] p-4 animate-pulse"
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="h-11 w-11 rounded-full bg-gray-300" />
                            <div className="min-w-0 space-y-2">
                                <div className="h-4 w-40 rounded bg-gray-300" />
                                <div className="h-3 w-28 rounded bg-gray-300" />
                            </div>
                        </div>
                        <div className="h-5 w-5 rounded bg-gray-300" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen p-4 space-y-4">
            {/* Header */}
            <div className="bg-white flex items-center justify-between">
                <h1 className="text-base font-medium text-gray-900">Add New Patient</h1>
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

            {/* Progress Tabs */}
            <div className="bg-white ">
                <div className="flex items-center justify-between relative">
                    <div className="flex items-center gap-3 bg-white z-1 pe-2.5">
                        <div className="w-10 h-10 bg-[#EBF2FF] rounded-full flex items-center justify-center">
                            <Image
                                src={"/images/new_patient/user-active.svg"}
                                alt="User icon"
                                width={24}
                                height={24}
                            />
                        </div>
                        <span className="text-xs font-medium text-gray-900">Guardian</span>
                    </div>
                    <div className="w-32 h-1 bg-primary rounded-full w-[100%] absolute left-0 top-1/2 z-0"></div>

                    <div className="flex items-center gap-3 ps-2.5 z-1 bg-white">
                        <div className="w-10 h-10 bg-[#F5F6F6] rounded-full flex items-center justify-center">
                            <Image
                                src={"/images/new_patient/paw.svg"}
                                alt="User icon"
                                width={24}
                                height={24}
                            />
                        </div>
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
                        onChange={(e) => {
                            const v = e.target.value;
                            setSearchQuery(v);
                            setPage(1);
                        }}
                        className="w-full pl-12 pr-4 py-3 bg-gray-100 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                {/* Guardian List */}
                <div className="space-y-3 mb-6">
                    {loading ? (
                        <GuardiansSkeleton />
                    ) : filteredGuardians.length === 0 ? (
                        <div className="text-tertiary text-sm">No guardians found.</div>
                    ) : filteredGuardians.map((guardian) => (
                        <PatientCard
                            key={guardian.id}
                            patient={guardian}
                            onClickNavigate={`/Veterinarian/patient/new_patient?guardianId=${guardian.id}&guardianName=${encodeURIComponent(guardian.name)}&guardianTaxId=${encodeURIComponent(guardian.taxId)}`}
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

                {!loading && totalPages > 1 ? (
                    <div className="mt-4 flex justify-center">
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={(nextPage) => {
                                const clamped = Math.max(1, Math.min(totalPages, nextPage));
                                setPage(clamped);
                            }}
                        />
                    </div>
                ) : null}

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button className="w-full bg-primary hover:bg-primary/70 text-white font-medium py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors" onClick={() => router.push('/Veterinarian/patient/new_guardian')}>
                        <Plus className="w-5 h-5" />
                        New Guardian
                    </button>

                    <button
                        onClick={handleInviteGuardian}
                        className="w-full bg-[#EBF2FF] hover:bg-gray-200 text-primary font-medium py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
                    >
                        <Link2 className="w-5 h-5" />
                        Invite Guardian
                    </button>
                </div>
            </div>

            <Modal isOpen={inviteModal.isOpen} onClose={inviteModal.closeModal} className="max-w-[520px] mx-4 p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Invite Guardian</h3>
                        <p className="text-sm text-gray-600 mt-1">Share this link so they can sign up as a Guardian.</p>
                    </div>
                    <button type="button" onClick={inviteModal.closeModal} className="p-2 rounded-lg hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-700" />
                    </button>
                </div>

                <div className="mt-5 space-y-4">
                    <input
                        readOnly
                        value={getInviteLink()}
                        className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={handleCopyInviteLink}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg"
                        >
                            Copy Link
                        </button>
                        <button
                            type="button"
                            onClick={handleShareWhatsApp}
                            className="w-full bg-[#EBF2FF] hover:bg-gray-200 text-primary font-medium py-3 rounded-lg flex items-center justify-center gap-2"
                        >
                            <Link2 className="w-5 h-5" />
                            WhatsApp
                        </button>
                        <button
                            type="button"
                            onClick={handleShareEmail}
                            className="w-full bg-[#EBF2FF] hover:bg-gray-200 text-primary font-medium py-3 rounded-lg flex items-center justify-center gap-2 sm:col-span-2"
                        >
                            <Mail className="w-5 h-5" />
                            Email
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleInviteGuardian}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-lg"
                    >
                        Share…
                    </button>
                </div>
            </Modal>
        </div>
    );
}
