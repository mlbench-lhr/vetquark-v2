"use client";

import React, { useRef, useState } from "react";
import { Eye, EyeOff, Calendar, Check, ChevronLeft } from "lucide-react";
import MultiSelect from "@/components/form/MultiSelect";
import DropdownSelect from "@/components/form/DropdownSelect";
import { toast } from "react-toastify";
import { useRouter, useSearchParams } from "next/navigation";
import PhoneInput from "@/components/form/group-input/PhoneInput";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { useAppDispatch } from "@/store/hooks";
import { setProfile as setUserProfile } from "@/store/userProfileSlice";
import { useTranslation } from "react-i18next";
import { STATES_BY_COUNTRY, CITIES_BY_COUNTRY_STATE } from "@/lib/locationData";
import Image from "next/image";

type ProfileType = "veterinarian" | "tutor";

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
});

export default function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const initialProfileType = (() => {
    const raw = String(searchParams.get("profile") || searchParams.get("type") || "").toLowerCase().trim();
    if (raw === "guardian" || raw === "tutor") return "tutor" as const;
    if (raw === "vet" || raw === "veterinarian") return "veterinarian" as const;
    return "veterinarian" as const;
  })();
  const [step, setStep] = useState(() => (initialProfileType === "tutor" ? 2 : 1));
  const [profileType, setProfileType] = useState<ProfileType>(() => initialProfileType);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [countdown, setCountdown] = useState(35);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const OTP_LENGTH = 5;

  React.useEffect(() => {
    if (step !== 3 || countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearTimeout(id);
  }, [step, countdown]);
  const dobRef = useRef<HTMLInputElement | null>(null);
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
    const normalizedCountry = String(country || "").trim();
    const byCountry = CITIES_BY_COUNTRY_STATE[normalizedCountry] || {};
    const listByCode = stateCode ? (byCountry[stateCode] || []) : [];
    const listByName = stateName ? (byCountry[stateName] || []) : [];
    const seen = new Set<string>();
    const merged = [...listByCode, ...listByName].filter((c) => {
      if (seen.has(c)) return false;
      seen.add(c);
      return true;
    });
    return merged;
  }

  const [formData, setFormData] = useState<SignUpFormData>(() => getEmptyFormData());

  const finalStep = profileType === "veterinarian" ? 6 : 4;

  const resetInnerFormFields = () => {
    setFormData(getEmptyFormData());
    setShowPassword(false);
    setShowConfirmPassword(false);
    setOtp(["", "", "", "", ""]);
    setCountdown(35);
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
      toast.error("Cloudinary is not configured");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }

    setUploadingClinicLogo(true);
    try {
      const signRes = await fetch(`/api/cloudinary/upload?folder=clinic_logos`);
      const signJson = await signRes.json();

      if (!signRes.ok) {
        toast.error("Failed to prepare upload");
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
        toast.error("Upload failed");
        console.error("Cloudinary upload failed:", json);
        return;
      }
      const url = json.secure_url || json.url;
      if (url) {
        setFormData((prev) => ({ ...prev, clinicLogoUrl: url }));
      }
    } catch (err) {
      toast.error("Upload failed");
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
        toast.error(typeof data.error === 'string' ? data.error : 'Failed to resend OTP');
        console.error('Resend error:', data.error || data);
        return;
      }
      toast.success(data.message ?? 'OTP resent');
      setCountdown(35);
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
      if (profileType === "tutor") {
        const dateOfBirthStr = String(formData.dateOfBirth || "").trim();
        if (!dateOfBirthStr) {
          toast.error(t("auth.dateOfBirthRequired"));
          return;
        }
        const dob = new Date(dateOfBirthStr);
        if (!Number.isFinite(dob.getTime())) {
          toast.error("Invalid date of birth");
          return;
        }
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        if (age < 10) {
          toast.error("Guardian must be at least 10 years old");
          return;
        }
      }
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
        profileType,
        role: profileType,
      };
      const payload = profileType === "veterinarian"
        ? {
          ...basePayload,
          crmv: formData.crmv,
          crmvState: formData.crmvState,
          mapaRegistration: formData.mapaRegistration,
          clinicLogoUrl: formData.clinicLogoUrl || undefined,
          tradeName: formData.tradeName,
          cnpjIe: formData.cnpjIe || undefined,
          reportHeaderAddress: formData.reportHeaderAddress,
          reportFooter: formData.reportFooter,
        }
        : basePayload;
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
      toast.success("Account created");
      const id = (data?.id ? String(data.id) : "").trim();
      const homeHref = profileType === "veterinarian" ? "/Veterinarian/home" : "/Guardian/home";
      try {
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: formData.password, role: profileType }),
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
        `/upload-profile-picture?userId=${encodeURIComponent(id)}&profileType=${encodeURIComponent(profileType)}`
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
      toast.error("Please enter the 5-digit code");
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
      toast.error("Please enter a valid phone number");
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
      handleNext();
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="pt-8">
            <h1 className="text-2xl font-medium text-gray-900">
              {t("auth.selectAccountType")}
            </h1>
            <p className="text-sm text-tertiary ">
              {t("auth.chooseAccountType")}
            </p>

            <div className="space-y-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  if (profileType === "veterinarian") return;
                  resetInnerFormFields();
                  setProfileType("veterinarian");
                }}
                className={`w-full p-4 transition-all flex items-center justify-between ${profileType === "veterinarian"
                  ? "bg-[#EBF2FF] text-primary rounded-full"
                  : "bg-gray-50 text-gray-700 rounded-2xl"
                  }`}
              >
                <div className="flex items-center gap-3">
                  {profileType === 'veterinarian' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M6.65289 6.79678C7.49169 6.65278 8.11449 5.88958 8.20809 4.97878C8.30529 4.04998 8.52129 0.320381 7.12089 0.557981C3.48849 1.17358 3.74409 7.28998 6.65289 6.79678ZM11.4301 6.79678C14.3389 7.28998 14.5945 1.17358 10.9621 0.557981C9.56169 0.320381 9.77769 4.04998 9.87489 4.97878C9.96849 5.89318 10.5913 6.65638 11.4301 6.79678ZM5.15889 9.68038C5.15889 9.19438 4.98609 8.75518 4.70529 8.43478C4.24809 7.83358 2.78649 6.62398 2.43009 6.93358C1.68129 7.58518 1.70649 9.18358 2.15649 10.3464C2.38689 10.9944 2.94849 11.448 3.60009 11.448C4.46049 11.448 5.15889 10.656 5.15889 9.68038ZM15.6493 6.93358C15.2929 6.62398 13.8313 7.83718 13.3741 8.43478C13.0969 8.75518 12.9205 9.19438 12.9205 9.68038C12.9205 10.656 13.6189 11.448 14.4793 11.448C15.1345 11.448 15.6925 10.9944 15.9229 10.3464C16.3729 9.18358 16.3981 7.58518 15.6493 6.93358ZM12.7189 12.4344C11.3941 11.7756 11.4373 10.5048 11.1349 9.34558C10.8973 8.42038 10.0477 7.73638 9.03969 7.73638C8.05329 7.73638 7.21809 8.39158 6.95889 9.28798C6.63849 10.3968 6.82929 11.6892 5.38929 12.4272C4.21929 12.8088 3.74409 13.3668 3.74409 14.6844C3.74409 15.7536 4.66209 16.902 5.85009 17.0424C7.17489 17.2404 8.20449 16.9812 9.04329 16.506C9.87849 16.9812 10.9117 17.244 12.2365 17.0424C13.4209 16.8984 14.3425 15.7572 14.3425 14.6844C14.3425 13.338 13.8961 12.8376 12.7225 12.4344H12.7189ZM11.1565 14.0436H9.78489L9.78849 15.4836H8.29089L8.29449 14.0436H6.84009V12.6036H8.29809L8.29449 11.1636H9.79209V12.6036H11.1637V14.0436H11.1565Z" fill="#3F78D8" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M6.65289 6.79678C7.49169 6.65278 8.11449 5.88958 8.20809 4.97878C8.30529 4.04998 8.52129 0.320381 7.12089 0.557981C3.48849 1.17358 3.74409 7.28998 6.65289 6.79678ZM11.4301 6.79678C14.3389 7.28998 14.5945 1.17358 10.9621 0.557981C9.56169 0.320381 9.77769 4.04998 9.87489 4.97878C9.96849 5.89318 10.5913 6.65638 11.4301 6.79678ZM5.15889 9.68038C5.15889 9.19438 4.98609 8.75518 4.70529 8.43478C4.24809 7.83358 2.78649 6.62398 2.43009 6.93358C1.68129 7.58518 1.70649 9.18358 2.15649 10.3464C2.38689 10.9944 2.94849 11.448 3.60009 11.448C4.46049 11.448 5.15889 10.656 5.15889 9.68038ZM15.6493 6.93358C15.2929 6.62398 13.8313 7.83718 13.3741 8.43478C13.0969 8.75518 12.9205 9.19438 12.9205 9.68038C12.9205 10.656 13.6189 11.448 14.4793 11.448C15.1345 11.448 15.6925 10.9944 15.9229 10.3464C16.3729 9.18358 16.3981 7.58518 15.6493 6.93358ZM12.7189 12.4344C11.3941 11.7756 11.4373 10.5048 11.1349 9.34558C10.8973 8.42038 10.0477 7.73638 9.03969 7.73638C8.05329 7.73638 7.21809 8.39158 6.95889 9.28798C6.63849 10.3968 6.82929 11.6892 5.38929 12.4272C4.21929 12.8088 3.74409 13.3668 3.74409 14.6844C3.74409 15.7536 4.66209 16.902 5.85009 17.0424C7.17489 17.2404 8.20449 16.9812 9.04329 16.506C9.87849 16.9812 10.9117 17.244 12.2365 17.0424C13.4209 16.8984 14.3425 15.7572 14.3425 14.6844C14.3425 13.338 13.8961 12.8376 12.7225 12.4344H12.7189ZM11.1565 14.0436H9.78489L9.78849 15.4836H8.29089L8.29449 14.0436H6.84009V12.6036H8.29809L8.29449 11.1636H9.79209V12.6036H11.1637V14.0436H11.1565Z" fill="black" />
                    </svg>
                  )}
                  <span className="font-medium">{t("auth.veterinarian")}</span>
                </div>
                {profileType === "veterinarian" && (
                  <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                    <Check size={16} className="text-white" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (profileType === "tutor") return;
                  resetInnerFormFields();
                  setProfileType("tutor");
                }}
                className={`w-full p-4 transition-all flex items-center justify-between ${profileType === "tutor"
                  ? "bg-[#EBF2FF] text-primary rounded-full"
                  : "bg-gray-50 text-gray-700 rounded-2xl"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 9C7.9 9 6.95833 8.60833 6.175 7.825C5.39167 7.04167 5 6.1 5 5C5 3.9 5.39167 2.95833 6.175 2.175C6.95833 1.39167 7.9 1 9 1C10.1 1 11.0417 1.39167 11.825 2.175C12.6083 2.95833 13 3.9 13 5C13 6.1 12.6083 7.04167 11.825 7.825C11.0417 8.60833 10.1 9 9 9ZM1 15V14.2C1 13.6333 1.146 13.1127 1.438 12.638C1.73 12.1633 2.11733 11.8007 2.6 11.55C3.63333 11.0333 4.68333 10.646 5.75 10.388C6.81667 10.13 7.9 10.0007 9 10C10.1 9.99933 11.1833 10.1287 12.25 10.388C13.3167 10.6473 14.3667 11.0347 15.4 11.55C15.8833 11.8 16.271 12.1627 16.563 12.638C16.855 13.1133 17.0007 13.634 17 14.2V15C17 15.55 16.8043 16.021 16.413 16.413C16.0217 16.805 15.5507 17.0007 15 17H3C2.45 17 1.97933 16.8043 1.588 16.413C1.19667 16.0217 1.00067 15.5507 1 15Z" fill={profileType === 'tutor' ? "#3F78D8" : "#2B2B2B"} />
                  </svg>                  <span className="font-medium">{t("auth.guardian")}</span>
                </div>
                {profileType === "tutor" && (
                  <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                    <Check size={16} className="text-white" />
                  </div>
                )}
              </button>
            </div>
          </div>
        );

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
            <p className="text-primary font-medium mb-8">00:{countdown.toString().padStart(2, '0')}</p>

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
              className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-4 rounded-full transition-colors cursor-pointer border-0"
            >
              {t("auth.verify")}
            </button>
            <p className="text-center text-gray-600 mt-4">
              {t("auth.didntGetCode")}{" "}
              <button onClick={handleResendOtp} disabled={countdown > 0} className="text-primary hover:text-blue-700 font-medium bg-transparent border-0 cursor-pointer disabled:opacity-50">
                {countdown > 0 ? `${t("auth.resendIn")} 00:${countdown.toString().padStart(2, '0')}` : t("auth.sendAgain")}
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
                  {profileType === "tutor" ? t("auth.enterNationalId") : t("auth.taxId")}
                </label>
                <input
                  type="number"
                  name="taxId"
                  placeholder="i.e AB374892928"
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
                <div className="relative">
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                    max={(profileType === "tutor" ? new Date(new Date().setFullYear(new Date().getFullYear() - 10)) : new Date()).toISOString().slice(0, 10)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none text-gray-800 pr-12 [&::-webkit-calendar-picker-indicator]:opacity-0"
                    style={{ colorScheme: 'light' }}
                  />
                  <Calendar
                    color='#3F78D8'
                    className="absolute pointer-events-none right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                </div>
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
                  <button className="text-primary hover:text-blue-700 bg-transparent border-0 cursor-pointer">
                    {t("auth.termsOfUse")}
                  </button>
                  {" & "}
                  <button className="text-primary hover:text-blue-700 bg-transparent border-0 cursor-pointer">
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
                      <Image width={200} height={200} src={formData.clinicLogoUrl} alt="Clinic logo" className="w-32 h-32 object-contain rounded-lg bg-white" />
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
          {step === 4 && (profileType === "tutor" ? t("auth.idAddressInfo") : t("auth.taxAddressInfo"))}
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
            {profileType === "veterinarian" && step === finalStep ? (submitting ? t("auth.creating") : t("auth.createAccount")) : t("auth.next")}
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
