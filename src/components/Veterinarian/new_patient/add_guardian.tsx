'use client'
import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, Plus, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import PhoneInput from '@/components/form/group-input/PhoneInput';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { toast } from 'react-toastify';
import { Modal } from '@/components/ui/modal';
import { useModal } from '@/hooks/useModal';

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
    city: string;
    state: string;
    postalCode: string;
    acceptTerms: boolean;
}

export default function GuardianRegistration() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const guardianId = (searchParams.get('guardianId') || '').trim() || null;
    const isEditing = !!guardianId;
    const dobRef = useRef<HTMLInputElement | null>(null);
    const { isOpen: otpModalOpen, openModal: openOtpModal, closeModal: closeOtpModal } = useModal();
    const prevEmailRef = useRef<string>('');
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
        city: '',
        state: '',
        postalCode: '',
        acceptTerms: false,
    });
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [otp, setOtp] = useState('');
    const [emailVerified, setEmailVerified] = useState(false);
    const [emailVerificationId, setEmailVerificationId] = useState<string | null>(null);
    const [loadingGuardian, setLoadingGuardian] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        if (isEditing) return;
        const currentEmail = String(formData.email || '');
        if (prevEmailRef.current === currentEmail) return;
        prevEmailRef.current = currentEmail;
        setEmailVerified(false);
        setEmailVerificationId(null);
        setOtp('');
        closeOtpModal();
    }, [closeOtpModal, formData.email, isEditing]);

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
                    city: String(item.city || ''),
                    state: String(item.state || ''),
                    postalCode: String(item.postalCode || ''),
                    acceptTerms: true,
                }));
                prevEmailRef.current = String(item.email || '');
                setEmailVerified(true);
                setEmailVerificationId(null);
                setOtp('');
                closeOtpModal();
            } finally {
                if (mounted) setLoadingGuardian(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [guardianId, closeOtpModal]);

    const handleSendOtp = async () => {
        if (isEditing) return;
        const email = String(formData.email || '').trim().toLowerCase();
        if (!email) {
            toast.error("Email is required");
            return;
        }
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!emailOk) {
            toast.error("Please enter a valid email");
            return;
        }

        try {
            setSendingOtp(true);
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'vet_guardian_send_otp', email }),
            });
            const result = await res.json();
            if (!res.ok) {
                toast.error(typeof result?.error === "string" ? result.error : "Failed to send verification code");
                return;
            }
            toast.success(typeof result?.message === "string" ? result.message : "OTP sent");
            openOtpModal();
        } catch {
            toast.error("Network error while sending verification code");
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (isEditing) return;
        const email = String(formData.email || '').trim().toLowerCase();
        const code = otp.replace(/\D/g, '').slice(0, 5);
        if (code.length !== 5) {
            toast.error("Please enter the 5-digit code");
            return;
        }
        try {
            setVerifyingOtp(true);
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'vet_guardian_verify_otp', email, otp: code }),
            });
            const result = await res.json();
            if (!res.ok) {
                toast.error(typeof result?.error === "string" ? result.error : "Verification failed");
                return;
            }
            const verificationId = typeof result?.verificationId === "string" ? result.verificationId : null;
            if (!verificationId) {
                toast.error("Verification failed");
                return;
            }
            setEmailVerified(true);
            setEmailVerificationId(verificationId);
            closeOtpModal();
            toast.success("Email verified");
        } catch {
            toast.error("Network error while verifying code");
        } finally {
            setVerifyingOtp(false);
        }
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            const fullName = formData.fullName.trim();
            if (!fullName) {
                toast.error("Full name is required");
                return;
            }

            const idCard = formData.idCard.trim();
            if (!idCard) {
                toast.error("ID Card is required");
                return;
            }
            // if (!isValidCpf(idCard)) {
            //     toast.error("Please enter a valid ID Card");
            //     return;
            // }

            const postalCode = formData.postalCode.trim();
            if (!postalCode) {
                toast.error("Postal Code is required");
                return;
            }
            // if (!isValidPostalCode(postalCode)) {
            //     toast.error("Please enter a valid Postal Code");
            //     return;
            // }

            const mobileRaw = String(formData.mobile || "").trim();
            if (!mobileRaw) {
                toast.error("Phone number is required");
                return;
            }
            const parsedPhone = parsePhoneNumberFromString(mobileRaw);
            if (!parsedPhone?.isValid()) {
                toast.error("Please enter a valid phone number");
                return;
            }
            const normalizedPhone = parsedPhone.number;

            const email = String(formData.email || '').trim().toLowerCase();
            if (!isEditing) {
                if (!email) {
                    toast.error("Email is required");
                    return;
                }
                const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                if (!emailOk) {
                    toast.error("Please enter a valid email");
                    return;
                }
            }

            const dateOfBirth = String(formData.dateOfBirth || '').trim();
            if (!dateOfBirth) {
                toast.error("Date of birth is required");
                return;
            }

            const address = String(formData.address || '').trim();
            if (!address) {
                toast.error("Address is required");
                return;
            }

            const city = String(formData.city || '').trim();
            if (!city) {
                toast.error("City is required");
                return;
            }

            const state = String(formData.state || '').trim();
            if (!state) {
                toast.error("State is required");
                return;
            }

            if (!isEditing && formData.acceptTerms !== true) {
                toast.error("Terms must be accepted");
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
                        city,
                        state,
                        postalCode,
                    }),
                });
                const result = await res.json().catch(() => null);
                if (!res.ok) {
                    toast.error(typeof result?.error === "string" ? result.error : "Failed to update guardian");
                    return;
                }
                const updatedId = String(result?.id || guardianId);
                router.push(`/Veterinarian/home/guardianDetails/${encodeURIComponent(updatedId)}`);
                return;
            }

            if (!emailVerified || !emailVerificationId) {
                toast.error("Please verify the email first");
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
                    city,
                    state,
                    postalCode,
                    profileType: 'Guardian',
                    acceptTerms: true,
                    verificationId: emailVerificationId,
                }),
            });
            const result = await res.json();
            if (!res.ok) {
                toast.error(typeof result?.error === "string" ? result.error : "Failed to create guardian");
                return;
            }
            router.push(`/Veterinarian/patient/new_patient?guardianId=${result.id}&guardianName=${encodeURIComponent(formData.fullName)}`);
        } catch (e) {
            toast.error(isEditing ? "Network error while updating guardian" : "Network error while creating guardian");
            console.error(isEditing ? 'Error updating guardian:' : 'Error creating guardian:', e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen p-4">
            {/* Header */}
            <div className=" flex items-center justify-between">
                <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => router.back()}>
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                    <h1 className="text-base font-medium text-gray-900">{isEditing ? "Edit Guardian" : "Guardian Registration"}</h1>
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

            {/* Form Content */}
            <div className="">

                {/* Section 1: Identification */}
                <div className="mb-8">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">1-Identification</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-900 mb-2">
                                Full Name<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Guardian's Name"
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
                                ID Card<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="i.e 000.000.000-00"
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
                                Date Of Birth<span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    ref={dobRef}
                                    type="date"
                                    max={new Date().toISOString().slice(0, 10)}
                                    placeholder="Select date of birth"
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
                    <h2 className="text-base font-semibold text-gray-900 mb-4">2-Contact Details</h2>

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
                                Phone Number<span className="text-red-500">*</span>
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
                                Email<span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Enter email here"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    disabled={isEditing}
                                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                {!isEditing ? (
                                    <button
                                        type="button"
                                        onClick={handleSendOtp}
                                        disabled={sendingOtp || emailVerified}
                                        className="shrink-0 px-4 py-3 rounded-lg bg-primary text-white font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {emailVerified ? "Verified" : sendingOtp ? "Sending..." : "Verify"}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Address Details */}
                <div className="mb-8">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">3-Address Details</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-900 mb-2">
                                Address<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your address"
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-900 mb-2">
                                City<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your city name"
                                value={formData.city}
                                onChange={(e) => handleChange('city', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-900 mb-2">
                                State<span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.state}
                                onChange={(e) => handleChange('state', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="" disabled>
                                    Select a state
                                </option>
                                {brazilianStateOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.text}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-900 mb-2">
                                Postal Code<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter postal code i.e 27492"
                                value={formData.postalCode}
                                onChange={(e) => handleChange('postalCode', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="flex items-start gap-3 pt-2">
                            <input
                                type="checkbox"
                                checked={formData.acceptTerms}
                                onChange={(e) => setFormData((prev) => ({ ...prev, acceptTerms: e.target.checked }))}
                                disabled={isEditing}
                                className="mt-1 w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                            />
                            <label className="text-sm text-gray-700">
                                By continuing you agree to our{" "}
                                <span className="text-primary font-medium">Terms of use</span> &{" "}
                                <span className="text-primary font-medium">LGPD/Privacy</span>
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
                        disabled={(isEditing ? false : !emailVerified) || submitting || loadingGuardian}
                        className="w-full bg-primary hover:bg-primary/70 text-white font-medium py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-5 h-5" />
                        {submitting || loadingGuardian ? (isEditing ? "Saving..." : "Adding...") : (isEditing ? "Save Changes" : "Add Guardian")}
                    </button>
                </div>
            </div>

            <Modal isOpen={otpModalOpen && !isEditing} onClose={closeOtpModal} className="max-w-[420px] mx-4 p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Email Verification</h3>
                        <p className="text-sm text-gray-600 mt-1">Enter the 5-digit code sent to {String(formData.email || '').trim()}</p>
                    </div>
                    <button type="button" onClick={closeOtpModal} className="p-2 rounded-lg hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-700" />
                    </button>
                </div>

                <div className="mt-5 space-y-4">
                    <input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        inputMode="numeric"
                        placeholder="12345"
                        className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary text-center tracking-widest text-lg"
                    />
                    <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={verifyingOtp}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {verifyingOtp ? "Verifying..." : "Verify Code"}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
