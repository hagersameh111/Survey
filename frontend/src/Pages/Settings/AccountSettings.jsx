import { useState } from "react";
import {
  ChevronLeft,
  ChevronDown,
  ChevronsUpDown,
  UserPlus,
  Search,
  Globe,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom"; 

/* -------------------------------------------------------------------------- */
/*  Data                                                                       */
/* -------------------------------------------------------------------------- */

const NAV_ITEMS = [
  { id: "account", label: "Account settings" },
  { id: "members", label: "Members" },
  { id: "billing", label: "Plan & billing" },
];

const MEMBERS = [
  { id: 1, name: "Username88", email: "username88@mail.com", role: "Owner" },
];

const PLAN_FEATURES = [
  "Up to 5 active surveys.",
  "100 survey responses per month.",
  "Create up to 100 short links.",
  "Basic link analytics.",
  "QR code generation.",
  "Email support.",
];

const RESET_DATE = "Jul 6, 2026, 13:48 GMT+3";

/* -------------------------------------------------------------------------- */
/*  Primitives                                                                 */
/* -------------------------------------------------------------------------- */

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

function PrimaryButton({ children, icon: Icon, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-900 ${focusRing}`}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" strokeWidth={1.75} />}
      {children}
    </button>
  );
}

function SoftButton({ children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center rounded-lg border border-blue-100 bg-blue-50 px-3.5 py-2 text-sm text-slate-600 transition-colors hover:bg-blue-100 ${focusRing}`}
      {...props}
    >
      {children}
    </button>
  );
}

function OutlineButton({ children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 ${focusRing}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-6 ${className}`}
    >
      {children}
    </section>
  );
}

function PageHeader({ title, description }) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-light tracking-tight text-slate-800">
        {title}
      </h1>
      <p className="mt-1 text-base text-slate-600">{description}</p>
    </header>
  );
}

function Avatar({ size = "md" }) {
  const dims = size === "lg" ? "h-10 w-10" : "h-8 w-8";
  return (
    <div
      aria-hidden="true"
      className={`${dims} flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-500`}
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

/* -------------------------------------------------------------------------- */
/*  Shared: Free plan card (used on Account settings + Plan & billing)         */
/* -------------------------------------------------------------------------- */

function FreePlanCard({ showViewPlans = false }) {
  const used = 0;
  const limit = 10;
  const pct = Math.min(100, (used / limit) * 100);

  return (
    <Card>
    <div className="flex items-start justify-between gap-4">
  <div>
    <h2 className="text-base font-semibold text-slate-800">Free</h2>
    <p className="text-sm text-slate-600">
      Discover the free plan features.{" "}
      <Link
        to="/pricing"
        className={`rounded font-medium text-slate-900 underline underline-offset-2 ${focusRing}`}
      >
        View plan features
      </Link>
      .
    </p>
  </div>
  {showViewPlans && (
    <Link to="/pricing">
      <SoftButton>View Plans</SoftButton>
    </Link>
  )}
</div>
      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-800">Responses</span>
          <span className="text-slate-800">
            <span className="font-semibold">{used}</span>
            <span className="text-xs text-slate-500"> / {limit} per month</span>
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={used}
          aria-label="Responses used this month"
          className="mt-3 h-3 w-full overflow-hidden rounded bg-slate-100"
        >
          <div
            className="h-full rounded bg-blue-800"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Your responses reset on {RESET_DATE}
        </p>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <PrimaryButton>Upgrade</PrimaryButton>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pages                                                                      */
/* -------------------------------------------------------------------------- */

function AccountSettingsPage() {
  return (
    <>
      <PageHeader
        title="Account settings"
        description="Change your organization name and URL, set up custom email settings."
      />

      <div className="space-y-4">
        <Card>
          <div className="flex items-center gap-3">
            <Avatar />
            <span className="text-lg text-slate-800">Username88</span>
          </div>
          <div className="mt-4">
            <SoftButton>Change name</SoftButton>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-slate-800">Language</h2>
          <p className="text-sm text-slate-600">Change the website language.</p>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between rounded-lg bg-slate-100 px-4 py-3.5">
              <div className="flex items-center gap-2 text-sm text-slate-800">
                <Globe className="h-4 w-4 text-slate-500" strokeWidth={1.5} />
                <span>English</span>
                <span className="rounded-md border border-blue-300 bg-blue-50 px-2 py-0.5 text-xs text-blue-800">
                  Default
                </span>
              </div>
              <button
                type="button"
                className={`rounded px-2 py-1 text-sm text-slate-600 hover:text-slate-900 ${focusRing}`}
              >
                Change
              </button>
            </div>
          </div>
        </Card>

        <FreePlanCard />
      </div>
    </>
  );
}

function MembersPage() {
  const [query, setQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const seatsUsed = MEMBERS.length;
  const seatsTotal = 1;

  const q = query.trim().toLowerCase();
  const visible = MEMBERS.filter(
    (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
  ).sort((a, b) =>
    sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
  );

  return (
    <>
      <PageHeader
        title="Members"
        description="Invite people and assign organization roles."
      />

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <PrimaryButton icon={UserPlus}>Invite members</PrimaryButton>

        <div className="w-full sm:w-64">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-slate-600">Editor seats</span>
            <span>
              <span className="font-semibold text-slate-900">{seatsUsed}</span>
              <span className="text-xs text-slate-500"> /{seatsTotal}</span>
            </span>
          </div>
          <div className="mt-2 h-1 w-full rounded-full bg-slate-100">
            <div
              className="h-1 rounded-full bg-blue-800"
              style={{ width: `${Math.min(100, (seatsUsed / seatsTotal) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg text-slate-800">
            Organization members ({MEMBERS.length})
          </h2>

          <label className="relative block w-full sm:w-96">
            <span className="sr-only">Search by name or email</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              strokeWidth={1.75}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email"
              className={`w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder-slate-500 ${focusRing}`}
            />
          </label>
        </div>

        <div className="mt-6 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setSortAsc((v) => !v)}
            className={`inline-flex items-center gap-1 rounded text-sm text-slate-900 ${focusRing}`}
            aria-label={`Sort by name, ${sortAsc ? "ascending" : "descending"}`}
          >
            Name
            <ChevronsUpDown className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>

        <ul>
          {visible.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-4 py-5">
              <div className="flex items-center gap-3">
                <Avatar size="lg" />
                <div>
                  <p className="text-sm text-slate-800">{m.name}</p>
                  <p className="text-sm text-slate-600">{m.email}</p>
                </div>
              </div>

              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center gap-6 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400"
                aria-label={`Role: ${m.role} (cannot be changed)`}
              >
                {m.role}
                <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </li>
          ))}

          {visible.length === 0 && (
            <li className="py-8 text-center text-sm text-slate-500">
              No members match “{query}”. Try a different name or email.
            </li>
          )}
        </ul>
      </Card>
    </>
  );
}

function PlanBillingPage() {
  return (
    <>
      <PageHeader
        title="Plan & billing"
        description="Change or cancel your plan, update your billing info, and download your invoices."
      />

      <div className="space-y-4">
        <FreePlanCard showViewPlans />

        <Card>
          <h2 className="text-lg text-slate-800">Billing details</h2>
          <p className="mt-4 text-sm text-slate-600">
            You haven't added any billing information yet
          </p>
          <div className="mt-4">
            <OutlineButton>Edit billing details</OutlineButton>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg text-slate-800">Payment method</h2>
          <p className="text-sm text-slate-600">
            Manage your primary and backup payment methods.
          </p>
          <p className="mt-4 text-sm text-slate-600">
            You haven't added any billing information yet
          </p>
          <div className="mt-4">
            <PrimaryButton>Add payment method</PrimaryButton>
          </div>
        </Card>

        <Card>
          <div id="plan-features" />
          <h2 className="text-lg text-slate-800">Your Free plan includes</h2>
          <ul className="mt-4 space-y-4">
            {PLAN_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-slate-900">
                <Check className="h-4 w-4 flex-shrink-0 text-blue-700" strokeWidth={1.75} />
                {feature}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shell                                                                      */
/* -------------------------------------------------------------------------- */

function Sidebar({ active, onChange }) {
  return (
    <nav
      aria-label="Organization"
      className="w-full flex-shrink-0 rounded-2xl bg-blue-50 p-4 md:w-60 md:self-start md:min-h-[40rem]"
    >
      <h2 className="px-3 pb-4 pt-3 text-lg text-slate-600">Organization</h2>
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === active;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onChange(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${focusRing} ${
                  isActive
                    ? "bg-blue-100 text-slate-900"
                    : "text-slate-600 hover:bg-blue-100"
                }`}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function OrganizationSettings() {
  const [page, setPage] = useState("account");

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <a
          href="#workspaces"
          className={`mb-4 inline-flex items-center gap-2 rounded text-sm text-slate-700 hover:text-slate-900 ${focusRing}`}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          Workspaces
        </a>

        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          <Sidebar active={page} onChange={setPage} />

          <main className="min-w-0 flex-1 pb-12 md:pt-2">
            {page === "account" && <AccountSettingsPage />}
            {page === "members" && <MembersPage />}
            {page === "billing" && <PlanBillingPage />}
          </main>
        </div>
      </div>
    </div>
  );
}