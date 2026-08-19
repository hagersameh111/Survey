import { X, Download } from "lucide-react";
import QRCode from "react-qr-code";

const QRModal = ({ open, onClose, url }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[600px] rounded-3xl bg-white shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-4">
          <h2 className="text-2xl font-semibold text-text">QR Code</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-text-secondary hover:bg-background hover:text-text transition">
            <X size={20} />
          </button>
        </div>

        {/* QR Code Area */}
        <div className="flex flex-col items-center px-8 py-8">
          <div className="rounded-2xl bg-white p-4">
            <QRCode value={url || "https://form.formhub.com/to/INYXidiE"} size={200} />
          </div>
          
          <a
            href={url || "https://form.formhub.com/to/INYXidiE"}
            target="_blank"
            rel="noreferrer"
            className="mt-6 text-sm text-primary underline"
          >
            {url || "https://form.formhub.com/to/INYXidiE"}
          </a>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center justify-center gap-4 px-8 pb-8">
          <button className="flex items-center gap-3 rounded-xl border border-border px-5 py-3 text-sm font-medium text-text transition hover:border-primary hover:text-primary">
            <span>Download as pdf</span>
            <Download size={16} />
          </button>

          <button className="flex items-center gap-3 rounded-xl border border-border px-5 py-3 text-sm font-medium text-text transition hover:border-primary hover:text-primary">
            <span>Download as png</span>
            <Download size={16} />
          </button>

          <button className="flex items-center gap-3 rounded-xl border border-border px-5 py-3 text-sm font-medium text-text transition hover:border-primary hover:text-primary">
            <span>Download as jpg</span>
            <Download size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default QRModal;