import { GripVertical, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const ShortAnswerCard = ({ id, index = 2, title = "", description = "", onChange = () => {}, onDelete, onMoveUp, onMoveDown, isParagraph = false, inputType = "short-answer", placeholder = "" }) => {
  return (
    <div id={id} className="rounded-2xl border border-primary bg-white p-6 shadow-sm transition-all hover:shadow-md">
      
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
            value={title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="Question text..."
            className="w-full bg-transparent text-lg font-semibold text-text outline-none placeholder:text-text-muted"
          />
          <input
            type="text"
            value={description}
            onChange={(event) => onChange({ description: event.target.value })}
            placeholder="Description (optional)"
            className="mt-1 w-full bg-transparent text-sm text-text-secondary outline-none placeholder:text-border transition focus:text-text"
          />
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-3 text-text-muted">
          <button type="button" onClick={onMoveUp} aria-label="Move question up" className="transition hover:text-text">
            <ChevronUp size={20} />
          </button>
          <button type="button" onClick={onMoveDown} aria-label="Move question down" className="transition hover:text-text">
            <ChevronDown size={20} />
          </button>
          <button type="button" onClick={onDelete} className="transition hover:text-red-500">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Short Answer Input Placeholder (Read-only visual) */}
      <div className="mt-6 ml-10">
        <div className={`${isParagraph ? "h-28" : "h-11"} flex w-3/4 max-w-3xl items-center rounded-xl border border-dashed border-border bg-[#F8FAFD] px-3 text-xs text-text-muted`}>
          {placeholder || (inputType === "email" ? "name@example.com" : inputType === "phone" ? "+1 555 0100" : inputType === "number" ? "Enter a number" : inputType === "date" ? "Choose a date" : "Answer field")}
        </div>
      </div>

    </div>
  );
};

export default ShortAnswerCard;
