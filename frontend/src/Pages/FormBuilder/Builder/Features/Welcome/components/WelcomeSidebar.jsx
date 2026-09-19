import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import SwitchToggle from "../../../Shared/SwitchToggle";

const WelcomeSidebar = () => {
  const [timeComplete, setTimeComplete] = useState(true);
  const [accessCode, setAccessCode] = useState(true);
  const [contactDetails, setContactDetails] = useState(true);

  return (
    <aside className="w-[300px] flex-shrink-0 overflow-y-auto rounded-3xl bg-[#F8FAFD] p-6 shadow-sm scrollbar-hide">
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-text">Answer</h3>
        <button className="flex w-full items-center justify-between rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-text transition hover:border-primary">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-primary-light text-primary">
              <span className="text-[10px]">W</span>
            </span>
            Welcome Screen
          </div>
          <ChevronDown size={16} className="text-text-muted" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-text">Time to complete</span>
            <SwitchToggle checked={timeComplete} onChange={setTimeComplete} />
          </div>
          <input
            type="text"
            defaultValue="00 : 10 : 00"
            className="w-full rounded-xl border border-border bg-white p-2.5 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="border-t border-border pt-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text">Image or video</span>
            <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text transition hover:border-primary hover:text-primary">
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default WelcomeSidebar;