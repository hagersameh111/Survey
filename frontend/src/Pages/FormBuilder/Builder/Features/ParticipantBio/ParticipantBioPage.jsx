import Breadcrumb from "../../Shared/Breadcrumb";
import FormHeader from "../../Shared/FormHeader";
import { User, Calendar, Mail, Phone, MapPin, Globe, Hash, VenusAndMars } from "lucide-react";

const bioFieldDefinitions = [
  ["name", "Full Name", User, "Your name"], ["dob", "Date of Birth", Calendar, "DD/MM/YYYY"],
  ["age", "Age", Hash, "Age"], ["email", "Email Address", Mail, "your.email@example.com"],
  ["phone", "Phone Number", Phone, "+1 (555) 000-0000"], ["nationality", "Nationality", Globe, "Nationality"],
  ["country", "Country", MapPin, "Country"], ["city", "City", MapPin, "City"],
  ["gender", "Gender", VenusAndMars, "Gender"], ["customised", "Description", User, ""],
];

const ParticipantBioPage = ({ page = {}, onUpdatePage, bioFields = {} }) => (
  <main className="relative flex-1 rounded-2xl border border-border bg-surface p-8 shadow-sm">
    <Breadcrumb />
    <FormHeader title={page.title} description={page.description} onChange={onUpdatePage} />
    <div className="mt-8 rounded-2xl bg-[#F7F8FC] p-8 shadow-xs">
      <h2 className="mb-2 text-center text-2xl font-bold text-primary">{page.title || "Personal Info"}</h2>
      {page.description && <p className="mb-8 text-center text-text-secondary">{page.description}</p>}
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2">
        {bioFieldDefinitions.filter(([key]) => bioFields[key]?.enabled).map(([key, defaultLabel, Icon, placeholder]) => {
          const label = key === "customised" ? (bioFields[key]?.question || defaultLabel) : defaultLabel;
          return <div key={key}>
            <label className="mb-2 block text-sm font-medium text-text">{label}{bioFields[key]?.required && <span className="text-red-500"> *</span>}</label>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-text-muted"><Icon size={18} /><span className="text-sm">{placeholder}</span></div>
          </div>;
        })}
      </div>
      <div className="mt-8 text-center"><button type="button" className="rounded-xl bg-primary px-16 py-3.5 font-medium text-white">{page.bioButton || "Confirm"}</button></div>
    </div>
  </main>
);

export default ParticipantBioPage;
