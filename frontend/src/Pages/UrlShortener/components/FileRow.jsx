import { useRef, useState } from "react";
import { File as FileIcon } from "lucide-react";
import RowLayout from "./RowLayout";

const FileInput = ({ file, onChange }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const pick = (f) => f && onChange(f);
  const open = () => inputRef.current?.click();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && open()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        pick(e.dataTransfer.files?.[0]);
      }}
      className={`flex h-12 min-w-0 flex-1 cursor-pointer items-center rounded-xl border transition ${
        dragging ? "border-primary bg-primary-light" : "border-border bg-white"
      }`}
    >
      <div className="flex h-full w-10 shrink-0 items-center justify-center text-text-secondary">
        <FileIcon size={20} />
      </div>
      <div className="h-6 w-px shrink-0 bg-border" />
      <span className={`truncate px-4 text-sm ${file ? "text-text" : "text-text-muted"}`}>
        {file ? file.name : "Upload file or Drag & Drop here"}
      </span>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
};

const FileRow = ({ row, onChange, onSwap, onShorten, onQr, onSave }) => (
  <RowLayout
    row={row}
    onChange={onChange}
    onSwap={onSwap}
    onQr={onQr}
    onSave={onSave}
    source={<FileInput file={row.file} onChange={(file) => onChange({ file })} />}
    actionLabel="Generate URL"
    actionDisabled={!row.file}
    onAction={onShorten}
  />
);

export default FileRow;