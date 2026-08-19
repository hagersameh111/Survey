import { Plus, FileText, CheckCircle, Layout, User } from "lucide-react";

const pages = [
  { id: "welcome", title: "Welcome Page", icon: FileText },
  { id: "bio", title: "Participant Bio", icon: User },
  { id: "questions", title: "Questions Page", icon: Layout },
  { id: "finish", title: "Finish Page", icon: CheckCircle },
];

const PagesSidebar = ({ selectedPage, onSelectPage }) => {
  return (
    <aside className="w-72">
      {/* Form Name */}
      <div className="mb-5 rounded-2xl bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-text-secondary" />
          <span className="font-medium text-text-secondary">
            Service Evaluation Form
          </span>
        </div>
      </div>

      {/* Pages */}
      <div className="rounded-2xl bg-surface p-5 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold text-text">Pages</h2>

        <div className="space-y-2">
          {pages.map((page) => {
            const isSelected = selectedPage === page.id;
            const Icon = page.icon;

            return (
              <div
                key={page.id}
                onClick={() => onSelectPage(page.id)}
                className={`flex cursor-pointer items-center justify-between rounded-xl px-4 py-3 transition-all ${
                  isSelected
                    ? "bg-primary-light text-primary border border-primary/30 shadow-xs"
                    : "hover:bg-background text-text"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isSelected ? "text-primary" : "text-text-secondary"} />
                  <span className={`font-medium ${isSelected ? "text-primary" : "text-text"}`}>
                    {page.title}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle add sub-page logic here if needed
                  }}
                  className="rounded-xl border border-border p-2 transition hover:border-primary hover:text-primary"
                >
                  <Plus size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default PagesSidebar;