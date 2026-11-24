import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { previewInvitation, acceptInvitation } from "../../api/workspaces";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { refresh, setActiveWorkspaceId } = useWorkspace();
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(null);

  const isLoggedIn = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    if (!token) {
      setError("This invitation link is missing its token.");
      return;
    }
    previewInvitation(token)
      .then(setPreview)
      .catch((previewError) => setError(previewError.response?.data?.message || "This invitation could not be found."));
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError("");
    try {
      const result = await acceptInvitation(token);
      setAccepted(result);
      refresh();
      setActiveWorkspaceId(result.workspaceId);
    } catch (acceptError) {
      setError(acceptError.response?.data?.message || "Could not accept this invitation.");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm border border-border">
        <h1 className="mb-4 text-xl font-semibold text-text">Workspace invitation</h1>

        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {accepted ? (
          <>
            <p className="text-sm text-text-secondary">
              You've joined <span className="font-medium text-text">{accepted.workspaceName || "the workspace"}</span> as {accepted.role}.
            </p>
            <Link to="/dashboard" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover">
              Go to dashboard
            </Link>
          </>
        ) : preview ? (
          <>
            <p className="text-sm text-text-secondary">
              <span className="font-medium text-text">{preview.workspaceName || "A workspace"}</span> invited{" "}
              <span className="font-medium text-text">{preview.email}</span> to join.
            </p>
            {preview.status !== "pending" && (
              <p className="mt-2 text-sm text-text-muted">
                This invitation is {preview.status} and can no longer be accepted.
              </p>
            )}
            {preview.status === "pending" && !isLoggedIn && (
              <Link
                to={`/?returnTo=${encodeURIComponent(`/accept-invitation?token=${token}`)}`}
                className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
              >
                Sign in to accept
              </Link>
            )}
            {preview.status === "pending" && isLoggedIn && (
              <button
                type="button"
                onClick={handleAccept}
                disabled={accepting}
                className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {accepting ? "Accepting…" : "Accept invitation"}
              </button>
            )}
          </>
        ) : (
          !error && <p className="text-sm text-text-muted">Loading invitation…</p>
        )}
      </div>
    </div>
  );
};

export default AcceptInvitation;
