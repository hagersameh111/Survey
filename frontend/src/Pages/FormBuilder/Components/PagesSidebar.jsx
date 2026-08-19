import { Plus, FileText } from "lucide-react";

const pages = [
  {
    id: 1,
    title: "Welcome Page",
  },
  {
    id: 2,
    title: "Participant Bio",
  },
  {
    id: 3,
    title: "Finish Page",
  },
];

const PagesSidebar = () => {
  return (
    <aside className="w-72">

      {/* Form Name */}

      <div className="mb-5 rounded-2xl bg-surface p-5 shadow-sm">

        <div className="flex items-center gap-3">

          <FileText
            size={20}
            className="text-text-secondary"
          />

          <span className="font-medium text-text-secondary">
            Service Evaluation Form
          </span>

        </div>

      </div>

      {/* Pages */}

      <div className="rounded-2xl bg-surface p-5 shadow-sm">

        <h2 className="mb-6 text-xl font-semibold text-text">
          Pages
        </h2>

        <div className="space-y-2">

          {pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between rounded-xl py-4 transition hover:bg-background"
            >

              <span className="text-lg text-text">
                {page.title}
              </span>

              <button className="rounded-xl border border-border p-2 transition hover:border-primary hover:text-primary">

                <Plus size={20} />

              </button>

            </div>
          ))}

        </div>

      </div>

    </aside>
  );
};

export default PagesSidebar;