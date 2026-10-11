const SaveButton = ({ onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`h-12 w-12 shrink-0 rounded-xl text-sm font-medium transition ${
      disabled
        ? "cursor-not-allowed bg-background text-text-muted/70"
        : "bg-primary text-white hover:bg-primary-hover"
    }`}
  >
    Save
  </button>
);

export default SaveButton;