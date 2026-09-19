import WelcomePage from "../pages/WelcomePage";
import QuestionsPage from "../pages/QuestionsPage";
import ParticipantBioPage from "./ParticipantBioPage";
import FinishPage from "../pages/FinishPage";

const BuilderContent = ({ selectedPage, questions, onAddQuestion, onDeleteQuestion }) => {
  switch (selectedPage) {
    case "welcome":
      return <WelcomePage />;
    case "bio":
      return <ParticipantBioPage />;
    case "questions":
      return (
        <QuestionsPage 
          questions={questions} 
          onAddQuestion={onAddQuestion} 
          onDeleteQuestion={onDeleteQuestion} 
        />
      );
    case "finish":
      return <FinishPage />;
    default:
      // Fallback ensures a page always renders
      return (
        <QuestionsPage 
        className="w-full"
          questions={questions} 
          onAddQuestion={onAddQuestion} 
          onDeleteQuestion={onDeleteQuestion} 
        />
      );
  }
};

export default BuilderContent;