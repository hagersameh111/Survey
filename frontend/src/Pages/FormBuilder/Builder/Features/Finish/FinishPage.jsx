import { Star } from "lucide-react";
import Breadcrumb from "../../Shared/Breadcrumb";
import FormHeader from "../../Shared/FormHeader";

const FinishPage = ({ page = {}, onUpdatePage }) => (
  <main className="flex-1 rounded-2xl border border-border bg-surface p-8 shadow-sm">
    <Breadcrumb />
    <FormHeader title={page.title} description={page.description} onChange={onUpdatePage} />
    <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl bg-[#F7F8FC] px-6 py-16 text-center">
      <h1 className="mb-5 max-w-3xl text-2xl font-bold text-primary">{page.title || "Thank you for taking time to complete the survey."}</h1>
      <p className="mb-8 max-w-3xl text-lg leading-relaxed text-text">{page.description || "Your honest input helps us making better decisions in the future. Please rate our service, every bit of feedback is appreciated."}</p>
      <div className="mb-10 flex items-center gap-3" aria-label="Five star rating preview">
        {Array.from({ length: 5 }, (_, index) => <Star key={index} size={48} strokeWidth={1.5} className="text-primary/40" />)}
      </div>
      <button type="button" className="min-w-64 rounded-xl bg-primary px-14 py-4 font-medium text-white shadow-sm">{page.buttonText || "Submit"}</button>
    </div>
  </main>
);

export default FinishPage;
