import { Eye, Star } from "lucide-react";
import ResponseAvatar from "./ResponseAvatar";

const ResponsesGrid = ({ responses = [], onViewDetails }) => (
  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    {responses.map((r, i) => (
      <div
        key={r.id ?? `${r.name}-${i}`}
        className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 transition hover:border-primary hover:shadow-md"
      >
        <ResponseAvatar avatar={r.avatar} name={r.name} />

        <div className="space-y-1 text-sm text-text-secondary">
          <p className="truncate">{r.survey}</p>
          <p className="truncate">{r.email}</p>
          <p>{r.phone}</p>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-sm">
          <div className="flex items-center gap-1 text-text">
            {r.rating}
            <Star size={14} fill="currentColor" className="text-primary" />
            <span className="ml-3 text-text-muted">{r.lastResponse}</span>
          </div>
          <button
            type="button"
            onClick={() => onViewDetails?.(r)}
            className="flex items-center gap-2 font-medium text-primary transition hover:opacity-80"
          >
            <Eye size={16} />
            Preview
          </button>
        </div>
      </div>
    ))}
  </div>
);

export default ResponsesGrid;