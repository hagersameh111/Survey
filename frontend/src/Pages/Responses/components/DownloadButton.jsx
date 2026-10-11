import { Download } from "lucide-react";

const DownloadButton = ({ onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
  >
    <Download size={18} />
    Download
  </button>
);

export default DownloadButton;