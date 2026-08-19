import { CalendarDays } from "lucide-react";

const ExpirationPicker = ({
  value,
  onChange,
}) => {
  return (
    <div className="flex h-14 w-44 items-center gap-3 rounded-xl border border-border bg-surface px-4">

      <CalendarDays
        size={18}
        className="text-text-muted"
      />

      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent outline-none"
      />

    </div>
  );
};

export default ExpirationPicker;