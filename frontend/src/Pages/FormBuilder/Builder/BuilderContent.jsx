import WelcomePage from "./Features/Welcome/WelcomePage";
import ParticipantBioPage from "./Features/ParticipantBio/ParticipantBioPage";
import QuestionsPage from "./Features/Questions/QuestionsPage";
import FinishPage from "./Features/Finish/FinishPage";

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
      return <QuestionsPage questions={questions} onAddQuestion={onAddQuestion} onDeleteQuestion={onDeleteQuestion} />;
  }
};

export default BuilderContent;