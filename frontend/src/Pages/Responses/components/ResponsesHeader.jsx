import ViewSwitcher from "./ViewSwitcher";
import DownloadButton from "./DownloadButton";

const ResponsesHeader = ({ title, view, onViewChange, onDownload, downloadDisabled }) => (
  <>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl font-medium text-text">{title}</h1>

      <div className="flex items-center gap-3">
        <ViewSwitcher view={view} setView={onViewChange} />
        <DownloadButton onClick={onDownload} disabled={downloadDisabled} />
      </div>
    </div>
    <div className="mt-5 h-px bg-divider" />
  </>
);

export default ResponsesHeader;