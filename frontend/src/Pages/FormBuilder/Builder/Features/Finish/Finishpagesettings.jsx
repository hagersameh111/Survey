import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import SwitchToggle from "./SwitchToggle";
import { getForms } from "../../../api/forms";
import { DEFAULT_BUTTON_TEXT, getNextFormUrl } from "./nextForm";

const labelCls = "text-sm text-text-secondary";
const fieldCls =
  "h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-text outline-none focus:border-primary";

// Right-hand settings for the Finish page.
// value    = page.nextForm
// onChange = receives the new nextForm object
const FinishPageSettings = ({ value = {}, onChange, currentFormId }) => {
  const { enabled = false, formId = "", formName = "", buttonText = DEFAULT_BUTTON_TEXT } = value;
  const [forms, setForms] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | error | ready

  // Load the list of forms only when the option is switched on
  useEffect(() => {
    if (!enabled) return;
    const ctrl = new AbortController();
    setStatus("loading");
    getForms({}, ctrl.signal)
      .then((list) => {
        if (ctrl.signal.aborted) return;
        setForms(list.filter((f) => String(f.id) !== String(currentFormId)));
        setStatus("ready");
      })
      .catch(() => !ctrl.signal.aborted && setStatus("error"));
    return () => ctrl.abort();
  }, [enabled, currentFormId]);

  const update = (patch) => onChange({ ...value, ...patch });

  const pick = (id) => {
    const form = forms.find((f) => String(f.id) === id);
    update(
      form
        ? { formId: form.id, formName: form.title, url: getNextFormUrl(form) }
        : { formId: "", formName: "", url: "" }
    );
  };

  // keep the saved form selectable even if it isn't in the loaded list
  const hasSaved = formId && !forms.some((f) => String(f.id) === String(formId));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className={labelCls}>Link to another form</span>
        <SwitchToggle checked={enabled} onChange={(v) => update({ enabled: v })} />
      </div>

      {enabled && (
        <div className="space-y-3">
          <div>
            <label className={`mb-1 block ${labelCls}`}>Choose form</label>
            <div className="relative">
              <select
                value={String(formId)}
                onChange={(e) => pick(e.target.value)}
                disabled={status === "loading"}
                className={`${fieldCls} appearance-none pr-9`}
              >
                <option value="">
                  {status === "loading" ? "Loading forms..." : "Select a form"}
                </option>
                {hasSaved && <option value={String(formId)}>{formName || "Selected form"}</option>}
                {forms.map((f) => (
                  <option key={f.id} value={String(f.id)}>
                    {f.title}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
            </div>

            {status === "error" && (
              <p className="mt-1 text-xs text-red-600">Couldn't load your forms. Try again later.</p>
            )}
            {status === "ready" && forms.length === 0 && (
              <p className="mt-1 text-xs text-text-muted">No other forms yet.</p>
            )}
            {!formId && status !== "loading" && (
              <p className="mt-1 text-xs text-text-muted">
                Until you pick a form, the normal thank-you page is shown.
              </p>
            )}
          </div>

          <div>
            <label className={`mb-1 block ${labelCls}`}>Button text</label>
            <input
              type="text"
              value={buttonText}
              onChange={(e) => update({ buttonText: e.target.value })}
              className={fieldCls}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FinishPageSettings;