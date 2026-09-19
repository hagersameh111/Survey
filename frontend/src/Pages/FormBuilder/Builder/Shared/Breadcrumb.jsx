import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const Breadcrumb = () => {
  return (
    <div className="mb-8 flex items-center gap-2 text-sm">

      <Link
        to="/"
        className="text-text-muted hover:text-primary"
      >
        Dashboard
      </Link>

      <ChevronRight
        size={16}
        className="text-text-muted"
      />

      <span className="font-medium text-text">
        New Form
      </span>

    </div>
  );
};

export default Breadcrumb;