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

        <h3 className="text-2xl font-semibold text-text">
          {title}
        </h3>

        {showAdd && (
          <button
            onClick={onAdd}
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border transition hover:border-primary hover:text-primary"
          >
            <Plus size={24} />
          </button>
        )}

      </div>

      <div className="mt-5">

        {children}

      </div>

      <div className="my-8 border-b border-border" />

    </div>
  );
};

export default PageSection;