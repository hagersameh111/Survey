import { useState } from "react";

import ViewSwitcher from "./ViewSwitcher";
import DownloadButton from "./DownloadButton";

const ResponsesHeader = () => {
  const [view, setView] = useState("list");

  return (
    <div className="mb-8 flex items-center justify-between">

      <div>

        <h1 className="text-5xl font-semibold text-text">
          All Responses
        </h1>

      </div>

      <div className="flex items-center gap-4">

        <ViewSwitcher
          view={view}
          setView={setView}
        />

        <DownloadButton
          onClick={() => console.log("Download")}
        />

      </div>

    </div>
  );
};

export default ResponsesHeader;