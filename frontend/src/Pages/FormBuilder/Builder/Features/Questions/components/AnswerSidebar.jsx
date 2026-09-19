import { useState } from "react";
import { List, ChevronDown, Plus } from "lucide-react";
import SwitchToggle from "../../../Shared/SwitchToggle";

const AnswerSidebar = () => {
  const [settings, setSettings] = useState({
    required: true,
    multipleSelection: false,
  });

  const toggleSetting = (key) => setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <aside className="w-[300px] rounded-3xl bg-[#F8FAFD] p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-medium text-text">Answer</h2>
      
      <button className="mb-6 flex h-[52px] w-full items-center justify-between rounded-2xl border border-border bg-white px-3 transition hover:border-primary">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
            <List size={18} />
          </div>
          <span className="text-text-secondary">Multiple Choice</span>
        </div>
        <ChevronDown size={20} className="text-text-muted" />
      </button>

      <div className="mb-6 h-px w-full bg-border" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-[15px] text-text-secondary">Required</span>
          <SwitchToggle checked={settings.required} onChange={() => toggleSetting("required")} />
        </div>
      </div>
    </aside>
  );
};

export default AnswerSidebar;