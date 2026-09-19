import { useState } from "react";
import { X, Palette, Layout, Globe, Sliders } from "lucide-react";
import SwitchToggle from "./SwitchToggle";

const GlobalFormSettingsModal = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState("appearance");
  const [themeColor, setThemeColor] = useState("#2563EB"); // primary blue
  const [cardStyle, setCardStyle] = useState("rounded");
  const [progressBar, setProgressBar] = useState(true);

  if (!open) return null;

  const colors = ["#2563EB", "#7C3AED", "#DB2777", "#059669", "#D97706", "#111827"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text">Form Appearance & Settings</h2>
              <p className="text-xs text-text-secondary">Customize branding and response behaviors</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-text-secondary hover:bg-background hover:text-text transition">
            <X size={20} />
          </button>
        </div>

        {/* Content Body with Tabs */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Navigation Sidebar */}
          <div className="w-52 bg-background p-4 border-r border-border space-y-1">
            <button
              onClick={() => setActiveTab("appearance")}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                activeTab === "appearance" ? "bg-primary-light text-primary" : "text-text-secondary hover:bg-surface"
              }`}
            >
              <Palette size={18} />
              Appearance
            </button>
            <button
              onClick={() => setActiveTab("layout")}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                activeTab === "layout" ? "bg-primary-light text-primary" : "text-text-secondary hover:bg-surface"
              }`}
            >
              <Layout size={18} />
              Layout & Flow
            </button>
            <button
              onClick={() => setActiveTab({})}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                activeTab === "localization" ? "bg-primary-light text-primary" : "text-text-secondary hover:bg-surface"
              }`}
              onClick={() => setActiveTab("localization")}
            >
              <Globe size={18} />
              Localization
            </button>
          </div>

          {/* Active Tab Pane */}
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            {activeTab === "appearance" && (
              <>
                {/* Theme Color Picker */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-text">Primary Brand Color</label>
                  <div className="flex items-center gap-3">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setThemeColor(color)}
                        className={`h-10 w-10 rounded-full transition-transform ${
                          themeColor === color ? "scale-110 ring-2 ring-offset-2 ring-primary" : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Card Corners Style */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-text">Card Design Style</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setCardStyle("rounded")}
                      className={`rounded-2xl border p-4 text-left transition ${
                        cardStyle === "rounded" ? "border-primary bg-primary-light/20" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <h4 className="font-semibold text-text text-sm">Soft Rounded</h4>
                      <p className="text-xs text-text-muted mt-1">Modern clean curved edges</p>
                    </button>

                    <button
                      onClick={() => setCardStyle("sharp")}
                      className={`rounded-xl border p-4 text-left transition ${
                        cardStyle === "sharp" ? "border-primary bg-primary-light/20" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <h4 className="font-semibold text-text text-sm">Sharp Minimalist</h4>
                      <p className="text-xs text-text-muted mt-1">Clean straight borders</p>
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === "layout" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-text">Show Progress Bar</h4>
                    <p className="text-xs text-text-muted">Display completion percentage at the top of forms</p>
                  </div>
                  <SwitchToggle checked={progressBar} onChange={setProgressBar} />
                </div>
              </div>
            )}

            {activeTab === "localization" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Default Form Language</label>
                <select className="w-full rounded-xl border border-border bg-background p-3 text-sm text-text outline-none transition focus:border-primary">
                  <option>English (US)</option>
                  <option>Arabic (عربي)</option>
                  <option>French (Français)</option>
                </select>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 bg-background border-t border-border">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-text transition hover:bg-surface"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            Save Theme
          </button>
        </div>

      </div>
    </div>
  );
};

export default GlobalFormSettingsModal;