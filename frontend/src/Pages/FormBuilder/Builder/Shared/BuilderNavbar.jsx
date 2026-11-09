import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Copy, Eye } from "lucide-react";
import logo from "/logo.png";
import PublishModal from "../../Components/PublishModal";
import { getCurrentUser } from "../../../../api/auth";

const BuilderNavbar = ({ onSave, onPreview, onDuplicate, onPublish, onCloseForm, onReopenForm, status = "draft", isSaving = false, publishOpen, onPublishOpenChange, formUrl }) => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    let active = true;
    if (localStorage.getItem("token")) getCurrentUser().then((currentUser) => { if (active) setUser(currentUser); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const userName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Account";

  return (
    <>
      <header className="border-b border-border bg-surface">
        <nav className="mx-auto flex h-20 items-center justify-between px-8">
          <NavLink to="/dashboard" className="flex items-center gap-3" aria-label="Go to dashboard">
            <img src={logo} alt="FormHub" className="h-9" />
            <span className="text-xl font-semibold text-text">FormHub</span>
          </NavLink>

          <div className="flex items-center gap-10">
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || status !== "draft"}
              className="rounded-xl border border-border px-6 py-3 font-medium text-text transition hover:border-primary hover:text-primary disabled:cursor-wait disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save draft"}
            </button>
            <button type="button" onClick={onPreview} className="flex items-center gap-2 text-text-secondary transition hover:text-primary">
              <Eye size={18} />
              Preview
            </button>
            <button type="button" onClick={onDuplicate} className="flex items-center gap-2 text-text-secondary transition hover:text-primary">
              <Copy size={18} />
              Duplicate
            </button>
            {status === "draft" && <button
              onClick={onPublish}
              disabled={isSaving}
              className="rounded-xl bg-primary px-7 py-3 font-medium text-white transition hover:bg-primary-hover"
            >
              Publish form
            </button>}
            {status === "published" && <button type="button" onClick={onCloseForm} disabled={isSaving} className="rounded-xl border border-border px-5 py-3 font-medium text-text transition hover:border-primary hover:text-primary disabled:opacity-60">Close form</button>}
            {status === "closed" && <button type="button" onClick={onReopenForm} disabled={isSaving} className="rounded-xl bg-primary px-5 py-3 font-medium text-white transition hover:bg-primary-hover disabled:opacity-60">Reopen form</button>}
          </div>

          <Link to="/account-settings" className="flex items-center gap-3 transition hover:opacity-80">
            {user?.avatar ? <img src={user.avatar} alt="" className="h-12 w-12 rounded-full object-cover" /> : <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light font-semibold text-primary">{userName.slice(0, 1).toUpperCase()}</span>}
            <span className="font-medium text-text">{userName}</span>
          </Link>
        </nav>
      </header>

      <PublishModal 
        open={publishOpen} 
        onClose={() => onPublishOpenChange(false)}
        formUrl={formUrl}
      />
    </>
  );
};

export default BuilderNavbar;
