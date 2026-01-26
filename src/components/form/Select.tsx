import React, { useState } from "react";
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
}) => {
  // Manage the selected value
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue);

  return (
    <ShadSelect
      value={selectedValue}
      onValueChange={(value) => {
        setSelectedValue(value);
        onChange(value);
      }}
    >
      <SelectTrigger
        className={`h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 bg-transparent ${
          selectedValue ? "text-gray-800" : "text-gray-400"
        } [&>svg]:text-gray-500 [&>svg]:opacity-100 ${className}`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-200 shadow-lg">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="text-gray-700 focus:bg-primary/5 focus:text-gray-900"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </ShadSelect>
  );
};

export default Select;
