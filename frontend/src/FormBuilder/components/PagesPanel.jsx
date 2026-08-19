import { useState } from "react";
import {
  List,
  PanelLeft,
} from "lucide-react";

import PageSection from "./PageSection";
import PageItem from "./PageItem";

const PagesPanel = () => {
  const [activePage, setActivePage] =
    useState("welcome");

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
          onClick={() =>
            setActivePage("welcome")
          }
        />

      </PageSection>

      <PageSection
        title="Participant Bio"
        showAdd
      >

        <PageItem
          icon={List}
          title="Questions Page"
          active={activePage === "questions"}
          onClick={() =>
            setActivePage("questions")
          }
        />

      </PageSection>

      <PageSection
        title="Finish Page"
        showAdd
      />

    </div>
  );
};

export default PagesPanel;