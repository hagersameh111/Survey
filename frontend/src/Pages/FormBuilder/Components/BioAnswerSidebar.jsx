import { useState } from "react";
import { GripVertical, Contact, ChevronDown, Check } from "lucide-react";
import SwitchToggle from "./SwitchToggle";

const initialFields = [
  { id: 1, label: "Full Name", checked: true },
  { id: 2, label: "Date of Birth", checked: true },
  { id: 3, label: "Age", checked: false },
  { id: 4, label: "Email Address", checked: true },
  { id: 5, label: "Phone Number", checked: true },
  { id: 6, label: "Nationality", checked: false },
  { id: 7, label: "Country", checked: false },
];

const BioAnswerSidebar = () => {
  const [fields, setFields] = useState(initialFields);
  const [required, setRequired] = useState(true);

  const toggleField = (id) => {
    setFields(fields.map(f => f.id === id ? { ...f, checked: !f.checked } : f));
  };

  return (
    <aside className="w-[300px] rounded-3xl bg-[#F8FAFD] p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-medium text-text">Answer</h2>

      {/* View Dropdown */}
      <button className="mb-6 flex h-[52px] w-full items-center justify-between rounded-2xl border border-border bg-white px-3 transition hover:border-primary">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
            <Contact size={18} />
          </div>
          <span className="text-text-secondary">Participant Bio</span>
        </div>
        <ChevronDown size={20} className="text-text-muted" />
      </button>

      <div className="mb-6 h-px w-full bg-border" />

      {/* Global Required Toggle */}
      <div className="mb-6 flex items-center justify-between">
        <span className="text-[15px] text-text-secondary">Required</span>
        <SwitchToggle checked={required} onChange={setRequired} />
      </div>

      {/* Page Content Settings */}
      <div className="mb-5">
        <label className="mb-2 block text-sm text-text-secondary">Page title</label>
        <input 
          type="text" 
          defaultValue="Personal Info" 
          className="w-full rounded-xl border border-border bg-white p-3 text-sm text-text outline-none transition focus:border-primary" 
        />
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-sm text-text-secondary">Description</label>
        <textarea 
          rows={3} 
          defaultValue="Please, fill in your personal details." 
          className="w-full resize-none rounded-xl border border-border bg-white p-3 text-sm text-text outline-none transition focus:border-primary" 
        />
      </div>

      <div className="mb-6 h-px w-full bg-border" />

      {/* Specific Required Fields List */}
      <div>
        <h3 className="mb-4 text-[15px] font-semibold text-text">Required Fields</h3>
        <div className="space-y-4">
          {fields.map(field => (
            <div key={field.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <GripVertical size={16} className="cursor-grab text-text-muted transition group-hover:text-text-secondary" />
                <span className="text-sm text-text-secondary">{field.label}</span>
              </div>
              
              {/* Custom Checkbox */}
              <button 
                onClick={() => toggleField(field.id)} 
                className={`flex h-5 w-5 items-center justify-center rounded-[4px] border transition-colors ${
                  field.checked ? 'border-primary bg-primary' : 'border-text-muted bg-white'
                }`}
              >
                {field.checked && <Check size={14} className="text-white" strokeWidth={3} />}
              </button>
            </div>
          ))}
        </div>
      </div>

    </aside>
  );
};

export default BioAnswerSidebar;