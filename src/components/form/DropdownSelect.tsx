"use client";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type Option = { value: string; text: string };

type DropdownSelectProps = {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  placement?: "down" | "up";
  name?: string;
  required?: boolean;
};

export default function DropdownSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  className = "",
  placement = "down",
  name,
  required,
}: DropdownSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.text;
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (!open) return;
      const target = e.target as Node | null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  return (
    <div className="w-full">
      {label && <label className="block text-gray-900 font-medium mb-2">{label}</label>}
      <div className="relative" ref={containerRef}>
        {name && (
          <input
            tabIndex={-1}
            aria-hidden
            className="sr-only"
            type="text"
            name={name}
            value={value || ""}
            required={required}
            readOnly
          />
        )}
        <button
          type="button"
          onClick={() => !disabled && setOpen((v) => !v)}
          className={`w-full px-4 py-[14px] bg-[#EBEBF0] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary border-0 text-[15px] ${value ? "text-[#1C1C1E]" : "text-[#8E8E93]"} pr-12 text-left ${className}`}
        >
          {selectedLabel || placeholder || t("common.selectOption")}
        </button>
        <svg
          className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M5 7.5l5 5 5-5" />
        </svg>
        {open && (
          <div className={`absolute left-0 ${placement === "up" ? "bottom-full mb-2" : "top-full mt-2"} z-50 w-full bg-white border border-gray-200 rounded-xl shadow-lg`}>
            <ul className="max-h-60 overflow-auto py-1">
              {options.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-primary/5 ${value === opt.value ? "bg-primary/10 text-gray-900" : "text-gray-800"
                      }`}
                  >
                    {opt.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}