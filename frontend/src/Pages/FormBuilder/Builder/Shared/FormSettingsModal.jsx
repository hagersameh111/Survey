import { useState } from "react";
import { X, Settings, Globe, Shield, Bell } from "lucide-react";
import SwitchToggle from "./SwitchToggle";

const FormSettingsModal = ({ open, onClose, settings = {}, onChange = () => {}, onSave = () => {} }) => {
  const [activeTab, setActiveTab] = useState("general");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text">Form Settings</h2>
              <p className="text-xs text-text-secondary">Manage global preferences and behaviors</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-text-secondary hover:bg-background hover:text-text transition">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body with Tabs */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar Tabs */}
          <div className="w-48 bg-background p-4 border-r border-border space-y-1">
            <button
              onClick={() => setActiveTab("general")}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                activeTab === "general" ? "bg-primary-light text-primary" : "text-text-secondary hover:bg-surface"
              }`}
            >
              <Globe size={18} />
              General
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                activeTab === "security" ? "bg-primary-light text-primary" : "text-text-secondary hover:bg-surface"
              }`}
            >
              <Shield size={18} />
              Access & Security
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                activeTab === "notifications" ? "bg-primary-light text-primary" : "text-text-secondary hover:bg-surface"
              }`}
            >
              <Bell size={18} />
              Notifications
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            {activeTab === "general" && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-text">Form Title</label>
                  <input
                    type="text"
                    value={settings.formTitle || ""}
                    maxLength={200}
                    onChange={(e) => onChange("formTitle", e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm text-text outline-none transition focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-text">Form URL Slug</label>
                  <input
                    type="text"
                    value={settings.formSlug || ""}
                    onChange={(e) => onChange("formSlug", e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm text-text outline-none transition focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-text">Language</label>
                  <select
                    value={settings.language || "English"}
                    onChange={(e) => onChange("language", e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm text-text outline-none transition focus:border-primary"
                  >
                    <option value="English">English</option>
                    <option value="Arabic">Arabic</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-text">Form Status</label>
                  <select value={settings.status || "draft"} onChange={(e) => onChange("status", e.target.value)} className="w-full rounded-xl border border-border bg-background p-3 text-sm text-text outline-none focus:border-primary">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-text">Theme color</label>
                  <input type="color" value={settings.themeColor || "#2563EB"} onChange={(e) => onChange("themeColor", e.target.value)} className="h-11 w-full rounded-xl border border-border bg-background p-2" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-text">Card style</label>
                  <select value={settings.cardStyle || "rounded"} onChange={(e) => onChange("cardStyle", e.target.value)} className="w-full rounded-xl border border-border bg-background p-3 text-sm text-text">
                    <option value="rounded">Rounded</option><option value="sharp">Sharp</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text">Show progress bar</span>
                  <SwitchToggle checked={Boolean(settings.progressBar)} onChange={(value) => onChange("progressBar", value)} />
                </div>
              </>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-text">Collect Email Addresses</h4>
                    <p className="text-xs text-text-muted">Require respondents to enter their email</p>
                  </div>
                  <SwitchToggle
                    checked={Boolean(settings.collectEmails)}
                    onChange={(val) => onChange("collectEmails", val)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-text">Limit to 1 Response</h4>
                    <p className="text-xs text-text-muted">Respondents must sign in to submit only once</p>
                  </div>
                  <SwitchToggle
                    checked={Boolean(settings.limitOneResponse)}
                    onChange={(val) => onChange("limitOneResponse", val)}
                  />
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-text">Email Notifications</h4>
                    <p className="text-xs text-text-muted">Receive an email when a new response is submitted</p>
                  </div>
                  <SwitchToggle
                    checked={Boolean(settings.emailNotifications)}
                    onChange={(val) => onChange("emailNotifications", val)}
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 bg-background border-t border-border">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-text transition hover:bg-surface"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};

export default FormSettingsModal;
