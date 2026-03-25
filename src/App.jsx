import { useState, useEffect, useRef, useCallback, useMemo, useReducer, memo, createContext, useContext } from "react";

// ─── CONSTANTS ───
const MAX_UNDO = 60;
const SAVE_DEBOUNCE_MS = 800;
const CHAT_HISTORY_LIMIT = 50;
const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const LS_PROJECTS = "novelforge:projects";
const LS_SETTINGS = "novelforge:settings";
const LS_TAB_CHATS = "novelforge:tabChats";

// ─── THEME CONTEXT ───
const ThemeContext = createContext({ theme: "dark", toggle: () => {} });
const useTheme = () => useContext(ThemeContext);

// ─── THEME DEFINITIONS ───
const THEMES = {
  dark: {
    "--nf-bg-deep": "#08070c",
    "--nf-bg": "#0e0c14",
    "--nf-bg-raised": "#13101c",
    "--nf-bg-surface": "#19152a",
    "--nf-bg-hover": "#1e1930",
    "--nf-border": "#271f3a",
    "--nf-border-focus": "rgba(168,85,247,0.4)",
    "--nf-text": "#ede0f5",
    "--nf-text-dim": "#b89ecc",
    "--nf-text-muted": "#6a5a7a",
    "--nf-accent": "#dc2660",
    "--nf-accent-2": "#a855f7",
    "--nf-accent-glow": "rgba(220, 38, 96, 0.12)",
    "--nf-accent-glow-2": "rgba(168,85,247,0.12)",
    "--nf-editor-text": "#e4d6f0",
    "--nf-editor-placeholder": "#3a2d4a",
    "--nf-selection-bg": "rgba(168,85,247,0.3)",
    "--nf-chat-bubble-bg": "#13101c",
    "--nf-chat-bubble-user-bg": "#19152a",
    "--nf-chat-bubble-user-border": "rgba(168,85,247,0.2)",
    "--nf-error-bg": "#1f0c16",
    "--nf-error-border": "rgba(220,38,96,0.25)",
    "--nf-danger-bg": "#1f0c16",
    "--nf-danger-hover": "#2d1220",
    "--nf-success": "#34d399",
    "--nf-success-bg": "rgba(52,211,153,0.08)",
    "--nf-toast-bg": "#13101cee",
    "--nf-toast-border": "#271f3a",
    "--nf-dialog-bg": "#13101c",
    "--nf-dialog-border": "#271f3a",
    "--nf-diff-bg": "#0e0c14",
    "--nf-diff-border": "#271f3a",
    "--nf-scrollbar-thumb": "#271f3a",
    "--nf-scrollbar-hover": "#362b4a",
    "--nf-toolbar-bg": "#0e0c14",
    "--nf-toolbar-border": "#271f3a",
    "--nf-toolbar-btn-hover": "#1e1930",
    "--nf-glow": "0 0 40px rgba(168,85,247,0.06)",
    "--nf-shadow": "0 8px 32px rgba(0,0,0,0.5)",
    "--nf-shadow-lg": "0 24px 64px rgba(0,0,0,0.6)",
  },
  light: {
    "--nf-bg-deep": "#faf8fc",
    "--nf-bg": "#ffffff",
    "--nf-bg-raised": "#f5f2f8",
    "--nf-bg-surface": "#eeebf3",
    "--nf-bg-hover": "#e8e4f0",
    "--nf-border": "#dbd5e5",
    "--nf-border-focus": "rgba(168,85,247,0.35)",
    "--nf-text": "#1a1028",
    "--nf-text-dim": "#4a3d5c",
    "--nf-text-muted": "#8a7d9a",
    "--nf-accent": "#be185d",
    "--nf-accent-2": "#9333ea",
    "--nf-accent-glow": "rgba(190, 24, 93, 0.08)",
    "--nf-accent-glow-2": "rgba(147,51,234,0.08)",
    "--nf-editor-text": "#2a1e3a",
    "--nf-editor-placeholder": "#c0b5d0",
    "--nf-selection-bg": "rgba(147,51,234,0.15)",
    "--nf-chat-bubble-bg": "#f5f2f8",
    "--nf-chat-bubble-user-bg": "#eeebf3",
    "--nf-chat-bubble-user-border": "rgba(147,51,234,0.15)",
    "--nf-error-bg": "#fef1f6",
    "--nf-error-border": "rgba(190,24,93,0.2)",
    "--nf-danger-bg": "#fef1f6",
    "--nf-danger-hover": "#fde4ed",
    "--nf-success": "#059669",
    "--nf-success-bg": "rgba(5,150,105,0.06)",
    "--nf-toast-bg": "#ffffffee",
    "--nf-toast-border": "#dbd5e5",
    "--nf-dialog-bg": "#ffffff",
    "--nf-dialog-border": "#dbd5e5",
    "--nf-diff-bg": "#ffffff",
    "--nf-diff-border": "#dbd5e5",
    "--nf-scrollbar-thumb": "#cec6d8",
    "--nf-scrollbar-hover": "#b8aec6",
    "--nf-toolbar-bg": "#f5f2f8",
    "--nf-toolbar-border": "#dbd5e5",
    "--nf-toolbar-btn-hover": "#e8e4f0",
    "--nf-glow": "0 0 40px rgba(147,51,234,0.04)",
    "--nf-shadow": "0 8px 32px rgba(0,0,0,0.08)",
    "--nf-shadow-lg": "0 24px 64px rgba(0,0,0,0.12)",
  },
};

// ─── DROPDOWN OPTIONS ───
const GENDER_OPTIONS = ["Female","Male","Non-binary","Genderfluid","Genderqueer","Agender","Bigender","Two-Spirit","Intersex","Trans woman","Trans man","Other"];
const PRONOUN_OPTIONS = ["she/her","he/him","they/them","she/they","he/they","ze/zir","xe/xem","it/its","any pronouns","no pronouns (use name)"];
const ROLE_OPTIONS = ["protagonist","love interest","deuteragonist","antagonist","mentor","sidekick","foil","confidant","supporting","minor","villain","anti-hero"];
const POV_OPTIONS = ["Third person limited","Third person omniscient","Third person deep","First person","First person present tense","Second person","Multiple POV (rotating)","Dual POV (alternating)"];
const GENRE_OPTIONS = ["Contemporary Romance","Dark Romance","Paranormal Romance","Historical Romance","Romantic Suspense","Romantic Comedy","New Adult","Erotic Romance","Fantasy Romance","Sci-Fi Romance","Mafia Romance","Reverse Harem","Why Choose","MM Romance","FF Romance","Romantic Fantasy","Urban Fantasy","Literary Fiction","Thriller","Horror","Dark Fantasy","Other"];
const SCENE_TYPE_OPTIONS = [
  { value: "narrative", label: "Narrative" }, { value: "dialogue", label: "Dialogue-heavy" },
  { value: "action", label: "Action" }, { value: "intimate", label: "Intimate" },
  { value: "emotional", label: "Emotional" }, { value: "tension", label: "Tension/Conflict" },
  { value: "resolution", label: "Resolution" }, { value: "flashback", label: "Flashback" },
  { value: "montage", label: "Montage" }, { value: "dream", label: "Dream/Vision" },
];
const RELATIONSHIP_STATUS_OPTIONS = [
  { value: "strangers", label: "Strangers" }, { value: "acquaintances", label: "Acquaintances" },
  { value: "developing", label: "Developing" }, { value: "friends", label: "Friends" },
  { value: "friends-with-benefits", label: "Friends with benefits" },
  { value: "tension", label: "Unresolved tension" }, { value: "dating", label: "Dating" },
  { value: "lovers", label: "Lovers" }, { value: "committed", label: "Committed" },
  { value: "complicated", label: "It's complicated" }, { value: "estranged", label: "Estranged" },
  { value: "enemies", label: "Enemies" }, { value: "enemies-to-lovers", label: "Enemies-to-lovers (in progress)" },
  { value: "exes", label: "Exes" }, { value: "forbidden", label: "Forbidden" },
  { value: "unrequited", label: "Unrequited" },
];
const TENSION_OPTIONS = [
  { value: "none", label: "None" }, { value: "low", label: "Low — comfortable" },
  { value: "medium", label: "Medium — simmering" }, { value: "high", label: "High — electric" },
  { value: "explosive", label: "Explosive — breaking point" },
];

// ─── MODE TOOLTIPS ───
const MODE_TOOLTIPS = {
  continue: "Continues from exactly where the text ends, matching style and pacing.",
  scene: "Writes a new scene from your Scene Direction notes.",
  dialogue: "Generates dialogue with distinct voices and action beats.",
  rewrite: "Select text first, then rewrite with elevated prose.",
  brainstorm: "Suggests 3–5 creative directions for what happens next.",
  summarize: "Creates a detailed chapter summary for continuity.",
};

// ─── ICONS ───
const mkIcon = (paths, size = 18) => {
  const I = memo(() => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
  ));
  I.displayName = "Icon";
  return I;
};

const Icons = {
  Book: mkIcon(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>),
  Users: mkIcon(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
  Map: mkIcon(<><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>),
  Pen: mkIcon(<><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></>),
  Brain: mkIcon(<><path d="M9.5 2A5.5 5.5 0 0 0 4 7.5c0 1.58.67 3 1.74 4.01L4 14l2.5 1L5 18l3 2 1.5-3 2 1V22h1V18.07a5.5 5.5 0 0 0 0-11.14V2z"/><path d="M14.5 2A5.5 5.5 0 0 1 20 7.5c0 1.58-.67 3-1.74 4.01L20 14l-2.5 1L19 18l-3 2-1.5-3-2 1V22h-1V18.07"/></>),
  Settings: mkIcon(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>),
  Send: mkIcon(<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>),
  Plus: mkIcon(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>, 16),
  Trash: mkIcon(<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>, 14),
  Copy: mkIcon(<><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>, 14),
  Flame: mkIcon(<><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></>),
  Save: mkIcon(<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>, 14),
  Export: mkIcon(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>, 14),
  Undo: mkIcon(<><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></>, 14),
  Redo: mkIcon(<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></>, 14),
  Check: mkIcon(<><polyline points="20 6 9 17 4 12"/></>, 14),
  X: mkIcon(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>, 14),
  Menu: mkIcon(<><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>, 18),
  Search: mkIcon(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>, 14),
  Stop: mkIcon(<><rect x="6" y="6" width="12" height="12" rx="2"/></>, 14),
  Grip: mkIcon(<><circle cx="9" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1" fill="currentColor" stroke="none"/></>, 14),
  ChevDown: mkIcon(<><polyline points="6 9 12 15 18 9"/></>, 14),
  ChevRight: mkIcon(<><polyline points="9 18 15 12 9 6"/></>, 14),
  Cloud: mkIcon(<><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></>, 14),
  CloudCheck: mkIcon(<><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="11 15 13 17 17 13"/></>, 14),
  Zap: mkIcon(<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>, 14),
  Target: mkIcon(<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>, 14),
  Crosshair: mkIcon(<><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></>, 14),
  Maximize: mkIcon(<><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></>, 14),
  Minimize: mkIcon(<><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/></>, 14),
  Replace: mkIcon(<><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>, 14),
  ArrowDown: mkIcon(<><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>, 14),
  Sun: mkIcon(<><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>, 14),
  Moon: mkIcon(<><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>, 14),
  MessageCircle: mkIcon(<><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></>, 14),
  Wand: mkIcon(<><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8L19 13"/><path d="M15 9h0"/><path d="M17.8 6.2L19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2L11 5"/></>, 14),
  Bold: mkIcon(<><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></>, 14),
  Italic: mkIcon(<><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></>, 14),
  Type: mkIcon(<><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></>, 14),
  Heading: mkIcon(<><path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/></>, 14),
  Strikethrough: mkIcon(<><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/></>, 14),
  List: mkIcon(<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>, 14),
  AlignLeft: mkIcon(<><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></>, 14),
  ClearFormat: mkIcon(<><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/><line x1="3" y1="21" x2="21" y2="3" strokeWidth="1.5"/></>, 14),
  Sparkle: mkIcon(<><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/></>, 14),
  Eye: mkIcon(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>, 14),
  EyeOff: mkIcon(<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>, 14),
  FileText: mkIcon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>, 14),
};

const Spinner = memo(() => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "nf-spin 0.8s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
));

// ─── UTILITIES ───
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const wordCount = (text) => {
  if (!text) return 0;
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return 0;
  return clean.split(/\s+/).filter(w => w.length > 0).length;
};
const debounce = (fn, ms) => {
  let t;
  const d = (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  d.cancel = () => clearTimeout(t);
  return d;
};
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const estimateTokens = (text) => {
  if (!text) return 0;
  return Math.ceil(text.length / 3.5);
};
const stripThinkingTokens = (text) => {
  if (!text) return text;
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<think>[\s\S]*/gi, '').trim();
};

// ─── MARKDOWN RENDERER ───
const renderMarkdown = (text) => {
  if (!text) return "";
  let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html.replace(/```([\s\S]*?)```/g, '<pre style="background:var(--nf-bg-deep);padding:10px 14px;border-radius:8px;font-family:var(--nf-font-mono);font-size:11.5px;overflow-x:auto;margin:8px 0;border:1px solid var(--nf-border);line-height:1.6">$1</pre>');
  html = html.replace(/`([^`]+)`/g, '<code style="background:var(--nf-bg-deep);padding:1px 5px;border-radius:4px;font-family:var(--nf-font-mono);font-size:0.88em">$1</code>');
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
  html = html.replace(/^### (.+)$/gm, '<div style="font-size:14px;font-weight:700;margin:14px 0 6px;color:var(--nf-text)">$1</div>');
  html = html.replace(/^## (.+)$/gm, '<div style="font-size:15px;font-weight:700;margin:16px 0 6px;color:var(--nf-text)">$1</div>');
  html = html.replace(/^# (.+)$/gm, '<div style="font-size:17px;font-weight:700;margin:18px 0 8px;color:var(--nf-text)">$1</div>');
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--nf-border);margin:14px 0"/>');
  html = html.replace(/^- (.+)$/gm, '<div style="padding-left:18px;position:relative;margin:3px 0"><span style="position:absolute;left:5px;color:var(--nf-accent)">•</span>$1</div>');
  html = html.replace(/^(\d+)\. (.+)$/gm, '<div style="padding-left:22px;position:relative;margin:3px 0"><span style="position:absolute;left:0;color:var(--nf-accent-2);font-weight:600;font-size:0.9em">$1.</span>$2</div>');
  html = html.replace(/\n/g, '<br/>');
  return html;
};

// ─── SMART CONTEXT ENGINE ───
const ContextEngine = {
  _effectivePov(project, chapterIdx) {
    const chPov = project?.chapters?.[chapterIdx]?.pov;
    return chPov || project?.pov || "";
  },

  buildMinimalContext(project, chapterIdx) {
    if (!project) return "";
    const pov = this._effectivePov(project, chapterIdx);
    const p = [`[NOVEL: "${project.title}"]`];
    if (project.genre) p.push(`Genre: ${project.genre}`);
    if (project.tone) p.push(`Tone: ${project.tone}`);
    if (pov) p.push(`POV: ${pov}`);
    if (project.themes) p.push(`Themes: ${project.themes}`);
    if (project.heatLevel) p.push(`Heat: ${project.heatLevel}/5`);
    if (project.characters?.length) {
      p.push(`Characters: ${project.characters.map(c => `${c.name} (${c.role})`).join(", ")}`);
    }
    return p.join("\n");
  },

  buildFullContext(project, chapterIdx) {
    if (!project) return "";
    const pov = this._effectivePov(project, chapterIdx);
    const p = [];
    p.push(`[NOVEL BIBLE — "${project.title}"]`);
    if (project.synopsis) p.push(`SYNOPSIS: ${project.synopsis}`);
    if (project.genre) p.push(`GENRE: ${project.genre}`);
    if (project.tone) p.push(`TONE/VOICE: ${project.tone}`);
    if (pov) p.push(`POV: ${pov}${project.chapters?.[chapterIdx]?.pov ? " (chapter override)" : ""}`);
    if (project.themes) p.push(`THEMES: ${project.themes}`);
    if (project.heatLevel) p.push(`HEAT LEVEL: ${project.heatLevel}/5 — ${["Fade to black","Suggestive","Moderate explicit","Very explicit","Extremely graphic"][project.heatLevel-1]||"Moderate"}`);
    if (project.contentPrefs) p.push(`CONTENT PREFERENCES: ${project.contentPrefs}`);
    if (project.avoidList) p.push(`HARD LIMITS / AVOID: ${project.avoidList}`);
    if (project.writingStyle) p.push(`WRITING STYLE NOTES: ${project.writingStyle}`);
    if (project.characters?.length) {
      p.push("\n[CHARACTERS]");
      project.characters.forEach(c => {
        const l = [`★ ${c.name} (${c.role || "supporting"})`];
        [["gender","Gender"],["age","Age"],["pronouns","Pronouns"],["appearance","Appearance"],["personality","Personality"],["backstory","Backstory"],["desires","Desires/Motivations"],["speechPattern","Speech pattern"],["relationships","Relationships"],["kinks","Kinks/Preferences"],["arc","Character arc"],["notes","Notes"]].forEach(([k,label]) => { if (c[k]) l.push(`  ${label}: ${c[k]}`); });
        p.push(l.join("\n"));
      });
    }
    if (project.worldBuilding?.length) {
      p.push("\n[WORLD-BUILDING]");
      project.worldBuilding.forEach(w => {
        let entry = `• ${w.name}`;
        if (w.category) entry += ` [${w.category}]`;
        entry += `: ${w.description}`;
        p.push(entry);
      });
    }
    if (project.plotOutline?.length) {
      p.push("\n[PLOT OUTLINE]");
      project.plotOutline.forEach((pl, i) => {
        let line = `Ch${pl.chapter || i+1}: ${pl.title || "Untitled"}`;
        if (pl.pov) line += ` (POV: ${pl.pov})`;
        if (pl.summary) line += ` — ${pl.summary}`;
        if (pl.beats) line += ` | Beats: ${pl.beats}`;
        if (pl.sceneType) line += ` [${pl.sceneType}]`;
        p.push(line);
      });
    }
    if (project.relationships?.length) {
      p.push("\n[RELATIONSHIP DYNAMICS]");
      project.relationships.forEach(r => p.push(`${r.char1} ↔ ${r.char2}: ${r.dynamic} | Status: ${r.status || "developing"} | Tension: ${r.tension || "medium"}`));
    }
    if (project.continuityNotes) p.push(`\n[CONTINUITY NOTES]\n${project.continuityNotes}`);
    return p.join("\n");
  },

  buildChapterContext(project, currentChapterIdx) {
    if (!project?.chapters?.length) return "";
    const parts = ["\n[CHAPTER HISTORY]"];
    const start = Math.max(0, currentChapterIdx - 3);
    for (let i = start; i < currentChapterIdx; i++) {
      const ch = project.chapters[i];
      if (ch.summary) parts.push(`Ch${i+1} summary: ${ch.summary}`);
      else if (ch.content) {
        const plain = ch.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        parts.push(`Ch${i+1} (tail): ...${plain.slice(-800)}`);
      }
    }
    const cur = project.chapters[currentChapterIdx];
    if (cur?.content) {
      const plain = cur.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      let chHeader = `\n[CURRENT CHAPTER ${currentChapterIdx+1}]`;
      if (cur.pov) chHeader += ` (POV: ${cur.pov})`;
      parts.push(`${chHeader}\n...${plain.slice(-2500)}`);
    }
    return parts.join("\n");
  },

  buildSceneContext(sceneNotes) {
    return sceneNotes ? `\n[SCENE DIRECTION]\n${sceneNotes}` : "";
  },

  buildForMode(project, chapterIdx, sceneNotes, mode) {
    switch (mode) {
      case "summarize":
        return this.buildMinimalContext(project, chapterIdx) + "\n" + this.buildChapterContext(project, chapterIdx);
      case "brainstorm":
        return this.buildMinimalContext(project, chapterIdx) + "\n" + this.buildChapterContext(project, chapterIdx);
      case "continue":
      case "scene":
      case "dialogue":
      case "rewrite":
      default:
        return this.buildFullContext(project, chapterIdx) + "\n" + this.buildChapterContext(project, chapterIdx) + "\n" + this.buildSceneContext(sceneNotes);
    }
  }
};

// ─── DEFAULT FACTORIES ───
const createDefaultProject = () => ({
  id: uid(), title: "Untitled Novel", synopsis: "", genre: "Contemporary Romance",
  tone: "", pov: "Third person limited", themes: "", heatLevel: 3,
  contentPrefs: "", avoidList: "", writingStyle: "",
  characters: [], worldBuilding: [], plotOutline: [], relationships: [],
  continuityNotes: "",
  chapters: [{ id: uid(), title: "Chapter 1", content: "", summary: "", notes: "", sceneNotes: "", pov: "" }],
  createdAt: new Date().toISOString(),
  wordGoal: 0,
});

const createDefaultCharacter = () => ({
  id: uid(), name: "", role: "protagonist", gender: "", age: "", pronouns: "",
  appearance: "", personality: "", backstory: "", desires: "",
  speechPattern: "", relationships: "", kinks: "", arc: "", notes: "",
});

// ─── PERSISTENT STORAGE (localStorage) ───
const Storage = {
  async loadProjects() {
    try {
      const result = window.localStorage.getItem(LS_PROJECTS);
      return result ? JSON.parse(result) : [];
    } catch { return []; }
  },
  async saveProjects(p) {
    try { window.localStorage.setItem(LS_PROJECTS, JSON.stringify(p)); return true; } catch(e) { console.error("Save failed:", e); return false; }
  },
  async loadSettings() {
    try {
      const result = window.localStorage.getItem(LS_SETTINGS);
      return result ? JSON.parse(result) : {};
    } catch { return {}; }
  },
  async saveSettings(s) {
    try { window.localStorage.setItem(LS_SETTINGS, JSON.stringify(s)); return true; } catch(e) { return false; }
  },
  async loadTabChats() {
    try {
      const result = window.localStorage.getItem(LS_TAB_CHATS);
      return result ? JSON.parse(result) : {};
    } catch { return {}; }
  },
  async saveTabChats(c) {
    try { window.localStorage.setItem(LS_TAB_CHATS, JSON.stringify(c)); return true; } catch(e) { return false; }
  },
};

// ─── UNDO SYSTEM ───
const undoReducer = (state, action) => {
  switch (action.type) {
    case "push": {
      const last = state.past[state.past.length - 1];
      if (last && last.content === action.snapshot.content && last.chapterIdx === action.snapshot.chapterIdx) return state;
      return { past: [...state.past, action.snapshot].slice(-MAX_UNDO), future: [] };
    }
    case "undo": {
      if (!state.past.length) return state;
      return { past: state.past.slice(0, -1), future: [action.current, ...state.future].slice(0, MAX_UNDO) };
    }
    case "redo": {
      if (!state.future.length) return state;
      return { past: [...state.past, action.current], future: state.future.slice(1) };
    }
    case "reset": return { past: [], future: [] };
    default: return state;
  }
};

// ─── TOOLTIP ───
const Tooltip = memo(({ text, children }) => {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timerRef = useRef(null);

  const handleEnter = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ x: rect.left + rect.width / 2, y: rect.top });
    timerRef.current = setTimeout(() => setShow(true), 400);
  }, []);

  const handleLeave = useCallback(() => {
    clearTimeout(timerRef.current);
    setShow(false);
  }, []);

  return (
    <div onMouseEnter={handleEnter} onMouseLeave={handleLeave} style={{ display: "inline-flex" }}>
      {children}
      {show && (
        <div style={{
          position: "fixed", left: pos.x, top: pos.y - 6,
          transform: "translate(-50%, -100%)", zIndex: 10000,
          padding: "7px 12px", borderRadius: 8,
          background: "var(--nf-dialog-bg)", border: "1px solid var(--nf-border)",
          color: "var(--nf-text-dim)", fontSize: 11, lineHeight: 1.5,
          maxWidth: 280, textAlign: "center",
          boxShadow: "var(--nf-shadow-lg)",
          pointerEvents: "none", animation: "nf-fadeIn 0.1s ease-out",
          fontWeight: 400, whiteSpace: "normal",
        }}>
          {text}
        </div>
      )}
    </div>
  );
});

// ─── TOAST ───
const Toast = memo(({ message, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  const iconColor = type === "error" ? "var(--nf-accent)" : type === "success" ? "var(--nf-success)" : "var(--nf-accent-2)";
  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 9999,
      padding: "11px 18px", borderRadius: 12,
      background: "var(--nf-toast-bg)", backdropFilter: "blur(16px)",
      border: `1px solid var(--nf-toast-border)`,
      color: "var(--nf-text)", fontSize: 12.5, fontWeight: 500,
      boxShadow: "var(--nf-shadow-lg)", animation: "nf-slideUp 0.2s ease-out",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{ color: iconColor }}>{type === "success" ? <Icons.Check /> : type === "error" ? <Icons.X /> : <Icons.Wand />}</span>
      {message}
    </div>
  );
});

// ─── CONFIRM DIALOG ───
const ConfirmDialog = memo(({ message, onConfirm, onCancel, confirmLabel }) => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 9998,
    background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    animation: "nf-fadeIn 0.12s ease-out",
  }} onClick={onCancel}>
    <div onClick={e => e.stopPropagation()} style={{
      background: "var(--nf-dialog-bg)", border: "1px solid var(--nf-dialog-border)", borderRadius: 16,
      padding: "28px 32px", maxWidth: 400, width: "90%",
      boxShadow: "var(--nf-shadow-lg)",
    }}>
      <p style={{ color: "var(--nf-text)", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{message}</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onCancel} className="nf-btn nf-btn-ghost">Cancel</button>
        <button onClick={onConfirm} className="nf-btn nf-btn-danger">{confirmLabel || "Delete"}</button>
      </div>
    </div>
  </div>
));

// ─── DIFF / REVIEW MODAL ───
const DiffReviewModal = memo(({ original, proposed, onAccept, onReject, onInsertAtCursor }) => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 9997,
    background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    animation: "nf-fadeIn 0.12s ease-out",
  }} onClick={onReject}>
    <div onClick={e => e.stopPropagation()} style={{
      background: "var(--nf-diff-bg)", border: "1px solid var(--nf-diff-border)", borderRadius: 18,
      padding: 0, maxWidth: 920, width: "95%", maxHeight: "85vh",
      boxShadow: "var(--nf-shadow-lg)", display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--nf-diff-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--nf-font-display)", fontSize: 20, fontWeight: 500, color: "var(--nf-text)", letterSpacing: "-0.01em" }}>Review Content</span>
        <button onClick={onReject} className="nf-btn-icon"><Icons.X /></button>
      </div>
      <div style={{ flex: 1, overflow: "auto", display: "flex", gap: 0 }}>
        {original && (
          <div style={{ flex: 1, padding: 22, borderRight: "1px solid var(--nf-diff-border)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--nf-accent)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Original</div>
            <div style={{ fontFamily: "var(--nf-font-prose)", fontSize: 14, lineHeight: 1.9, color: "var(--nf-text-dim)", whiteSpace: "pre-wrap" }}>{original}</div>
          </div>
        )}
        <div style={{ flex: 1, padding: 22 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "var(--nf-success)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>{original ? "Proposed" : "Generated Content"}</div>
          <div style={{ fontFamily: "var(--nf-font-prose)", fontSize: 14, lineHeight: 1.9, color: "var(--nf-text)", whiteSpace: "pre-wrap" }}>{proposed}</div>
        </div>
      </div>
      <div style={{ padding: "14px 24px", borderTop: "1px solid var(--nf-diff-border)", display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button onClick={onReject} className="nf-btn nf-btn-ghost">Discard</button>
        {onInsertAtCursor && (
          <button onClick={onInsertAtCursor} className="nf-btn nf-btn-ghost" style={{ borderColor: "var(--nf-accent-2)" }}>
            <Icons.Crosshair /> Insert at Cursor
          </button>
        )}
        <button onClick={onAccept} className="nf-btn nf-btn-primary">
          <Icons.Check /> {original ? "Accept Rewrite" : "Append to Chapter"}
        </button>
      </div>
    </div>
  </div>
));

// ─── FIELD COMPONENT ───
const Field = memo(({ label, value, onChange, multiline, placeholder, small, type }) => (
  <div className="nf-field">
    {label && <label className="nf-label">{label}</label>}
    {multiline ? (
      <textarea value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`nf-textarea ${small ? "nf-textarea-sm" : ""}`} />
    ) : (
      <input value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        type={type || "text"} className="nf-input" />
    )}
  </div>
));

// ─── SELECT FIELD ───
const SelectField = memo(({ label, value, onChange, options, placeholder }) => (
  <div className="nf-field">
    {label && <label className="nf-label">{label}</label>}
    <select value={value || ""} onChange={e => onChange(e.target.value)} className="nf-select">
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => {
        const val = typeof opt === "string" ? opt : opt.value;
        const lab = typeof opt === "string" ? opt : opt.label;
        return <option key={val} value={val}>{lab}</option>;
      })}
    </select>
  </div>
));

// ─── MODEL SELECTOR ───
const ModelSelector = memo(({ apiKey, value, onChange }) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [fetchedOnce, setFetchedOnce] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const fetchModels = useCallback(async () => {
    if (!apiKey) { setError("Add API key first"); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(OPENROUTER_MODELS_URL, { headers: { "Authorization": `Bearer ${apiKey}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setModels((data.data || []).sort((a, b) => (a.id || "").localeCompare(b.id || "")));
      setFetchedOnce(true);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [apiKey]);

  useEffect(() => {
    if (open && !fetchedOnce && apiKey) fetchModels();
  }, [open, fetchedOnce, apiKey, fetchModels]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return models.slice(0, 80);
    const q = search.toLowerCase();
    return models.filter(m => m.id.toLowerCase().includes(q) || (m.name || "").toLowerCase().includes(q)).slice(0, 50);
  }, [models, search]);

  const displayName = models.find(m => m.id === value)?.name || value || "Select model...";

  const formatPrice = (p) => {
    if (!p) return "–";
    const n = parseFloat(p);
    if (n === 0) return "free";
    return `$${(n * 1000000).toFixed(n < 0.001 ? 1 : 0)}/M`;
  };

  return (
    <div className="nf-field" ref={dropdownRef} style={{ position: "relative" }}>
      <label className="nf-label">Model</label>
      <button type="button" onClick={() => { setOpen(!open); if (!open) setTimeout(() => inputRef.current?.focus(), 50); }}
        className="nf-input" style={{ textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontSize: 12 }}>{displayName}</span>
        <Icons.ChevDown />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200,
          background: "var(--nf-dialog-bg)", border: "1px solid var(--nf-border)", borderRadius: 12,
          boxShadow: "var(--nf-shadow-lg)", maxHeight: 340, display: "flex", flexDirection: "column",
          marginTop: 4, overflow: "hidden",
        }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--nf-border)", display: "flex", alignItems: "center", gap: 6 }}>
            <Icons.Search />
            <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search models..."
              className="nf-input" style={{ border: "none", background: "none", padding: "4px 0", fontSize: 12 }}
              onKeyDown={e => {
                if (e.key === "Escape") setOpen(false);
                if (e.key === "Enter" && filtered.length > 0) { onChange(filtered[0].id); setOpen(false); setSearch(""); }
              }} />
            <button onClick={fetchModels} className="nf-btn-icon" style={{ padding: 2 }} title="Refresh">
              {loading ? <Spinner /> : <Icons.Zap />}
            </button>
          </div>
          {error && <div style={{ padding: "8px 12px", color: "var(--nf-accent)", fontSize: 11 }}>{error}</div>}
          <div style={{ overflow: "auto", flex: 1 }}>
            {loading && !models.length && <div style={{ padding: 20, textAlign: "center", color: "var(--nf-text-muted)", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Spinner /> Loading...</div>}
            {filtered.map(m => (
              <button key={m.id} onClick={() => { onChange(m.id); setOpen(false); setSearch(""); }}
                style={{
                  display: "flex", flexDirection: "column", gap: 2,
                  width: "100%", padding: "8px 12px", border: "none", borderBottom: "1px solid var(--nf-border)",
                  background: m.id === value ? "var(--nf-bg-hover)" : "transparent",
                  cursor: "pointer", textAlign: "left", color: "var(--nf-text)", transition: "background 0.1s",
                }}
                onMouseEnter={e => { if (m.id !== value) e.currentTarget.style.background = "var(--nf-bg-hover)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = m.id === value ? "var(--nf-bg-hover)" : "transparent"; }}>
                <div style={{ fontSize: 12, fontWeight: m.id === value ? 600 : 400 }}>{m.name || m.id}</div>
                <div style={{ fontSize: 10, color: "var(--nf-text-muted)", display: "flex", gap: 8 }}>
                  <span style={{ opacity: 0.7 }}>{m.id}</span>
                  {m.pricing && <span style={{ color: "var(--nf-accent-2)" }}>In: {formatPrice(m.pricing.prompt)} · Out: {formatPrice(m.pricing.completion)}</span>}
                  {m.context_length && <span>{(m.context_length / 1000).toFixed(0)}k ctx</span>}
                </div>
              </button>
            ))}
            {!loading && filtered.length === 0 && <div style={{ padding: 16, textAlign: "center", color: "var(--nf-text-muted)", fontSize: 12 }}>{models.length === 0 ? "Click ⚡ to load models" : "No models match"}</div>}
          </div>
        </div>
      )}
    </div>
  );
});

// ─── SAVE STATUS ───
const SaveIndicator = memo(({ status }) => {
  const styles = { saving: { color: "var(--nf-accent-2)", text: "Saving..." }, saved: { color: "var(--nf-success)", text: "Saved" }, error: { color: "var(--nf-accent)", text: "Failed" }, idle: { color: "var(--nf-text-muted)", text: "" } };
  const s = styles[status] || styles.idle;
  if (!s.text) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: s.color, fontWeight: 500, letterSpacing: "0.04em" }}>
      {status === "saving" ? <Spinner /> : status === "saved" ? <Icons.CloudCheck /> : <Icons.X />}
      {s.text}
    </div>
  );
});

// ─── WORD GOAL PROGRESS BAR ───
const WordGoalBar = memo(({ current, goal, sessionWords }) => {
  if (!goal || goal <= 0) return null;
  const pct = Math.min((current / goal) * 100, 100);
  const done = current >= goal;
  return (
    <div style={{ padding: "6px 20px 8px", borderBottom: "1px solid var(--nf-border)", background: "var(--nf-bg-raised)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: done ? "var(--nf-success)" : "var(--nf-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {done ? "✦ Goal reached!" : `${current.toLocaleString()} / ${goal.toLocaleString()} words`}
        </span>
        {sessionWords > 0 && <span style={{ fontSize: 10, color: "var(--nf-success)", fontWeight: 500 }}>+{sessionWords.toLocaleString()} this session</span>}
      </div>
      <div style={{ height: 3, background: "var(--nf-bg-deep)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 2, width: `${pct}%`,
          background: done ? "var(--nf-success)" : "linear-gradient(90deg, var(--nf-accent), var(--nf-accent-2))",
          transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
});

// ─── RICH TEXT TOOLBAR ───
const RichTextToolbar = memo(({ editorRef, onContentChange }) => {
  const exec = useCallback((cmd, val = null) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(cmd, false, val);
    if (onContentChange) setTimeout(onContentChange, 0);
  }, [editorRef, onContentChange]);

  const btn = (title, icon, action) => (
    <Tooltip text={title}>
      <button onClick={action} className="nf-toolbar-btn">{icon}</button>
    </Tooltip>
  );

  return (
    <div className="nf-rich-toolbar">
      {btn("Bold", <Icons.Bold />, () => exec("bold"))}
      {btn("Italic", <Icons.Italic />, () => exec("italic"))}
      {btn("Strikethrough", <Icons.Strikethrough />, () => exec("strikeThrough"))}
      <div className="nf-toolbar-sep" />
      {btn("Heading", <Icons.Heading />, () => exec("formatBlock", "h3"))}
      {btn("Paragraph", <Icons.Type />, () => exec("formatBlock", "p"))}
      {btn("List", <Icons.List />, () => exec("insertUnorderedList"))}
      <div className="nf-toolbar-sep" />
      {btn("Separator", <span style={{ fontSize: 14, lineHeight: 1, opacity: 0.7 }}>―</span>, () => exec("insertHTML", '<hr style="border:none;border-top:1px solid var(--nf-border);margin:16px 0"/>'))}
      {btn("Clear formatting", <Icons.ClearFormat />, () => exec("removeFormat"))}
    </div>
  );
});

// ─── TAB AI CHAT ───
const TabAIChat = memo(({ project, settings, tabName, tabContext, placeholder, onAutoFill, messages, setMessages }) => {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const chatEndRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = useCallback(async (customMsg) => {
    const msgText = customMsg || input.trim();
    if (!msgText || isGenerating) return;
    const userMsg = { id: uid(), role: "user", content: msgText };
    setMessages(prev => [...prev, userMsg]);
    if (!customMsg) setInput("");
    setIsGenerating(true);

    try {
      const contextInfo = ContextEngine.buildFullContext(project, 0);
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const allMessages = [
        { role: "system", content: `You are an expert fiction writing assistant. You are helping with ${tabContext}.

Novel context:
${contextInfo}

RULES:
- Be conversational and helpful.
- Use **bold** and *italic* markdown.
- When generating structured data, wrap in a JSON code block:
\`\`\`json
{ "type": "${tabName}", "data": { ... } }
\`\`\`
- For CHARACTER: name, role, gender, age, pronouns, appearance, personality, backstory, desires, speechPattern, relationships, kinks, arc, notes
- For WORLD: name, category, description
- For PLOT: chapter, title, summary, beats, sceneType, pov
- For RELATIONSHIP: char1, char2, dynamic, status, tension, notes
- Be creative, specific, genre-aware.` },
        ...history,
        { role: "user", content: msgText },
      ];

      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${settings.apiKey}`, "HTTP-Referer": window.location.origin, "X-Title": "NovelForge" },
        body: JSON.stringify({ model: settings.model, messages: allMessages, max_tokens: 2048, temperature: 0.8 }),
        signal: controller.signal,
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `API error ${res.status}`); }
      const data = await res.json();
      const content = stripThinkingTokens(data.choices?.[0]?.message?.content || "");
      
      let hasAutoFill = false;
      try {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
        if (jsonMatch) { const p = JSON.parse(jsonMatch[1]); if (p.type && p.data) hasAutoFill = true; }
      } catch {}
      
      setMessages(prev => [...prev, { id: uid(), role: "assistant", content, hasAutoFill }]);
    } catch (err) {
      if (err.name !== "AbortError") {
        setMessages(prev => [...prev, { id: uid(), role: "assistant", content: `Error: ${err.message}`, isError: true }]);
      }
    }
    abortRef.current = null;
    setIsGenerating(false);
  }, [input, isGenerating, messages, project, settings, tabContext, tabName, setMessages]);

  const handleAutoFill = useCallback((content) => {
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) { const p = JSON.parse(jsonMatch[1]); if (p.data && onAutoFill) onAutoFill(p.data); }
    } catch {}
  }, [onAutoFill]);

  const quickActions = useMemo(() => {
    switch (tabName) {
      case "characters": return [
        { label: "✦ Generate character", msg: "Generate a compelling character for my story considering genre, themes, and existing cast. Include all fields." },
        { label: "Fill empty fields", msg: "Fill in any empty fields for the currently selected character based on existing details. Return structured JSON." },
      ];
      case "world": return [
        { label: "✦ Generate entry", msg: "Generate an enriching world-building entry. Include name, category, and rich description." },
        { label: "Expand world", msg: "Suggest 3 new entries that would deepen my world. Explain why each matters." },
      ];
      case "plot": return [
        { label: "✦ Generate outline", msg: "Generate a chapter outline for the next unplanned chapter. Include title, summary, beats, scene type." },
        { label: "Full arc plan", msg: "Suggest a complete story arc. Map turning points, climax, resolution with specific emotional beats." },
      ];
      case "relationships": return [
        { label: "✦ Generate dynamic", msg: "Generate a compelling relationship dynamic between two of my characters. Include all fields." },
        { label: "Deepen tension", msg: "Suggest ways to deepen tension in my existing relationships. Be specific about scenes." },
      ];
      default: return [];
    }
  }, [tabName]);

  return (
    <div className="nf-tab-ai-panel">
      <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--nf-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "var(--nf-accent-2)" }}><Icons.Wand /></span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--nf-text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI</span>
          {messages.length > 0 && <span style={{ fontSize: 10, color: "var(--nf-text-muted)" }}>({messages.length})</span>}
        </div>
        {messages.length > 0 && <button onClick={() => setMessages([])} className="nf-btn-micro"><Icons.Trash /> Clear</button>}
      </div>
      {quickActions.length > 0 && (
        <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--nf-border)", display: "flex", gap: 4, flexWrap: "wrap" }}>
          {quickActions.map((qa, i) => (
            <button key={i} onClick={() => handleSend(qa.msg)} disabled={isGenerating || !settings.apiKey}
              className="nf-btn-micro" style={{ fontSize: 10 }}>{qa.label}</button>
          ))}
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "28px 14px", color: "var(--nf-text-muted)", fontSize: 11.5, lineHeight: 1.7 }}>
            <div style={{ fontSize: 20, marginBottom: 8, opacity: 0.3 }}>✦</div>
            <div>{placeholder || "Ask me to help create or refine content."}</div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{ marginBottom: 8, display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", animation: "nf-slideUp 0.15s ease-out" }}>
            <div style={{
              maxWidth: "95%", padding: "9px 12px", borderRadius: 10,
              background: msg.isError ? "var(--nf-error-bg)" : msg.role === "user" ? "var(--nf-chat-bubble-user-bg)" : "var(--nf-chat-bubble-bg)",
              border: `1px solid ${msg.isError ? "var(--nf-error-border)" : msg.role === "user" ? "var(--nf-chat-bubble-user-border)" : "var(--nf-border)"}`,
              color: "var(--nf-text)", fontSize: 12, lineHeight: 1.7, wordBreak: "break-word",
            }}
            dangerouslySetInnerHTML={{ __html: msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br/>") }} />
            {msg.role === "assistant" && msg.hasAutoFill && !msg.isError && (
              <button onClick={() => handleAutoFill(msg.content)} className="nf-btn-micro" style={{ marginTop: 4, borderColor: "var(--nf-accent-2)", color: "var(--nf-accent-2)" }}>
                <Icons.Sparkle /> Apply to fields
              </button>
            )}
          </div>
        ))}
        {isGenerating && <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--nf-text-dim)", fontSize: 12, padding: 8 }}><Spinner /> Thinking...</div>}
        <div ref={chatEndRef} />
      </div>
      <div style={{ padding: 8, borderTop: "1px solid var(--nf-border)", display: "flex", gap: 6 }}>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Ask the AI..." className="nf-chat-textarea" style={{ fontSize: 12, minHeight: 36 }} />
        {isGenerating ? (
          <button onClick={() => abortRef.current?.abort()} className="nf-send-btn" style={{ background: "var(--nf-accent)" }}><Icons.Stop /></button>
        ) : (
          <button onClick={() => handleSend()} disabled={!settings.apiKey || isGenerating} className="nf-send-btn"><Icons.Send /></button>
        )}
      </div>
    </div>
  );
});


// ════════════════════════════════════════
// ─── MAIN APP ───
// ════════════════════════════════════════
export default function NovelForge() {
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeTab, setActiveTab] = useState("write");
  const [settings, setSettings] = useState({
    apiKey: "", model: "anthropic/claude-sonnet-4", maxTokens: 4096,
    temperature: 0.85, systemPrompt: "",
    frequencyPenalty: 0.1, presencePenalty: 0.15,
  });
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [showProjectList, setShowProjectList] = useState(true);
  const [editingCharId, setEditingCharId] = useState(null);
  const [genMode, setGenMode] = useState("continue");
  const [showMemoryPreview, setShowMemoryPreview] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [projectSearch, setProjectSearch] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [showAiMobile, setShowAiMobile] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [diffReview, setDiffReview] = useState(null);
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState(null);
  const [sessionWordsStart, setSessionWordsStart] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [tabChatHistories, setTabChatHistories] = useState({});
  const [showApiKey, setShowApiKey] = useState(false);

  const chatEndRef = useRef(null);
  const editorRef = useRef(null);
  const abortRef = useRef(null);
  const streamingContentRef = useRef("");
  const [undoState, undoDispatch] = useReducer(undoReducer, { past: [], future: [] });

  const showToast = useCallback((message, type = "info") => setToast({ message, type, key: Date.now() }), []);
  const toggleTheme = useCallback(() => setTheme(prev => prev === "dark" ? "light" : "dark"), []);

  const themeVars = useMemo(() => Object.entries(THEMES[theme]).map(([k, v]) => `${k}: ${v};`).join("\n"), [theme]);

  // ─── RESPONSIVE ───
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ─── LOAD ───
  useEffect(() => {
    (async () => {
      try {
        const [p, s, tc] = await Promise.all([Storage.loadProjects(), Storage.loadSettings(), Storage.loadTabChats()]);
        if (p.length) { setProjects(p); setActiveProjectId(p[0].id); }
        if (s.apiKey) setSettings(prev => ({ ...prev, ...s }));
        if (s.theme) setTheme(s.theme);
        if (tc) setTabChatHistories(tc);
      } catch(e) { console.error("Load:", e); }
      setIsLoaded(true);
    })();
  }, []);

  // ─── DEBOUNCED SAVE ───
  const debouncedSaveProjects = useMemo(() => debounce(async (p) => {
    setSaveStatus("saving");
    const ok = await Storage.saveProjects(p);
    setSaveStatus(ok ? "saved" : "error");
    if (ok) setTimeout(() => setSaveStatus(prev => prev === "saved" ? "idle" : prev), 2000);
  }, SAVE_DEBOUNCE_MS), []);

  const debouncedSaveSettings = useMemo(() => debounce((s) => Storage.saveSettings(s), SAVE_DEBOUNCE_MS), []);
  const debouncedSaveTabChats = useMemo(() => debounce((c) => Storage.saveTabChats(c), SAVE_DEBOUNCE_MS * 2), []);

  useEffect(() => { if (isLoaded && projects.length) debouncedSaveProjects(projects); }, [projects, isLoaded, debouncedSaveProjects]);
  useEffect(() => { if (isLoaded) debouncedSaveSettings({ ...settings, theme }); }, [settings, theme, isLoaded, debouncedSaveSettings]);
  useEffect(() => { if (isLoaded) debouncedSaveTabChats(tabChatHistories); }, [tabChatHistories, isLoaded, debouncedSaveTabChats]);
  useEffect(() => () => { debouncedSaveProjects.cancel(); debouncedSaveSettings.cancel(); debouncedSaveTabChats.cancel(); }, [debouncedSaveProjects, debouncedSaveSettings, debouncedSaveTabChats]);

  // ─── SCROLL CHAT ───
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages, streamingContent]);

  // ─── DERIVED STATE ───
  const project = useMemo(() => projects.find(p => p.id === activeProjectId) || null, [projects, activeProjectId]);
  const activeChapter = useMemo(() => project?.chapters?.[activeChapterIdx] || null, [project, activeChapterIdx]);
  const editingChar = useMemo(() => {
    if (!editingCharId || !project?.characters) return null;
    return project.characters.find(c => c.id === editingCharId) || null;
  }, [editingCharId, project?.characters]);
  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) return projects;
    const q = projectSearch.toLowerCase();
    return projects.filter(p => p.title.toLowerCase().includes(q) || p.genre?.toLowerCase().includes(q));
  }, [projects, projectSearch]);

  const totalProjectWords = useMemo(() => {
    if (!project?.chapters) return 0;
    return project.chapters.reduce((sum, ch) => sum + wordCount(ch.content), 0);
  }, [project?.chapters]);

  useEffect(() => {
    if (project && sessionWordsStart === null) setSessionWordsStart(totalProjectWords);
  }, [project?.id]); // eslint-disable-line

  const sessionWords = sessionWordsStart !== null ? Math.max(0, totalProjectWords - sessionWordsStart) : 0;

  useEffect(() => {
    if (project?.chapters && activeChapterIdx >= project.chapters.length)
      setActiveChapterIdx(Math.max(0, project.chapters.length - 1));
  }, [project?.chapters?.length, activeChapterIdx, project?.chapters]);

  // ─── TAB CHAT HELPERS ───
  const getTabMessages = useCallback((tab) => tabChatHistories[`${activeProjectId}:${tab}`] || [], [tabChatHistories, activeProjectId]);
  const setTabMessages = useCallback((tab) => (updater) => {
    setTabChatHistories(prev => {
      const key = `${activeProjectId}:${tab}`;
      const current = prev[key] || [];
      return { ...prev, [key]: typeof updater === "function" ? updater(current) : updater };
    });
  }, [activeProjectId]);

  // ─── UPDATE HELPERS ───
  const updateProject = useCallback((updates) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, ...updates } : p));
  }, [activeProjectId]);

  const updateChapter = useCallback((idx, updates) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      const chapters = [...p.chapters];
      if (!chapters[idx]) return p;
      chapters[idx] = { ...chapters[idx], ...updates };
      return { ...p, chapters };
    }));
  }, [activeProjectId]);

  const updateCharById = useCallback((charId, field, value) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      return { ...p, characters: p.characters.map(c => c.id === charId ? { ...c, [field]: value } : c) };
    }));
  }, [activeProjectId]);

  const sceneNotes = activeChapter?.sceneNotes || "";
  const setSceneNotes = useCallback((val) => updateChapter(activeChapterIdx, { sceneNotes: val }), [activeChapterIdx, updateChapter]);

  // ─── CHAPTER REORDER ───
  const moveChapter = useCallback((fromIdx, toIdx) => {
    if (!project?.chapters) return;
    const chs = [...project.chapters];
    const [moved] = chs.splice(fromIdx, 1);
    chs.splice(toIdx, 0, moved);
    updateProject({ chapters: chs });
    if (activeChapterIdx === fromIdx) setActiveChapterIdx(toIdx);
    else if (fromIdx < activeChapterIdx && toIdx >= activeChapterIdx) setActiveChapterIdx(activeChapterIdx - 1);
    else if (fromIdx > activeChapterIdx && toIdx <= activeChapterIdx) setActiveChapterIdx(activeChapterIdx + 1);
  }, [project, activeChapterIdx, updateProject]);

  // ─── UNDO ───
  const lastContentRef = useRef(null);
  const pushUndo = useCallback(() => {
    if (activeChapter?.content != null && activeChapter.content !== lastContentRef.current) {
      undoDispatch({ type: "push", snapshot: { chapterIdx: activeChapterIdx, content: activeChapter.content } });
      lastContentRef.current = activeChapter.content;
    }
  }, [activeChapter, activeChapterIdx]);

  const handleUndo = useCallback(() => {
    if (!undoState.past.length) return;
    const snap = undoState.past[undoState.past.length - 1];
    undoDispatch({ type: "undo", current: { chapterIdx: activeChapterIdx, content: activeChapter?.content || "" } });
    updateChapter(snap.chapterIdx, { content: snap.content });
    showToast("Undone", "success");
  }, [undoState.past, activeChapterIdx, activeChapter, updateChapter, showToast]);

  const handleRedo = useCallback(() => {
    if (!undoState.future.length) return;
    const snap = undoState.future[0];
    undoDispatch({ type: "redo", current: { chapterIdx: activeChapterIdx, content: activeChapter?.content || "" } });
    updateChapter(snap.chapterIdx, { content: snap.content });
    showToast("Redone", "success");
  }, [undoState.future, activeChapterIdx, activeChapter, updateChapter, showToast]);

  // ─── EDITOR TEXT SELECTION ───
  const handleEditorSelect = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
      const text = sel.toString();
      if (text.length > 0) {
        setSelectedText(text);
        try { setSelectionRange({ sel: sel.getRangeAt(0).cloneRange() }); } catch { setSelectionRange(null); }
      } else {
        setSelectedText(""); setSelectionRange(null);
      }
    }
  }, []);

  // ─── EDITOR CONTENT SYNC ───
  const syncEditorContent = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    updateChapter(activeChapterIdx, { content: el.innerHTML });
  }, [activeChapterIdx, updateChapter]);

  const lastSyncedChapterRef = useRef(null);
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const key = `${activeProjectId}-${activeChapterIdx}`;
    // Re-populate if chapter changed OR if editor is empty but content exists (tab switch remount)
    const editorEmpty = !el.innerHTML || el.innerHTML === "<br>";
    const hasContent = !!(activeChapter?.content);
    if (lastSyncedChapterRef.current !== key || (editorEmpty && hasContent)) {
      lastSyncedChapterRef.current = key;
      const content = activeChapter?.content || "";
      if (content.includes("<") && (content.includes("</") || content.includes("<br") || content.includes("<p"))) {
        el.innerHTML = content;
      } else {
        el.innerHTML = content ? content.split("\n\n").map(p => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("") : "";
      }
    }
  }, [activeChapter?.content, activeChapterIdx, activeProjectId, activeTab]);

  // ─── API CALLS ───
  const callOpenRouterStream = useCallback(async (messages, opts = {}) => {
    if (!settings.apiKey) throw new Error("Set your OpenRouter API key in Settings first.");
    const controller = new AbortController();
    abortRef.current = controller;
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${settings.apiKey}`, "HTTP-Referer": window.location.origin, "X-Title": "NovelForge" },
      body: JSON.stringify({
        model: opts.model || settings.model, messages,
        max_tokens: opts.maxTokens || settings.maxTokens,
        temperature: opts.temperature ?? settings.temperature,
        top_p: 0.95,
        frequency_penalty: opts.frequencyPenalty ?? settings.frequencyPenalty,
        presence_penalty: opts.presencePenalty ?? settings.presencePenalty,
        stream: true,
      }),
      signal: controller.signal,
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `API error ${res.status}`); }
    return res;
  }, [settings]);

  const callOpenRouter = useCallback(async (messages, opts = {}) => {
    if (!settings.apiKey) throw new Error("Set your OpenRouter API key in Settings first.");
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${settings.apiKey}`, "HTTP-Referer": window.location.origin, "X-Title": "NovelForge" },
      body: JSON.stringify({
        model: opts.model || settings.model, messages,
        max_tokens: opts.maxTokens || settings.maxTokens,
        temperature: opts.temperature ?? settings.temperature,
        top_p: 0.95,
        frequency_penalty: opts.frequencyPenalty ?? settings.frequencyPenalty,
        presence_penalty: opts.presencePenalty ?? settings.presencePenalty,
      }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `API error ${res.status}`); }
    const data = await res.json();
    return stripThinkingTokens(data.choices?.[0]?.message?.content || "");
  }, [settings]);

  const buildSystemPrompt = useCallback((mode) => {
    const effectivePov = activeChapter?.pov || project?.pov || "";
    const base = `You are an elite creative writing AI specializing in fiction and romance. You are collaborating with a novelist. Your output must be:
— Sophisticated prose: vivid imagery, precise verbs, varied rhythm
— Character-authentic: true dialogue, true thoughts
— Consistent with tone, POV${effectivePov ? ` (${effectivePov})` : ""}, and heat level
— Seamless with existing content — match vocabulary, pacing, narrative distance
— Rich in sensory detail: sight, sound, texture, scent, taste
— Emotionally layered: subtext, conflicting desires, physical-emotional mirroring
— Paced with intention: tension and release, slow burns and crescendos
— NEVER break fourth wall, add meta-commentary, or content warnings
— NEVER use: "a dance of", "ministrations", "orbs" (eyes), "digits" (fingers), clichéd markers
— Maintain perfect continuity
— Respond ONLY with creative content. No preamble, no sign-offs.
— Use markdown: **bold** for emphasis, *italic* for internal monologue.

${settings.systemPrompt ? `ADDITIONAL DIRECTIVES:\n${settings.systemPrompt}\n` : ""}`;

    return `${base}\n${ContextEngine.buildForMode(project, activeChapterIdx, sceneNotes, mode)}`;
  }, [project, activeChapterIdx, activeChapter?.pov, sceneNotes, settings.systemPrompt]);

  const modePrompts = useMemo(() => ({
    continue: "Continue writing from exactly where the text leaves off. Match style, distance, register. Do not summarize or skip — write the next moment.",
    scene: "Write the next scene from the scene direction. Ground in physical space with sensory detail. Let character dynamics drive pacing.",
    dialogue: "Write dialogue-driven passage. Distinct voices, action beats, internal reactions. Advance plot and emotion simultaneously.",
    rewrite: "Rewrite the passage. Preserve plot and beats but elevate: sharper imagery, better rhythm, deeper interiority.",
    brainstorm: "Brainstorm 3-5 distinct directions. Consider arcs, momentum, pacing needs. Specific scene ideas, not vague suggestions.",
    summarize: "Detailed summary: events, emotional states, relationship shifts, continuity details, unresolved threads.",
  }), []);

  // ─── STREAMING ───
  const processStream = useCallback(async (res) => {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "", buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;
        try {
          const delta = JSON.parse(data).choices?.[0]?.delta?.content;
          if (delta) { full += delta; streamingContentRef.current = full; setStreamingContent(stripThinkingTokens(full)); }
        } catch {}
      }
    }
    return stripThinkingTokens(full);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;
    const userMsg = chatInput.trim() || modePrompts[genMode];
    if (!userMsg) return;
    setIsGenerating(true); setStreamingContent(""); streamingContentRef.current = "";
    const userMsgObj = { id: uid(), role: "user", content: userMsg, mode: genMode };
    setChatMessages(prev => [...prev.slice(-(CHAT_HISTORY_LIMIT - 1)), userMsgObj]);
    setChatInput("");

    try {
      let contextualUserMsg = `[MODE: ${genMode.toUpperCase()}]\n${modePrompts[genMode]}`;
      if (genMode === "rewrite" && selectedText) contextualUserMsg += `\n\n[TEXT TO REWRITE]\n${selectedText}`;
      if (userMsg !== modePrompts[genMode]) contextualUserMsg += `\n\n[AUTHOR'S DIRECTION]\n${userMsg}`;
      const history = chatMessages.filter(m => !m.isError).slice(-6).map(m => ({ role: m.role, content: m.content }));
      const messages = [{ role: "system", content: buildSystemPrompt(genMode) }, ...history, { role: "user", content: contextualUserMsg }];
      const res = await callOpenRouterStream(messages);
      const finalContent = await processStream(res) || "(No response)";
      setChatMessages(prev => [...prev, { id: uid(), role: "assistant", content: finalContent, mode: genMode }]);
    } catch (err) {
      if (err.name === "AbortError") {
        const partial = stripThinkingTokens(streamingContentRef.current);
        if (partial) setChatMessages(prev => [...prev, { id: uid(), role: "assistant", content: partial + "\n\n[stopped]", mode: genMode }]);
        showToast("Stopped", "info");
      } else {
        setChatMessages(prev => [...prev, { id: uid(), role: "assistant", content: `Error: ${err.message}`, isError: true }]);
      }
    }
    setStreamingContent(""); streamingContentRef.current = "";
    abortRef.current = null; setIsGenerating(false);
  }, [isGenerating, chatInput, genMode, modePrompts, buildSystemPrompt, chatMessages, callOpenRouterStream, processStream, selectedText, showToast]);

  // ─── KEYBOARD SHORTCUTS ───
  useEffect(() => {
    const handler = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "Enter") { e.preventDefault(); handleGenerate(); }
      if (mod && e.shiftKey && e.key.toLowerCase() === "f") { e.preventDefault(); setFocusMode(prev => !prev); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleGenerate]);

  // ─── INSERT METHODS ───
  const appendToChapter = useCallback((text) => {
    if (!activeChapter) return;
    pushUndo();
    const el = editorRef.current;
    if (el) {
      el.innerHTML += "<br/><br/>" + renderMarkdown(text);
      syncEditorContent();
    } else {
      updateChapter(activeChapterIdx, { content: (activeChapter.content || "") + "\n\n" + text });
    }
    showToast("Appended", "success");
  }, [activeChapter, activeChapterIdx, updateChapter, pushUndo, showToast, syncEditorContent]);

  const insertAtCursor = useCallback((text) => {
    if (!activeChapter || !editorRef.current) return;
    pushUndo();
    editorRef.current.focus();
    document.execCommand("insertHTML", false, "<br/><br/>" + renderMarkdown(text) + "<br/><br/>");
    syncEditorContent();
    showToast("Inserted", "success");
  }, [activeChapter, pushUndo, showToast, syncEditorContent]);

  const replaceSelection = useCallback((text) => {
    if (!activeChapter || !selectionRange?.sel) return;
    pushUndo();
    const el = editorRef.current;
    el.focus();
    try {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(selectionRange.sel);
      document.execCommand("insertHTML", false, renderMarkdown(text));
      syncEditorContent();
      setSelectedText(""); setSelectionRange(null);
      showToast("Replaced", "success");
    } catch { showToast("Selection expired — use Append instead", "error"); }
  }, [activeChapter, selectionRange, pushUndo, showToast, syncEditorContent]);

  const reviewBeforeInsert = useCallback((content, mode) => {
    if (mode === "rewrite" && selectedText) {
      setDiffReview({
        original: selectedText, proposed: content,
        onAccept: () => { replaceSelection(content); setDiffReview(null); },
        onReject: () => setDiffReview(null),
      });
    } else {
      setDiffReview({
        original: null, proposed: content,
        onAccept: () => { appendToChapter(content); setDiffReview(null); },
        onReject: () => setDiffReview(null),
        onInsertAtCursor: () => { insertAtCursor(content); setDiffReview(null); },
      });
    }
  }, [selectedText, replaceSelection, appendToChapter, insertAtCursor]);

  const autoSummarizeChapter = useCallback(async (idx) => {
    const ch = project?.chapters?.[idx];
    if (!ch?.content || wordCount(ch.content) < 50) { showToast("Chapter too short", "error"); return; }
    setIsGenerating(true);
    try {
      const plain = ch.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const sample = plain.length > 12000 ? plain.slice(0, 4000) + "\n[...]\n" + plain.slice(-4000) : plain;
      const summary = await callOpenRouter([
        { role: "system", content: "Summarize in 3-5 sentences. Note: plot events, emotional states, relationship shifts, continuity details. Use character names. Be specific." },
        { role: "user", content: sample },
      ], { maxTokens: 600, temperature: 0.3 });
      updateChapter(idx, { summary });
      showToast("Summarized", "success");
    } catch(e) { showToast(`Failed: ${e.message}`, "error"); }
    setIsGenerating(false);
  }, [project, callOpenRouter, updateChapter, showToast]);

  const handleExportTxt = useCallback(() => {
    if (!project) return;
    const text = project.chapters?.map(ch => {
      const plain = (ch.content || "").replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      return `${"═".repeat(50)}\n  ${ch.title}\n${"═".repeat(50)}\n\n${plain || "(empty)"}\n`;
    }).join("\n\n") || "";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: `${project.title}.txt` }).click();
    URL.revokeObjectURL(url); showToast("Exported .txt", "success");
  }, [project, showToast]);

  const handleExportJson = useCallback(() => {
    if (!project) return;
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: `${project.title}.json` }).click();
    URL.revokeObjectURL(url); showToast("Exported JSON", "success");
  }, [project, showToast]);

  const handleImportJson = useCallback((e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!imported.title || !Array.isArray(imported.chapters)) { showToast("Invalid project file", "error"); return; }
        imported.id = uid();
        imported.chapters = imported.chapters.map(ch => ({ ...ch, id: ch.id || uid() }));
        setProjects(prev => [imported, ...prev]);
        setActiveProjectId(imported.id); setActiveChapterIdx(0);
        showToast(`Imported "${imported.title}"`, "success");
      } catch { showToast("Invalid JSON", "error"); }
    };
    reader.readAsText(file); e.target.value = "";
  }, [showToast]);

  const handleCopyMsg = useCallback(async (msg) => {
    try { await navigator.clipboard.writeText(msg.content); } catch {
      const ta = document.createElement("textarea");
      ta.value = msg.content; ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopiedMsgId(msg.id); setTimeout(() => setCopiedMsgId(null), 1500);
  }, []);

  // ─── AUTO-FILL HANDLERS ───
  const handleCharAutoFill = useCallback((data) => {
    if (!data) return;
    if (editingCharId) {
      Object.entries(data).forEach(([k, v]) => { if (v && k !== "id") updateCharById(editingCharId, k, v); });
      showToast("Character updated", "success");
    } else {
      const nc = { ...createDefaultCharacter(), ...data, id: uid() };
      updateProject({ characters: [...(project?.characters || []), nc] });
      setEditingCharId(nc.id);
      showToast("Character created", "success");
    }
  }, [editingCharId, updateCharById, updateProject, project, showToast]);

  const handleWorldAutoFill = useCallback((data) => {
    if (!data) return;
    updateProject({ worldBuilding: [...(project?.worldBuilding || []), { id: uid(), name: data.name || "", category: data.category || "", description: data.description || "" }] });
    showToast("World entry added", "success");
  }, [project, updateProject, showToast]);

  const handlePlotAutoFill = useCallback((data) => {
    if (!data) return;
    const outline = project?.plotOutline || [];
    updateProject({ plotOutline: [...outline, { id: uid(), chapter: data.chapter || outline.length + 1, title: data.title || "", summary: data.summary || "", beats: data.beats || "", sceneType: data.sceneType || "narrative", pov: data.pov || "" }] });
    showToast("Plot added", "success");
  }, [project, updateProject, showToast]);

  const handleRelAutoFill = useCallback((data) => {
    if (!data) return;
    updateProject({ relationships: [...(project?.relationships || []), { id: uid(), char1: data.char1 || "", char2: data.char2 || "", dynamic: data.dynamic || "", status: data.status || "developing", tension: data.tension || "medium", notes: data.notes || "" }] });
    showToast("Relationship added", "success");
  }, [project, updateProject, showToast]);

  const tabs = useMemo(() => [
    { id: "write", label: "Write", icon: <Icons.Pen /> },
    { id: "characters", label: "Characters", icon: <Icons.Users /> },
    { id: "world", label: "World", icon: <Icons.Map /> },
    { id: "plot", label: "Plot", icon: <Icons.Book /> },
    { id: "relationships", label: "Relations", icon: <Icons.Flame /> },
    { id: "memory", label: "Memory", icon: <Icons.Brain /> },
    { id: "settings", label: "Settings", icon: <Icons.Settings /> },
  ], []);

  const currentChapterWords = wordCount(activeChapter?.content);

  // ─── LOADING ───
  if (!isLoaded) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#08070c", flexDirection: "column", gap: 16 }}>
        <style>{`@keyframes nf-spin { to { transform: rotate(360deg); } }`}</style>
        <Spinner /><span style={{ color: "#5a4d66", fontSize: 13, fontFamily: "'Crimson Pro', Georgia, serif" }}>Loading your projects...</span>
      </div>
    );
  }

  // ─── PROJECT LIST SIDEBAR ───
  const renderProjectList = () => (
    <div className={`nf-sidebar ${showProjectList ? "nf-sidebar-open" : "nf-sidebar-closed"}`}>
      <div className="nf-sidebar-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div className="nf-logo-mark">✦</div>
          <span className="nf-logo-text">NovelForge</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
            <button className="nf-btn-icon" onClick={toggleTheme} title={`${theme === "dark" ? "Light" : "Dark"} mode`}>
              {theme === "dark" ? <Icons.Sun /> : <Icons.Moon />}
            </button>
            {isMobile && <button className="nf-btn-icon" onClick={() => setShowProjectList(false)}><Icons.X /></button>}
          </div>
        </div>
        <button onClick={() => {
          const np = createDefaultProject();
          setProjects(prev => [np, ...prev]);
          setActiveProjectId(np.id); setActiveChapterIdx(0); setChatMessages([]);
          setSessionWordsStart(0);
          if (isMobile) setShowProjectList(false);
          showToast("New project created", "success");
        }} className="nf-btn nf-btn-primary" style={{ width: "100%" }}><Icons.Plus /> New Project</button>
        {projects.length > 3 && (
          <input value={projectSearch} onChange={e => setProjectSearch(e.target.value)} placeholder="Search projects..."
            className="nf-input" style={{ marginTop: 10, fontSize: 12, height: 32 }} />
        )}
      </div>
      <div className="nf-sidebar-list">
        {filteredProjects.map(p => (
          <div key={p.id} onClick={() => {
            setActiveProjectId(p.id); setActiveChapterIdx(0); setChatMessages([]);
            setSessionWordsStart(null); lastSyncedChapterRef.current = null;
            if (isMobile) setShowProjectList(false);
          }}
            className={`nf-project-item ${p.id === activeProjectId ? "active" : ""}`}>
            <div className="nf-project-title">{p.title}</div>
            <div className="nf-project-meta">{p.genre} · {p.chapters?.length || 0} ch · {p.characters?.length || 0} chars</div>
          </div>
        ))}
        {filteredProjects.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "var(--nf-text-muted)", fontSize: 12 }}>No projects found</div>}
      </div>
    </div>
  );

  // ─── AI PANEL ───
  const renderAiPanel = (asMobileOverlay = false) => (
    <div className={asMobileOverlay ? "nf-ai-mobile-overlay" : "nf-ai-panel"}>
      {asMobileOverlay && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1px solid var(--nf-border)" }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: "var(--nf-text)" }}>AI Assistant</span>
          <button onClick={() => setShowAiMobile(false)} className="nf-btn-icon"><Icons.X /></button>
        </div>
      )}
      <div className="nf-mode-bar">
        {Object.keys(modePrompts).map(m => (
          <Tooltip key={m} text={MODE_TOOLTIPS[m]}>
            <button onClick={() => setGenMode(m)} className={`nf-mode-btn ${m === genMode ? "active" : ""}`}>{m}</button>
          </Tooltip>
        ))}
      </div>

      {selectedText && (
        <div className="nf-selection-indicator">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <Icons.Crosshair />
            <span style={{ fontWeight: 600, fontSize: 10 }}>Selected</span>
            <span style={{ opacity: 0.6, fontSize: 10 }}>({wordCount(selectedText)} words)</span>
          </div>
          <div style={{ fontSize: 10.5, color: "var(--nf-text-muted)", lineHeight: 1.4, maxHeight: 36, overflow: "hidden" }}>
            "{selectedText.slice(0, 100)}{selectedText.length > 100 ? "…" : ""}"
          </div>
          {genMode !== "rewrite" && (
            <button onClick={() => setGenMode("rewrite")} className="nf-btn-micro" style={{ marginTop: 5 }}>
              <Icons.Replace /> Switch to Rewrite
            </button>
          )}
        </div>
      )}

      <div className="nf-chat-messages">
        {chatMessages.length === 0 && !streamingContent && (
          <div className="nf-chat-empty">
            <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.25 }}>✦</div>
            <div>Select a mode and describe what you need.</div>
            <div style={{ marginTop: 6, fontSize: 10.5, opacity: 0.5 }}>Hover mode buttons for details.</div>
            <div style={{ marginTop: 10, fontSize: 10, opacity: 0.35 }}>
              Enter to send · {navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"}+Enter from anywhere
            </div>
          </div>
        )}
        {chatMessages.map(msg => (
          <div key={msg.id} className={`nf-chat-msg ${msg.role === "user" ? "nf-chat-msg-user" : ""}`}>
            {msg.role === "assistant" && msg.mode && (
              <div style={{ fontSize: 9, color: "var(--nf-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2, fontWeight: 700 }}>{msg.mode}</div>
            )}
            <div className={`nf-chat-bubble ${msg.role === "user" ? "nf-chat-bubble-user" : ""} ${msg.isError ? "nf-chat-bubble-error" : ""}`}
              dangerouslySetInnerHTML={{ __html: msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br/>") }} />
            {msg.role === "assistant" && !msg.isError && (
              <div className="nf-chat-actions">
                <Tooltip text="Review side-by-side before inserting">
                  <button onClick={() => reviewBeforeInsert(msg.content, msg.mode)} className="nf-btn-micro"><Icons.Eye /> Review</button>
                </Tooltip>
                <Tooltip text="Append to chapter end">
                  <button onClick={() => appendToChapter(msg.content)} className="nf-btn-micro"><Icons.ArrowDown /> Append</button>
                </Tooltip>
                <button onClick={() => handleCopyMsg(msg)} className="nf-btn-micro">
                  {copiedMsgId === msg.id ? <><Icons.Check /> Copied</> : <><Icons.Copy /> Copy</>}
                </button>
              </div>
            )}
          </div>
        ))}
        {streamingContent && (
          <div className="nf-chat-msg">
            <div className="nf-chat-bubble" style={{ borderColor: "var(--nf-accent-2)" }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingContent) + '<span class="nf-cursor-blink">▊</span>' }} />
          </div>
        )}
        {isGenerating && !streamingContent && <div className="nf-generating"><Spinner /> Generating...</div>}
        <div ref={chatEndRef} />
      </div>
      <div className="nf-chat-input-area">
        <div className="nf-scene-direction-box">
          <label style={{ fontSize: 9, fontWeight: 700, color: "var(--nf-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3, display: "block" }}>
            Scene Direction
          </label>
          <textarea value={sceneNotes} onChange={e => setSceneNotes(e.target.value)}
            placeholder="Where is this scene going? Emotional goal? Who initiates?"
            className="nf-scene-textarea" />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <textarea value={chatInput} onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
            placeholder={genMode === "rewrite" && selectedText ? "Describe how to rewrite..." : `${genMode} — what should the AI write?`}
            className="nf-chat-textarea" />
          {isGenerating ? (
            <button onClick={() => abortRef.current?.abort()} className="nf-send-btn" style={{ background: "var(--nf-accent)" }}><Icons.Stop /></button>
          ) : (
            <button onClick={handleGenerate} disabled={!settings.apiKey} className="nf-send-btn"><Icons.Send /></button>
          )}
        </div>
      </div>
    </div>
  );

  // ─── TAB: WRITE ───
  const renderWrite = () => (
    <div className={`nf-write-layout ${focusMode ? "nf-focus-mode" : ""}`}>
      {!focusMode && (
        <div className="nf-chapter-sidebar">
          <div className="nf-chapter-sidebar-header">
            <span className="nf-section-label">Chapters</span>
            <button onClick={() => {
              const chs = [...(project?.chapters || []), { id: uid(), title: `Chapter ${(project?.chapters?.length || 0) + 1}`, content: "", summary: "", notes: "", sceneNotes: "", pov: "" }];
              updateProject({ chapters: chs }); setActiveChapterIdx(chs.length - 1);
              lastSyncedChapterRef.current = null;
            }} className="nf-btn-icon-sm"><Icons.Plus /> Add</button>
          </div>
          <div className="nf-chapter-list">
            {project?.chapters?.map((ch, i) => (
              <div key={ch.id || i} onClick={() => {
                if (i !== activeChapterIdx) { pushUndo(); syncEditorContent(); setActiveChapterIdx(i); lastSyncedChapterRef.current = null; }
              }}
                draggable
                onDragStart={e => { e.dataTransfer.setData("text/plain", i.toString()); e.dataTransfer.effectAllowed = "move"; }}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                onDrop={e => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData("text/plain")); if (!isNaN(from) && from !== i) moveChapter(from, i); }}
                className={`nf-chapter-item ${i === activeChapterIdx ? "active" : ""}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ opacity: 0.25, cursor: "grab" }}><Icons.Grip /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="nf-chapter-item-title">{ch.title}</div>
                    <div className="nf-chapter-item-meta">
                      {ch.content ? `${wordCount(ch.content).toLocaleString()} w` : "Empty"}
                      {ch.summary ? " · ✦" : ""}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "8px 12px", borderTop: "1px solid var(--nf-border)", fontSize: 10, color: "var(--nf-text-muted)", fontFamily: "var(--nf-font-mono)" }}>
            {totalProjectWords.toLocaleString()} words total
          </div>
        </div>
      )}
      <div className="nf-editor-area">
        <div className="nf-chapter-header">
          <input value={activeChapter?.title || ""} onChange={e => updateChapter(activeChapterIdx, { title: e.target.value })}
            className="nf-chapter-title-input" placeholder="Chapter title..." />
          <SaveIndicator status={saveStatus} />
          <span className="nf-word-count">{currentChapterWords > 0 ? `${currentChapterWords.toLocaleString()} words` : ""}</span>
          <div className="nf-header-actions">
            <select value={activeChapter?.pov || ""} onChange={e => updateChapter(activeChapterIdx, { pov: e.target.value })}
              className="nf-select" style={{ width: "auto", minWidth: 100, padding: "4px 6px", fontSize: 10 }}>
              <option value="">POV: Default</option>
              {POV_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={handleUndo} disabled={!undoState.past.length} className="nf-btn-icon-sm" title="Undo"><Icons.Undo /></button>
            <button onClick={handleRedo} disabled={!undoState.future.length} className="nf-btn-icon-sm" title="Redo"><Icons.Redo /></button>
            <Tooltip text="Auto-summarize chapter">
              <button onClick={() => autoSummarizeChapter(activeChapterIdx)} disabled={isGenerating} className="nf-btn-icon-sm"><Icons.Brain /></button>
            </Tooltip>
            <button onClick={() => setFocusMode(!focusMode)} className="nf-btn-icon-sm" title={focusMode ? "Exit focus" : "Focus mode"}>
              {focusMode ? <Icons.Minimize /> : <Icons.Maximize />}
            </button>
            {isMobile && (
              <button onClick={() => setShowAiMobile(true)} className="nf-btn-icon-sm" style={{ borderColor: "var(--nf-accent)", color: "var(--nf-accent)" }}><Icons.Zap /> AI</button>
            )}
            {project?.chapters?.length > 1 && (
              <button onClick={() => setConfirmDialog({
                message: `Delete "${activeChapter?.title}"?`,
                onConfirm: () => {
                  const chs = project.chapters.filter((_, i) => i !== activeChapterIdx);
                  updateProject({ chapters: chs.length ? chs : [{ id: uid(), title: "Chapter 1", content: "", summary: "", notes: "", sceneNotes: "", pov: "" }] });
                  setActiveChapterIdx(Math.min(activeChapterIdx, Math.max(0, chs.length - 1)));
                  lastSyncedChapterRef.current = null; setConfirmDialog(null); showToast("Deleted", "success");
                },
              })} className="nf-btn-icon-sm nf-btn-icon-danger"><Icons.Trash /></button>
            )}
          </div>
        </div>
        <WordGoalBar current={totalProjectWords} goal={project?.wordGoal || 0} sessionWords={sessionWords} />
        <RichTextToolbar editorRef={editorRef} onContentChange={syncEditorContent} />
        <div className="nf-editor-split">
          <div className="nf-text-editor">
            <div ref={editorRef} contentEditable suppressContentEditableWarning
              className="nf-editor-contenteditable"
              onInput={syncEditorContent}
              onBlur={() => { pushUndo(); syncEditorContent(); }}
              onMouseUp={handleEditorSelect}
              onKeyUp={handleEditorSelect}
              data-placeholder="Begin writing your chapter..." />
          </div>
          {!isMobile && !focusMode && renderAiPanel()}
        </div>
      </div>
      {isMobile && showAiMobile && renderAiPanel(true)}
    </div>
  );

  // ─── TAB: CHARACTERS ───
  const renderCharacters = () => {
    const chars = project?.characters || [];
    return (
      <div className="nf-write-layout">
        <div className="nf-chapter-sidebar">
          <div className="nf-chapter-sidebar-header">
            <span className="nf-section-label">Characters ({chars.length})</span>
            <button onClick={() => { const nc = createDefaultCharacter(); updateProject({ characters: [...chars, nc] }); setEditingCharId(nc.id); }}
              className="nf-btn-icon-sm"><Icons.Plus /></button>
          </div>
          <div className="nf-chapter-list">
            {chars.map(c => (
              <div key={c.id} onClick={() => setEditingCharId(c.id)} className={`nf-chapter-item ${c.id === editingCharId ? "active" : ""}`}>
                <div className="nf-chapter-item-title">{c.name || "Unnamed"}</div>
                <div className="nf-chapter-item-meta" style={{ textTransform: "capitalize" }}>{c.role}{c.pronouns ? ` · ${c.pronouns}` : ""}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="nf-content-scroll">
          {editingChar ? (<>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 className="nf-page-title" style={{ marginBottom: 0 }}>{editingChar.name || "New Character"}</h2>
              <button onClick={() => setConfirmDialog({
                message: `Delete "${editingChar.name || "this character"}"?`,
                onConfirm: () => { updateProject({ characters: chars.filter(c => c.id !== editingCharId) }); setEditingCharId(null); setConfirmDialog(null); showToast("Deleted", "success"); },
              })} className="nf-btn nf-btn-danger"><Icons.Trash /> Delete</button>
            </div>
            <Field label="Name" value={editingChar.name} onChange={v => updateCharById(editingCharId, "name", v)} placeholder="Full name" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
              <SelectField label="Role" value={editingChar.role} onChange={v => updateCharById(editingCharId, "role", v)} options={ROLE_OPTIONS} />
              <SelectField label="Gender" value={editingChar.gender} onChange={v => updateCharById(editingCharId, "gender", v)} options={GENDER_OPTIONS} placeholder="Select..." />
              <SelectField label="Pronouns" value={editingChar.pronouns} onChange={v => updateCharById(editingCharId, "pronouns", v)} options={PRONOUN_OPTIONS} placeholder="Select..." />
            </div>
            <Field label="Age" value={editingChar.age} onChange={v => updateCharById(editingCharId, "age", v)} placeholder="Age or age range" />
            <Field label="Appearance" value={editingChar.appearance} onChange={v => updateCharById(editingCharId, "appearance", v)} multiline placeholder="Physical description — height, build, coloring, distinguishing features..." />
            <Field label="Personality" value={editingChar.personality} onChange={v => updateCharById(editingCharId, "personality", v)} multiline placeholder="Core traits, temperament, quirks, contradictions..." />
            <Field label="Backstory" value={editingChar.backstory} onChange={v => updateCharById(editingCharId, "backstory", v)} multiline placeholder="Formative experiences, wounds, what shaped them..." />
            <Field label="Desires & Motivations" value={editingChar.desires} onChange={v => updateCharById(editingCharId, "desires", v)} multiline placeholder="What drives them? Want vs. need?" />
            <Field label="Speech & Voice" value={editingChar.speechPattern} onChange={v => updateCharById(editingCharId, "speechPattern", v)} multiline placeholder="Vocabulary, accent, verbal tics, how they sound under stress..." small />
            <Field label="Relationships" value={editingChar.relationships} onChange={v => updateCharById(editingCharId, "relationships", v)} multiline placeholder="Key relationships and dynamics..." small />
            <Field label="Intimate Preferences" value={editingChar.kinks} onChange={v => updateCharById(editingCharId, "kinks", v)} multiline placeholder="Preferences, boundaries, what they respond to..." small />
            <Field label="Character Arc" value={editingChar.arc} onChange={v => updateCharById(editingCharId, "arc", v)} multiline placeholder="How they change through the story..." small />
            <Field label="Notes" value={editingChar.notes} onChange={v => updateCharById(editingCharId, "notes", v)} multiline placeholder="Anything else..." small />
          </>) : (<div className="nf-empty-state">Select or create a character</div>)}
        </div>
        {!isMobile && settings.apiKey && (
          <TabAIChat project={project} settings={settings} tabName="characters"
            tabContext="characters — create, flesh out, or brainstorm character details"
            placeholder='Try: "Generate a character" or "Fill empty fields"'
            onAutoFill={handleCharAutoFill}
            messages={getTabMessages("characters")}
            setMessages={setTabMessages("characters")} />
        )}
      </div>
    );
  };

  // ─── TAB: WORLD ───
  const renderWorld = () => {
    const items = project?.worldBuilding || [];
    return (
      <div className="nf-write-layout">
        <div className="nf-content-scroll" style={{ maxWidth: 800, flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 className="nf-page-title">World-Building</h2>
            <button onClick={() => updateProject({ worldBuilding: [...items, { id: uid(), name: "", category: "", description: "" }] })} className="nf-btn-icon-sm"><Icons.Plus /> Add</button>
          </div>
          <p className="nf-hint">Locations, rules, norms, tech, magic — everything that defines your world.</p>
          {items.map(item => (
            <div key={item.id} className="nf-card">
              <div style={{ display: "flex", gap: 12, alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12 }}>
                    <Field label="Name" value={item.name} onChange={v => updateProject({ worldBuilding: items.map(it => it.id === item.id ? { ...it, name: v } : it) })} placeholder="e.g. The Midnight Court" />
                    <SelectField label="Type" value={item.category || ""} onChange={v => updateProject({ worldBuilding: items.map(it => it.id === item.id ? { ...it, category: v } : it) })}
                      options={["Location","Rule/Law","Culture","Organization","Magic/Tech","History","Flora/Fauna","Other"]} placeholder="Select..." />
                  </div>
                  <Field label="Description" value={item.description} onChange={v => updateProject({ worldBuilding: items.map(it => it.id === item.id ? { ...it, description: v } : it) })} multiline placeholder="Detailed description..." />
                </div>
                <button onClick={() => updateProject({ worldBuilding: items.filter(it => it.id !== item.id) })} className="nf-btn-icon" style={{ marginTop: 20 }}><Icons.Trash /></button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="nf-empty-state">Add world-building entries to enrich AI context</div>}
        </div>
        {!isMobile && settings.apiKey && (
          <TabAIChat project={project} settings={settings} tabName="world"
            tabContext="world-building — create locations, rules, cultures, magic systems"
            onAutoFill={handleWorldAutoFill}
            messages={getTabMessages("world")} setMessages={setTabMessages("world")} />
        )}
      </div>
    );
  };

  // ─── TAB: PLOT ───
  const renderPlot = () => {
    const outline = project?.plotOutline || [];
    return (
      <div className="nf-write-layout">
        <div className="nf-content-scroll" style={{ maxWidth: 900, flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 className="nf-page-title">Plot Outline</h2>
            <button onClick={() => updateProject({ plotOutline: [...outline, { id: uid(), chapter: outline.length + 1, title: "", summary: "", beats: "", sceneType: "narrative", pov: "" }] })} className="nf-btn-icon-sm"><Icons.Plus /> Add</button>
          </div>
          {outline.map((p, i) => (
            <div key={p.id} className="nf-card">
              <div style={{ display: "flex", gap: 12, alignItems: "start" }}>
                <div className="nf-plot-number">{p.chapter || i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px", gap: 12, marginBottom: 8 }}>
                    <Field label="Title" value={p.title} onChange={v => updateProject({ plotOutline: outline.map(pl => pl.id === p.id ? { ...pl, title: v } : pl) })} placeholder="Chapter title" small />
                    <SelectField label="Scene Type" value={p.sceneType || "narrative"} onChange={v => updateProject({ plotOutline: outline.map(pl => pl.id === p.id ? { ...pl, sceneType: v } : pl) })} options={SCENE_TYPE_OPTIONS} />
                    <SelectField label="POV" value={p.pov || ""} onChange={v => updateProject({ plotOutline: outline.map(pl => pl.id === p.id ? { ...pl, pov: v } : pl) })} options={POV_OPTIONS} placeholder="Default" />
                  </div>
                  <Field label="Summary" value={p.summary} onChange={v => updateProject({ plotOutline: outline.map(pl => pl.id === p.id ? { ...pl, summary: v } : pl) })} multiline placeholder="What happens..." small />
                  <Field label="Beats" value={p.beats} onChange={v => updateProject({ plotOutline: outline.map(pl => pl.id === p.id ? { ...pl, beats: v } : pl) })} multiline placeholder="Key beats..." small />
                </div>
                <button onClick={() => updateProject({ plotOutline: outline.filter(pl => pl.id !== p.id) })} className="nf-btn-icon" style={{ marginTop: 4 }}><Icons.Trash /></button>
              </div>
            </div>
          ))}
          {outline.length === 0 && <div className="nf-empty-state">Plan your story structure</div>}
        </div>
        {!isMobile && settings.apiKey && (
          <TabAIChat project={project} settings={settings} tabName="plot"
            tabContext="plot outline — plan chapters, structure arcs, develop beats"
            onAutoFill={handlePlotAutoFill}
            messages={getTabMessages("plot")} setMessages={setTabMessages("plot")} />
        )}
      </div>
    );
  };

  // ─── TAB: RELATIONSHIPS ───
  const renderRelationships = () => {
    const rels = project?.relationships || [];
    const charNames = (project?.characters || []).filter(c => c.name).map(c => c.name);
    return (
      <div className="nf-write-layout">
        <div className="nf-content-scroll" style={{ maxWidth: 800, flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 className="nf-page-title">Relationships</h2>
            <button onClick={() => updateProject({ relationships: [...rels, { id: uid(), char1: "", char2: "", dynamic: "", status: "developing", tension: "medium", notes: "" }] })} className="nf-btn-icon-sm"><Icons.Plus /> Add</button>
          </div>
          {rels.map(r => (
            <div key={r.id} className="nf-card">
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "end", marginBottom: 8 }}>
                {charNames.length >= 2 ? (
                  <SelectField label="Character 1" value={r.char1} onChange={v => updateProject({ relationships: rels.map(re => re.id === r.id ? { ...re, char1: v } : re) })} options={charNames} placeholder="Select..." />
                ) : (
                  <Field label="Character 1" value={r.char1} onChange={v => updateProject({ relationships: rels.map(re => re.id === r.id ? { ...re, char1: v } : re) })} placeholder="Name" />
                )}
                <div style={{ color: "var(--nf-accent)", fontSize: 18, paddingBottom: 12, fontWeight: 300 }}>↔</div>
                {charNames.length >= 2 ? (
                  <SelectField label="Character 2" value={r.char2} onChange={v => updateProject({ relationships: rels.map(re => re.id === r.id ? { ...re, char2: v } : re) })} options={charNames} placeholder="Select..." />
                ) : (
                  <Field label="Character 2" value={r.char2} onChange={v => updateProject({ relationships: rels.map(re => re.id === r.id ? { ...re, char2: v } : re) })} placeholder="Name" />
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <SelectField label="Status" value={r.status || "developing"} onChange={v => updateProject({ relationships: rels.map(re => re.id === r.id ? { ...re, status: v } : re) })} options={RELATIONSHIP_STATUS_OPTIONS} />
                <SelectField label="Tension" value={r.tension || "medium"} onChange={v => updateProject({ relationships: rels.map(re => re.id === r.id ? { ...re, tension: v } : re) })} options={TENSION_OPTIONS} />
              </div>
              <Field label="Dynamic" value={r.dynamic} onChange={v => updateProject({ relationships: rels.map(re => re.id === r.id ? { ...re, dynamic: v } : re) })} multiline placeholder="Power dynamics, emotional patterns..." small />
              <Field label="Notes" value={r.notes} onChange={v => updateProject({ relationships: rels.map(re => re.id === r.id ? { ...re, notes: v } : re) })} multiline placeholder="History, turning points..." small />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => updateProject({ relationships: rels.filter(re => re.id !== r.id) })} className="nf-btn-micro nf-btn-micro-danger"><Icons.Trash /> Remove</button>
              </div>
            </div>
          ))}
          {rels.length === 0 && <div className="nf-empty-state">Track character dynamics</div>}
        </div>
        {!isMobile && settings.apiKey && (
          <TabAIChat project={project} settings={settings} tabName="relationships"
            tabContext="relationship dynamics — develop chemistry, tension arcs"
            onAutoFill={handleRelAutoFill}
            messages={getTabMessages("relationships")} setMessages={setTabMessages("relationships")} />
        )}
      </div>
    );
  };

  // ─── TAB: MEMORY ───
  const renderMemory = () => {
    const contextPayload = ContextEngine.buildFullContext(project, activeChapterIdx);
    const chapterCtx = ContextEngine.buildChapterContext(project, activeChapterIdx);
    const fullPayload = contextPayload + "\n\n" + chapterCtx;
    const tokenEstimate = estimateTokens(fullPayload);
    return (
      <div className="nf-content-scroll" style={{ maxWidth: 900 }}>
        <h2 className="nf-page-title">Memory & Context</h2>
        <p className="nf-hint" style={{ marginBottom: 24 }}>Context payload injected into every AI call. Summarize completed chapters for better continuity.</p>
        <div className="nf-stats-grid">
          {[
            { label: "Context Tokens (est.)", value: tokenEstimate.toLocaleString(), warn: tokenEstimate > 8000 },
            { label: "Characters", value: project?.characters?.length || 0 },
            { label: "Chapters Summarized", value: `${project?.chapters?.filter(c => c.summary).length || 0}/${project?.chapters?.length || 0}` },
          ].map((s, i) => (
            <div key={i} className={`nf-stat-card ${s.warn ? "nf-stat-warn" : ""}`}>
              <div className="nf-stat-value">{s.value}</div>
              <div className="nf-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
        <Field label="Continuity Notes (always injected)" value={project?.continuityNotes} onChange={v => updateProject({ continuityNotes: v })} multiline
          placeholder="Track details: 'Elena has a scar from Ch3', 'Marcus doesn't know about the letter'..." />
        <div style={{ marginTop: 20 }}>
          <span className="nf-section-label" style={{ display: "block", marginBottom: 8 }}>Chapter Summaries</span>
          <p className="nf-hint" style={{ marginBottom: 12 }}>Summaries improve continuity. The AI reads these instead of raw text for prior chapters.</p>
          {project?.chapters?.map((ch, i) => (
            <div key={ch.id || i} className="nf-card" style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--nf-text)" }}>
                  {ch.title}
                  <span style={{ fontSize: 10, color: "var(--nf-text-muted)", fontWeight: 400, marginLeft: 8 }}>
                    {ch.content ? `${wordCount(ch.content).toLocaleString()} words` : "empty"}
                  </span>
                </div>
                <button onClick={() => autoSummarizeChapter(i)} disabled={isGenerating || !ch.content || wordCount(ch.content) < 50}
                  className="nf-btn-micro"><Icons.Brain /> Auto</button>
              </div>
              <textarea value={ch.summary || ""} onChange={e => updateChapter(i, { summary: e.target.value })}
                placeholder="Summary for memory..." className="nf-textarea nf-textarea-sm" style={{ minHeight: 48 }} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24 }}>
          <button onClick={() => setShowMemoryPreview(!showMemoryPreview)} className="nf-btn nf-btn-ghost">
            {showMemoryPreview ? <Icons.EyeOff /> : <Icons.Eye />} {showMemoryPreview ? "Hide" : "Show"} Context Payload
          </button>
          {showMemoryPreview && <pre className="nf-context-preview">{fullPayload}</pre>}
        </div>
      </div>
    );
  };

  // ─── TAB: SETTINGS ───
  const renderSettings = () => (
    <div className="nf-content-scroll" style={{ maxWidth: 700 }}>
      <h2 className="nf-page-title">Settings</h2>

      <div className="nf-card">
        <h3 className="nf-card-title">Appearance</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setTheme("light")} className={`nf-btn ${theme === "light" ? "nf-btn-primary" : "nf-btn-ghost"}`}><Icons.Sun /> Light</button>
          <button onClick={() => setTheme("dark")} className={`nf-btn ${theme === "dark" ? "nf-btn-primary" : "nf-btn-ghost"}`}><Icons.Moon /> Dark</button>
        </div>
      </div>

      <div className="nf-card">
        <h3 className="nf-card-title">API Configuration</h3>
        <div className="nf-field">
          <label className="nf-label">OpenRouter API Key</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={settings.apiKey} onChange={e => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="sk-or-..." type={showApiKey ? "text" : "password"} className="nf-input" style={{ flex: 1 }} />
            <button onClick={() => setShowApiKey(!showApiKey)} className="nf-btn-icon" style={{ padding: "0 6px" }}>
              {showApiKey ? <Icons.EyeOff /> : <Icons.Eye />}
            </button>
          </div>
        </div>
        <ModelSelector apiKey={settings.apiKey} value={settings.model} onChange={v => setSettings(prev => ({ ...prev, model: v }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="nf-field">
            <label className="nf-label">Max Tokens</label>
            <input value={settings.maxTokens} onChange={e => setSettings(prev => ({ ...prev, maxTokens: e.target.value }))}
              onBlur={e => setSettings(prev => ({ ...prev, maxTokens: clamp(parseInt(e.target.value) || 4096, 256, 128000) }))}
              className="nf-input" type="number" />
          </div>
          <div className="nf-field">
            <label className="nf-label">Temperature</label>
            <input value={settings.temperature} onChange={e => setSettings(prev => ({ ...prev, temperature: e.target.value }))}
              onBlur={e => setSettings(prev => ({ ...prev, temperature: clamp(parseFloat(e.target.value) || 0.85, 0, 2) }))}
              className="nf-input" type="number" step="0.05" />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="nf-field">
            <label className="nf-label">Frequency Penalty</label>
            <input value={settings.frequencyPenalty} onChange={e => setSettings(prev => ({ ...prev, frequencyPenalty: e.target.value }))}
              onBlur={e => setSettings(prev => ({ ...prev, frequencyPenalty: clamp(parseFloat(e.target.value) || 0.1, 0, 2) }))}
              className="nf-input" type="number" step="0.05" />
          </div>
          <div className="nf-field">
            <label className="nf-label">Presence Penalty</label>
            <input value={settings.presencePenalty} onChange={e => setSettings(prev => ({ ...prev, presencePenalty: e.target.value }))}
              onBlur={e => setSettings(prev => ({ ...prev, presencePenalty: clamp(parseFloat(e.target.value) || 0.15, 0, 2) }))}
              className="nf-input" type="number" step="0.05" />
          </div>
        </div>
        <Field label="Custom System Prompt" value={settings.systemPrompt} onChange={v => setSettings(prev => ({ ...prev, systemPrompt: v }))} multiline placeholder="e.g. 'Always use British English', 'Write in present tense'..." />
      </div>

      <div className="nf-card">
        <h3 className="nf-card-title">Novel Settings</h3>
        <Field label="Title" value={project?.title} onChange={v => updateProject({ title: v })} placeholder="Novel title" />
        <Field label="Synopsis" value={project?.synopsis} onChange={v => updateProject({ synopsis: v })} multiline placeholder="Story synopsis..." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <SelectField label="Genre" value={project?.genre} onChange={v => updateProject({ genre: v })} options={GENRE_OPTIONS} />
          <SelectField label="POV" value={project?.pov} onChange={v => updateProject({ pov: v })} options={POV_OPTIONS} />
        </div>
        <Field label="Tone & Voice" value={project?.tone} onChange={v => updateProject({ tone: v })} multiline placeholder="Lyrical, gritty, witty..." small />
        <Field label="Themes" value={project?.themes} onChange={v => updateProject({ themes: v })} multiline placeholder="Power dynamics, forbidden desire..." small />
        <div className="nf-field">
          <label className="nf-label">Heat Level: {project?.heatLevel || 3}/5</label>
          <input type="range" min="1" max="5" value={project?.heatLevel || 3} onChange={e => updateProject({ heatLevel: parseInt(e.target.value) })} className="nf-range" />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--nf-text-muted)", marginTop: 4 }}>
            <span>Fade to black</span><span>Suggestive</span><span>Moderate</span><span>Explicit</span><span>Graphic</span>
          </div>
        </div>
        <Field label="Writing Style" value={project?.writingStyle} onChange={v => updateProject({ writingStyle: v })} multiline placeholder="Your voice, pacing, sentence style..." small />
        <Field label="Content Preferences" value={project?.contentPrefs} onChange={v => updateProject({ contentPrefs: v })} multiline placeholder="What to lean into..." small />
        <Field label="Hard Limits" value={project?.avoidList} onChange={v => updateProject({ avoidList: v })} multiline placeholder="Never include..." small />
        <div className="nf-field">
          <label className="nf-label">Word Goal</label>
          <input value={project?.wordGoal || ""} onChange={e => updateProject({ wordGoal: parseInt(e.target.value) || 0 })}
            placeholder="e.g. 80000" className="nf-input" type="number" />
        </div>
      </div>

      <div className="nf-card">
        <h3 className="nf-card-title">Export & Import</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={handleExportTxt} className="nf-btn nf-btn-ghost"><Icons.Export /> .txt</button>
          <button onClick={handleExportJson} className="nf-btn nf-btn-ghost"><Icons.Export /> JSON</button>
          <label className="nf-btn nf-btn-ghost" style={{ cursor: "pointer" }}><Icons.Save /> Import<input type="file" accept=".json" style={{ display: "none" }} onChange={handleImportJson} /></label>
        </div>
      </div>

      {project && (
        <div className="nf-card" style={{ borderColor: "var(--nf-error-border)" }}>
          <h3 className="nf-card-title" style={{ color: "var(--nf-accent)" }}>Danger Zone</h3>
          <button onClick={() => setConfirmDialog({
            message: `Permanently delete "${project.title}"?`,
            onConfirm: () => {
              const remaining = projects.filter(p => p.id !== activeProjectId);
              setProjects(remaining); setActiveProjectId(remaining[0]?.id || null);
              setActiveChapterIdx(0); setChatMessages([]); setConfirmDialog(null);
              showToast("Deleted", "success");
            },
          })} className="nf-btn nf-btn-danger"><Icons.Trash /> Delete Project</button>
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════
  // ─── MAIN LAYOUT ───
  // ════════════════════════════════════════
  return (
    <ThemeContext.Provider value={{ theme, toggle: toggleTheme }}>
      <div className="nf-root">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
          :root {
            ${themeVars}
            --nf-font-display: 'Crimson Pro', Georgia, serif;
            --nf-font-body: 'Outfit', -apple-system, sans-serif;
            --nf-font-prose: 'Crimson Pro', Georgia, serif;
            --nf-font-mono: 'JetBrains Mono', monospace;
            --nf-radius: 10px; --nf-radius-sm: 6px;
          }
          * { box-sizing: border-box; margin: 0; }
          @keyframes nf-spin { to { transform: rotate(360deg); } }
          @keyframes nf-slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes nf-fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes nf-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
          .nf-cursor-blink { animation: nf-blink 0.8s step-end infinite; color: var(--nf-accent-2); margin-left: 1px; }
          .nf-root { width: 100vw; height: 100vh; display: flex; font-family: var(--nf-font-body); background: var(--nf-bg-deep); color: var(--nf-text); overflow: hidden; font-size: 13px; transition: background 0.35s, color 0.35s; }
          ::-webkit-scrollbar { width: 5px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: var(--nf-scrollbar-thumb); border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: var(--nf-scrollbar-hover); }
          textarea:focus, input:focus, select:focus { border-color: var(--nf-border-focus) !important; outline: none; }
          select { cursor: pointer; } option { background: var(--nf-bg-surface); color: var(--nf-text); }
          
          .nf-sidebar { transition: width 0.25s ease, min-width 0.25s ease; overflow: hidden; border-right: 1px solid var(--nf-border); background: var(--nf-bg); display: flex; flex-direction: column; }
          .nf-sidebar-open { width: 250px; min-width: 250px; }
          .nf-sidebar-closed { width: 0; min-width: 0; border-right: none; }
          .nf-sidebar-header { padding: 18px 16px 14px; border-bottom: 1px solid var(--nf-border); }
          .nf-sidebar-list { flex: 1; overflow-y: auto; padding: 6px; }
          .nf-logo-mark { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, var(--nf-accent), var(--nf-accent-2)); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 12px var(--nf-accent-glow); color: #fff; font-size: 14px; font-weight: 500; }
          .nf-logo-text { font-family: var(--nf-font-display); font-size: 22px; font-weight: 600; color: var(--nf-text); letter-spacing: -0.02em; }
          .nf-project-item { padding: 10px 12px; border-radius: var(--nf-radius-sm); cursor: pointer; margin-bottom: 2px; border: 1px solid transparent; transition: all 0.15s; }
          .nf-project-item:hover { background: var(--nf-bg-hover); }
          .nf-project-item.active { background: var(--nf-bg-surface); border-color: var(--nf-accent-2); box-shadow: inset 3px 0 0 var(--nf-accent); }
          .nf-project-title { font-size: 13px; font-weight: 600; color: var(--nf-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
          .nf-project-meta { font-size: 10.5px; color: var(--nf-text-muted); }
          
          .nf-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 15px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid var(--nf-border); background: transparent; color: var(--nf-text-dim); transition: all 0.15s; font-family: var(--nf-font-body); }
          .nf-btn:hover { background: var(--nf-bg-hover); border-color: var(--nf-accent-2); }
          .nf-btn-primary { background: linear-gradient(135deg, var(--nf-accent), var(--nf-accent-2)); border-color: transparent; color: #fff; box-shadow: 0 2px 16px var(--nf-accent-glow); }
          .nf-btn-primary:hover { opacity: 0.9; }
          .nf-btn-ghost { background: var(--nf-bg-surface); border-color: var(--nf-border); color: var(--nf-text-dim); }
          .nf-btn-danger { background: var(--nf-danger-bg); border-color: var(--nf-error-border); color: var(--nf-accent); }
          .nf-btn-danger:hover { background: var(--nf-danger-hover); }
          .nf-btn-icon { background: none; border: none; color: var(--nf-text-muted); cursor: pointer; padding: 4px; display: flex; align-items: center; transition: color 0.15s; }
          .nf-btn-icon:hover { color: var(--nf-text); }
          .nf-btn-icon-sm { background: none; border: 1px solid var(--nf-border); border-radius: var(--nf-radius-sm); color: var(--nf-text-dim); cursor: pointer; padding: 4px 10px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; transition: all 0.15s; font-family: var(--nf-font-body); }
          .nf-btn-icon-sm:hover { border-color: var(--nf-accent-2); background: var(--nf-bg-hover); }
          .nf-btn-icon-sm:disabled { opacity: 0.3; cursor: default; pointer-events: none; }
          .nf-btn-icon-danger:hover { border-color: var(--nf-accent); color: var(--nf-accent); }
          .nf-btn-micro { background: var(--nf-bg-surface); border: 1px solid var(--nf-border); border-radius: 4px; color: var(--nf-text-dim); cursor: pointer; padding: 3px 8px; font-size: 10px; font-weight: 600; display: inline-flex; align-items: center; gap: 3px; transition: all 0.15s; font-family: var(--nf-font-body); }
          .nf-btn-micro:hover { border-color: var(--nf-accent-2); }
          .nf-btn-micro:disabled { opacity: 0.3; cursor: default; }
          .nf-btn-micro-danger:hover { color: var(--nf-accent); border-color: var(--nf-accent); }
          
          .nf-field { margin-bottom: 10px; }
          .nf-label { display: block; font-size: 10px; font-weight: 700; color: var(--nf-text-dim); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.1em; }
          .nf-input { width: 100%; padding: 9px 12px; background: var(--nf-bg-surface); border: 1px solid var(--nf-border); border-radius: var(--nf-radius-sm); color: var(--nf-text); font-size: 13px; outline: none; font-family: var(--nf-font-body); transition: border-color 0.15s; }
          .nf-textarea { width: 100%; min-height: 76px; padding: 10px 12px; background: var(--nf-bg-surface); border: 1px solid var(--nf-border); border-radius: var(--nf-radius-sm); color: var(--nf-text); font-size: 13px; line-height: 1.6; resize: vertical; outline: none; font-family: var(--nf-font-prose); transition: border-color 0.15s; }
          .nf-textarea-sm { min-height: 56px; }
          .nf-select { width: 100%; padding: 9px 10px; background: var(--nf-bg-surface); border: 1px solid var(--nf-border); border-radius: var(--nf-radius-sm); color: var(--nf-text); font-size: 12px; outline: none; font-family: var(--nf-font-body); transition: border-color 0.15s; }
          .nf-range { width: 100%; accent-color: var(--nf-accent); }
          .nf-hint { color: var(--nf-text-muted); font-size: 12px; margin-bottom: 20px; line-height: 1.6; }
          
          .nf-tab-bar { display: flex; align-items: center; border-bottom: 1px solid var(--nf-border); background: var(--nf-bg); padding: 0 12px; min-height: 46px; overflow-x: auto; }
          .nf-tab-btn { display: flex; align-items: center; gap: 6px; padding: 12px 14px; background: none; border: none; border-bottom: 2px solid transparent; color: var(--nf-text-muted); cursor: pointer; font-size: 12px; font-weight: 600; font-family: var(--nf-font-body); transition: all 0.15s; white-space: nowrap; }
          .nf-tab-btn:hover { color: var(--nf-text-dim); }
          .nf-tab-btn.active { border-bottom-color: var(--nf-accent); color: var(--nf-text); }
          .nf-tab-title { font-size: 11px; color: var(--nf-text-muted); font-style: italic; font-family: var(--nf-font-display); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
          
          .nf-write-layout { display: flex; flex: 1; overflow: hidden; position: relative; }
          .nf-chapter-sidebar { width: 190px; min-width: 190px; border-right: 1px solid var(--nf-border); display: flex; flex-direction: column; background: var(--nf-bg-raised); }
          .nf-chapter-sidebar-header { padding: 10px 12px; border-bottom: 1px solid var(--nf-border); display: flex; justify-content: space-between; align-items: center; }
          .nf-section-label { font-size: 11px; font-weight: 700; color: var(--nf-text-dim); text-transform: uppercase; letter-spacing: 0.1em; }
          .nf-chapter-list { flex: 1; overflow-y: auto; padding: 4px; }
          .nf-chapter-item { padding: 9px 10px; border-radius: var(--nf-radius-sm); cursor: pointer; margin-bottom: 2px; border-left: 3px solid transparent; transition: all 0.12s; }
          .nf-chapter-item:hover { background: var(--nf-bg-hover); }
          .nf-chapter-item.active { background: var(--nf-bg-surface); border-left-color: var(--nf-accent); }
          .nf-chapter-item-title { font-size: 12px; color: var(--nf-text-muted); font-weight: 400; transition: color 0.15s; }
          .nf-chapter-item.active .nf-chapter-item-title { color: var(--nf-text); font-weight: 600; }
          .nf-chapter-item-meta { font-size: 10px; color: var(--nf-text-muted); margin-top: 2px; opacity: 0.6; }
          
          .nf-editor-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
          .nf-chapter-header { padding: 8px 18px; border-bottom: 1px solid var(--nf-border); display: flex; align-items: center; gap: 10px; background: var(--nf-bg-raised); flex-wrap: wrap; }
          .nf-header-actions { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
          .nf-chapter-title-input { flex: 1; min-width: 120px; background: none; border: none; color: var(--nf-text); font-size: 17px; font-weight: 600; font-family: var(--nf-font-display); outline: none; letter-spacing: -0.01em; }
          .nf-word-count { font-size: 10px; color: var(--nf-text-muted); white-space: nowrap; font-family: var(--nf-font-mono); }
          .nf-editor-split { flex: 1; display: flex; overflow: hidden; }
          .nf-text-editor { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
          
          .nf-rich-toolbar {
            display: flex; align-items: center; gap: 1px; padding: 4px 12px;
            background: var(--nf-toolbar-bg); border-bottom: 1px solid var(--nf-toolbar-border);
            flex-wrap: wrap; min-height: 32px;
          }
          .nf-toolbar-btn {
            background: transparent; border: none; color: var(--nf-text-dim); cursor: pointer;
            padding: 4px 6px; border-radius: 4px; display: flex; align-items: center; justify-content: center;
            transition: all 0.1s; min-width: 26; height: 26;
          }
          .nf-toolbar-btn:hover { background: var(--nf-toolbar-btn-hover); color: var(--nf-text); }
          .nf-toolbar-sep { width: 1px; height: 16px; background: var(--nf-border); margin: 0 4px; flex-shrink: 0; }
          
          .nf-editor-contenteditable {
            flex: 1; padding: 32px 44px; background: var(--nf-bg-deep); border: none;
            color: var(--nf-editor-text); line-height: 2; outline: none;
            font-family: var(--nf-font-prose); font-size: 16.5px; letter-spacing: 0.01em;
            overflow-y: auto; min-height: 0;
            transition: background 0.35s, color 0.35s;
          }
          .nf-editor-contenteditable:empty::before {
            content: attr(data-placeholder);
            color: var(--nf-editor-placeholder);
            font-style: italic;
            pointer-events: none;
          }
          .nf-editor-contenteditable::selection { background: var(--nf-selection-bg); }
          .nf-editor-contenteditable p { margin-bottom: 0.8em; }
          .nf-editor-contenteditable h1, .nf-editor-contenteditable h2, .nf-editor-contenteditable h3 { 
            margin: 1em 0 0.5em; font-family: var(--nf-font-display); color: var(--nf-text);
          }
          .nf-editor-contenteditable h3 { font-size: 1.2em; }
          .nf-editor-contenteditable ul, .nf-editor-contenteditable ol { padding-left: 1.5em; margin-bottom: 0.8em; }
          .nf-editor-contenteditable hr { border: none; border-top: 1px solid var(--nf-border); margin: 16px 0; }
          
          .nf-focus-mode .nf-chapter-sidebar { display: none; }
          .nf-focus-mode .nf-ai-panel { display: none; }
          .nf-focus-mode .nf-rich-toolbar { display: none; }
          .nf-focus-mode .nf-editor-contenteditable { padding: 48px 80px; max-width: 780px; margin: 0 auto; font-size: 17.5px; line-height: 2.2; }
          
          .nf-selection-indicator {
            padding: 8px 12px; margin: 0 10px; background: var(--nf-bg-surface);
            border: 1px solid var(--nf-accent-2); border-radius: 8px;
            font-size: 10px; color: var(--nf-accent-2); animation: nf-fadeIn 0.12s ease-out;
          }
          .nf-ai-panel { width: 370px; min-width: 370px; border-left: 1px solid var(--nf-border); display: flex; flex-direction: column; background: var(--nf-bg); }
          .nf-ai-mobile-overlay { position: absolute; inset: 0; z-index: 50; display: flex; flex-direction: column; background: var(--nf-bg); animation: nf-fadeIn 0.12s ease-out; }
          .nf-tab-ai-panel { width: 340px; min-width: 340px; border-left: 1px solid var(--nf-border); display: flex; flex-direction: column; background: var(--nf-bg); }
          .nf-mode-bar { padding: 8px 10px; border-bottom: 1px solid var(--nf-border); display: flex; flex-wrap: wrap; gap: 4px; }
          .nf-mode-btn { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid var(--nf-border); background: transparent; color: var(--nf-text-muted); text-transform: capitalize; transition: all 0.15s; font-family: var(--nf-font-body); }
          .nf-mode-btn:hover { border-color: var(--nf-accent); color: var(--nf-text-dim); }
          .nf-mode-btn.active { border-color: var(--nf-accent); color: var(--nf-accent); background: var(--nf-accent-glow); }
          .nf-chat-messages { flex: 1; overflow-y: auto; padding: 10px; }
          .nf-chat-empty { text-align: center; padding: 36px 18px; color: var(--nf-text-muted); font-size: 12.5px; line-height: 1.7; }
          .nf-chat-msg { margin-bottom: 10px; display: flex; flex-direction: column; align-items: flex-start; animation: nf-slideUp 0.15s ease-out; }
          .nf-chat-msg-user { align-items: flex-end; }
          .nf-chat-bubble { max-width: 95%; padding: 10px 14px; border-radius: 12px; background: var(--nf-chat-bubble-bg); border: 1px solid var(--nf-border); color: var(--nf-text); font-size: 13px; line-height: 1.75; font-family: var(--nf-font-prose); word-break: break-word; }
          .nf-chat-bubble strong { font-weight: 700; }
          .nf-chat-bubble em { font-style: italic; }
          .nf-chat-bubble del { text-decoration: line-through; opacity: 0.7; }
          .nf-chat-bubble-user { background: var(--nf-chat-bubble-user-bg); border-color: var(--nf-chat-bubble-user-border); }
          .nf-chat-bubble-error { background: var(--nf-error-bg); border-color: var(--nf-error-border); }
          .nf-chat-actions { display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap; }
          .nf-generating { display: flex; align-items: center; gap: 8px; color: var(--nf-text-dim); font-size: 12px; padding: 8px; }
          .nf-chat-input-area { padding: 10px; border-top: 1px solid var(--nf-border); }
          .nf-scene-direction-box { margin-bottom: 8px; padding: 8px 10px; background: var(--nf-bg-surface); border: 1px solid var(--nf-border); border-radius: 8px; }
          .nf-scene-textarea {
            width: 100%; min-height: 44px; max-height: 90px; padding: 7px 10px;
            background: var(--nf-bg-deep); border: 1px solid var(--nf-border); border-radius: 6px;
            color: var(--nf-text); font-size: 11.5px; line-height: 1.5; resize: vertical; outline: none;
            font-family: var(--nf-font-body);
          }
          .nf-chat-textarea { flex: 1; min-height: 40px; max-height: 110px; padding: 9px 12px; background: var(--nf-bg-surface); border: 1px solid var(--nf-border); border-radius: 8px; color: var(--nf-text); font-size: 13px; resize: vertical; outline: none; font-family: var(--nf-font-body); line-height: 1.5; width: 100%; }
          .nf-send-btn { align-self: flex-end; padding: 9px 12px; background: linear-gradient(135deg, var(--nf-accent), var(--nf-accent-2)); border: none; border-radius: 8px; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: opacity 0.15s; box-shadow: 0 2px 12px var(--nf-accent-glow); }
          .nf-send-btn:hover { opacity: 0.9; }
          .nf-send-btn:disabled { opacity: 0.3; cursor: default; background: var(--nf-bg-surface); box-shadow: none; }
          
          .nf-content-scroll { flex: 1; overflow-y: auto; padding: 28px 36px; }
          .nf-page-title { font-family: var(--nf-font-display); font-size: 28px; font-weight: 500; color: var(--nf-text); margin: 0 0 20px; letter-spacing: -0.02em; }
          .nf-card { margin-bottom: 14px; padding: 16px; background: var(--nf-bg-raised); border-radius: var(--nf-radius); border: 1px solid var(--nf-border); }
          .nf-card-title { font-size: 14px; color: var(--nf-text); margin: 0 0 14px; font-weight: 600; }
          .nf-empty-state { display: flex; align-items: center; justify-content: center; height: 200px; color: var(--nf-text-muted); font-size: 14px; font-family: var(--nf-font-display); font-style: italic; }
          .nf-plot-number { width: 46px; height: 46px; border-radius: 8px; background: var(--nf-bg-surface); display: flex; align-items: center; justify-content: center; color: var(--nf-accent); font-weight: 700; font-size: 16px; font-family: var(--nf-font-display); flex-shrink: 0; }
          .nf-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
          .nf-stat-card { padding: 16px; background: var(--nf-bg-raised); border-radius: var(--nf-radius); border: 1px solid var(--nf-border); text-align: center; }
          .nf-stat-value { font-size: 26px; font-weight: 500; color: var(--nf-accent-2); font-family: var(--nf-font-display); }
          .nf-stat-warn .nf-stat-value { color: var(--nf-accent); }
          .nf-stat-label { font-size: 10px; color: var(--nf-text-muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.08em; }
          .nf-context-preview { margin-top: 12px; padding: 16px; background: var(--nf-bg-deep); border-radius: var(--nf-radius); border: 1px solid var(--nf-border); color: var(--nf-text-muted); font-size: 11px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; max-height: 500px; overflow-y: auto; font-family: var(--nf-font-mono); }
          .nf-welcome { flex: 1; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 14px; }
          .nf-welcome-icon { font-size: 36px; opacity: 0.15; }
          .nf-welcome-text { font-size: 17px; color: var(--nf-text-muted); font-family: var(--nf-font-display); font-style: italic; letter-spacing: -0.01em; }
          
          @media (max-width: 768px) {
            .nf-sidebar-open { position: fixed; inset: 0; z-index: 100; width: 100% !important; min-width: 100% !important; }
            .nf-ai-panel { display: none; }
            .nf-tab-ai-panel { display: none; }
            .nf-chapter-sidebar { width: 130px; min-width: 130px; }
            .nf-editor-contenteditable { padding: 16px; font-size: 15px; }
            .nf-content-scroll { padding: 18px 14px; }
            .nf-stats-grid { grid-template-columns: 1fr; }
            .nf-tab-btn { padding: 10px 8px; font-size: 0; gap: 0; }
            .nf-tab-btn svg { font-size: 18px; }
            .nf-focus-mode .nf-editor-contenteditable { padding: 20px 16px; }
            .nf-rich-toolbar { padding: 3px 6px; }
          }
        `}</style>

        {renderProjectList()}

        {project ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {!focusMode && (
              <div className="nf-tab-bar">
                <button onClick={() => setShowProjectList(!showProjectList)} className="nf-btn-icon" style={{ marginRight: 8 }}><Icons.Menu /></button>
                {tabs.map(t => (
                  <button key={t.id} onClick={() => {
                    // Flush editor content before leaving write tab
                    if (activeTab === "write" && t.id !== "write" && editorRef.current) {
                      syncEditorContent();
                    }
                    setActiveTab(t.id);
                  }} className={`nf-tab-btn ${t.id === activeTab ? "active" : ""}`}>
                    {t.icon} {t.label}
                  </button>
                ))}
                <div style={{ flex: 1 }} />
                <button className="nf-btn-icon" onClick={toggleTheme} title={`${theme === "dark" ? "Light" : "Dark"} mode`} style={{ marginRight: 4 }}>
                  {theme === "dark" ? <Icons.Sun /> : <Icons.Moon />}
                </button>
                <SaveIndicator status={saveStatus} />
                <span className="nf-tab-title" style={{ marginLeft: 8 }}>{project.title}</span>
              </div>
            )}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {activeTab === "write" && renderWrite()}
              {activeTab === "characters" && renderCharacters()}
              {activeTab === "world" && renderWorld()}
              {activeTab === "plot" && renderPlot()}
              {activeTab === "relationships" && renderRelationships()}
              {activeTab === "memory" && renderMemory()}
              {activeTab === "settings" && renderSettings()}
            </div>
          </div>
        ) : (
          <div className="nf-welcome">
            <div className="nf-welcome-icon">✦</div>
            <div className="nf-welcome-text">Create or select a project to begin</div>
          </div>
        )}

        {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
        {confirmDialog && <ConfirmDialog message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(null)} confirmLabel={confirmDialog.confirmLabel} />}
        {diffReview && <DiffReviewModal original={diffReview.original} proposed={diffReview.proposed} onAccept={diffReview.onAccept} onReject={diffReview.onReject} onInsertAtCursor={diffReview.onInsertAtCursor} />}
      </div>
    </ThemeContext.Provider>
  );
}
