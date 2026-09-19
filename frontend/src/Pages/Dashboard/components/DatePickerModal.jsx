import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";

const DatePickerModal = ({ open, onClose, onSelectDate }) => {
  const [selectedDate, setSelectedDate] = useState(17); // Placeholder active date

  if (!open) return null;

  // Mock days array for standard 31-day month layout
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

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
            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-blue-600 hover:text-blue-600">
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold text-gray-900">June 2026</span>
            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-blue-600 hover:text-blue-600">
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
            <div className="h-9 w-9"></div>
            
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDate(day)}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                  selectedDate === day 
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
              onSelectDate && onSelectDate(`June ${selectedDate}, 2026`);
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