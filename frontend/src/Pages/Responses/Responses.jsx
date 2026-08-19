import React, { useState } from "react";
import ResponsesTable from "./components/ResponsesTable";
import ResponseDetailModal from "./components/ResponseDetailModal";
import responsesData from "./Data/responses"; // Adjust path to your responses data file if needed

const Responses = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRespondent, setSelectedRespondent] = useState(null);

  const handleViewDetails = (response) => {
    setSelectedRespondent(response);
    setIsModalOpen(true);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Responses</h1>
        <div className="text-sm text-gray-500">
          Responses collected: <span className="font-semibold text-gray-900">{responsesData.length} / 100</span>
        </div>
      </div>
      
      {/* Responses Table Component */}
      <ResponsesTable 
        responses={responsesData} 
        onViewDetails={handleViewDetails} 
      />

      {/* Response Detail Modal */}
      <ResponseDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        respondentName={selectedRespondent?.name || "Ahmed Said"}
        completedCount={15}
        totalCount={15}
      />
    </div>
  );
};

export default Responses;