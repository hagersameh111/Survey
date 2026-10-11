import { Search } from "lucide-react";

const SearchInput = ({ value, onChange }) => (
  <div className="p-4">
    <div className="flex h-10 items-center gap-3 rounded-xl bg-background px-4">
      <Search size={18} className="shrink-0 text-text-muted" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search"
        className="w-full bg-transparent text-sm outline-none placeholder:text-text-muted"
      />
    </div>
  </div>
);

export default SearchInput;