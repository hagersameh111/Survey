import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import SwitchToggle from "../../../Shared/SwitchToggle";

const Field = ({ label, children }) => (
  <label className="block text-sm font-medium text-text">
    <span className="mb-2 block">{label}</span>
    {children}
  </label>
);

const inputClass = "w-full rounded-xl border border-border bg-white p-2.5 text-sm font-normal outline-none focus:border-primary";

const WelcomeSidebar = ({ page = {}, onUpdatePage, access = { type: "open", code: "" }, onAccessChange }) => {
  const [timeComplete, setTimeComplete] = useState(true);
  const [contactDetails, setContactDetails] = useState(true);
  const [multipleUse, setMultipleUse] = useState(false);
  const [time, setTime] = useState("00 : 10 : 00");
  const [buttonText, setButtonText] = useState("Start Now");
  const [email, setEmail] = useState("admin1234@mail.com");
  const [contactDescription, setContactDescription] = useState("If you wish to make a formal complaint regarding this research, you may contact the Academic Supervisor. Your communication may also be referred to an independent person, where appropriate.");
  const update = (key) => (event) => onUpdatePage?.({ [key]: event.target.value });

  return (
    <aside className="w-full flex-shrink-0 overflow-y-auto rounded-3xl bg-[#F8FAFD] p-4 shadow-sm scrollbar-hide sm:p-6 lg:w-[300px]">
      <div className="mb-6 border-b border-border pb-5">
        <h3 className="mb-3 text-sm font-semibold text-text">Answer</h3>
        <button type="button" className="flex w-full items-center justify-between rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-text">
          <span className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded bg-primary-light text-primary">◧</span>Welcome Screen</span>
          <ChevronDown size={16} className="text-text-muted" />
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <div className="mb-3 flex items-center justify-between"><span className="text-sm font-medium text-text">Time to complete</span><SwitchToggle checked={timeComplete} onChange={setTimeComplete} /></div>
          {timeComplete && <input aria-label="Time to complete" value={time} onChange={(event) => setTime(event.target.value)} className={inputClass} />}
        </div>

        <Field label="Description"><textarea rows={5} value={contactDescription} onChange={(event) => setContactDescription(event.target.value)} className={`${inputClass} resize-y leading-6`} /></Field>

        <div>
          <div className="mb-3 flex items-center justify-between"><span className="text-sm font-medium text-text">Access Code</span><SwitchToggle checked={access.type === "code"} onChange={(checked) => onAccessChange?.({ ...access, type: checked ? "code" : "open" })} /></div>
          {access.type === "code" && <>
            <textarea aria-label="Access code" rows={3} value={access.code || ""} onChange={(event) => onAccessChange?.({ ...access, code: event.target.value })} placeholder="Enter access code" className={`${inputClass} resize-y`} />
            <label className="mt-3 flex items-center gap-2 text-sm text-text-secondary"><input type="checkbox" checked={multipleUse} onChange={(event) => setMultipleUse(event.target.checked)} className="h-4 w-4 accent-primary" />Multiple use</label>
          </>}
        </div>

        <Field label="Welcome title"><textarea rows={2} value={page.title || ""} onChange={update("title")} placeholder="Welcome title" className={`${inputClass} resize-y`} /></Field>
        <Field label="Welcome message"><textarea rows={5} value={page.description || ""} onChange={update("description")} placeholder="Welcome message" className={`${inputClass} resize-y leading-6`} /></Field>
        <Field label="Button (CTA)"><input value={buttonText} onChange={(event) => setButtonText(event.target.value)} className={inputClass} /></Field>

        <div>
          <div className="mb-3 flex items-center justify-between"><span className="text-sm font-medium text-text">Contact Details</span><SwitchToggle checked={contactDetails} onChange={setContactDetails} /></div>
          {contactDetails && <div className="space-y-4"><Field label="Email"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} /></Field><Field label="Description"><textarea rows={5} value={contactDescription} onChange={(event) => setContactDescription(event.target.value)} className={`${inputClass} resize-y leading-6`} /></Field></div>}
        </div>

        <div className="border-t border-border pt-5"><div className="flex items-center justify-between"><span className="text-sm font-medium text-text">Image or video</span><button type="button" aria-label="Add image or video" className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-primary transition hover:border-primary"><Plus size={18} /></button></div></div>
      </div>
    </aside>
  );
};

export default WelcomeSidebar;
