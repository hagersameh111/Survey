import { useState } from "react";
import { ChevronDown, ChevronRight, LayoutList, Trash2 } from "lucide-react";

const QuestionList = ({ questions = [], selectedQuestionId, onDeleteQuestion, onSelectQuestion }) => {
  // Set to true so the list is collapsed by default
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      {/* Header / Toggle Area */}
      <div 
        className="flex cursor-pointer items-center justify-between transition-opacity hover:opacity-80"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <LayoutList size={20} className="text-text-secondary" />
          <h2 className="text-xl font-bold text-text">Questions List</h2>
        </div>
        <button className="text-text-muted transition hover:text-primary">
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="mt-5 space-y-2">
          {questions.length === 0 ? (
            <p className="text-sm text-text-muted px-2">No questions added yet.</p>
          ) : (
            questions.map((q, index) => (
              <div 
                key={q.id} 
                onClick={() => onSelectQuestion(q.id)}
                className={`group flex cursor-pointer items-center justify-between rounded-2xl px-4 py-3 transition border-2 shadow-xs ${selectedQuestionId === q.id ? "border-primary/40 bg-white" : "border-transparent bg-[#F4F8FF] hover:border-primary/20 hover:bg-white"}`}
              >
                <span className="truncate text-sm font-medium text-text">
                  {index + 1}. {q.title || "Untitled Question"}
                </span>
                
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteQuestion && onDeleteQuestion(q.id);
                  }}
                  className="text-text-muted opacity-0 transition group-hover:opacity-100 hover:text-red-500"
                  aria-label={`Delete question ${index + 1}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionList;
