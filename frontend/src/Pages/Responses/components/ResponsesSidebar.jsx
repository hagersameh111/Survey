import { useState } from "react";
import { Plus } from "lucide-react";

import SearchInput from "./SearchInput";
import ResponseFilterItem from "./ResponseFilterItem";
import ResponsesProgress from "./ResponsesProgress";

const filters = [
  {
    id: "all",
    title: "All",
    count: 9,
  },
  {
    id: "completed",
    title: "Completed",
    count: 3,
  },
  {
    id: "recent",
    title: "Recent",
    count: 6,
  },
  {
    id: "rated",
    title: "Rated",
    count: 0,
  },
];

const ResponsesSidebar = ({
  onCreateForm,
}) => {
  const [search, setSearch] = useState("");
  const [active, setActive] =
    useState("all");

  return (
    <aside className="w-72 overflow-hidden rounded-2xl bg-[#EAF0FF] shadow-sm">

      {/* Create */}

      <div className="border-b border-border p-5">

        <button
          onClick={onCreateForm}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-primary text-lg font-medium text-white"
        >
          <Plus size={22} />

          Create form

        </button>

      </div>

      {/* Search */}

      <SearchInput
        value={search}
        onChange={setSearch}
      />

      <div className="border-t border-border p-4">

        <div className="space-y-2">

          {filters.map((filter) => (
            <ResponseFilterItem
              key={filter.id}
              active={
                active === filter.id
              }
              title={filter.title}
              count={filter.count}
              onClick={() =>
                setActive(filter.id)
              }
            />
          ))}

        </div>

      </div>

      <ResponsesProgress
        collected={0}
        limit={100}
      />

    </aside>
  );
};

export default ResponsesSidebar;