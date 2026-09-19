import { Download } from "lucide-react";

const DownloadButton = ({
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-white transition hover:bg-primary-hover"
    >
      <Download size={18} />

      Download
    </button>
  );
};

export default DownloadButton;