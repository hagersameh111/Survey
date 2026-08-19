import { NavLink } from "react-router-dom";
import { Copy } from "lucide-react";
import logo from "/logo.png"; // Ensure logo.png is moved inside src/assets/

const BuilderNavbar = () => {
  return (
    <header className="border-b border-border bg-surface">
      <nav className="mx-auto flex h-20 items-center justify-between px-8">
        <NavLink to="/" className="flex items-center gap-3">
          <img src={logo} alt="FormHub" className="h-9" />
          <span className="text-xl font-semibold text-text">FormHub</span>
        </NavLink>

        <div className="flex items-center gap-10">
          <button className="flex items-center gap-2 text-text-secondary transition hover:text-primary">
            <Copy size={18} />
            Duplicate
          </button>
          <button className="rounded-xl bg-primary px-7 py-3 font-medium text-white transition hover:bg-primary-hover">
            Publish form
          </button>
        </div>

        <button className="flex items-center gap-3">
          <img src="https://i.pravatar.cc/150?img=12" alt="User" className="h-12 w-12 rounded-full object-cover" />
          <span className="font-medium text-text">Username88</span>
        </button>
      </nav>
    </header>
  );
};

export default BuilderNavbar;