"use client";

import React, { useState } from "react";
import { Eye, EyeOff, ArrowLeft, Shield, Users, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SignUpForm() {
  const router= useRouter();
  const [profileType, setProfileType] = useState<"veterinarian" | "guardian">("guardian");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    nationalId: "",
    dateOfBirth: "",
    postcode: "",
    number: "",
    state: "",
    city: "",
    acceptTerms: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", { profileType, ...formData });
    router.push("/professional_registration");
    // Add your form submission logic here
  };

  return (
    <div className="w-full bg-white rounded-3xl shadow-lg p-4">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button className="mr-4 text-gray-600 hover:text-gray-800 bg-gray-100 p-2 rounded-full" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-primary">Create account</h1>
      </div>
      {/* form */}
      <form onSubmit={handleSubmit}>
        {/* Profile Type Selection */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-3">
            Select profile type:
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setProfileType("veterinarian")}
              className={`flex-1 py-1 px-4 rounded-full border-2 transition-all flex items-center justify-center gap-2 ${profileType === "veterinarian"
                ? "border-primary  text-primary"
                : "border-gray-300 hover:border-gray-400"
                }`}
            >
              {profileType === 'veterinarian' ? (
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
              onClick={() => setProfileType("guardian")}
              className={`flex-1 py-1 px-4 rounded-full border-2 transition-all flex items-center justify-center gap-2 ${profileType === "guardian"
                ? "border-primary  text-primary"
                : "border-gray-300 hover:border-gray-400"
                }`}
            >
              {profileType === 'guardian' ? (
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
              <span className="font-medium">Guardian</span>
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Full Name */}
          <input
            type="text"
            name="fullName"
            placeholder="Full name *"
            required
            value={formData.fullName}
            onChange={handleInputChange}
            className="w-full px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email *"
            required
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Mobile */}
          <input
            type="tel"
            name="mobile"
            placeholder="Mobile"
            value={formData.mobile}
            onChange={handleInputChange}
            className="w-full px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* National ID and Date of Birth */}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="nationalId"
              placeholder="National ID"
              value={formData.nationalId}
              onChange={handleInputChange}
              className="px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="dateOfBirth"
              placeholder="Date of Birth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Postcode and Number */}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="postcode"
              placeholder="Postcode"
              value={formData.postcode}
              onChange={handleInputChange}
              className="px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="number"
              placeholder="Number"
              value={formData.number}
              onChange={handleInputChange}
              className="px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* State and City */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500 appearance-none pr-12"
              >
                <option value="">State</option>
                <option value="punjab">Punjab</option>
                <option value="sindh">Sindh</option>
                <option value="kpk">KPK</option>
                <option value="balochistan">Balochistan</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            </div>
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleInputChange}
              className="px-4 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start gap-3 mt-6">
          <input
            type="checkbox"
            name="acceptTerms"
            id="terms"
            checked={formData.acceptTerms}
            onChange={handleInputChange}
            className="mt-1 w-4 h-4 text-primary rounded"
          />
          <label htmlFor="terms" className="text-sm text-gray-600">
            I accept the terms and conditions and LGPD/ Privacy
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full mt-8 py-4 bg-primary text-white font-semibold rounded-2xl hover:bg-blue-700 transition-colors text-lg"
        >
          Continue
        </button>
      </form>

    </div>
  );
}