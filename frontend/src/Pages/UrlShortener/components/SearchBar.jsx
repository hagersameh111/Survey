import { Search } from "lucide-react";

const SearchBar = ({
  value,
  onChange,
}) => {
  return (
    <div className="flex h-12 w-80 items-center gap-3 rounded-xl bg-surface px-4">

      <Search
        size={18}
        className="text-text-muted"
      />

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search"
        className="w-full bg-transparent outline-none placeholder:text-text-muted"
      />

    </div>
  );
};

export default SearchBar;