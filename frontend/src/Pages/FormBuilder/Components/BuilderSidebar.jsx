import { useState } from "react";
import { RectangleHorizontal } from "lucide-react";
import QuestionList from "../pages/QuestionsPage";
import PagesPanel from "./PagesPanel";
import { initialQuestions } from "../../../data/mockData";



const BuilderSidebar = ({ selectedPage, setSelectedPage, questions, onDeleteQuestion }) => {
  return (
    <aside className="w-fit flex flex-col gap-4">
      <div className="rounded-3xl bg-surface p-6 shadow-sm">
        <div className="w-fit flex items-center gap-4">
          <RectangleHorizontal size={22} className="text-text-secondary" />
          <span className="text-xl font-medium text-text-secondary">Service Evaluation Form</span>
        </div>
      </div>
      
      {/* Pass down live questions array */}
      <QuestionList questions={questions} onDeleteQuestion={onDeleteQuestion} />
      
      <PagesPanel activePage={selectedPage} onSelectPage={setSelectedPage} />
    </aside>
  );
};

export default BuilderSidebar;