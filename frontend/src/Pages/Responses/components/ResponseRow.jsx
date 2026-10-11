import { Eye, Star } from "lucide-react";
import ResponseAvatar from "./ResponseAvatar";

export const RESPONSE_COLS =
  "grid grid-cols-[2fr_1.6fr_1.8fr_1.5fr_.7fr_1.2fr_.8fr_1fr] items-center gap-4";

const ResponseRow = ({ response, onViewDetails }) => (
  <div className={`${RESPONSE_COLS} rounded-xl bg-background px-2 py-2 text-sm text-text-secondary`}>
    <ResponseAvatar avatar={response.avatar} name={response.name} />

    <p className="truncate text-center">{response.survey}</p>
    <p className="truncate text-center">{response.email}</p>
    <p className="truncate text-center">{response.phone}</p>
    <p className="text-center">{response.age}</p>
    <p className="text-center">{response.lastResponse}</p>

    <div className="flex items-center justify-center gap-1 text-text">
      {response.rating}
      <Star size={14} fill="currentColor" className="text-primary" />
    </div>

    <button
      type="button"
      onClick={() => onViewDetails?.(response)}
      className="flex items-center justify-center gap-2 font-medium text-primary transition hover:opacity-80"
    >
      <Eye size={16} />
      Preview
    </button>
  </div>
);

export default ResponseRow;