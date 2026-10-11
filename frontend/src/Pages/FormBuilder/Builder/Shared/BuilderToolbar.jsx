import { useState } from "react";
import { Plus, Copy, Eye, Settings } from "lucide-react";
import FormSettingsModal from "../Shared/FormSettingsModal";

const BuilderToolbar = ({ onAddQuestion, onDuplicate, onPreview, settings, onSettingsChange, onSaveSettings }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-4">
        <div className="flex gap-3">
          <button
            onClick={onAddQuestion}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-white hover:bg-primary-hover transition"
          >
            <Plus size={18} />
            Add Question
          </button>

          <button type="button" onClick={onDuplicate} aria-label="Duplicate form" className="rounded-xl border border-border p-3 hover:bg-white transition text-text-secondary">
            <Copy size={18} />
          </button>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onPreview} aria-label="Preview form" className="rounded-xl border border-border p-3 hover:bg-white transition text-text-secondary">
            <Eye size={18} />
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-xl border border-border p-3 hover:bg-white transition text-text-secondary hover:text-primary"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <FormSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={onSettingsChange}
        onSave={async () => {
          const saved = await onSaveSettings();
          if (saved) setSettingsOpen(false);
        }}
      />
    </>
  );
};

export default BuilderToolbar;
