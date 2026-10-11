import ResponseRow, { RESPONSE_COLS } from "./ResponseRow";

const HEADERS = ["Survey", "Email", "Phone", "Age", "Last Response", "Rating", "Actions"];

const ResponsesTable = ({ responses = [], onViewDetails }) => (
  <div className="mt-6 w-full overflow-x-auto">
    <div className="min-w-[960px]">
      <div className={`${RESPONSE_COLS} px-2 pb-3 text-sm text-text-secondary`}>
        <span className="pl-1">Name</span>
        {HEADERS.map((h) => (
          <span key={h} className="text-center">
            {h}
          </span>
        ))}
      </div>

      <div className="space-y-2">
        {responses.map((response, i) => (
          <ResponseRow
            key={response.id ?? `${response.name}-${i}`}
            response={response}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  </div>
);

export default ResponsesTable;