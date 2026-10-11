import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { FileText, Users, Link2, ChevronRight, UserPlus, LogOut } from "lucide-react";
import InviteMembersModal from "../modals/InviteMembersModal";

import logo from "/logo.png";
// import logo from "../../assets/images/logo.png";

const navLinks = [
  { title: "Forms", icon: FileText, path: "/dashboard" },
  { title: "Responses", icon: Users, path: "/responses" },
  { title: "URL Links Shortener", icon: Link2, path: "/shortener" },
];

const menuItems = [
  { title: "Account Settings", path: "/account-settings" },
  { title: "All Members", path: "/admin" },
];

const Navbar = ({
  user = {
    username: "Username88",
    role: "Admin",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    setMenuOpen(false);
    // Clear whatever your login stores. Change "token" if you use another key.
    localStorage.removeItem("token");
    sessionStorage.clear();
    navigate("/", { replace: true }); // "/" is your Login route
  };

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Close when the route changes
  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <header className="px-4 pt-4">
      <nav className="flex min-h-14 flex-wrap items-center justify-between gap-y-2 rounded-2xl bg-surface px-3 py-2 shadow-sm sm:flex-nowrap sm:px-5 sm:py-0">
        {/* Logo */}
        <NavLink to="/dashboard" className="flex items-center gap-3">
          <img src={logo} alt="FormHub" className="h-8 w-auto" />
          <span className="text-lg font-semibold text-text">FormHub</span>
        </NavLink>

        {/* Navigation */}
        <div className="order-3 flex w-full items-center gap-1 overflow-x-auto pb-1 sm:order-none sm:w-auto sm:gap-2 sm:overflow-visible sm:pb-0">
          {navLinks.map(({ title, icon: Icon, path }) => (
            <NavLink
              key={title}
              to={path}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-all sm:px-4 sm:text-sm
                ${
                  isActive
                    ? "bg-primary-light text-primary"
                    : "text-text-secondary hover:bg-background hover:text-primary"
                }`
              }
            >
              <Icon size={18} />
              <span className="hidden sm:inline">{title}</span>
            </NavLink>
          ))}
        </div>

        {/* User */}
        <div className="relative flex items-center gap-3" ref={menuRef}>
          <Link
            to="/account-settings"
            className="flex items-center gap-3 transition hover:opacity-80"
          >
            <img
              src={user.avatar}
              alt={user.username}
              className="h-10 w-10 rounded-full object-cover"
            />
            <span className="hidden font-medium text-text transition hover:text-primary sm:inline">
              {user.username}
            </span>
          </Link>

          {/* Role badge: opens the menu */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className={`rounded-lg border bg-white px-3 py-1.5 text-sm transition ${
              menuOpen
                ? "border-primary text-primary"
                : "border-border text-text-secondary hover:border-primary"
            }`}
          >
            {user.role}
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-border bg-white p-4 shadow-xl"
            >
              {menuItems.map(({ title, path }, i) => (
                <Link
                  key={title}
                  to={path}
                  role="menuitem"
                  className={`flex items-center justify-between py-4 text-text transition hover:text-primary ${
                    i > 0 ? "border-t border-divider" : ""
                  }`}
                >
                  <span>{title}</span>
                  <ChevronRight size={18} />
                </Link>
              ))}

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setShowInviteModal(true);
                }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-primary py-3 font-medium text-primary transition hover:bg-primary-light"
              >
                <UserPlus size={18} />
                Invite Members
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-medium text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={18} />
                Log out
              </button>
            </div>
          )}
        </div>
      </nav>

      <InviteMembersModal open={showInviteModal} onClose={() => setShowInviteModal(false)} />
    </header>
  );
};

export default Navbar;
