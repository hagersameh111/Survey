const ResponseFilterItem = ({
  active,
  title,
  count,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl px-4 py-4 transition ${
        active
          ? "bg-primary-light text-primary"
          : "text-text-secondary hover:bg-background"
      }`}
    >
      <span>{title}</span>

      <span>{count}</span>
    </button>
  );
};

export default ResponseFilterItem;