import { useState } from "react";
import { Plus, List as ListIcon, Type, CheckSquare, ChevronDown, AlignLeft, Star, AtSign, Phone, Hash, CalendarDays, Circle, Heading1, FileText, Image as ImageIcon, Minus } from "lucide-react";
import Breadcrumb from "../../Shared/Breadcrumb";
import FormHeader from "../../Shared/FormHeader";
import BuilderToolbar from "../../Shared/BuilderToolbar";
import QuestionTypeCard from "./components/QuestionTypeCard";
import MultipleChoiceCard from "./components/MultipleChoiceCard";
import ShortAnswerCard from "./components/ShortAnswerCard";
import RatingCard from "./components/RatingCard";
import ContentBlockCard from "./components/ContentBlockCard";
// Import remaining cards as needed

const questionTypes = [
  { id: "multiple-choice", title: "Multiple Choice", icon: ListIcon, color: "bg-[#FCFBF5]" },
  { id: "short-answer", title: "Short Answer", icon: Type, color: "bg-[#F4F7FD]" },
  { id: "checkbox", title: "Checkbox", icon: CheckSquare, color: "bg-[#FCF6F7]" },
  { id: "dropdown", title: "Dropdown", icon: ChevronDown, color: "bg-[#F4FAF8]" },
  { id: "paragraph", title: "Paragraph", icon: AlignLeft, color: "bg-[#FFF8F5]" },
  { id: "rating", title: "Star Rating", icon: Star, color: "bg-[#F9F6FD]" },
  { id: "single-choice", title: "Single Choice", icon: Circle, color: "bg-[#FCFBF5]" },
  { id: "email", title: "Email", icon: AtSign, color: "bg-[#F4F7FD]" },
  { id: "phone", title: "Phone", icon: Phone, color: "bg-[#FCF6F7]" },
  { id: "number", title: "Number", icon: Hash, color: "bg-[#F4FAF8]" },
  { id: "date", title: "Date", icon: CalendarDays, color: "bg-[#FFF8F5]" },
  { id: "heading", title: "Heading", icon: Heading1, color: "bg-[#F9F6FD]" },
  { id: "text", title: "Text Block", icon: FileText, color: "bg-[#F4F7FD]" },
  { id: "image", title: "Image", icon: ImageIcon, color: "bg-[#FCFBF5]" },
  { id: "divider", title: "Divider", icon: Minus, color: "bg-[#F4FAF8]" },
];

const QuestionsPage = ({ questions = [], page, onUpdatePage, settings, onSettingsChange, onSaveSettings, onAddQuestion, onDeleteQuestion, onUpdateQuestion, onMoveQuestion, onDuplicate, onPreview }) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (type) => {
    onAddQuestion(type);
    setIsAdding(false); 
  };

  return (
    <main className="relative flex-1 rounded-2xl bg-surface p-8 shadow-sm">
      <Breadcrumb />
      <FormHeader title={page?.title} description={page?.description} onChange={onUpdatePage} />
      <BuilderToolbar onAddQuestion={() => setIsAdding(true)} onDuplicate={onDuplicate} onPreview={onPreview} settings={settings} onSettingsChange={onSettingsChange} onSaveSettings={onSaveSettings} />

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
            <div className="mt-4 grid w-full max-w-[760px] grid-cols-2 gap-3 rounded-2xl border border-dashed border-border bg-white p-3 shadow-sm sm:grid-cols-3">
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
            const cardProps = {
              key: id,
              id: `question-${id}`,
              index: index + 1,
              onDelete: () => onDeleteQuestion(id),
              onChange: (changes) => onUpdateQuestion(id, changes),
              onAddOption: () => onUpdateQuestion(id, { options: [...(q.options || []), { label: `Option ${(q.options || []).length + 1}` }] }),
              onDeleteOption: (optionIndex) => {
                if ((q.options || []).length > 1) onUpdateQuestion(id, { options: q.options.filter((_, i) => i !== optionIndex) });
              },
              onMoveUp: () => onMoveQuestion?.(id, -1),
              onMoveDown: () => onMoveQuestion?.(id, 1),
              ...restProps,
            };

            if (["heading", "text", "image", "divider"].includes(type)) return <ContentBlockCard {...cardProps} type={type} />;
            if (["multiple", "multiple-choice", "single-choice", "checkbox", "dropdown"].includes(type)) return <MultipleChoiceCard {...cardProps} />;
            if (["short", "short-answer", "paragraph", "email", "phone", "number", "date"].includes(type)) return <ShortAnswerCard {...cardProps} isParagraph={type === "paragraph"} inputType={type} />;
            if (type === "rating") return <RatingCard {...cardProps} />;
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
