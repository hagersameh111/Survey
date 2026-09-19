import React, { useState } from "react";
import SwitchToggle from "../../../Shared/SwitchToggle";
import { GripVertical } from "lucide-react";

const BioAnswerSidebar = () => {
  const [fields, setFields] = useState({
    name: true,
    dob: true,
    email: true,
    phone: true,
  });

  const handleToggle = (field) => {
    setFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <aside className="w-[300px] flex-shrink-0 overflow-y-auto rounded-3xl bg-[#F8FAFD] p-6 shadow-sm scrollbar-hide">
      <h3 className="mb-6 text-lg font-semibold text-text">Bio Settings</h3>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-text-secondary">Required Fields</h4>

        <div className="flex items-center justify-between rounded-xl border border-border bg-white p-3 shadow-xs">
          <div className="flex items-center gap-3 text-sm text-text font-medium">
            <GripVertical size={16} className="text-text-muted cursor-move" />
            Full Name
          </div>
          <SwitchToggle checked={fields.name} onChange={() => handleToggle("name")} />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-white p-3 shadow-xs">
          <div className="flex items-center gap-3 text-sm text-text font-medium">
            <GripVertical size={16} className="text-text-muted cursor-move" />
            Email Address
          </div>
          <SwitchToggle checked={fields.email} onChange={() => handleToggle("email")} />
        </div>
      </div>
    </aside>
  );
};

export default BioAnswerSidebar;