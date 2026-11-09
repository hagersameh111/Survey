import { useState } from "react";
import { ChevronDown, GripVertical, Plus } from "lucide-react";

const fieldLabels = [
  ["name", "Full Name"], ["dob", "Date of Birth"], ["age", "Age"], ["email", "Email Address"],
  ["phone", "Phone Number"], ["nationality", "Nationality"], ["country", "Country"], ["city", "City"],
  ["gender", "Gender"], ["customised", "Customised"],
];
const controlClass = "w-full rounded-xl border border-border bg-white p-2.5 text-sm font-normal text-text outline-none focus:border-primary";

const BioAnswerSidebar = ({ fields = {}, onChange = () => {}, page = {}, onUpdatePage = () => {} }) => {
  const [required, setRequired] = useState(true);
  return (
    <aside className="w-full flex-shrink-0 overflow-y-auto rounded-3xl bg-[#F8FAFD] p-4 shadow-sm scrollbar-hide sm:p-6 lg:w-[300px]">
      <div className="mb-5 border-b border-border pb-5">
        <h3 className="mb-3 text-sm font-semibold text-text">Answer</h3>
        <button type="button" className="flex w-full items-center justify-between rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-text"><span className="flex items-center gap-2"><span className="rounded bg-primary-light px-1 text-primary">▣</span>Participant Bio</span><ChevronDown size={16} className="text-text-muted" /></button>
      </div>

      <div className="mb-5 flex items-center justify-between text-sm font-medium text-text"><span>Required</span><button type="button" role="switch" aria-checked={required} onClick={() => { const next = !required; setRequired(next); Object.entries(fields).forEach(([key, value]) => { if (value?.enabled) onChange(key, { required: next }); }); }} className={`relative h-6 w-11 rounded-full ${required ? "bg-primary" : "bg-border"}`}><span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${required ? "translate-x-5" : ""}`} /></button></div>

      <label className="mb-5 block text-sm font-medium text-text">Page title<input value={page.title || ""} onChange={(event) => onUpdatePage({ title: event.target.value })} className={`${controlClass} mt-2`} /></label>
      <label className="mb-6 block text-sm font-medium text-text">Description<textarea rows={3} value={page.description || ""} onChange={(event) => onUpdatePage({ description: event.target.value })} className={`${controlClass} mt-2 resize-y leading-6`} /></label>

      <h4 className="mb-3 text-sm font-semibold text-text">Required Fields</h4>
      <div className="mb-6">
        {fieldLabels.map(([key, label]) => (
          <div key={key} className="border-b border-border py-3">
            <label className="flex cursor-pointer items-center justify-between gap-2 text-sm text-text"><span className="flex items-center gap-2"><GripVertical size={16} className="text-text-muted" />{label}</span><input type="checkbox" checked={Boolean(fields[key]?.enabled)} onChange={(event) => onChange(key, { enabled: event.target.checked, required: event.target.checked && required })} className="h-5 w-5 rounded accent-primary" /></label>
          </div>
        ))}
      </div>

      <label className="mb-5 block text-sm font-medium text-text">Title<input value={fields.customised?.question || "Description"} onChange={(event) => onChange("customised", { question: event.target.value })} className={`${controlClass} mt-2`} /></label>
      <label className="mb-5 block text-sm font-medium text-text">Button (CTA)<input value={page.bioButton || "Confirm"} onChange={(event) => onUpdatePage({ bioButton: event.target.value })} className={`${controlClass} mt-2`} /></label>
      <div className="flex items-center justify-between border-t border-border pt-5 text-sm font-medium text-text"><span>Image or video</span><button type="button" aria-label="Add image or video" className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-primary"><Plus size={18} /></button></div>
    </aside>
  );
};

export default BioAnswerSidebar;
