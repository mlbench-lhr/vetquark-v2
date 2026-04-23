"use client";

import React, { useEffect, useRef, useState } from "react";
import { Calendar } from "lucide-react";

type TypedDateInputProps = {
  value: string;
  onChange: (nextIsoDate: string) => void;
  min?: string;
  max?: string;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  iconClassName?: string;
  iconColor?: string;
  iconSize?: number;
};

function normalizeIsoDate(input: string): string {
  const trimmed = String(input || "").trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) return trimmed.slice(0, 10);
  return "";
}

function isoToDisplay(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function maskDisplayDate(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function displayToIso(displayDate: string): string | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(displayDate)) return null;
  const [dayPart, monthPart, yearPart] = displayDate.split("/");
  const day = Number(dayPart);
  const month = Number(monthPart);
  const year = Number(yearPart);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  const isoDay = String(day).padStart(2, "0");
  const isoMonth = String(month).padStart(2, "0");
  return `${year}-${isoMonth}-${isoDay}`;
}

function isWithinRange(isoDate: string, min?: string, max?: string): boolean {
  const normalizedMin = normalizeIsoDate(min || "");
  const normalizedMax = normalizeIsoDate(max || "");
  if (normalizedMin && isoDate < normalizedMin) return false;
  if (normalizedMax && isoDate > normalizedMax) return false;
  return true;
}

export default function TypedDateInput({
  value,
  onChange,
  min,
  max,
  id,
  name,
  required,
  disabled,
  placeholder = "dd/mm/yyyy",
  className,
  containerClassName,
  iconClassName,
  iconColor = "#3F78D8",
  iconSize = 20,
}: TypedDateInputProps) {
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const pickerIdRef = useRef(`typed-date-picker-${Math.random().toString(36).slice(2, 10)}`);
  const [displayValue, setDisplayValue] = useState("");
  const normalizedValue = normalizeIsoDate(value);

  useEffect(() => {
    setDisplayValue(isoToDisplay(normalizedValue));
  }, [normalizedValue]);

  const commitIsoValue = (isoDate: string): boolean => {
    if (!isWithinRange(isoDate, min, max)) return false;
    onChange(isoDate);
    return true;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskDisplayDate(e.target.value);
    setDisplayValue(masked);

    if (!masked) {
      onChange("");
      return;
    }

    if (masked.length !== 10) return;

    const isoDate = displayToIso(masked);
    if (!isoDate) return;
    commitIsoValue(isoDate);
  };

  const handleBlur = () => {
    if (!displayValue) {
      onChange("");
      return;
    }

    const isoDate = displayToIso(displayValue);
    if (isoDate && commitIsoValue(isoDate)) {
      setDisplayValue(isoToDisplay(isoDate));
      return;
    }

    setDisplayValue(isoToDisplay(normalizedValue));
  };

  const openPicker = () => {
    const picker = pickerRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!picker || disabled) return;
    if (typeof picker.showPicker === "function") picker.showPicker();
    else picker.click();
  };

  return (
    <div className={containerClassName || "relative"}>
      <input
        id={id}
        name={name}
        type="text"
        value={displayValue}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        inputMode="numeric"
        maxLength={10}
        autoComplete="off"
        pattern="\d{2}/\d{2}/\d{4}"
        title="Use format dd/mm/yyyy"
        className={className}
      />
      <Calendar
        color={iconColor}
        size={iconSize}
        className={iconClassName || "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"}
        onClick={openPicker}
      />
      <input
        ref={pickerRef}
        id={`${id || pickerIdRef.current}-native`}
        type="date"
        value={normalizedValue}
        min={min}
        max={max}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const isoDate = normalizeIsoDate(e.target.value);
          if (!isoDate) return;
          if (!commitIsoValue(isoDate)) return;
          setDisplayValue(isoToDisplay(isoDate));
        }}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />
    </div>
  );
}
