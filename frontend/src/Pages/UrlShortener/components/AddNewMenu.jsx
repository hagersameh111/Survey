import AddNewCard from "./AddNewCard";

const AddNewMenu = ({
  open,
  onCreateUrl,
  onCreateFile,
}) => {
  if (!open) return null;

  return (
    <div className="mt-6 flex gap-6">

      <AddNewCard
        title="URL Shortener"
        description="Generate shortened links from URLs."
        onClick={onCreateUrl}
      />

      <AddNewCard
        title="Link Generator"
        description="Generate secure links for uploaded files."
        onClick={onCreateFile}
      />

    </div>
  );
};

export default AddNewMenu;