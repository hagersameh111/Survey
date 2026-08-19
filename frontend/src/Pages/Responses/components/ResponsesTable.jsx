import React from "react";
import ResponseRow from "./ResponseRow";

const ResponsesTable = ({ responses = [], onViewDetails }) => {
  return (
    <div className="w-full overflow-x-auto">
      {/* Table Header */}
      <div className="grid grid-cols-[2fr_1.6fr_1.8fr_1.5fr_.7fr_1.2fr_.8fr_1fr] px-5 pb-5 text-sm font-semibold text-gray-500 border-b border-gray-100">
        <span>Name</span>
        <span>Survey</span>
        <span>Email</span>
        <span>Phone</span>
        <span>Age</span>
        <span>Last Response</span>
        <span>Rating</span>
        <span>Actions</span>
      </div>

      {/* Table Rows Container */}
      <div className="space-y-3 pt-3">
        {responses.map((response) => (
          <ResponseRow
            key={response.id || response.name}
            response={response}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
};

export default ResponsesTable;