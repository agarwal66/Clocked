import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
const API_BASE = process.env.REACT_APP_API_BASE_URL || "";

if (!API_BASE) {
  console.error("❌ API_BASE not found. Check .env file");
} else {
  console.log("✅ API BASE:", API_BASE);
}

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
      // ignore parse issue
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
  --radius: 14px;
  --radius-sm: 8px;
}
.homepage-shell { font-family: 'DM Sans', sans-serif; background: var(--off-white); color: var(--black); min-height: 100vh; overflow-x: hidden; }
.hero-slider { position: absolute; top: 0; left: 0; right: 0; height: 100vh; z-index: 0; overflow: hidden; }
.slide { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0; transition: opacity 1.6s ease; }
.slide.active { opacity: 1; animation: zoomSlow 10s ease forwards; }
@keyframes zoomSlow { from { transform: scale(1.07); } to { transform: scale(1.00); } }
.slide-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(6,6,4,0.70) 0%, rgba(6,6,4,0.55) 40%, rgba(6,6,4,0.82) 100%); }
.slider-dots { position: absolute; bottom: 1.5rem; left: 50%; transform: translateX(-50%); display: flex; gap: 7px; z-index: 10; }
.slider-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.35); border: none; cursor: pointer; transition: all 0.35s; padding: 0; }
.slider-dot.active { width: 26px; border-radius: 4px; background: rgba(255,255,255,0.92); }
.home-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 200; height: 58px; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; background: rgba(6,6,4,0.45); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid rgba(255,255,255,0.1); }
.nav-logo { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-decoration: none; display: flex; align-items: center; gap: 8px; }
.logo-flags { display: flex; gap: 4px; align-items: center; }
.flag-shape { width: 10px; height: 17px; clip-path: polygon(0 0, 100% 15%, 100% 85%, 0 100%); display: block; }
.flag-r { background: var(--red); }
.flag-g { background: var(--green); }
.nav-right { display: flex; align-items: center; gap: 10px; }
.btn-ghost { font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 500; color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.25); border-radius: 30px; padding: 6px 16px; cursor: pointer; text-decoration: none; transition: all 0.15s; }
.btn-ghost:hover { background: rgba(255,255,255,0.2); }
.btn-solid { font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 600; color: var(--black); background: #ffffff; border: 1px solid #ffffff; border-radius: 30px; padding: 6px 18px; cursor: pointer; text-decoration: none; transition: opacity 0.15s; }
.btn-solid:hover { opacity: 0.88; }
.btn-admin { font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 600; color: var(--red); background: rgba(255,255,255,0.15); border: 1px solid var(--red); border-radius: 30px; padding: 6px 16px; cursor: pointer; text-decoration: none; transition: all 0.15s; }
.btn-admin:hover { background: var(--red); color: white; }
.hero-section { position: relative; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 2rem 120px; text-align: center; z-index: 1; }
.hero-badge { display: inline-flex; align-items: center; gap: 7px; background: rgba(255,255,255,0.13); border: 1px solid rgba(255,255,255,0.28); border-radius: 30px; padding: 6px 16px; font-size: 0.75rem; font-weight: 500; color: #ffffff; margin-bottom: 1.75rem; backdrop-filter: blur(8px); animation: fadeUp 0.6s ease both; }
.badge-dot { width: 7px; height: 7px; background: var(--green); border-radius: 50%; animation: pulse 2s infinite; flex-shrink: 0; }
@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.75); } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
.hero-title { font-family: 'Syne', sans-serif; font-size: clamp(2.8rem, 7vw, 5.2rem); font-weight: 800; line-height: 1.0; letter-spacing: -2px; color: #ffffff; margin-bottom: 1.25rem; text-shadow: 0 2px 20px rgba(0,0,0,0.4); animation: fadeUp 0.6s 0.1s ease both; }
.accent-red { color: #ff5a5f; }
.hero-sub { font-size: 1.1rem; color: rgba(255,255,255,0.88); font-weight: 400; line-height: 1.65; max-width: 500px; margin: 0 auto 2.5rem; text-shadow: 0 1px 8px rgba(0,0,0,0.5); animation: fadeUp 0.6s 0.18s ease both; }
.search-wrap { width: 100%; max-width: 560px; margin: 0 auto 1.2rem; animation: fadeUp 0.6s 0.26s ease both; }
.search-box { display: flex; align-items: center; background: #ffffff; border: 2px solid #ffffff; border-radius: 50px; padding: 6px 6px 6px 22px; box-shadow: 0 8px 40px rgba(0,0,0,0.35); }
.search-at { font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 700; color: var(--gray-4); margin-right: 2px; flex-shrink: 0; }
.search-input { flex: 1; border: none; outline: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 1rem; color: var(--black); font-weight: 400; min-width: 0; }
.search-input::placeholder { color: var(--gray-4); }
.search-btn { font-family: 'Syne', sans-serif; font-size: 0.85rem; font-weight: 700; color: #ffffff; background: var(--black); border: none; border-radius: 40px; padding: 11px 24px; cursor: pointer; white-space: nowrap; flex-shrink: 0; transition: background 0.15s, transform 0.1s; }
.search-btn:hover { background: var(--gray-5); }
.search-btn:active { transform: scale(0.97); }
.search-hint { font-size: 0.78rem; color: rgba(255,255,255,0.65); margin-top: 0.65rem; font-weight: 400; text-shadow: 0 1px 6px rgba(0,0,0,0.4); animation: fadeUp 0.6s 0.32s ease both; }
.search-hint code { background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.28); border-radius: 5px; padding: 1px 7px; font-family: 'DM Sans', sans-serif; font-size: 0.74rem; color: rgba(255,255,255,0.9); margin: 0 2px; }
.search-dropdown { display: none; position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: #ffffff; border-radius: var(--radius); border: 1px solid var(--gray-2); box-shadow: 0 12px 40px rgba(0,0,0,0.18); overflow: hidden; z-index: 50; }
.search-dropdown.show { display: block; }
.drop-item { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 1px solid var(--gray-1); cursor: pointer; text-decoration: none; color: var(--black); transition: background 0.1s; width: 100%; background: transparent; border-left: 0; border-right: 0; border-top: 0; }
.drop-item:last-child { border-bottom: none; }
.drop-item:hover { background: var(--gray-1); }
.drop-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 0.85rem; font-weight: 700; color: #fff; flex-shrink: 0; }
.drop-info { flex: 1; text-align: left; }
.drop-handle { font-size: 0.88rem; font-weight: 500; color: var(--black); }
.drop-score { font-size: 0.7rem; color: var(--gray-4); margin-top: 1px; }
.drop-badge { font-size: 0.7rem; font-weight: 600; padding: 3px 9px; border-radius: 20px; }
.why-row { display: flex; justify-content: center; align-items: center; gap: 7px; flex-wrap: wrap; margin-top: 1.1rem; animation: fadeUp 0.6s 0.38s ease both; }
.why-label { font-size: 0.75rem; color: rgba(255,255,255,0.65); font-weight: 500; text-shadow: 0 1px 6px rgba(0,0,0,0.4); }
.why-pill { font-size: 0.75rem; font-weight: 500; padding: 5px 13px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.28); background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.88); cursor: pointer; transition: all 0.15s; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
.why-pill:hover { background: rgba(255,255,255,0.22); }
.why-pill.active { background: #ffffff; color: var(--black); border-color: #ffffff; font-weight: 600; }
.stats-strip { position: relative; z-index: 2; display: flex; justify-content: center; gap: 3rem; padding: 1.6rem 2rem; background: #ffffff; border-top: 1px solid var(--gray-2); border-bottom: 1px solid var(--gray-2); flex-wrap: wrap; }
.stat-item { text-align: center; }
.stat-num { font-family: 'Syne', sans-serif; font-size: 1.7rem; font-weight: 800; display: block; color: var(--black); line-height: 1; }
.stat-label { font-size: 0.72rem; color: var(--gray-4); margin-top: 3px; display: block; }
.main-wrap { position: relative; z-index: 2; background: var(--off-white); }
.main-content { max-width: 920px; margin: 0 auto; padding: 2.5rem 2rem 5rem; display: grid; grid-template-columns: 1fr 310px; gap: 2rem; align-items: start; }
.feed-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.feed-title { font-family: 'Syne', sans-serif; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: var(--gray-4); }
.feed-tabs { display: flex; gap: 3px; background: var(--gray-1); border-radius: 20px; padding: 3px; }
.feed-tab { font-size: 0.72rem; font-weight: 500; padding: 4px 12px; border-radius: 16px; border: none; background: none; color: var(--gray-5); cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
.feed-tab.active { background: #ffffff; color: var(--black); box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.flag-card { background: #ffffff; border: 1px solid var(--gray-2); border-radius: var(--radius); padding: 1rem 1.25rem; margin-bottom: 10px; display: flex; gap: 12px; align-items: flex-start; cursor: pointer; transition: all 0.15s; width: 100%; text-align: left; }
.flag-card:hover { border-color: var(--gray-3); box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-1px); }
.flag-card.red-card { border-left: 3px solid var(--red); }
.flag-card.green-card { border-left: 3px solid var(--green); }
.flag-icon-wrap { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
.flag-icon-wrap.red { background: var(--red-light); }
.flag-icon-wrap.green { background: var(--green-light); }
.flag-body { flex: 1; min-width: 0; }
.flag-top { display: flex; align-items: center; gap: 7px; margin-bottom: 5px; flex-wrap: wrap; }
.flag-handle { font-family: 'Syne', sans-serif; font-size: 0.88rem; font-weight: 700; color: var(--black); text-decoration: none; }
.flag-cat { font-size: 0.68rem; font-weight: 600; padding: 2px 8px; border-radius: 20px; }
.flag-cat.red { background: var(--red-light); color: var(--red); }
.flag-cat.green { background: var(--green-light); color: var(--green); }
.flag-anon { font-size: 0.67rem; color: var(--gray-4); background: var(--gray-1); border-radius: 20px; padding: 2px 8px; }
.flag-comment { font-size: 0.85rem; color: var(--gray-5); line-height: 1.5; margin-bottom: 6px; }
.flag-meta { display: flex; gap: 10px; font-size: 0.7rem; color: var(--gray-4); flex-wrap: wrap; }
.sidebar { display: flex; flex-direction: column; gap: 14px; }
.sidebar-card { background: #ffffff; border: 1px solid var(--gray-2); border-radius: var(--radius); padding: 1.1rem 1.25rem; }
.sidebar-title { font-family: 'Syne', sans-serif; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: var(--gray-4); margin-bottom: 0.85rem; }
.trending-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--gray-1); text-decoration: none; color: var(--black); transition: opacity 0.15s; cursor: pointer; width: 100%; text-align: left; background: transparent; }
.trending-item:last-child { border-bottom: none; padding-bottom: 0; }
.trending-item:first-child { padding-top: 0; }
.trending-item:hover { opacity: 0.65; }
.trending-rank { font-family: 'Syne', sans-serif; font-size: 0.7rem; font-weight: 700; color: var(--gray-3); width: 16px; flex-shrink: 0; }
.trending-handle { flex: 1; font-size: 0.83rem; font-weight: 500; }
.trending-flags { display: flex; gap: 5px; }
.t-flag { font-size: 0.67rem; font-weight: 600; padding: 2px 7px; border-radius: 20px; }
.t-flag.r { background: var(--red-light); color: var(--red); }
.t-flag.g { background: var(--green-light); color: var(--green); }
.how-step { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 12px; }
.how-step:last-child { margin-bottom: 0; }
.step-num { width: 22px; height: 22px; border-radius: 50%; background: var(--black); color: #fff; font-size: 0.65rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; font-family: 'Syne', sans-serif; }
.step-text { font-size: 0.8rem; color: var(--gray-5); line-height: 1.45; }
.step-text strong { color: var(--black); font-weight: 500; display: block; margin-bottom: 1px; }
.flagme-card { background: var(--black); border-radius: var(--radius); padding: 1.25rem; text-align: center; }
.flagme-title { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 800; color: #fff; margin-bottom: 5px; }
.flagme-sub { font-size: 0.75rem; color: rgba(255,255,255,0.5); margin-bottom: 1rem; line-height: 1.45; }
.flagme-btn { display: inline-flex; align-items: center; gap: 6px; background: #ffffff; color: var(--black); font-family: 'Syne', sans-serif; font-size: 0.8rem; font-weight: 700; padding: 8px 18px; border-radius: 30px; border: none; cursor: pointer; text-decoration: none; transition: opacity 0.15s; }
.flagme-btn:hover { opacity: 0.85; }
.footer { position: relative; z-index: 2; border-top: 1px solid var(--gray-2); padding: 1.5rem 2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; background: #ffffff; }
.footer-left { font-size: 0.75rem; color: var(--gray-4); }
.footer-links { display: flex; gap: 1.5rem; flex-wrap: wrap; }
.footer-link { font-size: 0.75rem; color: var(--gray-4); text-decoration: none; transition: color 0.15s; }
.footer-link:hover { color: var(--black); }
.grievance-link { font-size: 0.72rem; color: var(--red); font-weight: 500; border: 1px solid var(--red-mid); background: var(--red-light); padding: 4px 12px; border-radius: 20px; text-decoration: none; transition: all 0.15s; }
.grievance-link:hover { background: var(--red); color: #fff; }
.feed-note-strip { border-bottom: 1px solid var(--gray-2); background: var(--off-white); padding: 0.9rem 2rem; }
.feed-note-inner { max-width: 920px; margin: 0 auto; display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; }
.trust-pill { font-size: 0.74rem; font-weight: 500; padding: 6px 12px; border-radius: 20px; border: 1px solid var(--gray-2); background: white; color: var(--gray-5); }
@media (max-width: 700px) {
  .main-content { grid-template-columns: 1fr; }
  .sidebar { display: none; }
  .hero-title { font-size: 2.6rem; letter-spacing: -1px; }
  .home-nav { padding: 0 1.25rem; }
  .stats-strip { gap: 1.5rem; }
  .footer { flex-direction: column; align-items: flex-start; }
  .search-box { padding-left: 14px; }
  .search-btn { padding: 11px 18px; }
}
`;

const fallbackData = {
  auth: { isAuthenticated: false },
  slides: [
    { id: 1, imageUrl: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=1600&auto=format&fit=crop&q=80" },
    { id: 2, imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1600&auto=format&fit=crop&q=80" },
    { id: 3, imageUrl: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1600&auto=format&fit=crop&q=80" },
    { id: 4, imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1600&auto=format&fit=crop&q=80" },
  ],
  hero: {
    badge: "India's first community-powered handle intelligence platform",
    title: "Know the vibe before you invest.",
    subtitle: "Search any Instagram handle. See real community flags. Drop your own receipts. Anonymous or not — your call.",
  },
  reasons: ["👀 Going on a date", "💍 Shaadi", "🔥 Friends with Benefits", "🛍️ Buying from them", "💼 Work collab", "🤝 Just curious"],
  stats: { handlesSearched: 12847, redFlagsDropped: 4203, greenFlagsDropped: 8941 },
  trustPoints: ["See red and green flags", "Post anonymously or publicly", "View both sides when available"],
  recentFlags: [
    { id: 1, type: "red", handle: "rohanverma__", category: "Love bombing", anonymous: true, comment: "Came on incredibly strong the first two weeks. Texting all day, future planning, then completely disappeared. Classic pattern.", relation: "💔 Dated", timeframe: "📅 1–6 months ago", locationLabel: "📍 Mumbai", postedAtLabel: "2h ago" },
    { id: 2, type: "green", handle: "priyasingh.art", category: "Genuine & kind", anonymous: false, comment: "Bought a painting from her. Packed beautifully, delivered on time, responded to every message. 100% recommend her.", relation: "🛍️ Bought/sold", timeframe: "📅 This month", locationLabel: "📍 Delhi", postedAtLabel: "4h ago" },
    { id: 3, type: "red", handle: "aarav.k", category: "Ghosting", anonymous: true, comment: "After 3 months of talking daily, just stopped replying. No explanation, no closure. Left on read forever.", relation: "☕ Went on a date", timeframe: "📅 Over a year ago", locationLabel: "📍 Bangalore", postedAtLabel: "6h ago" },
    { id: 4, type: "green", handle: "mehak.designs", category: "Great communicator", anonymous: false, comment: "Worked with her on a freelance project. Always on time, extremely professional. Would hire again without hesitation.", relation: "💼 Work/business", timeframe: "📅 This month", locationLabel: "📍 Pune", postedAtLabel: "8h ago" },
    { id: 5, type: "red", handle: "the.samarth", category: "Fake / catfish", anonymous: true, comment: "Profile photos don't match the person at all. Met in person and it was a completely different individual. Wasted an evening.", relation: "☕ Went on a date", timeframe: "📅 This week", locationLabel: "📍 Mumbai", postedAtLabel: "12h ago" },
    { id: 6, type: "green", handle: "neel.photo", category: "Legit & honest", anonymous: false, comment: "Hired for event photography. Delivered everything on time, no hidden charges. Incredibly talented and honest person.", relation: "💼 Work/business", timeframe: "📅 Last month", locationLabel: "📍 Delhi", postedAtLabel: "1d ago" },
  ],
  trendingHandles: [
    { id: 1, handle: "rohanverma__", red: 14, green: 3 },
    { id: 2, handle: "aarav.k", red: 11, green: 7 },
    { id: 3, handle: "mehak.designs", red: 2, green: 19 },
    { id: 4, handle: "the.samarth", red: 9, green: 1 },
    { id: 5, handle: "priyasingh.art", red: 0, green: 22 },
  ],
  howItWorks: [
    { id: 1, title: "Search any handle", text: "Choose why you're looking them up — date, shaadi, FWB, work or just curious." },
    { id: 2, title: "See community receipts", text: "Real flags weighted by how well people actually knew them." },
    { id: 3, title: "Drop your own flag", text: "Post anonymously or with your handle. Your choice, always." },
  ],
  flagMe: { title: "Flag me up 🚩🟢", subtitle: "Share your handle. Let the community check your vibe. Brave souls only.", ctaLabel: "Generate my card →" },
};

function mapHomePayload(payload) {
  return {
    ...fallbackData,
    ...payload,
    auth: { ...fallbackData.auth, ...(payload.auth || {}) },
    hero: { ...fallbackData.hero, ...(payload.hero || {}) },
    stats: { ...fallbackData.stats, ...(payload.stats || {}) },
    flagMe: { ...fallbackData.flagMe, ...(payload.flagMe || {}) },
    slides: payload.slides?.length ? payload.slides : fallbackData.slides,
    reasons: payload.reasons?.length ? payload.reasons : fallbackData.reasons,
    trustPoints: payload.trustPoints?.length ? payload.trustPoints : fallbackData.trustPoints,
    recentFlags: payload.recentFlags?.length ? payload.recentFlags : fallbackData.recentFlags,
    trendingHandles: payload.trendingHandles?.length ? payload.trendingHandles : fallbackData.trendingHandles,
    howItWorks: payload.howItWorks?.length ? payload.howItWorks : fallbackData.howItWorks,
  };
}

export default function HomePage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const rotateTimerRef = useRef(null);
  const suggestTimerRef = useRef(null);

  // Initialize auth state on mount
useEffect(() => {
  const checkAuth = () => {
    const token = localStorage.getItem("clocked_token");
    const user = localStorage.getItem("clocked_user");

    if (token && user) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(user));
    } else {
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  };

  checkAuth();

  window.addEventListener("storage", checkAuth);
  return () => window.removeEventListener("storage", checkAuth);
}, []);

  const [homeData, setHomeData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState(fallbackData.reasons[0]);
  const [feedFilter, setFeedFilter] = useState("all");
  const [feedItems, setFeedItems] = useState(fallbackData.recentFlags);

  useEffect(() => {
    let ignore = false;
    async function loadHome() {
      setLoading(true);
      setError("");
      try {
        const payload = await apiFetch("/home");
        if (ignore) return;
        const mapped = mapHomePayload(payload || {});
        setHomeData(mapped);
        setFeedItems(mapped.recentFlags);
        setSelectedReason(mapped.reasons[0] || fallbackData.reasons[0]);
      } catch (err) {
        if (!ignore) {
          setHomeData(fallbackData);
          setFeedItems(fallbackData.recentFlags);
          setSelectedReason(fallbackData.reasons[0]);
          setError(err.message || "Failed to load homepage.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadHome();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!homeData.slides.length) return undefined;
    rotateTimerRef.current = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % homeData.slides.length);
    }, 6000);
    return () => {
      if (rotateTimerRef.current) window.clearInterval(rotateTimerRef.current);
    };
  }, [homeData.slides.length]);

  useEffect(() => {
    const normalized = searchInput.trim().replace(/^@/, "");
    if (!normalized) {
      setSearchSuggestions([]);
      setSuggestionsLoading(false);
      return undefined;
    }
    suggestTimerRef.current = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const payload = await apiFetch(`/search/suggestions?q=${encodeURIComponent(normalized)}`);
        setSearchSuggestions(payload?.items || []);
      } catch {
        const fallback = homeData.trendingHandles
          .filter((item) => item.handle.toLowerCase().includes(normalized.toLowerCase()))
          .slice(0, 5)
          .map((item) => ({
            id: item.id,
            handle: item.handle,
            red: item.red,
            green: item.green,
            score: Math.round((item.green / Math.max(item.green + item.red, 1)) * 100),
            color: item.green > item.red ? "#1A9E5F" : "#E2353A",
          }));
        setSearchSuggestions(fallback);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 150);
    return () => {
      if (suggestTimerRef.current) window.clearTimeout(suggestTimerRef.current);
    };
  }, [searchInput, homeData.trendingHandles]);

  useEffect(() => {
    const nextFeed = homeData.recentFlags.filter((item) => feedFilter === "all" || item.type === feedFilter);
    setFeedItems(nextFeed);
  }, [feedFilter, homeData.recentFlags]);

  const navPrimaryAction = isAuthenticated ? { label: "Dashboard", to: "/dashboard" } : { label: "Sign up", to: "/signup" };
  const navSecondaryAction = isAuthenticated ? { label: "Logout", to: "#" } : { label: "Log in", to: "/login" };
  const showSuggestions = searchFocused && (suggestionsLoading || searchSuggestions.length > 0);

  function submitSearch(handleOverride) {
    const handle = (handleOverride || searchInput).trim().replace(/^@/, "");
    if (!handle) return;
    navigate(`/search?handle=${encodeURIComponent(handle)}&reason=${encodeURIComponent(selectedReason)}`);
  }

  function selectSuggestion(item) {
    setSearchInput(item.handle);
    setSearchSuggestions([]);
    submitSearch(item.handle);
  }

  function handleLogout() {
    localStorage.removeItem("clocked_token");
    localStorage.removeItem("clocked_user");
    setIsAuthenticated(false);
    setCurrentUser(null);
    navigate("/login");
  }

  if (loading) {
    return (
      <div className="homepage-shell">
        <style>{pageCss}</style>
        <div style={{ padding: "2rem" }}>Loading homepage...</div>
      </div>
    );
  }

  return (
    <div className="homepage-shell">
      <style>{pageCss}</style>

      <div className="hero-slider">
        {homeData.slides.map((slide, index) => (
          <div key={slide.id || index} className={`slide ${index === activeSlide ? "active" : ""}`} style={{ backgroundImage: `url('${slide.imageUrl}')` }}>
            <div className="slide-overlay"></div>
          </div>
        ))}
        <div className="slider-dots">
          {homeData.slides.map((slide, index) => (
            <button key={slide.id || index} className={`slider-dot ${index === activeSlide ? "active" : ""}`} onClick={() => setActiveSlide(index)}></button>
          ))}
        </div>
      </div>

      <nav className="home-nav">
        <Link to="/" className="nav-logo">
          <div className="logo-flags">
            <div className="flag-shape flag-r"></div>
            <div className="flag-shape flag-g"></div>
          </div>
          Clocked
        </Link>
        <div className="nav-right">
          {isAuthenticated ? (
            <>
              {/* <Link to="/vibe-card/me" className="btn-ghost">My Card</Link> */}
              <button onClick={handleLogout} className="btn-ghost">{navSecondaryAction.label}</button>
              <Link to={navPrimaryAction.to} className="btn-solid">{navPrimaryAction.label}</Link>
            </>
          ) : (
            <>
              {/* <Link to="/admin/login" className="btn-admin">Admin</Link> */}
              <Link to="/login" className="btn-ghost">{navSecondaryAction.label}</Link>
              <Link to={navPrimaryAction.to} className="btn-solid">{navPrimaryAction.label}</Link>
            </>
          )}
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          {homeData.hero.badge}
        </div>

        <h1 className="hero-title">
          Know the vibe<br/>before you <span className="accent-red">invest</span>.
        </h1>

        <p className="hero-sub">{homeData.hero.subtitle}</p>

        <div className="search-wrap">
          <div style={{ position: "relative" }}>
            <div className="search-box">
              <span className="search-at">@</span>
              <input
                type="text"
                className="search-input"
                placeholder="search any instagram handle..."
                autoComplete="off"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                onKeyDown={(e) => e.key === "Enter" && submitSearch()}
              />
              <button className="search-btn" onClick={() => submitSearch()}>Check vibe →</button>
            </div>

            <div className={`search-dropdown ${showSuggestions ? "show" : ""}`}>
              {suggestionsLoading ? (
                <div style={{ padding: "10px 16px", fontSize: "0.88rem", color: "var(--gray-5)" }}>Loading suggestions...</div>
              ) : (
                searchSuggestions.map((h) => {
                  const score = h.score ?? Math.round((h.green || 0) / Math.max((h.green || 0) + (h.red || 0), 1) * 100);
                  const good = score > 55;
                  return (
                    <button key={h.id || h.handle} className="drop-item" onMouseDown={() => selectSuggestion(h)}>
                      <div className="drop-avatar" style={{ background: h.color || (good ? "#1A9E5F" : "#E2353A") }}>{String(h.handle || "@")[0].toUpperCase()}</div>
                      <div className="drop-info">
                        <div className="drop-handle">@{h.handle}</div>
                        <div className="drop-score">{h.red || 0} red · {h.green || 0} green flags</div>
                      </div>
                      <span className="drop-badge" style={{ background: good ? "#F0FFF8" : "#FFF0F0", color: good ? "#1A9E5F" : "#E2353A" }}>
                        {score}% green
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
          <p className="search-hint">Try <code>rohanverma</code> or <code>priyasingh</code> to see how it works</p>
        </div>

        <div className="why-row">
          <span className="why-label">Searching because:</span>
          {homeData.reasons.map((reason) => (
            <button key={reason} className={`why-pill ${selectedReason === reason ? "active" : ""}`} onClick={() => setSelectedReason(reason)}>
              {reason}
            </button>
          ))}
        </div>
      </section>

      <div className="main-wrap">
        {error ? <div style={{ background: "#fff0f0", color: "#E2353A", padding: "10px 16px", textAlign: "center", borderBottom: "1px solid #FFBDBE" }}>{error}</div> : null}

        <div className="stats-strip">
          <div className="stat-item">
            <span className="stat-num">{new Intl.NumberFormat("en-IN").format(homeData.stats.handlesSearched || 0)}</span>
            <span className="stat-label">handles searched</span>
          </div>
          <div className="stat-item">
            <span className="stat-num" style={{ color: "var(--red)" }}>{new Intl.NumberFormat("en-IN").format(homeData.stats.redFlagsDropped || 0)}</span>
            <span className="stat-label">red flags dropped</span>
          </div>
          <div className="stat-item">
            <span className="stat-num" style={{ color: "var(--green)" }}>{new Intl.NumberFormat("en-IN").format(homeData.stats.greenFlagsDropped || 0)}</span>
            <span className="stat-label">green flags dropped</span>
          </div>
        </div>

        <div className="feed-note-strip">
          <div className="feed-note-inner">
            {homeData.trustPoints.map((point) => <span key={point} className="trust-pill">{point}</span>)}
            <span className="trust-pill" style={{ background: "#FFFBEB", borderColor: "#FDE68A", color: "#B45309" }}>Start instantly · 5 unverified posts · unlimited after verification</span>
          </div>
        </div>

        <div className="main-content">
          <div>
            <div className="feed-header">
              <span className="feed-title">Recent flags</span>
              <div className="feed-tabs">
                <button className={`feed-tab ${feedFilter === "all" ? "active" : ""}`} onClick={() => setFeedFilter("all")}>All</button>
                <button className={`feed-tab ${feedFilter === "red" ? "active" : ""}`} onClick={() => setFeedFilter("red")}>🚩 Red</button>
                <button className={`feed-tab ${feedFilter === "green" ? "active" : ""}`} onClick={() => setFeedFilter("green")}>🟢 Green</button>
              </div>
            </div>

            {feedItems.map((item) => (
              <button key={item.id} className={`flag-card ${item.type === "red" ? "red-card" : "green-card"}`} onClick={() => navigate(`/search?handle=${encodeURIComponent(item.handle)}`)}>
                <div className={`flag-icon-wrap ${item.type === "red" ? "red" : "green"}`}>{item.type === "red" ? "🚩" : "🟢"}</div>
                <div className="flag-body">
                  <div className="flag-top">
                    <span className="flag-handle">@{item.handle}</span>
                    <span className={`flag-cat ${item.type === "red" ? "red" : "green"}`}>{item.category}</span>
                    {item.anonymous ? <span className="flag-anon">🎭 anonymous</span> : null}
                  </div>
                  <p className="flag-comment">{item.comment}</p>
                  <div className="flag-meta">
                    <span>{item.relation}</span>
                    <span>{item.timeframe}</span>
                    <span>{item.locationLabel}</span>
                    <span>{item.postedAtLabel}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <aside className="sidebar">
            <div className="sidebar-card">
              <p className="sidebar-title">🔥 Trending this week</p>
              {homeData.trendingHandles.map((item, index) => (
                <button key={item.id || item.handle} className="trending-item" onClick={() => navigate(`/search?handle=${encodeURIComponent(item.handle)}`)}>
                  <span className="trending-rank">{index + 1}</span>
                  <span className="trending-handle">@{item.handle}</span>
                  <div className="trending-flags"><span className="t-flag r">🚩 {item.red}</span><span className="t-flag g">🟢 {item.green}</span></div>
                </button>
              ))}
            </div>

            <div className="sidebar-card">
              <p className="sidebar-title">How it works</p>
              {homeData.howItWorks.map((item) => (
                <div key={item.id} className="how-step">
                  <div className="step-num">{item.id}</div>
                  <div className="step-text"><strong>{item.title}</strong>{item.text}</div>
                </div>
              ))}
            </div>

            <div className="flagme-card">
              <p className="flagme-title">{homeData.flagMe.title}</p>
              <p className="flagme-sub">{homeData.flagMe.subtitle}</p>
              <Link to="/vibe-card/me" className="flagme-btn">{homeData.flagMe.ctaLabel}</Link>
            </div>
          </aside>
        </div>
      </div>

      <footer className="footer">
        <span className="footer-left">© 2025 Clocked. Community-powered receipts.</span>
        <div className="footer-links">
          <Link to="/terms" className="footer-link">Terms</Link>
          <Link to="/privacy" className="footer-link">Privacy</Link>
          <Link to="/guidelines" className="footer-link">Guidelines</Link>
          <Link to="/grievance" className="grievance-link">🛡️ Report / Takedown</Link>
        </div>
      </footer>
    </div>
  );
}
