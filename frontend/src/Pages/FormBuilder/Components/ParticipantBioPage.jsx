import { Download, Play, Settings, User, Calendar, Mail, Phone } from "lucide-react";
import Breadcrumb from "./Breadcrumb";

const ParticipantBioPage = () => {
  return (
    <main className="flex-1">
      
      {/* Top Header/Toolbar */}
      <div className="mb-6 flex items-center justify-between">
        <Breadcrumb />
        
        <div className="flex items-center gap-6 text-sm font-medium text-text-secondary">
          <button className="flex items-center gap-2 transition hover:text-primary">
            <Download size={18} />
            Import Questions
          </button>
          
          <button className="flex items-center gap-2 text-primary transition hover:opacity-80">
            <Play size={18} />
            Preview
          </button>
          
          <button className="rounded-xl border border-border bg-white p-2.5 transition hover:border-primary">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Main Bio Card */}
      <div className="rounded-2xl bg-surface p-12 shadow-sm">
        <div className="mx-auto max-w-3xl">
          
          {/* Card Headers */}
          <div className="mb-10 text-center">
            <h1 className="mb-3 text-2xl font-bold text-primary">Personal Info</h1>
            <p className="text-text-secondary">Please, fill in your personal details.</p>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-8">
            
            {/* Full Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">Full Name</label>
              <div className="flex h-12 items-center gap-3 rounded-xl border border-border bg-white px-4 transition-colors focus-within:border-primary">
                <User size={18} className="text-text-muted" />
                <input type="text" placeholder="your.email@example.com" className="w-full bg-transparent outline-none placeholder:text-text-muted" />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">Date of Birth</label>
              <div className="flex h-12 items-center gap-3 rounded-xl border border-border bg-white px-4 transition-colors focus-within:border-primary">
                <Calendar size={18} className="text-text-muted" />
                <input type="text" placeholder="DD/MM/YYYY" className="w-full bg-transparent outline-none placeholder:text-text-muted" />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">Email Address</label>
              <div className="flex h-12 items-center gap-3 rounded-xl border border-border bg-white px-4 transition-colors focus-within:border-primary">
                <Mail size={18} className="text-text-muted" />
                <input type="text" placeholder="your.email@example.com" className="w-full bg-transparent outline-none placeholder:text-text-muted" />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">Phone Number</label>
              <div className="flex h-12 items-center gap-3 rounded-xl border border-border bg-white px-4 transition-colors focus-within:border-primary">
                <Phone size={18} className="text-text-muted" />
                <input type="text" placeholder="+1 (555) 000-0000" className="w-full bg-transparent outline-none placeholder:text-text-muted" />
              </div>
            </div>

          </div>

          {/* Submit Button */}
          <div className="mt-12 flex justify-center">
            <button className="rounded-xl bg-primary px-20 py-4 font-semibold text-white shadow-sm transition hover:bg-primary-hover">
              Confirm
            </button>
          </div>

        </div>
      </div>

    </main>
  );
};

export default ParticipantBioPage;