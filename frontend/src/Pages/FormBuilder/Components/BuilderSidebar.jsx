import { useState } from "react";
import { RectangleHorizontal } from "lucide-react";
import QuestionList from "./QuestionList";
import PagesPanel from "./PagesPanel";
import { initialQuestions } from "../../../data/mockData";

const BuilderSidebar = () => {
  const [questions, setQuestions] = useState(initialQuestions);

  const handleDeleteQuestion = (id) => {
    setQuestions((prev) => prev.filter((question) => question.id !== id));
  };

  return (
    <aside className="w-80 flex flex-col gap-6">
      <div className="rounded-3xl bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <RectangleHorizontal size={22} className="text-text-secondary" />
          <span className="text-xl font-medium text-text-secondary">Service Evaluation Form</span>
        </div>
      </div>
      <QuestionList questions={questions} onDeleteQuestion={handleDeleteQuestion} />
      <PagesPanel />
    </aside>
  );
};

export default BuilderSidebar;