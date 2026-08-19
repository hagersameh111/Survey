import { Copy } from "lucide-react";

const CopyButton = ({
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-surface transition hover:bg-background"
    >
      <Copy
        size={18}
        className="text-text-secondary"
      />
    </button>
  );
};

export default CopyButton;