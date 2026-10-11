import { RectangleHorizontal } from "lucide-react";
import PagesPanel from "./PagesPanel";
import QuestionList from "../Features/Questions/components/QuestionList";

const BuilderSidebar = ({ selectedPage, setSelectedPage, questions, selectedQuestionId, formTitle, formDescription, onFormUpdate, onDeleteQuestion, onSelectQuestion }) => {
  return (
    <aside className="flex w-full min-w-0 flex-col gap-4 lg:w-fit lg:shrink-0">
      <div className="rounded-3xl bg-surface p-6 shadow-sm">
        <div className="flex w-fit items-center gap-4">
          <RectangleHorizontal size={22} className="text-text-secondary" />
          <div className="min-w-0">
            <input
              value={formTitle}
              onChange={(event) => onFormUpdate({ title: event.target.value })}
              maxLength={200}
              aria-label="Form title"
              className="w-full bg-transparent text-lg font-medium text-text outline-none"
            />
            <textarea
              rows={2}
              value={formDescription}
              onChange={(event) => onFormUpdate({ description: event.target.value })}
              maxLength={1000}
              aria-label="Form description"
              placeholder="Form description"
              className="mt-1 w-full resize-none bg-transparent text-xs text-text-muted outline-none"
            />
          </div>
        </div>
      </div>
      
      <QuestionList questions={questions} selectedQuestionId={selectedQuestionId} onDeleteQuestion={onDeleteQuestion} onSelectQuestion={onSelectQuestion} />
      <PagesPanel activePage={selectedPage} onSelectPage={setSelectedPage} />
    </aside>
  );
};

export default BuilderSidebar;
