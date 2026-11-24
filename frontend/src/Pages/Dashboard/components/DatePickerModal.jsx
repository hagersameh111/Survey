import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";

const DatePickerModal = ({ open, onClose, onSelectDate }) => {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  if (!open) return null;

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthLabel = visibleMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-2 text-gray-900">
            <CalendarIcon size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold">Select Date</h2>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <X size={18} />
          </button>
        </div>

        {/* Calendar Body */}
        <div className="p-6">
          {/* Month Navigation */}
          <div className="mb-6 flex items-center justify-between">
            <button type="button" aria-label="Previous month" onClick={() => setVisibleMonth(new Date(year, month - 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-blue-600 hover:text-blue-600">
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold text-gray-900">{monthLabel}</span>
            <button type="button" aria-label="Next month" onClick={() => setVisibleMonth(new Date(year, month + 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-blue-600 hover:text-blue-600">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Days of Week */}
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400">
            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
          </div>

          {/* Date Grid */}
          <div className="grid grid-cols-7 gap-1 text-sm">
            {/* Blank spaces for month start offset */}
            {Array.from({ length: firstDay }, (_, index) => <div key={`blank-${index}`} className="h-9 w-9" />)}
            
            {days.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDate(new Date(year, month, day))}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                  selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === day
                    ? "bg-blue-600 font-bold text-white shadow-sm" 
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button 
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onSelectDate && onSelectDate(`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`);
              onClose();
            }}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatePickerModal;
