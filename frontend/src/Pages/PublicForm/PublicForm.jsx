import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Clock3, User, Calendar, Mail, Phone, CheckCircle2, Star } from "lucide-react";
import { getPublicForm, issueParticipantToken, saveFormFinishRating, submitFormResponse } from "../../api/forms";

const PublicForm = ({ questions: previewQuestions, bioFields: previewBioFields, pages: previewPages }) => {
  const [searchParams] = useSearchParams();
  const formId = searchParams.get("formId");
  const [form, setForm] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participantToken, setParticipantToken] = useState("");
  const [submissionResult, setSubmissionResult] = useState(null);
  const [finishRating, setFinishRating] = useState(0);
  const [ratingSaved, setRatingSaved] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [isSavingRating, setIsSavingRating] = useState(false);
  const [currentStep, setCurrentStep] = useState("welcome"); // 'welcome' -> 'bio' -> 'questions' -> 'finish'
  
  // State for form responses
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    if (!formId) { if (!previewQuestions) setFormError("This survey link is unavailable or invalid."); return; }
    let cancelled = false;
    setIsLoading(true);
    getPublicForm(formId)
      .then((loadedForm) => { if (!cancelled) setForm(loadedForm); })
      .catch((error) => { if (!cancelled) setFormError(error.response?.data?.message || "This survey could not be found or is unavailable."); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [formId]);

  const formQuestions = previewQuestions
    ? previewQuestions.map((question) => ({
      _id: question.apiId || question.id,
      type: question.backendType || ({
        "multiple-choice": "multiple_choice",
        multiple: "multiple_choice",
        checkbox: "multiple_choice",
        "short-answer": "short_text",
        short: "short_text",
        paragraph: "long_text",
      })[question.type] || question.type.replaceAll("-", "_"),
      data: {
        ...(question.data || {}),
        question: question.title,
        description: question.description,
        required: question.required,
        options: question.options,
        scale: question.scale,
        style: question.style,
      },
    }))
    : (form?.pages || []).filter((page) => page.type === "questions").flatMap((page) => page.blocks || []);
  const participantBlocks = (form?.pages || []).filter((page) => page.type === "participant_info").flatMap((page) => page.blocks || []);
  const pageList = previewPages ? Object.entries(previewPages).map(([type, page]) => ({ ...page, type })) : form?.pages || [];
  const welcomePage = pageList.find((page) => page.type === "welcome") || {};
  const bioPage = pageList.find((page) => page.type === "participant_info") || {};
  const finishPage = pageList.find((page) => page.type === "ending") || {};
  const surveyStatusMessage = ({ paused: "This survey is temporarily paused.", closed: "This survey is closed and no longer accepting responses.", expired: "This survey has expired.", inactive: "This survey is currently unavailable." })[form?.status];
  const bioDefinitions = {
    name: { label: "Full Name", type: "text", placeholder: "Enter your full name", icon: User },
    dob: { label: "Date of Birth", type: "date", placeholder: "", icon: Calendar }, age: { label: "Age", type: "number", placeholder: "Enter your age", icon: User },
    email: { label: "Email Address", type: "email", placeholder: "name@example.com", icon: Mail }, phone: { label: "Phone Number", type: "tel", placeholder: "Enter your phone number", icon: Phone },
    nationality: { label: "Nationality", type: "text", placeholder: "Enter your nationality", icon: User }, country: { label: "Country", type: "text", placeholder: "Enter your country", icon: User },
    city: { label: "City", type: "text", placeholder: "Enter your city", icon: User }, gender: { label: "Gender", type: "text", placeholder: "Enter your gender", icon: User },
    customised: { label: "Description", type: "text", placeholder: "Enter your response", icon: User },
  };
  const previewParticipantBlocks = previewBioFields
    ? Object.entries(previewBioFields).filter(([, field]) => field.enabled).map(([key, field], index) => ({
      _id: `preview-bio-${key}`,
      type: ({ name: "short_text", dob: "date", age: "number", email: "email", phone: "phone" })[key] || "short_text",
      order: index + 1,
      data: { fieldKey: key, question: field.question || bioDefinitions[key]?.label || key, required: Boolean(field.required) },
    }))
    : participantBlocks;

  const renderQuestion = (block, index) => {
    const data = block.data || {};
    const questionId = block._id || `question-${index}`;
    const value = answers[questionId] ?? "";
    const choices = ["single_choice", "multiple_choice", "dropdown"].includes(block.type);

    if (block.type === "heading") return <h3 key={questionId} className="text-lg font-semibold text-text">{data.text}</h3>;
    if (block.type === "text") return <p key={questionId} className="text-sm leading-relaxed text-text-secondary">{data.text}</p>;
    if (block.type === "divider") return <hr key={questionId} className="border-border" />;
    if (block.type === "image") return <img key={questionId} src={data.url} alt={data.altText || ""} className="max-h-96 w-full rounded-xl object-contain" />;

    return (
      <div key={questionId} className="space-y-3">
        <h3 className="text-base font-semibold text-text">{index + 1}. {data.question || "Untitled Question"}{data.required && <span className="ml-1 text-red-600" aria-label="required">*</span>}</h3>
        {data.description && <p className="text-sm text-text-secondary">{data.description}</p>}
        {block.type === "dropdown" ? (
          <select value={value} onChange={(event) => handleAnswerChange(questionId, event.target.value)} required={Boolean(data.required)} className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary">
            <option value="">Select an option</option>
            {(data.options || []).map((option, optionIndex) => <option key={`${questionId}-${optionIndex}`} value={option.label}>{option.label}</option>)}
          </select>
        ) : choices ? (
          <div className="space-y-2">
            {(data.options || []).map((option, optionIndex) => (
              <label key={`${questionId}-${optionIndex}`} className="flex items-center gap-3 rounded-xl border border-border p-3 transition hover:bg-background">
                <input
                  type={block.type === "multiple_choice" ? "checkbox" : "radio"}
                  name={questionId}
                  required={Boolean(data.required) && block.type !== "multiple_choice"}
                  checked={block.type === "multiple_choice" ? (Array.isArray(value) && value.includes(option.label)) : value === option.label}
                  onChange={() => {
                    if (block.type === "multiple_choice") {
                      const current = Array.isArray(value) ? value : [];
                      handleAnswerChange(questionId, current.includes(option.label) ? current.filter((item) => item !== option.label) : [...current, option.label]);
                    } else handleAnswerChange(questionId, option.label);
                  }}
                  className="accent-primary"
                />
                <span className="text-sm text-text-secondary">{option.label}</span>
              </label>
            ))}
          </div>
        ) : block.type === "rating" ? (
          <div role="radiogroup" aria-label={data.question || "Rating"} className="flex flex-wrap items-center gap-2">
            {Array.from({ length: Math.min(Math.max(Number(data.scale) || 5, 2), 10) }, (_, i) => i + 1).map((rating) => {
              const selected = Number(value) >= rating;
              const glyph = data.style === "emoji" ? ["😞", "☹️", "😕", "🙁", "😐", "🙂", "😊", "😄", "😍", "🤩"][Math.min(rating - 1, 9)] : data.style === "numbers" ? String(rating) : "★";
              return <button key={rating} type="button" role="radio" aria-checked={Number(value) === rating} aria-label={`${rating}`} onClick={() => handleAnswerChange(questionId, rating)} className={`flex h-11 min-w-11 items-center justify-center rounded-lg px-2 text-2xl transition ${selected ? "bg-primary-light text-primary" : "bg-background text-text-muted hover:text-primary"}`}>{glyph}</button>;
            })}
            <span className="ml-2 text-sm text-text-secondary">{value ? `${value} / ${data.scale || 5}` : "Choose a rating"}</span>
          </div>
        ) : block.type === "long_text" ? (
          <textarea
            required={Boolean(data.required)}
            minLength={data.minLength}
            maxLength={data.maxLength}
            placeholder={data.placeholder || "Type your answer here..."}
            value={value}
            onChange={(event) => handleAnswerChange(questionId, event.target.value)}
            className="min-h-28 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
          />
        ) : (
          <input
            type={block.type === "email" ? "email" : block.type === "phone" ? "tel" : block.type === "number" ? "number" : block.type === "date" ? "date" : "text"}
            required={Boolean(data.required)}
            min={block.type === "number" ? data.min : block.type === "date" ? data.minDate : undefined}
            max={block.type === "number" ? data.max : block.type === "date" ? data.maxDate : undefined}
            minLength={block.type === "short_text" || block.type === "long_text" ? data.minLength : undefined}
            maxLength={block.type === "short_text" || block.type === "long_text" ? data.maxLength : undefined}
            placeholder={data.placeholder || "Type your answer here..."}
            value={value}
            onChange={(event) => handleAnswerChange(questionId, block.type === "number" && event.target.value !== "" ? Number(event.target.value) : event.target.value)}
            className={`w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary ${block.type === "long_text" ? "min-h-28" : ""}`}
          />
        )}
      </div>
    );
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const continueToQuestions = () => {
    const missing = previewParticipantBlocks.find((block) => block.data?.required && (answers[block._id] === undefined || answers[block._id] === "" || (Array.isArray(answers[block._id]) && answers[block._id].length === 0)));
    if (missing) {
      setSubmitError(`${missing.data?.question || "Required field"} is required.`);
      return;
    }
    setSubmitError("");
    setCurrentStep("questions");
  };

  const handleSubmit = async () => {
    setSubmitError("");
    const requiredMissing = formQuestions.find((block, index) => {
      const questionId = block._id || `question-${index}`;
      const value = answers[questionId];
      return block.data?.required && (value === undefined || value === "" || (Array.isArray(value) && value.length === 0));
    });
    if (requiredMissing) {
      setSubmitError(`Please answer “${requiredMissing.data?.question || "the required question"}”.`);
      return;
    }
    if (!formId) {
      setSubmitError("Save this form before submitting a response.");
      return;
    }
    if (form?.identityMode === "identified" && !localStorage.getItem("token")) {
      setSubmitError("This form requires you to sign in before submitting.");
      return;
    }
    setIsSubmitting(true);
    try {
      const needsParticipantToken = form?.identityMode !== "identified";
      const token = needsParticipantToken
        ? participantToken || await issueParticipantToken(formId)
        : "";
      if (token) setParticipantToken(token);
      const answerableBlocks = [...participantBlocks, ...formQuestions].filter((block) => block._id && ["short_text", "long_text", "email", "phone", "number", "date", "single_choice", "multiple_choice", "dropdown", "rating"].includes(block.type));
      const answerableById = new Map(answerableBlocks.map((block) => [String(block._id), block]));
      const answerEntries = Object.entries(answers)
        .filter(([questionId, value]) => answerableById.has(questionId) && value !== undefined && value !== "")
        .map(([questionId, value]) => ({
          questionId,
          value: answerableById.get(questionId).type === "number" ? Number(value) : value,
        }));
      const result = await submitFormResponse(formId, { answers: answerEntries }, token);
      if (result?.redirect?.enabled && result.redirect.url && finishPage.ratingRequired === false) {
        window.location.assign(result.redirect.url);
        return;
      }
      setSubmissionResult(result);
      setFinishRating(0);
      setRatingSaved(false);
      setCurrentStep("finish");
    } catch (error) {
      setSubmitError(error.response?.data?.message || "Your response could not be saved. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishRating = async () => {
    if (!submissionResult?.responseId || !finishRating) return;
    setRatingError("");
    setIsSavingRating(true);
    try {
      await saveFormFinishRating(formId, submissionResult.responseId, finishRating, participantToken);
      setRatingSaved(true);
      if (submissionResult.redirect?.enabled && submissionResult.redirect.url) window.location.assign(submissionResult.redirect.url);
    } catch (error) {
      setRatingError(error.response?.data?.message || "Your rating could not be saved. Please try again.");
    } finally { setIsSavingRating(false); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between py-10 px-4">
      
      {/* Top Branding Header */}
      <header className="mx-auto max-w-2xl w-full mb-6" aria-hidden="true" />

      {/* Main Container Card */}
      <main className="mx-auto max-w-2xl w-full rounded-3xl bg-white p-8 md:p-12 shadow-sm border border-border">
        {formError && <div role="alert" className="mb-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">{formError}</div>}
        {isLoading && <p role="status" className="py-12 text-center text-sm text-text-secondary">Loading survey…</p>}
        {surveyStatusMessage && <div role="status" className="rounded-xl bg-background p-8 text-center text-text-secondary">{surveyStatusMessage}</div>}
        {submitError && <div role="alert" className="mb-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {submitError}
          {form?.identityMode === "identified" && !localStorage.getItem("token") && <Link className="ml-1 font-semibold underline" to={`/?returnTo=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`}>Sign in</Link>}
        </div>}
        
        {/* STEP 1: WELCOME PAGE */}
        {currentStep === "welcome" && !isLoading && !formError && !surveyStatusMessage && (
          <div className="text-center py-6">
            <h1 className="mb-4 text-3xl md:text-4xl font-bold text-primary">
              {welcomePage.title || "Welcome, we'd love your feedback"}
            </h1>
            <p className="mx-auto mb-8 text-base md:text-lg text-text-secondary leading-relaxed">
              {welcomePage.description || "Your honest input helps us make better decisions in the future. Please share your thoughts, every bit of feedback is appreciated."}
            </p>

            <button
              onClick={() => setCurrentStep("bio")}
              className="rounded-xl bg-primary px-10 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-primary-hover"
            >
              {welcomePage.buttonText || "Start Now"}
            </button>

            {welcomePage.config?.timeEnabled !== false && <div className="mt-6 flex items-center justify-center gap-2 text-text-muted"><Clock3 size={18} /><span className="text-sm">Takes {welcomePage.config?.time || "10 minutes"}.</span></div>}
            {welcomePage.config?.contactEnabled !== false && (welcomePage.config?.contactEmail || welcomePage.config?.contactDescription) && <div className="mx-auto mt-8 max-w-lg border-t border-border pt-6 text-center">
              <h3 className="text-sm font-semibold text-text">Contact details</h3>
              {welcomePage.config?.contactEmail && <a href={`mailto:${welcomePage.config.contactEmail}`} className="mt-1 inline-block text-sm text-primary underline">{welcomePage.config.contactEmail}</a>}
              {welcomePage.config?.contactDescription && <p className="mt-3 text-xs leading-relaxed text-text-muted">{welcomePage.config.contactDescription}</p>}
            </div>}
          </div>
        )}

        {/* STEP 2: PARTICIPANT BIO FORM */}
        {currentStep === "bio" && !isLoading && !formError && !surveyStatusMessage && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-primary">{bioPage.title || "Personal Info"}</h2>
              {bioPage.description && <p className="text-sm text-text-secondary mt-1">{bioPage.description}</p>}
            </div>

            <div className="space-y-4">
              {previewParticipantBlocks.map((block, index) => renderQuestion(block, index))}
            </div>

            <div className="pt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep("welcome")}
                className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-text-secondary hover:bg-background transition"
              >
                Back
              </button>
              <button
                onClick={continueToQuestions}
                className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
              >
                {bioPage.buttonText || "Confirm"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: QUESTIONNAIRE VIEW */}
        {currentStep === "questions" && !isLoading && !formError && !surveyStatusMessage && (
          <div className="space-y-8">
            <div className="border-b border-border pb-4">
              <h2 className="text-xl font-bold text-text">{form?.title || "Service Evaluation Questions"}</h2>
              <p className="text-xs text-text-muted mt-1">Please answer all questions honestly.</p>
            </div>

            {(previewQuestions || formId ? formQuestions : [
              { _id: "q1", type: "single_choice", data: { question: "How would you rate your overall experience?", options: ["Option 1", "Option 2", "Option 3"].map((label) => ({ label })) } },
              { _id: "q2", type: "short_text", data: { question: "What specific service did you use?" } },
            ]).map(renderQuestion)}
            {formId && !formError && !formQuestions.length && <p className="text-sm text-text-muted">This form has no questions yet.</p>}

            <div className="pt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep("bio")}
                className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-text-secondary hover:bg-background transition"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-wait disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Submit Form"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: FINISH PAGE */}
        {currentStep === "finish" && !isLoading && !formError && !surveyStatusMessage && (
          <div className="text-center py-10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-primary">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-text">{finishPage.title || "Thank you for your feedback!"}</h2>
            <p className="text-sm text-text-secondary mb-8">
              {finishPage.description || "Your response has been successfully recorded. You may now close this tab."}
            </p>
            {finishPage.ratingRequired !== false && <div className="mb-5">
              <div role="radiogroup" aria-label="Rate your experience" className="flex flex-wrap justify-center gap-2">
                {Array.from({ length: 5 }, (_, index) => {
                  const value = index + 1;
                  return <button key={value} type="button" role="radio" aria-checked={finishRating === value} aria-label={`${value} stars`} onClick={() => setFinishRating(value)} disabled={ratingSaved || isSavingRating} className={`rounded-lg p-2 transition ${finishRating >= value ? "text-amber-500" : "text-border hover:text-amber-400"}`}><Star size={32} fill={finishRating >= value ? "currentColor" : "none"} /></button>;
                })}
              </div>
              {ratingError && <p role="alert" className="mt-2 text-sm text-red-700">{ratingError}</p>}
              {ratingSaved ? <p role="status" className="mt-2 text-sm text-green-700">Rating saved. Thank you.</p> : <button type="button" onClick={handleFinishRating} disabled={!finishRating || isSavingRating} className="mt-3 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{isSavingRating ? "Saving rating…" : "Submit rating"}</button>}
            </div>}
            {(finishPage.ratingRequired === false || ratingSaved) && finishPage.nextForm?.enabled && finishPage.nextForm?.url && <a href={finishPage.nextForm.url} className="mb-5 inline-flex rounded-xl border border-border px-6 py-3 text-sm font-semibold text-primary hover:bg-background">{finishPage.nextForm.buttonText || finishPage.buttonText || "Continue"}</a>}
            {(finishPage.ratingRequired === false || ratingSaved) && <button
              onClick={() => {
                setCurrentStep("welcome");
                setAnswers({});
                setParticipantToken("");
                setSubmissionResult(null);
                setFinishRating(0);
                setRatingSaved(false);
              }}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Submit Another Response
            </button>}
          </div>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="mt-6" />

    </div>
  );
};

export default PublicForm;
