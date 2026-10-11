import { useState } from "react";
import { X, Copy, Check, Globe, Code, Share2 } from "lucide-react";

const PublishModal = ({ open, onClose, formUrl = `${window.location.origin}/view` }) => {
  const [copied, setCopied] = useState("");

  if (!open) return null;

  const copy = async (value, label) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) await navigator.share({ title: "FormHub survey", url: formUrl });
    else await copy(formUrl, "link");
  };

  const embedCode = `<iframe src="${formUrl}" title="FormHub survey" width="100%" height="700" frameborder="0"></iframe>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-[520px] rounded-3xl bg-white shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text">Publish Form</h2>
              <p className="text-xs text-text-secondary">Your form is ready to collect responses</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-text-secondary hover:bg-background hover:text-text transition">
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8 space-y-6">
          
          {/* Live Link Section */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text">Public Form Link</label>
            <div className="flex items-center overflow-hidden rounded-xl border border-border bg-background">
              <input
                type="text"
                readOnly
                value={formUrl}
                className="flex-1 bg-transparent px-4 py-3 text-sm text-text outline-none"
              />
              <button
                onClick={() => copy(formUrl, "link")}
                className="flex items-center gap-2 bg-primary px-5 py-3 font-medium text-white transition hover:bg-primary-hover"
              >
                {copied === "link" ? <Check size={18} /> : <Copy size={18} />}
                <span>{copied === "link" ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Share Options */}
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={handleShare} className="flex items-center gap-3 rounded-2xl border border-border p-4 transition hover:border-primary hover:bg-primary-light/20 text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-primary">
                <Share2 size={18} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text">Share Link</h4>
                <p className="text-xs text-text-muted">{copied === "link" ? "Link copied" : "Send via email or social"}</p>
              </div>
            </button>

            <button type="button" onClick={() => copy(embedCode, "embed")} className="flex items-center gap-3 rounded-2xl border border-border p-4 transition hover:border-primary hover:bg-primary-light/20 text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-primary">
                <Code size={18} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text">Embed Code</h4>
                <p className="text-xs text-text-muted">{copied === "embed" ? "Embed code copied" : "Copy embed code"}</p>
              </div>
            </button>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 bg-background border-t border-border">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-text transition hover:bg-surface"
          >
            Close
          </button>
          <a
            href={formUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            Open Live Form
          </a>
        </div>

      </div>
    </div>
  );
};

export default PublishModal;
