import { Trash2 } from "lucide-react";

const PageItem = ({
  icon: Icon,
  title,
  active = false,
  onClick,
  onDelete,
}) => {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center justify-between rounded-2xl px-5 py-4 transition-all ${
        active
          ? "border-2 border-primary bg-white"
          : "bg-[#F4F8FF] hover:bg-white"
      }`}
    >
      <div className="flex items-center gap-4">

        <Icon
          size={22}
          className={
            active
              ? "text-primary"
              : "text-text-secondary"
          }
        />

        <span
          className={`font-medium ${
            active
              ? "text-primary"
              : "text-text"
          }`}
        >
          {title}
        </span>

      </div>

      <Trash2
        size={18}
        className="text-text-muted opacity-60 transition group-hover:opacity-100 hover:text-red-500"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.();
        }}
      />

    </button>
  );
};

export default PageItem;