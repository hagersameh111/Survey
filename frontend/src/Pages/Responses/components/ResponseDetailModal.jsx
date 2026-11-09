import React, { useState } from "react";
import { Grid, List, X } from "lucide-react";

const ResponseDetailModal = ({ isOpen, onClose, respondentName = "Respondent", completedCount = 0, totalCount = 0, responses = [], loading = false, error = "" }) => {
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  if (!isOpen) return null;

  const displayResponses = responses;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-blue-900">{respondentName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {completedCount} of {totalCount} Completed
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Grid / List Toggle Switch */}
            <div className="bg-gray-100 p-1 rounded-lg flex items-center gap-1 border border-gray-200/60">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-8 overflow-y-auto bg-gray-50/50 flex-1">
          {loading && <p className="text-sm text-gray-500">Loading response…</p>}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div
            className={`grid gap-5 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {displayResponses.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <h3 className="text-xs font-semibold text-gray-900 mb-2">
                    {item.id}. {item.question}
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">{item.answer}</p>
                </div>
              </div>
            ))}
            {!loading && !error && displayResponses.length === 0 && <p className="text-sm text-gray-500">No answers were recorded.</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ResponseDetailModal;
