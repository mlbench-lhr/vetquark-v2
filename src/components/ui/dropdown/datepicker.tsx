import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    placeholder?: string;
    label?: string;
}

type ViewMode = 'days' | 'months' | 'years';

export default function CustomDatePicker({ value, onChange, placeholder = "Select date", label }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [viewMode, setViewMode] = useState<ViewMode>('days');
    const [yearRangeStart, setYearRangeStart] = useState(Math.floor(new Date().getFullYear() / 12) * 12);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthsShort = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setViewMode('days');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
        return new Date(year, month, 1).getDay();
    };

    const formatDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const parseDate = (dateString: string): Date | null => {
        if (!dateString) return null;
        const parts = dateString.split('/');
        if (parts.length === 3) {
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        return null;
    };

    const handleDateClick = (day: number) => {
        const selectedDate = new Date(currentYear, currentMonth, day);
        if (selectedDate <= today) {
            onChange(formatDate(selectedDate));
            setIsOpen(false);
            setViewMode('days');
        }
    };

    const handleMonthClick = (monthIndex: number) => {
        setCurrentMonth(monthIndex);
        setViewMode('days');
    };

    const handleYearClick = (year: number) => {
        setCurrentYear(year);
        setViewMode('months');
    };

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        const nextDate = new Date(nextYear, nextMonth, 1);

        if (nextDate <= today) {
            setCurrentMonth(nextMonth);
            setCurrentYear(nextYear);
        }
    };

    const handlePrevYearRange = () => {
        setYearRangeStart(yearRangeStart - 12);
    };

    const handleNextYearRange = () => {
        const nextRangeStart = yearRangeStart + 12;
        if (nextRangeStart <= today.getFullYear()) {
            setYearRangeStart(nextRangeStart);
        }
    };

    const handleClear = () => {
        onChange('');
        setIsOpen(false);
        setViewMode('days');
    };

    const handleToday = () => {
        onChange(formatDate(today));
        setIsOpen(false);
        setViewMode('days');
    };

    const canGoNext = () => {
        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        const nextDate = new Date(nextYear, nextMonth, 1);
        return nextDate <= today;
    };

    const renderDays = () => {
        const daysInMonth = getDaysInMonth(currentMonth, currentYear);
        const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
        const days = [];
        const selectedDate = parseDate(value);

        // Previous month's days
        const prevMonthDays = getDaysInMonth(currentMonth - 1, currentYear);
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push(
                <div key={`prev-${i}`} className="text-center py-2 text-sm text-gray-300">
                    {prevMonthDays - i}
                </div>
            );
        }

        // Current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            const isFuture = date > today;

            days.push(
                <div
                    key={day}
                    onClick={() => !isFuture && handleDateClick(day)}
                    className={`text-center py-2 text-sm rounded-lg transition-colors ${isFuture
                        ? 'text-gray-300 cursor-not-allowed'
                        : isSelected
                            ? 'bg-primary text-white font-semibold cursor-pointer'
                            : isToday
                                ? 'bg-blue-100 text-primary font-semibold cursor-pointer hover:bg-blue-200'
                                : 'cursor-pointer hover:bg-gray-100'
                        }`}
                >
                    {day}
                </div>
            );
        }

        // Next month's days
        const remainingDays = 42 - days.length;
        for (let day = 1; day <= remainingDays; day++) {
            days.push(
                <div key={`next-${day}`} className="text-center py-2 text-sm text-gray-300">
                    {day}
                </div>
            );
        }

        return days;
    };

    const renderMonths = () => {
        return monthsShort.map((month, index) => {
            const isCurrentMonth = index === today.getMonth() && currentYear === today.getFullYear();
            const isSelectedMonth = index === currentMonth;
            const isFutureMonth = currentYear === today.getFullYear() && index > today.getMonth();

            return (
                <div
                    key={month}
                    onClick={() => !isFutureMonth && handleMonthClick(index)}
                    className={`text-center py-3 rounded-lg transition-colors font-medium ${isFutureMonth
                        ? 'text-gray-300 cursor-not-allowed'
                        : isSelectedMonth
                            ? 'bg-primary text-white cursor-pointer'
                            : isCurrentMonth
                                ? 'bg-blue-100 text-primary cursor-pointer hover:bg-blue-200'
                                : 'cursor-pointer hover:bg-gray-100'
                        }`}
                >
                    {month}
                </div>
            );
        });
    };

    const renderYears = () => {
        const years = [];
        for (let i = 0; i < 12; i++) {
            const year = yearRangeStart + i;
            const isCurrentYear = year === today.getFullYear();
            const isSelectedYear = year === currentYear;
            const isFutureYear = year > today.getFullYear();

            years.push(
                <div
                    key={year}
                    onClick={() => !isFutureYear && handleYearClick(year)}
                    className={`text-center py-3 rounded-lg transition-colors font-medium ${isFutureYear
                        ? 'text-gray-300 cursor-not-allowed'
                        : isSelectedYear
                            ? 'bg-primary text-white cursor-pointer'
                            : isCurrentYear
                                ? 'bg-blue-100 text-primary cursor-pointer hover:bg-blue-200'
                                : 'cursor-pointer hover:bg-gray-100'
                        }`}
                >
                    {year}
                </div>
            );
        }
        return years;
    };

    const getHeaderText = () => {
        if (viewMode === 'years') {
            return `${yearRangeStart} - ${yearRangeStart + 11}`;
        }
        if (viewMode === 'months') {
            return currentYear.toString();
        }
        return `${months[currentMonth]} ${currentYear}`;
    };

    const handleHeaderClick = () => {
        if (viewMode === 'days') {
            setViewMode('months');
        } else if (viewMode === 'months') {
            setViewMode('years');
            setYearRangeStart(Math.floor(currentYear / 12) * 12);
        }
    };

    const handlePrev = () => {
        if (viewMode === 'days') {
            handlePrevMonth();
        } else if (viewMode === 'months') {
            setCurrentYear(currentYear - 1);
        } else if (viewMode === 'years') {
            handlePrevYearRange();
        }
    };

    const handleNext = () => {
        if (viewMode === 'days') {
            handleNextMonth();
        } else if (viewMode === 'months') {
            if (currentYear < today.getFullYear()) {
                setCurrentYear(currentYear + 1);
            }
        } else if (viewMode === 'years') {
            handleNextYearRange();
        }
    };

    const canGoNextInCurrentView = () => {
        if (viewMode === 'days') {
            return canGoNext();
        } else if (viewMode === 'months') {
            return currentYear < today.getFullYear();
        } else if (viewMode === 'years') {
            return yearRangeStart + 12 <= today.getFullYear();
        }
        return false;
    };

    return (
        <div className="w-full" ref={dropdownRef}>
            {label && (
                <label className="block text-gray-900 font-medium mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    readOnly
                    onClick={() => setIsOpen(!isOpen)}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none text-gray-800 placeholder-gray-400 pr-12 cursor-pointer"
                />
                <Calendar
                    color='#3F78D8'
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-40 cursor-pointer"
                    size={20}
                    onClick={() => setIsOpen(!isOpen)}
                />

                {isOpen && (
                    <div className="absolute right-0 top-full bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-50 w-72">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <button
                                onClick={handlePrev}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors bg-transparent border-0 cursor-pointer"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <button
                                onClick={handleHeaderClick}
                                className="px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors bg-transparent border-0 cursor-pointer font-semibold text-base"
                            >
                                {getHeaderText()}
                            </button>

                            <button
                                onClick={handleNext}
                                disabled={!canGoNextInCurrentView()}
                                className={`p-1 rounded-lg transition-colors bg-transparent border-0 ${canGoNextInCurrentView() ? 'hover:bg-gray-100 cursor-pointer' : 'opacity-30 cursor-not-allowed'
                                    }`}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        {/* Days view */}
                        {viewMode === 'days' && (
                            <>
                                <div className="grid grid-cols-7 gap mb-2">
                                    {daysOfWeek.map((day) => (
                                        <div key={day} className="text-center font-semibold text-gray-600 text-xs">
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap m">
                                    {renderDays()}
                                </div>
                            </>
                        )}

                        {/* Months view */}
                        {viewMode === 'months' && (
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {renderMonths()}
                            </div>
                        )}

                        {/* Years view */}
                        {viewMode === 'years' && (
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {renderYears()}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <button
                                onClick={handleClear}
                                className="text-primary hover:text-blue-700 font-medium bg-transparent border-0 cursor-pointer text-sm"
                            >
                                Clear
                            </button>
                            <button
                                onClick={handleToday}
                                className="text-primary hover:text-blue-700 font-medium bg-transparent border-0 cursor-pointer text-sm"
                            >
                                Today
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}