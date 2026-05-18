"use client";

import React, { useRef, useState } from "react";
import { Eye, EyeOff, Check, ChevronLeft, Image as ImageIcon } from "lucide-react";
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

const INPUT_BASE = "w-full px-4 py-[14px] bg-[#EBEBF0] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-black/70 text-[15px] placeholder-[#8E8E93] border-0";
const INPUT_ERROR = "w-full px-4 py-[14px] bg-[#FDECEA] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 text-black/70 text-[15px] placeholder-[#C0514A] border-0";

export default function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  // Logical steps:
  // 1: combined personal info screen (all fields visible). On submit → API call → step 4
  // 4: OTP verification
  // 5: professional registration
  // 6: clinic and reports
  // The displayed indicator (Passo X/6) on step 1 advances 1→2→3 based on password strength,
  // matching the design exactly. Internally step is always 1 while on the combined form.
  const FINAL_STEP = 6;
  const [step, setStep] = useState<1 | 4 | 5 | 6>(1);
  const [profileType] = useState<ProfileType>("veterinarian");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const RESEND_COOLDOWN_SECONDS = 35;
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const OTP_LENGTH = 6;

  // email error state for validation feedback
  const [emailError, setEmailError] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingClinicLogo, setUploadingClinicLogo] = useState(false);

  React.useEffect(() => {
    if (step !== 4 || countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearTimeout(id);
  }, [step, countdown]);

  const passwordRequirements = [
    { key: "minLength", label: t("auth.passwordReqMinLength"), test: (pwd: string) => pwd.length >= 8 },
    { key: "upperLower", label: t("auth.passwordReqUpperLower"), test: (pwd: string) => /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) },
    { key: "number", label: t("auth.passwordReqNumber"), test: (pwd: string) => /\d/.test(pwd) },
    { key: "special", label: t("auth.passwordReqSpecial"), test: (pwd: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd) },
  ];
  const [formData, setFormData] = useState<SignUpFormData>(() => getEmptyFormData());

  const passwordStrength = passwordRequirements.filter((r) => r.test(formData.password)).length;
  const passwordStrengthPercent = (passwordStrength / passwordRequirements.length) * 100;

  // Indicator displayed in header (Passo X/6) — for the combined info screen this advances
  // based on password strength to mirror the design (1/6 empty → 2/6 weak → 3/6 strong).
  const passwordStrengthForDisplay = passwordStrength;

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

  const brazilianStateOptions = [
    { value: "AC", text: "Acre" }, { value: "AL", text: "Alagoas" }, { value: "AP", text: "Amapá" },
    { value: "AM", text: "Amazonas" }, { value: "BA", text: "Bahia" }, { value: "CE", text: "Ceará" },
    { value: "DF", text: "Distrito Federal" }, { value: "ES", text: "Espírito Santo" }, { value: "GO", text: "Goiás" },
    { value: "MA", text: "Maranhão" }, { value: "MT", text: "Mato Grosso" }, { value: "MS", text: "Mato Grosso do Sul" },
    { value: "MG", text: "Minas Gerais" }, { value: "PA", text: "Pará" }, { value: "PB", text: "Paraíba" },
    { value: "PR", text: "Paraná" }, { value: "PE", text: "Pernambuco" }, { value: "PI", text: "Piauí" },
    { value: "RJ", text: "Rio de Janeiro" }, { value: "RN", text: "Rio Grande do Norte" }, { value: "RS", text: "Rio Grande do Sul" },
    { value: "RO", text: "Rondônia" }, { value: "RR", text: "Roraima" }, { value: "SC", text: "Santa Catarina" },
    { value: "SP", text: "São Paulo" }, { value: "SE", text: "Sergipe" }, { value: "TO", text: "Tocantins" },
  ];

  type StateOption = { value: string; text: string; stateName: string };
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
      const items = country ? (STATES_BY_COUNTRY[country] || []) : [];
      const options: StateOption[] = items.map((i) => ({ value: i.value || i.text, text: i.text, stateName: i.text }));
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
    if (!formData.state) {
      setFormData((prev) => (prev.city ? { ...prev, city: "" } : prev));
    }
  }, [formData.state]);

  React.useEffect(() => {
    const country = String(formData.country || "").trim();
    const selectedState = String(formData.state || "").trim();
    (async () => {
      setLoadingCities(true);
      const stateMeta = stateOptions.find((o) => o.value === selectedState) || null;
      const options = country && selectedState ? await getCountryCities(country, selectedState, stateMeta?.stateName || selectedState) : [];
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const name = target.name as keyof SignUpFormData;
    let nextValue: SignUpFormData[keyof SignUpFormData];
    if ((target as HTMLInputElement).type === "checkbox") {
      nextValue = (target as HTMLInputElement).checked as SignUpFormData[keyof SignUpFormData];
    } else if (target instanceof HTMLSelectElement && target.multiple) {
      nextValue = Array.from(target.selectedOptions).map((o) => o.value) as SignUpFormData[keyof SignUpFormData];
    } else {
      nextValue = target.value as SignUpFormData[keyof SignUpFormData];
      if (name === "password" || name === "confirmPassword") {
        nextValue = (nextValue as string).trim() as SignUpFormData[keyof SignUpFormData];
      }
    }
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    if (name === "email") setEmailError(false);
  };

  const handleClinicLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    if (!CLOUD_NAME || !API_KEY) { toast.error(t("common.cloudinaryNotConfigured")); return; }
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error(t("common.fileTooLarge")); return; }
    setUploadingClinicLogo(true);
    try {
      const signRes = await fetch(`/api/cloudinary/upload?folder=clinic_logos`);
      const signJson = await signRes.json();
      if (!signRes.ok) { toast.error(t("common.failedToPrepareUpload")); return; }
      const { timestamp, signature } = signJson;
      const data = new FormData();
      data.append("file", file); data.append("api_key", API_KEY);
      data.append("timestamp", String(timestamp)); data.append("signature", signature);
      data.append("folder", "clinic_logos");
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) { toast.error(t("common.uploadFailed")); return; }
      const url = json.secure_url || json.url;
      if (url) setFormData((prev) => ({ ...prev, clinicLogoUrl: url }));
    } catch { toast.error(t("common.uploadFailed")); } finally {
      setUploadingClinicLogo(false);
      e.target.value = "";
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[index]) { const n = [...otp]; n[index] = ""; setOtp(n); }
      else if (index > 0) { const n = [...otp]; n[index - 1] = ""; setOtp(n); setTimeout(() => inputRefs.current[index - 1]?.focus(), 0); }
    } else if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!paste) return;
    const newOtp = Array(OTP_LENGTH).fill("");
    paste.split("").forEach((d, i) => { newOtp[i] = d; });
    setOtp(newOtp);
    const focusIndex = Math.min(paste.length - 1, OTP_LENGTH - 1);
    setTimeout(() => inputRefs.current[focusIndex]?.focus(), 0);
  };

  const handleResendOtp = async () => {
    if (step !== 4 || countdown > 0) return;
    try {
      const res = await fetch('/api/auth/resend', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data.error === 'string' ? data.error : 'Failed to resend OTP');
        if (res.status === 429 && typeof data.error === "string") {
          const m = data.error.match(/(\d+)\s*s/);
          if (m) setCountdown(Math.max(0, parseInt(m[1], 10)));
        }
        return;
      }
      toast.success(data.message ?? 'OTP resent');
      setCountdown(RESEND_COOLDOWN_SECONDS);
    } catch { toast.error('Network error while resending OTP'); }
  };

  const handleBack = () => {
    if (step === 1) { router.push("/signin"); return; }
    if (step === 4) { setStep(1); return; }
    if (step === 5) { setStep(4); return; }
    if (step === 6) { setStep(5); return; }
  };

  // Combined info step (1/6 → 2/6 → 3/6 visually): full-form validation + API call
  const handleInfoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.fullName.trim()) { toast.error(t("auth.fullName") + " " + t("common.required")); return; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(formData.email.trim())) { setEmailError(true); toast.error(t("auth.invalidEmail") || "E-mail inválido"); return; }
    const parsedPhone = parsePhoneNumberFromString(String(formData.phone || "").trim());
    if (!parsedPhone?.isValid()) { toast.error(t("auth.invalidPhoneNumber")); return; }
    if (passwordStrength < passwordRequirements.length) { toast.error(t("auth.passwordReqMinLength")); return; }
    if (formData.password !== formData.confirmPassword) { toast.error(t("auth.passwordsDoNotMatch")); return; }
    if (!formData.taxId.trim()) { toast.error("CPF"); return; }
    if (!formData.dateOfBirth.trim()) { toast.error("Data de Nascimento"); return; }
    if (!formData.postalCode.trim()) { toast.error("CEP"); return; }
    if (!formData.address.trim()) { toast.error("Número"); return; }
    if (!formData.state.trim()) { toast.error("Estado"); return; }
    if (!formData.city.trim()) { toast.error("Cidade"); return; }
    if (!formData.acceptTerms) { toast.error(t("auth.mustAcceptTerms")); return; }
    const normalizedPhone = parsedPhone?.isValid() ? parsedPhone.number : formData.phone;
    try {
      setSubmitting(true);
      const res = await fetch("/api/auth/signup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "init", fullName: formData.fullName, email: formData.email, phone: normalizedPhone, password: formData.password, profileType }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(typeof data.error === "string" ? data.error : t("auth.failedToStartSignup")); return; }
      toast.success(data.message ?? t("auth.otpSentToEmail"));
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setStep(4);
    } finally { setSubmitting(false); }
  };

  // Step 4: OTP verification
  const handleStep4Submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) { toast.error(t("auth.enterOtpCode")); return; }
    try {
      setSubmitting(true);
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(typeof data.error === 'string' ? data.error : 'Verification failed'); return; }
      toast.success(data.message ?? "Email verified");
      setStep(5);
    } finally { setSubmitting(false); }
  };

  // Step 5: professional info → advance
  const handleStep5Submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStep(6);
  };

  // Step 6: final submit
  const handleStep6Submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const parsedPhone = parsePhoneNumberFromString(String(formData.phone || "").trim());
      const normalizedPhone = parsedPhone?.isValid() ? parsedPhone.number : formData.phone;
      const payload = {
        mode: "complete" as const,
        fullName: formData.fullName, email: formData.email, phone: normalizedPhone,
        taxId: formData.taxId, dateOfBirth: formData.dateOfBirth, address: formData.address,
        country: formData.country, city: formData.city, state: formData.state,
        postalCode: formData.postalCode, operateHow: formData.operateHow, expertise: formData.expertise,
        acceptTerms: formData.acceptTerms, profileType: "veterinarian" as const, role: "veterinarian" as const,
        crmv: formData.crmv, crmvState: formData.crmvState, mapaRegistration: formData.mapaRegistration,
        clinicLogoUrl: formData.clinicLogoUrl || undefined, tradeName: formData.tradeName,
        cnpjIe: formData.cnpjIe || undefined, reportHeaderAddress: formData.reportHeaderAddress,
        reportFooter: formData.reportFooter,
      };
      const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { toast.error(typeof data.error === 'string' ? data.error : 'Signup failed'); return; }
      toast.success(t("auth.accountCreated"));
      const id = (data?.id ? String(data.id) : "").trim();
      try {
        const loginRes = await fetch("/api/auth/login", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: formData.password, role: "veterinarian" }),
          credentials: "include",
        });
        const loginData = await loginRes.json().catch(() => null);
        if (loginRes.ok && loginData?.profile) dispatch(setUserProfile(loginData.profile));
      } catch { }
      if (!id) { router.push("/Veterinarian/home"); return; }
      router.push(`/upload-profile-picture?userId=${encodeURIComponent(id)}&profileType=veterinarian`);
    } finally { setSubmitting(false); }
  };

  const stepTitle = () => {
    if (step === 1) return t("auth.createAccount");
    if (step === 4) return t("auth.emailVerification");
    if (step === 5) return t("auth.professionalRegistration");
    return t("auth.clinicReports");
  };

  // Visual indicator number shown to the user in the header.
  const displayStep = (() => {
    if (step !== 1) return step;
    if (!formData.password) return 1;
    if (passwordStrengthForDisplay < passwordRequirements.length) return 2;
    return 3;
  })();

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <form id="signup-step-1" onSubmit={handleInfoSubmit} className="px-5 pt-4 pb-4 space-y-2.5">
            {/* Basic info */}
            <input
              type="text" name="fullName" placeholder={`${t("auth.fullName")}*`}
              value={formData.fullName} onChange={handleInputChange} required
              className={INPUT_BASE}
            />
            <input
              type="email" name="email"
              placeholder={emailError ? `E-mail Inválido*` : `${t("auth.email")}*`}
              value={formData.email} onChange={handleInputChange} required
              className={emailError ? INPUT_ERROR : INPUT_BASE}
            />
            <PhoneInput
              name="phone" value={formData.phone}
              onChange={(next) => setFormData((prev) => ({ ...prev, phone: next }))}
              defaultCountry="br" required
              inputClassName="!w-full !h-[48px] !px-11 !py-3 !bg-[#EBEBF0] !rounded-xl !border-0 !text-black/70 placeholder:!text-[#8E8E93] focus:!outline-none focus:!ring-2 focus:!ring-primary text-[15px]"
              buttonClassName="!h-[48px] !bg-[#EBEBF0] !border-0 !rounded-xl"
              containerClassName="w-full"
            />

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} name="password"
                placeholder="*****"
                value={formData.password} onChange={handleInputChange}
                onFocus={() => setPasswordFocused(true)} onBlur={() => setPasswordFocused(false)}
                onInput={(e) => e.currentTarget.setCustomValidity("")}
                autoComplete="new-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} required
                className={`${INPUT_BASE} pr-12`}
                onKeyDown={(e) => { if (/\s/.test(e.key)) e.preventDefault(); }}
                onPaste={(e) => {
                  e.preventDefault();
                  const text = e.clipboardData.getData("text").replace(/\s+/gu, "");
                  e.currentTarget.setCustomValidity("");
                  setFormData((prev) => ({ ...prev, password: text }));
                }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93] bg-transparent border-0 cursor-pointer p-0">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Password strength bar + requirements (only when typing) */}
            {(passwordFocused || formData.password) && (
              <div className="space-y-1.5 px-1 pt-0.5">
                <div className="h-[4px] w-full bg-[#E5E5EA] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${passwordStrengthPercent === 100 ? "bg-primary" : "bg-red-500"}`}
                    style={{ width: `${passwordStrengthPercent}%` }}
                  />
                </div>
                <div className="space-y-1">
                  {passwordRequirements.map((req) => (
                    <div key={req.key} className="flex items-center gap-2 text-[12px]">
                      <div className={`w-[14px] h-[14px] rounded-full border flex items-center justify-center shrink-0 ${req.test(formData.password) ? "bg-primary border-primary" : "border-[#C7C7CC]"}`}>
                        {req.test(formData.password) && <Check size={8} className="text-white" strokeWidth={3} />}
                      </div>
                      <span className={req.test(formData.password) ? "text-black/70" : "text-[#8E8E93]"}>{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm password */}
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"} name="confirmPassword"
                placeholder={t("auth.confirmPassword")}
                value={formData.confirmPassword} onChange={handleInputChange}
                onInput={(e) => e.currentTarget.setCustomValidity("")}
                autoComplete="new-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} required
                className={`${INPUT_BASE} pr-12`}
                onKeyDown={(e) => { if (/\s/.test(e.key)) e.preventDefault(); }}
                onPaste={(e) => {
                  e.preventDefault();
                  const text = e.clipboardData.getData("text").replace(/\s+/gu, "");
                  e.currentTarget.setCustomValidity("");
                  setFormData((prev) => ({ ...prev, confirmPassword: text }));
                }}
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93] bg-transparent border-0 cursor-pointer p-0">
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Personal details */}
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text" name="taxId" placeholder="CPF"
                value={formData.taxId} onChange={handleInputChange} required
                className={`${INPUT_BASE} text-center`}
              />
              <TypedDateInput
                name="dateOfBirth" value={formData.dateOfBirth}
                onChange={(nextIsoDate) => setFormData((prev) => ({ ...prev, dateOfBirth: nextIsoDate }))}
                required max={new Date().toISOString().slice(0, 10)} placeholder="Data de Nascimento"
                className={`${INPUT_BASE} text-center pr-8`}
                iconClassName="absolute right-2 top-1/2 -translate-y-1/2 text-[#8E8E93] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text" name="postalCode" placeholder="CEP"
                value={formData.postalCode} onChange={handleInputChange} required
                className={`${INPUT_BASE} text-center`}
              />
              <input
                type="text" name="address" placeholder="Número"
                value={formData.address} onChange={handleInputChange} required
                className={`${INPUT_BASE} text-center`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="relative">
                <select
                  name="state" value={formData.state}
                  onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value, city: "" }))}
                  required disabled={!formData.country || loadingStates || stateOptions.length === 0}
                  className={`${INPUT_BASE} appearance-none text-center pr-8 ${formData.state ? "text-black/70" : "text-[#8E8E93]"}`}
                >
                  <option value="" disabled>Estado</option>
                  {stateOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.text}</option>)}
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8E8E93] pointer-events-none" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 7.5l5 5 5-5" /></svg>
              </div>
              {cityOptions.length > 0 ? (
                <select
                  name="city" value={formData.city} onChange={handleInputChange}
                  required disabled={!formData.state || loadingCities}
                  className={`${INPUT_BASE} appearance-none text-center ${formData.city ? "text-black/70" : "text-[#8E8E93]"}`}
                >
                  <option value="" disabled>Cidade</option>
                  {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input
                  type="text" name="city" placeholder="Cidade"
                  value={formData.city} onChange={handleInputChange}
                  required disabled={!formData.state}
                  className={`${INPUT_BASE} text-center`}
                />
              )}
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox" name="acceptTerms" id="terms"
                checked={formData.acceptTerms} onChange={handleInputChange}
                className="mt-0.5 w-[14px] h-[14px] text-primary rounded border-[#C7C7CC] focus:ring-primary shrink-0"
              />
              <label htmlFor="terms" className="text-[11px] text-[#6C6C70] leading-relaxed">
                Aceito os termos de Serviço e Política de Privacidade
              </label>
            </div>
          </form>
        );

      case 4:
        return (
          <form id="signup-step-4" onSubmit={handleStep4Submit} className="px-5 pt-5 pb-4 flex flex-col">
            <p className="text-[14px] text-black/70 mb-8 leading-relaxed">
              {t("auth.codeSentToEmail")}<br />{t("auth.enterCodeToActivate")}
            </p>

            <div className="flex justify-center gap-3 mb-8">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text" inputMode="numeric" value={digit}
                  onPaste={handleOtpPaste}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onClick={() => {
                    const firstEmpty = otp.findIndex((d) => !d);
                    if (firstEmpty !== -1 && firstEmpty < index) inputRefs.current[firstEmpty]?.focus();
                  }}
                  className="w-[48px] h-[52px] text-center text-[18px] font-medium bg-[#EBEBF0] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-black/70 border-0"
                  maxLength={1} required autoComplete="off"
                />
              ))}
            </div>

            <div className="text-center">
              <p className="text-[14px] font-semibold text-primary mb-1">
                {t("auth.didntGetCode")}
              </p>
              <p className="text-[13px] text-[#8E8E93]">
                {countdown > 0
                  ? `${t("auth.resendIn")} ${String(Math.floor(countdown / 60)).padStart(2, "0")}:${String(countdown % 60).padStart(2, "0")}`
                  : (
                    <button type="button" onClick={handleResendOtp}
                      className="text-[#8E8E93] underline hover:text-[#6C6C70] bg-transparent border-0 cursor-pointer text-[13px]">
                      {t("auth.sendAgain")}
                    </button>
                  )}
              </p>
            </div>
          </form>
        );

      case 5:
        return (
          <form id="signup-step-5" onSubmit={handleStep5Submit} className="px-5 pt-5 pb-4 space-y-3">
            <input
              type="text" name="crmv" placeholder="CRMV*"
              value={formData.crmv} onChange={handleInputChange} required
              className={INPUT_BASE}
            />
            <DropdownSelect
              options={brazilianStateOptions} value={formData.crmvState}
              onChange={(value) => setFormData((prev) => ({ ...prev, crmvState: value }))}
              placeholder="Estado do CRMV*" name="crmvState" required
            />
            <input
              type="text" name="mapaRegistration" placeholder="Registro no MAPA (opcional)"
              value={formData.mapaRegistration} onChange={handleInputChange}
              className={INPUT_BASE}
            />
            <div>
              <p className="text-[14px] font-bold text-primary mb-2">{t("auth.operateHow")}</p>
              <DropdownSelect
                options={operateOptions} value={formData.operateHow}
                onChange={(value) => setFormData((prev) => ({ ...prev, operateHow: value }))}
                placeholder={t("auth.selectOption")} name="operateHow" required
              />
            </div>
            <div>
              <p className="text-[14px] font-bold text-primary mb-2">{t("auth.expertise")}</p>
              <MultiSelect
                options={expertiseOptions} defaultSelected={formData.expertise}
                onChange={(values) => setFormData((prev) => ({ ...prev, expertise: values }))}
                placeholder={t("auth.selectOptions")} showInlineChips={false}
                showDoneButton={true} maxSelected={5} name="expertise" required
              />
            </div>
          </form>
        );

      case 6:
        return (
          <form id="signup-step-6" onSubmit={handleStep6Submit} className="px-5 pt-5 pb-4 space-y-4">
            <div>
              <p className="text-[16px] font-semibold text-black/70 mb-3">
                {t("auth.clinicLogo")} <span className="text-[#8E8E93] font-normal text-[14px]">{t("auth.optional")}</span>
              </p>
              <div className="border-2 border-dashed border-[#C7C7CC] rounded-xl p-6 text-center bg-white">
                {formData.clinicLogoUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <Image width={200} height={200} src={formData.clinicLogoUrl} alt={t("auth.clinicLogoAlt")} className="w-28 h-28 object-contain rounded-lg bg-white" />
                    <label className="inline-block cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleClinicLogoChange} className="hidden" />
                      <span className="text-[13px] text-primary font-medium">{uploadingClinicLogo ? t("auth.uploading") : t("auth.changeLogo")}</span>
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleClinicLogoChange} className="hidden" />
                    <ImageIcon size={28} className="text-[#8E8E93]" />
                    <span className="text-[13px] font-semibold text-black/70">{t("auth.clickToSelect")}</span>
                    <span className="text-[11px] text-[#8E8E93]">{t("auth.supportedFormats")}</span>
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[13px] text-black/70 mb-1.5">{t("auth.tradeName")}</label>
              <input
                type="text" name="tradeName" placeholder="Clínica Vet+"
                value={formData.tradeName} onChange={handleInputChange} required
                className={INPUT_BASE}
              />
            </div>

            <div>
              <label className="block text-[13px] text-black/70 mb-1.5">
                {t("auth.cnpjIe")} <span className="text-[#8E8E93]">{t("auth.optional")}</span>
              </label>
              <input
                type="text" name="cnpjIe" placeholder="00.000.000/0001-00"
                value={formData.cnpjIe}
                onChange={(e) => setFormData((prev) => ({ ...prev, cnpjIe: e.target.value.replace(/\D/g, "") }))}
                inputMode="numeric" pattern="[0-9]*"
                className={INPUT_BASE}
              />
            </div>

            <div>
              <label className="block text-[13px] text-black/70 mb-1.5">{t("auth.reportHeaderAddress")}</label>
              <input
                type="text" name="reportHeaderAddress" placeholder="Rua, Número, Cidade - UF"
                value={formData.reportHeaderAddress} onChange={handleInputChange} required
                className={INPUT_BASE}
              />
            </div>

            <div>
              <label className="block text-[13px] text-black/70 mb-1.5">{t("auth.reportFooter")}</label>
              <textarea
                name="reportFooter" placeholder="CRVM/RT, POP, observações padrão...."
                value={formData.reportFooter} onChange={handleInputChange}
                rows={4} required
                className="w-full px-4 py-[14px] bg-[#EBEBF0] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-black/70 text-[15px] placeholder-[#8E8E93] border-0 resize-none"
              />
              <p className="text-[11px] text-[#8E8E93] mt-1.5">{t("auth.reportFooterHelp")}</p>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#FAFAFF]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="w-[36px] h-[36px] rounded-full bg-[#EBEBF0] flex items-center justify-center border-0 cursor-pointer shrink-0"
          >
            <ChevronLeft size={20} className="text-black/70" />
          </button>
          <h2 className="text-[18px] font-bold text-primary leading-none">
            {stepTitle()}
          </h2>
        </div>
        <div className="text-primary font-bold text-[14px] shrink-0">
          {t("auth.step")} {displayStep}/{FINAL_STEP}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderStepContent()}
      </div>

      {/* Footer button */}
      <div className="px-5 pb-8 pt-4">
        <button
          type="submit"
          form={`signup-step-${step}`}
          disabled={submitting || uploadingClinicLogo}
          className="w-full bg-primary text-white font-bold text-[16px] py-[15px] rounded-xl transition-colors cursor-pointer border-0 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_8px_24px_-8px_rgba(63,120,216,0.5)]"
        >
          {submitting ? (
            <span className="inline-flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {step === FINAL_STEP ? t("auth.creating") : t("auth.continue")}
            </span>
          ) : (
            step === FINAL_STEP ? t("auth.createAccount") : t("auth.continue")
          )}
        </button>
      </div>
    </div>
  );
}
