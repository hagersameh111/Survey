import SwitchToggle from "../../../Shared/SwitchToggle";
import { GripVertical } from "lucide-react";

const fieldLabels = { name: "Full Name", dob: "Date of Birth", email: "Email Address", phone: "Phone Number" };

const BioAnswerSidebar = ({ fields = {}, onChange = () => {} }) => {

  return (
    <aside className="w-full flex-shrink-0 overflow-y-auto rounded-3xl bg-[#F8FAFD] p-4 shadow-sm scrollbar-hide sm:p-6 lg:w-[300px]">
      <h3 className="mb-6 text-lg font-semibold text-text">Bio Settings</h3>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-text-secondary">Participant fields</h4>
        {Object.entries(fieldLabels).map(([key, label]) => (
          <div key={key} className="space-y-3 rounded-xl border border-border bg-white p-3 shadow-xs">
            <div className="flex items-center justify-between text-sm font-medium text-text">
              <span className="flex items-center gap-3"><GripVertical size={16} className="text-text-muted" />{label}</span>
              <SwitchToggle checked={Boolean(fields[key]?.enabled)} onChange={(enabled) => onChange(key, { enabled })} />
            </div>
            {fields[key]?.enabled && <div className="flex items-center justify-between pl-7 text-xs text-text-secondary">
              Required
              <SwitchToggle checked={Boolean(fields[key]?.required)} onChange={(required) => onChange(key, { required })} />
            </div>}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default BioAnswerSidebar;
