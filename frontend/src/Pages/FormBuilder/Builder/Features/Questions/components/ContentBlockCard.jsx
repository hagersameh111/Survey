import { GripVertical, Trash2 } from "lucide-react";

const ContentBlockCard = ({ id, type, index, title = "", altText = "", onChange = () => {}, onDelete, onMoveUp, onMoveDown }) => {
  const labels = { heading: "Heading", text: "Text", image: "Image URL", divider: "Divider" };
  if (type === "divider") {
    return (
      <div id={id} className="flex items-center gap-4 rounded-2xl border border-border bg-white p-6">
        <GripVertical size={20} className="cursor-grab text-text-muted" />
        <span className="text-sm font-medium text-text-secondary">{index}. Divider</span>
        <div className="h-px flex-1 bg-border" />
        <button type="button" onClick={onDelete} aria-label="Delete divider" className="text-text-muted hover:text-red-500"><Trash2 size={18} /></button>
      </div>
    );
  }
  return (
    <div id={id} className="rounded-2xl border border-primary bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <GripVertical size={20} className="cursor-grab text-text-muted" />
        <span className="text-sm font-medium text-text-secondary">{index}. {labels[type]}</span>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={onMoveUp} aria-label="Move block up" className="text-text-muted hover:text-primary">↑</button>
          <button type="button" onClick={onMoveDown} aria-label="Move block down" className="text-text-muted hover:text-primary">↓</button>
          <button type="button" onClick={onDelete} aria-label={`Delete ${labels[type]}`} className="text-text-muted hover:text-red-500"><Trash2 size={18} /></button>
        </div>
      </div>
      <input
        type={type === "image" ? "url" : "text"}
        value={title}
        onChange={(event) => onChange({ title: event.target.value })}
        placeholder={type === "image" ? "https://example.com/image.png" : `${labels[type]} text...`}
        className="w-full rounded-xl border border-border bg-background p-3 text-text outline-none focus:border-primary"
      />
      {type === "image" && <input type="text" value={altText} onChange={(event) => onChange({ altText: event.target.value })} placeholder="Alternative text (optional)" className="mt-3 w-full rounded-xl border border-border bg-background p-3 text-text outline-none focus:border-primary" />}
    </div>
  );
};

export default ContentBlockCard;
