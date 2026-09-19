import { Clock } from "lucide-react";
import Breadcrumb from "../../Shared/Breadcrumb";

const WelcomePage = () => {
  return (
    <main className="relative flex-1 rounded-2xl bg-surface p-8 shadow-sm border border-border">
      <Breadcrumb />
      
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[500px]">
        <h1 className="text-2xl font-bold text-primary mb-4">
          Welcome, we’d love your feedback
        </h1>
        
        <p className="text-text-secondary max-w-lg mb-8 leading-relaxed">
          Your honest input helps us making better decisions in the future. Please share your
          thoughts, every bit of feedback is appreciated.
        </p>

        <div className="w-full max-w-xs text-left mb-6">
          <label className="block text-xs font-medium text-text-secondary mb-1 text-center">
            Access Code
          </label>
          <input
            type="text"
            placeholder="22Y45W"
            className="w-full rounded-xl border border-border bg-white p-3 text-sm outline-none text-center"
            disabled
          />
        </div>

        <button className="rounded-xl bg-primary px-16 py-3.5 font-medium text-white shadow-sm transition hover:bg-primary-hover mb-4">
          Start Now
        </button>

        <div className="flex items-center justify-center gap-2 text-primary text-sm font-medium mb-12">
          <Clock size={16} />
          <span>Takes 10 min.</span>
        </div>

        <div className="mt-8 pt-6 w-full max-w-lg">
          <h4 className="font-semibold text-text text-sm mb-1">Contact Details:</h4>
          <a href="mailto:admin12345@mail.com" className="text-primary text-sm underline hover:opacity-80 transition">
            admin12345@mail.com
          </a>
          <p className="text-xs text-text-muted mt-6 leading-relaxed">
            If you wish to make a formal complaint regarding this research, you may contact the
            Academic Supervisor. Your communication may also be referred to an independent
            person, where appropriate.
          </p>
        </div>
      </div>
    </main>
  );
};

export default WelcomePage;