import { ChevronDown } from "lucide-react";

const SortDropdown = ({
  value,
  onChange,
}) => {
  return (
    <div className="flex h-12 items-center gap-4 rounded-xl border border-border bg-surface px-5">

      <span className="text-text-secondary">
        Sort by
      </span>

      <div className="h-6 w-px bg-border" />

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent outline-none"
      >
        <option value="recent">
          Recent
        </option>

        <option value="oldest">
          Oldest
        </option>

        <option value="name">
          Name
        </option>
      </select>

      <ChevronDown
        size={18}
        className="pointer-events-none -ml-6 text-text-muted"
      />

    </div>
  );
};

export default SortDropdown;