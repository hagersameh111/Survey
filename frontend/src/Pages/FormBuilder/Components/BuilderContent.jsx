import { useState } from "react";
import { Plus } from "lucide-react";

import Breadcrumb from "./Breadcrumb";
import FormHeader from "./FormHeader";
import BuilderToolbar from "./BuilderToolbar";
import AddQuestionModal from "./AddQuestionModal";

// IMPORT ALL QUESTION CARDS
import MultipleChoiceCard from "./MultipleChoiceCard";
import ShortAnswerCard from "./ShortAnswerCard";
import CheckboxCard from "./CheckboxCard";
import DropdownCard from "./DropdownCard";
import ParagraphCard from "./ParagraphCard";
import RatingCard from "./RatingCard";

const BuilderContent = () => {
  const [showModal, setShowModal] = useState(false);
  
  // Track questions in state
  const [questions, setQuestions] = useState([]);

  const handleQuestionSelect = (type) => {
    setShowModal(false);
    
    // Add the new question to the array when a type is selected
    setQuestions([...questions, { id: Date.now(), type }]);
  };

  return (
    <main className="relative flex-1 rounded-2xl bg-surface p-8 shadow-sm">
      <Breadcrumb />
      <FormHeader />
      <BuilderToolbar onAddQuestion={() => setShowModal(true)} />

      {/* Conditionally render Empty State OR the Questions List */}
      {questions.length === 0 ? (
        
        /* Empty State Area */
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-[#F4F6F9] py-24">
          <h2 className="mb-6 text-lg font-medium text-text-secondary">
            Add one question to get started.
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-white shadow-sm transition hover:bg-primary-hover"
            >
              <Plus size={18} />
              Add Question
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-dashed border-primary bg-transparent px-6 py-3 font-medium text-primary transition hover:bg-primary-light">
              <Plus size={18} />
              Import Questions
            </button>
          </div>
        </div>

      ) : (

        /* Active Questions Area */
        <div className="mt-8 space-y-6">
          {questions.map((q, index) => {
            // Render the specific card based on the selected type
            if (q.type === "multiple-choice") return <MultipleChoiceCard key={q.id} index={index + 1} />;
            if (q.type === "short-answer") return <ShortAnswerCard key={q.id} index={index + 1} />;
            if (q.type === "checkbox") return <CheckboxCard key={q.id} index={index + 1} />;
            if (q.type === "dropdown") return <DropdownCard key={q.id} index={index + 1} />;
            if (q.type === "paragraph") return <ParagraphCard key={q.id} index={index + 1} />;
            if (q.type === "rating") return <RatingCard key={q.id} index={index + 1} />;
            return null;
          })}
          
          {/* Dashed Add Question Button at the bottom */}
          <button 
            onClick={() => setShowModal(true)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary bg-transparent py-4 font-medium text-primary transition hover:bg-primary-light"
          >
            <Plus size={20} />
            Add question
          </button>
        </div>

      )}

      <AddQuestionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleQuestionSelect}
      />
    </main>
  );
};

export default BuilderContent;