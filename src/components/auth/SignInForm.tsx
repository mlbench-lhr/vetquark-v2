// 'use client'
// import React, { useState } from 'react';
// import { Shield, User } from 'lucide-react';
// import Image from 'next/image';
// import { useRouter } from 'next/navigation';

// type ProfileType = 'veterinarian' | 'tutor';

// export default function SignInForm() {
//   const router = useRouter();
//   const [profile, setProfile] = useState<ProfileType>('veterinarian');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

//   const handleSubmit = () => {
//     console.log('Login attempt:', { profile, email, password });
//     router.push('/Guardian/home');
//     // Add your login logic here
//   };

//   return (
//     // <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//     <div className="w-full  bg-white rounded-2xl">
//       {/* Logo */}
//       {/* <div className="text-center relative pb-3 overflow-hidden" style={{ height: '184px' }}>
//         <svg
//           className="absolute inset-0"
//           style={{ top: '0', width: '100%', height: '184px' }}
//           viewBox="0 0 1000 184"
//           preserveAspectRatio="none"
//         >
//           <g>
//             <path
//               d="M 0 0 A 500 160 0 0 0 1000 0"
//               stroke="none"
//               fill="none"
//             />
//             <path
//               d="M 0 0 A 500 160 0 0 0 1000 0"
//               stroke="rgba(0,0,0,0.18)"
//               strokeWidth="2"
//               fill="none"
//               transform="translate(0,0)"
//               style={{ filter: 'blur(2px)' }}
//             />
//           </g>
//         </svg>
//         <div className="absolute inset-0 flex items-center justify-center z-10">
//           <Image
//             src="/images/vertrix.svg"
//             alt="VetQuark"
//             width={130}
//             height={48}
//             priority
//           />
//         </div>
//       </div> */}

//       <div className="px-4">
//         {/* Welcome Section */}
//         <div className="text-center mb-4">
//           <h2 className="text-4xl font-bold text-primary mb-2">
//             Welcome
//           </h2>
//           <p className="text-gray-600">
//             Select your profile
//             <br />
//             and access your account
//           </p>
//         </div>

//         {/* Profile Selection */}
//         <div className="flex gap-3 mb-6">
//           <button
//             type="button"
//             onClick={() => setProfile('veterinarian')}
//             className={`flex-1 py-1 px-4 rounded-full border-2 transition-all flex items-center justify-center gap-2 ${profile === 'veterinarian'
//               ? 'border-primary  text-primary'
//               : 'border-gray-300 text-gray-600 hover:border-gray-400'
//               }`}
//           >
//             {profile === 'veterinarian' ? (
//               <Image
//                 src="/images/auth/sheild-active.svg"
//                 alt="user"
//                 width={16}
//                 height={16} />
//             ) : (
//               <Image
//                 src="/images/auth/shield.svg"
//                 alt="user"
//                 width={16}
//                 height={16} />
//             )}
//             <span className="font-medium">Veterinarian</span>
//           </button>
//           <button
//             type="button"
//             onClick={() => setProfile('tutor')}
//             className={`flex-1 py-1 px-4 rounded-full border-2 transition-all flex items-center justify-center gap-2 ${profile === 'tutor'
//               ? 'border-primary  text-primary'
//               : 'border-gray-300 text-gray-600 hover:border-gray-400'
//               }`}
//           >
//             {profile === 'tutor' ? (
//               <Image
//                 src="/images/auth/user-active.svg"
//                 alt="user"
//                 width={16}
//                 height={16} />
//             ) : (
//               <Image
//                 src="/images/auth/user.svg"
//                 alt="user"
//                 width={16}
//                 height={16} />
//             )}

//             <span className="font-medium">Tutor</span>
//           </button>
//         </div>

//         {/* Login Form */}
//         <div className="space-y-2">
//           <div>
//             <input
//               type="email"
//               placeholder="Email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full px-4 py-4 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 placeholder-gray-500"
//             />
//           </div>

//           <div>
//             <input
//               type="password"
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full px-4 py-4 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 placeholder-gray-500"
//             />
//           </div>

//           <div className="text-center">
//             <button
//               onClick={() => console.log('Forgot password')}
//               className="text-primary hover:text-blue-700 text-sm font-medium bg-transparent border-0 cursor-pointer"
//             >
//               Forgot your password?
//             </button>
//           </div>

//           <button
//             onClick={handleSubmit}
//             className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors shadow-md cursor-pointer border-0"
//           >
//             Log In
//           </button>
//         </div>

//         {/* Create Account Link */}
//         <div className="text-center mt-3">
//           <button
//             onClick={() => router.push('/signup')}
//             className="text-primary hover:text-blue-700 font-medium bg-transparent border-0 cursor-pointer"
//           >
//             Create Account
//           </button>
//         </div>

//         {/* Footer Links */}
//         <div className="text-center mt-4 text-sm text-gray-500">
//           <button
//             onClick={() => console.log('Terms')}
//             className="hover:text-gray-700 bg-transparent border-0 cursor-pointer"
//           >
//             Terms of Service
//           </button>
//           <span className="mx-2">•</span>
//           <button
//             onClick={() => console.log('Privacy')}
//             className="hover:text-gray-700 bg-transparent border-0 cursor-pointer"
//           >
//             Privacy Policy
//           </button>
//         </div>
//       </div>
//     </div>
//     // </div>
//   );
// }



'use client'
import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { useAppDispatch } from '@/store/hooks';
import { setProfile as setUserProfile } from '@/store/userProfileSlice';
import { useTranslation } from "react-i18next";
import i18n, { isAppLanguage, type AppLanguage } from "@/i18n/i18n";
import { Modal } from "@/components/ui/modal";
import EmailVerification from "@/components/auth/EmailVerification";
import Link from 'next/link';

type ProfileType = 'veterinarian';

export default function SignInForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [profile] = useState<ProfileType>('veterinarian');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState<AppLanguage>(() => (isAppLanguage(i18n.language) ? i18n.language : "en"));
  const [twoFARequired, setTwoFARequired] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t("auth.pleaseEnterEmailAndPassword"));
      return;
    }
    try {
      setVerifying(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: profile }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data.error === 'string' ? data.error : t("auth.loginFailed"));
        console.error('Login error:', data.error || data);
        return;
      }
      if (data?.twoFactorRequired) {
        setTwoFARequired(true);
        return;
      }
      if (data?.profile) {
        dispatch(setUserProfile(data.profile));
      }
      toast.success(t("auth.loggedInSuccessfully"));
      router.push('/Veterinarian/home');
    } catch (err) {
      toast.error(t("auth.networkErrorDuringLogin"));
      console.error('Login network error:', err);
    } finally {
      setVerifying(false);
    }
  };


  const verify2FA = async (code: string) => {
    if (code.length !== 5) {
      toast.error(t("auth.verificationFailed"));
      return;
    }
    try {
      setVerifying(true);
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.error === "string" ? data.error : t("auth.verificationFailed"));
        return;
      }
      if (data?.profile) {
        dispatch(setUserProfile(data.profile));
      }
      toast.success(t("auth.loggedInSuccessfully"));
      setTwoFARequired(false);
      router.push('/Veterinarian/home');
    } finally {
      setVerifying(false);
    }
  };

  const resend2FA = async () => {
    try {
      setResending(true);
      const res = await fetch("/api/auth/2fa/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.error === "string" ? data.error : t("auth.loginFailed"));
        return;
      }
      toast.success(data?.message ?? t("auth.codeResent"));
    } finally {
      setResending(false);
    }
  };

  const handleSignUp = () => {
    router.push('/signup');
  };
  const handleForgotPassword = () => {
    router.push('/forget-password');
  };

  return (
    <div className="min-h-[calc(100dvh-32px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-end">
        <select
          value={language}
          onChange={(e) => {
            const next = String(e.target.value || "").trim();
            if (!isAppLanguage(next)) return;
            setLanguage(next);
            i18n.changeLanguage(next);
            if (typeof window !== "undefined") window.localStorage.setItem("ui_language_v1", next);
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg transition-colors border-0 cursor-pointer text-gray-700"
        >
          <option value="en">🇬🇧 {t("common.english")}</option>
          <option value="pt">{"\u{1F1E7}\u{1F1F7}"} {t("common.portuguese")}</option>
        </select>
      </div>

      <div className="flex-1">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-gray-900 mb-2">
            {t("auth.login")}
          </h1>
          <p className="text-tertiary">
            {t("auth.accountTypePrompt")}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-900 font-medium mb-2">
              {t("auth.email")}
            </label>
            <input
              type="email"
              placeholder={t("auth.enterYourEmail")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-gray-900 font-medium mb-2">
              {t("auth.password")}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t("auth.enterYourPassword")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 placeholder-gray-400 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-1"
              >
                <Eye size={20} />
              </button>
            </div>
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-primary hover:text-blue-700 text-sm font-medium bg-transparent border-0 cursor-pointer"
            >
              {t("auth.forgotPassword")}
            </button>
          </div>

          <button
            type='submit'
            disabled={verifying}
            className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-4 rounded-full transition-colors cursor-pointer border-0 mt-6 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {verifying ? (
              <span className="inline-flex items-center justify-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t("auth.login")}
              </span>
            ) : t("auth.login")}
          </button>
        </form>

        <Modal isOpen={twoFARequired} onClose={() => setTwoFARequired(false)} className="max-w-[420px] p-0">
          <EmailVerification
            mode="modal"
            title={t("auth.emailVerification")}
            codeLength={5}
            initialTimer={600}
            onSubmit={(code) => verify2FA(code)}
            onResend={() => resend2FA()}
            onClose={() => setTwoFARequired(false)}
          />
        </Modal>
      </div>

      {/* Footer */}
      <div className="text-center pb-8 px-6">
        <p className="text-gray-600">
          {t("auth.dontHaveAccount")}{" "}
          <button
            onClick={handleSignUp}
            className="text-primary hover:text-blue-700 font-semibold bg-transparent border-0 cursor-pointer"
          >
            {t("auth.signUp")}
          </button>
        </p>
        <div className="mt-2 text-sm text-gray-500">
          <Link
            href={"/legal/terms"}
            type="button"
            className="hover:text-gray-700 bg-transparent border-0 cursor-pointer"
          >
            Termos de Serviço
          </Link>
          <span className="mx-2">•</span>
          <button
            type="button"
            onClick={() => router.push("/legal/privacy")}
            className="hover:text-gray-700 bg-transparent border-0 cursor-pointer"
          >
            Política de Privacidade
          </button>
        </div>
      </div>
    </div>
  );
}
