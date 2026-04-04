import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const API_BASE = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) || "";

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

const pageCss = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --red: #E2353A;
  --red-light: #FFF0F0;
  --red-mid: #FFBDBE;
  --green: #1A9E5F;
  --green-light: #F0FFF8;
  --green-mid: #A3E6C8;
  --black: #0C0C0A;
  --off-white: #F8F7F3;
  --gray-1: #F2F1EC;
  --gray-2: #E5E4DE;
  --gray-3: #CCCBC4;
  --gray-4: #9E9D97;
  --gray-5: #5E5D58;
  --white: #FFFFFF;
  --font-display: 'Syne', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --radius: 14px;
  --radius-sm: 8px;
}
html { font-size: 16px; scroll-behavior: smooth; }
.flag-detail-shell {
  font-family: var(--font-body);
  background: var(--off-white);
  color: var(--black);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.flag-detail-shell button,
.flag-detail-shell input,
.flag-detail-shell textarea,
.flag-detail-shell select { font-family: inherit; }
.topnav {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 2rem;
  background: rgba(248,247,243,0.94);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--gray-2);
}
.nav-logo {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -.5px;
  color: var(--black);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
}
.logo-flags { display: flex; gap: 4px; align-items: center; }
.flag-shape { width: 9px; height: 15px; clip-path: polygon(0 0,100% 15%,100% 85%,0 100%); display: block; }
.flag-r { background: var(--red); }
.flag-g { background: var(--green); }
.nav-search {
  display: flex;
  align-items: center;
  background: var(--white);
  border: 1.5px solid var(--gray-3);
  border-radius: 30px;
  padding: 5px 5px 5px 16px;
  gap: 6px;
  flex: 1;
  max-width: 340px;
  position: relative;
}
.nav-at {
  font-family: var(--font-display);
  font-size: .85rem;
  font-weight: 700;
  color: var(--gray-4);
}
.nav-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-body);
  font-size: .88rem;
  color: var(--black);
  min-width: 0;
}
.nav-search-btn,
.btn-solid,
.primary-btn {
  font-family: var(--font-display);
  font-size: .78rem;
  font-weight: 700;
  border: none;
  border-radius: 22px;
  padding: 8px 16px;
  cursor: pointer;
  transition: opacity .15s;
  text-decoration: none;
}
.nav-search-btn,
.btn-solid,
.primary-btn {
  background: var(--black);
  color: var(--white);
}
.nav-search-btn:hover,
.btn-solid:hover,
.primary-btn:hover { opacity: .85; }
.nav-right { display: flex; align-items: center; gap: 8px; }
.btn-ghost {
  font-family: var(--font-body);
  font-size: .8rem;
  font-weight: 500;
  color: var(--gray-5);
  background: none;
  border: 1px solid var(--gray-3);
  border-radius: 30px;
  padding: 6px 14px;
  cursor: pointer;
  text-decoration: none;
  transition: all .15s;
}
.btn-ghost:hover { border-color: var(--black); color: var(--black); }
.search-suggestions {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--gray-2);
  border-radius: var(--radius);
  box-shadow: 0 12px 40px rgba(0,0,0,.12);
  overflow: hidden;
  z-index: 120;
}
.suggest-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: none;
  background: white;
  text-align: left;
  cursor: pointer;
  border-bottom: 1px solid var(--gray-1);
}
.suggest-btn:last-child { border-bottom: none; }
.suggest-btn:hover { background: var(--gray-1); }
.suggest-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: .82rem;
  flex-shrink: 0;
}
.suggest-info { flex: 1; min-width: 0; }
.suggest-handle { font-size: .86rem; font-weight: 600; color: var(--black); }
.suggest-meta { font-size: .68rem; color: var(--gray-4); margin-top: 1px; }
.suggest-score { font-size: .68rem; font-weight: 700; border-radius: 20px; padding: 3px 9px; }
.page {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 2rem 2rem 4rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 1.5rem;
}
.main-col,
.side-col {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.card {
  background: var(--white);
  border: 1px solid var(--gray-2);
  border-radius: var(--radius);
  padding: 1.25rem;
}
.card-title {
  font-family: var(--font-display);
  font-size: .8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--gray-4);
  margin-bottom: .9rem;
}
.hero-card {
  background: linear-gradient(145deg, #140607, #271012);
  color: var(--white);
  overflow: hidden;
  position: relative;
}
.hero-card::after {
  content: "";
  position: absolute;
  inset: auto -30px -40px auto;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(226,53,58,.22), rgba(226,53,58,0));
  pointer-events: none;
}
.crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: .72rem;
  color: rgba(255,255,255,.55);
  margin-bottom: 1rem;
}
.crumbs a,
.crumbs button {
  color: rgba(255,255,255,.8);
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
}
.crumbs a:hover,
.crumbs button:hover { color: var(--white); }
.eyebrow-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: .85rem;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: .68rem;
  font-weight: 700;
}
.badge.red { background: rgba(226,53,58,.16); color: #ffb1b3; border: 1px solid rgba(226,53,58,.32); }
.badge.green { background: rgba(26,158,95,.16); color: #b7f1d4; border: 1px solid rgba(26,158,95,.28); }
.badge.gray { background: rgba(255,255,255,.08); color: rgba(255,255,255,.72); border: 1px solid rgba(255,255,255,.12); }
.hero-title {
  font-family: var(--font-display);
  font-size: 2rem;
  line-height: 1.05;
  letter-spacing: -.8px;
  max-width: 14ch;
  margin-bottom: .85rem;
}
.hero-sub {
  max-width: 58ch;
  font-size: .9rem;
  line-height: 1.65;
  color: rgba(255,255,255,.7);
}
.hero-meta {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .75rem;
  margin-top: 1.25rem;
}
.meta-chip {
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: var(--radius-sm);
  padding: .8rem .85rem;
}
.meta-label {
  font-size: .65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: rgba(255,255,255,.45);
  margin-bottom: 4px;
}
.meta-value {
  font-size: .84rem;
  color: var(--white);
  line-height: 1.45;
}
.pill {
  font-size: .7rem;
  font-weight: 600;
  color: var(--gray-5);
  background: var(--gray-1);
  border: 1px solid var(--gray-2);
  padding: 5px 10px;
  border-radius: 20px;
}
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-1);
  flex-wrap: wrap;
}
.icon-actions {
  display: flex;
  align-items: center;
  gap: .55rem;
  flex-wrap: wrap;
}
.icon-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid var(--gray-2);
  background: var(--gray-1);
  color: var(--gray-5);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .15s;
  position: relative;
}
.icon-btn:hover {
  background: var(--white);
  border-color: var(--black);
  color: var(--black);
  transform: translateY(-1px);
}
.icon-btn.active {
  background: var(--black);
  border-color: var(--black);
  color: var(--white);
}
.icon-btn.red-active.active {
  background: var(--red);
  border-color: var(--red);
}
.icon-btn svg {
  width: 17px;
  height: 17px;
  stroke: currentColor;
  fill: none;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.icon-count {
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: var(--white);
  border: 1px solid var(--gray-2);
  color: var(--gray-5);
  font-size: .62rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  position: absolute;
  right: -4px;
  bottom: -2px;
}
.icon-btn.active .icon-count {
  background: rgba(255,255,255,.16);
  border-color: rgba(255,255,255,.22);
  color: var(--white);
}
.action-hint {
  font-size: .76rem;
  color: var(--gray-4);
}
.response-card {
  background: linear-gradient(180deg, #ffffff, #fbfaf7);
}
.response-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: .9rem;
}
.response-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: .68rem;
  font-weight: 700;
  color: var(--green);
  background: var(--green-light);
  border: 1px solid var(--green-mid);
  border-radius: 20px;
  padding: 4px 10px;
}
.response-body {
  font-size: .88rem;
  line-height: 1.7;
  color: var(--gray-5);
}
.response-body strong { color: var(--black); }
.post-body {
  font-size: 1rem;
  line-height: 1.75;
  color: var(--black);
}
.meta-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .8rem;
  margin-top: 1rem;
}
.meta-card {
  background: var(--gray-1);
  border: 1px solid var(--gray-2);
  border-radius: var(--radius-sm);
  padding: .95rem 1rem;
}
.meta-card-label {
  font-size: .67rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--gray-4);
  margin-bottom: 4px;
}
.meta-card-copy {
  font-size: .82rem;
  line-height: 1.45;
  color: var(--black);
}
.mod-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 1rem;
}
.subtle-btn {
  font-family: var(--font-body);
  font-size: .78rem;
  font-weight: 500;
  color: var(--gray-5);
  background: var(--gray-1);
  border: 1px solid var(--gray-2);
  border-radius: var(--radius-sm);
  padding: 9px 14px;
  cursor: pointer;
  transition: all .15s;
}
.subtle-btn:hover {
  background: var(--white);
  color: var(--black);
  border-color: var(--black);
}
.profile-card {
  padding: 1.35rem;
}
.profile-top {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 1rem;
}
.profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--red), #FF8A65);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--white);
  flex-shrink: 0;
}
.profile-handle {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -.3px;
  color: var(--black);
  margin-bottom: 3px;
}
.profile-sub {
  font-size: .75rem;
  color: var(--gray-4);
  line-height: 1.45;
}
.score-box {
  background: var(--gray-1);
  border: 1px solid var(--gray-2);
  border-radius: var(--radius-sm);
  padding: 1rem;
  margin-bottom: .9rem;
}
.score-row {
  display: flex;
  align-items: center;
  gap: .85rem;
}
.score-ring {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: conic-gradient(var(--red) 0 82%, var(--green) 82% 100%);
  flex-shrink: 0;
}
.score-inner {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--gray-1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: .92rem;
  font-weight: 800;
  color: var(--red);
}
.score-title {
  font-family: var(--font-display);
  font-size: .95rem;
  font-weight: 800;
  margin-bottom: 3px;
}
.score-sub {
  font-size: .74rem;
  line-height: 1.45;
  color: var(--gray-5);
}
.mini-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .75rem;
}
.mini-stat {
  background: var(--gray-1);
  border: 1px solid var(--gray-2);
  border-radius: var(--radius-sm);
  padding: .9rem;
}
.mini-stat-num {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 4px;
}
.mini-stat-label {
  font-size: .72rem;
  color: var(--gray-5);
  line-height: 1.4;
}
.side-list {
  display: flex;
  flex-direction: column;
  gap: .75rem;
}
.side-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  padding-bottom: .75rem;
  border-bottom: 1px solid var(--gray-1);
}
.side-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.side-key {
  font-size: .74rem;
  color: var(--gray-4);
}
.side-val {
  font-size: .78rem;
  color: var(--black);
  font-weight: 600;
  text-align: right;
}
.toast {
  position: fixed;
  left: 50%;
  bottom: 2rem;
  transform: translateX(-50%) translateY(80px);
  background: var(--black);
  color: var(--white);
  border-radius: 30px;
  padding: 10px 18px;
  font-size: .8rem;
  z-index: 999;
  transition: transform .25s ease;
  pointer-events: none;
}
.toast.show { transform: translateX(-50%) translateY(0); }
.site-footer {
  border-top: 1px solid var(--gray-2);
  padding: 1.25rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  background: var(--white);
  margin-top: auto;
}
.footer-copy { font-size: .75rem; color: var(--gray-4); }
.footer-links {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.footer-link {
  font-size: .75rem;
  color: var(--gray-4);
  text-decoration: none;
}
.footer-link:hover { color: var(--black); }
.error-bar {
  background: var(--red-light);
  border: 1px solid var(--red-mid);
  color: var(--red);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  margin-bottom: 1rem;
  font-size: .8rem;
}
.skeleton {
  background: linear-gradient(90deg, var(--gray-1), #faf9f5, var(--gray-1));
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
  border-radius: 10px;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@media (max-width: 960px) {
  .page { grid-template-columns: 1fr; }
}
@media (max-width: 720px) {
  .topnav { padding: 0 1rem; }
  .nav-search { display: none; }
  .page { padding: 1.25rem 1rem 3rem; }
  .hero-meta,
  .meta-grid,
  .mini-stats { grid-template-columns: 1fr; }
  .hero-title { font-size: 1.6rem; }
  .response-head { flex-direction: column; align-items: flex-start; }
}
`;

const fallbackData = {
  auth: { isAuthenticated: false },
  flag: {
    id: "flag_1",
    title: "Love bombing and then complete silence.",
    subtitle:
      "A single flag should read like a clean post, not a case file. This page expands one experience with just enough metadata to make it legible without turning the product into a moderation dashboard.",
    type: "red",
    anonymous: true,
    sourceLabel: "Direct experience",
    relationship: "Dated for 6 weeks",
    whenLabel: "1 to 6 months ago",
    category: "Love bombing",
    credibility: "Counts toward vibe score",
    body:
      "He came on incredibly strong, talked about long-term plans almost immediately, was calling every night, then disappeared for a week and came back acting like nothing happened. It felt intense, flattering, and then weirdly destabilizing.",
    postedAt: "2 hours ago",
    viewCount: 38,
    familiarCount: 6,
    attachmentCount: 0,
    identityLabel: "Posted anonymously",
    relateCount: 6,
    reactedFamiliar: false,
    bookmarked: false,
    response: {
      visible: true,
      label: "Visible on profile",
      body:
        '"I recognize that I came in too intense and then handled the pullback badly. I should have communicated clearly instead of going silent. I disagree with some wording here, but I understand why the experience felt confusing and hurtful."',
      byline: "@rohanverma__ replied:",
    },
    quickFacts: {
      postAge: "2 hours ago",
      type: "Red flag",
      source: "Direct experience",
      attachedMedia: "None",
    },
  },
  profile: {
    handle: "rohanverma__",
    initial: "R",
    subtitle: "Mumbai · creator economy · profile searched this week for dating and collab context",
    score: 18,
    scoreTitle: "Low green score",
    scoreSub: "14 red flags and 3 green flags currently shape the public reputation snapshot.",
    redFlags: 14,
    greenFlags: 3,
    thisFlagViews: 38,
    ageSincePosted: "2h",
  },
  whyThisWorks:
    "It feels like one expanded post from the feed, not a courtroom. That keeps the page aligned with the rest of Clocked while still giving users enough clarity to judge the vibe for themselves.",
  suggestions: [
    { id: 1, handle: "rohanverma__", red: 14, green: 3, score: 18, color: "#E2353A" },
    { id: 2, handle: "aarav.k", red: 11, green: 7, score: 39, color: "#E2353A" },
    { id: 3, handle: "mehak.designs", red: 2, green: 19, score: 90, color: "#1A9E5F" },
  ],
};

function mapPayload(payload) {
  return {
    ...fallbackData,
    ...payload,
    auth: { ...fallbackData.auth, ...(payload.auth || {}) },
    flag: {
      ...fallbackData.flag,
      ...(payload.flag || {}),
      response: {
        ...fallbackData.flag.response,
        ...((payload.flag && payload.flag.response) || {}),
      },
      quickFacts: {
        ...fallbackData.flag.quickFacts,
        ...((payload.flag && payload.flag.quickFacts) || {}),
      },
    },
    profile: { ...fallbackData.profile, ...(payload.profile || {}) },
    suggestions: payload.suggestions?.length ? payload.suggestions : fallbackData.suggestions,
  };
}

function scoreBadgeClass(score) {
  return Number(score) > 55 ? "#1A9E5F" : "#E2353A";
}

export default function FlagDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const flagId = query.get("id") || query.get("flagId") || fallbackData.flag.id;
  const handleQuery = (query.get("handle") || fallbackData.profile.handle).replace(/^@/, "");

  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [navSearch, setNavSearch] = useState(handleQuery);
  const [navFocused, setNavFocused] = useState(false);
  const [navSuggestions, setNavSuggestions] = useState([]);
  const [navSuggestionsLoading, setNavSuggestionsLoading] = useState(false);
  const [related, setRelated] = useState(false);
  const [relatedCount, setRelatedCount] = useState(fallbackData.flag.relateCount);
  const [bookmarked, setBookmarked] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [known, setKnown] = useState(false);
  const [toast, setToast] = useState("");
  const suggestTimerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const responseRef = useRef(null);

  useEffect(() => {
    let ignore = false;

    async function loadFlag() {
      setLoading(true);
      setError("");
      try {
        const payload = await apiFetch(`/api/flags/${encodeURIComponent(flagId)}?handle=${encodeURIComponent(handleQuery)}`);
        if (ignore) return;
        const mapped = mapPayload(payload || {});
        setData(mapped);
        setRelated(Boolean(mapped.flag.reactedFamiliar));
        setRelatedCount(Number(mapped.flag.relateCount || 0));
        setBookmarked(Boolean(mapped.flag.bookmarked));
      } catch (err) {
        if (!ignore) {
          setData(mapPayload({ profile: { handle: handleQuery }, flag: { id: flagId } }));
          setRelated(Boolean(fallbackData.flag.reactedFamiliar));
          setRelatedCount(Number(fallbackData.flag.relateCount || 0));
          setBookmarked(Boolean(fallbackData.flag.bookmarked));
          setError(err.message || "Failed to load flag detail.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadFlag();
    return () => {
      ignore = true;
    };
  }, [flagId, handleQuery]);

  useEffect(() => {
    const cleaned = navSearch.trim().replace(/^@/, "");
    if (!cleaned) {
      setNavSuggestions([]);
      setNavSuggestionsLoading(false);
      return undefined;
    }

    suggestTimerRef.current = window.setTimeout(async () => {
      setNavSuggestionsLoading(true);
      try {
        const payload = await apiFetch(`/api/search/suggestions?q=${encodeURIComponent(cleaned)}`);
        setNavSuggestions(payload?.items || []);
      } catch {
        const fallback = data.suggestions.filter((item) => item.handle.toLowerCase().includes(cleaned.toLowerCase()));
        setNavSuggestions(fallback);
      } finally {
        setNavSuggestionsLoading(false);
      }
    }, 220);

    return () => {
      if (suggestTimerRef.current) window.clearTimeout(suggestTimerRef.current);
    };
  }, [navSearch, data.suggestions]);

  useEffect(() => {
    if (!toast) return undefined;
    toastTimerRef.current = window.setTimeout(() => setToast(""), 1800);
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, [toast]);

  function showToast(message) {
    setToast(message);
  }

  function doSearch(handleOverride) {
    const next = (handleOverride || navSearch).trim().replace(/^@/, "");
    if (!next) return;
    navigate(`/search?handle=${encodeURIComponent(next)}`);
  }

  async function copyLink() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Link copied");
      } else {
        showToast("Copy not supported here");
      }
    } catch {
      showToast("Copy not supported here");
    }
  }

  async function toggleKnown() {
    const next = !known;
    setKnown(next);
    showToast(next ? "Pattern noted" : "Pattern removed");
    try {
      await apiFetch(`/api/flags/${encodeURIComponent(data.flag.id)}/pattern`, {
        method: next ? "POST" : "DELETE",
      });
    } catch {
      setKnown(!next);
    }
  }

  async function toggleRelate() {
    const next = !related;
    const prevCount = relatedCount;
    setRelated(next);
    setRelatedCount((current) => (next ? current + 1 : Math.max(0, current - 1)));
    showToast(next ? "Marked as familiar" : "Removed reaction");
    try {
      await apiFetch(`/api/flags/${encodeURIComponent(data.flag.id)}/relate`, {
        method: next ? "POST" : "DELETE",
      });
    } catch {
      setRelated(!next);
      setRelatedCount(prevCount);
    }
  }

  async function toggleBookmark() {
    const next = !bookmarked;
    setBookmarked(next);
    showToast(next ? "Saved for later" : "Removed from saved");
    try {
      await apiFetch(`/api/flags/${encodeURIComponent(data.flag.id)}/bookmark`, {
        method: next ? "POST" : "DELETE",
      });
    } catch {
      setBookmarked(!next);
    }
  }

  function toggleReply() {
    const next = !replyOpen;
    setReplyOpen(next);
    if (responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    showToast(next ? "Jumped to reply" : "Reply viewed");
  }

  const typeIsRed = data.flag.type === "red";
  const scoreRingStyle = {
    background: `conic-gradient(var(--red) 0 ${Math.max(0, 100 - Number(data.profile.score || 0))}%, var(--green) ${Math.max(0, 100 - Number(data.profile.score || 0))}% 100%)`,
  };

  return (
    <div className="flag-detail-shell">
      <style>{pageCss}</style>

      <header className="topnav">
        <Link to="/" className="nav-logo">
          <div className="logo-flags"><div className="flag-shape flag-r"></div><div className="flag-shape flag-g"></div></div>
          Clocked
        </Link>

        <div className="nav-search">
          <span className="nav-at">@</span>
          <input
            className="nav-search-input"
            type="text"
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            onFocus={() => setNavFocused(true)}
            onBlur={() => window.setTimeout(() => setNavFocused(false), 120)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
          />
          <button className="nav-search-btn" onClick={() => doSearch()}>Search</button>

          {navFocused && (navSuggestionsLoading || navSuggestions.length > 0) && (
            <div className="search-suggestions">
              {navSuggestionsLoading ? (
                <div style={{ padding: "10px 14px", fontSize: ".8rem", color: "var(--gray-5)" }}>Loading suggestions...</div>
              ) : (
                navSuggestions.map((item, index) => {
                  const handle = item.handle || item.username || `user_${index}`;
                  const red = Number(item.red ?? item.redCount ?? 0);
                  const green = Number(item.green ?? item.greenCount ?? 0);
                  const score = item.score ?? item.vibeScore ?? Math.round((green / Math.max(green + red, 1)) * 100);
                  const good = Number(score) > 55;
                  return (
                    <button key={item.id || handle || index} className="suggest-btn" onMouseDown={() => doSearch(handle)}>
                      <div className="suggest-avatar" style={{ background: item.color || scoreBadgeClass(score) }}>{String(handle)[0].toUpperCase()}</div>
                      <div className="suggest-info">
                        <div className="suggest-handle">@{handle}</div>
                        <div className="suggest-meta">{red} red · {green} green flags</div>
                      </div>
                      <span className="suggest-score" style={{ background: good ? "#F0FFF8" : "#FFF0F0", color: good ? "#1A9E5F" : "#E2353A" }}>{score}%</span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="nav-right">
          <Link to={`/search?handle=${encodeURIComponent(data.profile.handle)}`} className="btn-ghost">Back to profile</Link>
          <Link to={`/flag?handle=${encodeURIComponent(data.profile.handle)}`} className="btn-solid">Drop a flag</Link>
        </div>
      </header>

      <div className="page">
        <main className="main-col">
          {error ? <div className="error-bar">{error}</div> : null}

          {loading ? (
            <>
              <section className="card hero-card" style={{ minHeight: 280 }}>
                <div className="skeleton" style={{ height: 18, width: 200, marginBottom: 18, opacity: 0.28 }} />
                <div className="skeleton" style={{ height: 22, width: 280, marginBottom: 12, opacity: 0.28 }} />
                <div className="skeleton" style={{ height: 16, width: "72%", marginBottom: 10, opacity: 0.22 }} />
                <div className="skeleton" style={{ height: 16, width: "60%", opacity: 0.22 }} />
              </section>
              <section className="card"><div className="skeleton" style={{ height: 120 }} /></section>
            </>
          ) : (
            <>
              <section className="card hero-card">
                <div className="crumbs">
                  <Link to="/">Home</Link>
                  <span>/</span>
                  <button type="button" onClick={() => navigate(`/search?handle=${encodeURIComponent(data.profile.handle)}`)}>@{data.profile.handle}</button>
                  <span>/</span>
                  <span>Flag detail</span>
                </div>

                <div className="eyebrow-row">
                  <span className={`badge ${typeIsRed ? "red" : "green"}`}>{typeIsRed ? "Red flag" : "Green flag"}</span>
                  <span className="badge gray">{data.flag.anonymous ? "Anonymous post" : "Posted with handle"}</span>
                  <span className="badge gray">{data.flag.sourceLabel}</span>
                </div>

                <h1 className="hero-title">{data.flag.title}</h1>
                <p className="hero-sub">{data.flag.subtitle}</p>

                <div className="hero-meta">
                  <div className="meta-chip">
                    <div className="meta-label">Relationship</div>
                    <div className="meta-value">{data.flag.relationship}</div>
                  </div>
                  <div className="meta-chip">
                    <div className="meta-label">When</div>
                    <div className="meta-value">{data.flag.whenLabel}</div>
                  </div>
                  <div className="meta-chip">
                    <div className="meta-label">Category</div>
                    <div className="meta-value">{data.flag.category}</div>
                  </div>
                  <div className="meta-chip">
                    <div className="meta-label">Credibility</div>
                    <div className="meta-value">{data.flag.credibility}</div>
                  </div>
                </div>
              </section>

              <section className="card">
                <div className="card-title">Flag</div>
                <div className="post-body">{data.flag.body}</div>
                <div className="quote-meta" style={{ marginTop: "1rem", display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="pill">Posted {data.flag.postedAt}</span>
                  <span className="pill">Seen by {data.flag.viewCount} people</span>
                  <span className="pill">{relatedCount} people say this sounds familiar</span>
                  <span className="pill">{data.flag.attachmentCount ? `${data.flag.attachmentCount} attachments` : 'No attachments'}</span>
                </div>
                <div className="action-bar">
                  <div className="icon-actions">
                    <button className={`icon-btn red-active ${related ? 'active' : ''}`} onClick={toggleRelate} aria-label="This feels familiar">
                      <svg viewBox="0 0 24 24"><path d="M12 21s-6.5-4.35-9-8.08C1.45 10.57 2.1 7.4 4.8 6.12c1.95-.92 4.1-.24 5.2 1.38 1.1-1.62 3.25-2.3 5.2-1.38 2.7 1.28 3.35 4.45 1.8 6.8C18.5 16.65 12 21 12 21z"></path></svg>
                      <span className="icon-count">{relatedCount}</span>
                    </button>
                    <button className="icon-btn" onClick={copyLink} aria-label="Share flag">
                      <svg viewBox="0 0 24 24"><path d="M8 12h8"></path><path d="M12 8l4 4-4 4"></path><path d="M5 5v14a1 1 0 0 0 1 1h12"></path></svg>
                    </button>
                    <button className={`icon-btn ${bookmarked ? 'active' : ''}`} onClick={toggleBookmark} aria-label="Save flag">
                      <svg viewBox="0 0 24 24"><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3-6 3V5a1 1 0 0 1 1-1z"></path></svg>
                    </button>
                    <button className={`icon-btn ${replyOpen ? 'active' : ''}`} onClick={toggleReply} aria-label="Open reply">
                      <svg viewBox="0 0 24 24"><path d="M20 15a4 4 0 0 1-4 4H8l-4 3V7a2 2 0 0 1 2-2h10a4 4 0 0 1 4 4z"></path></svg>
                    </button>
                  </div>
                  <div className="action-hint">React, share, save, or jump to the reply.</div>
                </div>
                <div className="meta-grid">
                  <div className="meta-card">
                    <div className="meta-card-label">Relationship</div>
                    <div className="meta-card-copy">{data.flag.relationship}</div>
                  </div>
                  <div className="meta-card">
                    <div className="meta-card-label">When</div>
                    <div className="meta-card-copy">{data.flag.whenLabel}</div>
                  </div>
                  <div className="meta-card">
                    <div className="meta-card-label">Category</div>
                    <div className="meta-card-copy">{data.flag.category}</div>
                  </div>
                  <div className="meta-card">
                    <div className="meta-card-label">Identity</div>
                    <div className="meta-card-copy">{data.flag.identityLabel}</div>
                  </div>
                </div>
              </section>

              {data.flag.response?.visible ? (
                <section className="card response-card" ref={responseRef}>
                  <div className="response-head">
                    <div>
                      <div className="card-title" style={{ marginBottom: ".35rem" }}>Subject Response</div>
                      <span className="response-tag">{data.flag.response.label}</span>
                    </div>
                    <button className="subtle-btn" onClick={copyLink}>Copy direct link</button>
                  </div>
                  <div className="response-body">
                    <strong>{data.flag.response.byline}</strong> {data.flag.response.body}
                  </div>
                </section>
              ) : null}

              <section className="card">
                <div className="card-title">Actions</div>
                <div className="post-body" style={{ fontSize: ".88rem", color: "var(--gray-5)" }}>
                  If this resonates, add your own flag on the profile. If not, just move on. The page should feel lightweight,
                  readable, and easy to share.
                </div>
                <div className="mod-actions">
                  <button className="subtle-btn" onClick={copyLink}>Copy URL</button>
                  <button className="subtle-btn" onClick={toggleKnown}>{known ? 'You marked this pattern' : 'I know this pattern too'}</button>
                  <Link to="/grievance" className="btn-ghost">Report issue</Link>
                </div>
              </section>
            </>
          )}
        </main>

        <aside className="side-col">
          {loading ? (
            <>
              <section className="card profile-card"><div className="skeleton" style={{ height: 180 }} /></section>
              <section className="card"><div className="skeleton" style={{ height: 120 }} /></section>
            </>
          ) : (
            <>
              <section className="card profile-card">
                <div className="profile-top">
                  <div className="profile-avatar">{data.profile.initial}</div>
                  <div>
                    <div className="profile-handle">@{data.profile.handle}</div>
                    <div className="profile-sub">{data.profile.subtitle}</div>
                  </div>
                </div>

                <div className="score-box">
                  <div className="score-row">
                    <div className="score-ring" style={scoreRingStyle}>
                      <div className="score-inner">{data.profile.score}%</div>
                    </div>
                    <div>
                      <div className="score-title">{data.profile.scoreTitle}</div>
                      <div className="score-sub">{data.profile.scoreSub}</div>
                    </div>
                  </div>
                </div>

                <div className="mini-stats">
                  <div className="mini-stat">
                    <div className="mini-stat-num" style={{ color: "var(--red)" }}>{data.profile.redFlags}</div>
                    <div className="mini-stat-label">Red flags on profile</div>
                  </div>
                  <div className="mini-stat">
                    <div className="mini-stat-num" style={{ color: "var(--green)" }}>{data.profile.greenFlags}</div>
                    <div className="mini-stat-label">Green flags on profile</div>
                  </div>
                  <div className="mini-stat">
                    <div className="mini-stat-num">{data.profile.thisFlagViews}</div>
                    <div className="mini-stat-label">Views on this flag</div>
                  </div>
                  <div className="mini-stat">
                    <div className="mini-stat-num">{data.profile.ageSincePosted}</div>
                    <div className="mini-stat-label">Since it was posted</div>
                  </div>
                </div>

                <div className="mod-actions">
                  <Link to={`/search?handle=${encodeURIComponent(data.profile.handle)}`} className="btn-ghost">Open full profile</Link>
                  <Link to={`/flag?handle=${encodeURIComponent(data.profile.handle)}`} className="btn-solid">Add your own flag</Link>
                </div>
              </section>

              <section className="card">
                <div className="card-title">At A Glance</div>
                <div className="side-list">
                  <div className="side-row">
                    <span className="side-key">Post age</span>
                    <span className="side-val">{data.flag.quickFacts.postAge}</span>
                  </div>
                  <div className="side-row">
                    <span className="side-key">Type</span>
                    <span className="side-val">{data.flag.quickFacts.type}</span>
                  </div>
                  <div className="side-row">
                    <span className="side-key">Source</span>
                    <span className="side-val">{data.flag.quickFacts.source}</span>
                  </div>
                  <div className="side-row">
                    <span className="side-key">Attached media</span>
                    <span className="side-val">{data.flag.quickFacts.attachedMedia}</span>
                  </div>
                </div>
              </section>

              <section className="card">
                <div className="card-title">Why This Works</div>
                <div className="meta-card-copy">{data.whyThisWorks}</div>
              </section>
            </>
          )}
        </aside>
      </div>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>

      <footer className="site-footer">
        <span className="footer-copy">Clocked - know the vibe before you invest.</span>
        <div className="footer-links">
          <Link to="/" className="footer-link">Home</Link>
          <Link to="/terms" className="footer-link">Terms</Link>
          <Link to="/privacy" className="footer-link">Privacy</Link>
          <Link to="/grievance" className="footer-link">Report / Takedown</Link>
        </div>
      </footer>
    </div>
  );
}
