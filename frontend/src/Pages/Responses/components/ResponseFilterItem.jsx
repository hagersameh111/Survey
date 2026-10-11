const ResponseFilterItem = ({ active, title, count, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? "page" : undefined}
    className={`flex h-11 w-full items-center justify-between rounded-xl px-4 text-left transition ${
      active
        ? "bg-primary-light font-medium text-text"
        : "text-text-secondary hover:bg-background"
    }`}
  >
    <span>{title}</span>
    <span className="text-sm">{count}</span>
  </button>
);

export default ResponseFilterItem;