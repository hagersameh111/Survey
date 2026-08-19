import { useState } from "react";

import BuilderNavbar from "./components/BuilderNavbar";
import BuilderSidebar from "./components/BuilderSidebar";
import BuilderContent from "./Components/BuilderContent";
import AnswerSidebar from "./components/AnswerSidebar";
import BioAnswerSidebar from "./components/BioAnswerSidebar";
import { initialQuestions } from "../../data/mockData";

const FormBuilder = () => {
  const [selectedPage, setSelectedPage] = useState("welcome");
  
  // Shared state for all questions across the builder
  const [questions, setQuestions] = useState(initialQuestions);

  const handleAddQuestion = (type) => {
    setQuestions((prev) => [
      ...prev,
      { id: Date.now(), order: prev.length + 1, title: "Untitled Question", type }
    ]);
  };

  const handleDeleteQuestion = (id) => {
    setQuestions((prev) => 
      prev
        .filter((q) => q.id !== id)
        .map((q, idx) => ({ ...q, order: idx + 1 })) // re-index orders
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <BuilderNavbar />

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

        {selectedPage === "bio" ? (
          <BioAnswerSidebar />
        ) : selectedPage === "questions" ? (
          <AnswerSidebar />
        ) : (
          <aside className="w-[300px] rounded-3xl bg-[#F8FAFD] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-text">Settings</h2>
            <p className="mt-5 text-text-muted">No configuration options for this page type.</p>
          </aside>
        )}
      </div>
    </div>
  );
};

export default FormBuilder;