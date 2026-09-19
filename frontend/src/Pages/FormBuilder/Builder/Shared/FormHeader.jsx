const FormHeader = () => {
  return (
    <div className="mb-8">

      <input
        defaultValue="Service Evaluation Form"
        className="w-full bg-transparent text-4xl font-semibold text-text outline-none"
      />

      <textarea
        rows={2}
        placeholder="Write a short description..."
        className="mt-4 w-full resize-none rounded-xl border border-border bg-background p-4 text-text outline-none focus:border-primary"
      />

    </div>
  );
};

export default FormHeader;