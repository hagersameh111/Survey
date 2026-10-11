import { useState } from "react";
import { Check, Copy } from "lucide-react";

const CopyButton = ({ text, disabled }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={copy}
      disabled={disabled}
      aria-label="Copy link"
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background transition ${
        disabled ? "cursor-not-allowed text-text-muted/60" : "text-text hover:bg-primary-light hover:text-primary"
      }`}
    >
      {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
    </button>
  );
};

export default CopyButton;