import { ArrowLeftRight, ArrowRight, Link2 } from "lucide-react";
import ShortUrlInput from "./ShortUrlInput";
import ExpirationPicker from "./ExpirationPicker";
import QRCodeButton from "./QRCodeButton";
import SaveButton from "./SaveButton";

// One row of the page: [swap] [source input] [action] -> [short link] [date] [QR] [Save]
const RowLayout = ({
  row,
  source,
  actionLabel,
  actionDisabled,
  onAction,
  onChange,
  onSwap,
  onQr,
  onSave,
}) => {
  const hasShort = Boolean(row.shortUrl);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onSwap}
        aria-label="Switch between URL and file"
        title="Switch between URL and file"
        className="flex h-12 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary transition hover:bg-primary-light"
      >
        <ArrowLeftRight size={18} />
      </button>

      {source}

      <button
        type="button"
        onClick={onAction}
        disabled={actionDisabled}
        className="flex h-12 w-32 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Link2 size={18} />
        {actionLabel}
      </button>

      <ArrowRight size={16} className="mx-6 shrink-0 text-text-muted opacity-60" />

      <ShortUrlInput
        value={row.shortUrl}
        active={row.active}
        onToggle={(active) => onChange({ active })}
      />

      <ExpirationPicker value={row.expiration} onChange={(expiration) => onChange({ expiration })} />

      <QRCodeButton disabled={!hasShort} onClick={onQr} />
      <SaveButton disabled={!hasShort} onClick={onSave} />
    </div>
  );
};

export default RowLayout;