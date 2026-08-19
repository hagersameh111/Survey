import { FileText, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const WorkspaceEmpty = () => {
  return (
    <div className="flex min-h-[550px] flex-col items-center justify-center">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-light">
        <FileText
          size={36}
          className="text-primary"
        />
      </div>

      <h2 className="mb-8 text-4xl font-medium text-text">
        Create a new form to get started
      </h2>

      {/* Changed from <button> to <Link> */}
      <Link 
        to="/form-builder"
        className="flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg text-white transition hover:bg-primary-hover"
      >
        <Plus size={20} />
        Create form
      </Link>
    </div>
  );
};

export default WorkspaceEmpty;