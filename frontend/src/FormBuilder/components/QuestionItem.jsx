import {
  GripVertical,
  Type,
  List,
  CheckSquare,
  ChevronDown,
 AlignLeft,
  Star,
  Trash2,
} from "lucide-react";

const icons = {
  multiple: List,
  short: Type,
  checkbox: CheckSquare,
  dropdown: ChevronDown,
  paragraph: AlignLeft,
  rating: Star,
};

const QuestionItem = ({
  question,
  onDelete,
}) => {
  const Icon = icons[question.type] || List;

  return (
    <div className="group flex items-center justify-between rounded-2xl bg-[#F4F8FF] px-4 py-4 transition hover:shadow-sm">

      <div className="flex items-center gap-4">

        <GripVertical
          size={18}
          className="cursor-grab text-primary"
        />

        <Icon
          size={22}
          className="text-primary"
        />

        <span className="font-semibold">
          {question.order}
        </span>

        <span className="truncate font-medium">
          {question.title}
        </span>

      </div>

      <button
        onClick={() => onDelete(question.id)}
        className="opacity-60 transition hover:text-red-500 hover:opacity-100"
      >
        <Trash2 size={18} />
      </button>

    </div>
  );
};

export default QuestionItem;