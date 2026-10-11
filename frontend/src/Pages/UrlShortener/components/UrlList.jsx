import { useEffect, useMemo, useRef, useState } from "react";

import UrlRow from "./UrlRow";
import FileRow from "./FileRow";
import AddNewButton from "./AddNewButton";
import AddNewMenu from "./AddNewMenu";
import QRModal from "./QRModal"; // your existing modal, unchanged

const newId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

const createRow = (type) => ({
  id: newId(),
  type, // "url" | "file"
  longUrl: "",
  file: null,
  shortUrl: "",
  active: false,
  expiration: "", // yyyy-mm-dd
  createdAt: Date.now(),
});

const labelOf = (r) => (r.type === "file" ? r.file?.name : r.longUrl) ?? "";

const UrlList = ({ search = "", sort = "recent" }) => {
  const [rows, setRows] = useState(() => [createRow("url"), createRow("file")]);
  const [showMenu, setShowMenu] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);
  const menuRef = useRef(null);

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

  const handleShorten = (row) => {
    // TODO: call your backend with row.longUrl (or row.file), then:
    // update(row.id, { shortUrl: data.shortUrl, active: true });
    console.log("Shorten:", row.type === "file" ? row.file : row.longUrl);
  };

  const handleSave = (row) => {
    // TODO: persist { shortUrl, active, expiration } to your backend
    console.log("Save row:", row);
  };

  // Search + sort. Finished links are sorted; empty drafts stay at the bottom so typing never reorders them.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = rows.filter(
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
  }, [rows, search, sort]);

  return (
    <div>
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