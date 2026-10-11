import { Plus } from "lucide-react";

import SearchInput from "./SearchInput";
import ResponseFilterItem from "./ResponseFilterItem";
import ResponsesProgress from "./ResponsesProgress";

const ResponsesSidebar = ({
  filters,
  counts,
  active,
  onFilterChange,
  search,
  onSearchChange,
  collected,
  limit,
  onCreateForm,
}) => (
  <aside className="w-full shrink-0 self-start overflow-hidden rounded-2xl bg-surface shadow-sm lg:w-72">
    <div className="border-b border-divider p-5">
      <button
        type="button"
        onClick={onCreateForm}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-medium text-white transition hover:bg-primary-hover"
      >
        <Plus size={20} />
        Create form
      </button>
    </div>

    <div className="border-b border-divider">
      <SearchInput value={search} onChange={onSearchChange} />
    </div>

    <nav className="space-y-2 px-4 py-6" aria-label="Response filters">
      {filters.map((f) => (
        <ResponseFilterItem
          key={f.id}
          active={active === f.id}
          title={f.title}
          count={counts[f.id] ?? 0}
          onClick={() => onFilterChange(f.id)}
        />
      ))}
    </nav>

    <ResponsesProgress collected={collected} limit={limit} />
  </aside>
);

export default ResponsesSidebar;
