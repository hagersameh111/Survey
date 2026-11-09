import WelcomePage from "./Features/Welcome/WelcomePage";
import ParticipantBioPage from "./Features/ParticipantBio/ParticipantBioPage";
import QuestionsPage from "./Features/Questions/QuestionsPage";
import FinishPage from "./Features/Finish/FinishPage";

const BuilderContent = ({ selectedPage, questions, pageContent, bioFields, settings, access, status, onAccessChange, onSettingsChange, onSaveSettings, onUpdatePage, onAddQuestion, onDeleteQuestion, onUpdateQuestion, onMoveQuestion, onDuplicate, onPreview }) => {
  switch (selectedPage) {
    case "welcome":
      return <WelcomePage page={pageContent.welcome} access={access} onUpdatePage={(changes) => onUpdatePage("welcome", changes)} />;
    case "bio":
      return <ParticipantBioPage page={pageContent.participant_info} onUpdatePage={(changes) => onUpdatePage("participant_info", changes)} bioFields={bioFields} />;
    case "questions":
      return (
        <QuestionsPage 
          questions={questions} 
          onAddQuestion={onAddQuestion} 
          onDeleteQuestion={onDeleteQuestion}
          onUpdateQuestion={onUpdateQuestion}
          onMoveQuestion={onMoveQuestion}
          onDuplicate={onDuplicate}
          onPreview={onPreview}
          page={pageContent.questions}
          onUpdatePage={(changes) => onUpdatePage("questions", changes)}
          settings={settings}
          access={access}
          status={status}
          onAccessChange={onAccessChange}
          onSettingsChange={onSettingsChange}
          onSaveSettings={onSaveSettings}
        />
      );
    case "finish":
      return <FinishPage page={pageContent.ending} onUpdatePage={(changes) => onUpdatePage("ending", changes)} />;
    default:
      return <QuestionsPage questions={questions} onAddQuestion={onAddQuestion} onDeleteQuestion={onDeleteQuestion} onUpdateQuestion={onUpdateQuestion} onMoveQuestion={onMoveQuestion} onDuplicate={onDuplicate} onPreview={onPreview} page={pageContent.questions} onUpdatePage={(changes) => onUpdatePage("questions", changes)} settings={settings} access={access} status={status} onAccessChange={onAccessChange} onSettingsChange={onSettingsChange} onSaveSettings={onSaveSettings} />;
  }
};

export default BuilderContent;
