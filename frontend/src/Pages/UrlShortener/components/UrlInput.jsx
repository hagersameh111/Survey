import { Link2 } from "lucide-react";

const UrlInput = ({ value, onChange }) => (
  <div className="flex h-12 min-w-0 flex-1 items-center rounded-xl border border-border bg-white">
    <div className="flex h-full w-10 shrink-0 items-center justify-center text-text-secondary">
      <Link2 size={20} />
    </div>
    <div className="h-6 w-px shrink-0 bg-border" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Paste long URL here..."
      className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-text-muted"
    />
  </div>
);

export default UrlInput;