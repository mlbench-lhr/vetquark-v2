'use client'
import { useCallback, useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, Plus, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import PhoneInput from '@/components/form/group-input/PhoneInput';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { toast } from 'react-toastify';
import { Modal } from '@/components/ui/modal';
import { useModal } from '@/hooks/useModal';
import { useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store/store';
import Pusher from 'pusher-js';
import { useTranslation } from 'react-i18next';
import { STATES_BY_COUNTRY, getCountryCities } from '@/lib/locationData';
import Header from '@/components/common/header';

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
    foreignIdentity: string;
    dateOfBirth: string;
    landline: string;
    mobile: string;
    email: string;
    address: string;
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
    const dobRef = useRef<HTMLInputElement | null>(null);
    const { isOpen: successOpen, openModal: openSuccess, closeModal: closeSuccess } = useModal();
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        taxId: '',
        idCard: '',
        foreignIdentity: '',
        dateOfBirth: '',
        landline: '',
        mobile: '',
        email: '',
        address: '',
        country: 'Brazil',
        city: '',
        state: '',
        postalCode: '',
        acceptTerms: false,
    });
    const [loadingGuardian, setLoadingGuardian] = useState(false);
    const [submitting, setSubmitting] = useState(false);

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
                    toast.error(typeof json?.error === "string" ? json.error : "Failed to load guardian");
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
                    toast.error('Invalid date of birth');
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
                    toast.error('Guardian must be at least 10 years old');
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
            toast.success(t('auth.emailVerification'));
            openSuccess();
        } catch (e) {
            toast.error(isEditing ? t('newPatient.guardian.networkErrorUpdatingGuardian') : t('newPatient.guardian.networkErrorCreatingGuardian'));
            console.error(isEditing ? 'Error updating guardian:' : 'Error creating guardian:', e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-scree">
            {/* Header */}
            <Header title={isEditing ? t('newPatient.guardian.editGuardianTitle') : t('newPatient.guardian.registrationTitle')} />
            {/* Form Content */}
            <div className="">

                {/* Section 1: Identification */}
                <div className="mb-8">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">{t('newPatient.guardian.identificationSectionTitle')}</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-900 mb-2">
                                {t('auth.fullName')}<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder={t('newPatient.guardian.guardianNamePlaceholder')}
                                value={formData.fullName}
                                onChange={(e) => handleChange('fullName', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* <div>
                            <label className="block text-sm text-gray-900 mb-2">
                                Tax Identification Number
                            </label>
                            <input
                                type="text"
                                placeholder="i.e AB374892928"
                                value={formData.taxId}
                                onChange={(e) => handleChange('taxId', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div> */}

                        <div>
                            <label className="block text-sm text-gray-900 mb-2">
                                {t('newPatient.guardian.idCardLabel')}<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                placeholder={t('newPatient.guardian.idCardPlaceholder')}
                                value={formData.idCard}
                                onChange={(e) => handleChange('idCard', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* <div>
                            <label className="block text-sm text-gray-900 mb-2">
                                Foreign Identity
                            </label>
                            <input
                                type="text"
                                placeholder="Passport/ID"
                                value={formData.foreignIdentity}
                                onChange={(e) => handleChange('foreignIdentity', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div> */}

                        <div>
                            <label className="block text-sm text-gray-900 mb-2">
                                {t('auth.dateOfBirth')}<span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    ref={dobRef}
                                    type="date"
                                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString().slice(0, 10)}
                                    placeholder={t('newPatient.patientForm.selectDateOfBirth')}
                                    value={formData.dateOfBirth}
                                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                                    style={{ colorScheme: 'light' }}
                                />
                                <Calendar
                                    color='#3F78D8'
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-40 cursor-pointer"
                                    onClick={() => {
                                        const el = dobRef.current as any;
                                        if (!el) return;
                                        if (typeof el.showPicker === "function") el.showPicker();
                                        else el.click();
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Contact Details */}
                <div className="mb-8">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">{t('newPatient.guardian.contactDetailsSectionTitle')}</h2>

                    <div className="space-y-4">
                        {/* <div>
                            <label className="block text-sm text-gray-900 mb-2">
                                Landline
                            </label>
                            <input
                                type="tel"
                                placeholder="Guardian's Landline"
                                value={formData.landline}
                                onChange={(e) => handleChange('landline', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div> */}

                        <div>
                            <label className="block text-sm text-gray-900 mb-2">
                                {t('auth.phoneNumber')}<span className="text-red-500">*</span>
                            </label>
                            <PhoneInput
                                name="mobile"
                                value={formData.mobile}
                                onChange={(next) => handleChange('mobile', next)}
                                defaultCountry="br"
                                required
                                inputClassName="!w-full !h-12 !px-11 !py-3 !bg-gray-100 !border-0 !rounded-lg !text-gray-900 placeholder:!text-gray-400 focus:!outline-none focus:!ring-2 focus:!ring-primary"
                                buttonClassName="!h-12 !bg-gray-100 !border-0 !rounded-lg"
                                containerClassName="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-900 mb-2">
                                {t('auth.email')}<span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder={t('auth.enterEmail')}
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    disabled={isEditing}
                                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Address Details */}
                <div className="mb-8">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">{t('newPatient.guardian.addressDetailsSectionTitle')}</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-900 mb-2">
                                {t('auth.address')}<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder={t('auth.enterAddress')}
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-900 mb-2">
                                {t('auth.country')}<span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.country}
                                onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value, state: "", city: "" }))}
                                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="" disabled>
                                    {t('auth.selectCountry')}
                                </option>
                                {countryOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.text}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-900 mb-2">
                                {t('auth.state')}<span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.state}
                                onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value, city: "" }))}
                                disabled={!formData.country || loadingStates || stateOptions.length === 0}
                                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="" disabled>
                                    {!formData.country ? t('auth.selectCountryFirst') : loadingStates ? t('auth.loadingStates') : t('auth.selectState')}
                                </option>
                                {stateOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.text}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-900 mb-2">
                                {t('auth.city')}<span className="text-red-500">*</span>
                            </label>
                            {cityOptions.length > 0 ? (
                                <select
                                    value={formData.city}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                    disabled={!formData.state || loadingCities || cityOptions.length === 0}
                                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="" disabled>
                                        {!formData.state ? t('auth.selectStateFirst') : loadingCities ? t('auth.loadingCities') : t('auth.selectCity')}
                                    </option>
                                    {cityOptions.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    placeholder={t('auth.enterCity')}
                                    value={formData.city}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                    disabled={!formData.state}
                                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            )}
                        </div>

                        <div>
                            <label className="block text-sm text-gray-900 mb-2">
                                {t('auth.postalCode')}<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                placeholder={t('auth.enterPostalCode')}
                                value={formData.postalCode}
                                onChange={(e) => handleChange('postalCode', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="flex items-end gap-3 pt-2">
                            <input
                                type="checkbox"
                                checked={formData.acceptTerms}
                                onChange={(e) => setFormData((prev) => ({ ...prev, acceptTerms: e.target.checked }))}
                                disabled={isEditing}
                                className="mt-1 w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                            />
                            <label className="text-sm text-gray-700">
                                {t('auth.acceptTerms')}
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Button */}
            <div className=" ">
                <div className="">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || loadingGuardian}
                        className="w-full bg-primary hover:bg-primary/70 text-white font-medium py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-5 h-5" />
                        {submitting || loadingGuardian ? (isEditing ? t('common.saving') : t('newPatient.guardian.adding')) : (isEditing ? t('common.saveChanges') : t('newPatient.guardian.addGuardianButton'))}
                    </button>
                </div>
            </div>

            <Modal isOpen={successOpen && !isEditing} onClose={() => { closeSuccess(); router.back(); }} className="max-w-[420px] mx-4 p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{t('auth.emailVerification')}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            A verification link has been sent to the guardian. You can select them once they verify their account.
                        </p>
                    </div>
                    <button type="button" onClick={() => { closeSuccess(); router.back(); }} className="p-2 rounded-lg hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-700" />
                    </button>
                </div>
                <div className="mt-5">
                    <button
                        type="button"
                        onClick={() => { closeSuccess(); router.back(); }}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg"
                    >
                        {t('common.back')}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
