// Used only if GET /folders fails, so the sidebar never goes blank.
export const FALLBACK_FOLDERS = [
  { id: "my-workspace", slug: "my-workspace", name: "My workspace", section: "private", count: null },
  { id: "personal", slug: "personal", name: "Personal", section: "private", count: null },
  { id: "work", slug: "work", name: "Work", section: "private", count: null },
  { id: "drafts", slug: "drafts", name: "Drafts", section: "private", count: null },
  { id: "team-surveys", slug: "team-surveys", name: "Team surveys", section: "shared", count: null },
];

export const DEFAULT_FOLDER = "my-workspace";