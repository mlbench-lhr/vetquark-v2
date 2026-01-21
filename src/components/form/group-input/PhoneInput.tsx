"use client";
import React from "react";
import ReactPhoneInput from "react-phone-input-2";
import { parsePhoneNumberFromString } from "libphonenumber-js";

type PhoneInputProps = {
  value: string;
  onChange: (phoneE164: string) => void;
  defaultCountry?: string;
  placeholder?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  containerClassName?: string;
  inputClassName?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  onValidityChange?: (isValid: boolean) => void;
};

export default function PhoneInput({
  value,
  onChange,
  defaultCountry = "br",
  placeholder,
  name,
  required,
  disabled,
  containerClassName,
  inputClassName,
  buttonClassName,
  dropdownClassName,
  onValidityChange,
}: PhoneInputProps) {
  return (
    <ReactPhoneInput
      country={defaultCountry}
      value={value}
      onChange={(rawValue) => {
        const raw = String(rawValue ?? "").trim();
        const e164 = raw ? (raw.startsWith("+") ? raw : `+${raw}`) : "";
        onChange(e164);
        if (onValidityChange) {
          const parsed = e164 ? parsePhoneNumberFromString(e164) : undefined;
          onValidityChange(Boolean(parsed?.isValid()));
        }
      }}
      placeholder={placeholder}
      disabled={disabled}
      enableSearch
      countryCodeEditable={false}
      specialLabel=""
      containerClass={containerClassName ?? "w-full"}
      inputClass={
        inputClassName ??
        "!w-full !h-12 !rounded-xl !border-0 !bg-gray-50 !px-11 !text-gray-800 placeholder:!text-gray-400 focus:!outline-none"
      }
      buttonClass={buttonClassName ?? "!border-0 !bg-gray-50 !rounded-xl"}
      dropdownClass={dropdownClassName ?? ""}
      inputProps={{
        name,
        required,
        disabled,
        autoComplete: "tel",
      }}
    />
  );
}
