'use client'
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, Plus, ChevronDown, ChevronUp, Folder, PawPrint, Search, Bell } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import PhoneInput from '@/components/form/group-input/PhoneInput';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { toast } from 'react-toastify';
import { useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store/store';
import Pusher from 'pusher-js';
import { useTranslation } from 'react-i18next';
import { STATES_BY_COUNTRY, getCountryCities } from '@/lib/locationData';
import Header from '@/components/common/header';
import TypedDateInput from '@/components/form/input/TypedDateInput';

function digitsOnly(value: string) {
    return value.replace(/\D/g, "");
}

function isValidCpf(value: string) {
    const cpf = digitsOnly(value);
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    const calcDigit = (base: string, factorStart: number) => {
        let sum = 0;
        for (let i = 0; i < base.length; i++) sum += Number(base[i]) * (factorStart - i);
        const mod = sum % 11;
        return String(mod < 2 ? 0 : 11 - mod);
    };
    const d1 = calcDigit(cpf.slice(0, 9), 10);
    const d2 = calcDigit(cpf.slice(0, 9) + d1, 11);
    return cpf[9] === d1 && cpf[10] === d2;
}

function isValidPostalCode(value: string) {
    const cep = digitsOnly(value);
    return cep.length === 8;
}

const brazilianStateOptions = [
    { value: "AC", text: "Acre" },
    { value: "AL", text: "Alagoas" },
    { value: "AP", text: "Amapá" },
    { value: "AM", text: "Amazonas" },
    { value: "BA", text: "Bahia" },
    { value: "CE", text: "Ceará" },
    { value: "DF", text: "Distrito Federal" },
    { value: "ES", text: "Espírito Santo" },
    { value: "GO", text: "Goiás" },
    { value: "MA", text: "Maranhão" },
    { value: "MT", text: "Mato Grosso" },
    { value: "MS", text: "Mato Grosso do Sul" },
    { value: "MG", text: "Minas Gerais" },
    { value: "PA", text: "Pará" },
    { value: "PB", text: "Paraíba" },
    { value: "PR", text: "Paraná" },
    { value: "PE", text: "Pernambuco" },
    { value: "PI", text: "Piauí" },
    { value: "RJ", text: "Rio de Janeiro" },
    { value: "RN", text: "Rio Grande do Norte" },
    { value: "RS", text: "Rio Grande do Sul" },
    { value: "RO", text: "Rondônia" },
    { value: "RR", text: "Roraima" },
    { value: "SC", text: "Santa Catarina" },
    { value: "SP", text: "São Paulo" },
    { value: "SE", text: "Sergipe" },
    { value: "TO", text: "Tocantins" },
];

const countryOptions = [
    { value: "Brazil", text: "Brazil" },
    { value: "Argentina", text: "Argentina" },
    { value: "Canada", text: "Canada" },
    { value: "Chile", text: "Chile" },
    { value: "Colombia", text: "Colombia" },
    { value: "Mexico", text: "Mexico" },
    { value: "Portugal", text: "Portugal" },
    { value: "Spain", text: "Spain" },
    { value: "United Kingdom", text: "United Kingdom" },
    { value: "United States", text: "United States" },
];

type StateOption = { value: string; text: string; stateName: string };

async function fetchCountryStates(country: string, signal?: AbortSignal): Promise<StateOption[]> {
    const normalized = country.trim();
    if (!normalized) return [];
    const items = STATES_BY_COUNTRY[normalized] || [];
    return items.map((i) => ({
        value: i.value || i.text,
        text: i.text,
        stateName: i.text,
    }));
}

async function fetchCountryStateCities(country: string, stateName: string, stateCode?: string, signal?: AbortSignal): Promise<string[]> {
    return getCountryCities(country, stateCode, stateName);
}

interface FormData {
    fullName: string;
    taxId: string;
    idCard: string;
    rg: string;
    foreignIdentity: string;
    dateOfBirth: string;
    landline: string;
    mobile: string;
    email: string;
    address: string;
    number: string;
    complement: string;
    neighborhood: string;
    country: string;
    city: string;
    state: string;
    postalCode: string;
    acceptTerms: boolean;
}

export default function GuardianRegistration() {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const profile = useAppSelector((s: RootState) => s.userProfile.profile);
    const userId = profile?.id || '';
    const [unreadCount, setUnreadCount] = useState(0);
    const guardianId = (searchParams.get('guardianId') || '').trim() || null;
    const isEditing = !!guardianId;
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        taxId: '',
        idCard: '',
        rg: '',
        foreignIdentity: '',
        dateOfBirth: '',
        landline: '',
        mobile: '',
        email: '',
        address: '',
        number: '',
        complement: '',
        neighborhood: '',
        country: 'Brazil',
        city: '',
        state: '',
        postalCode: '',
        acceptTerms: true,
    });
    const [loadingGuardian, setLoadingGuardian] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true });
    const toggleSection = (section: number) => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));

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

    const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
    const [loadingStates, setLoadingStates] = useState(false);
    const [cityOptions, setCityOptions] = useState<string[]>([]);
    const [loadingCities, setLoadingCities] = useState(false);

    const handleChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
    }, []);

    useEffect(() => {
        if (!guardianId) return;

        let mounted = true;
        ; (async () => {
            try {
                setLoadingGuardian(true);
                const res = await fetch(`/api/guardians/get-guardians?guardianId=${encodeURIComponent(guardianId)}`);
                const json = await res.json().catch(() => null);
                if (!mounted) return;
                if (!res.ok || !json?.item) {
                    toast.error(typeof json?.error === "string" ? json.error : t('newPatient.guardian.failedToLoadGuardian'));
                    return;
                }
                const item = json.item as any;
                setFormData((prev) => ({
                    ...prev,
                    fullName: String(item.fullName || ''),
                    idCard: String(item.taxId || ''),
                    dateOfBirth: String(item.dateOfBirth || ''),
                    mobile: String(item.phone || ''),
                    email: String(item.email || ''),
                    address: String(item.address || ''),
                    country: String(item.country || prev.country || 'Brazil'),
                    city: String(item.city || ''),
                    state: String(item.state || ''),
                    postalCode: String(item.postalCode || ''),
                    acceptTerms: true,
                }));
                ;
            } finally {
                if (mounted) setLoadingGuardian(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [guardianId]);

    useEffect(() => {
        const country = String(formData.country || '').trim();
        const controller = new AbortController();
        let mounted = true;

        (async () => {
            setLoadingStates(true);
            const options = country ? await fetchCountryStates(country, controller.signal) : [];
            if (!mounted || controller.signal.aborted) return;
            setStateOptions(options);
            setLoadingStates(false);
            setFormData((prev) => {
                const stateOk = !!prev.state && options.some((o) => o.value === prev.state);
                if (stateOk) return prev;
                if (!prev.state && !prev.city) return prev;
                return { ...prev, state: "", city: "" };
            });
        })();

        return () => {
            mounted = false;
            controller.abort();
        };
    }, [formData.country]);

    useEffect(() => {
        const selectedState = String(formData.state || '').trim();
        if (!selectedState) {
            setFormData((prev) => (prev.city ? { ...prev, city: "" } : prev));
        }
    }, [formData.state]);

    useEffect(() => {
        const country = String(formData.country || '').trim();
        const selectedState = String(formData.state || '').trim();
        (async () => {
            setLoadingCities(true);
            const stateMeta = stateOptions.find((o) => o.value === selectedState) || null;
            const options = country && selectedState ? await fetchCountryStateCities(country, stateMeta?.stateName || selectedState, selectedState) : [];
            setCityOptions(options);
            setLoadingCities(false);
            setFormData((prev) => {
                const cityOk = !!prev.city && options.some((c) => c === prev.city);
                if (cityOk) return prev;
                if (!prev.city) return prev;
                return { ...prev, city: "" };
            });
        })();
    }, [formData.country, formData.state, stateOptions]);



    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            const fullName = formData.fullName.trim();
            if (!fullName) {
                toast.error(t('auth.fullNameRequired'));
                return;
            }

            const idCard = formData.idCard.trim();
            if (!idCard) {
                toast.error(t('auth.idCardRequired'));
                return;
            }
            // if (!isValidCpf(idCard)) {
            //     toast.error("Please enter a valid ID Card");
            //     return;
            // }

            const postalCode = formData.postalCode.trim();
            if (!postalCode) {
                toast.error(t('auth.postalCodeRequired'));
                return;
            }
            // if (!isValidPostalCode(postalCode)) {
            //     toast.error("Please enter a valid Postal Code");
            //     return;
            // }

            const mobileRaw = String(formData.mobile || "").trim();
            if (!mobileRaw) {
                toast.error(t('auth.phoneNumberRequired'));
                return;
            }
            const parsedPhone = parsePhoneNumberFromString(mobileRaw);
            if (!parsedPhone?.isValid()) {
                toast.error(t('auth.invalidPhoneNumber'));
                return;
            }
            const normalizedPhone = parsedPhone.number;

            const email = String(formData.email || '').trim().toLowerCase();
            if (!isEditing) {
                if (!email) {
                    toast.error(t('auth.emailRequired'));
                    return;
                }
                const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                if (!emailOk) {
                    toast.error(t('auth.invalidEmail'));
                    return;
                }
            }

            const dateOfBirth = String(formData.dateOfBirth || '').trim();
            if (!dateOfBirth) {
                toast.error(t('auth.dateOfBirthRequired'));
                return;
            }
            {
                const dob = new Date(dateOfBirth);
                if (!Number.isFinite(dob.getTime())) {
                    toast.error(t('newPatient.guardian.invalidDateOfBirth'));
                    return;
                }
                {
                    const todayIso = new Date().toISOString().slice(0, 10);
                    if (dateOfBirth >= todayIso) {
                        toast.error(t('auth.dateOfBirthMustBePast'));
                        return;
                    }
                }
                const today = new Date();
                let age = today.getFullYear() - dob.getFullYear();
                const m = today.getMonth() - dob.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
                if (age < 10) {
                    toast.error(t('newPatient.guardian.guardianMinAgeError'));
                    return;
                }
            }

            const address = String(formData.address || '').trim();
            if (!address) {
                toast.error(t('auth.addressRequired'));
                return;
            }

            const country = String(formData.country || '').trim();
            if (!country) {
                toast.error(t('auth.countryRequired'));
                return;
            }

            const selectedState = String(formData.state || '').trim();
            if (!selectedState) {
                toast.error(t('auth.stateRequired'));
                return;
            }
            const selectedStateMeta = stateOptions.find((o) => o.value === selectedState) || null;
            if (!selectedStateMeta) {
                toast.error(t('auth.invalidState'));
                return;
            }

            const city = String(formData.city || '').trim();
            if (!city) {
                toast.error(t('auth.cityRequired'));
                return;
            }

            if (!isEditing && formData.acceptTerms !== true) {
                toast.error(t('auth.mustAcceptTerms'));
                return;
            }

            if (isEditing) {
                if (!guardianId) return;
                const res = await fetch('/api/guardians/get-guardians', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        guardianId,
                        fullName,
                        phone: normalizedPhone,
                        taxId: idCard,
                        dateOfBirth,
                        address,
                        country,
                        city,
                        state: selectedState,
                        postalCode,
                    }),
                });
                const result = await res.json().catch(() => null);
                if (!res.ok) {
                    toast.error(typeof result?.error === "string" ? result.error : t('newPatient.guardian.failedToUpdateGuardian'));
                    return;
                }
                const updatedId = String(result?.id || guardianId);
                router.push(`/Veterinarian/home/guardianDetails/${encodeURIComponent(updatedId)}`);
                return;
            }

            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'vet_create_guardian',
                    fullName,
                    email,
                    phone: normalizedPhone,
                    taxId: idCard,
                    dateOfBirth,
                    address,
                    country,
                    city,
                    state: selectedState,
                    postalCode,
                    profileType: 'Guardian',
                    acceptTerms: true,
                }),
            });
            const result = await res.json();
            if (!res.ok) {
                toast.error(typeof result?.error === "string" ? result.error : t('newPatient.guardian.failedToCreateGuardian'));
                return;
            }
            toast.success(t('newPatient.guardian.guardianCreatedSuccess'));
            router.back();
        } catch (e) {
            toast.error(isEditing ? t('newPatient.guardian.networkErrorUpdatingGuardian') : t('newPatient.guardian.networkErrorCreatingGuardian'));
            console.error(isEditing ? 'Error updating guardian:' : 'Error creating guardian:', e);
        } finally {
            setSubmitting(false);
        }
    };

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
                {/* Step 1 - Active (Guardian Data) */}
                <div className="flex flex-col items-center gap-1.5 z-10">
                    <div className="w-10 h-10 bg-[#3F78D8] rounded-full flex items-center justify-center">
                        <Folder className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-[#3F78D8]">{t('newPatient.guardianDataStep')}</span>
                </div>
                {/* Connecting Line */}
                <div className="absolute top-5 left-5 right-5 h-px bg-[#E8E8E8] z-0" />
                {/* Step 2 - Inactive */}
                <div className="flex flex-col items-center gap-1.5 z-10">
                    <div className="w-10 h-10 rounded-full border-2 border-[#E0E0E0] bg-white flex items-center justify-center">
                        <PawPrint className="w-5 h-5 text-[#C4C4C4]" />
                    </div>
                    <span className="text-xs font-medium text-[#9CA3AF]">{t('newPatient.patientDetailsStep')}</span>
                </div>
            </div>

            {/* White Card */}
            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-6">
                {/* Title & Subtitle */}
                <div>
                    <h2 className="text-[22px] font-bold text-[#1D2939]">{isEditing ? t('newPatient.guardian.editGuardianTitle') : t('newPatient.guardian.registrationTitle')}</h2>
                    <p className="text-sm text-[#8E8E93] mt-1">
                        {t('newPatient.guardian.registrationSubtitle')}
                    </p>
                </div>

                {/* Section 1: Identification */}
                <div>
                    <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection(1)}>
                        <h3 className="text-[15px] font-semibold text-[#1D2939]">{t('newPatient.guardian.identificationSectionTitle')}</h3>
                        {openSections[1] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                    {openSections[1] && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-[#6B7280] mb-1.5">
                                    {t('auth.fullName')}<span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder={t('newPatient.guardian.guardianNamePlaceholder')}
                                    value={formData.fullName}
                                    onChange={(e) => handleChange('fullName', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[#1D2939] placeholder-[#C4C4C4] focus:outline-none focus:ring-2 focus:ring-[#3F78D8] border-0 text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-[#6B7280] mb-1.5">
                                        {t('auth.taxId')}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={t('newPatient.guardian.idCardPlaceholder')}
                                        value={formData.idCard}
                                        onChange={(e) => handleChange('idCard', e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[#1D2939] placeholder-[#C4C4C4] focus:outline-none focus:ring-2 focus:ring-[#3F78D8] border-0 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[#6B7280] mb-1.5">
                                        {t('newPatient.guardian.rgLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={t('newPatient.guardian.rgPlaceholder')}
                                        value={formData.rg}
                                        onChange={(e) => handleChange('rg', e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[#1D2939] placeholder-[#C4C4C4] focus:outline-none focus:ring-2 focus:ring-[#3F78D8] border-0 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-[#6B7280] mb-1.5">
                                        {t('newPatient.guardian.foreignIdentityLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={t('newPatient.guardian.foreignIdentityPlaceholder')}
                                        value={formData.foreignIdentity}
                                        onChange={(e) => handleChange('foreignIdentity', e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[#1D2939] placeholder-[#C4C4C4] focus:outline-none focus:ring-2 focus:ring-[#3F78D8] border-0 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[#6B7280] mb-1.5">
                                        {t('auth.dateOfBirth')}
                                    </label>
                                    <TypedDateInput
                                        value={formData.dateOfBirth}
                                        onChange={(nextIsoDate) => handleChange('dateOfBirth', nextIsoDate)}
                                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().slice(0, 10)}
                                        placeholder="dd/mm/yyyy"
                                        required
                                        className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl text-[#1D2939] placeholder-[#C4C4C4] focus:outline-none focus:ring-2 focus:ring-[#3F78D8] border-0 text-sm pr-12"
                                        iconClassName="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Section 2: Contact Details */}
                <div>
                    <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection(2)}>
                        <h3 className="text-[15px] font-semibold text-[#1D2939]">{t('newPatient.guardian.contactDetailsSectionTitle')}</h3>
                        {openSections[2] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                    {openSections[2] && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-[#6B7280] mb-1.5">
                                        {t('newPatient.guardian.landlineLabel')}
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder={t('newPatient.guardian.landlinePlaceholder')}
                                        value={formData.landline}
                                        onChange={(e) => handleChange('landline', e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[#1D2939] placeholder-[#C4C4C4] focus:outline-none focus:ring-2 focus:ring-[#3F78D8] border-0 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[#6B7280] mb-1.5">
                                        {t('auth.phoneNumber')}
                                    </label>
                                    <PhoneInput
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={(next) => handleChange('mobile', next)}
                                        defaultCountry="br"
                                        required
                                        inputClassName="!w-full !h-12 !px-11 !py-3 !bg-[#F5F5F5] !border-0 !rounded-xl !text-[#1D2939] placeholder:!text-[#C4C4C4] focus:!outline-none focus:!ring-2 focus:!ring-[#3F78D8]"
                                        buttonClassName="!h-12 !bg-[#F5F5F5] !border-0 !rounded-l-xl"
                                        containerClassName="w-full"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-[#6B7280] mb-1.5">
                                    {t('auth.email')}
                                </label>
                                <input
                                    type="email"
                                    placeholder={t('auth.enterEmail')}
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    disabled={isEditing}
                                    className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl text-[#1D2939] placeholder-[#C4C4C4] focus:outline-none focus:ring-2 focus:ring-[#3F78D8] border-0 text-sm disabled:opacity-50"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Section 3: Address Details */}
                <div>
                    <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection(3)}>
                        <h3 className="text-[15px] font-semibold text-[#1D2939]">{t('newPatient.guardian.addressDetailsSectionTitle')}</h3>
                        {openSections[3] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                    {openSections[3] && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-[#6B7280] mb-1.5">
                                        {t('auth.postalCode')}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={t('auth.enterPostalCode')}
                                        value={formData.postalCode}
                                        onChange={(e) => handleChange('postalCode', e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[#1D2939] placeholder-[#C4C4C4] focus:outline-none focus:ring-2 focus:ring-[#3F78D8] border-0 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[#6B7280] mb-1.5">
                                        {t('auth.address')}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={t('auth.enterAddress')}
                                        value={formData.address}
                                        onChange={(e) => handleChange('address', e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[#1D2939] placeholder-[#C4C4C4] focus:outline-none focus:ring-2 focus:ring-[#3F78D8] border-0 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-[#6B7280] mb-1.5">
                                        {t('newPatient.guardian.numberLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={t('newPatient.guardian.numberPlaceholder')}
                                        value={formData.number}
                                        onChange={(e) => handleChange('number', e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[#1D2939] placeholder-[#C4C4C4] focus:outline-none focus:ring-2 focus:ring-[#3F78D8] border-0 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[#6B7280] mb-1.5">
                                        {t('newPatient.guardian.complementLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={t('newPatient.guardian.complementPlaceholder')}
                                        value={formData.complement}
                                        onChange={(e) => handleChange('complement', e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[#1D2939] placeholder-[#C4C4C4] focus:outline-none focus:ring-2 focus:ring-[#3F78D8] border-0 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-sm text-[#6B7280] mb-1.5">
                                        {t('newPatient.guardian.neighborhoodLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={t('newPatient.guardian.neighborhoodPlaceholder')}
                                        value={formData.neighborhood}
                                        onChange={(e) => handleChange('neighborhood', e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-100 rounded-xl text-[#1D2939] placeholder-[#C4C4C4] focus:outline-none focus:ring-2 focus:ring-[#3F78D8] border-0 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[#6B7280] mb-1.5">
                                        {t('auth.city')}
                                    </label>
                                    {cityOptions.length > 0 ? (
                                        <select
                                            value={formData.city}
                                            onChange={(e) => handleChange('city', e.target.value)}
                                            disabled={!formData.state || loadingCities || cityOptions.length === 0}
                                            className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl text-[#1D2939] focus:outline-none focus:ring-2 focus:ring-[#3F78D8] border-0 text-sm disabled:opacity-50"
                                        >
                                            <option value="" disabled>
                                                {!formData.state ? t('auth.selectStateFirst') : loadingCities ? t('auth.loadingCities') : t('auth.selectCity')}
                                            </option>
                                            {cityOptions.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder={t('auth.enterCity')}
                                            value={formData.city}
                                            onChange={(e) => handleChange('city', e.target.value)}
                                            disabled={!formData.state}
                                            className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl text-[#1D2939] placeholder-[#C4C4C4] focus:outline-none focus:ring-2 focus:ring-[#3F78D8] border-0 text-sm disabled:opacity-50"
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm text-[#6B7280] mb-1.5">
                                        {t('auth.state')}
                                    </label>
                                    <select
                                        value={formData.state}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value, city: "" }))}
                                        disabled={loadingStates || stateOptions.length === 0}
                                        className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl text-[#1D2939] focus:outline-none focus:ring-2 focus:ring-[#3F78D8] border-0 text-sm disabled:opacity-50"
                                    >
                                        <option value="" disabled>
                                            {loadingStates ? t('auth.loadingStates') : t('auth.selectState')}
                                        </option>
                                        {stateOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.text}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Fixed Bottom Button */}
            <div className="pb-4">
                <button
                    onClick={handleSubmit}
                    disabled={submitting || loadingGuardian}
                    className="w-full bg-[#3F78D8] hover:bg-[#3F78D8]/90 active:bg-[#3568C0] text-white font-bold text-base py-[15px] rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <Plus className="w-5 h-5" />
                    {submitting || loadingGuardian ? (isEditing ? t('common.saving') : t('newPatient.guardian.adding')) : (isEditing ? t('common.saveChanges') : t('newPatient.guardian.addGuardianButton'))}
                </button>
            </div>
        </div>
    );
}
