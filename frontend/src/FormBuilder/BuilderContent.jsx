import WelcomePage from "./pages/WelcomePage";
import QuestionsPage from "./pages/QuestionsPage";
import FinishPage from "./pages/FinishPage";

const BuilderContent = ({
  selectedPage,
}) => {
  switch (selectedPage) {
    case "welcome":
      return <WelcomePage />;

    case "questions":
      return <QuestionsPage />;

   

    default:
      return <WelcomePage />;
  }
};

export default BuilderContent;