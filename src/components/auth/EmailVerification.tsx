"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EmailVerification() {
    const router = useRouter();
    const [step, setStep] = useState<"code" | "success">("code");
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [timer, setTimer] = useState(30);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (timer > 0 && step === "code") {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer, step]);

    const handleCodeChange = (index: number, value: string) => {
        if (value.length > 1) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleContinue = () => {
        setStep("success");
    };

    const handleRequestNewCode = () => {
        setCode(["", "", "", "", "", ""]);
        setTimer(30);
        inputRefs.current[0]?.focus();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    if (step === "success") {
        return (
            <div className="w-full min-h-[100dvh] p-6 flex flex-col">
                {/* Header */}
                <div className="flex items-center mb-8">
                    <button className="mr-4 text-gray-600 hover:text-gray-800" onClick={() => router.back()}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-3xl font-bold text-primary">Email verification</h1>
                </div>

                {/* Success Message */}
                <p className="text-gray-700 text-lg mb-12">
                    Email successfully verified!
                </p>

                {/* Success Icon */}
                <div className="flex justify-center items-center my-20">
                    <svg width="220" height="220" viewBox="0 0 220 220" className="block">
                        <defs>
                            <linearGradient id="ringGradient" x1="0" y1="0" x2="220" y2="220" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#5B8DFE" />
                                <stop offset="70%" stopColor="#CFE0FF" />
                                <stop offset="100%" stopColor="#F4F7FF" />
                            </linearGradient>
                            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.06)" />
                            </filter>
                        </defs>
                        <g filter="url(#softShadow)">
                            <circle cx="110" cy="110" r="94" fill="none" stroke="url(#ringGradient)" strokeWidth="8" strokeDasharray="590" strokeDashoffset="590" strokeLinecap="round" transform="rotate(-85 110 110)" className="ring-path" />
                        </g>
                        <path d="M78 112 L100 134 L145 89" fill="none" stroke="#3B82F6" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <style jsx>{`
                  @keyframes ring-draw { 0% { stroke-dashoffset: 590; } 100% { stroke-dashoffset: 0; } }
                  .ring-path { animation: ring-draw 2.2s ease-out forwards; }
                `}</style>

                {/* Continue Button */}
                <button
                    onClick={() => router.push("/Guardian")}
                    className="w-full py-4 bg-primary text-white font-semibold rounded-2xl hover:bg-blue-700 transition-colors text-lg mt-auto"
                >
                    Continue
                </button>


            </div>
        );
    }

    return (
        <div className="w-full flex flex-col min-h-[100dvh] p-6">
            {/* Header */}
            <div className="flex items-center mb-8">
                <button className="mr-4 text-gray-600 hover:text-gray-800" onClick={() => router.back()}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-3xl font-bold text-primary">Email verification</h1>
            </div>

            {/* Instruction Text */}
            <p className="text-gray-700 text-lg mb-8">
                We sent a code to your email.
                <br />
                Enter it below to activate your account.
            </p>

            {/* Code Input Fields */}
            <div className="flex justify-center  gap-x-3 gap-y-4 mb-8">
                {code.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-12 sm:w-16 sm:h-16 text-center text-xl sm:text-2xl font-semibold bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                ))}
            </div>

            {/* Resend Code Section */}
            <div className="text-center mb-8">
                <p className="text-primary font-semibold mb-2">Didn&apos;t receive the code?</p>
                {timer > 0 ? (
                    <p className="text-gray-500">
                        Request a new code in {formatTime(timer)}.
                    </p>
                ) : (
                    <button
                        onClick={handleRequestNewCode}
                        className="text-gray-600 underline hover:text-gray-800"
                    >
                        Request a new code
                    </button>
                )}
            </div>

            {/* Continue Button */}
            <button
                onClick={handleContinue}
                disabled={code.some((digit) => !digit)}
                className="w-full py-4 bg-primary text-white font-semibold rounded-2xl hover:bg-blue-700 transition-colors text-lg disabled:bg-gray-400 disabled:cursor-not-allowed mt-auto"
            >
                Continue
            </button>
        </div>
    );
}
