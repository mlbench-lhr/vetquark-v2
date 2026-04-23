"use client";

import React, { useRef, useState } from "react";
import { Eye, EyeOff, Check, ChevronLeft } from "lucide-react";
import MultiSelect from "@/components/form/MultiSelect";
import DropdownSelect from "@/components/form/DropdownSelect";
import { toast } from "react-toastify";
import { useRouter, useSearchParams } from "next/navigation";
import PhoneInput from "@/components/form/group-input/PhoneInput";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { useAppDispatch } from "@/store/hooks";
import { setProfile as setUserProfile } from "@/store/userProfileSlice";
import { useTranslation } from "react-i18next";
import { STATES_BY_COUNTRY, getCountryCities } from "@/lib/locationData";
import Image from "next/image";
import TypedDateInput from "@/components/form/input/TypedDateInput";

type ProfileType = "veterinarian";

type SignUpFormData = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  taxId: string;
  dateOfBirth: string;
  address: string;
  country: string;
  city: string;
  state: string;
  postalCode: string;
  crmv: string;
  crmvState: string;
  mapaRegistration: string;
  operateHow: string;
  expertise: string[];
  acceptTerms: boolean;
  clinicLogoUrl: string;
  tradeName: string;
  cnpjIe: string;
  reportHeaderAddress: string;
  reportFooter: string;
  veterinarianCode: string;
};

const getEmptyFormData = (): SignUpFormData => ({
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  taxId: "",
  dateOfBirth: "",
  address: "",
  country: "Brazil",
  city: "",
  state: "",
  postalCode: "",
  crmv: "",
  crmvState: "",
  mapaRegistration: "",
  operateHow: "",
  expertise: [],
  acceptTerms: false,
  clinicLogoUrl: "",
  tradeName: "",
  cnpjIe: "",
  reportHeaderAddress: "",
  reportFooter: "",
  veterinarianCode: "",
});

export default function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [profileType] = useState<ProfileType>("veterinarian");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const RESEND_COOLDOWN_SECONDS = 35;
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const OTP_LENGTH = 5;

  React.useEffect(() => {
    if (step !== 3 || countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearTimeout(id);
  }, [step, countdown]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingClinicLogo, setUploadingClinicLogo] = useState(false);

  const expertiseOptions = [
    { value: "acupuncture", text: t("auth.acupuncture"), selected: false },
    { value: "anesthesia", text: t("auth.anesthesia"), selected: false },
    { value: "beef-dairy-cattle", text: t("auth.beefDairyCattle"), selected: false },
    { value: "cardiology", text: t("auth.cardiology"), selected: false },
    { value: "surgical-clinic-large-animals", text: t("auth.surgicalClinicLarge"), selected: false },
    { value: "surgical-clinic-small-animals", text: t("auth.surgicalClinicSmall"), selected: false },
    { value: "feline-medicine", text: t("auth.felineMedicine"), selected: false },
    { value: "medical-clinic-large-animals", text: t("auth.medicalClinicLarge"), selected: false },
    { value: "medical-clinic-small-animals", text: t("auth.medicalClinicSmall"), selected: false },
    { value: "behavioral-medicine", text: t("auth.behavioralMedicine"), selected: false },
    { value: "dermatology", text: t("auth.dermatology"), selected: false },
    { value: "endocrinology", text: t("auth.endocrinology"), selected: false },
    { value: "physiotherapy", text: t("auth.physiotherapy"), selected: false },
    { value: "flower-therapy", text: t("auth.flowerTherapy"), selected: false },
    { value: "gastroenterology", text: t("auth.gastroenterology"), selected: false },
    { value: "geriatrics", text: t("auth.geriatrics"), selected: false },
    { value: "homeopathy", text: t("auth.homeopathy"), selected: false },
    { value: "immunology", text: t("auth.immunology"), selected: false },
    { value: "alternative-medicine", text: t("auth.alternativeMedicine"), selected: false },
    { value: "diagnostic-medicine", text: t("auth.diagnosticMedicine"), selected: false },
    { value: "nephrology", text: t("auth.nephrology"), selected: false },
    { value: "neurology", text: t("auth.neurology"), selected: false },
    { value: "nutrition", text: t("auth.nutrition"), selected: false },
    { value: "dentistry", text: t("auth.dentistry"), selected: false },
    { value: "ophthalmology", text: t("auth.ophthalmology"), selected: false },
    { value: "oncology", text: t("auth.oncology"), selected: false },
    { value: "orthopedics", text: t("auth.orthopedics"), selected: false },
    { value: "parasitology", text: t("auth.parasitology"), selected: false },
    { value: "pediatrics", text: t("auth.pediatrics"), selected: false },
    { value: "animal-production", text: t("auth.animalProduction"), selected: false },
    { value: "reiki", text: t("auth.reiki"), selected: false },
    { value: "reproduction-large-animals", text: t("auth.reproductionLarge"), selected: false },
    { value: "reproduction-small-animals", text: t("auth.reproductionSmall"), selected: false },
    { value: "intensive-care", text: t("auth.intensiveCare"), selected: false },
  ];

  const operateOptions = [
    { value: "Clinic/pet Shop Service", text: t("auth.clinicPetShopService") },
    { value: "Home Care", text: t("auth.homeCare") },
    { value: "Clinic/pet Shop Management", text: t("auth.clinicPetShopManagement") },
    { value: "Other", text: t("auth.other") },
  ];

  const countryOptions = [
    { value: "Brazil", text: "Brazil" },
    // { value: "Argentina", text: "Argentina" },
    // { value: "Canada", text: "Canada" },
    // { value: "Chile", text: "Chile" },
    // { value: "Colombia", text: "Colombia" },
    // { value: "Mexico", text: "Mexico" },
    // { value: "Portugal", text: "Portugal" },
    // { value: "Spain", text: "Spain" },
    // { value: "United Kingdom", text: "United Kingdom" },
    // { value: "United States", text: "United States" },
  ];

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

  const [formData, setFormData] = useState<SignUpFormData>(() => getEmptyFormData());

  const finalStep = 6;

  const resetInnerFormFields = () => {
    setFormData(getEmptyFormData());
    setShowPassword(false);
    setShowConfirmPassword(false);
    setOtp(["", "", "", "", ""]);
    setCountdown(0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const name = (target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).name as keyof SignUpFormData;
    let nextValue: SignUpFormData[keyof SignUpFormData];
    if ((target as HTMLInputElement).type === "checkbox") {
      nextValue = (target as HTMLInputElement).checked as SignUpFormData[keyof SignUpFormData];
    } else if (target instanceof HTMLSelectElement && target.multiple) {
      nextValue = Array.from(target.selectedOptions).map((o) => o.value) as SignUpFormData[keyof SignUpFormData];
    } else {
      nextValue = (target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value as SignUpFormData[keyof SignUpFormData];
      if (name === "password" || name === "confirmPassword") {
        nextValue = (nextValue as string).trim() as SignUpFormData[keyof SignUpFormData];
      }
    }
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  React.useEffect(() => {
    const v = String(searchParams.get("vetCode") || "").trim();
    if (v) setFormData((prev) => ({ ...prev, veterinarianCode: v }));
  }, [searchParams]);

  React.useEffect(() => {
    const country = String(formData.country || "").trim();
    (async () => {
      setLoadingStates(true);
      const options = country ? await fetchCountryStates(country) : [];
      setStateOptions(options);
      setLoadingStates(false);
      setFormData((prev) => {
        const stateOk = !!prev.state && options.some((o) => o.value === prev.state);
        if (stateOk) return prev;
        if (!prev.state && !prev.city) return prev;
        return { ...prev, state: "", city: "" };
      });
    })();
  }, [formData.country]);

  React.useEffect(() => {
    const selectedState = String(formData.state || "").trim();
    if (!selectedState) {
      setFormData((prev) => (prev.city ? { ...prev, city: "" } : prev));
    }
  }, [formData.state]);

  React.useEffect(() => {
    const country = String(formData.country || "").trim();
    const selectedState = String(formData.state || "").trim();
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

  const handleClinicLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    if (!CLOUD_NAME || !API_KEY) {
      toast.error(t("common.cloudinaryNotConfigured"));
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("common.fileTooLarge"));
      return;
    }

    setUploadingClinicLogo(true);
    try {
      const signRes = await fetch(`/api/cloudinary/upload?folder=clinic_logos`);
      const signJson = await signRes.json();

      if (!signRes.ok) {
        toast.error(t("common.failedToPrepareUpload"));
        console.error("Cloudinary signature error:", signJson);
        return;
      }
      const { timestamp, signature } = signJson;

      const data = new FormData();
      data.append("file", file);
      data.append("api_key", API_KEY);
      data.append("timestamp", String(timestamp));
      data.append("signature", signature);
      data.append("folder", "clinic_logos");

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(t("common.uploadFailed"));
        console.error("Cloudinary upload failed:", json);
        return;
      }
      const url = json.secure_url || json.url;
      if (url) {
        setFormData((prev) => ({ ...prev, clinicLogoUrl: url }));
      }
    } catch (err) {
      toast.error(t("common.uploadFailed"));
      console.error("Cloudinary upload error:", err);
    } finally {
      setUploadingClinicLogo(false);
      e.target.value = "";
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
        }, 0);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!paste) return;

    const newOtp = Array(OTP_LENGTH).fill("");
    const pasteArray = paste.split("");
    for (let i = 0; i < OTP_LENGTH; i++) {
      newOtp[i] = pasteArray[i] || "";
    }
    setOtp(newOtp);

    const filled = Math.min(pasteArray.length, OTP_LENGTH) - 1;
    const focusIndex = filled >= 0 ? filled : 0;
    setTimeout(() => {
      inputRefs.current[focusIndex]?.focus();
    }, 0);
  };

  const handleInputClick = (index: number) => {
    // Focus the first empty field or the clicked field
    const firstEmptyIndex = otp.findIndex(digit => !digit);
    if (firstEmptyIndex !== -1 && firstEmptyIndex < index) {
      inputRefs.current[firstEmptyIndex]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (step !== 3 || countdown > 0) return;
    try {
      const res = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      if (!res.ok) {
        const message = typeof data.error === 'string' ? data.error : 'Failed to resend OTP';
        toast.error(message);
        if (res.status === 429 && typeof data.error === "string") {
          const m = data.error.match(/(\d+)\s*s/);
          if (m) setCountdown(Math.max(0, parseInt(m[1], 10)));
        }
        console.error('Resend error:', data.error || data);
        return;
      }
      toast.success(data.message ?? 'OTP resent');
      setCountdown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      toast.error('Network error while resending OTP');
      console.error('Resend network error:', err);
    }
  };

  const handleNext = async () => {
    if (step < finalStep) {
      setStep(step + 1);
      return;
    }
    try {
      setSubmitting(true);
      const basePayload = {
        mode: "complete" as const,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        taxId: formData.taxId,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        country: formData.country,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        operateHow: formData.operateHow,
        expertise: formData.expertise,
        acceptTerms: formData.acceptTerms,
        profileType: "veterinarian" as const,
        role: "veterinarian" as const,
      };
      const payload = {
        ...basePayload,
        crmv: formData.crmv,
        crmvState: formData.crmvState,
        mapaRegistration: formData.mapaRegistration,
        clinicLogoUrl: formData.clinicLogoUrl || undefined,
        tradeName: formData.tradeName,
        cnpjIe: formData.cnpjIe || undefined,
        reportHeaderAddress: formData.reportHeaderAddress,
        reportFooter: formData.reportFooter,
      };
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data.error === 'string' ? data.error : 'Signup failed');
        console.error("Signup error:", data.error || data);
        return;
      }
      toast.success(t("auth.accountCreated"));
      const id = (data?.id ? String(data.id) : "").trim();
      const homeHref = "/Veterinarian/home";
      try {
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: formData.password, role: "veterinarian" }),
          credentials: "include",
        });
        const loginData = await loginRes.json().catch(() => null);
        if (loginRes.ok && loginData?.profile) {
          dispatch(setUserProfile(loginData.profile));
        }
      } catch {
      }

      if (!id) {
        router.push(homeHref);
        return;
      }
      router.push(
        `/upload-profile-picture?userId=${encodeURIComponent(id)}&profileType=veterinarian`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleVerifySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 5) {
      toast.error(t("auth.enterOtpCode"));
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data.error === 'string' ? data.error : 'Verification failed');
        console.error("Verify error:", data.error || data);
        return;
      }
      toast.success(data.message ?? "Email verified");
      handleNext();
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const passwordInput = form.querySelector('input[name="password"]') as HTMLInputElement | null;
    const confirmInput = form.querySelector('input[name="confirmPassword"]') as HTMLInputElement | null;
    if (!passwordInput || !confirmInput) {
      handleNext();
      return;
    }
    const whitespaceRe = /[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/;
    passwordInput.setCustomValidity("");
    confirmInput.setCustomValidity("");
    if (whitespaceRe.test(passwordInput.value)) {
      passwordInput.setCustomValidity("Password must not contain spaces");
      passwordInput.reportValidity();
      return;
    }
    if (whitespaceRe.test(confirmInput.value)) {
      confirmInput.setCustomValidity("Confirm password must not contain spaces");
      confirmInput.reportValidity();
      return;
    }
    if (passwordInput.value !== confirmInput.value) {
      confirmInput.setCustomValidity("Passwords do not match");
      confirmInput.reportValidity();
      return;
    }

    const parsedPhone = parsePhoneNumberFromString(String(formData.phone || "").trim());
    if (!parsedPhone?.isValid()) {
      toast.error(t("auth.invalidPhoneNumber"));
      return;
    }
    const normalizedPhone = parsedPhone.number;

    try {
      setSubmitting(true);
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "init",
          fullName: formData.fullName,
          email: formData.email,
          phone: normalizedPhone,
          password: formData.password,
          profileType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data.error === 'string' ? data.error : 'Failed to start signup');
        console.error("Step 2 signup error:", data.error || data);
        return;
      }
      toast.success(data.message ?? "OTP sent to your email");
      setCountdown(RESEND_COOLDOWN_SECONDS);
      handleNext();
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
      case 2:

        return (
          <form id="signup-step-2" onSubmit={(e) => { e.preventDefault(); handleStep2Submit(e) }} className="pt-8">
            <div className="space-y-4">
              <div>
                <label className="block text-gray-900 text-sm mb-2 ">
                  {t("auth.fullName")}
                </label>
                <input
                  type="text"
                  name="fullName"
                  placeholder={t("auth.enterFullName")}
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none  text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-900 text-sm mb-2">
                  {t("auth.email")}
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder={t("auth.enterEmail")}
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none  text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-900 text-sm mb-2">
                  {t("auth.phoneNumber")}
                </label>
                <PhoneInput
                  name="phone"
                  value={formData.phone}
                  onChange={(next) => setFormData((prev) => ({ ...prev, phone: next }))}
                  defaultCountry="br"
                  required
                  inputClassName="!w-full !h-12 !px-11 !py-3 !bg-gray-50 !rounded-xl !border-0 !text-gray-800 placeholder:!text-gray-400 focus:!outline-none"
                  buttonClassName="!h-12 !bg-gray-50 !border-0 !rounded-xl"
                  containerClassName="w-full"
                />
              </div>

              <div>
                <label className="block text-gray-900 text-sm mb-2">
                  {t("auth.password")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder={t("auth.enterPassword")}
                    value={formData.password}
                    onChange={handleInputChange}
                    onInput={(e) => e.currentTarget.setCustomValidity("")}
                    onInvalid={(e) => {
                      const el = e.currentTarget;
                      if (el.validity.valueMissing) {
                        el.setCustomValidity(t("auth.passwordRequired"));
                      }
                    }}
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none  text-gray-800 placeholder-gray-400 pr-12"
                    onKeyDown={(e) => { if (/\s/.test(e.key)) e.preventDefault(); }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const text = e.clipboardData.getData("text").replace(/\s+/gu, "");
                      const el = e.currentTarget;
                      el.setCustomValidity("");
                      setFormData((prev) => ({ ...prev, password: text }));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-900 text-sm mb-2">
                  {t("auth.confirmPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder={t("auth.confirmPassword")}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onInput={(e) => (e.currentTarget.setCustomValidity(""))}
                    onInvalid={(e) => {
                      const el = e.currentTarget;
                      if (el.validity.valueMissing) {
                        el.setCustomValidity(t("auth.passwordRequired"));
                      }
                    }}
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none  text-gray-800 placeholder-gray-400 pr-12"
                    onKeyDown={(e) => { if (/\s/.test(e.key)) e.preventDefault(); }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const text = e.clipboardData.getData("text").replace(/\s+/gu, "");
                      const el = e.currentTarget;
                      el.setCustomValidity("");
                      setFormData((prev) => ({ ...prev, confirmPassword: text }));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-1"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </form>
        );

      case 3:
        return (
          <form id="signup-step-3" onSubmit={handleVerifySubmit} className="pt-8">
            <h1 className="text-2xl font-medium text-gray-900 mb-2">
              {t("auth.emailVerification")}
            </h1>
            <p className="text-sm text-tertiary ">
              {t("auth.enterVerificationCode")}
            </p>
            <p className="text-primary font-medium mb-1">
              {`${String(Math.floor(countdown / 60)).padStart(2, '0')}:${String(countdown % 60).padStart(2, '0')}`}
            </p>
            <p className="text-xs text-gray-500 mb-8">This code expires in 10 minutes</p>

            <div className="flex justify-center gap-3 mb-8">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onPaste={handlePaste}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onClick={() => handleInputClick(index)}
                  className="w-12 h-12 text-center border border-gray-300 rounded-lg focus:outline-none text-lg bg-gray-50"
                  maxLength={1}
                  required // ✅ this enables native validation
                  autoComplete="off"
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-4 rounded-full transition-colors cursor-pointer border-0 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t("auth.verify")}
                </span>
              ) : t("auth.verify")}
            </button>
            <p className="text-center text-gray-600 mt-4">
              {t("auth.didntGetCode")}{" "}
              <button onClick={handleResendOtp} disabled={countdown > 0} className="text-primary hover:text-blue-700 font-medium bg-transparent border-0 cursor-pointer disabled:opacity-50">
                {countdown > 0 ? `${t("auth.resendIn")} ${String(Math.floor(countdown / 60)).padStart(2, '0')}:${String(countdown % 60).padStart(2, '0')}` : t("auth.sendAgain")}
              </button>
            </p>

          </form>
        );

      case 4:
        return (
          <form id="signup-step-4" onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="pt-8">
            <div className="space-y-4">
              <div>
                <label className="block text-gray-900 text-sm mb-2">
                  {t("auth.taxId")}
                </label>
                <input
                  type="number"
                  name="taxId"
                  placeholder={t("auth.egTaxId")}
                  value={formData.taxId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none  text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-900 text-sm mb-2">
                  {t("auth.dateOfBirth")}
                </label>
                <TypedDateInput
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={(nextIsoDate) => setFormData((prev) => ({ ...prev, dateOfBirth: nextIsoDate }))}
                  required
                  max={new Date().toISOString().slice(0, 10)}
                  placeholder="dd/mm/yyyy"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none text-gray-800 pr-12"
                  iconClassName="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-gray-900 text-sm mb-2">
                  {t("auth.address")}
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder={t("auth.enterAddress")}
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none  text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-900 text-sm mb-2">
                  {t("auth.country")}
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value, state: "", city: "" }))}
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none text-gray-800 placeholder-gray-400"
                >
                  <option value="" disabled>
                    {t("auth.selectCountry")}
                  </option>
                  {countryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.text}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-900 text-sm mb-2">
                  {t("auth.state")}
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value, city: "" }))}
                  required
                  disabled={!formData.country || loadingStates || stateOptions.length === 0}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none text-gray-800 placeholder-gray-400"
                >
                  <option value="" disabled>
                    {!formData.country ? t("auth.selectCountryFirst") : loadingStates ? t("auth.loadingStates") : t("auth.selectState")}
                  </option>
                  {stateOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.text}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-900 text-sm mb-2">
                  {t("auth.city")}
                </label>
                {cityOptions.length > 0 ? (
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.country || !formData.state || loadingCities || cityOptions.length === 0}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none text-gray-800 placeholder-gray-400"
                  >
                    <option value="" disabled>
                      {!formData.state ? t("auth.selectStateFirst") : loadingCities ? t("auth.loadingCities") : t("auth.selectCity")}
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
                    name="city"
                    placeholder={t("auth.enterCity")}
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.country || !formData.state}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none text-gray-800 placeholder-gray-400"
                  />
                )}
              </div>

              <div>
                <label className="block text-gray-900 text-sm mb-2">
                  {t("auth.postalCode")}
                </label>
                <input
                  type="number"
                  name="postalCode"
                  placeholder={t("auth.enterPostalCode")}
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none  text-gray-800 placeholder-gray-400"
                />
              </div>

              <div className="flex items-end gap-3 pt-4">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  id="terms"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  {t("auth.agreeToTermsPrefix")}
                  <button
                    type="button"
                    onClick={() => router.push("/legal/terms")}
                    className="text-primary hover:text-blue-700 bg-transparent border-0 cursor-pointer"
                  >
                    {t("auth.termsOfUse")}
                  </button>
                  {" & "}
                  <button
                    type="button"
                    onClick={() => router.push("/legal/privacy")}
                    className="text-primary hover:text-blue-700 bg-transparent border-0 cursor-pointer"
                  >
                    {t("auth.privacyPolicy")}
                  </button>
                </label>
              </div>
            </div>
          </form>
        );

      case 5:
        return (
          <form id="signup-step-5" onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="pt-8">
            <div className="space-y-4">
              <div>
                <label className="block text-gray-900 font-medium mb-2">
                  {t("auth.crmv")}
                </label>
                <input
                  type="text"
                  name="crmv"
                  placeholder={t("auth.enterCrmv")}
                  value={formData.crmv}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none  text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <DropdownSelect
                  label={t("auth.crmvState")}
                  options={brazilianStateOptions}
                  value={formData.crmvState}
                  onChange={(value) => setFormData((prev) => ({ ...prev, crmvState: value }))}
                  placeholder={t("auth.selectState")}
                  name="crmvState"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-900 font-medium mb-2">
                  {t("auth.mapaRegistration")}{" "}
                  <span className="text-gray-500 font-normal">{t("auth.optional")}</span>
                </label>
                <input
                  type="text"
                  name="mapaRegistration"
                  placeholder={t("auth.enterMapa")}
                  value={formData.mapaRegistration}
                  onChange={handleInputChange}
                  // required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none  text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <DropdownSelect
                  label={t("auth.operateHow")}
                  options={operateOptions}
                  value={formData.operateHow}
                  onChange={(value) => setFormData((prev) => ({ ...prev, operateHow: value }))}
                  placeholder={t("auth.selectOption")}
                  name="operateHow"
                  required
                />
              </div>

              <div>
                <MultiSelect
                  label={t("auth.expertise")}
                  options={expertiseOptions}
                  defaultSelected={formData.expertise}
                  onChange={(values) => setFormData((prev) => ({ ...prev, expertise: values }))}
                  placeholder={t("auth.selectOptions")}
                  showInlineChips={false}
                  showDoneButton={true}
                  maxSelected={5}
                  name="expertise"
                  required
                />
                <div className="mt-2 flex flex-wrap gap-2 bg-gray-50 p-5 rounded-[12px]">
                  {formData.expertise.length === 0 ? (
                    <span className="text-sm text-gray-500">{t("auth.noExpertiseSelected")}</span>
                  ) : (
                    formData.expertise.map((v) => {
                      const opt = expertiseOptions.find((o) => o.value === v);
                      return (
                        <span key={v} className="inline-flex items-center rounded-full bg-primary text-white text-sm px-3 py-1">{opt ? opt.text : v}</span>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </form>
        );

      case 6:
        return (
          <form id="signup-step-6" onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="pt-8">
            <div className="space-y-4">
              <div>
                <label className="block text-gray-900 font-medium mb-2">
                  {t("auth.clinicLogo")} <span className="text-gray-500 font-normal">{t("auth.optional")}</span>
                </label>
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  {formData.clinicLogoUrl ? (
                    <div className="flex flex-col items-center gap-3">
                      <Image width={200} height={200} src={formData.clinicLogoUrl} alt={t("auth.clinicLogoAlt")} className="w-32 h-32 object-contain rounded-lg bg-white" />
                      <label className="inline-block">
                        <input type="file" accept="image/*" onChange={handleClinicLogoChange} className="hidden" />
                        <span className="px-3 py-2 bg-primary text-white rounded-md cursor-pointer">{uploadingClinicLogo ? t("auth.uploading") : t("auth.changeLogo")}</span>
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-gray-600 text-sm">{t("auth.uploadClinicLogo")}</div>
                      <label className="inline-block">
                        <input type="file" accept="image/*" onChange={handleClinicLogoChange} className="hidden" />
                        <span className="px-3 py-2 bg-primary text-white rounded-md cursor-pointer">{uploadingClinicLogo ? t("auth.uploading") : t("auth.selectFile")}</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-gray-900 font-medium mb-2">{t("auth.tradeName")}</label>
                <input
                  type="text"
                  name="tradeName"
                  placeholder={t("auth.enterTradeName")}
                  value={formData.tradeName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-900 font-medium mb-2">
                  {t("auth.cnpjIe")} <span className="text-gray-500 font-normal">{t("auth.optional")}</span>
                </label>
                <input
                  type="text"
                  name="cnpjIe"
                  placeholder={t("auth.enterCnpjIe")}
                  value={formData.cnpjIe}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cnpjIe: e.target.value.replace(/\D/g, "") }))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-900 font-medium mb-2">{t("auth.reportHeaderAddress")}</label>
                <input
                  type="text"
                  name="reportHeaderAddress"
                  placeholder={t("auth.enterReportHeaderAddress")}
                  value={formData.reportHeaderAddress}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-900 font-medium mb-2">{t("auth.reportFooter")}</label>
                <textarea
                  name="reportFooter"
                  placeholder={t("auth.enterReportFooter")}
                  value={formData.reportFooter}
                  onChange={handleInputChange}
                  rows={4}
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none text-gray-800 placeholder-gray-400 resize-none"
                />
              </div>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-48px) h-fit bg-white pb-[100px]! flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between ">
        <button
          onClick={handleBack}
          className="hover:bg-gray-100 rounded-lg transition-colors bg-transparent border-0 cursor-pointer"
        >
          <ChevronLeft size={24} />
        </button>

        <h2 className="text-sm font-medium text-gray-900">
          {step === 1 && t("auth.createAccount")}
          {step === 2 && t("auth.personalDetails")}
          {step === 3 && ""}
          {step === 4 && t("auth.taxAddressInfo")}
          {step === 5 && t("auth.professionalRegistration")}
          {step === 6 && t("auth.clinicReports")}
        </h2>

        <div className="text-primary font-medium text-sm">
          {t("auth.step")} {step}/{finalStep}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto ">
        {renderStepContent()}
      </div>

      {/* Footer */}
      {(step === 1 || step === 2 || step === 4 || step === 5 || step === 6) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
          <button
            type="submit"
            form={`signup-step-${step}`}
            onClick={step === 1 ? handleNext : undefined}
            disabled={submitting || uploadingClinicLogo}
            className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-4 rounded-full transition-colors cursor-pointer border-0 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {profileType === "veterinarian" && step === finalStep ? t("auth.creating") : t("auth.next")}
              </span>
            ) : (profileType === "veterinarian" && step === finalStep ? t("auth.createAccount") : t("auth.next"))}
          </button>
          {(step === 1 || step === 2) && (
            <p className="text-center text-gray-600 mt-4">
              {t("auth.alreadyHaveAccount")}{" "}
              <button className="text-primary hover:text-blue-700 font-semibold bg-transparent border-0 cursor-pointer" onClick={() => router.push("/signin")}>
                {t("auth.signIn")}
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
