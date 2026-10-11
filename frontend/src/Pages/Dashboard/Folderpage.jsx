import { useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import DashboardHeader from "./components/DashboardHeader";
import FormsTable from "./components/FormsTable";
import WorkspaceGrid from "./components/WorkspaceGrid";
import WorkspaceEmpty from "./components/WorkspaceEmpty";
import useForms from "../../hooks/useForms";
import { deleteForm, duplicateForm } from "../../api/forms";

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
    </>
  );
};

export default FolderPage;