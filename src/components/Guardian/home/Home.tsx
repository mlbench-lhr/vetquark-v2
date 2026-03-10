'use client';

import { User2 } from 'lucide-react';
import { CurrentHealthProps, HeaderProps, Pet, PetSelectorProps, TrendsProps } from './types';
import { useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store/store';
import Image from 'next/image';
import Link from 'next/link';
import { ReportCard } from '@/app/(other_pages)/Veterinarian/(others-pages)/home/patientHistory/[patient_id]/page';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Pusher from 'pusher-js';
import { downloadUrinalysisPdf } from '@/utils/urinalysisPdf';

function normalizePanelCode(value?: string | null) {
    return (value || "").trim() || "VETQ_MASTER_360";
}

function Header({ name }: HeaderProps) {
    const profile = useAppSelector((s: RootState) => s.userProfile.profile);
    const userId = profile?.id || '';
    const [unreadCount, setUnreadCount] = useState(0);

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
            <Link href={"/Guardian/notifications"} className="relative w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
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

        </header>
    );
}

function PetSelector({ pets, activePetId, onSelect, loading }: PetSelectorProps) {
    return (
        <div className="flex gap-3 mb-6 justify-start items-center overflow-auto">
            {loading ? (
                <div className="text-sm text-gray-500">Loading pets...</div>
            ) : pets.length === 0 ? (
                <div className="text-sm text-gray-500">No pets found.</div>
            ) : (
                pets.map((pet) => {
                    const active = pet.id === activePetId;
                    return (
                        <div
                            key={pet.id}
                            onClick={() => onSelect(pet.id)}
                            className={`flex w-fit! cursor-pointer gap-2 items-center p-2 justify-start rounded-full transition-all ${active
                                ? 'bg-[#EBF2FF] text-primary'
                                : 'bg-[#F5F6F6] text-black'
                                }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                                <Image
                                    src={pet.image || "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"}
                                    alt={pet.name}
                                    width={40}
                                    height={40}
                                    className='object-cover object-center w-10 h-10'
                                />
                            </div>
                            <div className="font-medium w-[100px]! truncate">{pet.name}</div>
                        </div>
                    );
                })
            )}
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
function Trends({ items, loading }: TrendsProps) {
    return (
        <div className="p- mb-6">
            <h2 className="text-gray-900 font-semibold text-xl mb-1">Trends</h2>
            <p className="text-gray-500 text-sm mb-2">The evolution of some parameters.</p>

            <div className="space-y-">
                {loading ? (
                    <div className="text-sm text-gray-500">Loading trends...</div>
                ) : items.length === 0 ? (
                    <div className="text-sm text-gray-500">No trends found.</div>
                ) : (
                    items.map((item) => (
                        <ReportCardDetail key={item.id} item={item} />
                    ))
                )}
            </div>
        </div>
    );
}

function ReportCardDetail({ item }: { item: TrendsProps["items"][number] }) {
    const color = item.status === "Abnormal" ? "#F59E0B" : "#10B981";
    return (
        <div className="bg-white px- py-4 border-b">
            <Link href={`/Guardian/history/detail/${encodeURIComponent(item.readingId)}`} className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3 justify-between w-full">
                    <div className="flex min-w-0 items-center gap-2 justify-start">
                        <div className="h-2 w-2  rounded-full" style={{ backgroundColor: color }}> </div>
                        <div className="min-w-0">
                            <p className="truncate text-[14px] font-medium text-gray-900">
                                {item.label}
                            </p>
                            <p className="truncate text-[12px] text-gray-400">
                                {item.valueLabel}
                            </p>
                        </div>
                    </div>

                    <div className="flex min-w-0 items-center gap-4">
                        <div className="min-w-0 text-end">
                            <div className="flex justify-start items-center gap-1">
                                <p className="truncate text-[14px] font-medium " style={{ color }}>
                                    {item.status}
                                </p>
                            </div>
                            <p className="truncate text-[12px] text-gray-500">
                                {item.dateLabel}
                            </p>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}

function formatDateLabel(value: string) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value || "N/A";
    return d.toLocaleDateString("en-GB");
}

export default function Home() {
    const profile = useAppSelector((s: RootState) => s.userProfile.profile);
    const router = useRouter();
    const [panelByCode, setPanelByCode] = useState<Map<string, { title: string; visibleKeys: string[] | null }>>(new Map());
    const [pets, setPets] = useState<Pet[]>([]);
    const [activePetId, setActivePetId] = useState("");
    const [loadingPets, setLoadingPets] = useState(false);

    const [loadingReadings, setLoadingReadings] = useState(false);
    const [readings, setReadings] = useState<any[]>([]);

    const latestReadingId = useMemo(() => String(readings?.[0]?.id || ""), [readings]);
    const [loadingLatestReading, setLoadingLatestReading] = useState(false);
    const [latestReading, setLatestReading] = useState<any | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetch('/api/panels', { method: 'GET' });
                const data = await res.json().catch(() => null);
                if (!mounted) return;
                const raw = Array.isArray((data as any)?.panels) ? ((data as any).panels as any[]) : [];
                const map = new Map<string, { title: string; visibleKeys: string[] | null }>();
                for (const p of raw) {
                    const code = String(p?.code || "").trim();
                    if (!code) continue;
                    const title = String(p?.title || "").trim();
                    const keys = Array.isArray(p?.visibleKeys)
                        ? (p.visibleKeys as any[]).map((k) => String(k || "").trim()).filter(Boolean)
                        : null;
                    map.set(code, { title: title || code, visibleKeys: keys && keys.length ? keys : null });
                }
                setPanelByCode(map);
            } catch {
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const visibleKeysForAccess = useCallback((productCode?: string | null, unlockedProductCodes?: string[] | null): string[] | null => {
        const codes = [
            normalizePanelCode(productCode),
            ...((Array.isArray(unlockedProductCodes) ? unlockedProductCodes : []).map((c) => normalizePanelCode(String(c || ""))).filter(Boolean)),
        ];
        const keysByCode = codes.map((c) => panelByCode.get(c)?.visibleKeys ?? null);
        if (keysByCode.some((k) => k === null)) return null;
        const set = new Set<string>();
        for (const keys of keysByCode) {
            if (Array.isArray(keys)) keys.forEach((k) => set.add(k));
        }
        return [...set];
    }, [panelByCode]);

    const panelTitleForCode = useCallback((productCode?: string | null) => {
        const code = normalizePanelCode(productCode);
        return panelByCode.get(code)?.title || code;
    }, [panelByCode]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoadingPets(true);
                const res = await fetch(`/api/pet/get_pets?page=1&pageSize=100`);
                const data = await res.json().catch(() => null);
                if (!mounted) return;
                if (!res.ok) {
                    throw new Error(typeof (data as any)?.error === "string" ? (data as any).error : "Failed to load pets");
                }
                const items = Array.isArray((data as any)?.items) ? (data as any).items : [];
                const mapped: Pet[] = items
                    .map((p: any) => ({
                        id: String(p.id || p._id || ""),
                        name: String(p.name || p.animalName || "N/A"),
                        image: (p.image || p.photo || null) as any,
                    }))
                    .filter((p: Pet) => Boolean(p.id));
                setPets(mapped);
                setActivePetId((prev) => prev || mapped[0]?.id || "");
            } catch {
                setPets([]);
                setActivePetId("");
            } finally {
                if (mounted) setLoadingPets(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!activePetId) {
                setReadings([]);
                return;
            }
            try {
                setLoadingReadings(true);
                const res = await fetch(`/api/reading/get_readings?patientId=${encodeURIComponent(activePetId)}&page=1&pageSize=50`);
                const data = await res.json().catch(() => null);
                if (!mounted) return;
                if (!res.ok) {
                    throw new Error(typeof (data as any)?.error === "string" ? (data as any).error : "Failed to load readings");
                }
                const items = Array.isArray((data as any)?.items) ? (data as any).items : [];
                setReadings(items);
            } catch {
                setReadings([]);
            } finally {
                if (mounted) setLoadingReadings(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [activePetId]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!latestReadingId) {
                setLatestReading(null);
                return;
            }
            try {
                setLoadingLatestReading(true);
                const res = await fetch(`/api/reading/get_reading/${encodeURIComponent(latestReadingId)}`);
                const data = await res.json().catch(() => null);
                if (!mounted) return;
                if (!res.ok) {
                    throw new Error(typeof (data as any)?.error === "string" ? (data as any).error : "Failed to load report");
                }
                setLatestReading((data as any)?.reading ?? null);
            } catch {
                setLatestReading(null);
            } finally {
                if (mounted) setLoadingLatestReading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [latestReadingId]);

    const currentHealth = useMemo(() => {
        const dateRaw = String(latestReading?.signedAt || latestReading?.createdAt || readings?.[0]?.date || "");
        const all = Array.isArray(latestReading?.results) ? latestReading.results : [];
        const keys = visibleKeysForAccess(latestReading?.productCode, (latestReading as any)?.unlockedProductCodes);
        const results = keys ? all.filter((r: any) => keys.includes(String(r?.key || ""))) : all;
        if (results.length === 0) {
            return { lastTestDate: "N/A", parameters: ["No recent tests"] };
        }
        const abnormal = results.filter((r: any) => r?.status === "Abnormal").map((r: any) => String(r?.label || "")).filter(Boolean);
        return {
            lastTestDate: formatDateLabel(dateRaw),
            parameters: abnormal.length ? abnormal.slice(0, 4) : ["All parameters normal"],
        };
    }, [latestReading, readings, visibleKeysForAccess]);

    const trendItems = useMemo<TrendsProps["items"]>(() => {
        const readingId = String(latestReading?.id || "");
        const dateLabel = formatDateLabel(String(latestReading?.signedAt || latestReading?.createdAt || ""));
        const all = Array.isArray(latestReading?.results) ? latestReading.results : [];
        const keys = visibleKeysForAccess(latestReading?.productCode, (latestReading as any)?.unlockedProductCodes);
        const results = keys ? all.filter((r: any) => keys.includes(String(r?.key || ""))) : all;
        if (!readingId || results.length === 0) return [];
        return results.slice(0, 6).map((r: any, idx: number) => {
            const unit = String(r?.unit || "").trim();
            const valueLabel = String(r?.valueLabel || "").trim();
            const combinedValue = unit ? `${valueLabel} ${unit}` : valueLabel;
            return {
                id: `${readingId}:${String(r?.key || r?.label || "result")}:${idx}`,
                label: String(r?.label || "N/A"),
                valueLabel: combinedValue || "N/A",
                status: r?.status === "Abnormal" ? "Abnormal" : "Normal",
                readingId,
                dateLabel,
            };
        });
    }, [latestReading, visibleKeysForAccess]);

    const handleDownloadLatest = useCallback(async () => {
        if (!latestReadingId) return;
        try {
            await downloadUrinalysisPdf({ readingId: latestReadingId, reading: latestReading });
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Failed to download report";
            console.error(e);
        }
    }, [latestReadingId, latestReading]);

    const handleDetailsLatest = useCallback(() => {
        if (!latestReadingId) return;
        router.push(`/Guardian/history/detail/${encodeURIComponent(latestReadingId)}`);
    }, [latestReadingId, router]);

    return (
        <main className="min-h-scree bg-gray-5 p-">
            <div className=" mx-auto">
                <Header name={profile?.fullName || 'User'} />
                <PetSelector pets={pets} activePetId={activePetId} onSelect={setActivePetId} loading={loadingPets} />
                <CurrentHealth
                    lastTestDate={currentHealth.lastTestDate}
                    parameters={currentHealth.parameters}
                />
                <div className="bg-[#F5F6F6] w-[calc(100%+40px)] -ms-6 h-2 my-4"></div>
                <Trends items={trendItems} loading={loadingLatestReading || loadingReadings} />
                <div className="bg-[#F5F6F6] w-[calc(100%+40px)] -ms-6 h-2 my-4"></div>
                {readings?.[0]?.id ? (
                    <ReportCard
                        title={panelTitleForCode(latestReading?.productCode)}
                        date={formatDateLabel(String(readings?.[0]?.date || ""))}
                        avatarUrl={String(readings?.[0]?.avatarSrc || "")}
                        signed={readings?.[0]?.status === "signed"}
                        onDownload={handleDownloadLatest}
                        onDetails={handleDetailsLatest}
                    />
                ) : (
                    <div className="text-sm text-gray-500">No reports found.</div>
                )}
            </div>
        </main>
    );
}
