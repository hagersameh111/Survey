const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const readable = (value) => Array.isArray(value) ? value.join(", ") : value == null ? "" : String(value);

export default function downloadCsv(rows, filename = "responses.csv", questions = []) {
  const byKey = new Map();
  for (const question of questions) byKey.set(question.key || question.questionId, question.title);
  for (const answer of rows.flatMap((row) => row.answers || [])) byKey.set(answer.key || answer.questionId || answer.id, answer.question || "Response");
  const usedTitles = new Map();
  const questionColumns = [...byKey].map(([key, title]) => {
    const count = (usedTitles.get(title) || 0) + 1;
    usedTitles.set(title, count);
    return { key, title: count === 1 ? title : `${title} (${count})` };
  });
  const columns = [{ title: "Respondent", key: "name" }, { title: "Survey", key: "survey" }, { title: "Email", key: "email" }, { title: "Phone", key: "phone" }, { title: "Submitted At", key: "lastResponseAt" }, ...questionColumns];
  const lines = [
    columns.map(({ title }) => esc(title)).join(","),
    ...rows.map((row) => {
      const answers = new Map((row.answers || []).map((answer) => [answer.key || answer.questionId || answer.id, answer.answer]));
      return columns.map(({ key }) => esc(key === "lastResponseAt" ? row[key] ? new Date(row[key]).toISOString() : "" : ["name", "survey", "email", "phone"].includes(key) ? row[key] : readable(answers.get(key)))).join(",");
    }),
  ];
  const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
