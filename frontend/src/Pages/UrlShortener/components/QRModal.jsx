import { useRef, useState } from "react";
import { X, Download, Check } from "lucide-react";
import QRCode from "react-qr-code";

const QRModal = ({ open, onClose, url }) => {
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [notice, setNotice] = useState("");
  const qrRef = useRef(null);

  if (!open) return null;

  const targetUrl = url || "https://form.formhub.com/to/INYXidiE";

  const handleDownload = async (format) => {
    setDownloadingFormat(format);
    setNotice("");
    try {
      const svg = qrRef.current?.querySelector("svg");
      if (!svg) throw new Error("QR code is not ready to download.");
      const svgUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" }));
      const image = new Image();
      image.src = svgUrl;
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
      const canvas = document.createElement("canvas");
      canvas.width = 720;
      canvas.height = 720;
      const context = canvas.getContext("2d");
      if (format === "jpg") { context.fillStyle = "#fff"; context.fillRect(0, 0, 720, 720); }
      context.drawImage(image, 0, 0, 720, 720);
      URL.revokeObjectURL(svgUrl);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, format === "jpg" ? "image/jpeg" : "image/png"));
      if (!blob) throw new Error("Could not create the QR image.");
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `survey-qr.${format}`;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);
      setNotice(`QR code downloaded as ${format.toUpperCase()}.`);
    } catch (error) {
      setNotice(error.message || "QR code download failed.");
    } finally { setDownloadingFormat(null); }
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
            <div ref={qrRef}><QRCode value={targetUrl} size={180} /></div>
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
          
          <div className="grid grid-cols-2 gap-3">
            {["png", "jpg"].map((format) => (
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
          {notice && <p role="status" className="text-sm text-text-secondary">{notice}</p>}
        </div>

      </div>
    </div>
  );
};

export default QRModal;
