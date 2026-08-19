import { useState } from "react";

import BuilderNavbar from "./components/BuilderNavbar";
import BuilderSidebar from "./components/BuilderSidebar";
import BuilderContent from "./components/BuilderContent";
import AnswerSidebar from "./components/AnswerSidebar";

const FormBuilder = () => {
  const [selectedPage, setSelectedPage] = useState("welcome");

  return (
    <div className="min-h-screen bg-background">
      <BuilderNavbar />

      <div className="flex gap-6 p-6">
        <BuilderSidebar
          selectedPage={selectedPage}
          setSelectedPage={setSelectedPage}
        />

        <BuilderContent
          selectedPage={selectedPage}
        />

        <AnswerSidebar />
      </div>
    </div>
  );
};

export default FormBuilder;