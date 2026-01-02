'use client'
import React, { useState } from 'react';
import { Shield, User } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type ProfileType = 'veterinarian' | 'tutor';

export default function SignInForm() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileType>('veterinarian');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    console.log('Login attempt:', { profile, email, password });
    router.push('/Guardian/home');
    // Add your login logic here
  };

  return (
    // <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="w-full  bg-white rounded-2xl">
      {/* Logo */}
      <div className="text-center relative pb-3 overflow-hidden" style={{ height: '184px' }}>
        <svg
          className="absolute inset-0"
          style={{ top: '0', width: '100%', height: '184px' }}
          viewBox="0 0 1000 184"
          preserveAspectRatio="none"
        >
          <g>
            <path
              d="M 0 0 A 500 160 0 0 0 1000 0"
              stroke="none"
              fill="none"
            />
            <path
              d="M 0 0 A 500 160 0 0 0 1000 0"
              stroke="rgba(0,0,0,0.18)"
              strokeWidth="2"
              fill="none"
              transform="translate(0,0)"
              style={{ filter: 'blur(2px)' }}
            />
          </g>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Image
            src="/images/vertrix.svg"
            alt="Vetrix"
            width={130}
            height={48}
            priority
          />
        </div>
      </div>

      <div className="px-4">
        {/* Welcome Section */}
        <div className="text-center mb-4">
          <h2 className="text-4xl font-bold text-primary mb-2">
            Welcome
          </h2>
          <p className="text-gray-600">
            Select your profile
            <br />
            and access your account
          </p>
        </div>

        {/* Profile Selection */}
        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => setProfile('veterinarian')}
            className={`flex-1 py-1 px-4 rounded-full border-2 transition-all flex items-center justify-center gap-2 ${profile === 'veterinarian'
              ? 'border-primary  text-primary'
              : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
          >
            {profile === 'veterinarian' ? (
              <Image
                src="/images/auth/sheild-active.svg"
                alt="user"
                width={16}
                height={16} />
            ) : (
              <Image
                src="/images/auth/shield.svg"
                alt="user"
                width={16}
                height={16} />
            )}
            <span className="font-medium">Veterinarian</span>
          </button>
          <button
            type="button"
            onClick={() => setProfile('tutor')}
            className={`flex-1 py-1 px-4 rounded-full border-2 transition-all flex items-center justify-center gap-2 ${profile === 'tutor'
              ? 'border-primary  text-primary'
              : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
          >
            {profile === 'tutor' ? (
              <Image
                src="/images/auth/user-active.svg"
                alt="user"
                width={16}
                height={16} />
            ) : (
              <Image
                src="/images/auth/user.svg"
                alt="user"
                width={16}
                height={16} />
            )}

            <span className="font-medium">Tutor</span>
          </button>
        </div>

        {/* Login Form */}
        <div className="space-y-2">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
            />
          </div>

          <div className="text-center">
            <button
              onClick={() => console.log('Forgot password')}
              className="text-primary hover:text-blue-700 text-sm font-medium bg-transparent border-0 cursor-pointer"
            >
              Forgot your password?
            </button>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors shadow-md cursor-pointer border-0"
          >
            Log In
          </button>
        </div>

        {/* Create Account Link */}
        <div className="text-center mt-3">
          <button
            onClick={() => router.push('/signup')}
            className="text-primary hover:text-blue-700 font-medium bg-transparent border-0 cursor-pointer"
          >
            Create Account
          </button>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-4 text-sm text-gray-500">
          <button
            onClick={() => console.log('Terms')}
            className="hover:text-gray-700 bg-transparent border-0 cursor-pointer"
          >
            Terms of Service
          </button>
          <span className="mx-2">•</span>
          <button
            onClick={() => console.log('Privacy')}
            className="hover:text-gray-700 bg-transparent border-0 cursor-pointer"
          >
            Privacy Policy
          </button>
        </div>
      </div>
    </div>
    // </div>
  );
}