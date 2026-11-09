import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ResponsesSidebar from "./components/ResponsesSidebar";
import ResponsesHeader from "./components/ResponsesHeader";
import ResponsesTable from "./components/ResponsesTable";
import ResponsesGrid from "./components/ResponsesGrid";
import ResponseDetailModal from "./components/ResponseDetailModal";
import { FILTERS, matchesSearch } from "./responseFilters";
import downloadCsv from "./downloadCsv";
import { getForm, getForms, getResponse, getResponses } from "../../api/forms";

const RESPONSE_LIMIT = 25;
const dateLabel = (date) => date ? new Date(date).toLocaleDateString() : "—";

const Responses = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formId = searchParams.get("form");
  const [activeId, setActiveId] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list");
  const [responses, setResponses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: RESPONSE_LIMIT, total: 0, totalPages: 0 });
  const [responsePage, setResponsePage] = useState(1);

  useEffect(() => setResponsePage(1), [formId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const load = async () => {
      const forms = formId ? [await getForm(formId)] : await getForms({ sort: "updated_at", order: "desc" });
      const groups = await Promise.all(forms.map(async (form) => {
        const result = await getResponses(form.id || form._id, { page: formId ? responsePage : 1, limit: RESPONSE_LIMIT, sort: "desc" });
        const items = (result.data || []).map((response) => ({
          id: response.responseId,
          responseId: response.responseId,
          formId: form.id || form._id,
          survey: form.title || "Untitled form",
          name: "Anonymous respondent",
          email: "",
          phone: "",
          age: "—",
          rating: "—",
          lastResponse: dateLabel(response.submittedAt),
          lastResponseAt: response.submittedAt,
          completed: true,
          answers: [],
          form,
        }));
        return { items, pagination: result.pagination };
      }));
      return { items: groups.flatMap((group) => group.items).sort((a, b) => new Date(b.lastResponseAt) - new Date(a.lastResponseAt)), pageInfo: formId ? groups[0]?.pagination : null };
    };
    load().then(({ items, pageInfo }) => { if (!cancelled) { setResponses(items); if (pageInfo) setPagination(pageInfo); else setPagination({ page: 1, limit: RESPONSE_LIMIT, total: items.length, totalPages: 1 }); } })
      .catch((e) => { if (!cancelled) setError(e.response?.data?.message || e.message || "Could not load responses."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [formId, responsePage]);

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.id, responses.filter(f.test).length])), [responses]);
  const filter = FILTERS.find((f) => f.id === activeId) ?? FILTERS[0];
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return responses.filter(filter.test).filter((r) => matchesSearch(r, q));
  }, [responses, filter, search]);

  const openResponse = async (response) => {
    setSelected({ ...response, loading: true });
    try {
      const [detail, form] = await Promise.all([
        getResponse(response.formId, response.responseId),
        response.form?.pages ? Promise.resolve(response.form) : getForm(response.formId),
      ]);
      const labels = new Map((form.pages || []).flatMap((page) => (page.blocks || []).map((block) => [String(block._id), block.data?.question || block.data?.text || "Response"])).filter(([id]) => id));
      const participantInfo = detail.participantInfo || [];
      const fieldFor = (key) => participantInfo.find((item) => labels.get(String(item.questionId))?.toLowerCase().includes(key))?.value;
      const mergedAnswers = [...participantInfo, ...(detail.answers || [])].map((item, index) => ({
        id: item.questionId || index,
        question: labels.get(String(item.questionId)) || `Question ${index + 1}`,
        answer: Array.isArray(item.value) ? item.value.join(", ") : String(item.value),
      }));
      setSelected({ ...response, name: fieldFor("name") || "Anonymous respondent", email: fieldFor("email") || "", phone: fieldFor("phone") || "", answers: mergedAnswers, completedCount: mergedAnswers.length, totalCount: mergedAnswers.length });
    } catch (e) {
      setSelected({ ...response, loading: false, detailError: e.response?.data?.message || "Could not load response details." });
    }
  };

  let content;
  if (loading) content = <p className="mt-8 text-center text-sm text-text-muted">Loading responses…</p>;
  else if (error) content = <div role="alert" className="mt-8 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  else if (visible.length === 0) content = <div className="flex min-h-[320px] flex-col items-center justify-center text-center"><p className="text-lg font-medium text-text">{search.trim() ? `No results for “${search.trim()}”` : "Nothing here yet"}</p><p className="mt-1 text-sm text-text-muted">{filter.empty}</p></div>;
  else content = view === "list" ? <ResponsesTable responses={visible} onViewDetails={openResponse} /> : <ResponsesGrid responses={visible} onViewDetails={openResponse} />;

  return <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:gap-6">
    <ResponsesSidebar filters={FILTERS} counts={counts} active={activeId} onFilterChange={setActiveId} search={search} onSearchChange={setSearch} collected={responses.length} limit={RESPONSE_LIMIT} onCreateForm={() => navigate("/form-builder")} />
    <main className="min-w-0 flex-1 rounded-2xl bg-surface p-4 shadow-sm sm:p-6 lg:p-8">
      <ResponsesHeader title={`${filter.title} Responses`} view={view} onViewChange={setView} onDownload={() => downloadCsv(visible, `${filter.id}-responses.csv`)} downloadDisabled={!visible.length} />
      {content}
      {formId && pagination.totalPages > 1 && <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm text-text-secondary">
        <span>Page {pagination.page} of {pagination.totalPages} · {pagination.total} responses</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => setResponsePage((page) => Math.max(1, page - 1))} disabled={responsePage <= 1 || loading} className="rounded-lg border border-border px-4 py-2 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
          <button type="button" onClick={() => setResponsePage((page) => Math.min(pagination.totalPages, page + 1))} disabled={responsePage >= pagination.totalPages || loading} className="rounded-lg border border-border px-4 py-2 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50">Next</button>
        </div>
      </div>}
    </main>
    <ResponseDetailModal isOpen={Boolean(selected)} onClose={() => setSelected(null)} respondentName={selected?.name} completedCount={selected?.completedCount ?? 0} totalCount={selected?.totalCount ?? 0} responses={selected?.answers ?? []} loading={selected?.loading} error={selected?.detailError} />
  </div>;
};

export default Responses;
