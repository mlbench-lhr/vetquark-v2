"use client";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  placeholder = "Select an option",
  disabled = false,
  className = "",
  placement = "down",
  name,
  required,
}: DropdownSelectProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-gray-900 font-medium mb-2">{label}</label>}
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
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          className={`w-full h-[48px] px-4 py-3 bg-gray-50 rounded-xl border-0 shadow-none focus:ring-0 focus:ring-offset-0 focus:outline-none pr-12 text-left ${
            value ? "text-gray-800" : "text-gray-400"
          } [&>svg]:text-primary [&>svg]:opacity-100 ${className}`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          side={placement === "up" ? "top" : "bottom"}
          className="z-50 w-[--radix-select-trigger-width] bg-white border border-gray-200 rounded-xl shadow-lg p-1"
        >
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className={`w-full cursor-pointer rounded-lg px-3 py-2 focus:bg-primary/5 focus:text-gray-900 ${
                value === opt.value ? "bg-primary/10 text-gray-900" : "text-gray-800"
              }`}
            >
              {opt.text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
