import { useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import DashboardHeader from "./components/DashboardHeader";
import FormsTable from "./components/FormsTable";
import WorkspaceGrid from "./components/WorkspaceGrid";
import WorkspaceEmpty from "./components/WorkspaceEmpty";
import useForms from "../../hooks/useForms.js";
import { closeForm, deleteForm, duplicateForm, reopenForm, updateForm } from "../../api/forms";

export const SORT_OPTIONS = [
  { value: "created_at", label: "Date created", order: "desc" },
  { value: "updated_at", label: "Last updated", order: "desc" },
  { value: "title", label: "Name", order: "asc" },
];

const Skeleton = () => (
  <div className="mt-6 space-y-3" aria-busy="true">
    {[0, 1, 2].map((i) => (
      <div key={i} className="h-12 animate-pulse rounded-xl bg-background" />
    ))}
  </div>
);

const FolderPage = () => {
  const { folderSlug } = useParams();
  const { folders, refreshFolders } = useOutletContext();
  const [view, setView] = useState("list");
  const [sort, setSort] = useState(SORT_OPTIONS[0]);
  const [formAction, setFormAction] = useState(null);

  const folder = folders.find((f) => f.slug === folderSlug);
  const title = folder?.name ?? folderSlug.replace(/-/g, " ");

  const { forms, loading, error, refetch } = useForms({
    folder: folderSlug,
    sort: sort.value,
    order: sort.order,
  });

  const run = async (fn, id) => {
    try {
      await fn(id);
      refetch();
      refreshFolders();
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Action failed");
    }
  };

  const actions = {
    onDelete: (f) => window.confirm(`Delete "${f.title}"?`) && run(deleteForm, f.id),
    onDuplicate: (f) => run(duplicateForm, f.id),
    onClose: (f) => run(closeForm, f.id),
    onReopen: (f) => run(reopenForm, f.id),
    onRename: (f) => setFormAction({ type: "rename", form: f, value: f.title }),
    onMove: (f) => setFormAction({ type: "move", form: f, value: f.folder || folderSlug }),
  };

  let content;
  if (loading) content = <Skeleton />;
  else if (error)
    content = (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-center">
        <p className="text-lg font-medium text-text">Couldn't load your forms</p>
        <p className="text-sm text-text-muted">{error}</p>
        <button onClick={refetch} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover">
          Try again
        </button>
      </div>
    );
  else if (forms.length === 0) content = <WorkspaceEmpty folderName={title} folderSlug={folderSlug} />;
  else if (view === "list") content = <FormsTable forms={forms} {...actions} />;
  else content = <WorkspaceGrid forms={forms} {...actions} />;

  return (
    <>
      <DashboardHeader
        title={title}
        view={view}
        onViewChange={setView}
        sort={sort}
        onSortChange={setSort}
      />
      {content}
      {formAction && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <form onSubmit={async (event) => {
          event.preventDefault();
          const value = formAction.value.trim();
          if (!value) return;
          const changes = formAction.type === "rename" ? { title: value } : { folder: value };
          await run((id) => updateForm(id, changes), formAction.form.id);
          setFormAction(null);
        }} className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-text">{formAction.type === "rename" ? "Rename form" : "Move form"}</h2>
          <label className="mt-4 block text-sm font-medium text-text" htmlFor="form-action-value">{formAction.type === "rename" ? "Form name" : "Folder name"}</label>
          <input id="form-action-value" autoFocus maxLength={formAction.type === "rename" ? 200 : 100} value={formAction.value} onChange={(event) => setFormAction((previous) => ({ ...previous, value: event.target.value }))} className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm text-text outline-none focus:border-primary" />
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setFormAction(null)} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-background">Cancel</button>
            <button type="submit" disabled={!formAction.value.trim()} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">Save</button>
          </div>
        </form>
      </div>}
    </>
  );
};

export default FolderPage;
