'use client'
import { useCallback, useEffect, useState } from 'react';
import { Link2, Mail, Plus, Search, X, Bell } from 'lucide-react';
import Image from 'next/image';
import PatientCard from '../home/PatientCard';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/tables/Pagination';
import { toast } from 'react-toastify';
import { Modal } from '@/components/ui/modal';
import { useModal } from '@/hooks/useModal';
import { useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store/store';
import Pusher from 'pusher-js';
import { useTranslation } from 'react-i18next';

interface Guardian {
    id: string;
    name: string;
    owner: string;
    image: string;
    taxId: string;
}

export default function AddPatientGuardian() {
    const { t } = useTranslation()
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
                setGuardians((data.items || []).map((u: any) => ({
                    id: String(u.id),
                    name: u.name,
                    owner: u.idNumber ? `${t('profile.nationalId')}: ${u.idNumber}` : `${t('profile.nationalId')}: ${t('guardianHome.notAvailable')}`,
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

    const filteredGuardians = guardians.filter(guardian =>
        guardian.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guardian.owner.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getInviteLink = () => {
        const code = profile?.veterinarianCode || '';
        const base = typeof window !== 'undefined' ? `${window.location.origin}/signup` : '/signup';
        const url = `${base}?profile=tutor${code ? `&vetCode=${encodeURIComponent(code)}` : ''}`;
        return url;
    };

    const handleInviteGuardian = async () => {
        const url = getInviteLink();
        const shareText = `${t('newPatient.guardianShareTextPrefix')} ${url}`;

        try {
            if (typeof navigator !== 'undefined' && 'share' in navigator) {
                await (navigator as any).share({
                    title: t('newPatient.guardianSignupTitle'),
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
            toast.success(t('newPatient.linkCopied'));
        } catch {
            toast.error(t('newPatient.unableToCopyLink'));
        }
    };

    const handleShareWhatsApp = () => {
        const url = getInviteLink();
        const text = `${t('newPatient.guardianShareTextPrefix')} ${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    };

    const handleShareEmail = () => {
        const url = getInviteLink();
        const subject = t('newPatient.emailSubject');
        const body = `${t('newPatient.emailBodyPrefix')} ${url}`;
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
        <div className="min-h-[calc(100vh-96px)] p-4 space-y-4 bg-gray-50">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-[#3F78D8]">{t('newPatient.addNewPatientTitle')}</h1>
                <div className="flex items-center gap-3">
                    <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <Search className="w-5 h-5 text-[#3F78D8]" />
                    </button>
                    <button className="relative w-10 h-10 rounded-full bg-[#3F78D8] flex items-center justify-center hover:bg-[#3F78D8]/90 transition-colors">
                        <Bell className="w-5 h-5 text-white" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
                        )}
                    </button>
                </div>
            </div>

            {/* Progress Stepper */}
            <div className="relative flex items-start justify-between">
                {/* Step 1 - Active */}
                <div className="flex flex-col items-center gap-1.5 z-10">
                    <div className="w-10 h-10 rounded-full border-2 border-[#3F78D8] bg-white flex items-center justify-center">
                        <Image
                            src={"/images/new_patient/user-active.svg"}
                            alt={t('newPatient.guardianIconAlt')}
                            width={20}
                            height={20}
                        />
                    </div>
                    <span className="text-xs font-semibold text-[#3F78D8]">{t('newPatient.guardianStep')}</span>
                </div>
                {/* Connecting Line */}
                <div className="absolute top-5 left-5 right-5 h-px bg-[#E0E0E0] z-0" />
                {/* Step 2 - Inactive */}
                <div className="flex flex-col items-center gap-1.5 z-10">
                    <div className="w-10 h-10 rounded-full border-2 border-[#E0E0E0] bg-white flex items-center justify-center">
                        <Image
                            src={"/images/new_patient/paw.svg"}
                            alt={t('newPatient.patientIconAlt')}
                            width={20}
                            height={20}
                        />
                    </div>
                    <span className="text-xs font-medium text-[#9CA3AF]">{t('newPatient.patientDetailsStep')}</span>
                </div>
            </div>

            {/* White Card */}
            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-5">
                {/* Title & Subtitle */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">{t('newPatient.linkGuardianTitle')}</h2>
                    <p className="text-sm text-[#839297] mt-1">
                        {t('newPatient.linkGuardianDesc')}
                    </p>
                </div>

                {/* Search Box */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#3F78D8]" />
                    <input
                        type="text"
                        placeholder={t('newPatient.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => {
                            const v = e.target.value;
                            setSearchQuery(v);
                            setPage(1);
                        }}
                        className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F5] rounded-xl text-[#1D2939] placeholder-[#C4C4C4] focus:outline-none focus:ring-2 focus:ring-[#3F78D8] border-0 text-sm"
                    />
                </div>

                {/* Guardian List */}
                <div className="space-y-3">
                    {loading ? (
                        <GuardiansSkeleton />
                    ) : filteredGuardians.length === 0 ? (
                        <div className="text-[#839297] text-sm text-center py-8">{t('newPatient.noGuardiansFound')}</div>
                    ) : filteredGuardians.map((guardian) => (
                        <PatientCard
                            key={guardian.id}
                            patient={guardian}
                            onClickNavigate={`/Veterinarian/patient/new_patient?guardianId=${guardian.id}&guardianName=${encodeURIComponent(guardian.name)}&guardianTaxId=${encodeURIComponent(guardian.taxId)}&guardianImage=${encodeURIComponent(guardian.image || '')}`}
                        />
                    ))}
                </div>

                {!loading && totalPages > 1 ? (
                    <div className="flex justify-center">
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
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
                <button
                    className="w-full bg-[#3F78D8] hover:bg-[#3F78D8]/90 active:bg-[#3568C0] text-white font-bold text-base py-[15px] rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                    onClick={() => router.push('/Veterinarian/patient/new_guardian')}
                >
                    <Plus className="w-5 h-5" />
                    {t('newPatient.newGuardianButton')}
                </button>

                <button
                    onClick={handleInviteGuardian}
                    className="w-full text-[#3F78D8] text-sm font-medium py-2 flex items-center justify-center gap-1.5 transition-colors"
                >
                    <Link2 className="w-4 h-4" />
                    {t('newPatient.inviteGuardianButton')}
                </button>
            </div>

            <Modal isOpen={inviteModal.isOpen} onClose={inviteModal.closeModal} className="max-w-[520px] mx-4 p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{t('newPatient.inviteGuardianTitle')}</h3>
                        <p className="text-sm text-gray-600 mt-1">{t('newPatient.inviteGuardianDesc')}</p>
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
                            {t('newPatient.copyLink')}
                        </button>
                        <button
                            type="button"
                            onClick={handleShareWhatsApp}
                            className="w-full bg-[#EBF2FF] hover:bg-gray-200 text-primary font-medium py-3 rounded-lg flex items-center justify-center gap-2"
                        >
                            <Link2 className="w-5 h-5" />
                            {t('newPatient.whatsapp')}
                        </button>
                        <button
                            type="button"
                            onClick={handleShareEmail}
                            className="w-full bg-[#EBF2FF] hover:bg-gray-200 text-primary font-medium py-3 rounded-lg flex items-center justify-center gap-2 sm:col-span-2"
                        >
                            <Mail className="w-5 h-5" />
                            {t('newPatient.email')}
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleInviteGuardian}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-lg"
                    >
                        {t('newPatient.share')}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
