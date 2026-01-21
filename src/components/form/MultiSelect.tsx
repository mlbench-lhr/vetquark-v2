import React, { useState } from "react";

interface Option {
  value: string;
  text: string;
  selected: boolean;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  defaultSelected?: string[];
  onChange?: (selected: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  showInlineChips?: boolean;
  showDoneButton?: boolean;
  maxSelected?: number;
  name?: string;
  required?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  defaultSelected = [],
  onChange,
  disabled = false,
  placeholder = "Select option",
  showInlineChips = true,
  showDoneButton = false,
  maxSelected,
  name,
  required,
}) => {
  const [selectedOptions, setSelectedOptions] =
    useState<string[]>(maxSelected ? defaultSelected.slice(0, maxSelected) : defaultSelected);
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (optionValue: string) => {
    if (!selectedOptions.includes(optionValue) && maxSelected !== undefined && selectedOptions.length >= maxSelected) {
      return;
    }

    const newSelectedOptions = selectedOptions.includes(optionValue)
      ? selectedOptions.filter((value) => value !== optionValue)
      : [...selectedOptions, optionValue];

    setSelectedOptions(newSelectedOptions);
    if (onChange) onChange(newSelectedOptions);
  };

  const removeOption = (index: number, value: string) => {
    const newSelectedOptions = selectedOptions.filter((opt) => opt !== value);
    setSelectedOptions(newSelectedOptions);
    if (onChange) onChange(newSelectedOptions);
  };

  const selectedValuesText = selectedOptions.map(
    (value) => options.find((option) => option.value === value)?.text || ""
  );

  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-gray-700 ">
        {label}
      </label>

      <div className="relative z-20 inline-block w-full">
        <div className="relative flex flex-col items-center">
          <div onClick={toggleDropdown} className="relative w-full">
            <div className="flex w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none text-gray-800 pr-12 gap-2">
              <div className="flex flex-wrap flex-auto gap-2">
                {showInlineChips && selectedValuesText.length > 0 ? (
                  selectedValuesText.map((text, index) => (
                    <div key={index} className="group flex items-center justify-center rounded-full border-[0.7px] border-transparent bg-gray-100 py-1 pl-2.5 pr-2 text-sm text-gray-800 hover:border-gray-200 ">
                      <span className="flex-initial max-w-full">{text}</span>
                      <div className="flex flex-row-reverse flex-auto">
                        <div onClick={() => removeOption(index, selectedOptions[index])} className="pl-2 text-gray-500 cursor-pointer group-hover:text-gray-400 ">
                          <svg className="fill-current" role="button" width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M3.40717 4.46881C3.11428 4.17591 3.11428 3.70104 3.40717 3.40815C3.70006 3.11525 4.17494 3.11525 4.46783 3.40815L6.99943 5.93975L9.53095 3.40822C9.82385 3.11533 10.2987 3.11533 10.5916 3.40822C10.8845 3.70112 10.8845 4.17599 10.5916 4.46888L8.06009 7.00041L10.5916 9.53193C10.8845 9.82482 10.8845 10.2997 10.5916 10.5926C10.2987 10.8855 9.82385 10.8855 9.53095 10.5926L6.99943 8.06107L4.46783 10.5927C4.17494 10.8856 3.70006 10.8856 3.40717 10.5927C3.11428 10.2998 3.11428 9.8249 3.40717 9.53201L5.93877 7.00041L3.40717 4.46881Z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">{selectedValuesText.length ? `${selectedValuesText.length} selected` : (placeholder || "Select option")}</span>
                )}
              </div>
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 7.5l5 5 5-5" />
              </svg>
            </div>
          </div>

          {isOpen && (
            <div
              className="absolute left-0 z-40 w-full overflow-y-auto bg-white rounded-lg shadow-sm top-full max-h-64"
              onClick={(e) => e.stopPropagation()}
            >
              {showDoneButton && (
                <div className="sticky top-0 z-10 bg-white flex items-center justify-end p-2 border-b border-gray-200">
                  <button type="button" onClick={() => setIsOpen(false)} className="text-primary hover:text-blue-700 bg-transparent border-0 cursor-pointer">Done</button>
                </div>
              )}
              <div className="flex flex-col">
                {options.map((option, index) => (
                  <div key={index}>
                    <div
                      className={[
                        "w-full rounded-t border-b border-gray-200",
                        selectedOptions.includes(option.value) || maxSelected === undefined || selectedOptions.length < maxSelected
                          ? "cursor-pointer hover:bg-primary/5"
                          : "cursor-not-allowed opacity-60",
                      ].join(" ")}
                      onClick={
                        selectedOptions.includes(option.value) || maxSelected === undefined || selectedOptions.length < maxSelected
                          ? () => handleSelect(option.value)
                          : undefined
                      }
                    >
                      <div
                        className={`relative flex w-full items-center p-2 pl-2 ${
                          selectedOptions.includes(option.value)
                            ? "bg-primary/10"
                            : ""
                        }`}
                      >
                        <div className="mx-2 leading-6 text-gray-800 ">
                          {option.text}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {name && (
        <input
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          type="text"
          name={name}
          value={selectedOptions.join(",")}
          required={required}
          readOnly
        />
      )}
    </div>
  );
};

export default MultiSelect;
