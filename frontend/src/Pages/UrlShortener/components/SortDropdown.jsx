import { ChevronDown } from "lucide-react";

const SortDropdown = ({ value, onChange }) => (
  <div className="flex h-10 w-48 items-center rounded-xl border border-border bg-white">
    <span className="px-3 text-sm text-text-secondary">Sort by</span>
    <div className="h-5 w-px bg-border" />

    <div className="relative flex-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Sort by"
        className="w-full cursor-pointer appearance-none bg-transparent py-2 pl-4 pr-8 text-sm text-text outline-none"
      >
        <option value="recent">Recent</option>
        <option value="oldest">Oldest</option>
        <option value="name">Name</option>
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
      />
    </div>
  </div>
);

export default SortDropdown;