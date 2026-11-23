import SwitchToggle from "../../../Shared/SwitchToggle";

const Field = ({ label, children }) => (
  <label className="block text-sm font-medium text-text">
    <span className="mb-2 block">{label}</span>
    {children}
  </label>
);

const inputClass = "w-full rounded-xl border border-border bg-white p-2.5 text-sm font-normal outline-none focus:border-primary";

const WelcomeSidebar = ({ page = {}, onUpdatePage, access = { type: "open", code: "" }, onAccessChange }) => {
  const config = page.config || {};
  const setConfig = (patch) => onUpdatePage?.({ config: { ...config, ...patch } });
  const update = (key) => (event) => onUpdatePage?.({ [key]: event.target.value });

  return (
    <aside className="w-full flex-shrink-0 overflow-y-auto rounded-3xl bg-[#F8FAFD] p-4 shadow-sm scrollbar-hide sm:p-6 lg:w-[300px]">
      <div className="mb-6 border-b border-border pb-5">
        <h3 className="mb-3 text-sm font-semibold text-text">Answer</h3>
        <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-text"><span className="flex h-5 w-5 items-center justify-center rounded bg-primary-light text-primary">◧</span>Welcome Screen</div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="mb-3 flex items-center justify-between"><span className="text-sm font-medium text-text">Time to complete</span><SwitchToggle checked={config.timeEnabled !== false} onChange={(timeEnabled) => setConfig({ timeEnabled })} /></div>
          {config.timeEnabled !== false && <input aria-label="Time to complete" value={config.time || ""} onChange={(event) => setConfig({ time: event.target.value })} placeholder="00 : 10 : 00" className={inputClass} />}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between"><span className="text-sm font-medium text-text">Access Code</span><SwitchToggle checked={access.type === "code"} onChange={(checked) => onAccessChange?.({ ...access, type: checked ? "code" : "open" })} /></div>
          {access.type === "code" && <>
            <textarea aria-label="Access code" rows={3} value={access.code || ""} onChange={(event) => onAccessChange?.({ ...access, code: event.target.value })} placeholder="Enter access code" className={`${inputClass} resize-y`} />
            <label className="mt-3 flex items-center gap-2 text-sm text-text-secondary"><input type="checkbox" checked={Boolean(access.multipleUse)} onChange={(event) => onAccessChange?.({ ...access, multipleUse: event.target.checked })} className="h-4 w-4 accent-primary" />Multiple use</label>
          </>}
        </div>

        <Field label="Welcome title"><textarea rows={2} value={page.title || ""} onChange={update("title")} placeholder="Welcome title" className={`${inputClass} resize-y`} /></Field>
        <Field label="Welcome message"><textarea rows={5} value={page.description || ""} onChange={update("description")} placeholder="Welcome message" className={`${inputClass} resize-y leading-6`} /></Field>
        <Field label="Button (CTA)"><input value={page.buttonText || "Start Now"} onChange={update("buttonText")} className={inputClass} /></Field>

        <div>
          <div className="mb-3 flex items-center justify-between"><span className="text-sm font-medium text-text">Contact Details</span><SwitchToggle checked={config.contactEnabled !== false} onChange={(contactEnabled) => setConfig({ contactEnabled })} /></div>
          {config.contactEnabled !== false && <div className="space-y-4"><Field label="Email"><input type="email" value={config.contactEmail || ""} onChange={(event) => setConfig({ contactEmail: event.target.value })} placeholder="contact@example.com" className={inputClass} /></Field><Field label="Message"><textarea rows={5} value={config.contactDescription || ""} onChange={(event) => setConfig({ contactDescription: event.target.value })} placeholder="Contact information for participants" className={`${inputClass} resize-y leading-6`} /></Field></div>}
        </div>

      </div>
    </aside>
  );
};

export default WelcomeSidebar;
