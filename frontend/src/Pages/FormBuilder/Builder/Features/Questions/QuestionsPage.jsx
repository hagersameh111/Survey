import { useState } from "react";
import { Plus, List as ListIcon, Type, CheckSquare, ChevronDown, AlignLeft, Star } from "lucide-react";
import Breadcrumb from "../../Shared/Breadcrumb";
import FormHeader from "../../Shared/FormHeader";
import BuilderToolbar from "../../Shared/BuilderToolbar";
import QuestionTypeCard from "./components/QuestionTypeCard";
import MultipleChoiceCard from "./components/MultipleChoiceCard";
import ShortAnswerCard from "./components/ShortAnswerCard";
// Import remaining cards as needed

const questionTypes = [
  { id: "multiple-choice", title: "Multiple Choice", icon: ListIcon, color: "bg-[#FCFBF5]" },
  { id: "short-answer", title: "Short Answer", icon: Type, color: "bg-[#F4F7FD]" },
  { id: "checkbox", title: "Checkbox", icon: CheckSquare, color: "bg-[#FCF6F7]" },
  { id: "dropdown", title: "Dropdown", icon: ChevronDown, color: "bg-[#F4FAF8]" },
  { id: "paragraph", title: "Paragraph", icon: AlignLeft, color: "bg-[#FFF8F5]" },
  { id: "rating", title: "Star Rating", icon: Star, color: "bg-[#F9F6FD]" },
];

const QuestionsPage = ({ questions = [], onAddQuestion, onDeleteQuestion }) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (type) => {
    onAddQuestion(type);
    setIsAdding(false); 
  };

  return (
    <main className="relative flex-1 rounded-2xl bg-surface p-8 shadow-sm">
      <Breadcrumb />
      <FormHeader />
      <BuilderToolbar onAddQuestion={() => setIsAdding(true)} />

      {questions.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-[#F4F6F9] py-24">
          <h2 className="mb-6 text-lg font-medium text-text-secondary">
            Add one question to get started.
          </h2>
          
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-white shadow-sm transition hover:bg-primary-hover"
            >
              <Plus size={18} />
              Add Question
            </button>
          ) : (
            <div className="mt-4 grid w-full max-w-[760px] grid-cols-3 gap-3 rounded-2xl border border-dashed border-border bg-white p-3 shadow-sm">
              {questionTypes.map((q) => (
                <QuestionTypeCard key={q.id} {...q} onClick={() => handleAdd(q.id)} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {questions.map((q, index) => {
            const { id, type, ...restProps } = q;
            const cardProps = { key: id, index: index + 1, onDelete: () => onDeleteQuestion(id), ...restProps };

            if (type === "multiple" || type === "multiple-choice") return <MultipleChoiceCard {...cardProps} />;
            if (type === "short" || type === "short-answer") return <ShortAnswerCard {...cardProps} />;
            return null;
          })}

          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary bg-transparent py-4 font-medium text-primary transition hover:bg-primary-light"
            >
              <Plus size={20} />
              Add question
            </button>
          ) : (
            <div className="mt-6 w-full rounded-2xl border border-dashed border-primary bg-white p-3 shadow-sm">
              <div className="grid grid-cols-3 gap-3">
                {questionTypes.map((q) => (
                  <QuestionTypeCard key={q.id} {...q} onClick={() => handleAdd(q.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default QuestionsPage;