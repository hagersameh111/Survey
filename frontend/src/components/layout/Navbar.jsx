import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { FileText, Users, Link2, ChevronRight, UserPlus, LogOut } from "lucide-react";
import InviteMembersModal from "../modals/InviteMembersModal";
import WorkspaceDropdown from "../../Pages/Dashboard/components/WorkspaceDropdown.jsx";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { useAuth } from "../../context/AuthContext";

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

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const username = user.username;
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const { user, logout } = useAuth();
  const username = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email : "Account";
  const initials = username.split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const role = user?.role ? user.role[0].toUpperCase() + user.role.slice(1) : "";

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    sessionStorage.clear();
    navigate("/login", { replace: true });
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

  return (
    <header className="px-4 pt-4">
      <nav className="flex min-h-14 flex-wrap items-center justify-between gap-y-2 rounded-2xl bg-surface px-3 py-2 shadow-sm sm:flex-nowrap sm:px-5 sm:py-0">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <NavLink to="/dashboard" className="flex items-center gap-3">
            <img src={logo} alt="FormHub" className="h-8 w-auto" />
            <span className="text-lg font-semibold text-text">FormHub</span>
          </NavLink>
          <div className="hidden h-6 w-px bg-border sm:block" />
          <WorkspaceDropdown />
        </div>

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
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 transition hover:opacity-80"
          >
            {user?.avatar ? <img src={user.avatar} alt={username} className="h-10 w-10 rounded-full object-cover" /> : <span aria-label={username} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">{initials || "A"}</span>}
            <span className="hidden font-medium text-text transition hover:text-primary sm:inline">
              {username}
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
            {role || "Profile"}
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
                  onClick={() => setMenuOpen(false)}
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
                disabled={!activeWorkspaceId}
                title={!activeWorkspaceId ? "Switch to a team workspace to invite members" : undefined}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-primary py-3 font-medium text-primary transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
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

      <InviteMembersModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        workspaceId={activeWorkspaceId}
        workspaceName={activeWorkspace?.name}
      />
    </header>
  );
};

export default Navbar;
