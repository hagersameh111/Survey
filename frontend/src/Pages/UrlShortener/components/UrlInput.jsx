import { Link2 } from "lucide-react";

const UrlInput = ({
  value,
  onChange,
}) => {
  return (
    <div className="flex h-14 flex-1 items-center overflow-hidden rounded-xl border border-border bg-surface">

      <div className="flex h-full w-14 items-center justify-center border-r border-border">
        <Link2
          size={20}
          className="text-text-secondary"
        />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste long URL here..."
        className="h-full flex-1 bg-transparent px-4 outline-none placeholder:text-text-muted"
      />

    </div>
  );
};

export default UrlInput;