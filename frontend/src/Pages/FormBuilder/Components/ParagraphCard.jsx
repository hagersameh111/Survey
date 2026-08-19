import { GripVertical, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const ParagraphCard = ({ index = 5 }) => {
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

      {/* Paragraph Input Placeholder (Read-only visual) */}
      <div className="mt-6 ml-10">
        {/* Notice the taller h-32 height compared to the short answer card */}
        <div className="h-32 w-full max-w-4xl rounded-xl border border-dashed border-border bg-[#F8FAFD]" />
      </div>

    </div>
  );
};

export default ParagraphCard;