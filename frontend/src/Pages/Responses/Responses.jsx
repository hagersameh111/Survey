import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import ResponsesSidebar from "./components/ResponsesSidebar";
import ResponsesHeader from "./components/ResponsesHeader";
import ResponsesTable from "./components/ResponsesTable";
import ResponsesGrid from "./components/ResponsesGrid";
import ResponseDetailModal from "./components/ResponseDetailModal";

import responsesData from "./Data/responses"; // swap for your API data when ready
import { FILTERS, matchesSearch } from "./responseFilters";
import downloadCsv from "./downloadCsv";

const RESPONSE_LIMIT = 100;

const Responses = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formId = searchParams.get("form"); // set by the "Responses" icon on the Forms page

  const [activeId, setActiveId] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);

  // Responses for the current form (only filters if your data carries a formId)
  const base = useMemo(() => {
    const all = responsesData ?? [];
    const hasFormIds = all.some((r) => r.formId !== undefined);
    return formId && hasFormIds ? all.filter((r) => String(r.formId) === formId) : all;
  }, [formId]);

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, base.filter(f.test).length])),
    [base]
  );

  const filter = FILTERS.find((f) => f.id === activeId) ?? FILTERS[0];

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return base.filter(filter.test).filter((r) => matchesSearch(r, q));
  }, [base, filter, search]);

  let content;
  if (visible.length === 0) {
    content = (
      <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-text">
          {search.trim() ? `No results for "${search.trim()}"` : "Nothing here yet"}
        </p>
        <p className="mt-1 text-sm text-text-muted">
          {search.trim() ? "Try a different name, email or survey." : filter.empty}
        </p>
      </div>
    );
  } else if (view === "list") {
    content = <ResponsesTable responses={visible} onViewDetails={setSelected} />;
  } else {
    content = <ResponsesGrid responses={visible} onViewDetails={setSelected} />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:gap-6">
      <ResponsesSidebar
        filters={FILTERS}
        counts={counts}
        active={activeId}
        onFilterChange={setActiveId}
        search={search}
        onSearchChange={setSearch}
        collected={base.length}
        limit={RESPONSE_LIMIT}
        onCreateForm={() => navigate("/form-builder")}
      />

      <main className="min-w-0 flex-1 rounded-2xl bg-surface p-4 shadow-sm sm:p-6 lg:p-8">
        <ResponsesHeader
          title={`${filter.title} Responses`}
          view={view}
          onViewChange={setView}
          onDownload={() => downloadCsv(visible, `${filter.id}-responses.csv`)}
          downloadDisabled={visible.length === 0}
        />
        {content}
      </main>

      <ResponseDetailModal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        respondentName={selected?.name}
        completedCount={selected?.completedCount ?? 15}
        totalCount={selected?.totalCount ?? 15}
        responses={selected?.answers ?? []}
      />
    </div>
  );
};

export default Responses;
