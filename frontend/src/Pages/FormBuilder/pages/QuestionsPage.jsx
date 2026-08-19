import { useState } from "react";
import { Plus } from "lucide-react";
import Breadcrumb from "../Components/Breadcrumb";
import FormHeader from "../Components/FormHeader";
import BuilderToolbar from "../Components/BuilderToolbar";
import AddQuestionModal from "../Components/AddQuestionModal";

import MultipleChoiceCard from "../Components/MultipleChoiceCard";
import ShortAnswerCard from "../Components/ShortAnswerCard";
import CheckboxCard from "../Components/CheckboxCard";
import DropdownCard from "../Components/DropdownCard";
import ParagraphCard from "../Components/ParagraphCard";
import RatingCard from "../Components/RatingCard";

const QuestionsPage = ({ questions = [], onAddQuestion, onDeleteQuestion }) => {
  const [showModal, setShowModal] = useState(false);

  const handleModalSelect = (type) => {
    setShowModal(false);
    onAddQuestion(type);
  };

  return (
    <main className="relative flex-1 rounded-2xl bg-surface p-8 shadow-sm">
      <Breadcrumb />
      <FormHeader />
      <BuilderToolbar onAddQuestion={() => setShowModal(true)} />

      {questions.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-[#F4F6F9] py-24">
          <h2 className="mb-6 text-lg font-medium text-text-secondary">
            Add one question to get started.
          </h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-white shadow-sm transition hover:bg-primary-hover"
          >
            <Plus size={18} />
            Add Question
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {questions.map((q, index) => {
            const { id, type, ...restProps } = q;
            const cardProps = {
              key: id,
              index: index + 1,
              onDelete: () => onDeleteQuestion(id),
              ...restProps,
            };

            if (type === "multiple" || type === "multiple-choice") return <MultipleChoiceCard {...cardProps} />;
            if (type === "short" || type === "short-answer") return <ShortAnswerCard {...cardProps} />;
            if (type === "checkbox") return <CheckboxCard {...cardProps} />;
            if (type === "dropdown") return <DropdownCard {...cardProps} />;
            if (type === "paragraph") return <ParagraphCard {...cardProps} />;
            if (type === "rating") return <RatingCard {...cardProps} />;
            return null;
          })}

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
        onSelect={handleModalSelect}
      />
    </main>
  );
};

export default QuestionsPage;