import { FileText, Users, ArrowUpRight, CircleStop, CirclePlay } from "lucide-react";
import { Link } from "react-router-dom";
import WorkspaceContextMenu from "./WorkspaceContextMenu";
import { formatDate } from "./formatDate";

const WorkspaceGrid = ({ forms, onDelete, onDuplicate, onRename, onMove, onClose, onReopen }) => (
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
              canEdit={form.status === "draft"}
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
        {form.status === "published" && <button type="button" onClick={() => onClose?.(form)} className="mt-3 flex items-center gap-2 self-end text-xs font-medium text-text-secondary hover:text-amber-600"><CircleStop size={14} />Close form</button>}
        {form.status === "closed" && <button type="button" onClick={() => onReopen?.(form)} className="mt-3 flex items-center gap-2 self-end text-xs font-medium text-primary"><CirclePlay size={14} />Reopen form</button>}
      </div>
    ))}
  </div>
);

export default WorkspaceGrid;
