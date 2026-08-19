import React from "react";
import { Clock3 } from "lucide-react";
import Breadcrumb from "../Components/Breadcrumb";

const WelcomePage = ({ onStart }) => {
  return (
    <main className="flex-1 rounded-2xl bg-surface p-12 shadow-sm">
      {/* Breadcrumb Navigation */}
      <Breadcrumb />

      <div className="mx-auto max-w-4xl py-6">
        {/* Title */}
        <h1 className="mb-6 text-center text-4xl font-bold text-primary">
          Welcome, we'd love your feedback
        </h1>

        {/* Subtitle / Description */}
        <p className="mx-auto mb-10 max-w-3xl text-center text-lg leading-relaxed text-text-secondary">
          Your honest input helps us making better decisions in the future. Please share your thoughts, every bit of feedback is appreciated.
        </p>

        {/* Start Button */}
        <div className="flex justify-center">
          <button
            onClick={onStart}
            className="rounded-xl bg-primary px-12 py-4 text-xl font-semibold text-white shadow-sm transition hover:bg-primary-hover"
          >
            Start Now
          </button>
        </div>

        {/* Duration */}
        <div className="mt-8 flex items-center justify-center gap-2 text-primary">
          <Clock3 size={20} />
          <span className="text-base font-medium">Takes 10 min.</span>
        </div>

        {/* Contact Details */}
        <div className="mt-20 text-center">
          <h2 className="mb-2 text-2xl font-semibold text-text">
            Contact Details:
          </h2>
          <p className="text-xl text-primary underline cursor-pointer">
            admin12345@mail.com
          </p>
        </div>

        {/* Footer / Disclaimer */}
        <div className="mx-auto mt-12 max-w-2xl border-t border-border pt-8">
          <p className="text-center text-sm leading-relaxed text-text-muted">
            If you wish to make a formal complaint regarding this research, you may contact the Academic Supervisor. Your communication may also be referred to an independent person, where appropriate.
          </p>
        </div>
      </div>
    </main>
  );
};

export default WelcomePage;