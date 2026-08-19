import { useState } from "react";
import { RectangleHorizontal } from "lucide-react";

import QuestionList from "./QuestionList";
import PagesPanel from "./PagesPanel";

const initialQuestions = [
  {
    id: 1,
    order: 1,
    title: "Question text...",
    type: "multiple",
  },
  {
    id: 2,
    order: 2,
    title: "Question text...",
    type: "short",
  },
  {
    id: 3,
    order: 3,
    title: "Question text...",
    type: "checkbox",
  },
  {
    id: 4,
    order: 4,
    title: "Question text...",
    type: "dropdown",
  },
  {
    id: 5,
    order: 5,
    title: "Question text...",
    type: "paragraph",
  },
  {
    id: 6,
    order: 6,
    title: "Question text...",
    type: "rating",
  },
];

const BuilderSidebar = () => {
  const [questions, setQuestions] = useState(initialQuestions);

  const handleDeleteQuestion = (id) => {
    setQuestions((prev) =>
      prev.filter((question) => question.id !== id)
    );
  };

  return (
    <aside className="w-80 flex flex-col gap-6">
      {/* Form Card */}

      <div className="rounded-3xl bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <RectangleHorizontal
            size={22}
            className="text-text-secondary"
          />

          <span className="text-xl font-medium text-text-secondary">
            Service Evaluation Form
          </span>
        </div>
      </div>

      {/* Questions List */}

      <QuestionList
        questions={questions}
        onDeleteQuestion={handleDeleteQuestion}
      />

      {/* Pages */}

      <PagesPanel />
    </aside>
  );
};

export default BuilderSidebar;