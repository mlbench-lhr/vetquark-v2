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
//             alt="Vetrix"
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
import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

type ProfileType = 'veterinarian' | 'tutor';

export default function SignInForm() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileType>('veterinarian');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data.error === 'string' ? data.error : 'Login failed');
        console.error('Login error:', data.error || data);
        return;
      }
      toast.success('Logged in successfully');
      console.log('Login response:', profile);
      if (profile === 'veterinarian') {
        console.log('Veterinarian profile:', data);
        router.push('/Veterinarian/home');
      } else {
        router.push('/Guardian/home');
      }
    } catch (err) {
      toast.error('Network error during login');
      console.error('Login network error:', err);
    }
  };

  const handleBack = () => {
    console.log('Go back');
  };

  const handleSignUp = () => {
    router.push('/signup');
  };
  const handleForgotPassword = () => {
    router.push('/forget-password');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-end">
        <select className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg transition-colors border-0 cursor-pointer text-gray-700">
          <option value="en">🇬🇧 English</option>
          <option value="pt">🇵🇹 Portuguese</option>
        </select>
      </div>

      <div className="flex-1">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-gray-900 mb-2">
            Login
          </h1>
          <p className="text-tertiary">
            Select your account type and access your account
          </p>
        </div>

        {/* Profile Selection */}
        <div className="flex gap-3 mb-8 text-sm">
          <button
            type="button"
            onClick={() => setProfile('veterinarian')}
            className={`flex-1 py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 font-medium whitespace-nowrap ${profile === 'veterinarian'
              ? 'bg-[#EBF2FF] text-primary'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-200'
              }`}
          >
                  {profile === 'veterinarian' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M6.65289 6.79678C7.49169 6.65278 8.11449 5.88958 8.20809 4.97878C8.30529 4.04998 8.52129 0.320381 7.12089 0.557981C3.48849 1.17358 3.74409 7.28998 6.65289 6.79678ZM11.4301 6.79678C14.3389 7.28998 14.5945 1.17358 10.9621 0.557981C9.56169 0.320381 9.77769 4.04998 9.87489 4.97878C9.96849 5.89318 10.5913 6.65638 11.4301 6.79678ZM5.15889 9.68038C5.15889 9.19438 4.98609 8.75518 4.70529 8.43478C4.24809 7.83358 2.78649 6.62398 2.43009 6.93358C1.68129 7.58518 1.70649 9.18358 2.15649 10.3464C2.38689 10.9944 2.94849 11.448 3.60009 11.448C4.46049 11.448 5.15889 10.656 5.15889 9.68038ZM15.6493 6.93358C15.2929 6.62398 13.8313 7.83718 13.3741 8.43478C13.0969 8.75518 12.9205 9.19438 12.9205 9.68038C12.9205 10.656 13.6189 11.448 14.4793 11.448C15.1345 11.448 15.6925 10.9944 15.9229 10.3464C16.3729 9.18358 16.3981 7.58518 15.6493 6.93358ZM12.7189 12.4344C11.3941 11.7756 11.4373 10.5048 11.1349 9.34558C10.8973 8.42038 10.0477 7.73638 9.03969 7.73638C8.05329 7.73638 7.21809 8.39158 6.95889 9.28798C6.63849 10.3968 6.82929 11.6892 5.38929 12.4272C4.21929 12.8088 3.74409 13.3668 3.74409 14.6844C3.74409 15.7536 4.66209 16.902 5.85009 17.0424C7.17489 17.2404 8.20449 16.9812 9.04329 16.506C9.87849 16.9812 10.9117 17.244 12.2365 17.0424C13.4209 16.8984 14.3425 15.7572 14.3425 14.6844C14.3425 13.338 13.8961 12.8376 12.7225 12.4344H12.7189ZM11.1565 14.0436H9.78489L9.78849 15.4836H8.29089L8.29449 14.0436H6.84009V12.6036H8.29809L8.29449 11.1636H9.79209V12.6036H11.1637V14.0436H11.1565Z" fill="#3F78D8" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M6.65289 6.79678C7.49169 6.65278 8.11449 5.88958 8.20809 4.97878C8.30529 4.04998 8.52129 0.320381 7.12089 0.557981C3.48849 1.17358 3.74409 7.28998 6.65289 6.79678ZM11.4301 6.79678C14.3389 7.28998 14.5945 1.17358 10.9621 0.557981C9.56169 0.320381 9.77769 4.04998 9.87489 4.97878C9.96849 5.89318 10.5913 6.65638 11.4301 6.79678ZM5.15889 9.68038C5.15889 9.19438 4.98609 8.75518 4.70529 8.43478C4.24809 7.83358 2.78649 6.62398 2.43009 6.93358C1.68129 7.58518 1.70649 9.18358 2.15649 10.3464C2.38689 10.9944 2.94849 11.448 3.60009 11.448C4.46049 11.448 5.15889 10.656 5.15889 9.68038ZM15.6493 6.93358C15.2929 6.62398 13.8313 7.83718 13.3741 8.43478C13.0969 8.75518 12.9205 9.19438 12.9205 9.68038C12.9205 10.656 13.6189 11.448 14.4793 11.448C15.1345 11.448 15.6925 10.9944 15.9229 10.3464C16.3729 9.18358 16.3981 7.58518 15.6493 6.93358ZM12.7189 12.4344C11.3941 11.7756 11.4373 10.5048 11.1349 9.34558C10.8973 8.42038 10.0477 7.73638 9.03969 7.73638C8.05329 7.73638 7.21809 8.39158 6.95889 9.28798C6.63849 10.3968 6.82929 11.6892 5.38929 12.4272C4.21929 12.8088 3.74409 13.3668 3.74409 14.6844C3.74409 15.7536 4.66209 16.902 5.85009 17.0424C7.17489 17.2404 8.20449 16.9812 9.04329 16.506C9.87849 16.9812 10.9117 17.244 12.2365 17.0424C13.4209 16.8984 14.3425 15.7572 14.3425 14.6844C14.3425 13.338 13.8961 12.8376 12.7225 12.4344H12.7189ZM11.1565 14.0436H9.78489L9.78849 15.4836H8.29089L8.29449 14.0436H6.84009V12.6036H8.29809L8.29449 11.1636H9.79209V12.6036H11.1637V14.0436H11.1565Z" fill="black" />
                    </svg>
                  )}
            <span>Veterinary Surgeon</span>
          </button>
          <button
            type="button"
            onClick={() => setProfile('tutor')}
            className={`flex-1 py-3 px-4 rounded-full transition-all flex items-center justify-center gap-2 font-medium ${profile === 'tutor'
              ? 'bg-[#EBF2FF] text-primary'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
            <span>Guardian</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-900 font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-gray-900 font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
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
              Forgot Password?
            </button>
          </div>

          <button
            type='submit'
            className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-4 rounded-full transition-colors cursor-pointer border-0 mt-6"
          >
            Login
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="text-center pb-8 px-6">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={handleSignUp}
            className="text-primary hover:text-blue-700 font-semibold bg-transparent border-0 cursor-pointer"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}