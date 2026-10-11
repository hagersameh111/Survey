import { GripVertical, Trash2, Circle, ChevronDown, Plus } from "lucide-react";

const MultipleChoiceCard = ({ id, index = 1, title = "", description = "", options = [{ label: "Option 1" }], onChange = () => {}, onDelete, onAddOption, onDeleteOption }) => {

  return (
    <div id={id} className="rounded-2xl border-2 border-primary bg-white p-6 shadow-sm">
      
      {/* Card Header / Question Title */}
      <div className="flex items-start gap-4">
        <div className="mt-2 text-text-muted cursor-grab">
          <GripVertical size={20} />
        </div>
        
        <span className="mt-2 font-medium text-text-secondary">{index}</span>
        
        <div className="flex-1">
          <input
            type="text"
            value={title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="Question text..."
            className="w-full bg-transparent text-lg font-medium text-text outline-none placeholder:text-text-muted"
          />
          <input
            type="text"
            value={description}
            onChange={(event) => onChange({ description: event.target.value })}
            placeholder="Description (optional)"
            className="mt-1 w-full bg-transparent text-sm text-text-secondary outline-none placeholder:text-border"
          />
        </div>

        <div className="flex items-center gap-3 text-text-muted">
          <ChevronDown size={20} aria-hidden="true" />
          <button type="button" onClick={onDelete} className="hover:text-red-500"><Trash2 size={20} /></button>
        </div>
      </div>

      {/* Options List */}
      <div className="mt-6 ml-10 space-y-4">
        {options.map((option, idx) => (
          <div key={idx} className="flex items-center gap-4">
            <Circle size={20} className="text-border" />
            
            <input
              type="text"
              value={option.label || ""}
              onChange={(event) => onChange({ options: options.map((item, optionIndex) => optionIndex === idx ? { ...item, label: event.target.value } : item) })}
              className="flex-1 rounded-xl border border-border bg-[#F8FAFF] px-4 py-3 text-text-secondary outline-none transition focus:border-primary focus:bg-white"
            />
            
            <button type="button" onClick={() => onDeleteOption(idx)} className="text-text-muted hover:text-red-500" aria-label={`Remove option ${idx + 1}`}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        {/* Add Option Button */}
        <div className="flex items-center gap-4 pt-2">
          <Plus size={20} className="text-primary" />
          <button type="button" onClick={onAddOption} className="font-medium text-primary hover:underline">
            Add option
          </button>
        </div>
      </div>

    </div>
  );
};

export default MultipleChoiceCard;
