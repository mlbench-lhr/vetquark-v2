'use client'
import { useRef, useState } from 'react';
import { ArrowLeft, Bell, Calendar, ChevronLeft, Plus } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import PhoneInput from '@/components/form/group-input/PhoneInput';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { toast } from 'react-toastify';

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
}

export default function GuardianRegistration() {
    const router = useRouter();
    const dobRef = useRef<HTMLInputElement | null>(null);
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
        postalCode: ''
    });

    const handleChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        try {
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

            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'vet_create_guardian',
                    fullName,
                    email: formData.email,
                    phone: normalizedPhone,
                    taxId: idCard,
                    dateOfBirth: formData.dateOfBirth,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    postalCode,
                    profileType: 'Guardian',
                }),
            });
            const result = await res.json();
            if (!res.ok) {
                toast.error(typeof result?.error === "string" ? result.error : "Failed to create guardian");
                return;
            }
            router.push(`/Veterinarian/patient/new_patient?guardianId=${result.id}&guardianName=${encodeURIComponent(formData.fullName)}`);
        } catch (e) {
            toast.error("Network error while creating guardian");
            console.error('Error creating guardian:', e);
        }
    };

    return (
        <div className="min-h-screen p-4">
            {/* Header */}
            <div className=" flex items-center justify-between">
                <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => router.back()}>
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-base font-medium text-gray-900">Guardian Registration</h1>
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
                                ID Card
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
                                Date Of Birth
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
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer"
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
                                Phone Number
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
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="Enter email here"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 3: Address Details */}
                <div className="mb-8">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">3-Address Details</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-900 mb-2">
                                Address
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
                                City
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
                                State
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
                                Postal Code
                            </label>
                            <input
                                type="text"
                                placeholder="Enter postal code i.e 27492"
                                value={formData.postalCode}
                                onChange={(e) => handleChange('postalCode', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Button */}
            <div className=" ">
                <div className="">
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-primary hover:bg-primary/70 text-white font-medium py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add Guardian
                    </button>
                </div>
            </div>
        </div>
    );
}
