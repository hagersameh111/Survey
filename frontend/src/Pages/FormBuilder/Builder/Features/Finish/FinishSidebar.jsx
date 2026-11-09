import { Star, Plus } from "lucide-react";
import SwitchToggle from "../../Shared/SwitchToggle";
import FinishPageSettings from "./Finishpagesettings";

const inputClass = "w-full rounded-xl border border-border bg-white p-2.5 text-sm text-text outline-none focus:border-primary";

const FinishSidebar = ({ page = {}, onUpdatePage, currentFormId }) => {
  const update = (key) => (event) => onUpdatePage({ [key]: event.target.value });
  const nextForm = page.nextForm || {};
  return (
    <aside className="w-full flex-shrink-0 overflow-y-auto rounded-3xl bg-[#F8FAFD] p-4 shadow-sm scrollbar-hide sm:p-6 lg:w-[300px]">
      <div className="mb-5 border-b border-border pb-5">
        <h3 className="mb-3 text-sm font-semibold text-text">Answer</h3>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-text"><span className="rounded bg-primary-light p-1 text-primary"><Star size={16} /></span>Rating Screen</div>
      </div>
      <div className="space-y-5">
        <div className="flex items-center justify-between text-sm font-medium text-text"><span>Required</span><SwitchToggle checked={page.ratingRequired !== false} onChange={(required) => onUpdatePage({ ratingRequired: required })} /></div>
        <label className="block text-sm text-text-secondary">Rating title<textarea rows={2} value={page.title || ""} onChange={update("title")} className={`${inputClass} mt-2 resize-y`} /></label>
        <label className="block text-sm text-text-secondary">Description<textarea rows={5} value={page.description || ""} onChange={update("description")} className={`${inputClass} mt-2 resize-y leading-6`} /></label>
        <label className="block text-sm text-text-secondary">Button (CTA)<input value={page.buttonText || "Submit"} onChange={update("buttonText")} className={`${inputClass} mt-2`} /></label>
        <div className="border-t border-border pt-5"><FinishPageSettings value={nextForm} onChange={(value) => onUpdatePage({ nextForm: value })} currentFormId={currentFormId} />
          {nextForm.enabled && <div className="mt-4"><label className="mb-1 block text-sm text-text-secondary">URL Link</label><input type="url" value={nextForm.url || ""} onChange={(event) => onUpdatePage({ nextForm: { ...nextForm, url: event.target.value, formId: "", formName: "" } })} placeholder="https://example.com" className={inputClass} /></div>}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-5 text-sm font-medium text-text"><span>Image or video</span><button type="button" aria-label="Add image or video" className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-primary"><Plus size={18} /></button></div>
      </div>
    </aside>
  );
};

export default FinishSidebar;
