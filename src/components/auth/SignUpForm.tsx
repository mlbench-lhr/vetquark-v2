"use client";

import React, { useRef, useState } from "react";
import { Eye, EyeOff, ArrowLeft, Calendar, Check, ChevronLeft } from "lucide-react";
import Image from "next/image";
import MultiSelect from "@/components/form/MultiSelect";
import DropdownSelect from "@/components/form/DropdownSelect";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

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
  city: string;
  state: string;
  postalCode: string;
  crmv: string;
  crmvState: string;
  mapaRegistration: string;
  operateHow: string;
  expertise: string[];
  acceptTerms: boolean;
};

export default function SignUpForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profileType, setProfileType] = useState<ProfileType>("veterinarian");
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

  const expertiseOptions = [
    { value: "acupuncture", text: "Acupuncture", selected: false },
    { value: "anesthesia", text: "Anesthesia", selected: false },
    { value: "beef-dairy-cattle", text: "Beef/Dairy Cattle", selected: false },
    { value: "cardiology", text: "Cardiology", selected: false },
    { value: "surgical-clinic-large-animals", text: "Surgical Clinic (Large Animals)", selected: false },
    { value: "surgical-clinic-small-animals", text: "Surgical Clinic (Small Animals)", selected: false },
    { value: "feline-medicine", text: "Feline Medicine", selected: false },
    { value: "medical-clinic-large-animals", text: "Medical Clinic (Large Animals)", selected: false },
    { value: "medical-clinic-small-animals", text: "Medical Clinic (Small Animals)", selected: false },
    { value: "behavioral-medicine", text: "Behavioral Medicine", selected: false },
    { value: "dermatology", text: "Dermatology", selected: false },
    { value: "endocrinology", text: "Endocrinology", selected: false },
    { value: "physiotherapy", text: "Physiotherapy", selected: false },
    { value: "flower-therapy", text: "Flower Therapy", selected: false },
    { value: "gastroenterology", text: "Gastroenterology", selected: false },
    { value: "geriatrics", text: "Geriatrics", selected: false },
    { value: "homeopathy", text: "Homeopathy", selected: false },
    { value: "immunology", text: "Immunology", selected: false },
    { value: "alternative-medicine", text: "Alternative Medicine", selected: false },
    { value: "diagnostic-medicine", text: "Diagnostic Medicine", selected: false },
    { value: "nephrology", text: "Nephrology", selected: false },
    { value: "neurology", text: "Neurology", selected: false },
    { value: "nutrition", text: "Nutrition", selected: false },
    { value: "dentistry", text: "Dentistry", selected: false },
    { value: "ophthalmology", text: "Ophthalmology", selected: false },
    { value: "oncology", text: "Oncology", selected: false },
    { value: "orthopedics", text: "Orthopedics", selected: false },
    { value: "parasitology", text: "Parasitology", selected: false },
    { value: "pediatrics", text: "Pediatrics", selected: false },
    { value: "animal-production", text: "Animal Production", selected: false },
    { value: "reiki", text: "Reiki", selected: false },
    { value: "reproduction-large-animals", text: "Reproduction (Large Animals)", selected: false },
    { value: "reproduction-small-animals", text: "Reproduction (Small Animals)", selected: false },
    { value: "intensive-care", text: "Intensive Care", selected: false },
  ];

  const operateOptions = [
    { value: "Clinic/pet Shop Service", text: "Clinic/pet Shop Service" },
    { value: "Home Care", text: "Home Care" },
    { value: "Clinic/pet Shop Management", text: "Clinic/pet Shop Management" },
    { value: "Other", text: "Other" },
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


  const [formData, setFormData] = useState<SignUpFormData>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    taxId: "",
    dateOfBirth: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    crmv: "",
    crmvState: "",
    mapaRegistration: "",
    operateHow: "",
    expertise: [],
    acceptTerms: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const name = (target as HTMLInputElement | HTMLSelectElement).name;
    let nextValue: any;
    if ((target as HTMLInputElement).type === "checkbox") {
      nextValue = (target as HTMLInputElement).checked;
    } else if (target instanceof HTMLSelectElement && target.multiple) {
      nextValue = Array.from(target.selectedOptions).map((o) => o.value);
    } else {
      nextValue = (target as HTMLInputElement | HTMLSelectElement).value;
      if (name === "password" || name === "confirmPassword") {
        nextValue = (nextValue as string).trim();
      }
    }
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
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
    const finalStep = profileType === "veterinarian" ? 5 : 3;
    if (step < finalStep) {
      setStep(step + 1);
      return;
    }
    try {
      setSubmitting(true);
      const payload: any = {
        mode: "complete",
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        taxId: formData.taxId,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        operateHow: formData.operateHow,
        expertise: formData.expertise,
        acceptTerms: formData.acceptTerms,
        profileType,
        role: profileType,
      };
      if (profileType === "veterinarian") {
        payload.crmv = formData.crmv;
        payload.crmvState = formData.crmvState;
        payload.mapaRegistration = formData.mapaRegistration;
      }
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
      console.log("Signup success:", data);
      router.push("/signin");
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

    try {
      setSubmitting(true);
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "init",
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
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
              Select Account Type
            </h1>
            <p className="text-sm text-tertiary ">
              Choose your desired account type below
            </p>

            <div className="space-y-3 mt-4">
              <button
                type="button"
                onClick={() => setProfileType("veterinarian")}
                className={`w-full p-4 rounded-2xl transition-all flex items-center justify-between ${profileType === "veterinarian"
                  ? "bg-primary text-white border-2 border-primary"
                  : "bg-gray-50 text-gray-700 border-2 border-transparent"
                  }`}
              >
                <div className="flex items-center gap-3">
                  {profileType === 'veterinarian' ? (
                    <Image
                      src="/images/auth/paw-active.svg"
                      alt="user"
                      width={16}
                      height={16} />
                  ) : (
                    <Image
                      src="/images/auth/paw.svg"
                      alt="user"
                      width={16}
                      height={16} />
                  )}
                  <span className="font-medium">Veterinary Surgeon</span>
                </div>
                {profileType === "veterinarian" && (
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <Check size={16} className="text-primary" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setProfileType("tutor")}
                className={`w-full p-4 rounded-2xl transition-all flex items-center justify-between ${profileType === "tutor"
                  ? "bg-primary text-white border-2 border-primary"
                  : "bg-gray-50 text-gray-700 border-2 border-transparent"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
                  </svg>
                  <span className="font-medium">Tutor (a)</span>
                </div>
                {profileType === "tutor" && (
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <Check size={16} className="text-primary" />
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
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none  text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-900 text-sm mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none  text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-900 text-sm mb-2">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <div className="w-20 px-3 py-3 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
                    +55
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="flex-1 px-4 py-3 bg-gray-50 rounded-xl focus:outline-none  text-gray-800 placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-900 text-sm mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onInput={(e) => e.currentTarget.setCustomValidity("")}
                    onInvalid={(e) => {
                      const el = e.currentTarget;
                      if (el.validity.valueMissing) {
                        el.setCustomValidity("Password is required");
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
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onInput={(e) => (e.currentTarget.setCustomValidity(""))}
                    onInvalid={(e) => {
                      const el = e.currentTarget;
                      if (el.validity.valueMissing) {
                        el.setCustomValidity("Confirm password is required");
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
              Email Verification
            </h1>
            <p className="text-sm text-tertiary ">
              Enter the verification code we sent on your email
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
              Verify
            </button>
            <p className="text-center text-gray-600 mt-4">
              Didn't get the code?{" "}
              <button onClick={handleResendOtp} disabled={countdown > 0} className="text-primary hover:text-blue-700 font-medium bg-transparent border-0 cursor-pointer disabled:opacity-50">
                {countdown > 0 ? `Resend in 00:${countdown.toString().padStart(2, '0')}` : 'Send again'}
              </button>
            </p>

          </form>
        );

      case 4:
        return (
          <form id="signup-step-4" onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="pt-8">
            <div className="space-y-4">
              <div>
                <label className="block text-gray-900 font-medium mb-2">
                  Tax Identification Number
                </label>
                <input
                  type="text"
                  name="taxId"
                  placeholder="i.e AB374892928"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none  text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-900 font-medium mb-2">
                  Date Of Birth
                </label>
                <div className="relative">
                  <input
                    ref={dobRef}
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none text-gray-800 pr-12 [&::-webkit-calendar-picker-indicator]:opacity-0"
                    style={{ colorScheme: 'light' }}
                  />
                  <Calendar
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                    size={20}
                    onClick={() => {
                      const el = dobRef.current as any;
                      if (!el) return;
                      if (typeof el.showPicker === "function") el.showPicker();
                      else el.click();
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-900 font-medium mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Enter your address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none  text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-900 font-medium mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  placeholder="Enter your city name"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none  text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <DropdownSelect
                  label="State"
                  options={brazilianStateOptions}
                  value={formData.state}
                  onChange={(value) => setFormData((prev) => ({ ...prev, state: value }))}
                  placeholder="Select a state"
                  placement="up"
                  name="state"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-900 font-medium mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postalCode"
                  placeholder="Enter postal code i.e 27492"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none  text-gray-800 placeholder-gray-400"
                />
              </div>

              <div className="flex items-start gap-3 pt-4">
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
                  By continuing you agree to our{" "}
                  <button className="text-primary hover:text-blue-700 bg-transparent border-0 cursor-pointer">
                    Terms of use
                  </button>
                  {" & "}
                  <button className="text-primary hover:text-blue-700 bg-transparent border-0 cursor-pointer">
                    LGPD/Privacy
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
                  CRMV
                </label>
                <input
                  type="text"
                  name="crmv"
                  placeholder="Enter CRMV code"
                  value={formData.crmv}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none  text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <DropdownSelect
                  label="CRMV State"
                  options={brazilianStateOptions}
                  value={formData.crmvState}
                  onChange={(value) => setFormData((prev) => ({ ...prev, crmvState: value }))}
                  placeholder="Select a state"
                  name="crmvState"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-900 font-medium mb-2">
                  Registration with MAPA{" "}
                  <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  name="mapaRegistration"
                  placeholder="Enter your registration with MAPA"
                  value={formData.mapaRegistration}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none  text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <DropdownSelect
                  label="How do you operate?"
                  options={operateOptions}
                  value={formData.operateHow}
                  onChange={(value) => setFormData((prev) => ({ ...prev, operateHow: value }))}
                  placeholder="Select an option"
                  name="operateHow"
                  required
                />
              </div>

              <div>
                <MultiSelect
                  label="Area of expertise"
                  options={expertiseOptions}
                  defaultSelected={formData.expertise}
                  onChange={(values) => setFormData((prev) => ({ ...prev, expertise: values }))}
                  placeholder="Select options"
                  showInlineChips={false}
                  showDoneButton={true}
                  name="expertise"
                  required
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.expertise.length === 0 ? (
                    <span className="text-sm text-gray-500">No expertise selected</span>
                  ) : (
                    formData.expertise.map((v) => {
                      const opt = expertiseOptions.find((o) => o.value === v);
                      return (
                        <span key={v} className="inline-flex items-center rounded-full bg-gray-100 text-gray-800 text-sm px-3 py-1">{opt ? opt.text : v}</span>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-48px)] bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between ">
        <button
          onClick={handleBack}
          className="hover:bg-gray-100 rounded-lg transition-colors bg-transparent border-0 cursor-pointer"
        >
          <ChevronLeft size={24} />
        </button>

        <h2 className="text-sm font-medium text-gray-900">
          {step === 1 && "Create Account"}
          {step === 2 && "Personal Details"}
          {step === 3 && ""}
          {step === 4 && "Tax & Address Info"}
          {step === 5 && "Professional Registration"}
        </h2>

        <div className="text-primary font-medium text-sm">
          Step {step}/{profileType === "veterinarian" ? "5" : "3"}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto ">
        {renderStepContent()}
      </div>

      {/* Footer */}
      {(step === 1 || step === 2 || step === 4 || step === 5) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
          <button
            type="submit"
            form={`signup-step-${step}`}
            onClick={step === 1 ? handleNext : undefined}
            disabled={submitting}
            className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-4 rounded-full transition-colors cursor-pointer border-0 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {step === (profileType === "veterinarian" ? 5 : 3) ? (submitting ? "Creating..." : "Create Account") : "Next"}
          </button>
          {(step === 1 || step === 2) && (
            <p className="text-center text-gray-600 mt-4">
              Already have an account?{" "}
              <button className="text-primary hover:text-blue-700 font-semibold bg-transparent border-0 cursor-pointer" onClick={() => router.push("/signin")}>
                Sign in
              </button>
            </p>
          )}
        </div>
      )}

    </div>
  );
}