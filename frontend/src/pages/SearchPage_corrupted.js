"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from '../contexts/AuthContext';

const SEARCH_REASONS_FALLBACK = [
  { key: "date", label: "Going on a date", icon: "👀" },
  { key: "shaadi", label: "Shaadi", icon: "💍" },
  { key: "fwb", label: "Friends with Benefits", icon: "🔥" },
  { key: "buying", label: "Buying from them", icon: "🛍️" },
  { key: "work", label: "Work collab", icon: "💼" },
  { key: "curious", label: "Just curious", icon: "🤝" },
];

const RELATIONSHIPS_FALLBACK = [
  { key: "dated", label: "Dated", icon: "💔", weight: 5 },
  { key: "date", label: "Went on a date", icon: "☕", weight: 4 },
  { key: "online", label: "Followed online", icon: "📱", weight: 2 },
  { key: "met", label: "Met in person", icon: "🤝", weight: 3 },
  { key: "college", label: "College / school", icon: "🏫", weight: 4 },
  { key: "work", label: "Work / business", icon: "💼", weight: 3 },
  { key: "bought", label: "Bought / sold", icon: "🛍️", weight: 3 },
  { key: "heard", label: "Heard through people", icon: "👂", weight: 1 },
];

const TIMEFRAMES_FALLBACK = [
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "months", label: "1–6 months ago" },
  { key: "year", label: "Over a year ago" },
];

const CONTENT_FALLBACK = {
  search_why_prefix: "You searched because:",
  search_why_change: "change",
  watch_handle: "👁 Watch handle",
  watching_handle: "👁 Watching",
  red_flag_cta: "🚩 Red flag",
  green_flag_cta: "🟢 Green flag",
  vibe_score_label: "Vibe score",
  proceed_caution: "Proceed with caution 🚩",
  looking_good: "Looking good 🟢",
  mixed_signals: "Mixed signals 🟡",
  weighted_subtitle: "Weighted by relationship depth.",
  pattern_detected_title: "Community pattern detected",
  pattern_detected_body: "A recurring category has been independently flagged multiple times.",
  searched_this_week: "people searched this handle this week",
  all_flags_tab: "All flags",
  red_flags_tab: "🚩 Red",
  green_flags_tab: "🟢 Green",
  both_sides_tab: "⚖️ Both sides",
  me_profile_tab: "👤 Me profile",
  drop_red_flag: "🚩 Drop a red flag",
  drop_green_flag: "🟢 Drop a green flag",
  how_do_you_know_them: "How do you know them?",
  when_was_this: "When was this?",
  select_category: "Select a category...",
  optional_comment_placeholder: "Share your experience... what happened? (optional, max 300 chars)",
  post_anonymously: "Post anonymously",
  cancel: "Cancel",
  post_red_flag: "Post red flag →",
  post_green_flag: "Post green flag →",
  flag_disclaimer: "⚖️ By posting you confirm this is your genuine personal experience and you take full legal responsibility for this content.",
  add_reply: "+ Add your reply to this flag",
  add_reply_once: "+ Add your reply to this flag (you get one)",
  your_reply: "Your reply",
  their_reply: "Their reply",
  add_perspective_btn: "Add your perspective",
  their_perspective_title: "⚖️ Their perspective",
  self_submitted: "Self submitted",
  me_profile_title: "👤 says",
  self_aware: "Self aware",
  share_card_btn: "🎴 Share this handle's card",
  report_handle: "🛡️ Report this handle",
  people_also_searched: "👀 People also searched",
  flag_requests_title: "🙋 Flag requests",
  post_flag_request: "+ Post a flag request",
  claim_profile_title: "🔔 Is this your handle?",
  claim_profile_body: "Sign up to see who searched you, add your perspective, and post one reply to each flag.",
  claim_profile_cta: "Claim your profile →",
  no_flags_title: "No flags yet",
  no_flags_sub: "Nobody has posted for this handle yet.",
};

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

function timeAgo(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  const units = [
    [31536000, "y"],
    [2592000, "mo"],
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
    [1, "s"],
  ];
  for (const [size, label] of units) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`;
  }
  return "Just now";
}

function getInitial(handle) {
  return (handle || "?").replace(/^@/, "").charAt(0).toUpperCase() || "?";
}

function getTone(score) {
  if (score == null) return "neutral";
  if (score >= 70) return "green";
  if (score >= 40) return "amber";
  return "red";
}

function apiGetQueryParam(name) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) || "";
}

async function apiRequest(url, options = {}) {
  // Use the backend API base URL
  const apiUrl = `http://localhost:5004${url}`;
  
  const response = await fetch(apiUrl, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
    ...options,
  });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    throw new Error(typeof data === "object" && data?.message ? data.message : "Request failed");
  }
  return data;
}

export default function ClockedSearchDynamicFull() {
  const { isAuthenticated, user } = useAuth();
  console.log('SearchPage rendering, isAuthenticated:', isAuthenticated, 'user:', user);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [handleInput, setHandleInput] = useState("");
  const [searchedReason, setSearchedReason] = useState(apiGetQueryParam("reason") || "date");
  const [currentTab, setCurrentTab] = useState("all");
  const [watching, setWatching] = useState(false);
  const [openFlagType, setOpenFlagType] = useState("");
  const [shareToast, setShareToast] = useState("");

  const [searchData, setSearchData] = useState({
    handle: null,
    stats: null,
    flags: [],
    perspective: null,
    me_profile: null,
    related_handles: [],
    requests: [],
    can_claim: false,
    search_breakdown: [],
  });

  const [flagForm, setFlagForm] = useState({
    relationship: "",
    timeframe: "",
    category_id: "",
    comment: "",
    anonymous: true,
  });

  const [replyDrafts, setReplyDrafts] = useState({});
  const [openReplyFor, setOpenReplyFor] = useState(null);
  const [submittingFlag, setSubmittingFlag] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  const handleKey = useMemo(() => apiGetQueryParam("handle") || "rohanverma__", []);

  useEffect(() => {
    let ignore = false;

    async function loadAll() {
      setLoading(true);
      setError("");
      try {
        const [metaRes, searchRes] = await Promise.all([
          apiRequest("/api/meta"),
          apiRequest(`/api/search/${encodeURIComponent(handleKey)}?reason=${encodeURIComponent(searchedReason)}`),
        ]);
        if (ignore) return;
        setMeta(metaRes);
        setSearchData({
          handle: searchRes.handle || null,
          stats: searchRes.stats || searchRes.handle?.stats || null,
          flags: searchRes.flags || [],
          perspective: searchRes.perspective || null,
          me_profile: searchRes.me_profile || null,
          related_handles: searchRes.related_handles || [],
          requests: searchRes.requests || [],
          can_claim: Boolean(searchRes.can_claim),
          search_breakdown: searchRes.search_breakdown || [],
        });
        setWatching(Boolean(searchRes.is_watching));
        setHandleInput(searchRes.handle?.instagram_handle || handleKey);
      } catch (err) {
        if (!ignore) setError(err.message || "Could not load search page.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadAll();
    return () => {
      ignore = true;
    };
  }, [handleKey, searchedReason]);

  useEffect(() => {
    if (!shareToast) return;
    const timer = setTimeout(() => setShareToast(""), 2400);
    return () => clearTimeout(timer);
  }, [shareToast]);

  const items = meta?.items || {};
  const searchReasons = items.search_reasons || SEARCH_REASONS_FALLBACK;
  const relationshipTypes = items.relationship_types || RELATIONSHIPS_FALLBACK;
  const timeframes = items.timeframes || TIMEFRAMES_FALLBACK;
  const flagCategories = useMemo(() => {
    const red = items.flag_categories_red || [];
    const green = items.flag_categories_green || [];
    return { red, green };
  }, [items]);

  const contentBlocks = useMemo(() => {
    const blocks = {};
    (meta?.content || []).forEach((block) => {
      blocks[block.block_key] = block.content;
    });
    return { ...CONTENT_FALLBACK, ...blocks };
  }, [meta]);

  const handleData = searchData.handle;
  const stats = searchData.stats || handleData?.stats || {};
  const vibeScore = stats?.vibe_score ?? null;
  const redCount = stats?.red_flag_count || 0;
  const greenCount = stats?.green_flag_count || 0;
  const totalFlags = stats?.total_flag_count || searchData.flags.length || 0;
  const tone = getTone(vibeScore);

  const displayedFlags = useMemo(() => {
    if (currentTab === "red") return searchData.flags.filter((flag) => flag.flag_type === "red");
    if (currentTab === "green") return searchData.flags.filter((flag) => flag.flag_type === "green");
    return searchData.flags;
  }, [searchData.flags, currentTab]);

  const patternCategory = useMemo(() => {
    const counts = {};
    searchData.flags.filter((flag) => flag.flag_type === "red").forEach((flag) => {
      const key = flag.category_name || flag.category_id;
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top && top[1] >= 3 ? { category: top[0], count: top[1] } : null;
  }, [searchData.flags]);

  const searchReasonLabel = useMemo(() => {
    const found = searchReasons.find((item) => item.key === searchedReason);
    return found ? `${found.icon || ""} ${found.label}`.trim() : searchedReason;
  }, [searchReasons, searchedReason]);

  const breakdownChips = (searchData.search_breakdown || []).map((entry) => {
    const found = searchReasons.find((item) => item.key === entry.reason);
    const label = found?.label || entry.reason;
    const icon = found?.icon || "";
    return `${icon} ${label} × ${entry.count}`.trim();
  });

  const toggleWatch = async () => {
    if (!handleData?._id) return;
    const previous = watching;
    setWatching(!watching);
    try {
      if (previous) {
        await apiRequest(`/api/watches/handle/${handleData._id}`, { method: "DELETE" });
      } else {
        await apiRequest("/api/watches", {
          method: "POST",
          body: JSON.stringify({ handle_id: handleData._id }),
        });
      }
    } catch (err) {
      setWatching(previous);
      setError(err.message || "Could not update watch state.");
    }
  };

  const submitFlag = async () => {
    if (!handleData?._id || !openFlagType) return;
    if (!flagForm.relationship || !flagForm.timeframe || !flagForm.category_id) {
      setError("Please select relationship, timeframe, and category.");
      return;
    }
    setSubmittingFlag(true);
    setError("");
    try {
      const payload = {
        handle_id: handleData._id,
        flag_type: openFlagType,
        relationship: flagForm.relationship,
        timeframe: flagForm.timeframe,
        category_id: flagForm.category_id,
        comment: flagForm.comment.trim() || null,
        identity: flagForm.anonymous ? "anonymous" : "named",
        disclaimers: { one: true, two: true, three: true },
      };
      const res = await apiRequest("/api/flags", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSearchData((current) => ({
        ...current,
        flags: [res.flag, ...current.flags],
        stats: res.stats || current.stats,
      }));
      setOpenFlagType("");
      setFlagForm({ relationship: "", timeframe: "", category_id: "", comment: "", anonymous: true });
      setShareToast("Flag posted successfully.");
    } catch (err) {
      setError(err.message || "Could not post flag.");
    } finally {
      setSubmittingFlag(false);
    }
  };

  const submitReply = async (flagId) => {
    const content = (replyDrafts[flagId] || "").trim();
    if (!content) return;
    setSubmittingReply(true);
    setError("");
    try {
      const res = await apiRequest("/api/flag-replies", {
        method: "POST",
        body: JSON.stringify({
          flag_id: flagId,
          content,
          reply_type: "poster_reply",
        }),
      });
      setSearchData((current) => ({
        ...current,
        flags: current.flags.map((flag) =>
          flag._id === flagId ? { ...flag, reply: res.reply } : flag
        ),
      }));
      setReplyDrafts((current) => ({ ...current, [flagId]: "" }));
      setOpenReplyFor(null);
    } catch (err) {
      setError(err.message || "Could not post reply.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const toggleKnow = async (flag) => {
    const alreadyKnown = Boolean(flag.viewer_knows);
    setSearchData((current) => ({
      ...current,
      flags: current.flags.map((item) =>
        item._id === flag._id
          ? {
              ...item,
              viewer_knows: !alreadyKnown,
              know_count: Math.max(0, (item.know_count || 0) + (alreadyKnown ? -1 : 1)),
            }
          : item
      ),
    }));

    try {
      if (alreadyKnown) {
        await apiRequest(`/api/know-counts/flag/${flag._id}`, { method: "DELETE" });
      } else {
        await apiRequest("/api/know-counts", {
          method: "POST",
          body: JSON.stringify({ flag_id: flag._id, handle_id: handleData?._id }),
        });
      }
    } catch (err) {
      setError(err.message || "Could not update know state.");
    }
  };

  const shareThing = async (text) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Clocked", text, url: window.location.href });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
      }
      setShareToast("Copied / shared successfully.");
    } catch {
      setShareToast("Share cancelled.");
    }
  };

  const doNavSearch = () => {
    const clean = handleInput.replace(/^@/, "").trim();
    if (!clean) return;
    window.location.href = `/search?handle=${encodeURIComponent(clean)}&reason=${encodeURIComponent(searchedReason)}`;
  };

  return (
    <div className="page-shell">
      <style>{styles}</style>
      {loading && <div>Loading search page...</div>}
      {!loading && (
        <>
          <nav>
        <a href="/" className="nav-logo">
          <div className="logo-flags">
            <div className="flag-shape flag-r" />
            <div className="flag-shape flag-g" />
          </div>
          Clocked
        </a>
        <div className="nav-search">
          <span className="nav-at">@</span>
          <input
            className="nav-search-input"
            type="text"
            placeholder="search another handle..."
            value={handleInput}
            onChange={(e) => setHandleInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doNavSearch()}
          />
          <button className="nav-search-btn" onClick={doNavSearch}>Search</button>
        </div>
        <div className="nav-right">
          {isAuthenticated ? (
            <>
              <a href="/dashboard" className="btn-ghost">Dashboard</a>
              <a href="/admin" className="btn-solid">Admin</a>
            </>
          ) : (
            <>
              <a href="/login" className="btn-ghost">Log in</a>
              <a href="/signup" className="btn-solid">Sign up</a>
            </>
          )}
        </div>
      </nav>

      <div className="why-banner">
        <span>{contentBlocks.search_why_prefix}</span>
        <span className="why-chip">{searchReasonLabel}</span>
        <button
          type="button"
          className="why-change"
          onClick={() => {
            const idx = searchReasons.findIndex((item) => item.key === searchedReason);
            const next = searchReasons[(idx + 1) % searchReasons.length];
            setSearchedReason(next?.key || "date");
          }}
        >
          {contentBlocks.search_why_change}
        </button>
      </div>

      <div className="page">
        <div className="main-col">
          {error ? <div className="error-banner">{error}</div> : null}

          {loading ? (
            <div className="profile-card">Loading…</div>
          ) : (
            <>
              <div className="profile-card">
                <div className="profile-top">
                  <div className="profile-avatar" style={{ background: "linear-gradient(135deg,#E2353A,#FF8A65)" }}>{getInitial(handleData?.instagram_handle)}</div>
                  <div className="profile-info">
                    <div className="profile-handle">@{handleData?.instagram_handle || handleKey}</div>
                    <div className="profile-meta">
                      {handleData?.city ? <span>📍 {handleData.city}</span> : null}
                      <span>🔍 {stats?.search_count || 0} searches total</span>
                      {handleData?.created_at ? <span>📅 First seen {timeAgo(handleData.created_at)}</span> : null}
                    </div>
                    <div className="profile-actions">
                      <button className={cx("action-btn", watching && "watching")} onClick={toggleWatch}>
                        {watching ? contentBlocks.watching_handle : contentBlocks.watch_handle}
                      </button>
                      <button className="action-btn flag-red" onClick={() => setOpenFlagType("red")}>{contentBlocks.red_flag_cta}</button>
                      <button className="action-btn flag-green" onClick={() => setOpenFlagType("green")}>{contentBlocks.green_flag_cta}</button>
                    </div>
                  </div>
                </div>

                <div className="vibe-row">
                  <div className="score-ring-wrap">
                    <div className="score-ring" style={{ background: `conic-gradient(var(--green) 0% ${Math.max(0, Math.min(100, Number(vibeScore || 0)))}%, var(--red) ${Math.max(0, Math.min(100, Number(vibeScore || 0)))}% 100%)` }}>
                      <div className="score-inner">
                        <span className="score-num" style={{ color: tone === "green" ? "var(--green)" : tone === "amber" ? "#F59E0B" : "var(--red)" }}>
                          {vibeScore == null ? "--" : `${Math.round(vibeScore)}%`}
                        </span>
                        <span className="score-pct">green</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="score-label">{contentBlocks.vibe_score_label}</div>
                    <div className="score-verdict" style={{ color: tone === "green" ? "var(--green)" : tone === "amber" ? "#B45309" : "var(--red)" }}>
                      {tone === "green" ? contentBlocks.looking_good : tone === "amber" ? contentBlocks.mixed_signals : contentBlocks.proceed_caution}
                    </div>
                    <div className="score-sub">{totalFlags} flags from people who've interacted with this handle. {contentBlocks.weighted_subtitle}</div>
                  </div>
                  <div className="flag-counts">
                    <div className="flag-count-item">
                      <span className="flag-count-label" style={{ color: "var(--red)" }}>🚩 Red</span>
                      <div className="flag-count-bar-wrap"><div className="flag-count-bar red" style={{ width: `${totalFlags ? (redCount / totalFlags) * 100 : 0}%` }} /></div>
                      <span className="flag-count-num" style={{ color: "var(--red)" }}>{redCount}</span>
                    </div>
                    <div className="flag-count-item">
                      <span className="flag-count-label" style={{ color: "var(--green)" }}>🟢 Green</span>
                      <div className="flag-count-bar-wrap"><div className="flag-count-bar green" style={{ width: `${totalFlags ? (greenCount / totalFlags) * 100 : 0}%` }} /></div>
                      <span className="flag-count-num" style={{ color: "var(--green)" }}>{greenCount}</span>
                    </div>
                  </div>
                </div>

                {patternCategory ? (
                  <div className="pattern-alert">
                    <span className="pattern-icon">⚠️</span>
                    <div className="pattern-text">
                      <strong>{contentBlocks.pattern_detected_title}</strong>
                      {patternCategory.count} independent accounts have flagged "{patternCategory.category}".
                    </div>
                  </div>
                ) : null}

                <div className="searched-card">
                  <span className="searched-icon">👀</span>
                  <div className="searched-text">
                    <strong>{stats?.search_count || 0} {contentBlocks.searched_this_week}</strong>
                    {breakdownChips.length ? (
                      <div className="searched-strip" style={{ marginTop: 6 }}>
                        {breakdownChips.map((chip) => <span key={chip} className="searched-chip">{chip}</span>)}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className={cx("flag-submit-inline", openFlagType && "open")}>
                <div className="fsi-title">{openFlagType === "red" ? contentBlocks.drop_red_flag : contentBlocks.drop_green_flag}</div>
                <div className="fsi-row">
                  <select className="fsi-select" value={flagForm.relationship} onChange={(e) => setFlagForm((s) => ({ ...s, relationship: e.target.value }))}>
                    <option value="">{contentBlocks.how_do_you_know_them}</option>
                    {relationshipTypes.map((item) => <option key={item.key} value={item.key}>{item.icon ? `${item.icon} ` : ""}{item.label}</option>)}
                  </select>
                  <select className="fsi-select" value={flagForm.timeframe} onChange={(e) => setFlagForm((s) => ({ ...s, timeframe: e.target.value }))}>
                    <option value="">{contentBlocks.when_was_this}</option>
                    {timeframes.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                  </select>
                </div>
                <select className="fsi-select" style={{ width: "100%", marginBottom: 10 }} value={flagForm.category_id} onChange={(e) => setFlagForm((s) => ({ ...s, category_id: e.target.value }))}>
                  <option value="">{contentBlocks.select_category}</option>
                  {openFlagType === "red" ? (
                    <optgroup label="🚩 Red flag categories">
                      {flagCategories.red.map((item) => <option key={item._id || item.key} value={item._id || item.key}>{item.label}</option>)}
                    </optgroup>
                  ) : (
                    <optgroup label="🟢 Green flag categories">
                      {flagCategories.green.map((item) => <option key={item._id || item.key} value={item._id || item.key}>{item.label}</option>)}
                    </optgroup>
                  )}
                </select>
                <textarea className="fsi-textarea" placeholder={contentBlocks.optional_comment_placeholder} value={flagForm.comment} onChange={(e) => setFlagForm((s) => ({ ...s, comment: e.target.value }))} maxLength={300} />
                <div className="fsi-bottom">
                  <label className="fsi-anon-toggle">
                    <input type="checkbox" checked={flagForm.anonymous} onChange={(e) => setFlagForm((s) => ({ ...s, anonymous: e.target.checked }))} />
                    {contentBlocks.post_anonymously}
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="secondary-mini" onClick={() => setOpenFlagType("")}>{contentBlocks.cancel}</button>
                    <button className={cx("fsi-submit", openFlagType)} onClick={submitFlag} disabled={submittingFlag}>
                      {submittingFlag ? "Posting..." : openFlagType === "red" ? contentBlocks.post_red_flag : contentBlocks.post_green_flag}
                    </button>
                  </div>
                </div>
                <div className="fsi-disclaimer">{contentBlocks.flag_disclaimer}</div>
              </div>

              <div className="tabs-row">
                <button className={cx("tab-btn", currentTab === "all" && "active")} onClick={() => setCurrentTab("all")}>{contentBlocks.all_flags_tab} ({totalFlags})</button>
                <button className={cx("tab-btn", currentTab === "red" && "active")} onClick={() => setCurrentTab("red")}>{contentBlocks.red_flags_tab} ({redCount})</button>
                <button className={cx("tab-btn", currentTab === "green" && "active")} onClick={() => setCurrentTab("green")}>{contentBlocks.green_flags_tab} ({greenCount})</button>
                <button className={cx("tab-btn", currentTab === "perspective" && "active")} onClick={() => setCurrentTab("perspective")}>{contentBlocks.both_sides_tab}</button>
                <button className={cx("tab-btn", currentTab === "me" && "active")} onClick={() => setCurrentTab("me")}>{contentBlocks.me_profile_tab}</button>
              </div>

              {currentTab === "perspective" ? (
                <div className="both-sides-card">
                  <div className="both-sides-title">{contentBlocks.their_perspective_title} <span className="me-badge" style={{ background: "var(--black)" }}>{contentBlocks.self_submitted}</span></div>
                  <div className="both-sides-sub">Read this along with community flags to form your own view.</div>
                  {searchData.perspective?.content ? (
                    <>
                      <div className="their-perspective">{searchData.perspective.content}</div>
                      <div className="their-perspective-meta">Submitted {timeAgo(searchData.perspective.created_at)}</div>
                    </>
                  ) : (
                    <button className="add-perspective-btn">{contentBlocks.add_perspective_btn}</button>
                  )}
                </div>
              ) : null}

              {currentTab === "me" ? (
                <div className="me-profile-card">
                  <div className="me-title">👤 @{handleData?.instagram_handle} {contentBlocks.me_profile_title} <span className="me-badge">{contentBlocks.self_aware}</span></div>
                  <div className="me-item">
                    <div className="me-label">What people often misunderstand about me</div>
                    <div className="me-value">{searchData.me_profile?.me_misunderstood || handleData?.me_misunderstood || "Not added yet."}</div>
                  </div>
                  <div className="me-item">
                    <div className="me-label">What I genuinely pride myself on</div>
                    <div className="me-value">{searchData.me_profile?.me_pride || handleData?.me_pride || "Not added yet."}</div>
                  </div>
                </div>
              ) : null}

              {(currentTab === "all" || currentTab === "red" || currentTab === "green") ? (
                <div id="flagsFeed">
                  {displayedFlags.length ? displayedFlags.map((flag) => {
                    const relationship = relationshipTypes.find((item) => item.key === flag.relationship);
                    const timeframe = timeframes.find((item) => item.key === flag.timeframe);
                    const identityLabel = flag.identity === "anonymous" ? "🎭 anonymous" : `✋ @${flag.posted_by_username || "named"}`;
                    const credibility = flag.credibility_weight >= 4 ? "High credibility" : flag.credibility_weight === 3 ? "Medium credibility" : "Low credibility";
                    return (
                      <div key={flag._id} className={cx("flag-card", flag.flag_type === "red" ? "red-card" : "green-card", flag.is_expired && "expired", flag.is_disputed && "disputed")}>
                        <div className="flag-top">
                          <span className={cx("flag-type-badge", flag.flag_type)}>{flag.flag_type === "red" ? "🚩 Red flag" : "🟢 Green flag"}</span>
                          <span className="flag-cat">{flag.category_name}</span>
                          {flag.is_disputed ? <span className="disputed-badge">⚠️ Disputed</span> : null}
                          {flag.is_expired ? <span className="expired-badge">Expired</span> : null}
                          <span className="flag-anon">{identityLabel}</span>
                        </div>
                        {flag.is_disputed ? <div className="disputed-note">⚠️ This flag exists between two people who have both flagged each other. Read with that context in mind.</div> : null}
                        {flag.comment ? <p className="flag-comment">{flag.comment}</p> : null}
                        <div className="flag-meta-row">
                          <span>{relationship?.icon ? `${relationship.icon} ` : ""}{relationship?.label || flag.relationship}</span>
                          <span>📅 {timeframe?.label || flag.timeframe}</span>
                          <span>⚖️ {credibility}</span>
                          <span>{timeAgo(flag.created_at)}</span>
                        </div>

                        <div className="reply-wrap">
                          {flag.reply?.content ? (
                            <>
                              <div className="reply-label">{flag.reply.reply_type === "both_sides" ? contentBlocks.their_reply : contentBlocks.your_reply}</div>
                              <div className={cx("reply-box", flag.reply.reply_type === "both_sides" && "their-side")}>{flag.reply.content}</div>
                            </>
                          ) : (
                            <>
                              <div className="add-reply-btn" onClick={() => setOpenReplyFor(openReplyFor === flag._id ? null : flag._id)}>
                                {flag.is_disputed ? contentBlocks.add_reply_once : contentBlocks.add_reply}
                              </div>
                              <div className={cx("reply-input-wrap", openReplyFor === flag._id && "open")}>
                                <textarea
                                  className="reply-textarea"
                                  placeholder="Your one public reply to this flag... (300 chars max)"
                                  maxLength={300}
                                  value={replyDrafts[flag._id] || ""}
                                  onChange={(e) => setReplyDrafts((current) => ({ ...current, [flag._id]: e.target.value }))}
                                />
                                <div className="reply-char">{(replyDrafts[flag._id] || "").length} / 300</div>
                                <button className="reply-submit" onClick={() => submitReply(flag._id)} disabled={submittingReply}>{submittingReply ? "Posting..." : "Post reply →"}</button>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flag-footer">
                          <div className="flag-actions-left">
                            <button className={cx("know-btn", flag.viewer_knows && "known")} onClick={() => toggleKnow(flag)}>👋 I know this person</button>
                            <span className="know-count">{flag.know_count || 0} people know them</span>
                          </div>
                          <button className="share-flag-btn" onClick={() => shareThing(`${flag.category_name} on @${handleData?.instagram_handle}`)}>↗ Share this flag</button>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="empty-state">
                      <div className="empty-icon">🫥</div>
                      <div className="empty-title">{contentBlocks.no_flags_title}</div>
                      <div className="empty-sub">{contentBlocks.no_flags_sub}</div>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>

        <aside className="sidebar">
          <div className="sidebar-card">
            <p className="sidebar-title">📤 Share vibe card</p>
            <button className="share-vibe-btn" onClick={() => shareThing(`Check @${handleData?.instagram_handle || handleKey} on Clocked`)}>{contentBlocks.share_card_btn.replace("this handle", `@${handleData?.instagram_handle || handleKey}`)}</button>
            <a href="/grievance" className="report-link">{contentBlocks.report_handle}</a>
          </div>

          <div className="sidebar-card">
            <p className="sidebar-title">{contentBlocks.people_also_searched}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {searchData.related_handles.map((item) => (
                <a key={item.instagram_handle} href={`/search?handle=${encodeURIComponent(item.instagram_handle)}&reason=${encodeURIComponent(searchedReason)}`} className="related-link">
                  @{item.instagram_handle}
                  <span className={cx("related-score", getTone(item.stats?.vibe_score) === "green" ? "green" : "red")}>
                    {getTone(item.stats?.vibe_score) === "green" ? "🟢" : "🚩"} {Math.round(item.stats?.vibe_score || 0)}%
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="sidebar-card">
            <p className="sidebar-title">{contentBlocks.flag_requests_title}</p>
            {searchData.requests.map((item) => {
              const reason = searchReasons.find((r) => r.key === item.reason);
              return (
                <div key={item._id} className="flag-request-item">
                  <div className="req-why">{reason?.icon ? `${reason.icon} ` : ""}{reason?.label || item.reason}</div>
                  {item.message || "Community is looking for experiences about this handle."}
                </div>
              );
            })}
            <button className="post-req-btn">{contentBlocks.post_flag_request}</button>
          </div>

          {searchData.can_claim ? (
            <div className="sidebar-card claim-card">
              <p className="sidebar-title claim-title">{contentBlocks.claim_profile_title}</p>
              <p className="claim-body">{contentBlocks.claim_profile_body}</p>
              <a href="/signup" className="claim-btn">{contentBlocks.claim_profile_cta}</a>
            </div>
          ) : null}
        </aside>
      </div>

      <div className={cx("share-toast", shareToast && "show")}>{shareToast}</div>
    </div>
  );
}

const styles = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --red: #E2353A; --red-light: #FFF0F0; --red-mid: #FFBDBE;
  --green: #1A9E5F; --green-light: #F0FFF8; --green-mid: #A3E6C8;
  --black: #0C0C0A; --off-white: #F8F7F3;
  --gray-1: #F2F1EC; --gray-2: #E5E4DE; --gray-3: #CCCBC4;
  --gray-4: #9E9D97; --gray-5: #5E5D58; --white: #FFFFFF;
  --radius: 14px; --radius-sm: 8px;
}
body { font-family: Inter, Arial, sans-serif; background: var(--off-white); color: var(--black); min-height: 100vh; }
.page-shell { min-height: 100vh; }
nav { position: sticky; top: 0; z-index: 100; height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; background: rgba(248,247,243,0.92); backdrop-filter: blur(14px); border-bottom: 1px solid var(--gray-2); }
.nav-logo { font-size: 1.2rem; font-weight: 800; color: var(--black); text-decoration: none; display: flex; align-items: center; gap: 8px; }
.logo-flags { display: flex; gap: 4px; align-items: center; }
.flag-shape { width: 9px; height: 15px; clip-path: polygon(0 0,100% 15%,100% 85%,0 100%); display: block; }
.flag-r { background: var(--red); } .flag-g { background: var(--green); }
.nav-search { display: flex; align-items: center; background: var(--white); border: 1.5px solid var(--gray-3); border-radius: 30px; padding: 5px 5px 5px 16px; gap: 6px; flex: 1; max-width: 340px; margin: 0 2rem; }
.nav-search:focus-within { border-color: var(--black); }
.nav-at { font-size: .85rem; font-weight: 700; color: var(--gray-4); }
.nav-search-input { flex: 1; border: none; outline: none; background: transparent; font-size: .88rem; color: var(--black); min-width: 0; }
.nav-search-btn, .btn-solid, .claim-btn, .share-vibe-btn, .reply-submit, .fsi-submit, .post-req-btn { background: var(--black); color: var(--white); border: none; border-radius: 20px; padding: 6px 14px; font-size: .75rem; font-weight: 700; cursor: pointer; text-decoration: none; }
.btn-ghost { font-size: .8rem; font-weight: 500; color: var(--gray-5); background: none; border: 1px solid var(--gray-3); border-radius: 30px; padding: 5px 14px; cursor: pointer; text-decoration: none; }
.nav-right { display: flex; gap: 8px; align-items: center; }
.why-banner { background: var(--black); color: var(--white); padding: .6rem 2rem; font-size: .78rem; display: flex; align-items: center; gap: 8px; justify-content: center; }
.why-chip { background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2); border-radius: 20px; padding: 2px 10px; font-size: .72rem; font-weight: 500; }
.why-change { font-size: .72rem; color: rgba(255,255,255,.7); background: none; border: none; cursor: pointer; text-decoration: underline; }
.page { max-width: 960px; margin: 0 auto; padding: 2rem 2rem 5rem; display: grid; grid-template-columns: 1fr 300px; gap: 2rem; align-items: start; }
.profile-card, .sidebar-card, .both-sides-card, .me-profile-card, .flag-card, .flag-submit-inline { background: var(--white); border: 1px solid var(--gray-2); border-radius: var(--radius); }
.profile-card { padding: 1.5rem; margin-bottom: 1.25rem; }
.profile-top { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 1.25rem; }
.profile-avatar { width: 64px; height: 64px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 800; color: var(--white); }
.profile-handle { font-size: 1.3rem; font-weight: 800; color: var(--black); margin-bottom: 3px; }
.profile-meta { font-size: .78rem; color: var(--gray-4); display: flex; gap: 10px; flex-wrap: wrap; }
.profile-actions { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.action-btn { font-size: .75rem; font-weight: 500; padding: 6px 14px; border-radius: 20px; cursor: pointer; border: 1px solid var(--gray-3); background: var(--gray-1); color: var(--gray-5); }
.action-btn.watching { background: var(--black); color: var(--white); border-color: var(--black); }
.action-btn.flag-red { background: var(--red-light); color: var(--red); border-color: var(--red-mid); }
.action-btn.flag-green { background: var(--green-light); color: var(--green); border-color: var(--green-mid); }
.vibe-row { display: grid; grid-template-columns: auto 1fr auto; gap: 1.25rem; align-items: center; padding: 1.25rem; background: var(--gray-1); border-radius: var(--radius-sm); margin-bottom: 1rem; }
.score-ring-wrap { width: 72px; height: 72px; }
.score-ring { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.score-inner { width: 54px; height: 54px; border-radius: 50%; background: var(--gray-1); display: flex; flex-direction: column; align-items: center; justify-content: center; }
.score-num { font-size: 1rem; font-weight: 800; line-height: 1; }
.score-pct { font-size: .55rem; color: var(--gray-4); }
.score-label { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--gray-4); margin-bottom: 4px; }
.score-verdict { font-size: 1rem; font-weight: 800; margin-bottom: 3px; }
.score-sub { font-size: .75rem; color: var(--gray-5); line-height: 1.4; }
.flag-counts { display: flex; flex-direction: column; gap: 6px; }
.flag-count-item { display: flex; align-items: center; gap: 8px; }
.flag-count-bar-wrap { flex: 1; height: 5px; background: var(--gray-2); border-radius: 3px; overflow: hidden; min-width: 60px; }
.flag-count-bar { height: 100%; border-radius: 3px; }
.flag-count-bar.red { background: var(--red); } .flag-count-bar.green { background: var(--green); }
.flag-count-num { font-size: .8rem; font-weight: 700; min-width: 20px; text-align: right; }
.flag-count-label { font-size: .68rem; color: var(--gray-4); min-width: 56px; }
.pattern-alert, .searched-card { border-radius: var(--radius-sm); padding: .9rem 1rem; margin-bottom: 1rem; display: flex; gap: 10px; }
.pattern-alert { background: var(--red-light); border: 1px solid var(--red-mid); }
.pattern-text, .searched-text { font-size: .8rem; line-height: 1.5; }
.pattern-text strong, .searched-text strong { display: block; font-weight: 700; color: var(--black); }
.searched-card { background: var(--white); border: 1px solid var(--gray-2); align-items: center; }
.searched-strip { display: flex; gap: 8px; flex-wrap: wrap; }
.searched-chip { font-size: .68rem; font-weight: 500; padding: 3px 9px; border-radius: 20px; background: var(--gray-1); border: 1px solid var(--gray-2); color: var(--gray-5); }
.flag-submit-inline { padding: 1.25rem; margin-bottom: 1rem; display: none; }
.flag-submit-inline.open { display: block; }
.fsi-title { font-size: .9rem; font-weight: 700; color: var(--black); margin-bottom: 1rem; }
.fsi-row { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.fsi-select, .fsi-textarea, .reply-textarea { width: 100%; font-size: .82rem; border: 1.5px solid var(--gray-3); border-radius: var(--radius-sm); padding: 8px 10px; background: var(--white); color: var(--black); outline: none; }
.fsi-textarea { min-height: 80px; resize: none; }
.fsi-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; flex-wrap: wrap; gap: 8px; }
.fsi-anon-toggle { display: flex; align-items: center; gap: 6px; font-size: .78rem; color: var(--gray-5); }
.fsi-disclaimer { font-size: .68rem; color: var(--gray-4); margin-top: 8px; line-height: 1.4; }
.secondary-mini { background: var(--gray-1); color: var(--gray-5); border: 1px solid var(--gray-3); border-radius: var(--radius-sm); padding: 9px 16px; cursor: pointer; }
.tabs-row { display: flex; gap: 4px; margin-bottom: 1rem; background: var(--gray-1); border-radius: 30px; padding: 4px; flex-wrap: wrap; }
.tab-btn { flex: 1; font-size: .78rem; font-weight: 500; border: none; background: none; border-radius: 24px; padding: 7px 10px; cursor: pointer; color: var(--gray-5); min-width: 110px; }
.tab-btn.active { background: var(--white); color: var(--black); box-shadow: 0 1px 4px rgba(0,0,0,.08); }
.flag-card { padding: 1rem 1.25rem; margin-bottom: 10px; }
.flag-card.red-card { border-left: 3px solid var(--red); }
.flag-card.green-card { border-left: 3px solid var(--green); }
.flag-card.expired { opacity: .45; background: var(--gray-1); }
.flag-card.disputed { border-left-color: #F59E0B; }
.flag-top { display: flex; align-items: center; gap: 7px; margin-bottom: 6px; flex-wrap: wrap; }
.flag-type-badge { font-size: .7rem; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
.flag-type-badge.red { background: var(--red-light); color: var(--red); }
.flag-type-badge.green { background: var(--green-light); color: var(--green); }
.flag-cat, .flag-anon, .expired-badge, .disputed-badge { font-size: .68rem; padding: 2px 8px; border-radius: 20px; }
.flag-cat { color: var(--gray-5); background: var(--gray-1); border: 1px solid var(--gray-2); }
.flag-anon { color: var(--gray-4); background: var(--gray-1); margin-left: auto; }
.expired-badge { background: var(--gray-2); color: var(--gray-4); }
.disputed-badge { background: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; }
.disputed-note { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: var(--radius-sm); padding: 8px 10px; font-size: .75rem; color: #92400E; line-height: 1.45; margin-bottom: 8px; }
.flag-comment { font-size: .88rem; color: var(--black); line-height: 1.6; margin-bottom: 8px; }
.flag-meta-row { display: flex; gap: 10px; font-size: .7rem; color: var(--gray-4); flex-wrap: wrap; margin-bottom: 8px; }
.reply-wrap { border-top: 1px solid var(--gray-1); padding-top: 10px; margin-top: 4px; }
.reply-label { font-size: .68rem; font-weight: 600; color: var(--gray-4); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
.reply-box { background: var(--gray-1); border-radius: var(--radius-sm); padding: 8px 10px; font-size: .8rem; color: var(--gray-5); line-height: 1.5; border-left: 2px solid var(--gray-3); }
.reply-box.their-side { border-left-color: var(--black); background: var(--off-white); }
.add-reply-btn { font-size: .72rem; color: var(--gray-4); background: none; border: 1px dashed var(--gray-3); border-radius: var(--radius-sm); padding: 6px 12px; cursor: pointer; width: 100%; text-align: left; margin-top: 6px; }
.reply-input-wrap { margin-top: 8px; display: none; }
.reply-input-wrap.open { display: block; }
.reply-textarea { min-height: 70px; resize: none; }
.reply-char { font-size: .68rem; color: var(--gray-4); text-align: right; margin-top: 3px; }
.flag-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--gray-1); flex-wrap: wrap; }
.flag-actions-left { display: flex; align-items: center; gap: 6px; }
.know-btn { font-size: .7rem; font-weight: 500; color: var(--gray-5); background: var(--gray-1); border: 1px solid var(--gray-2); border-radius: 20px; padding: 4px 10px; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.know-btn.known { background: var(--black); color: var(--white); border-color: var(--black); }
.know-count, .share-flag-btn { font-size: .68rem; color: var(--gray-4); }
.share-flag-btn { background: none; border: none; cursor: pointer; }
.both-sides-card, .me-profile-card { padding: 1.25rem; margin-bottom: 1rem; }
.both-sides-title, .me-title { font-size: .85rem; font-weight: 700; color: var(--black); margin-bottom: .85rem; display: flex; align-items: center; gap: 8px; }
.me-badge { font-size: .62rem; font-weight: 700; background: var(--green); color: var(--white); padding: 2px 8px; border-radius: 10px; }
.both-sides-sub, .claim-body, .me-value { font-size: .82rem; color: var(--gray-5); line-height: 1.6; }
.their-perspective { background: var(--gray-1); border-radius: var(--radius-sm); padding: 10px 12px; font-size: .82rem; color: var(--black); line-height: 1.6; border-left: 3px solid var(--black); }
.their-perspective-meta, .me-label, .sidebar-title, .req-why, .report-link { font-size: .68rem; color: var(--gray-4); }
.sidebar { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 72px; }
.sidebar-card { padding: 1.1rem 1.25rem; }
.sidebar-title { font-weight: 700; letter-spacing: .5px; text-transform: uppercase; margin-bottom: .85rem; }
.related-link { font-size: .82rem; color: var(--black); cursor: pointer; display: flex; justify-content: space-between; align-items: center; text-decoration: none; }
.related-score { font-size: .68rem; padding: 2px 7px; border-radius: 20px; font-weight: 600; }
.related-score.red { background: var(--red-light); color: var(--red); }
.related-score.green { background: var(--green-light); color: var(--green); }
.flag-request-item { border-bottom: 1px solid var(--gray-1); padding: 8px 0; font-size: .78rem; color: var(--gray-5); line-height: 1.4; }
.post-req-btn { width: 100%; margin-top: 10px; background: none; color: var(--gray-5); border: 1px dashed var(--gray-3); border-radius: var(--radius-sm); padding: 7px; }
.claim-card { background: var(--black); border-color: var(--black); }
.claim-title { color: rgba(255,255,255,.4); }
.claim-body { color: rgba(255,255,255,.65); margin-bottom: .9rem; }
.claim-btn { display: block; text-align: center; background: var(--white); color: var(--black); border-radius: var(--radius-sm); padding: 9px; }
.error-banner { background: var(--red-light); border: 1px solid var(--red-mid); color: #a91d22; padding: 10px 12px; border-radius: var(--radius-sm); margin-bottom: 12px; }
.empty-state { text-align: center; padding: 2.5rem 1rem; color: var(--gray-4); }
.empty-title { font-size: 1rem; font-weight: 700; color: var(--black); margin-bottom: 4px; }
.empty-sub { font-size: .8rem; line-height: 1.5; }
.share-toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%) translateY(80px); background: var(--black); color: var(--white); font-size: .82rem; font-weight: 500; padding: 10px 20px; border-radius: 30px; z-index: 999; transition: transform .3s ease; white-space: nowrap; pointer-events: none; }
.share-toast.show { transform: translateX(-50%) translateY(0); }
@media (max-width: 700px) {
  .page { grid-template-columns: 1fr; }
  .sidebar { position: static; }
  nav { padding: 0 1rem; }
  .nav-search { display: none; }
  .why-banner { font-size: .72rem; flex-wrap: wrap; }
  .vibe-row { grid-template-columns: auto 1fr; }
  .flag-counts { display: none; }
}
`;
