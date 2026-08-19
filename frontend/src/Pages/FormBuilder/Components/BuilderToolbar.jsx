import { Plus, Copy, Eye, Settings } from "lucide-react";

const BuilderToolbar = ({
  onAddQuestion,
}) => {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-4">

      <div className="flex gap-3">

        <button
          onClick={onAddQuestion}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-white hover:bg-primary-hover"
        >
          <Plus size={18} />
          Add Question
        </button>

        <button className="rounded-xl border border-border p-3 hover:bg-white">
          <Copy size={18} />
        </button>

      </div>

      <div className="flex gap-3">

        <button className="rounded-xl border border-border p-3 hover:bg-white">
          <Eye size={18} />
        </button>

        <button className="rounded-xl border border-border p-3 hover:bg-white">
          <Settings size={18} />
        </button>

      </div>

    </div>
  );
};

export default BuilderToolbar;