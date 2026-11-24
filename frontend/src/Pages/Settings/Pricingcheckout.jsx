import { useState } from "react";
import { ChevronLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createWorkspace } from "../../api/workspaces";
/* -------------------------------------------------------------------------- */
/*  Data                                                                       */
/* -------------------------------------------------------------------------- */

const PRO_MONTHLY = 12;
const ULTRA_MONTHLY = 29;
const YEARLY_DISCOUNT = 0.3;


const PLANS = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for individuals or small teams just getting started.",
    features: [
      "Up to 2 active surveys.",
      "7-character survey links.",
      "No invited team members.",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    badge: "Most Popular",
    price: PRO_MONTHLY,
    description: "Great for growing teams with more advanced needs.",
    features: [
      "Up to 10 active surveys.",
      "5-character survey links.",
      "Up to 5 invited team members.",
      "Shared team surveys.",
    ],
  },
  {
    id: "ultra",
    name: "Ultra",
    price: ULTRA_MONTHLY,
    description: "For larger teams that need no limits on active surveys.",
    features: [
      "Unlimited active surveys.",
      "4-character survey links.",
      "Up to 20 invited team members.",
      "Shared team surveys.",
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const money = (n) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

function getPricing(plan, billing) {
  const basePrice = plan.price || 0;
  if (billing === "yearly") {
    const perMonth = +(basePrice * (1 - YEARLY_DISCOUNT)).toFixed(2);
    const perYear = +(perMonth * 12).toFixed(2);
    return { perMonth, total: perYear, unit: "year" };
  }
  return { perMonth: basePrice, total: basePrice, unit: "month" };
}

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

/* -------------------------------------------------------------------------- */
/*  Left side: plans                                                           */
/* -------------------------------------------------------------------------- */

function BillingToggle({ value, onChange }) {
  const options = [
    { id: "monthly", label: "Monthly" },
    { id: "yearly", label: "Yearly (Save 30%)" },
  ];
  return (
    <div
      role="group"
      aria-label="Billing period"
      className="inline-flex rounded-xl border border-slate-200 bg-white p-1"
    >
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.id)}
            className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${focusRing} ${
              active
                ? "bg-blue-100 text-slate-900"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function PlanCard({ plan, billing, checkoutPlanId, onUpgrade }) {
  const isPaid = plan.id !== "free";
  const { perMonth, total } = getPricing(plan, billing);
  const price = isPaid ? perMonth : 0;
  const disabled = Boolean(checkoutPlanId);

  return (
    <article
      className={`flex w-full flex-col rounded-xl bg-white p-6 ${
        plan.badge ? "border border-blue-800" : "border border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{plan.name}</h2>
        {plan.badge && (
          <span className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
            {plan.badge}
          </span>
        )}
      </div>

      <p className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-blue-600">{money(price)}</span>
        <span className="text-xl text-slate-500">/month</span>
      </p>
      {isPaid && billing === "yearly" && (
        <p className="mt-1 text-xs text-slate-500">Billed {money(total)} yearly</p>
      )}

      <p className="mt-3 text-base leading-snug text-slate-600">
        {plan.description}
      </p>

      <ul className="mt-5 flex-1 space-y-3.5 border-t border-slate-100 pt-6">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-3 text-sm text-slate-900">
            <Check className="h-4 w-4 flex-shrink-0 text-blue-700" strokeWidth={1.5} />
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        {isPaid ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onUpgrade(plan.id)}
            className={`w-full rounded-lg py-3 text-sm font-semibold text-white transition-colors ${focusRing} ${
              disabled
                ? "cursor-not-allowed bg-blue-200"
                : "bg-blue-800 hover:bg-blue-900"
            }`}
          >
            Create {plan.name} workspace
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-300"
          >
            Current Plan
          </button>
        )}
      </div>
    </article>
  );
}

function PlansSection({ billing, setBilling, checkoutPlanId, onUpgrade, onBack }) {
  return (
    <div className="flex-1 px-4 py-6 sm:px-6">
   <button
  type="button"
  onClick={onBack}
  className={`inline-flex items-center gap-2 rounded text-sm text-slate-700 hover:text-slate-900 ${focusRing}`}
>
  <ChevronLeft className="h-4 w-4" strokeWidth={2} />
  Back
</button>


      <div className="mx-auto mt-10 max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">
          Choose the plan that works for you
        </h1>
        <div className="mt-8">
          <BillingToggle value={billing} onChange={setBilling} />
        </div>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-6 pb-10 text-left md:grid-cols-2">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billing={billing}
            checkoutPlanId={checkoutPlanId}
            onUpgrade={onUpgrade}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Right side: workspace creation (no payment provider is connected yet)      */
/* -------------------------------------------------------------------------- */

function ActivationPanel({ plan, billing, onCreated, onCancel }) {
  const { total, unit } = getPricing(plan, billing);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);

  const handleCreate = async (event) => {
    event.preventDefault();
    setCreating(true);
    setError("");
    try {
      const workspace = await createWorkspace({ name: name.trim(), plan: plan.id });
      setCreated(workspace);
      onCreated?.(workspace);
    } catch (createError) {
      setError(createError.response?.data?.message || "Could not create the workspace.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <aside className="w-full border-t border-slate-200 bg-neutral-50 px-6 py-10 lg:w-96 lg:flex-shrink-0 lg:border-l lg:border-t-0 lg:px-9 lg:pt-24">
      <h2 className="text-lg font-semibold text-slate-900">{plan.name} workspace</h2>

      {created ? (
        <>
          <p className="mt-4 text-sm text-slate-600">
            Your workspace has been created and is <span className="font-semibold">pending activation</span>. No payment
            provider is connected yet — an operator must activate its subscription out-of-band before you can invite
            members or publish Shared surveys. No payment has been charged.
          </p>
          <button
            type="button"
            onClick={onCancel}
            className={`mt-6 w-full rounded-lg bg-blue-800 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-900 ${focusRing}`}
          >
            Done
          </button>
        </>
      ) : (
        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <Field label="Workspace name (optional)" htmlFor="workspace-name">
            <input
              id="workspace-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Acme Research"
              className={inputClass}
            />
          </Field>

          <dl className="rounded-lg border-2 border-dashed border-blue-700 bg-blue-50 p-5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">Plan price:</dt>
              <dd className="text-slate-600">{money(total)}/{unit}</dd>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
              <dt className="font-semibold text-blue-800">Total today:</dt>
              <dd className="text-2xl font-bold text-blue-800">$0</dd>
            </div>
          </dl>
          <p className="text-xs text-slate-500">
            No billing provider is connected yet, so nothing is charged. Creating the workspace reserves its plan limits;
            an operator activates its subscription separately.
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={creating}
            className={`w-full rounded-lg bg-blue-800 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-900 disabled:opacity-50 ${focusRing}`}
          >
            {creating ? "Creating…" : "Create workspace"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={`w-full rounded-lg border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 ${focusRing}`}
          >
            Cancel
          </button>
        </form>
      )}
    </aside>
  );
}

const inputClass = `w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 placeholder-slate-400 ${focusRing}`;

function Field({ label, htmlFor, children, className = "" }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-2 block text-sm text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function PaymentPanel({ billing }) {
  const { total, unit } = getPricing(billing);
  const [method, setMethod] = useState("card");
  const [card, setCard] = useState({
    number: "xxxx xxxx xxxx 5678",
    name: "AHMED ALI SABER IBRAHIM",
    exp: "08/29",
    cvv: "123",
    save: false,
  });
  const [checkoutMessage, setCheckoutMessage] = useState("");

  const update = (patch) => setCard((c) => ({ ...c, ...patch }));
  const clearCard = () =>
    setCard({ number: "", name: "", exp: "", cvv: "", save: false });

  return (
    <aside className="w-full border-t border-slate-200 bg-neutral-50 px-6 py-10 lg:w-96 lg:flex-shrink-0 lg:border-l lg:border-t-0 lg:px-9 lg:pt-24">
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <h2 className="text-lg font-semibold text-slate-900">Payment Methods</h2>
        <button
          type="button"
          disabled
          className="cursor-not-allowed text-sm text-slate-400"
        >
          Edit
        </button>
      </div>

      {/* Card */}
      <div className="mt-6">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-900">
          <input
            type="radio"
            name="payment-method"
            checked={method === "card"}
            onChange={() => setMethod("card")}
            className="h-4 w-4 accent-blue-800"
          />
          Visa/Master Card
        </label>

        {method === "card" && (
          <div className="mt-5 space-y-4 pl-7">
            <Field label="Card Number" htmlFor="card-number">
              <div className="relative">
                <input
                  id="card-number"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={card.number}
                  onChange={(e) => update({ number: formatCardNumber(e.target.value) })}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className={`${inputClass} pr-14`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <MastercardIcon />
                </span>
              </div>
            </Field>

            <Field label="Card Name Holder" htmlFor="card-name">
              <input
                id="card-name"
                autoComplete="cc-name"
                value={card.name}
                onChange={(e) => update({ name: e.target.value.toUpperCase() })}
                placeholder="NAME ON CARD"
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Exp. Date" htmlFor="card-exp">
                <input
                  id="card-exp"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  value={card.exp}
                  onChange={(e) => update({ exp: formatExpiry(e.target.value) })}
                  placeholder="MM/YY"
                  className={inputClass}
                />
              </Field>
              <Field label="CVV" htmlFor="card-cvv">
                <div className="relative">
                  <input
                    id="card-cvv"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={card.cvv}
                    onChange={(e) =>
                      update({ cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })
                    }
                    placeholder="123"
                    className={`${inputClass} pr-12`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <CvvIcon />
                  </span>
                </div>
              </Field>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-500">
              <input
                type="checkbox"
                checked={card.save}
                onChange={(e) => update({ save: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 accent-blue-800"
              />
              Save card info.
            </label>

            <div className="flex items-center justify-between pt-1 text-sm">
              <button
                type="button"
                onClick={clearCard}
                className={`inline-flex items-center gap-2 rounded text-blue-800 hover:text-blue-900 ${focusRing}`}
              >
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                Add New Card
              </button>
              <button
                type="button"
                onClick={clearCard}
                className={`inline-flex items-center gap-2 rounded text-red-600 hover:text-red-700 ${focusRing}`}
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                Delete Card
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PayPal */}
      <div className="mt-6">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-900">
          <input
            type="radio"
            name="payment-method"
            checked={method === "paypal"}
            onChange={() => setMethod("paypal")}
            className="h-4 w-4 accent-blue-800"
          />
          PayPal
        </label>
      </div>

      {/* Summary */}
      <dl className="mt-6 rounded-lg border-2 border-dashed border-blue-700 bg-blue-50 p-5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-slate-600">Plan price:</dt>
          <dd className="text-slate-600">
            {money(total)}/{unit}
          </dd>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <dt className="text-slate-600">VAT:</dt>
          <dd className="text-slate-600">$0</dd>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
          <dt className="font-semibold text-blue-800">Total price:</dt>
          <dd className="text-2xl font-bold text-blue-800">{money(total)}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => setCheckoutMessage("Payment processing is not connected yet. No payment was made.")}
        className={`mt-6 w-full rounded-lg bg-blue-800 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-900 ${focusRing}`}
      >
        Checkout
      </button>
      {checkoutMessage && <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{checkoutMessage}</p>}
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function PricingCheckout() {
  const [billing, setBilling] = useState("monthly");
  const [checkoutPlanId, setCheckoutPlanId] = useState(null);
  const navigate = useNavigate();
  const checkoutPlan = PLANS.find((plan) => plan.id === checkoutPlanId);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased lg:flex">
      <PlansSection
        billing={billing}
        setBilling={setBilling}
        checkoutPlanId={checkoutPlanId}
        onUpgrade={(planId) => setCheckoutPlanId(planId)}
        onBack={() => (checkoutPlanId ? setCheckoutPlanId(null) : navigate(-1))}
        checkout={checkout}
        onUpgrade={() => setCheckout(true)}
        onBack={() => checkout ? setCheckout(false) : navigate("/account-settings")}
      />
      {checkoutPlan && (
        <ActivationPanel
          plan={checkoutPlan}
          billing={billing}
          onCancel={() => setCheckoutPlanId(null)}
        />
      )}
    </div>
  );
}
