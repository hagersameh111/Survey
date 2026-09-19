import { useState } from "react";
import BuilderNavbar from "./Builder/Shared/BuilderNavbar";
import BuilderSidebar from "./Builder/Shared/BuilderSidebar";
import BuilderContent from "./Builder/BuilderContent";
import AnswerSidebar from "./Builder/Features/Questions/components/AnswerSidebar";
import BioAnswerSidebar from "./Builder/Features/ParticipantBio/components/BioAnswerSidebar";
import WelcomeSidebar from "./Builder/Features/Welcome/components/WelcomeSidebar";
import PublicForm from "../PublicForm/PublicForm";
import { initialQuestions } from "../../data/mockData";

const FormBuilder = () => {
  const [mode, setMode] = useState("builder");
  const [selectedPage, setSelectedPage] = useState("welcome");
  const [questions, setQuestions] = useState(initialQuestions || []);

  const handleAddQuestion = (type) => {
    setQuestions((prev) => [
      ...prev,
      { id: Date.now(), order: prev.length + 1, title: "", type }
    ]);
  };

  const handleDeleteQuestion = (id) => {
    setQuestions((prev) => 
      prev.filter((q) => q.id !== id).map((q, idx) => ({ ...q, order: idx + 1 }))
    );
  };

  if (mode === "preview") {
    return (
      <div className="relative min-h-screen bg-background">
        <button 
          onClick={() => setMode("builder")}
          className="absolute left-6 top-6 z-50 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-gray-800"
        >
          ← Back to Builder
        </button>
        <PublicForm questions={questions} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BuilderNavbar onPreview={() => setMode("preview")} />

      <div className="flex gap-6 p-6">
        <BuilderSidebar
          selectedPage={selectedPage}
          setSelectedPage={setSelectedPage}
          questions={questions}
          onDeleteQuestion={handleDeleteQuestion}
        />

        <BuilderContent
          selectedPage={selectedPage}
          questions={questions}
          onAddQuestion={handleAddQuestion}
          onDeleteQuestion={handleDeleteQuestion}
        />

        {selectedPage === "welcome" ? (
          <WelcomeSidebar />
        ) : selectedPage === "bio" ? (
          <BioAnswerSidebar />
        ) : selectedPage === "questions" ? (
          <AnswerSidebar />
        ) : (
          <aside className="w-[300px] flex-shrink-0 rounded-3xl bg-[#F8FAFD] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-text">Settings</h2>
            <p className="mt-5 text-sm text-text-muted">No configuration options for this page type.</p>
          </aside>
        )}
      </div>
    </div>
  );
};

export default FormBuilder;