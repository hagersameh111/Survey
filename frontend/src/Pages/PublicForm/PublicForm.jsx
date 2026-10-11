import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock3, User, Calendar, Mail, Phone, CheckCircle2 } from "lucide-react";
import { getPublicForm, submitFormResponse } from "../../api/forms";

const PublicForm = ({ questions: previewQuestions, bioFields: previewBioFields }) => {
  const [searchParams] = useSearchParams();
  const formId = searchParams.get("formId");
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState("welcome"); // 'welcome' -> 'bio' -> 'questions' -> 'finish'
  
  // State for form responses
  const [bioData, setBioData] = useState({ name: "", dob: "", email: "", phone: "" });
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    if (!formId) return;
    let cancelled = false;
    getPublicForm(formId)
      .then((loadedForm) => { if (!cancelled) setForm(loadedForm); })
      .catch((error) => { if (!cancelled) setFormError(error.response?.data?.message || "Could not load this form."); });
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
      },
    }))
    : form?.pages?.find((page) => page.type === "questions")?.blocks || [];
  const participantBlocks = form?.pages?.find((page) => page.type === "participant_info")?.blocks || [];
  const bioDefinitions = {
    name: { label: "Full Name", type: "text", placeholder: "Ahmed Said", icon: User },
    dob: { label: "Date of Birth", type: "date", placeholder: "", icon: Calendar },
    email: { label: "Email Address", type: "email", placeholder: "ahmed@mail.com", icon: Mail },
    phone: { label: "Phone Number", type: "tel", placeholder: "+1-012 345 6789", icon: Phone },
  };
  const formBioFields = previewBioFields
    ? Object.entries(previewBioFields).filter(([, field]) => field.enabled).map(([key, field]) => ({ key, required: field.required }))
    : formId
      ? participantBlocks.map((block) => {
        const fieldKey = block.data?.fieldKey || ({ "Full Name": "name", "Date of Birth": "dob", "Email Address": "email", "Phone Number": "phone" })[block.data?.question];
        return fieldKey ? { key: fieldKey, required: Boolean(block.data?.required) } : null;
      }).filter(Boolean)
      : Object.keys(bioDefinitions).map((key) => ({ key, required: false }));

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
        <h3 className="text-sm font-semibold text-text">{index + 1}. {data.question || "Untitled Question"}</h3>
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
          <div className="flex items-center gap-4">
            <input type="range" min="1" max={data.scale || 5} value={value || 1} onChange={(event) => handleAnswerChange(questionId, Number(event.target.value))} className="w-full accent-primary" />
            <span className="text-sm text-text-secondary">{value || 1} / {data.scale || 5}</span>
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
            onChange={(event) => handleAnswerChange(questionId, event.target.value)}
            className={`w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary ${block.type === "long_text" ? "min-h-28" : ""}`}
          />
        )}
      </div>
    );
  };

  const handleBioChange = (field, value) => {
    setBioData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const continueToQuestions = () => {
    const missing = formBioFields.find(({ key, required }) => required && !String(bioData[key] || "").trim());
    if (missing) {
      setSubmitError(`${bioDefinitions[missing.key]?.label || "Required field"} is required.`);
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
    setIsSubmitting(true);
    try {
      await submitFormResponse(formId, { participant: bioData, answers });
      setCurrentStep("finish");
    } catch (error) {
      setSubmitError(error.response?.data?.message || "Your response could not be saved. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between py-10 px-4">
      
      {/* Top Branding Header */}
      <header className="mx-auto max-w-2xl w-full mb-6 flex items-center justify-center gap-2">
        <span className="text-sm font-semibold tracking-wider text-text-muted uppercase">FormHub Survey</span>
      </header>

      {/* Main Container Card */}
      <main className="mx-auto max-w-2xl w-full rounded-3xl bg-white p-8 md:p-12 shadow-sm border border-border">
        {formError && <div role="alert" className="mb-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">{formError}</div>}
        {submitError && <div role="alert" className="mb-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">{submitError}</div>}
        
        {/* STEP 1: WELCOME PAGE */}
        {currentStep === "welcome" && (
          <div className="text-center py-6">
            <h1 className="mb-4 text-3xl md:text-4xl font-bold text-primary">
              {form?.pages?.find((page) => page.type === "welcome")?.title || "Welcome, we'd love your feedback"}
            </h1>
            <p className="mx-auto mb-8 text-base md:text-lg text-text-secondary leading-relaxed">
              {form?.pages?.find((page) => page.type === "welcome")?.description || "Your honest input helps us make better decisions in the future. Please share your thoughts, every bit of feedback is appreciated."}
            </p>

            <button
              onClick={() => setCurrentStep("bio")}
              className="rounded-xl bg-primary px-10 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-primary-hover"
            >
              Start Now
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 text-text-muted">
              <Clock3 size={18} />
              <span className="text-sm">Takes 10 min.</span>
            </div>
          </div>
        )}

        {/* STEP 2: PARTICIPANT BIO FORM */}
        {currentStep === "bio" && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-primary">Personal Info</h2>
              <p className="text-sm text-text-secondary mt-1">Please fill in your personal details.</p>
            </div>

            <div className="space-y-4">
              {formBioFields.map(({ key, required }) => {
                const field = bioDefinitions[key];
                if (!field) return null;
                const Icon = field.icon;
                return <div key={key}>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">{field.label}{required ? " *" : ""}</label>
                  <div className="flex h-12 items-center gap-3 rounded-xl border border-border bg-background px-4 focus-within:border-primary">
                    <Icon size={18} className="text-text-muted" />
                    <input type={field.type} placeholder={field.placeholder} required={required} value={bioData[key]} onChange={(event) => handleBioChange(key, event.target.value)} className="w-full bg-transparent text-sm outline-none text-text-secondary" />
                  </div>
                </div>;
              })}
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
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: QUESTIONNAIRE VIEW */}
        {currentStep === "questions" && (
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
        {currentStep === "finish" && (
          <div className="text-center py-10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-primary">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-text">Thank you for your feedback!</h2>
            <p className="text-sm text-text-secondary mb-8">
              Your response has been successfully recorded. You may now close this tab.
            </p>
            <button
              onClick={() => {
                setCurrentStep("welcome");
                setAnswers({});
                setBioData({ name: "", dob: "", email: "", phone: "" });
              }}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Submit Another Response
            </button>
          </div>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="text-center text-xs text-text-muted mt-6">
        Powered by <span className="font-semibold text-text-secondary">FormHub</span>
      </footer>

    </div>
  );
};

export default PublicForm;
