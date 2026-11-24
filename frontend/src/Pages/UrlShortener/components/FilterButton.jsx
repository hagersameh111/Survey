import { SlidersHorizontal } from "lucide-react";

const FilterButton = ({ onClick }) => {
  return (
    <button type="button" onClick={onClick} aria-label="Filters" className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface transition hover:bg-background">

      <SlidersHorizontal
        size={20}
        className="text-text-secondary"
      />

    </button>
  );
};

export default FilterButton;
