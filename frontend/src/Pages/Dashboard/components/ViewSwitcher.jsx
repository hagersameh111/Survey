import { LayoutGrid, List } from "lucide-react";

const ViewSwitcher = () => {
  return (
    <div className="flex overflow-hidden rounded-xl border border-border bg-white">
      <button className="flex items-center gap-2 bg-primary-light px-6 py-3 text-primary">
        <List size={18} />

        List
      </button>

      <button className="flex items-center gap-2 px-6 py-3 text-text-secondary hover:bg-background">
        <LayoutGrid size={18} />

        Grid
      </button>
    </div>
  );
};

export default ViewSwitcher;