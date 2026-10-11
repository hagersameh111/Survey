import { LayoutGrid, List } from "lucide-react";

const Tab = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className={`flex items-center gap-2 px-6 py-3 text-sm transition ${
      active ? "bg-primary-light text-primary" : "text-text-secondary hover:bg-background"
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
);

const ViewSwitcher = ({ view, onChange }) => (
  <div className="flex overflow-hidden rounded-xl border border-border bg-white">
    <Tab active={view === "list"} onClick={() => onChange("list")} icon={List} label="List" />
    <Tab active={view === "grid"} onClick={() => onChange("grid")} icon={LayoutGrid} label="Grid" />
  </div>
);

export default ViewSwitcher;