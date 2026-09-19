import { useState } from "react";
import { X, Download, Check, FileText, Image as ImageIcon } from "lucide-react";
import QRCode from "react-qr-code";

const QRModal = ({ open, onClose, url }) => {
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  if (!open) return null;

  const targetUrl = url || "https://form.formhub.com/to/INYXidiE";

  const handleDownload = (format) => {
    setDownloadingFormat(format);
    
    // Simulate export process
    setTimeout(() => {
      setDownloadingFormat(null);
      alert(`Successfully downloaded QR Code as .${format.toUpperCase()}`);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-text">QR Code Generator</h2>
            <p className="text-xs text-text-secondary mt-0.5">Scan or export code for marketing materials</p>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-lg p-2 text-text-secondary hover:bg-background hover:text-text transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* QR Display Area */}
        <div className="flex flex-col items-center p-8 bg-background/50">
          <div className="rounded-2xl bg-white p-6 shadow-xs border border-border flex items-center justify-center">
            <QRCode value={targetUrl} size={180} />
          </div>
          
          <a
            href={targetUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 text-sm font-medium text-primary underline truncate max-w-xs text-center"
          >
            {targetUrl}
          </a>
        </div>

        {/* Export / Download Options */}
        <div className="p-8 bg-white border-t border-border space-y-4">
          <label className="block text-xs font-semibold text-text uppercase tracking-wider">Export Formats</label>
          
          <div className="grid grid-cols-3 gap-3">
            {["pdf", "png", "jpg"].map((format) => (
              <button
                key={format}
                onClick={() => handleDownload(format)}
                disabled={downloadingFormat === format}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-text transition hover:border-primary hover:text-primary cursor-pointer disabled:opacity-50"
              >
                {downloadingFormat === format ? (
                  <Check size={16} className="text-green-600 animate-bounce" />
                ) : (
                  <Download size={16} className="text-text-muted" />
                )}
                <span>.{format.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default QRModal;