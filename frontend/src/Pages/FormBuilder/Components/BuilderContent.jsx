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
      return <WelcomePage />;
  }
};

export default BuilderContent;