import { ArrowRight } from "lucide-react";
import { DEFAULT_BUTTON_TEXT, isLinked } from "./nextForm";

// Use `preview` inside the builder so clicking doesn't leave the editor.
// Use it without `preview` on the real public finish page.
const NextFormButton = ({ nextForm, preview = false }) => {
  if (!isLinked(nextForm)) return null;

  return (
    <a
      href={nextForm.url}
      onClick={preview ? (e) => e.preventDefault() : undefined}
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 font-semibold text-white transition hover:bg-primary-hover"
    >
      {nextForm.buttonText || DEFAULT_BUTTON_TEXT}
      <ArrowRight size={18} />
    </a>
  );
};

export default NextFormButton;