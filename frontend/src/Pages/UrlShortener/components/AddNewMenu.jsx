import AddNewCard from "./AddNewCard";

const AddNewMenu = ({ open, onCreateUrl, onCreateFile }) => {
  if (!open) return null;

  return (
    <div
      role="menu"
      className="w-52 rounded-2xl border border-border bg-white p-1 shadow-sm ring-4 ring-background"
    >
      <AddNewCard title="URL Shortener" onClick={onCreateUrl} />
      <div className="mx-3 border-t border-border" />
      <AddNewCard title="Link Generator for files" onClick={onCreateFile} />
    </div>
  );
};

export default AddNewMenu;