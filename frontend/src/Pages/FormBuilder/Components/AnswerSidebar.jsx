import { useState } from "react";
import { List, ChevronDown, Plus } from "lucide-react";
import SwitchToggle from "./SwitchToggle";

const AnswerSidebar = () => {
  const [settings, setSettings] = useState({
    required: true,
    multipleSelection: false,
    randomize: false,
    otherOption: false,
  });

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="w-[300px] rounded-3xl bg-[#F8FAFD] p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-medium text-text">Answer</h2>

      {/* Question Type Dropdown */}
      <button className="mb-6 flex h-[52px] w-full items-center justify-between rounded-2xl border border-border bg-white px-3 transition hover:border-primary">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
            <List size={18} />
          </div>
          <span className="text-text-secondary">
            Multiple Choice
          </span>
        </div>
        <ChevronDown size={20} className="text-text-muted" />
      </button>

      {/* Top Divider */}
      <div className="mb-6 h-px w-full bg-border" />

      {/* Settings Toggles */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-[15px] text-text-secondary">Required</span>
          <SwitchToggle 
            checked={settings.required} 
            onChange={() => toggleSetting("required")} 
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[15px] text-text-secondary">Multiple selection</span>
          <SwitchToggle 
            checked={settings.multipleSelection} 
            onChange={() => toggleSetting("multipleSelection")} 
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[15px] text-text-secondary">Randomize</span>
          <SwitchToggle 
            checked={settings.randomize} 
            onChange={() => toggleSetting("randomize")} 
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[15px] text-text-secondary">"Other" option</span>
          <SwitchToggle 
            checked={settings.otherOption} 
            onChange={() => toggleSetting("otherOption")} 
          />
        </div>
      </div>

      {/* Bottom Divider */}
      <div className="my-6 h-px w-full bg-border" />

      {/* Image or Video Add */}
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-medium text-text">
          Image or video
        </span>
        <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white text-primary transition hover:border-primary hover:bg-primary-light">
          <Plus size={22} />
        </button>
      </div>
    </aside>
  );
};

export default AnswerSidebar;