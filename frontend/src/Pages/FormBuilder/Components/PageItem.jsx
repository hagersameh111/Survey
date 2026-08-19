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
      className={`group flex w-full items-center justify-between rounded-2xl px-4 py-3 transition-all cursor-pointer ${
        active
          ? "border-2 border-primary bg-white shadow-xs"
          : "bg-[#F4F8FF] hover:bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon
            size={18}
            className={
              active
                ? "text-primary"
                : "text-text-secondary"
            }
          />
        )}

        <span
          className={`font-medium text-sm ${
            active
              ? "text-primary"
              : "text-text"
          }`}
        >
          {title}
        </span>
      </div>

      {onDelete && (
        <Trash2
          size={16}
          className="text-text-muted opacity-60 transition group-hover:opacity-100 hover:text-red-500"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        />
      )}
    </button>
  );
};

export default PageItem;