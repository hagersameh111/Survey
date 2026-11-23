import { useEffect, useMemo, useRef, useState } from "react";

import UrlRow from "./UrlRow";
import FileRow from "./FileRow";
import AddNewButton from "./AddNewButton";
import AddNewMenu from "./AddNewMenu";
import QRModal from "./QRModal"; // your existing modal, unchanged
import { createShortUrl, getShortUrls, updateShortUrl } from "../../../api/forms";

const newId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
const shortUrlOrigin = new URL(import.meta.env.VITE_API_URL || window.location.origin, window.location.origin).origin;

const createRow = (type) => ({
  id: newId(),
  type, // "url" | "file"
  longUrl: "",
  file: null,
  shortUrl: "",
  active: false,
  expiration: "", // yyyy-mm-dd
  expirationEnabled: false,
  createdAt: Date.now(),
});

const labelOf = (r) => (r.type === "file" ? r.file?.name || r.fileName : r.longUrl) ?? "";

const UrlList = ({ search = "", sort = "recent", statusFilter = "all" }) => {
  const [rows, setRows] = useState(() => [createRow("url"), createRow("file")]);
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [showMenu, setShowMenu] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getShortUrls().then((items) => {
      if (cancelled) return;
      const saved = items.map((item) => ({
        id: item.id,
        backendId: item.id,
        type: item.fileName ? "file" : "url",
        longUrl: item.originalUrl,
        file: null,
        fileName: item.fileName,
        shortUrl: `${shortUrlOrigin}/s/${item.code}`,
        active: item.active,
        expiration: item.expiresAt ? new Date(item.expiresAt).toISOString().slice(0, 10) : "",
        expirationEnabled: Boolean(item.expiresAt),
        createdAt: new Date(item.createdAt).getTime(),
      }));
      setRows([...saved, createRow("url"), createRow("file")]);
    }).catch((requestError) => { if (!cancelled) setError(requestError.response?.data?.message || "Could not load saved links."); });
    return () => { cancelled = true; };
  }, []);

  // Close the Add New menu on outside click / Esc
  useEffect(() => {
    const onClick = (e) => menuRef.current && !menuRef.current.contains(e.target) && setShowMenu(false);
    const onKey = (e) => e.key === "Escape" && setShowMenu(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const update = (id, patch) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const swap = (id) =>
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, type: r.type === "url" ? "file" : "url", longUrl: "", file: null, shortUrl: "", active: false }
          : r
      )
    );

  const add = (type) => {
    setRows((prev) => [...prev, createRow(type)]);
    setShowMenu(false);
  };

  const handleShorten = async (row) => {
    setError("");
    setNotice("");
    setBusyId(row.id);
    try {
      let payload;
      if (row.type === "file") {
        if (!row.file) throw new Error("Choose a file first.");
        if (row.file.size > 5 * 1024 * 1024) throw new Error("Files must be 5 MB or smaller.");
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1]);
          reader.onerror = () => reject(new Error("Could not read the selected file."));
          reader.readAsDataURL(row.file);
        });
        payload = { file: { name: row.file.name, type: row.file.type, data: base64 }, ...(row.expirationEnabled && row.expiration ? { expiresAt: new Date(`${row.expiration}T23:59:59.999Z`).toISOString() } : {}) };
      } else {
        let parsed;
        try { parsed = new URL(row.longUrl); } catch { throw new Error("Enter a valid URL."); }
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("URL must start with http:// or https://.");
        payload = { url: parsed.href, ...(row.expirationEnabled && row.expiration ? { expiresAt: new Date(`${row.expiration}T23:59:59.999Z`).toISOString() } : {}) };
      }
      const created = await createShortUrl(payload);
      update(row.id, { backendId: created.id, shortUrl: `${shortUrlOrigin}/s/${created.code}`, active: true, createdAt: new Date(created.createdAt).getTime(), fileName: created.fileName });
      setNotice("Short link created.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Could not create the short link.");
    } finally { setBusyId(null); }
  };

  const handleSave = async (row) => {
    if (!row.backendId) return;
    setError("");
    try {
      const updated = await updateShortUrl(row.backendId, { active: row.active, expiresAt: row.expirationEnabled && row.expiration ? new Date(`${row.expiration}T23:59:59.999Z`).toISOString() : null });
      update(row.id, { active: updated.active, expiration: updated.expiresAt ? new Date(updated.expiresAt).toISOString().slice(0, 10) : "" });
      setNotice("Short link settings saved.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not save link settings.");
    }
  };

  // Search + sort. Finished links are sorted; empty drafts stay at the bottom so typing never reorders them.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byStatus = rows.filter((row) => {
      if (statusFilter === "all") return true;
      const expired = Boolean(row.expiration && row.expiration < today);
      if (statusFilter === "expired") return expired;
      if (!row.shortUrl || expired) return false;
      return statusFilter === "active" ? row.active : !row.active;
    });
    const filtered = byStatus.filter(
      (r) => !q || [labelOf(r), r.shortUrl].some((s) => s?.toLowerCase().includes(q))
    );
    const done = filtered.filter((r) => r.shortUrl);
    const drafts = filtered.filter((r) => !r.shortUrl);
    const compare = {
      recent: (a, b) => b.createdAt - a.createdAt,
      oldest: (a, b) => a.createdAt - b.createdAt,
      name: (a, b) => labelOf(a).localeCompare(labelOf(b)),
    }[sort];
    return [...(compare ? [...done].sort(compare) : done), ...drafts];
  }, [rows, search, sort, statusFilter, today]);

  return (
    <div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p>}
      <div className="space-y-6">
        {visible.map((row) => {
          const Row = row.type === "url" ? UrlRow : FileRow;
          return (
            <Row
              key={row.id}
              row={row}
              onChange={(patch) => update(row.id, patch)}
              onSwap={() => swap(row.id)}
              onShorten={() => handleShorten(row)}
              busy={busyId === row.id}
              onQr={() => setQrUrl(row.shortUrl)}
              onSave={() => handleSave(row)}
            />
          );
        })}
      </div>

      <div className="relative mt-6 inline-block" ref={menuRef}>
        <AddNewButton open={showMenu} onClick={() => setShowMenu((o) => !o)} />
        <div className="absolute left-0 top-full z-40 mt-3">
          <AddNewMenu
            open={showMenu}
            onCreateUrl={() => add("url")}
            onCreateFile={() => add("file")}
          />
        </div>
      </div>

      <QRModal open={qrUrl !== null} url={qrUrl ?? ""} onClose={() => setQrUrl(null)} />
    </div>
  );
};

export default UrlList;
