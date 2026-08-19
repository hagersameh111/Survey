import { Plus } from "lucide-react";

const AddNewButton = ({
  open,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 font-semibold text-primary transition hover:opacity-80"
    >
      <Plus size={22} />

      Add New
    </button>
  );
};

export default AddNewButton;