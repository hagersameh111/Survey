import { Plus } from "lucide-react";

const PageSection = ({
  title,
  showAdd = false,
  children,
  onAdd,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-text">
          {title}
        </h3>

        {showAdd && (
          <button
            onClick={onAdd}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border transition hover:border-primary hover:text-primary"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      <div className="mt-3">
        {children}
      </div>

      <div className="my-6 border-b border-border" />
    </div>
  );
};

export default PageSection;