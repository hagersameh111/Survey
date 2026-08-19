import BuilderNavbar from "./components/BuilderNavbar";
import PagesSidebar from "./components/PagesSidebar";
import BuilderContent from "./Components/BuilderContent";

const FormBuilder = () => {
  return (
    <div className="min-h-screen bg-background">
      <BuilderNavbar />

      <div className="flex gap-6 p-6">

        <PagesSidebar />

        <BuilderContent />

        <aside className="w-72 rounded-2xl bg-surface p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-text">
            Answer
          </h2>

          <p className="mt-5 text-text-muted">
            Select a question to edit its answer options.
          </p>
        </aside>

      </div>
    </div>
  );
};

export default FormBuilder;