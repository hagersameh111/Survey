import { FileText, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const WorkspaceEmpty = ({ folderName, folderSlug }) => (
  <div className="flex min-h-[450px] flex-col items-center justify-center text-center">
    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-light">
      <FileText size={36} className="text-primary" />
    </div>

    <h2 className="mb-2 text-3xl font-medium text-text">Nothing here yet</h2>
    <p className="mb-8 text-text-secondary">
      You haven't created any forms in <span className="capitalize">{folderName}</span>.
    </p>

    <Link
      to={`/form-builder?folder=${folderSlug}`}
      className="flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg text-white transition hover:bg-primary-hover"
    >
      <Plus size={20} />
      Create form
    </Link>
  </div>
);

export default WorkspaceEmpty;