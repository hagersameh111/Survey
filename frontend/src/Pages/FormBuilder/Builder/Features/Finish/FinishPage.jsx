import { CheckCircle2 } from "lucide-react";
import Breadcrumb from "../../Shared/Breadcrumb";
import FormHeader from "../../Shared/FormHeader";
import NextFormButton from "./NextFormButton";
import { isLinked } from "./nextForm";

const FinishPage = ({ page = {}, onUpdatePage }) => {
  const linked = isLinked(page.nextForm);

  return (
    <main className="flex-1 rounded-2xl bg-surface p-12 shadow-sm border border-border">
      <Breadcrumb />
      <FormHeader title={page.title} description={page.description} onChange={onUpdatePage} />

      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-20 text-center min-h-[500px]">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-light text-primary">
          <CheckCircle2 size={40} />
        </div>

        <h1 className="mb-4 text-3xl font-bold text-text">
          {page.title || "Thank you for your feedback!"}
        </h1>

        <p className="mb-8 text-lg text-text-secondary">
          {page.description ||
            (linked
              ? "Thanks for completing this form. One more step is waiting for you."
              : "Your response has been successfully recorded. You may now close this window or submit another response.")}
        </p>

        {linked ? (
          <>
            <NextFormButton nextForm={page.nextForm} preview />
            {page.nextForm.formName && (
              <p className="mt-3 text-sm text-text-muted">Next: {page.nextForm.formName}</p>
            )}
          </>
        ) : (
          <button className="rounded-xl bg-primary px-8 py-4 font-semibold text-white transition hover:bg-primary-hover">
            Submit Another Response
          </button>
        )}
      </div>
    </main>
  );
};

export default FinishPage;