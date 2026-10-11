const FormHeader = ({ title = "", description = "", onChange = () => {} }) => {
  return (
    <div className="mb-8">

      <input
        value={title}
        onChange={(event) => onChange({ title: event.target.value })}
        maxLength={200}
        aria-label="Page title"
        className="w-full bg-transparent text-4xl font-semibold text-text outline-none"
      />

      <textarea
        rows={2}
        value={description}
        onChange={(event) => onChange({ description: event.target.value })}
        maxLength={1000}
        placeholder="Write a short description..."
        className="mt-4 w-full resize-none rounded-xl border border-border bg-background p-4 text-text outline-none focus:border-primary"
      />

    </div>
  );
};

export default FormHeader;
