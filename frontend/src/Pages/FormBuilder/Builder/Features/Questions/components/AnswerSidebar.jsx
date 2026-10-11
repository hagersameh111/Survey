import { List, ChevronDown } from "lucide-react";
import SwitchToggle from "../../../Shared/SwitchToggle";

const AnswerSidebar = ({ question, onUpdateQuestion }) => {
  const labels = {
    "multiple-choice": "Multiple Choice",
    multiple: "Multiple Choice",
    checkbox: "Checkboxes",
    dropdown: "Dropdown",
    "short-answer": "Short Answer",
    short: "Short Answer",
    paragraph: "Paragraph",
    rating: "Star Rating",
    "single-choice": "Single Choice",
    email: "Email",
    phone: "Phone",
    number: "Number",
    date: "Date",
    heading: "Heading",
    text: "Text",
    image: "Image",
    divider: "Divider",
  };

  const valueFor = (key) => question?.[key] ?? question?.data?.[key] ?? "";
  const field = (key, label, type = "text") => (
    <label key={key} className="block text-sm text-text-secondary">
      <span className="mb-1 block">{label}</span>
      <input
        type={type}
        value={valueFor(key)}
        min={type === "number" ? 0 : undefined}
        onChange={(event) => onUpdateQuestion(question.id, { [key]: type === "number" ? (event.target.value === "" ? undefined : Number(event.target.value)) : event.target.value })}
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-text outline-none focus:border-primary"
      />
    </label>
  );

  return (
    <aside className="w-full rounded-3xl bg-[#F8FAFD] p-4 shadow-sm sm:p-6 lg:w-[300px]">
      <h2 className="mb-5 text-lg font-medium text-text">Answer</h2>
      
      <div className="mb-6 flex h-[52px] w-full items-center justify-between rounded-2xl border border-border bg-white px-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
            <List size={18} />
          </div>
          <span className="text-text-secondary">{labels[question?.type] || "Select a question"}</span>
        </div>
        <ChevronDown size={20} className="text-text-muted" aria-hidden="true" />
      </div>

      <div className="mb-6 h-px w-full bg-border" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-[15px] text-text-secondary">Required</span>
          <SwitchToggle checked={Boolean(question?.required)} onChange={(required) => onUpdateQuestion(question?.id, { required })} />
        </div>
        {question && <div className="space-y-4 border-t border-border pt-5">
          {(["short-answer", "short", "paragraph", "email", "phone", "number"].includes(question.type)) && field("placeholder", "Placeholder", "text")}
          {question.type === "image" && field("altText", "Alternative text", "text")}
          {(["short-answer", "short", "paragraph"].includes(question.type)) && <>
            {field("minLength", "Minimum length", "number")}
            {field("maxLength", "Maximum length", "number")}
          </>}
          {question.type === "number" && <>
            {field("min", "Minimum value", "number")}
            {field("max", "Maximum value", "number")}
          </>}
          {question.type === "date" && <>
            {field("minDate", "Earliest date", "date")}
            {field("maxDate", "Latest date", "date")}
          </>}
          {["multiple-choice", "multiple", "checkbox"].includes(question.type) && <>
            {field("maxSelections", "Maximum selections", "number")}
          </>}
          {question.type === "rating" && <label className="block text-sm text-text-secondary">
            <span className="mb-1 block">Rating style</span>
            <select value={question.style || question.data?.style || "stars"} onChange={(event) => onUpdateQuestion(question.id, { style: event.target.value })} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-text">
              <option value="stars">Stars</option><option value="numbers">Numbers</option><option value="emoji">Emoji</option>
            </select>
          </label>}
        </div>}
      </div>
    </aside>
  );
};

export default AnswerSidebar;
