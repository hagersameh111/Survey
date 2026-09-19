import { useEffect } from "react";
import {
  List,
  Type,
  CheckSquare,
  ChevronDown,
  AlignLeft,
  Star,
} from "lucide-react";

import QuestionTypeCard from "./QuestionTypeCard";

const questionTypes = [
  {
    id: "multiple-choice",
    title: "Multiple Choice",
    icon: List,
    color: "bg-[#FCFBF5]", // Soft Yellow
  },
  {
    id: "short-answer",
    title: "Short Answer",
    icon: Type,
    color: "bg-[#F4F7FD]", // Soft Blue
  },
  {
    id: "checkbox",
    title: "Checkbox",
    icon: CheckSquare,
    color: "bg-[#FCF6F7]", // Soft Pink
  },
  {
    id: "dropdown",
    title: "Dropdown",
    icon: ChevronDown,
    color: "bg-[#F4FAF8]", // Soft Green
  },
  {
    id: "paragraph",
    title: "Paragraph",
    icon: AlignLeft,
    color: "bg-[#FFF8F5]", // Soft Orange
  },
  {
    id: "rating",
    title: "Star Rating",
    icon: Star,
    color: "bg-[#F9F6FD]", // Soft Purple
  },
];

const AddQuestionModal = ({ open, onClose, onSelect }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Invisible Overlay to close when clicking outside */}
      <div
        onClick={onClose}
        className="absolute inset-0 z-40 rounded-2xl"
      />

      {/* Floating Panel */}
      <div className="absolute left-1/2 top-[68%] z-50 w-full max-w-[760px] -translate-x-1/2 rounded-2xl bg-white p-3 shadow-xl border border-border">
        <div className="grid grid-cols-3 gap-3">
          {questionTypes.map((question) => (
            <QuestionTypeCard
              key={question.id}
              {...question}
              onClick={() => onSelect(question.id)}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default AddQuestionModal;