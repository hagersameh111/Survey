import { GripVertical, Trash2, ChevronDown, ChevronUp, Plus } from "lucide-react";

const CheckboxCard = ({ index = 3 }) => {
  const options = ["Option 1", "Option 2"];

  return (
    <div className="rounded-2xl border border-primary bg-white p-6 shadow-sm transition-all hover:shadow-md">
      
      {/* Card Header / Question Title */}
      <div className="flex items-start gap-4">
        
        {/* Drag Handle */}
        <div className="mt-2 cursor-grab text-text-muted transition hover:text-text">
          <GripVertical size={20} />
        </div>
        
        {/* Question Number */}
        <span className="mt-2 font-medium text-text-secondary">
          {index}
        </span>
        
        {/* Inputs */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Question text..."
            className="w-full bg-transparent text-lg font-semibold text-text outline-none placeholder:text-text-muted"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            className="mt-1 w-full bg-transparent text-sm text-text-secondary outline-none placeholder:text-border transition focus:text-text"
          />
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-3 text-text-muted">
          <button className="transition hover:text-text">
            <ChevronUp size={20} />
          </button>
          <button className="transition hover:text-text">
            <ChevronDown size={20} />
          </button>
          <button className="transition hover:text-red-500">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Options List */}
      <div className="mt-6 ml-10 space-y-4">
        {options.map((option, idx) => (
          <div key={idx} className="flex items-center gap-4">
            
            {/* Square Checkbox Icon (Visual Only) */}
            <div className="h-5 w-5 rounded-[4px] border-[2px] border-text-muted" />
            
            <input
              type="text"
              defaultValue={option}
              className="flex-1 rounded-xl border border-border bg-[#F8FAFD] px-4 py-3 text-text-secondary outline-none transition focus:border-primary focus:bg-white"
            />
            
            <button className="text-text-muted transition hover:text-red-500">
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        {/* Add Option Button */}
        <div className="flex items-center gap-4 pt-2">
          <Plus size={20} className="text-primary" />
          <button className="font-medium text-primary hover:underline">
            Add option
          </button>
        </div>
      </div>

    </div>
  );
};

export default CheckboxCard;