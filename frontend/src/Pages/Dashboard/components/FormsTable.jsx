import { useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, Copy, Check, ScanLine, Users, Pencil, Trash2 } from "lucide-react";
import WorkspaceContextMenu from "./WorkspaceContextMenu";
import { formatDate } from "./formatDate";

const COLS = "grid grid-cols-[minmax(160px,2fr)_90px_110px_110px_minmax(200px,2.4fr)_150px] items-center gap-4";

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      aria-label="Copy link"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-text-muted transition hover:text-primary"
    >
      {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
    </button>
  );
};

const FormsTable = ({ forms, onDelete, onDuplicate, onRename, onMove }) => (
  <div className="mt-6 overflow-x-auto">
    <div className="min-w-[900px]">
      <div className={`${COLS} px-2 pb-3 text-sm text-text-secondary`}>
        <span>Name</span>
        <span className="text-center">Responses</span>
        <span className="text-center">Created</span>
        <span className="text-center">Last Updated</span>
        <span className="text-center">Form Link</span>
        <span className="text-center">Actions</span>
      </div>

      <div className="space-y-2">
        {forms.map((form) => {
          const locked = form.responsesCount > 0; // editing is disabled once responses exist
          return (
            <div key={form.id} className={`${COLS} rounded-xl bg-background px-2 py-2 text-sm text-text-secondary`}>
              <Link to={`/responses?form=${form.id}`} className="flex min-w-0 items-center gap-3 text-text hover:text-primary">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                  <LayoutGrid size={16} />
                </span>
                <span className="truncate">{form.title}</span>
              </Link>

              <span className="text-center">{form.responsesCount || "-"}</span>
              <span className="text-center">{formatDate(form.createdAt)}</span>
              <span className="text-center">{formatDate(form.updatedAt)}</span>

              <div className="flex min-w-0 items-center justify-center gap-3">
                {form.shortUrl ? (
                  <>
                    <a href={form.shortUrl} target="_blank" rel="noreferrer" className="truncate text-primary hover:underline">
                      {form.shortUrl}
                    </a>
                    <CopyButton text={form.shortUrl} />
                    <ScanLine size={16} className="shrink-0 text-text-muted" />
                  </>
                ) : (
                  <span className="text-text-muted">Not published</span>
                )}
              </div>

              <div className="flex items-center justify-center gap-3 text-text">
                <Link to={`/responses?form=${form.id}`} aria-label="Responses" className="hover:text-primary">
                  <Users size={16} />
                </Link>
                {locked ? (
                  <Pencil size={16} className="text-border" aria-label="Editing disabled" />
                ) : (
                  <Link to={`/form-builder/${form.id}`} aria-label="Edit" className="hover:text-primary">
                    <Pencil size={16} />
                  </Link>
                )}
                <button aria-label="Delete" onClick={() => onDelete(form)} className="hover:text-red-600">
                  <Trash2 size={16} />
                </button>
                <WorkspaceContextMenu
                  onRename={() => onRename?.(form)}
                  onDuplicate={() => onDuplicate(form)}
                  onMove={() => onMove?.(form)}
                  onDelete={() => onDelete(form)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export default FormsTable;