import { NavLink } from "react-router-dom";
import { FileText, Users, Link2 } from "lucide-react";

import logo from "/logo.png";
// import logo from "../../assets/images/logo.png";

const Navbar = ({
  user = {
    username: "Username88",
    role: "Admin",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
}) => {
  const navLinks = [
    {
      title: "Forms",
      icon: FileText,
      path: "/form-builder",
    },
    {
      title: "Responses",
      icon: Users,
      path: "/responses",
    },
    {
      title: "URL Links Shortener",
      icon: Link2,
      path: "/shortener",
    },
  ];

  return (
    <header className="px-4 pt-4">
      <nav className="flex h-14 items-center justify-between rounded-2xl bg-surface px-5 shadow-sm">
        {/* Logo */}

        <NavLink
          to="/"
          className="flex items-center gap-3"
        >
          <img
            src={logo}
            alt="FormHub"
            className="h-8 w-auto"
          />

          <span className="text-lg font-semibold text-text">
            FormHub
          </span>
        </NavLink>

        {/* Navigation */}

        <div className="flex items-center gap-2">
          {navLinks.map(({ title, icon: Icon, path }) => (
            <NavLink
              key={title}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all
                ${
                  isActive
                    ? "bg-primary-light text-primary"
                    : "text-text-secondary hover:bg-background hover:text-primary"
                }`
              }
            >
              <Icon size={18} />

              {title}
            </NavLink>
          ))}
        </div>

        {/* User */}

        <div className="flex items-center gap-3">
          <img
            src={user.avatar}
            alt={user.username}
            className="h-10 w-10 rounded-full object-cover"
          />

          <span className="font-medium text-text">
            {user.username}
          </span>

          <div className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-text-secondary">
            {user.role}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;