import { CheckCircle2 } from "lucide-react";
import Breadcrumb from "../Components/Breadcrumb";

const FinishPage = () => {
  return (
    <main className="flex-1 rounded-2xl bg-surface p-12 shadow-sm">
      <Breadcrumb />
      
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-light text-primary">
          <CheckCircle2 size={40} />
        </div>

        <h1 className="mb-4 text-3xl font-bold text-text">
          Thank you for your feedback!
        </h1>

        <p className="mb-8 text-lg text-text-secondary">
          Your response has been successfully recorded. You may now close this window or submit another response.
        </p>

        <button className="rounded-xl bg-primary px-8 py-4 font-semibold text-white transition hover:bg-primary-hover">
          Submit Another Response
        </button>
      </div>
    </main>
  );
};

export default FinishPage; 