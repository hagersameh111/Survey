// Link to another form, saved on the finish page as page.nextForm:
// { enabled, formId, formName, url, buttonText }
export const DEFAULT_BUTTON_TEXT = "Continue to next form";

// Prefer the form's short link; otherwise build the public form URL.
// Change the fallback if your public route differs from /view?form=<id>.
export const getNextFormUrl = (form) =>
  form?.shortUrl || (form?.id ? `${window.location.origin}/view?form=${form.id}` : "");

export const isLinked = (nextForm) => Boolean(nextForm?.enabled && nextForm?.url);