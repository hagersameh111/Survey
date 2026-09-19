const ShortUrlInput = ({
  value,
  onChange,
}) => {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Short URL"
      className="h-14 w-full rounded-xl border border-border bg-surface px-4 outline-none placeholder:text-text-muted"
    />
  );
};

export default ShortUrlInput;