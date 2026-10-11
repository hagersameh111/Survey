import { List, Grid2X2 } from "lucide-react";

const Tab = ({ active, onClick, icon: Icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`flex h-10 items-center gap-2 px-4 text-sm transition ${
      active ? "bg-primary-light text-primary" : "text-text-secondary hover:bg-background"
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
);

const ViewSwitcher = ({ view, setView }) => (
  <div className="flex overflow-hidden rounded-xl border border-border bg-white">
    <Tab active={view === "list"} onClick={() => setView("list")} icon={List} label="List" />
    <Tab active={view === "grid"} onClick={() => setView("grid")} icon={Grid2X2} label="Grid" />
  </div>
);

export default ViewSwitcher;