import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  Search,
  SlidersHorizontal,
  User,
  Users,
  PencilLine,
  RefreshCw,
  Trash2,
  Undo2,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Data                                                                       */
/* -------------------------------------------------------------------------- */

const EMAIL = "username88@mail.com";
const PHONE = "+1-012 345 6789";
const DATE = "Jun 17, 2026";

const ORG_NAMES = [
  ["NexaCore", "Active"],
  ["Vertex Solutions", "Active"],
  ["BluePeak Tech.", "Active"],
  ["PrimeAxis", "Paused"],
  ["Elevate Group", "Paused"],
  ["CoreVista", "Pending"],
  ["Urban Nest", "Pending"],
];

const INITIAL_ORGS = ORG_NAMES.map(([name, status], i) => ({
  id: `org-${i}`,
  name,
  email: EMAIL,
  phone: PHONE,
  status,
  date: DATE,
}));

const PERSON_STATUSES = [
  ...Array(5).fill("Active"),
  ...Array(4).fill("Paused"),
  ...Array(3).fill("Pending"),
];

const INITIAL_PEOPLE = PERSON_STATUSES.map((status, i) => ({
  id: `person-${i}`,
  name: "Ahmed Said",
  organization: "NexaCore",
  email: EMAIL,
  phone: PHONE,
  status,
  date: DATE,
}));

const FILTERS = ["All", "Active", "Paused", "Pending", "Deleted"];

const STATUS_STYLES = {
  Active: "text-blue-800",
  Paused: "text-red-600",
  Pending: "text-blue-300",
  Deleted: "text-slate-400",
};

const VIEWS = {
  organizations: {
    title: "Organizations",
    avatar: "dot",
    columns: [
      { key: "name", label: "Name", width: "2.4fr", align: "left" },
      { key: "email", label: "Agent Email", width: "2fr" },
      { key: "phone", label: "Agent Phone", width: "1.7fr" },
      { key: "status", label: "Status", width: "1fr" },
      { key: "date", label: "Date Joined", width: "1.3fr" },
      { key: "actions", label: "Actions", width: "3fr" },
    ],
  },
  individuals: {
    title: "Individuals",
    avatar: "face",
    columns: [
      { key: "name", label: "Name", width: "2fr", align: "left" },
      { key: "organization", label: "Organization", width: "1.6fr" },
      { key: "email", label: "Email", width: "2fr" },
      { key: "phone", label: "Phone", width: "1.7fr" },
      { key: "status", label: "Status", width: "1fr" },
      { key: "date", label: "Date Joined", width: "1.3fr" },
      { key: "actions", label: "Actions", width: "3fr" },
    ],
  },
};

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

/* -------------------------------------------------------------------------- */
/*  Small pieces                                                               */
/* -------------------------------------------------------------------------- */

function FaceAvatar({ className = "h-8 w-8" }) {
  return (
    <div
      aria-hidden="true"
      className={`${className} flex-shrink-0 overflow-hidden rounded-full bg-slate-500`}
    >
      <svg viewBox="0 0 40 40" className="h-full w-full">
        <rect width="40" height="40" fill="#64748b" />
        <path d="M6 40c0-9 6-14 14-14s14 5 14 14z" fill="#1e293b" />
        <circle cx="20" cy="17" r="7.5" fill="#f5c9a0" />
        <path d="M12 15c0-6 4-9 8-9s8 3 8 9c-2-3-5-4-8-4s-6 1-8 4z" fill="#1e293b" />
      </svg>
    </div>
  );
}

function PauseColumnsIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden="true"
    >
      <rect x="2" y="2.5" width="5" height="11" rx="1" />
      <rect x="9" y="2.5" width="5" height="11" rx="1" />
    </svg>
  );
}





function ViewSwitch({ value, onChange }) {
  const items = [
    { id: "individuals", label: "Individuals", icon: User },
    { id: "organizations", label: "Organizations", icon: Users },
  ];
  return (
    <div role="group" aria-label="Directory view" className="inline-flex rounded-lg border border-slate-100 bg-white p-0.5">
      {items.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(id)}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${focusRing} ${
              active
                ? "bg-blue-100 text-blue-800"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.5} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Row actions                                                                */
/* -------------------------------------------------------------------------- */

function RowActions({ row, onAction }) {
  const base = `inline-flex items-center gap-1.5 rounded text-xs transition-colors ${focusRing}`;

  if (row.status === "Deleted") {
    return (
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={() => onAction("restore", row)}
          className={`${base} text-blue-800 hover:text-blue-900`}
        >
          <Undo2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          Restore
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-5">
      <button
        type="button"
        onClick={() => onAction("reset", row)}
        className={`${base} text-slate-700 hover:text-slate-900`}
      >
        <PencilLine className="h-3.5 w-3.5" strokeWidth={1.5} />
        Reset Password
      </button>
      <button
        type="button"
        onClick={() => onAction("toggle", row)}
        className={`${base} text-slate-700 hover:text-slate-900`}
      >
        <PauseColumnsIcon />
        {row.status === "Paused" ? "Resume" : "Pause"}
      </button>
      <button
        type="button"
        onClick={() => onAction("resend", row)}
        className={`${base} text-blue-800 hover:text-blue-900`}
      >
        <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
        Resend
      </button>
      <button
        type="button"
        onClick={() => onAction("delete", row)}
        aria-label={`Delete ${row.name}`}
        className={`${base} text-red-300 hover:text-red-500`}
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Directory page (shared by Organizations + Individuals)                     */
/* -------------------------------------------------------------------------- */

function DirectoryPage({ view, rows, onAction }) {
  const config = VIEWS[view];
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const template = config.columns.map((c) => c.width).join(" ");
  const q = query.trim().toLowerCase();

  const visible = rows.filter((r) => {
    const matchesFilter =
      filter === "All" ? r.status !== "Deleted" : r.status === filter;
    const matchesQuery =
      !q ||
      [r.name, r.organization, r.email, r.phone]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q));
    return matchesFilter && matchesQuery;
  });

  const renderCell = (col, row) => {
    switch (col.key) {
      case "name":
        return (
          <div className="flex items-center gap-3">
            {config.avatar === "face" ? (
              <FaceAvatar />
            ) : (
              <div aria-hidden="true" className="h-8 w-8 flex-shrink-0 rounded-full bg-blue-800" />
            )}
            <span className="truncate text-sm text-slate-800">{row.name}</span>
          </div>
        );
      case "status":
        return (
          <span className={`text-sm ${STATUS_STYLES[row.status]}`}>{row.status}</span>
        );
      case "actions":
        return <RowActions row={row} onAction={onAction} />;
      default:
        return <span className="truncate text-sm text-slate-500">{row[col.key]}</span>;
    }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-label="Filters"
          className={`flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white transition-colors hover:bg-slate-800 ${focusRing}`}
        >
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <label className="relative min-w-0 flex-1 basis-64">
          <span className="sr-only">Search</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            strokeWidth={1.5}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ..."
            className={`h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 placeholder-slate-500 ${focusRing}`}
          />
        </label>

        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-4 py-2 text-sm transition-colors ${focusRing} ${
                  active
                    ? "bg-blue-800 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto">
        <div style={{ minWidth: 1040 }}>
          <div
            role="row"
            className="grid items-center gap-4 px-2 pb-3 text-sm text-slate-500"
            style={{ gridTemplateColumns: template }}
          >
            {config.columns.map((c) => (
              <div
                key={c.key}
                role="columnheader"
                className={c.align === "left" ? "text-left" : "text-center"}
              >
                {c.label}
              </div>
            ))}
          </div>

          <ul className="space-y-2">
            {visible.map((row) => (
              <li
                key={row.id}
                role="row"
                className="grid items-center gap-4 rounded-lg bg-neutral-50 px-2 py-2.5"
                style={{ gridTemplateColumns: template }}
              >
                {config.columns.map((c) => (
                  <div
                    key={c.key}
                    role="cell"
                    className={`min-w-0 ${
                      c.align === "left" ? "text-left" : "text-center"
                    }`}
                  >
                    {renderCell(c, row)}
                  </div>
                ))}
              </li>
            ))}
          </ul>

          {visible.length === 0 && (
            <p className="rounded-lg bg-neutral-50 py-10 text-center text-sm text-slate-500">
              No {config.title.toLowerCase()} match your search or filter.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  App                                                                        */
/* -------------------------------------------------------------------------- */

export default function WorkspaceAdmin() {
  const [view, setView] = useState("organizations");
  const [orgs, setOrgs] = useState(INITIAL_ORGS);
  const [people, setPeople] = useState(INITIAL_PEOPLE);
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const notify = (message) => {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2500);
  };

  const rows = view === "organizations" ? orgs : people;
  const setRows = view === "organizations" ? setOrgs : setPeople;

  const setStatus = (id, status) =>
    setRows((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));

  const handleAction = (type, row) => {
    switch (type) {
      case "reset":
        notify(`Password reset email sent to ${row.email}`);
        break;
      case "resend":
        notify(`Invitation resent to ${row.email}`);
        break;
      case "toggle":
        setStatus(row.id, row.status === "Paused" ? "Active" : "Paused");
        break;
      case "delete":
        setStatus(row.id, "Deleted");
        notify(`${row.name} moved to Deleted`);
        break;
      case "restore":
        setStatus(row.id, "Active");
        notify(`${row.name} restored`);
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased">
      <div className="mx-auto max-w-screen-xl px-4 py-4 sm:px-4">
       

        <button
          type="button"
          className={`mt-5 inline-flex items-center gap-2 rounded text-sm text-slate-700 hover:text-slate-900 ${focusRing}`}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          Workspaces
        </button>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b-2 border-slate-100 pb-4">
          <h1 className="text-3xl font-light tracking-tight text-slate-800">
            {VIEWS[view].title}
          </h1>
          <ViewSwitch value={view} onChange={setView} />
        </div>

        {/* key resets search + filter when switching views */}
        <DirectoryPage key={view} view={view} rows={rows} onAction={handleAction} />
      </div>

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4"
      >
        {toast && (
          <div className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}