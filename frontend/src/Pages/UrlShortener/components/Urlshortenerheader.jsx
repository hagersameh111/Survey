import { Search, SlidersHorizontal } from "lucide-react";
import SortDropdown from "./SortDropdown";

const UrlShortenerHeader = ({ search, onSearchChange, sort, onSortChange, onFilterClick }) => (
  <div className="flex flex-wrap items-center justify-between gap-4">
    <h1 className="text-2xl font-medium text-text">URLs Shortener</h1>

    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onFilterClick}
        aria-label="Filters"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-text transition hover:border-primary hover:text-primary"
      >
        <SlidersHorizontal size={18} />
      </button>

      <div className="flex h-10 w-64 items-center gap-3 rounded-xl bg-background px-4">
        <Search size={18} className="shrink-0 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search"
          className="w-full bg-transparent text-sm outline-none placeholder:text-text-muted"
        />
      </div>

      <SortDropdown value={sort} onChange={onSortChange} />
    </div>
  </div>
);

export default UrlShortenerHeader;