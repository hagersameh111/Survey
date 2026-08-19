import {
  List,
  PanelLeft,
  CheckCircle,
  User,
} from "lucide-react";

import PageSection from "./PageSection";
import PageItem from "./PageItem";

const PagesPanel = ({ activePage, onSelectPage }) => {
  return (
    <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="mb-8 text-3xl font-bold">
        Pages
      </h2>

      <PageSection title="">
        <PageItem
          icon={PanelLeft}
          title="Welcome Page"
          active={activePage === "welcome"}
          onClick={() => onSelectPage("welcome")}
        />
      </PageSection>

      <PageSection
        title="Participant Bio"
        showAdd
      >
        <PageItem
          icon={User}
          title="Participant Bio"
          active={activePage === "bio"}
          onClick={() => onSelectPage("bio")}
        />
        <div className="mt-3">
          <PageItem
            icon={List}
            title="Questions Page"
            active={activePage === "questions"}
            onClick={() => onSelectPage("questions")}
          />
        </div>
      </PageSection>

      <PageSection
        title="Finish Page"
        showAdd
      >
        <PageItem
          icon={CheckCircle}
          title="Finish Page"
          active={activePage === "finish"}
          onClick={() => onSelectPage("finish")}
        />
      </PageSection>
    </div>
  );
};

export default PagesPanel;