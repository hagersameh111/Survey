import { RectangleHorizontal } from "lucide-react";
import PagesPanel from "./PagesPanel";
import QuestionList from "../Features/Questions/components/QuestionList";

const BuilderSidebar = ({ selectedPage, setSelectedPage, questions, onDeleteQuestion }) => {
  return (
    <aside className="flex w-fit flex-col gap-4">
      <div className="rounded-3xl bg-surface p-6 shadow-sm">
        <div className="flex w-fit items-center gap-4">
          <RectangleHorizontal size={22} className="text-text-secondary" />
          <span className="text-xl font-medium text-text-secondary">Service Evaluation Form</span>
        </div>
      </div>
      
      <QuestionList questions={questions} onDeleteQuestion={onDeleteQuestion} />
      <PagesPanel activePage={selectedPage} onSelectPage={setSelectedPage} />
    </aside>
  );
};

export default BuilderSidebar;