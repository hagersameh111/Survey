import React from "react";
import Breadcrumb from "../../Shared/Breadcrumb";
import FormHeader from "../../Shared/FormHeader";
import { User, Calendar, Mail, Phone } from "lucide-react";

const ParticipantBioPage = () => {
  return (
    <main className="relative flex-1 rounded-2xl bg-surface p-8 shadow-sm">
      <Breadcrumb />
      <FormHeader />

      <div className="mt-8 rounded-2xl border border-border bg-white p-8 shadow-xs">
        <h2 className="mb-6 text-xl font-bold text-text">Personal Info</h2>
        
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-text">Full Name</label>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-text-muted">
              <User size={18} />
              <span className="text-sm">Participant Name</span>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-text">Date of Birth</label>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-text-muted">
              <Calendar size={18} />
              <span className="text-sm">DD/MM/YYYY</span>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-text">Email Address</label>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-text-muted">
              <Mail size={18} />
              <span className="text-sm">email@example.com</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ParticipantBioPage;