import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import BuilderNavbar from "./Builder/Shared/BuilderNavbar";
import BuilderSidebar from "./Builder/Shared/BuilderSidebar";
import BuilderContent from "./Builder/BuilderContent";
import AnswerSidebar from "./Builder/Features/Questions/components/AnswerSidebar";
import BioAnswerSidebar from "./Builder/Features/ParticipantBio/components/BioAnswerSidebar";
import WelcomeSidebar from "./Builder/Features/Welcome/components/WelcomeSidebar";
import PublicForm from "../PublicForm/PublicForm";
import { createForm, getForm, saveFormBuilder, updateForm } from "../../api/forms";

const pageDefaults = {
  welcome: { title: "Welcome Page", description: "" },
  participant_info: { title: "Participant Bio", description: "" },
  questions: { title: "Questions Page", description: "" },
  ending: { title: "Finish Page", description: "" },
};

const bioFieldTypes = {
  name: { type: "short_text", question: "Full Name" },
  dob: { type: "date", question: "Date of Birth" },
  email: { type: "email", question: "Email Address" },
  phone: { type: "phone", question: "Phone Number" },
};

const getBioFieldKey = (block) => {
  if (block?.data?.fieldKey && bioFieldTypes[block.data.fieldKey]) return block.data.fieldKey;
  const label = block?.data?.question?.trim().toLowerCase();
  return ({ "full name": "name", "date of birth": "dob", "email address": "email", "phone number": "phone" })[label];
};

const toEditorType = (type) => ({
  multiple_choice: "multiple-choice",
  single_choice: "single-choice",
  short_text: "short-answer",
  long_text: "paragraph",
})[type] || type.replaceAll("_", "-");

const toBackendType = (question) => question.backendType || ({
  "multiple-choice": "multiple_choice",
  "single-choice": "single_choice",
  multiple: "multiple_choice",
  checkbox: "multiple_choice",
  radio: "single_choice",
  "short-answer": "short_text",
  short: "short_text",
  paragraph: "long_text",
})[question.type] || question.type.replaceAll("-", "_");

const toBuilderPayload = (questions, savedPages, includeIds = true, pageContent = pageDefaults, bioFields = {}) => {
  const questionBlocks = questions.map((question) => {
      const type = toBackendType(question);
      const blockData = { ...(question.data || {}) };
      if (type === "heading" || type === "text") blockData.text = question.title || (type === "heading" ? "Untitled Heading" : "Text block");
      else if (type === "image") {
        blockData.url = question.title || "";
        blockData.altText = question.altText || "";
      } else if (type !== "divider") {
        blockData.question = question.title || "Untitled Question";
        blockData.required = Boolean(question.required);
        blockData.description = question.description || "";
      }
      if (["single_choice", "multiple_choice", "dropdown"].includes(type)) {
      blockData.options = question.options?.length ? question.options : [{ label: "Option 1" }];
    }
      if (type === "rating") {
        blockData.style = question.style || blockData.style || "stars";
        blockData.scale = Math.min(10, Math.max(2, Number(question.scale || blockData.scale) || 5));
      }
      if (["short_text", "long_text", "email", "phone", "number"].includes(type) && question.placeholder !== undefined) blockData.placeholder = question.placeholder;
      if (["short_text", "long_text"].includes(type)) {
        if (question.minLength !== undefined) blockData.minLength = Number(question.minLength);
        if (question.maxLength !== undefined) blockData.maxLength = Number(question.maxLength);
      }
      if (type === "number") {
        if (question.min !== undefined) blockData.min = Number(question.min);
        if (question.max !== undefined) blockData.max = Number(question.max);
      }
      if (type === "date") {
        if (question.minDate !== undefined) blockData.minDate = question.minDate;
        if (question.maxDate !== undefined) blockData.maxDate = question.maxDate;
      }
      if (type === "multiple_choice" && question.maxSelections !== undefined) blockData.maxSelections = Number(question.maxSelections);
    return { ...(includeIds && question.apiId ? { id: question.apiId } : {}), type, data: blockData };
  });

  return {
    pages: ["welcome", "participant_info", "questions", "ending"].map((type) => {
      const existing = savedPages.find((page) => page.type === type);
      const existingBlocks = (existing?.blocks || []).map((block) => ({
        ...(includeIds && block._id ? { id: block._id } : {}),
        type: block.type,
        data: block.data,
      }));
      const bioBlocks = Object.entries(bioFieldTypes)
        .filter(([key]) => bioFields[key]?.enabled)
        .map(([key, field]) => {
          const existingBlock = existing?.blocks?.find((block) => getBioFieldKey(block) === key);
          return {
            ...(includeIds && existingBlock?._id ? { id: existingBlock._id } : {}),
            type: field.type,
            data: { fieldKey: key, question: field.question, required: Boolean(bioFields[key]?.required) },
          };
        });
      const customBioBlocks = type === "participant_info"
        ? (existing?.blocks || []).filter((block) => !getBioFieldKey(block)).map((block) => ({
          ...(includeIds && block._id ? { id: block._id } : {}),
          type: block.type,
          data: block.data,
        }))
        : [];
      const content = pageContent[type] || {};
      return {
        ...(includeIds && existing?._id ? { id: existing._id } : {}),
        type,
        title: content.title ?? existing?.title ?? "",
        description: content.description ?? existing?.description ?? "",
        blocks: type === "questions" ? questionBlocks : type === "participant_info" ? [...bioBlocks, ...customBioBlocks] : existingBlocks,
      };
    }),
  };
};

const FormBuilder = () => {
  const navigate = useNavigate();
  const { formId: pathFormId } = useParams();
  // 1. Master Mode State (Builder vs Preview)
  const [mode, setMode] = useState("builder"); // "builder" | "preview"

  // 2. Builder Navigation State
  const [selectedPage, setSelectedPage] = useState("questions");

  // 3. Form Data State (lifted up to be sent to the backend)
  const [questions, setQuestions] = useState([]);
  const [formTitle, setFormTitle] = useState("Untitled Form");
  const [formDescription, setFormDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [formSettings, setFormSettings] = useState({
    formSlug: "untitled-form",
    language: "English",
    emailNotifications: true,
    collectEmails: true,
    limitOneResponse: false,
    themeColor: "#2563EB",
    cardStyle: "rounded",
    progressBar: true,
  });
  const [pageContent, setPageContent] = useState(pageDefaults);
  const [bioFields, setBioFields] = useState({
    name: { enabled: true, required: true },
    dob: { enabled: true, required: false },
    email: { enabled: true, required: true },
    phone: { enabled: true, required: false },
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [formId, setFormId] = useState(searchParams.get("formId") || pathFormId || null);
  const [folder, setFolder] = useState(searchParams.get("folder") || "my-workspace");
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [savedPages, setSavedPages] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(searchParams.get("formId")));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);

  useEffect(() => {
    const nextId = searchParams.get("formId") || pathFormId || null;
    if (nextId !== formId) setFormId(nextId);
    const nextFolder = searchParams.get("folder");
    if (!nextId && nextFolder) setFolder(nextFolder);
  }, [pathFormId, searchParams]);

  useEffect(() => {
    if (!formId) return;

    let cancelled = false;
    setIsLoading(true);
    getForm(formId)
      .then((form) => {
        if (cancelled) return;
        const pages = form.pages || [];
        setSavedPages(pages);
        setFormTitle(form.title || "Untitled Form");
        setFormDescription(form.description || "");
        setStatus(form.status || "draft");
        setFolder(form.folder || "my-workspace");
        setFormSettings({
          formSlug: form.settings?.formSlug || (form.title || "untitled-form").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          language: form.settings?.language || "English",
          emailNotifications: form.settings?.emailNotifications ?? true,
          collectEmails: form.settings?.collectEmails ?? true,
          limitOneResponse: form.settings?.limitOneResponse ?? false,
          themeColor: form.settings?.themeColor || "#2563EB",
          cardStyle: form.settings?.cardStyle || "rounded",
          progressBar: form.settings?.progressBar ?? true,
          ...form.settings,
        });
        setPageContent(Object.fromEntries(Object.keys(pageDefaults).map((type) => {
          const page = pages.find((entry) => entry.type === type);
          return [type, { title: page?.title ?? pageDefaults[type].title, description: page?.description ?? "" }];
        })));
        const bioPage = pages.find((page) => page.type === "participant_info");
        setBioFields(Object.fromEntries(Object.keys(bioFieldTypes).map((key) => {
          const fieldBlock = bioPage?.blocks?.find((block) => getBioFieldKey(block) === key);
          return [key, fieldBlock
            ? { enabled: true, required: Boolean(fieldBlock.data?.required) }
            : { enabled: !(bioPage?.blocks?.length), required: key === "name" || key === "email" }];
        })));
        const questionsPage = pages.find((page) => page.type === "questions");
        const loadedQuestions = (questionsPage?.blocks || []).map((block, index) => ({
          id: block._id || `${formId}-${index}`,
          apiId: block._id,
          backendType: block.type,
          type: toEditorType(block.type),
          data: block.data,
          title: block.data?.question || block.data?.text || block.data?.url || "",
          description: block.data?.description || "",
          required: Boolean(block.data?.required),
          options: block.data?.options || [{ label: "Option 1" }],
          scale: block.data?.scale || 5,
          style: block.data?.style || "stars",
          placeholder: block.data?.placeholder || "",
          minLength: block.data?.minLength,
          maxLength: block.data?.maxLength,
          min: block.data?.min,
          max: block.data?.max,
          minDate: block.data?.minDate || "",
          maxDate: block.data?.maxDate || "",
          maxSelections: block.data?.maxSelections,
          altText: block.data?.altText || "",
        }));
        setQuestions(loadedQuestions);
        setSelectedQuestionId(loadedQuestions[0]?.id);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.response?.data?.message || requestError.message || "Could not load this form.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [formId]);

  const handleAddQuestion = (type) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setQuestions((prev) => [...prev, {
      id,
      order: questions.length + 1,
      title: "",
      description: "",
      required: false,
      options: [{ label: "Option 1" }],
      scale: 5,
      style: "stars",
      placeholder: "",
      type,
    }]);
    setSelectedQuestionId(id);
  };

  const handleDeleteQuestion = (id) => {
    const remaining = questions.filter((question) => question.id !== id).map((question, index) => ({ ...question, order: index + 1 }));
    setQuestions(remaining);
    if (selectedQuestionId === id) setSelectedQuestionId(remaining[0]?.id);
  };

  const handleUpdateQuestion = (id, changes) => {
    setQuestions((prev) => prev.map((question) => question.id === id ? { ...question, ...changes } : question));
  };

  const handleUpdatePage = (type, changes) => {
    setPageContent((previous) => ({ ...previous, [type]: { ...previous[type], ...changes } }));
  };

  const handleUpdateBioField = (key, changes) => {
    setBioFields((previous) => ({ ...previous, [key]: { ...previous[key], ...changes } }));
  };

  const handleSettingsChange = (key, value) => {
    if (key === "formTitle") setFormTitle(value);
    else if (key === "status") setStatus(value);
    else setFormSettings((previous) => ({ ...previous, [key]: value }));
  };

  const handleSelectQuestion = (id) => {
    setSelectedPage("questions");
    setSelectedQuestionId(id);
    requestAnimationFrame(() => document.getElementById(`question-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const handleMoveQuestion = (id, direction) => {
    const index = questions.findIndex((question) => question.id === id);
    const destination = index + direction;
    if (index < 0 || destination < 0 || destination >= questions.length) return;
    const reordered = [...questions];
    [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
    setQuestions(reordered.map((question, order) => ({ ...question, order: order + 1 })));
  };

  const handleDuplicate = async () => {
    setError("");
    try {
      const copy = await createForm({ title: `${formTitle} (Copy)`, description: formDescription, folder });
      await updateForm(copy._id, { status, settings: formSettings });
      await saveFormBuilder(copy._id, toBuilderPayload(questions, savedPages, false, pageContent, bioFields));
      navigate(`/form-builder?formId=${copy._id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not duplicate this form.");
    }
  };

  // 4. Backend Submission Handler mapped to Zod Schema
  const handleSaveToBackend = async ({ openPublish = false, publish = false } = {}) => {
    setIsSaving(true);
    setError("");
    try {
      let activeFormId = formId;
      if (!activeFormId) {
        const form = await createForm({ title: formTitle, description: formDescription, folder });
        activeFormId = form._id;
        setFormId(activeFormId);
        setSearchParams({ formId: activeFormId }, { replace: true });
      }

      const payload = toBuilderPayload(questions, savedPages, true, pageContent, bioFields);
      const savedForm = await saveFormBuilder(activeFormId, payload);
      const savedStatus = publish ? "published" : status;
      await updateForm(activeFormId, { title: formTitle, description: formDescription, status: savedStatus, settings: formSettings, folder });
      if (publish) setStatus(savedStatus);
      setSavedPages(savedForm.pages || []);
      alert("Form saved successfully!");
      if (openPublish) setPublishOpen(true);
      return true;
    } catch (err) {
      console.error("Error saving form:", err);
      setError(err.response?.data?.message || err.message || "Could not save this form.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = () => handleSaveToBackend({ openPublish: true, publish: true });

  // ------------------------------------------------------------------
  // PREVIEW MODE RENDER
  // ------------------------------------------------------------------
  if (mode === "preview") {
    return (
      <div className="relative min-h-screen bg-background">
        <button
          onClick={() => setMode("builder")}
          className="absolute left-6 top-6 z-50 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-gray-800"
        >
          ← Back to Builder
        </button>
        <PublicForm questions={questions} bioFields={bioFields} />
      </div>
    );
  }

  // ------------------------------------------------------------------
  // BUILDER MODE RENDER
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background">
      <BuilderNavbar
        onPreview={() => setMode("preview")}
        onSave={handleSaveToBackend}
        onPublish={handlePublish}
        onDuplicate={handleDuplicate}
        isSaving={isSaving}
        formUrl={`${window.location.origin}/view?formId=${formId || ""}`}
        publishOpen={publishOpen}
        onPublishOpenChange={setPublishOpen}
      />

      {error && <div role="alert" className="mx-6 mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {isLoading ? (
        <div className="p-10 text-center text-text-secondary">Loading form…</div>
      ) : (

      <div className="flex min-w-0 flex-col gap-4 p-3 sm:p-4 lg:flex-row lg:gap-6 lg:p-6">
      <BuilderSidebar
        selectedPage={selectedPage}
        setSelectedPage={setSelectedPage}
        questions={questions}
        selectedQuestionId={selectedQuestionId}
        formTitle={formTitle}
        formDescription={formDescription}
        onFormUpdate={(changes) => {
          if (changes.title !== undefined) setFormTitle(changes.title);
          if (changes.description !== undefined) setFormDescription(changes.description);
        }}
          onDeleteQuestion={handleDeleteQuestion}
          onSelectQuestion={handleSelectQuestion}
          onUpdateQuestion={handleUpdateQuestion}
          onMoveQuestion={handleMoveQuestion}
          onDuplicate={handleDuplicate}
          onPreview={() => setMode("preview")}
        />

      <div className="min-w-0 flex-1">
      <BuilderContent
        selectedPage={selectedPage}
        questions={questions}
        pageContent={pageContent}
        bioFields={bioFields}
        settings={{ ...formSettings, formTitle, status }}
        onSettingsChange={handleSettingsChange}
        onSaveSettings={handleSaveToBackend}
        onUpdatePage={handleUpdatePage}
          onAddQuestion={handleAddQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          onUpdateQuestion={handleUpdateQuestion}
      />
      </div>

        {/* Dynamic Right Sidebar Context */}
        {selectedPage === "welcome" ? (
          <WelcomeSidebar />
        ) : selectedPage === "bio" ? (
          <BioAnswerSidebar fields={bioFields} onChange={handleUpdateBioField} />
        ) : selectedPage === "questions" ? (
          <AnswerSidebar
            question={questions.find((question) => question.id === selectedQuestionId)}
            onUpdateQuestion={handleUpdateQuestion}
          />
        ) : (
          <aside className="w-full flex-shrink-0 rounded-3xl bg-[#F8FAFD] p-4 shadow-sm sm:p-6 lg:w-[300px]">
            <h2 className="text-xl font-semibold text-text">Settings</h2>
            <p className="mt-5 text-sm text-text-muted">No configuration options for this page type.</p>
          </aside>
        )}
      </div>
      )}
    </div>
  );
};

export default FormBuilder;
