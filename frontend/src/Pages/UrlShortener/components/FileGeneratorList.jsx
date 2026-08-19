import { useState } from "react";
import { FileText, Copy, Trash2, Upload, Check } from "lucide-react";

const FileGeneratorList = () => {
  const [files, setFiles] = useState([
    {
      id: 1,
      name: "Survey_Research_Guidelines.pdf",
      size: "2.4 MB",
      shortUrl: "https://forms.formhub.com/file/sec-99281a",
      date: "Jun 18, 2026",
    },
  ]);
  const [copiedId, setCopiedId] = useState(null);

  const copyToClipboard = (id, url) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Upload Box */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-semibold text-text">Link Generator</h2>
          <p className="text-xs text-text-muted mt-0.5">Generate secure tracking links for uploaded files</p>
        </div>
        <label className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-hover cursor-pointer">
          <Upload size={16} />
          <span>Upload New File</span>
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              if (e.target.files[0]) {
                const newFile = {
                  id: Date.now(),
                  name: e.target.files[0].name,
                  size: `${(e.target.files[0].size / (1024 * 1024)).toFixed(1)} MB`,
                  shortUrl: `https://forms.formhub.com/file/sec-${Math.random().toString(36).substring(7)}`,
                  date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                };
                setFiles((prev) => [...prev, newFile]);
              }
            }}
          />
        </label>
      </div>

      {/* Files List Container */}
      <div className="space-y-3">
        {files.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-surface border border-border">
            <p className="text-sm text-text-muted">No secure file links generated yet. Click upload to start.</p>
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-2xl bg-surface p-5 border border-border shadow-xs transition hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <FileText size={22} />
                </div>
                <div>
                  <h4 className="font-semibold text-text text-sm">{file.name}</h4>
                  <p className="text-xs text-text-muted mt-0.5">
                    {file.size} • Generated on {file.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  readOnly
                  value={file.shortUrl}
                  className="w-72 rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-text-secondary outline-none"
                />
                <button
                  onClick={() => copyToClipboard(file.id, file.shortUrl)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white transition hover:border-primary hover:text-primary"
                  title="Copy Link"
                >
                  {copiedId === file.id ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white transition hover:border-red-500 hover:text-red-500"
                  title="Delete Link"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileGeneratorList;