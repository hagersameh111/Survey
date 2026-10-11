import ActiveToggle from "./ActiveToggle";
import CopyButton from "./CopyButton";

// Generated link box: toggle on the left, copy button inside on the right
const ShortUrlInput = ({ value, active, onToggle }) => (
  <div className="flex h-12 w-80 shrink-0 items-center gap-3 rounded-xl border border-border bg-white px-3">
    <ActiveToggle checked={active} onChange={onToggle} disabled={!value} />
    <input
      type="text"
      readOnly
      value={value}
      aria-label="Short URL"
      className="min-w-0 flex-1 bg-transparent text-sm text-primary outline-none"
    />
    <CopyButton text={value} disabled={!value} />
  </div>
);

export default ShortUrlInput;