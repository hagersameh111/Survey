const ActiveToggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label="Link active"
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative h-5 w-9 shrink-0 rounded-full border transition ${
      checked ? "border-primary bg-primary" : "border-border bg-background"
    } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
  >
    <span
      className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full transition-all ${
        checked ? "left-[19px] bg-white" : "left-1 bg-primary/60"
      }`}
    />
  </button>
);

export default ActiveToggle;