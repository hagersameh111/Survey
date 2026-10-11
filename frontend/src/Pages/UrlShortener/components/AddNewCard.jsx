const AddNewCard = ({ title, onClick }) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    className="block w-full rounded-xl px-4 py-3 text-left text-sm text-text transition hover:bg-background"
  >
    {title}
  </button>
);

export default AddNewCard;