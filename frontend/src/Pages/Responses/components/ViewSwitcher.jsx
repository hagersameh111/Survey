import {
  List,
  Grid2X2,
} from "lucide-react";

const ViewSwitcher = ({
  view,
  setView,
}) => {
  return (
    <div className="flex overflow-hidden rounded-xl border border-border">

      <button
        onClick={() => setView("list")}
        className={`flex items-center gap-2 px-5 py-3 transition ${
          view === "list"
            ? "bg-primary-light text-primary"
            : "bg-surface text-text-secondary hover:bg-background"
        }`}
      >
        <List size={18} />
        List
      </button>

      <button
        onClick={() => setView("grid")}
        className={`flex items-center gap-2 border-l border-border px-5 py-3 transition ${
          view === "grid"
            ? "bg-primary-light text-primary"
            : "bg-surface text-text-secondary hover:bg-background"
        }`}
      >
        <Grid2X2 size={18} />
        Grid
      </button>

    </div>
  );
};

export default ViewSwitcher;