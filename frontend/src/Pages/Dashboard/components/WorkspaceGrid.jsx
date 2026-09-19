import { FileText, MoreVertical, Users, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const WorkspaceGrid = ({ forms = [] }) => {
  // Default mock form matching your project naming conventions
  const displayForms = forms.length > 0 ? forms : [
    {
      id: 1,
      title: "Service Evaluation Form",
      responsesCount: 8,
      status: "Active",
      updatedAt: "Jun 17, 2026",
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {displayForms.map((form) => (
        <div
          key={form.id}
          className="group relative flex flex-col justify-between rounded-3xl border border-border bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:border-primary hover:shadow-md"
        >
          {/* Card Top */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
                <FileText size={24} />
              </div>
              <button className="text-text-muted hover:text-text transition p-1">
                <MoreVertical size={18} />
              </button>
            </div>

            <h3 className="text-lg font-semibold text-text group-hover:text-primary transition">
              {form.title}
            </h3>
            <p className="text-xs text-text-muted mt-1">Last modified {form.updatedAt}</p>
          </div>

          {/* Card Bottom / Metrics */}
          <div className="mt-8 pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <Users size={16} className="text-primary" />
              <span>{form.responsesCount} responses</span>
            </div>

            <Link
              to="/form-builder"
              className="flex items-center gap-1 text-xs font-semibold text-primary transition hover:underline"
            >
              <span>Open Builder</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkspaceGrid;