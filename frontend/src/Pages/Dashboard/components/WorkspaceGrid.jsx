import { FileText, Users, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import WorkspaceContextMenu from "./WorkspaceContextMenu";
import { formatDate } from "./formatDate";

const WorkspaceGrid = ({ forms, onDelete, onDuplicate, onRename, onMove }) => (
  <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
    {forms.map((form) => (
      <div
        key={form.id}
        className="group relative flex flex-col justify-between rounded-3xl border border-border bg-white p-6 transition hover:border-primary hover:shadow-md"
      >
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
              <FileText size={24} />
            </div>
            <WorkspaceContextMenu
              onRename={() => onRename?.(form)}
              onDuplicate={() => onDuplicate(form)}
              onMove={() => onMove?.(form)}
              onDelete={() => onDelete(form)}
            />
          </div>
          <h3 className="text-lg font-semibold text-text transition group-hover:text-primary">{form.title}</h3>
          <p className="mt-1 text-xs text-text-muted">Last modified {formatDate(form.updatedAt)}</p>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Users size={16} className="text-primary" />
            <span>{form.responsesCount} responses</span>
          </div>
          <Link
            to={`/form-builder/${form.id}`}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Open builder
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    ))}
  </div>
);

export default WorkspaceGrid;