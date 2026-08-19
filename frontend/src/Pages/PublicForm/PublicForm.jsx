import { useState } from "react";
import { Clock3, User, Calendar, Mail, Phone, CheckCircle2, Star, ChevronDown, CheckSquare, List, AlignLeft, Type } from "lucide-react";

const PublicForm = () => {
  const [currentStep, setCurrentStep] = useState("welcome"); // 'welcome' -> 'bio' -> 'questions' -> 'finish'
  
  // State for form responses
  const [bioData, setBioData] = useState({ name: "", dob: "", email: "", phone: "" });
  const [answers, setAnswers] = useState({});

  const handleBioChange = (field, value) => {
    setBioData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between py-10 px-4">
      
      {/* Top Branding Header */}
      <header className="mx-auto max-w-2xl w-full mb-6 flex items-center justify-center gap-2">
        <span className="text-sm font-semibold tracking-wider text-text-muted uppercase">FormHub Survey</span>
      </header>

      {/* Main Container Card */}
      <main className="mx-auto max-w-2xl w-full rounded-3xl bg-white p-8 md:p-12 shadow-sm border border-border">
        
        {/* STEP 1: WELCOME PAGE */}
        {currentStep === "welcome" && (
          <div className="text-center py-6">
            <h1 className="mb-4 text-3xl md:text-4xl font-bold text-primary">
              Welcome, we'd love your feedback
            </h1>
            <p className="mx-auto mb-8 text-base md:text-lg text-text-secondary leading-relaxed">
              Your honest input helps us make better decisions in the future. Please share your thoughts, every bit of feedback is appreciated.
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
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">Full Name</label>
                <div className="flex h-12 items-center gap-3 rounded-xl border border-border bg-background px-4 focus-within:border-primary">
                  <User size={18} className="text-text-muted" />
                  <input
                    type="text"
                    placeholder="Ahmed Said"
                    value={bioData.name}
                    onChange={(e) => handleBioChange("name", e.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">Date of Birth</label>
                <div className="flex h-12 items-center gap-3 rounded-xl border border-border bg-background px-4 focus-within:border-primary">
                  <Calendar size={18} className="text-text-muted" />
                  <input
                    type="date"
                    value={bioData.dob}
                    onChange={(e) => handleBioChange("dob", e.target.value)}
                    className="w-full bg-transparent text-sm outline-none text-text-secondary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">Email Address</label>
                <div className="flex h-12 items-center gap-3 rounded-xl border border-border bg-background px-4 focus-within:border-primary">
                  <Mail size={18} className="text-text-muted" />
                  <input
                    type="email"
                    placeholder="ahmed@mail.com"
                    value={bioData.email}
                    onChange={(e) => handleBioChange("email", e.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">Phone Number</label>
                <div className="flex h-12 items-center gap-3 rounded-xl border border-border bg-background px-4 focus-within:border-primary">
                  <Phone size={18} className="text-text-muted" />
                  <input
                    type="text"
                    placeholder="+1-012 345 6789"
                    value={bioData.phone}
                    onChange={(e) => handleBioChange("phone", e.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep("welcome")}
                className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-text-secondary hover:bg-background transition"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep("questions")}
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
              <h2 className="text-xl font-bold text-text">Service Evaluation Questions</h2>
              <p className="text-xs text-text-muted mt-1">Please answer all questions honestly.</p>
            </div>

            {/* Sample Question 1: Multiple Choice */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text">1. How would you rate your overall experience?</h3>
              <div className="space-y-2">
                {["Option 1", "Option 2", "Option 3"].map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      answers["q1"] === opt ? "border-primary bg-primary-light/30" : "border-border hover:bg-background"
                    }`}
                  >
                    <input
                      type="radio"
                      name="q1"
                      checked={answers["q1"] === opt}
                      onChange={() => handleAnswerChange("q1", opt)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-text-secondary">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sample Question 2: Short Answer */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text">2. What specific service did you use?</h3>
              <input
                type="text"
                placeholder="Type your answer here..."
                value={answers["q2"] || ""}
                onChange={(e) => handleAnswerChange("q2", e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="pt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep("bio")}
                className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-text-secondary hover:bg-background transition"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep("finish")}
                className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
              >
                Submit Form
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