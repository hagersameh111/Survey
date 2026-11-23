import { GripVertical } from "lucide-react";

const fieldLabels = [
  ["name", "Full Name"], ["dob", "Date of Birth"], ["age", "Age"], ["email", "Email Address"],
  ["phone", "Phone Number"], ["nationality", "Nationality"], ["country", "Country"], ["city", "City"],
  ["gender", "Gender"], ["customised", "Customised"],
];
const controlClass = "w-full rounded-xl border border-border bg-white p-2.5 text-sm font-normal text-text outline-none focus:border-primary";

const BioAnswerSidebar = ({ fields = {}, onChange = () => {}, page = {}, onUpdatePage = () => {} }) => {
  return (
    <aside className="w-full flex-shrink-0 overflow-y-auto rounded-3xl bg-[#F8FAFD] p-4 shadow-sm scrollbar-hide sm:p-6 lg:w-[300px]">
      <div className="mb-5 border-b border-border pb-5">
        <h3 className="mb-3 text-sm font-semibold text-text">Answer</h3>
        <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-text"><span className="rounded bg-primary-light px-1 text-primary">▣</span>Participant Bio</div>
      </div>

      <label className="mb-5 block text-sm font-medium text-text">Participant Bio heading<span className="mt-1 block text-xs font-normal text-text-muted">This heading appears at the top of the participant information page.</span><input value={page.title || ""} placeholder="For example, Tell us about yourself" onChange={(event) => onUpdatePage({ title: event.target.value })} className={`${controlClass} mt-2`} /></label>
      <label className="mb-6 block text-sm font-medium text-text">Description<textarea rows={3} value={page.description || ""} onChange={(event) => onUpdatePage({ description: event.target.value })} className={`${controlClass} mt-2 resize-y leading-6`} /></label>

      <h4 className="mb-3 text-sm font-semibold text-text">Required Fields</h4>
      <div className="mb-6">
        {fieldLabels.map(([key, label]) => (
          <div key={key} className="border-b border-border py-3">
            <div className="flex items-center justify-between gap-2 text-sm text-text"><label className="flex cursor-pointer items-center gap-2"><GripVertical size={16} className="text-text-muted" />{label}<input type="checkbox" aria-label={`Enable ${label}`} checked={Boolean(fields[key]?.enabled)} onChange={(event) => onChange(key, { enabled: event.target.checked })} className="h-4 w-4 rounded accent-primary" /></label><label className="flex items-center gap-1 text-xs text-text-muted"><input type="checkbox" aria-label={`${label} required`} checked={Boolean(fields[key]?.required)} disabled={!fields[key]?.enabled} onChange={(event) => onChange(key, { required: event.target.checked })} className="h-4 w-4 rounded accent-primary disabled:opacity-50" />Required</label></div>
          </div>
        ))}
      </div>

      <label className="mb-5 block text-sm font-medium text-text">Custom field title<span className="mt-1 block text-xs font-normal text-text-muted">This label appears above the custom participant field.</span><input value={fields.customised?.question || ""} placeholder="For example, Organization" onChange={(event) => onChange("customised", { question: event.target.value })} className={`${controlClass} mt-2`} /></label>
      <label className="mb-5 block text-sm font-medium text-text">Button (CTA)<input value={page.buttonText || "Confirm"} onChange={(event) => onUpdatePage({ buttonText: event.target.value })} className={`${controlClass} mt-2`} /></label>
    </aside>
  );
};

export default BioAnswerSidebar;
