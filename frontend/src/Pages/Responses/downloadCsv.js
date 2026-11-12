const COLUMNS = [
  ["Name", "name"],
  ["Survey", "survey"],
  ["Email", "email"],
  ["Phone", "phone"],
  ["Age", "age"],
  ["Last Response", "lastResponse"],
  ["Rating", "rating"],
];

const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export default function downloadCsv(rows, filename = "responses.csv") {
  const lines = [
    COLUMNS.map(([h]) => esc(h)).join(","),
    ...rows.map((r) => COLUMNS.map(([, key]) => esc(r[key])).join(",")),
  ];
  const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}