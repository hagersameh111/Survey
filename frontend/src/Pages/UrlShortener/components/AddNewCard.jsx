const AddNewCard = ({
  title,
  description,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="w-72 rounded-3xl border border-border bg-surface p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-lg"
    >
      <h3 className="mb-6 text-2xl font-semibold text-text">
        {title}
      </h3>

      <div className="mb-6 border-b border-border" />

      <p className="text-lg text-text-secondary">
        {description}
      </p>
    </button>
  );
};

export default AddNewCard;