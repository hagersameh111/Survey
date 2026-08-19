import { Search } from "lucide-react";

const SearchInput = ({
  value,
  onChange,
}) => {
  return (
    <div className="p-4">

      <div className="flex h-11 items-center gap-3 rounded-xl bg-background px-4">

        <Search
          size={18}
          className="text-text-muted"
        />

        <input
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder="Search"
          className="w-full bg-transparent outline-none"
        />

      </div>

    </div>
  );
};

export default SearchInput;