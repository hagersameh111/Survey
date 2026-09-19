import { Eye, Star } from "lucide-react";
import ResponseAvatar from "./ResponseAvatar";

const ResponseRow = ({ response, onViewDetails }) => {
  return (
    <div className="grid grid-cols-[2fr_1.6fr_1.8fr_1.5fr_.7fr_1.2fr_.8fr_1fr] items-center rounded-2xl bg-white px-5 py-4 border border-gray-100 transition hover:shadow-md">
      {/* Name Column with Avatar */}
      <ResponseAvatar
        avatar={response.avatar}
        name={response.name}
      />

      {/* Survey Name */}
      <p className="truncate text-gray-600 text-sm">
        {response.survey}
      </p>

      {/* Email */}
      <p className="truncate text-gray-600 text-sm">
        {response.email}
      </p>

      {/* Phone */}
      <p className="text-gray-600 text-sm">
        {response.phone}
      </p>

      {/* Age */}
      <p className="text-gray-600 text-sm">{response.age}</p>

      {/* Last Response Timestamp */}
      <p className="text-gray-600 text-sm">{response.lastResponse}</p>

      {/* Rating */}
      <div className="flex items-center gap-1 text-gray-700 font-medium text-sm">
        {response.rating}
        <Star
          size={15}
          fill="currentColor"
          className="text-amber-400"
        />
      </div>

      {/* Actions / Preview Button */}
      <button
        onClick={() => onViewDetails && onViewDetails(response)}
        className="flex items-center gap-2 font-medium text-blue-600 transition hover:opacity-80 cursor-pointer text-sm"
      >
        <Eye size={17} />
        Preview
      </button>
    </div>
  );
};

export default ResponseRow;