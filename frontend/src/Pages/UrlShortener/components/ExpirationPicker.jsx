import { useRef } from "react";
import { CalendarDays } from "lucide-react";

const ExpirationPicker = ({ value, onChange }) => {
  const inputRef = useRef(null);
  const today = new Date().toISOString().slice(0, 10);
  const display = value ? value.split("-").reverse().join("/") : "DD/MM/YYYY";

  const open = () => {
    const el = inputRef.current;
    if (!el) return;
    if (el.showPicker) el.showPicker();
    else el.click();
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={open}
        aria-label="Expiration date"
        className="flex h-12 w-36 items-center gap-2 rounded-xl border border-border bg-white px-3 text-sm transition hover:border-primary"
      >
        <CalendarDays size={18} className="text-text-secondary" />
        <span className={value ? "text-text" : "text-text-muted"}>{display}</span>
      </button>

      {/* Native picker, hidden: the button above shows the DD/MM/YYYY format */}
      <input
        ref={inputRef}
        type="date"
        value={value}
        min={today}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0"
      />
    </div>
  );
};

export default ExpirationPicker;