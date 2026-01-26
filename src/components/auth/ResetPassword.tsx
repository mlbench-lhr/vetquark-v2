"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { buildRequestBody } from "@/utils/apiWrapper";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "react-toastify";
import Button from "../ui/button/Button";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";


export default function ResetPassword() {
    const router = useRouter();
    const { t } = useTranslation();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true);
        const email = sessionStorage.getItem("email")
        const token = sessionStorage.getItem("token")
        const resetToken = sessionStorage.getItem("reset_token")

        if (password !== confirmPassword) {
            toast.error(t("auth.passwordsDoNotMatch"));
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch("/api/auth/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: token, reset_token: resetToken, new_password: password })
            });
            const result = await response.json();
            if (!response.ok) {
                toast.error(typeof result.error === 'string' ? result.error : t("auth.failedToResetPassword"));
                console.error("Server Error:", result.message || result.error || result);
                return;
            }
            toast.success(result.message ?? t("auth.passwordResetSuccessfully"));
            router.push("/signin")
        } catch (error) {
            toast.error(t("auth.networkErrorResettingPassword"));
            console.error("Network Error", error);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
            <div className="w-full mb-10">
                <Link
                    href="/signin"
                    className="inline-flex items-center  text-gray-500 transition-colors hover:text-gray-700  "
                >
                    <ChevronLeftIcon size={24} />
                    {/* Go Back */}
                </Link>
            </div>
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                <div>
                    <div className="mb-5 sm:mb-8">
                        <h1 className="mb-2 font-medium text-gray-800 text-3xl">
                            {t("auth.resetPasswordTitle")}
                        </h1>
                        <p className="text-sm text-tertiary ">
                           {t("auth.createNewPassword")}
                        </p>
                    </div>
                    <div className="mt-3">
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-5 mx-1">
                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium">
                                        {t("auth.password")} <span className="text-error-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder={t("auth.enterPassword")}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 placeholder-gray-400 pr-12"
                                        />
                                        <span
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="absolute z-30 right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                                        >
                                            {showPassword ? (
                                                <EyeIcon className="fill-gray-500" />
                                            ) : (
                                                <EyeCloseIcon className="fill-gray-500" />
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium">
                                        {t("auth.confirmPassword")} <span className="text-error-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder={t("auth.confirmNewPassword")}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 placeholder-gray-400 pr-12"
                                        />
                                        <span
                                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                                            className="absolute z-30 right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeIcon className="fill-gray-500" />
                                            ) : (
                                                <EyeCloseIcon className="fill-gray-500" />
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="mt">
                                    <button
                                        type="submit"
                                        className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-3 rounded-full transition-colors cursor-pointer border-0 mt-6"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                {t("auth.reseting")}
                                            </div>
                                        ) : (
                                            t("auth.continue")
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>


                    </div>
                </div>
            </div>
        </div>
    );
}
