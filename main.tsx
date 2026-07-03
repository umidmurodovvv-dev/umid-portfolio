@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Space Grotesk", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}

@layer utilities {
  .glass-panel {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  .glass-panel-dark {
    background: rgba(15, 15, 15, 0.8);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: background-color 0.3s, border-color 0.3s, color 0.3s;
  }
}

/* Light Theme Overrides */
.light {
  background-color: #f8fafc !important; /* slate-50 */
  color: #0f172a !important; /* slate-900 */
}

/* Smooth theme-switching color transitions for key UI elements only (avoiding generic div wildcard) */
h1, h2, h3, h4, h5, h6, p, span, a, button, input, textarea, select, .glass-panel-dark, header, footer, section, nav {
  transition: color 0.35s ease, background-color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
}

/* Ensure ultra high-contrast dark black text in learning & quiz views during light mode */
.light #quiz-question-container,
.light #explanation-view-root,
.light #quiz-question-container h1,
.light #quiz-question-container h2,
.light #quiz-question-container h3,
.light #quiz-question-container h4,
.light #quiz-question-container p,
.light #quiz-question-container span:not(.text-emerald-400):not(.text-red-400):not(.text-amber-500):not(.text-cyan-400),
.light #quiz-question-container button:not(.bg-amber-500):not(.bg-emerald-500):not(.bg-red-500):not(.text-emerald-400):not(.text-red-400) {
  color: #000000 !important;
}

.light #explanation-view-root h1,
.light #explanation-view-root h2,
.light #explanation-view-root h3,
.light #explanation-view-root h4,
.light #explanation-view-root p,
.light #explanation-view-root span:not(.text-emerald-400):not(.text-red-400):not(.text-amber-500):not(.text-cyan-400),
.light #explanation-view-root button:not(.bg-amber-500):not(.bg-emerald-500):not(.bg-red-500) {
  color: #000000 !important;
}

.light .glass-panel-dark {
  background: rgba(255, 255, 255, 0.85) !important;
  border-color: rgba(148, 163, 184, 0.16) !important; /* slate-400 */
  color: #1e293b !important; /* slate-800 */
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05) !important;
}

.light .text-white {
  color: #0f172a !important; /* slate-900 */
}

.light .text-slate-100 {
  color: #1e293b !important; /* slate-800 */
}

.light .text-slate-200 {
  color: #334155 !important; /* slate-700 */
}

.light .text-slate-300 {
  color: #475569 !important; /* slate-600 */
}

.light .text-slate-400 {
  color: #64748b !important; /* slate-500 */
}

.light .bg-slate-950,
.light .bg-slate-950\/50,
.light .bg-slate-950\/40,
.light .bg-slate-950\/60,
.light .bg-slate-950\/20 {
  background-color: rgba(241, 245, 249, 0.85) !important; /* slate-100 */
  color: #0f172a !important;
}

.light .bg-slate-900,
.light .bg-slate-900\/60,
.light .bg-slate-900\/50 {
  background-color: rgba(226, 232, 240, 0.9) !important; /* slate-200 */
  color: #0f172a !important;
}

.light .border-slate-800,
.light .border-slate-800\/80,
.light .border-slate-800\/40,
.light .border-slate-900 {
  border-color: rgba(148, 163, 184, 0.2) !important; /* slate-400 */
}

.light input, .light textarea, .light select {
  background-color: #ffffff !important;
  color: #0f172a !important;
  border-color: rgba(148, 163, 184, 0.3) !important;
}

.light input:focus, .light textarea:focus {
  border-color: #f59e0b !important; /* amber-500 */
  box-shadow: 0 0 0 1px #f59e0b !important;
}

.light input::placeholder, .light textarea::placeholder {
  color: #94a3b8 !important; /* slate-400 */
}

/* Custom scrollbar for premium panels */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(120, 110, 90, 0.2);
  border-radius: 99px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(120, 110, 90, 0.4);
}
