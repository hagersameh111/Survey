// Sidebar tabs. Each tab decides which responses belong to it.
// Adjust the tests if your backend uses different field names.
export const RECENT_DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;

const timeOf = (r) => {
  const t = new Date(r.lastResponseAt ?? r.lastResponse).getTime();
  return Number.isNaN(t) ? 0 : t;
};

export const isCompleted = (r) =>
  r.completed === true ||
  r.status === "completed" ||
  (r.totalCount > 0 && r.completedCount >= r.totalCount);

export const FILTERS = [
  { id: "all", title: "All", test: () => true, empty: "No responses yet." },
  { id: "completed", title: "Completed", test: isCompleted, empty: "No completed responses yet." },
  {
    id: "recent",
    title: "Recent",
    test: (r) => timeOf(r) > 0 && Date.now() - timeOf(r) <= RECENT_DAYS * DAY,
    empty: `No responses in the last ${RECENT_DAYS} days.`,
  },
  { id: "rated", title: "Rated", test: (r) => Number(r.rating) > 0, empty: "No rated responses yet." },
];

export const matchesSearch = (r, q) =>
  !q ||
  [r.name, r.email, r.survey, r.phone].some((v) => String(v ?? "").toLowerCase().includes(q));