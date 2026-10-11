import { Plus } from "lucide-react";

const AddNewButton = ({ open, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-haspopup="menu"
    aria-expanded={open}
    className="flex items-center gap-2 font-semibold text-primary transition hover:opacity-80"
  >
    <Plus size={20} />
    Add New
  </button>
);

export default AddNewButton;