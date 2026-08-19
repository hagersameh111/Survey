import { Save } from "lucide-react";

const SaveButton = ({
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="flex h-14 items-center gap-2 rounded-xl bg-primary px-6 font-medium text-white transition hover:bg-primary-hover"
    >
      <Save size={18} />

      Save
    </button>
  );
};

export default SaveButton;