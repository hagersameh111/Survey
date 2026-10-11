import { GripVertical, Trash2, Star } from "lucide-react";

const RatingCard = ({ id, index = 1, title = "", description = "", scale = 5, onChange = () => {}, onDelete, onMoveUp, onMoveDown }) => (
  <div id={id} className="rounded-2xl border border-primary bg-white p-6 shadow-sm">
    <div className="flex items-start gap-4">
      <GripVertical size={20} className="mt-2 cursor-grab text-text-muted" />
      <span className="mt-2 font-medium text-text-secondary">{index}</span>
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
          className="mt-1 w-full bg-transparent text-sm text-text-secondary outline-none placeholder:text-border"
        />
      </div>
      <div className="flex items-center gap-3 text-text-muted">
        <button type="button" onClick={onMoveUp} aria-label="Move question up" className="hover:text-primary">↑</button>
        <button type="button" onClick={onMoveDown} aria-label="Move question down" className="hover:text-primary">↓</button>
        <button type="button" onClick={onDelete} aria-label="Delete question" className="hover:text-red-500"><Trash2 size={20} /></button>
      </div>
    </div>
    <div className="ml-10 mt-6 flex items-center gap-2 text-amber-400">
      {Array.from({ length: Math.min(Math.max(Number(scale) || 5, 2), 10) }, (_, starIndex) => <Star key={starIndex} size={20} />)}
      <label className="ml-4 flex items-center gap-2 text-sm text-text-secondary">
        Scale
        <input
          type="number"
          min="2"
          max="10"
          value={scale || 5}
          onChange={(event) => onChange({ scale: Number(event.target.value) })}
          className="w-16 rounded-lg border border-border px-2 py-1 text-text"
        />
      </label>
    </div>
  </div>
);

export default RatingCard;
