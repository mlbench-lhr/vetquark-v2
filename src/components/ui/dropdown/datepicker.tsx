import React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  labelClassName?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
  iconClassName?: string;
};

function parseISODate(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  if (!isValid(parsed)) return undefined;
  return parsed;
}

function toISODateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function normalizeLocalDate(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  label,
  labelClassName,
  min,
  max,
  disabled = false,
  triggerClassName,
  contentClassName,
  iconClassName,
}: DatePickerProps) {
  const selectedDate = parseISODate(value);
  const minDate = (() => {
    const parsed = parseISODate(min ?? "");
    return parsed ? normalizeLocalDate(parsed) : undefined;
  })();
  const maxDate = (() => {
    const parsed = parseISODate(max ?? "");
    return parsed ? normalizeLocalDate(parsed) : undefined;
  })();

  return (
    <div className="w-full">
      {label && (
        <label className={cn("block text-gray-900 font-medium mb-2", labelClassName)}>{label}</label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "relative w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none text-left pr-12",
              value ? "text-gray-800" : "text-gray-400",
              disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
              triggerClassName
            )}
          >
            {value || placeholder}
            <CalendarIcon
              color="#3F78D8"
              className={cn("absolute right-3 top-1/2 -translate-y-1/2 text-gray-40", iconClassName)}
              size={20}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className={cn("w-auto p-0 bg-white border border-gray-200 shadow-lg", contentClassName)}
          align="start"
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(next) => {
              if (!next) {
                onChange("");
                return;
              }
              onChange(toISODateString(next));
            }}
            disabled={(date) => {
              const day = normalizeLocalDate(date);
              if (minDate && day < minDate) return true;
              if (maxDate && day > maxDate) return true;
              return false;
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
