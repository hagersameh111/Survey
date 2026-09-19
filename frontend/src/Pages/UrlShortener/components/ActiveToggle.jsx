const ActiveToggle = ({
  checked,
  onChange,
}) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition ${
        checked
          ? "bg-primary"
          : "bg-border"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked
            ? "left-6"
            : "left-1"
        }`}
      />
    </button>
  );
};

export default ActiveToggle;