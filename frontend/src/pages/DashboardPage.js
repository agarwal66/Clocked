import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../api/auth";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const DASHBOARD_CONTRACT = {
  endpoint: "GET /api/dashboard",
  shape: {
    user: {
      id: "string",
      name: "string",
      username: "string",
      initial: "string",
      email: "string",
      emailVerified: "boolean",
      vibeScore: "number",
      vibeDelta: "number",
      vibeDirection: '"up" | "down" | "flat"',
      postCount: "number",
      postLimit: "number",
      profileCompleted: "boolean",
      meProfile: {
        misunderstood: "string",
        pride: "string",
      },
      unsentLetter: "string",
      settings: {
        emailSearches: "boolean",
        emailNewFlags: "boolean",
        emailWatched: "boolean",
        emailReplies: "boolean",
        emailWeeklyRadar: "boolean",
        emailNearbyRequests: "boolean",
        pushSearches: "boolean",
        pushNewFlags: "boolean",
        pushWatched: "boolean",
        pushReplies: "boolean",
        pushBothSides: "boolean",
        pushChallengeMode: "boolean",
        pushChallengeResult: "boolean",
        anonymousDefault: "boolean",
      },
    },
    overview: {
      searchedThisWeek: "number",
      searchedBreakdown: ["string"],
      totalFlagsOnMe: "number",
      flagsOnMeBreakdown: "string",
      watchingCount: "number",
      watchingNote: "string",
      requestCount: "number",
      requestNote: "string",
    },
    quickActions: {
      canShareVibeCard: "boolean",
      vibeCardUrl: "string",
      flagPath: "string",
      searchPath: "string",
    },
    reputationMovement: {
      periodLabel: "string",
      netDelta: "number",
      trendLabel: "string",
      items: [
        {
          id: "string | number",
          direction: '"up" | "down" | "neutral"',
          delta: "number",
          label: "string",
          detail: "string",
        },
      ],
    },
    searchPreview: {
      total: "number",
      items: [
        {
          id: "string | number",
          handle: "string",
          reason: "string",
          when: "string",
        },
      ],
    },
    notifications: [
      {
        id: "string | number",
        scope: '"about_me" | "watching" | "system"',
        type: '"red" | "green" | "amber" | "gray"',
        unread: "boolean",
        text: "string",
        time: "string",
      },
    ],
    flagsOnMe: [
      {
        id: "string | number",
        type: '"red" | "green"',
        handle: "string",
        snippet: "string",
        tags: ["string"],
        time: "string",
      },
    ],
    flagsPosted: [
      {
        id: "string | number",
        type: '"red" | "green"',
        handle: "string",
        snippet: "string",
        tags: ["string"],
        time: "string",
      },
    ],
    watching: [
      {
        id: "string | number",
        handle: "string",
        initial: "string",
        avatar: "string",
        red: "number",
        green: "number",
        lastFlag: "string",
        score: "number",
        riskAlert: "string",
      },
    ],
    requests: [
      {
        id: "string | number",
        handle: "string",
        why: "string",
        text: "string",
      },
    ],
    searchSuggestions: [
      {
        id: "string | number",
        handle: "string",
        red: "number",
        green: "number",
        score: "number",
        color: "string",
      },
    ],
    push: {
      enabled: "boolean",
      denied: "boolean",
      deviceCount: "number",
    },
  },
};

const EMPTY_DASHBOARD = {
  user: {
    id: "",
    name: "",
    username: "",
    initial: "U",
    email: "",
    emailVerified: false,
    vibeScore: 0,
    vibeDelta: 0,
    vibeDirection: "flat",
    postCount: 0,
    postLimit: 5,
    profileCompleted: false,
    meProfile: {
      misunderstood: "",
      pride: "",
    },
    unsentLetter: "",
    settings: {
      emailSearches: false,
      emailNewFlags: false,
      emailWatched: false,
      emailReplies: false,
      emailWeeklyRadar: false,
      emailNearbyRequests: false,
      pushSearches: false,
      pushNewFlags: false,
      pushWatched: false,
      pushReplies: false,
      pushBothSides: false,
      pushChallengeMode: false,
      pushChallengeResult: false,
      anonymousDefault: true,
    },
  },
  overview: {
    searchedThisWeek: 0,
    searchedBreakdown: [],
    totalFlagsOnMe: 0,
    flagsOnMeBreakdown: "No flags yet",
    watchingCount: 0,
    watchingNote: "No watched handle activity",
    requestCount: 0,
    requestNote: "No open requests",
  },
  quickActions: {
    canShareVibeCard: false,
    vibeCardUrl: "",
    flagPath: "/flag",
    searchPath: "/search",
  },
  reputationMovement: {
    periodLabel: "Last 7 days",
    netDelta: 0,
    trendLabel: "No movement yet",
    items: [],
  },
  searchPreview: {
    total: 0,
    items: [],
  },
  notifications: [],
  flagsOnMe: [],
  flagsPosted: [],
  watching: [],
  requests: [],
  searchSuggestions: [],
  push: {
    enabled: false,
    denied: false,
    deviceCount: 0,
  },
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function mergeUser(user = {}) {
  const username = user.username || "";
  return {
    ...EMPTY_DASHBOARD.user,
    ...user,
    initial: user.initial || username?.[0]?.toUpperCase() || EMPTY_DASHBOARD.user.initial,
    meProfile: {
      ...EMPTY_DASHBOARD.user.meProfile,
      ...(user.meProfile || {}),
    },
    settings: {
      ...EMPTY_DASHBOARD.user.settings,
      ...(user.settings || {}),
    },
  };
}

function mapDashboardPayload(payload) {
  return {
    user: mergeUser(payload.user || {}),
    overview: {
      ...EMPTY_DASHBOARD.overview,
      ...(payload.overview || {}),
      searchedBreakdown: safeArray(payload.overview?.searchedBreakdown),
    },
    quickActions: {
      ...EMPTY_DASHBOARD.quickActions,
      ...(payload.quickActions || {}),
    },
    reputationMovement: {
      ...EMPTY_DASHBOARD.reputationMovement,
      ...(payload.reputationMovement || {}),
      items: safeArray(payload.reputationMovement?.items),
    },
    searchPreview: {
      ...EMPTY_DASHBOARD.searchPreview,
      ...(payload.searchPreview || {}),
      items: safeArray(payload.searchPreview?.items),
    },
    notifications: safeArray(payload.notifications),
    flagsOnMe: safeArray(payload.flagsOnMe),
    flagsPosted: safeArray(payload.flagsPosted),
    watching: safeArray(payload.watching),
    requests: safeArray(payload.requests),
    searchSuggestions: safeArray(payload.searchSuggestions),
    push: {
      ...EMPTY_DASHBOARD.push,
      ...(payload.push || {}),
    },
  };
}

const pageCss = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --red:#E2353A;--red-light:#FFF0F0;--red-mid:#FFBDBE;
  --green:#1A9E5F;--green-light:#F0FFF8;--green-mid:#A3E6C8;
  --amber:#F59E0B;--amber-light:#FFFBEB;--amber-mid:#FDE68A;
  --black:#0C0C0A;--off-white:#F8F7F3;
  --gray-1:#F2F1EC;--gray-2:#E5E4DE;--gray-3:#CCCBC4;
  --gray-4:#9E9D97;--gray-5:#5E5D58;--white:#FFFFFF;
  --font-display:'Syne',sans-serif;--font-body:'DM Sans',sans-serif;
  --radius:14px;--radius-sm:8px;
}
html{font-size:16px;scroll-behavior:smooth}
.dashboard-shell{font-family:var(--font-body);background:var(--off-white);color:var(--black);min-height:100vh;display:flex;flex-direction:column}
.dashboard-shell button,.dashboard-shell input,.dashboard-shell textarea,.dashboard-shell select{font-family:inherit}
.topnav{position:sticky;top:0;z-index:100;height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 2rem;background:rgba(248,247,243,.96);backdrop-filter:blur(14px);border-bottom:1px solid var(--gray-2);flex-shrink:0}
.nav-logo{font-family:var(--font-display);font-size:1.2rem;font-weight:800;letter-spacing:-.5px;color:var(--black);text-decoration:none;display:flex;align-items:center;gap:8px}
.logo-flags{display:flex;gap:4px;align-items:center}.flag-shape{width:9px;height:15px;clip-path:polygon(0 0,100% 15%,100% 85%,0 100%);display:block}.flag-r{background:var(--red)}.flag-g{background:var(--green)}
.nav-search{display:flex;align-items:center;background:var(--white);border:1.5px solid var(--gray-3);border-radius:30px;padding:4px 4px 4px 14px;gap:6px;flex:1;max-width:280px;margin:0 1.5rem;transition:border-color .15s;position:relative}
.nav-search:focus-within{border-color:var(--black)}
.nav-at{font-family:var(--font-display);font-size:.82rem;font-weight:700;color:var(--gray-4)}
.nav-search-input{flex:1;border:none;outline:none;background:transparent;font-family:var(--font-body);font-size:.85rem;color:var(--black);min-width:0}
.nav-search-input::placeholder{color:var(--gray-4)}
.nav-search-btn{background:var(--black);color:var(--white);border:none;border-radius:20px;padding:5px 12px;font-size:.72rem;font-weight:700;cursor:pointer;font-family:var(--font-display)}
.nav-right{display:flex;align-items:center;gap:10px}.notif-btn{position:relative;background:none;border:none;cursor:pointer;padding:6px;border-radius:50%;transition:background .15s;font-size:1.1rem;line-height:1}.notif-btn:hover{background:var(--gray-1)}
.notif-dot{position:absolute;top:4px;right:4px;width:8px;height:8px;background:var(--red);border-radius:50%;border:2px solid var(--off-white)}
.avatar-btn{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--red),#FF8A65);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:.75rem;font-weight:700;color:var(--white);border:none;cursor:pointer}
.search-dropdown{position:absolute;top:calc(100% + 8px);left:0;right:0;background:var(--white);border:1px solid var(--gray-2);border-radius:var(--radius);box-shadow:0 12px 40px rgba(0,0,0,.12);overflow:hidden;z-index:120}
.search-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border:none;background:var(--white);text-align:left;width:100%;cursor:pointer;border-bottom:1px solid var(--gray-1)}
.search-item:last-child{border-bottom:none}.search-item:hover{background:var(--gray-1)}
.search-avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:800;font-size:.8rem;color:var(--white);flex-shrink:0}
.search-info{flex:1;min-width:0}.search-handle{font-size:.82rem;font-weight:600;color:var(--black)}.search-meta{font-size:.66rem;color:var(--gray-4)}
.search-score{font-size:.66rem;font-weight:700;padding:3px 8px;border-radius:20px}
.page-wrap{flex:1;display:flex;flex-direction:column}.page{max-width:1120px;margin:0 auto;width:100%;padding:2rem 2rem 3rem;display:grid;grid-template-columns:252px 1fr;gap:2rem;align-items:start;flex:1}
.sidebar{position:sticky;top:72px;background:var(--white);border:1px solid var(--gray-2);border-radius:var(--radius);padding:.75rem;display:flex;flex-direction:column;gap:2px}
.side-user{display:flex;align-items:center;gap:10px;padding:10px;background:var(--gray-1);border-radius:var(--radius-sm);margin-bottom:6px}
.side-avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--red),#FF8A65);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:.85rem;font-weight:800;color:var(--white);flex-shrink:0}
.side-username{font-family:var(--font-display);font-size:.85rem;font-weight:700;color:var(--black)}.side-score{font-size:.65rem;color:var(--green);font-weight:600;margin-top:1px}
.side-sep{height:1px;background:var(--gray-2);margin:6px 0}.side-group{font-size:.58rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--gray-4);padding:8px 8px 3px;margin-top:2px}
.side-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:var(--radius-sm);font-size:.83rem;font-weight:500;color:var(--gray-5);cursor:pointer;transition:all .15s;border:none;background:none;font-family:var(--font-body);text-align:left;width:100%;text-decoration:none}
.side-item:hover{background:var(--gray-1);color:var(--black)}.side-item.active{background:var(--black);color:var(--white)}.side-icon{font-size:.88rem;width:18px;text-align:center;flex-shrink:0}
.side-badge{margin-left:auto;font-size:.58rem;font-weight:700;padding:2px 6px;border-radius:10px;color:var(--white);min-width:18px;text-align:center}.side-badge.red{background:var(--red)}.side-badge.amber{background:var(--amber)}.side-item.active .side-badge{background:rgba(255,255,255,.25)}
.main{min-width:0}.section{display:none}.section.active{display:block}.page-title{font-family:var(--font-display);font-size:1.5rem;font-weight:800;letter-spacing:-.5px;color:var(--black);margin-bottom:3px}.page-sub{font-size:.82rem;color:var(--gray-5);margin-bottom:1.5rem}
.card{background:var(--white);border:1px solid var(--gray-2);border-radius:var(--radius);padding:1.25rem;margin-bottom:1rem}.card-title{font-family:var(--font-display);font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--gray-4);margin-bottom:1rem}
.inline-banner{background:var(--white);border:1px solid var(--gray-2);border-radius:var(--radius-sm);padding:.8rem 1rem;margin-bottom:1rem;font-size:.8rem;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.inline-banner.error{background:var(--red-light);border-color:var(--red-mid);color:var(--red)}
.quick-actions{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:1rem;justify-content:flex-end}.quick-action-btn{font-family:var(--font-display);font-size:.78rem;font-weight:700;background:var(--white);color:var(--black);border:1px solid var(--gray-3);border-radius:20px;padding:8px 14px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px}.quick-action-btn:hover{border-color:var(--black)}
.searched-banner{background:var(--amber-light);border:1px solid var(--amber-mid);border-radius:var(--radius);padding:1.1rem 1.25rem;margin-bottom:1rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap}.searched-big{font-family:var(--font-display);font-size:1.5rem;font-weight:800;color:var(--black);line-height:1;margin-bottom:2px}.searched-label{font-size:.75rem;color:var(--gray-5)}.searched-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.searched-chip{font-size:.68rem;font-weight:500;padding:3px 9px;border-radius:20px;background:var(--white);border:1px solid var(--amber-mid);color:var(--gray-5)}
.preview-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem}.mini-card{background:var(--white);border:1px solid var(--gray-2);border-radius:var(--radius);padding:1rem}
.preview-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 0;border-bottom:1px solid var(--gray-1)}.preview-row:last-child{border-bottom:none;padding-bottom:0}.preview-handle{font-size:.8rem;font-weight:600;color:var(--black)}.preview-sub{font-size:.68rem;color:var(--gray-4)}
.vibe-card{background:var(--black);border-radius:var(--radius);padding:1.4rem;margin-bottom:1rem;display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap}.vibe-ring{width:76px;height:76px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}.vibe-inner{width:57px;height:57px;border-radius:50%;background:var(--black);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:var(--font-display)}.vibe-num{font-size:1rem;font-weight:800;line-height:1}.vibe-pct{font-size:.5rem;color:rgba(255,255,255,.4)}.vibe-info{flex:1;min-width:160px}.vibe-eyebrow{font-size:.62rem;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.35);margin-bottom:4px}.vibe-verdict{font-family:var(--font-display);font-size:1rem;font-weight:800;color:var(--white);margin-bottom:4px}.vibe-sub{font-size:.75rem;color:rgba(255,255,255,.5);line-height:1.45}.vibe-btns{display:flex;gap:8px;flex-wrap:wrap}.vibe-btn{font-family:var(--font-body);font-size:.75rem;font-weight:500;padding:7px 14px;border-radius:20px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:rgba(255,255,255,.8);cursor:pointer;transition:all .15s;white-space:nowrap}.vibe-btn:hover{background:rgba(255,255,255,.16);color:var(--white)}
.verification-card{background:var(--gray-1);border:1px solid var(--gray-2);border-radius:var(--radius-sm);padding:1rem;margin-bottom:1rem}.ver-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px}.ver-title{font-family:var(--font-display);font-size:.82rem;font-weight:800;color:var(--black)}.ver-status{font-size:.68rem;font-weight:700;padding:4px 10px;border-radius:20px}.ver-status.ok{background:var(--green-light);color:var(--green);border:1px solid var(--green-mid)}.ver-status.warn{background:var(--amber-light);color:var(--amber);border:1px solid var(--amber-mid)}.ver-copy{font-size:.76rem;color:var(--gray-5);line-height:1.5;margin-bottom:10px}.limit-bar{height:8px;background:var(--gray-2);border-radius:20px;overflow:hidden;margin-bottom:6px}.limit-fill{height:100%;border-radius:20px;background:var(--amber)}.limit-meta{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:.68rem;color:var(--gray-4);margin-bottom:10px}
.small-btn{font-family:var(--font-display);font-size:.74rem;font-weight:700;background:var(--black);color:var(--white);border:none;border-radius:var(--radius-sm);padding:8px 14px;cursor:pointer}.small-btn:hover{opacity:.85}
.movement-item{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid var(--gray-1)}.movement-item:last-child{border-bottom:none;padding-bottom:0}.movement-icon{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem;flex-shrink:0}.movement-icon.up{background:var(--green-light);color:var(--green)}.movement-icon.down{background:var(--red-light);color:var(--red)}.movement-icon.neutral{background:var(--gray-1);color:var(--gray-5)}.movement-copy{flex:1}.movement-title{font-size:.82rem;font-weight:600;color:var(--black);margin-bottom:2px}.movement-detail{font-size:.72rem;color:var(--gray-4);line-height:1.45}.movement-delta{font-family:var(--font-display);font-size:.9rem;font-weight:800}.movement-delta.up{color:var(--green)}.movement-delta.down{color:var(--red)}.movement-delta.neutral{color:var(--gray-5)}
.filter-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem}.filter-pill{font-size:.72rem;font-weight:500;padding:6px 12px;border-radius:20px;border:1px solid var(--gray-2);background:var(--gray-1);color:var(--gray-5);cursor:pointer}.filter-pill.active{background:var(--black);border-color:var(--black);color:var(--white)}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:1rem}.stat-box{background:var(--white);border:1px solid var(--gray-2);border-radius:var(--radius-sm);padding:1rem;text-align:center;cursor:pointer;transition:all .15s}.stat-box:hover{border-color:var(--gray-3);box-shadow:0 4px 12px rgba(0,0,0,.06)}.stat-num{font-family:var(--font-display);font-size:1.6rem;font-weight:800;display:block;line-height:1;margin-bottom:3px}.stat-label{font-size:.68rem;color:var(--gray-4)}.stat-note{font-size:.62rem;margin-top:4px;display:block;font-weight:500}.note-up{color:var(--green)}.note-neu{color:var(--gray-4)}.note-amber{color:var(--amber)}
.notif-item{display:flex;gap:12px;align-items:flex-start;padding:11px 0;border-bottom:1px solid var(--gray-1);cursor:pointer;transition:all .12s}.notif-item:last-child{border-bottom:none;padding-bottom:0}.notif-item:first-child{padding-top:0}.notif-item:hover{background:var(--gray-1);margin:0 -1.25rem;padding-left:1.25rem;padding-right:1.25rem;border-radius:var(--radius-sm)}.notif-icon{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0;position:relative}.notif-icon.red{background:var(--red-light)}.notif-icon.green{background:var(--green-light)}.notif-icon.gray{background:var(--gray-1)}.notif-icon.amber{background:var(--amber-light)}.notif-icon.unread::after{content:'';position:absolute;top:-1px;right:-1px;width:9px;height:9px;background:var(--red);border-radius:50%;border:2px solid var(--white)}.notif-text{font-size:.82rem;color:var(--black);line-height:1.45;margin-bottom:2px}.notif-text strong{font-weight:600}.notif-time{font-size:.68rem;color:var(--gray-4)}
.flag-row{display:flex;gap:12px;align-items:flex-start;padding:11px 0;border-bottom:1px solid var(--gray-1)}.flag-row:last-child{border-bottom:none;padding-bottom:0}.flag-row:first-child{padding-top:0}.flag-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:5px}.flag-dot.red{background:var(--red)}.flag-dot.green{background:var(--green)}.flag-body{flex:1;min-width:0}.flag-handle{font-size:.84rem;font-weight:600;color:var(--black);margin-bottom:2px}.flag-snippet{font-size:.78rem;color:var(--gray-5);line-height:1.4;margin-bottom:5px}.flag-tags{display:flex;gap:5px;flex-wrap:wrap}.tag{font-size:.62rem;font-weight:500;padding:2px 8px;border-radius:20px}.tag.red{background:var(--red-light);color:var(--red)}.tag.green{background:var(--green-light);color:var(--green)}.tag.gray{background:var(--gray-1);color:var(--gray-5);border:1px solid var(--gray-2)}.flag-time{font-size:.65rem;color:var(--gray-4);flex-shrink:0;margin-top:3px}
.watch-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--gray-1)}.watch-row:last-child{border-bottom:none;padding-bottom:0}.watch-row:first-child{padding-top:0}.watch-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:.8rem;font-weight:800;color:var(--white);flex-shrink:0}.watch-handle{font-size:.85rem;font-weight:500;color:var(--black)}.watch-meta{font-size:.68rem;color:var(--gray-4);margin-top:1px}.watch-alert{font-size:.66rem;color:var(--amber);font-weight:600;margin-top:4px}.watch-score{font-size:.68rem;font-weight:700;padding:3px 9px;border-radius:20px;white-space:nowrap}.watch-score.red{background:var(--red-light);color:var(--red)}.watch-score.green{background:var(--green-light);color:var(--green)}.unwatch-btn{font-size:.68rem;color:var(--gray-4);background:none;border:1px solid var(--gray-2);border-radius:20px;padding:3px 10px;cursor:pointer;font-family:var(--font-body);transition:all .15s;white-space:nowrap}.unwatch-btn:hover{border-color:var(--red);color:var(--red)}
.req-box{background:var(--gray-1);border:1px solid var(--gray-2);border-radius:var(--radius-sm);padding:.9rem 1rem;margin-bottom:8px}.req-box:last-child{margin-bottom:0}.req-top{display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap}.req-handle{font-size:.85rem;font-weight:600;color:var(--black)}.req-why{font-size:.65rem;font-weight:600;padding:2px 8px;border-radius:20px;background:var(--white);border:1px solid var(--gray-3);color:var(--gray-5)}.req-text{font-size:.78rem;color:var(--gray-5);line-height:1.4;margin-bottom:7px}.req-btn{font-size:.72rem;font-weight:500;background:var(--white);border:1px solid var(--gray-3);border-radius:var(--radius-sm);padding:5px 12px;cursor:pointer;font-family:var(--font-body);transition:all .15s;color:var(--gray-5)}.req-btn:hover{border-color:var(--black);color:var(--black)}
.me-label{display:block;font-size:.75rem;font-weight:600;color:var(--gray-5);margin-bottom:5px}.me-input{width:100%;font-family:var(--font-body);font-size:.9rem;border:1.5px solid var(--gray-3);border-radius:var(--radius-sm);padding:10px 12px;color:var(--black);background:var(--white);outline:none;transition:border-color .15s;margin-bottom:1rem}.me-input:focus{border-color:var(--black)}.me-textarea{width:100%;font-family:var(--font-body);font-size:.9rem;border:1.5px solid var(--gray-3);border-radius:var(--radius-sm);padding:10px 12px;color:var(--black);background:var(--white);outline:none;resize:none;min-height:85px;line-height:1.5;transition:border-color .15s;margin-bottom:.4rem}.me-textarea:focus{border-color:var(--black)}.me-hint{font-size:.68rem;color:var(--gray-4);margin-bottom:1rem}.save-btn{font-family:var(--font-display);font-size:.85rem;font-weight:700;background:var(--black);color:var(--white);border:none;border-radius:var(--radius-sm);padding:10px 24px;cursor:pointer;transition:opacity .15s}.save-btn:hover{opacity:.85}.save-ok{font-size:.78rem;color:var(--green);margin-left:10px;display:none}.save-ok.show{display:inline}
.private-badge{display:inline-flex;align-items:center;gap:5px;background:var(--gray-1);border:1px solid var(--gray-2);border-radius:20px;padding:3px 12px;font-size:.68rem;color:var(--gray-5);margin-bottom:1rem}.letter-area{width:100%;font-family:var(--font-body);font-size:.9rem;border:1.5px solid var(--gray-2);border-radius:var(--radius-sm);padding:1rem;color:var(--black);background:var(--gray-1);outline:none;resize:none;min-height:240px;line-height:1.75;transition:all .15s}.letter-area:focus{border-color:var(--gray-3);background:var(--white)}.letter-area::placeholder{color:var(--gray-4);font-style:italic}.letter-footer{display:flex;align-items:center;justify-content:space-between;margin-top:.75rem;flex-wrap:wrap;gap:8px}.letter-note{font-size:.7rem;color:var(--gray-4);line-height:1.45;flex:1}.letter-btns{display:flex;gap:8px}.letter-clear{font-family:var(--font-body);font-size:.78rem;color:var(--gray-5);background:none;border:1px solid var(--gray-2);border-radius:var(--radius-sm);padding:7px 14px;cursor:pointer;transition:all .15s}.letter-clear:hover{border-color:var(--red);color:var(--red)}.letter-save{font-family:var(--font-display);font-size:.78rem;font-weight:700;background:var(--black);color:var(--white);border:none;border-radius:var(--radius-sm);padding:7px 18px;cursor:pointer;transition:opacity .15s}.letter-save:hover{opacity:.85}.letter-saved{font-size:.72rem;color:var(--green);margin-top:6px;display:none}.letter-saved.show{display:block}
.setting-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--gray-1);gap:1rem}.setting-row:last-child{border-bottom:none;padding-bottom:0}.setting-row:first-child{padding-top:0}.setting-label{font-size:.85rem;font-weight:500;color:var(--black);margin-bottom:2px}.setting-sub{font-size:.72rem;color:var(--gray-4);line-height:1.4}.toggle{position:relative;width:40px;height:22px;flex-shrink:0}.toggle input{opacity:0;width:0;height:0;position:absolute}.toggle-track{position:absolute;inset:0;background:var(--gray-3);border-radius:11px;cursor:pointer;transition:background .2s}.toggle-track::before{content:'';position:absolute;width:16px;height:16px;left:3px;top:3px;background:var(--white);border-radius:50%;transition:transform .2s}.toggle input:checked+.toggle-track{background:var(--black)}.toggle input:checked+.toggle-track::before{transform:translateX(18px)}
.danger-btn{font-family:var(--font-body);font-size:.78rem;font-weight:500;color:var(--red);background:var(--red-light);border:1px solid var(--red-mid);border-radius:var(--radius-sm);padding:6px 14px;cursor:pointer;transition:all .15s;white-space:nowrap}.danger-btn:hover{background:var(--red);color:var(--white)}
.ghost-btn{font-family:var(--font-body);font-size:.78rem;font-weight:500;color:var(--gray-5);background:none;border:1px solid var(--gray-3);border-radius:var(--radius-sm);padding:6px 14px;cursor:pointer;transition:all .15s;text-decoration:none;display:inline-block;white-space:nowrap}.ghost-btn:hover{border-color:var(--black);color:var(--black)}.primary-btn{font-family:var(--font-display);font-size:.82rem;font-weight:700;background:var(--black);color:var(--white);border:none;border-radius:var(--radius-sm);padding:9px 20px;cursor:pointer;transition:opacity .15s}.primary-btn:hover{opacity:.85}
.empty-state{padding:1rem 0;text-align:center}.empty-icon{font-size:1.8rem;margin-bottom:.5rem}.empty-title{font-family:var(--font-display);font-size:.95rem;font-weight:800;color:var(--black);margin-bottom:3px}.empty-copy{font-size:.76rem;color:var(--gray-4);line-height:1.5;max-width:360px;margin:0 auto}
.code-box{background:var(--gray-1);border:1px solid var(--gray-2);border-radius:var(--radius-sm);padding:1rem;overflow:auto;font-size:.72rem;line-height:1.6;color:var(--gray-5);white-space:pre-wrap}
.site-footer{border-top:1px solid var(--gray-2);padding:1.25rem 2rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;background:var(--white);flex-shrink:0}.footer-copy{font-size:.75rem;color:var(--gray-4)}.footer-links{display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap}.footer-link{font-size:.75rem;color:var(--gray-4);text-decoration:none;transition:color .15s}.footer-link:hover{color:var(--black)}.footer-report{font-size:.72rem;color:var(--red);font-weight:500;border:1px solid var(--red-mid);background:var(--red-light);padding:4px 12px;border-radius:20px;text-decoration:none;transition:all .15s}.footer-report:hover{background:var(--red);color:var(--white)}
.mob-bar{display:none;position:fixed;bottom:0;left:0;right:0;z-index:200;background:var(--white);border-top:1px solid var(--gray-2);padding:6px 0 max(6px,env(safe-area-inset-bottom))}.mob-tabs{display:flex;justify-content:space-around}.mob-tab{display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 10px;border:none;background:none;cursor:pointer;font-family:var(--font-body);min-width:52px;position:relative}.mob-icon{font-size:1.25rem;line-height:1}.mob-label{font-size:.55rem;font-weight:500;color:var(--gray-4)}.mob-tab.active .mob-label{color:var(--black);font-weight:700}.mob-badge{position:absolute;top:2px;right:6px;min-width:15px;height:15px;background:var(--red);border-radius:8px;font-size:.5rem;font-weight:700;color:var(--white);display:flex;align-items:center;justify-content:center;border:2px solid var(--white);padding:0 3px}
.sheet-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:299;display:none}.sheet-overlay.open{display:block}.more-sheet{position:fixed;bottom:0;left:0;right:0;z-index:300;background:var(--white);border-radius:20px 20px 0 0;border-top:1px solid var(--gray-2);padding:1rem 1.25rem max(1.5rem,env(safe-area-inset-bottom));transform:translateY(100%);transition:transform .3s ease}.more-sheet.open{transform:translateY(0)}.sheet-handle{width:36px;height:4px;background:var(--gray-3);border-radius:2px;margin:0 auto 1rem}.sheet-title{font-family:var(--font-display);font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-4);margin-bottom:.75rem}.sheet-item{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--gray-1);cursor:pointer;font-size:.88rem;color:var(--gray-5);font-weight:500;transition:color .15s;background:none;border-left:none;border-right:none;border-top:none;width:100%;text-align:left}.sheet-item:last-child{border-bottom:none;padding-bottom:0}.sheet-item:hover{color:var(--black)}.sheet-icon{width:32px;height:32px;border-radius:8px;background:var(--gray-1);display:flex;align-items:center;justify-content:center;font-size:.88rem;flex-shrink:0}.sheet-badge{margin-left:auto;font-size:.58rem;font-weight:700;padding:2px 7px;border-radius:10px;color:var(--white)}
@media(max-width:720px){.topnav{padding:0 1rem}.nav-search{display:none}.page{grid-template-columns:1fr;padding:1.5rem 1rem 5rem}.sidebar{display:none}.stats-grid,.preview-grid{grid-template-columns:repeat(2,1fr)}.vibe-card{gap:.85rem}.mob-bar{display:block}.site-footer{display:none}.quick-actions{justify-content:flex-start}}
`;

function EmptyState({ icon, title, copy }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-copy">{copy}</div>
    </div>
  );
}

export default function DashboardPageComplete() {
  const navigate = useNavigate();
  const { isAuthenticated, user: authUser, setUser, logout } = useAuth();
  const [section, setSection] = useState("overview");
  const [data, setData] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [saveProfileState, setSaveProfileState] = useState(false);
  const [saveLetterState, setSaveLetterState] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const payload = await authAPI.getCurrentUser();
      setData(mapDashboardPayload(payload || {}));
    } catch (err) {
      setData(EMPTY_DASHBOARD);
      setError(err.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;
    loadDashboard();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const q = searchInput.trim().replace(/^@/, "");
    if (!q) {
      setSearchSuggestions([]);
      setSearchLoading(false);
      return undefined;
    }
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        // Search suggestions - using mock data for now
      setSearchSuggestions([]);
      } catch {
        setSearchSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const unreadCount = data.notifications.filter((item) => item.unread).length;
  const filteredNotifications = useMemo(() => {
    const base = [...data.notifications].sort((a, b) => {
      const priority = { red: 3, amber: 2, green: 1, gray: 0 };
      return (priority[b.type] || 0) - (priority[a.type] || 0);
    });
    if (notificationFilter === "all") return base;
    if (notificationFilter === "unread") return base.filter((item) => item.unread);
    if (notificationFilter === "about_me") return base.filter((item) => item.scope === "about_me");
    if (notificationFilter === "watching") return base.filter((item) => item.scope === "watching");
    return base;
  }, [data.notifications, notificationFilter]);

  async function refreshDashboard() {
    setRefreshing(true);
    try {
      const payload = await authAPI.getCurrentUser();
      setData(mapDashboardPayload(payload || {}));
      setError("");
    } catch (err) {
      setError(err.message || "Failed to refresh dashboard.");
    } finally {
      setRefreshing(false);
    }
  }

  function openSection(id) {
    setSection(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function markRead() {
    const previous = data.notifications;
    setData((current) => ({
      ...current,
      notifications: current.notifications.map((item) => ({ ...item, unread: false })),
    }));
    try {
      await authAPI.markAllNotificationsRead();
    } catch (err) {
      setData((current) => ({ ...current, notifications: previous }));
      setError(err.message || "Could not mark notifications as read.");
    }
  }

  async function removeWatch(id) {
    const previous = data.watching;
    setData((current) => ({ ...current, watching: current.watching.filter((item) => item.id !== id) }));
    try {
      await authAPI.removeFromWatchlist(id);
    } catch (err) {
      setData((current) => ({ ...current, watching: previous }));
      setError(err.message || "Could not remove watched handle.");
    }
  }

  async function saveMeProfile() {
    try {
      await authAPI.updateProfile({
        username: data.user.username,
        meProfile: {
          misunderstood: data.user.meProfile?.misunderstood,
          pride: data.user.meProfile?.pride,
        },
      });
      setSaveProfileState(true);
      setTimeout(() => setSaveProfileState(false), 2500);
      setError("");
      // Reload dashboard data to show updated profile
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Could not save profile.");
    }
  }

  async function clearLetter() {
    const ok = typeof window === "undefined" ? true : window.confirm("Clear your letter? Cannot be undone.");
    if (!ok) return;
    const previous = data.user.unsentLetter;
    setData((current) => ({ ...current, user: { ...current.user, unsentLetter: "" } }));
    try {
      await authAPI.updateUnsentLetter("");
    } catch (err) {
      setData((current) => ({ ...current, user: { ...current.user, unsentLetter: previous } }));
      setError(err.message || "Could not clear letter.");
    }
  }

  async function saveLetter() {
    try {
      await authAPI.updateUnsentLetter(data.user.unsentLetter);
      setSaveLetterState(true);
      setTimeout(() => setSaveLetterState(false), 3000);
      // Reload dashboard data to show updated letter
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Could not save letter.");
    }
  }

  async function requestPushPermission() {
    if (!("Notification" in window)) {
      setError("Push not supported in this browser.");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setData((current) => ({ ...current, push: { ...current.push, enabled: true, denied: false, deviceCount: Math.max(current.push.deviceCount, 1) } }));
      } else if (perm === "denied") {
        setData((current) => ({ ...current, push: { ...current.push, denied: true, enabled: false } }));
      }
    } catch {
      setError("Could not enable push notifications.");
    }
  }

  function goSearch(override) {
    const handle = (override || searchInput).trim().replace(/^@/, "");
    if (!handle) return;
    navigate(`${data.quickActions.searchPath || "/search"}?handle=${encodeURIComponent(handle)}`);
  }

  function openShareVibe() {
    if (data.quickActions.vibeCardUrl) {
      navigate(`/vibe/${encodeURIComponent(data.user.username)}`);
      return;
    }
    navigate(`/vibe/${encodeURIComponent(data.user.username)}`);
  }

  const searchDropdownVisible = searchFocused && (searchLoading || searchSuggestions.length > 0);
  const pushEnabled = data.push.enabled;
  const pushDenied = data.push.denied;
  const vibeDirectionLabel = data.user.vibeDirection === "up" ? "Improving" : data.user.vibeDirection === "down" ? "Dropping" : "Stable";

  // Handle logout with navigation
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-shell">
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
            placeholder="search any handle..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
            onKeyDown={(e) => e.key === "Enter" && goSearch()}
          />
          <button className="nav-search-btn" onClick={() => goSearch()}>Search</button>

          {searchDropdownVisible ? (
            <div className="search-dropdown">
              {searchLoading ? (
                <div style={{ padding: "10px 12px", fontSize: ".78rem", color: "var(--gray-5)" }}>Loading suggestions...</div>
              ) : searchSuggestions.length ? (
                searchSuggestions.map((item, idx) => {
                  const handle = item.handle || item.username || `user_${idx}`;
                  const red = Number(item.red ?? item.redCount ?? 0);
                  const green = Number(item.green ?? item.greenCount ?? 0);
                  const score = item.score ?? item.vibeScore ?? Math.round((green / Math.max(red + green, 1)) * 100);
                  const good = Number(score) > 55;
                  return (
                    <button key={item.id || handle} className="search-item" onMouseDown={() => goSearch(handle)}>
                      <div className="search-avatar" style={{ background: item.color || (good ? "#1A9E5F" : "#E2353A") }}>{handle[0]?.toUpperCase()}</div>
                      <div className="search-info">
                        <div className="search-handle">@{handle}</div>
                        <div className="search-meta">{red} red · {green} green flags</div>
                      </div>
                      <span className="search-score" style={{ background: good ? "#F0FFF8" : "#FFF0F0", color: good ? "#1A9E5F" : "#E2353A" }}>{score}%</span>
                    </button>
                  );
                })
              ) : (
                <div style={{ padding: "10px 12px", fontSize: ".78rem", color: "var(--gray-5)" }}>No matches found.</div>
              )}
            </div>
          ) : null}
        </div>

        <div className="nav-right">
          <button className="notif-btn" onClick={() => openSection("notifications")} title="Notifications">
            🔔{unreadCount > 0 ? <span className="notif-dot"></span> : null}
          </button>
          <button className="notif-btn" onClick={handleLogout} title="Sign out">
            🔓 Sign out
          </button>
          <button className="avatar-btn" onClick={() => openSection("settings")}>{data.user.initial}</button>
        </div>
      </header>

      <div className="page-wrap">
        <div className="page">
          <aside className="sidebar">
            <div className="side-user">
              <div className="side-avatar">{data.user.initial}</div>
              <div>
                <div className="side-username">@{data.user.username || "user"}</div>
                <div className="side-score">🟢 {data.user.vibeScore}% vibe score</div>
              </div>
            </div>
            <div className="side-sep"></div>

            <div className="side-group">Main</div>
            <button className={cx("side-item", section === "overview" && "active")} onClick={() => openSection("overview")}><span className="side-icon">⚡</span> Overview</button>
            <button className={cx("side-item", section === "notifications" && "active")} onClick={() => openSection("notifications")}><span className="side-icon">🔔</span> Notifications {unreadCount > 0 ? <span className="side-badge red">{unreadCount}</span> : null}</button>

            <div className="side-group">Activity</div>
            <button className={cx("side-item", section === "my-flags" && "active")} onClick={() => openSection("my-flags")}><span className="side-icon">🚩</span> My flags</button>
            <button className={cx("side-item", section === "watching" && "active")} onClick={() => openSection("watching")}><span className="side-icon">👁</span> Watching</button>
            <button className={cx("side-item", section === "requests" && "active")} onClick={() => openSection("requests")}><span className="side-icon">🙋</span> Flag requests {data.requests.length > 0 ? <span className="side-badge amber">{data.requests.length}</span> : null}</button>

            <div className="side-group">Personal</div>
            <button className={cx("side-item", section === "me-profile" && "active")} onClick={() => openSection("me-profile")}><span className="side-icon">👤</span> Me profile</button>
            <button className={cx("side-item", section === "unsent" && "active")} onClick={() => openSection("unsent")}><span className="side-icon">💌</span> Unsent letter</button>
            <button className={cx("side-item", section === "contract" && "active")} onClick={() => openSection("contract")}><span className="side-icon">🧩</span> API contract</button>

            <div className="side-sep"></div>
            <button className={cx("side-item", section === "settings" && "active")} onClick={() => openSection("settings")}><span className="side-icon">⚙️</span> Settings</button>
            <Link to="/" className="side-item" style={{ color: "var(--gray-4)" }}><span className="side-icon">🏠</span> Back to home</Link>
          </aside>

          <main className="main">
            {loading ? <div className="inline-banner">Loading dashboard...</div> : null}
            {error ? <div className="inline-banner error"><span>{error}</span><button className="small-btn" onClick={refreshDashboard}>{refreshing ? "Refreshing..." : "Refresh"}</button></div> : null}

            <section className={cx("section", section === "overview" && "active")}>
              <div className="page-title">Good morning{data.user.username ? `, @${data.user.username}` : ""} 👋</div>
              <div className="page-sub">Real-time dashboard only. No mock content.</div>

              <div className="quick-actions">
                <button className="quick-action-btn" onClick={() => navigate(data.quickActions.flagPath || "/flag")}>🚩 Flag someone</button>
                <button className="quick-action-btn" onClick={() => goSearch()}>🔎 Search handle</button>
                <button className="quick-action-btn" onClick={openShareVibe} disabled={!data.quickActions.canShareVibeCard && !data.user.username}>🎴 Share my vibe</button>
              </div>

              <div className="searched-banner">
                <div style={{ fontSize: "1.6rem", flexShrink: 0 }}>👀</div>
                <div style={{ flex: 1 }}>
                  <div className="searched-big">{data.overview.searchedThisWeek} {data.overview.searchedThisWeek === 1 ? "person" : "people"}</div>
                  <div className="searched-label">searched your handle this week</div>
                  <div className="searched-chips">
                    {data.overview.searchedBreakdown.length ? data.overview.searchedBreakdown.map((item) => <span key={item} className="searched-chip">{item}</span>) : <span className="searched-chip">No search reasons yet</span>}
                  </div>
                </div>
                <button className="primary-btn" onClick={() => openSection("notifications")}>See details →</button>
              </div>

              <div className="preview-grid">
                <div className="mini-card">
                  <div className="card-title">Top recent searches</div>
                  {data.searchPreview.items.length ? data.searchPreview.items.slice(0, 3).map((item) => (
                    <div className="preview-row" key={item.id}>
                      <div>
                        <div className="preview-handle">@{item.handle || "anonymous"}</div>
                        <div className="preview-sub">{item.reason}</div>
                      </div>
                      <div className="preview-sub">{item.when}</div>
                    </div>
                  )) : <EmptyState icon="🫥" title="No recent search previews" copy="When people search your handle, the latest preview rows will appear here." />}
                </div>

                <div className="mini-card">
                  <div className="card-title">Reputation movement</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".75rem" }}>
                    <div style={{ fontSize: ".8rem", color: "var(--gray-5)" }}>{data.reputationMovement.periodLabel}</div>
                    <div className={cx("movement-delta", data.reputationMovement.netDelta > 0 ? "up" : data.reputationMovement.netDelta < 0 ? "down" : "neutral")}>{data.reputationMovement.netDelta > 0 ? "+" : ""}{data.reputationMovement.netDelta}</div>
                  </div>
                  {data.reputationMovement.items.length ? data.reputationMovement.items.slice(0, 3).map((item) => (
                    <div className="movement-item" key={item.id}>
                      <div className={cx("movement-icon", item.direction)}>{item.direction === "up" ? "↗" : item.direction === "down" ? "↘" : "•"}</div>
                      <div className="movement-copy">
                        <div className="movement-title">{item.label}</div>
                        <div className="movement-detail">{item.detail}</div>
                      </div>
                      <div className={cx("movement-delta", item.direction)}>{item.delta > 0 ? "+" : ""}{item.delta}</div>
                    </div>
                  )) : <EmptyState icon="📈" title="No movement yet" copy="As your reputation changes, the exact drivers will appear here." />}
                </div>
              </div>

              <div className="verification-card">
                <div className="ver-top">
                  <div>
                    <div className="ver-title">Verification / post limit</div>
                    <div className="ver-copy">
                      {data.user.emailVerified
                        ? "Your email is verified. You can post without the starter limit."
                        : "Quick onboarding is on. Unverified users can post up to 5 times. Verify email to unlock unlimited posting."}
                    </div>
                  </div>
                  <span className={cx("ver-status", data.user.emailVerified ? "ok" : "warn")}>{data.user.emailVerified ? "Verified" : "Unverified"}</span>
                </div>
                <div className="limit-bar"><div className="limit-fill" style={{ width: `${Math.min(100, (data.user.postCount / Math.max(data.user.postLimit, 1)) * 100)}%` }}></div></div>
                <div className="limit-meta"><span>{data.user.postCount} / {data.user.postLimit} starter posts used</span><span>{Math.max(0, data.user.postLimit - data.user.postCount)} left</span></div>
                {!data.user.emailVerified ? <button className="small-btn" onClick={() => navigate("/auth?mode=verify-email-sent")}>Verify email →</button> : null}
              </div>

              <div className="vibe-card">
                <div className="vibe-ring" style={{ background: `conic-gradient(var(--green) 0% ${data.user.vibeScore}%,var(--red) ${data.user.vibeScore}% 100%)` }}>
                  <div className="vibe-inner"><span className="vibe-num" style={{ color: data.user.vibeScore >= 50 ? "var(--green)" : "var(--red)" }}>{data.user.vibeScore}%</span><span className="vibe-pct">green</span></div>
                </div>
                <div className="vibe-info">
                  <div className="vibe-eyebrow">Your vibe score</div>
                  <div className="vibe-verdict">{vibeDirectionLabel}</div>
                  <div className="vibe-sub">Based on {data.overview.totalFlagsOnMe} flags from people who've interacted with you. Net {data.user.vibeDirection === "up" ? "up" : data.user.vibeDirection === "down" ? "down" : "change"} {Math.abs(data.user.vibeDelta)} this week.</div>
                </div>
                <div className="vibe-btns">
                  <button className="vibe-btn" onClick={() => openSection("my-flags")}>View my flags</button>
                  <button className="vibe-btn" onClick={openShareVibe}>Share vibe card 🎴</button>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-box" onClick={() => openSection("my-flags")}><span className="stat-num">{data.overview.totalFlagsOnMe}</span><span className="stat-label">Total flags on me</span><span className="stat-note note-neu">{data.overview.flagsOnMeBreakdown}</span></div>
                <div className="stat-box" onClick={() => openSection("watching")}><span className="stat-num">{data.watching.length}</span><span className="stat-label">Watching</span><span className="stat-note note-up">{data.overview.watchingNote}</span></div>
                <div className="stat-box" onClick={() => openSection("notifications")}><span className="stat-num" style={{ color: "var(--red)" }}>{data.overview.searchedThisWeek}</span><span className="stat-label">Searches this week</span><span className="stat-note note-up">{data.searchPreview.total} previewable</span></div>
                <div className="stat-box" onClick={() => openSection("requests")}><span className="stat-num" style={{ color: "var(--amber)" }}>{data.requests.length}</span><span className="stat-label">Flag requests</span><span className="stat-note note-amber">{data.overview.requestNote}</span></div>
              </div>

              <div className="card">
                <div className="card-title">Recent activity</div>
                {data.notifications.length ? data.notifications.slice(0, 4).map((item) => (
                  <div key={item.id} className="notif-item">
                    <div className={cx("notif-icon", item.type, item.unread && "unread")}>{item.type === "red" ? "🚩" : item.type === "green" ? "🟢" : item.type === "amber" ? "👀" : "💬"}</div>
                    <div><div className="notif-text"><strong>{item.text.split(" — ")[0]}</strong>{item.text.includes(" — ") ? ` — ${item.text.split(" — ").slice(1).join(" — ")}` : ""}</div><div className="notif-time">{item.time}</div></div>
                  </div>
                )) : <EmptyState icon="✨" title="No recent activity" copy="Your newest notifications and changes will show up here first." />}
              </div>
            </section>

            <section className={cx("section", section === "notifications" && "active")}>
              <div className="page-title">Notifications</div>
              <div className="page-sub">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up ✓"} · <span style={{ color: "var(--black)", fontWeight: 500, cursor: "pointer", textDecoration: "underline" }} onClick={markRead}>Mark all read</span></div>
              <div className="filter-row">
                {[["all", "All"],["unread", "Unread"],["about_me", "About me"],["watching", "Watching"]].map(([id, label]) => (
                  <button key={id} className={cx("filter-pill", notificationFilter === id && "active")} onClick={() => setNotificationFilter(id)}>{label}</button>
                ))}
              </div>
              <div className="card">
                <div className="card-title">Filtered notifications</div>
                {filteredNotifications.length ? filteredNotifications.map((item) => (
                  <div key={item.id} className="notif-item">
                    <div className={cx("notif-icon", item.type, item.unread && "unread")}>{item.type === "red" ? "🚩" : item.type === "green" ? "🟢" : item.type === "amber" ? "👀" : "💬"}</div>
                    <div><div className="notif-text"><strong>{item.text.split(" — ")[0]}</strong>{item.text.includes(" — ") ? ` — ${item.text.split(" — ").slice(1).join(" — ")}` : ""}</div><div className="notif-time">{item.time}</div></div>
                  </div>
                )) : <EmptyState icon="🔔" title="No notifications here" copy="Try another filter or come back when something changes." />}
              </div>
            </section>

            <section className={cx("section", section === "my-flags" && "active")}>
              <div className="page-title">My flags</div>
              <div className="page-sub">Flags on your handle · flags you've posted</div>
              <div className="card">
                <div className="card-title">Flags on @{data.user.username || "you"} ({data.flagsOnMe.length})</div>
                {data.flagsOnMe.length ? data.flagsOnMe.map((item) => (
                  <div className="flag-row" key={item.id}>
                    <div className={cx("flag-dot", item.type)}></div>
                    <div className="flag-body">
                      <div className="flag-handle">{item.type === "red" ? "Red flag" : "Green flag"} on @{item.handle}</div>
                      <div className="flag-snippet">{item.snippet}</div>
                      <div className="flag-tags">{safeArray(item.tags).map((tag) => <span key={tag} className={cx("tag", tag.includes("Red") ? "red" : tag.includes("Green") ? "green" : "gray")}>{tag}</span>)}</div>
                    </div>
                    <div className="flag-time">{item.time}</div>
                  </div>
                )) : <EmptyState icon="🫥" title="No flags on you yet" copy="When people post about your handle, those entries will appear here." />}
              </div>
              <div className="card">
                <div className="card-title">Flags I posted ({data.flagsPosted.length})</div>
                {data.flagsPosted.length ? data.flagsPosted.map((item) => (
                  <div className="flag-row" key={item.id}>
                    <div className={cx("flag-dot", item.type)}></div>
                    <div className="flag-body">
                      <div className="flag-handle">@{item.handle} · {item.type === "red" ? "Red flag" : "Green flag"}</div>
                      <div className="flag-snippet">{item.snippet}</div>
                      <div className="flag-tags">{safeArray(item.tags).map((tag) => <span key={tag} className={cx("tag", tag.includes("Love") || tag.includes("Ghost") ? "red" : tag.includes("Genuine") ? "green" : "gray")}>{tag}</span>)}</div>
                    </div>
                    <div className="flag-time">{item.time}</div>
                  </div>
                )) : <EmptyState icon="✍️" title="You haven’t posted any flags yet" copy="When you contribute to the community, those posts will appear here." />}
              </div>
            </section>

            <section className={cx("section", section === "watching" && "active")}>
              <div className="page-title">Watching</div>
              <div className="page-sub">{data.watching.length} handles · notified when new flags drop</div>
              <div className="card">
                <div className="card-title">Handles you're watching ({data.watching.length} / 5)</div>
                {data.watching.length ? data.watching.map((item) => (
                  <div className="watch-row" key={item.id}>
                    <div className="watch-avatar" style={{ background: item.avatar || "linear-gradient(135deg,#0C0C0A,#5E5D58)" }}>{item.initial || item.handle?.[0]?.toUpperCase() || "?"}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="watch-handle">@{item.handle}</div>
                      <div className="watch-meta">{item.red} red · {item.green} green · Last flag {item.lastFlag}</div>
                      {item.riskAlert ? <div className="watch-alert">⚠ {item.riskAlert}</div> : null}
                    </div>
                    <span className={cx("watch-score", item.score > 55 ? "green" : "red")}>{item.score > 55 ? "🟢" : "🚩"} {item.score}%</span>
                    <button className="unwatch-btn" onClick={() => removeWatch(item.id)}>Unwatch</button>
                  </div>
                )) : <EmptyState icon="👁" title="You’re not watching anyone yet" copy="Track handles you’re unsure about and get updates when new flags drop." />}
              </div>
            </section>

            <section className={cx("section", section === "requests" && "active")}>
              <div className="page-title">Flag requests</div>
              <div className="page-sub">Community asking for receipts on handles you might know</div>
              <div className="card">
                <div className="card-title">Open requests ({data.requests.length})</div>
                {data.requests.length ? data.requests.map((item) => (
                  <div className="req-box" key={item.id}>
                    <div className="req-top"><span className="req-handle">@{item.handle}</span><span className="req-why">{item.why}</span></div>
                    <div className="req-text">{item.text}</div>
                    <button className="req-btn" onClick={() => navigate(`/flag?handle=${encodeURIComponent(item.handle)}`)}>Flag this handle →</button>
                  </div>
                )) : <EmptyState icon="🙋" title="No open requests" copy="When the community asks for help on a handle you might know, those requests will show up here." />}
              </div>
              <div className="card" style={{ background: "var(--gray-1)", borderColor: "var(--gray-2)" }}>
                <p style={{ fontSize: ".82rem", color: "var(--gray-5)", lineHeight: 1.6 }}><strong style={{ color: "var(--black)", display: "block", marginBottom: 4 }}>Post your own flag request</strong>Going on a date? Meeting someone for shaadi? Post a request and let the community share experiences.</p>
                <button className="primary-btn" style={{ marginTop: ".85rem" }}>+ Post a request</button>
              </div>
            </section>

            <section className={cx("section", section === "me-profile" && "active")}>
              <div className="page-title">Me profile</div>
              <div className="page-sub">Your voluntary self-introduction — visible on your handle's search page</div>
              <div className="card">
                <div className="card-title">Your Clocked username</div>
                <label className="me-label">Username (shown when you post publicly)</label>
                <div style={{ position: "relative" }}>
                  <input className="me-input" type="text" value={data.user.username} onChange={(e) => setData((current) => ({ ...current, user: { ...current.user, username: e.target.value } }))} style={{ paddingLeft: 26 }} />
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--gray-4)", fontWeight: 700, fontFamily: "var(--font-display)", fontSize: ".9rem" }}>@</span>
                </div>
              </div>
              <div className="card">
                <div className="card-title">Your story — shown publicly</div>
                <label className="me-label">What people often misunderstand about you</label>
                <textarea className="me-textarea" maxLength={300} value={data.user.meProfile.misunderstood} onChange={(e) => setData((current) => ({ ...current, user: { ...current.user, meProfile: { ...current.user.meProfile, misunderstood: e.target.value } } }))}></textarea>
                <div className="me-hint">{data.user.meProfile.misunderstood.length} / 300 characters</div>
                <label className="me-label">What you genuinely pride yourself on</label>
                <textarea className="me-textarea" maxLength={300} value={data.user.meProfile.pride} onChange={(e) => setData((current) => ({ ...current, user: { ...current.user, meProfile: { ...current.user.meProfile, pride: e.target.value } } }))}></textarea>
                <div className="me-hint">{data.user.meProfile.pride.length} / 300 characters</div>
                <div style={{ display: "flex", alignItems: "center", marginTop: ".5rem" }}>
                  <button className="save-btn" onClick={saveMeProfile}>Save profile</button>
                  <span className={cx("save-ok", saveProfileState && "show")}>✓ Saved!</span>
                </div>
              </div>
              <div className="card" style={{ background: data.user.profileCompleted ? "var(--green-light)" : "var(--amber-light)", borderColor: data.user.profileCompleted ? "var(--green-mid)" : "var(--amber-mid)" }}>
                <p style={{ fontSize: ".82rem", color: "var(--black)", lineHeight: 1.6 }}><strong style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>{data.user.profileCompleted ? "🟢 Profile completed" : "⚠ Profile incomplete"}</strong>{data.user.profileCompleted ? "Self-aware badge earned. Your profile is complete and visible with stronger trust signals." : "Complete your Me profile to add more trust and context to your public handle page."}</p>
              </div>
            </section>

            <section className={cx("section", section === "unsent" && "active")}>
              <div className="page-title">Unsent letter</div>
              <div className="page-sub">Say what you never could. Only you can see this. Ever.</div>
              <div className="card">
                <div className="private-badge">🔒 Private · Only visible to you · Never published</div>
                <textarea className="letter-area" value={data.user.unsentLetter} onChange={(e) => setData((current) => ({ ...current, user: { ...current.user, unsentLetter: e.target.value } }))} placeholder={`Dear ___,\n\nThere's something I've been wanting to say...`}></textarea>
                <div className="letter-footer">
                  <div className="letter-note">🔒 Completely private. Clocked staff cannot read it. Never shared under any circumstances.</div>
                  <div className="letter-btns">
                    <button className="letter-clear" onClick={clearLetter}>Clear</button>
                    <button className="letter-save" onClick={saveLetter}>Save →</button>
                  </div>
                </div>
                <div className={cx("letter-saved", saveLetterState && "show")}>✓ Saved privately. Only you can see this.</div>
              </div>
            </section>

            <section className={cx("section", section === "contract" && "active")}>
              <div className="page-title">API contract</div>
              <div className="page-sub">Exact `/api/dashboard` shape expected by this strict real-data dashboard.</div>
              <div className="card">
                <div className="card-title">Contract</div>
                <div className="code-box">{JSON.stringify(DASHBOARD_CONTRACT, null, 2)}</div>
              </div>
            </section>

            <section className={cx("section", section === "settings" && "active")}>
              <div className="page-title">Settings</div>
              <div className="page-sub">Manage your account and preferences</div>
              <div className="card">
                <div className="card-title">Account</div>
                <div className="setting-row"><div><div className="setting-label">Email address</div><div className="setting-sub">{data.user.email || "No email on file"}</div></div><button className="ghost-btn">Change</button></div>
                <div className="setting-row"><div><div className="setting-label">Password</div><div className="setting-sub">Managed securely</div></div><button className="ghost-btn">Change</button></div>
                <div className="setting-row"><div><div className="setting-label">Username</div><div className="setting-sub">@{data.user.username || "user"}</div></div><button className="ghost-btn">Change</button></div>
              </div>

              <div className="card">
                <div className="card-title">📧 Email notifications</div>
                {[["emailSearches","Someone searched my handle","Email when someone searches your @, with reason"],["emailNewFlags","New flag on my handle","Email when a red or green flag is posted on you"],["emailWatched","Watched handle activity","Email when a handle you're watching gets a new flag"],["emailReplies","Flag reply","Email when someone replies to a flag you posted"],["emailWeeklyRadar","Weekly radar","Monday summary — your stats, watched handles, community"],["emailNearbyRequests","Flag requests near me","Requests from people in your city"]].map(([key, label, sub]) => (
                  <div className="setting-row" key={key}>
                    <div><div className="setting-label">{label}</div><div className="setting-sub">{sub}</div></div>
                    <label className="toggle"><input type="checkbox" checked={Boolean(data.user.settings[key])} onChange={(e) => setData((current) => ({ ...current, user: { ...current.user, settings: { ...current.user.settings, [key]: e.target.checked } } }))} /><span className="toggle-track"></span></label>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-title">🔔 Push notifications</div>
                {!pushEnabled && !pushDenied ? (
                  <div style={{ background: "var(--black)", borderRadius: "var(--radius-sm)", padding: "1rem 1.1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: ".85rem", fontWeight: 700, color: "var(--white)", marginBottom: 3 }}>Enable push notifications</div>
                      <div style={{ fontSize: ".75rem", color: "rgba(255,255,255,.5)", lineHeight: 1.45 }}>Get instant alerts on your phone or browser — even when Clocked isn't open.</div>
                    </div>
                    <button onClick={requestPushPermission} style={{ fontFamily: "var(--font-display)", fontSize: ".78rem", fontWeight: 700, background: "var(--white)", color: "var(--black)", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 16px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>Enable push →</button>
                  </div>
                ) : null}

                {pushEnabled ? (
                  <div style={{ background: "var(--green-light)", border: "1px solid var(--green-mid)", borderRadius: "var(--radius-sm)", padding: ".75rem 1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8, fontSize: ".78rem", color: "var(--black)" }}>
                    <span>✅</span>
                    <div style={{ flex: 1 }}>Push notifications enabled · <strong>{data.push.deviceCount} device</strong></div>
                  </div>
                ) : null}

                {pushDenied ? (
                  <div style={{ background: "var(--gray-1)", border: "1px solid var(--gray-2)", borderRadius: "var(--radius-sm)", padding: ".75rem 1rem", marginBottom: "1rem", fontSize: ".78rem", color: "var(--gray-5)", lineHeight: 1.5 }}>
                    ⚠️ Push notifications blocked by your browser. To enable, click the lock icon in your browser address bar and allow notifications.
                  </div>
                ) : null}

                <div style={{ opacity: pushEnabled ? 1 : .4, pointerEvents: pushEnabled ? "auto" : "none", transition: "opacity .2s" }}>
                  {[["pushSearches","Someone searched my handle","Instant push — the main FOMO driver"],["pushNewFlags","New flag on my handle","Red or green — know immediately"],["pushWatched","Watched handle activity","New flag on a handle you're watching"],["pushReplies","Flag reply","Someone replied to your flag"],["pushBothSides","Both sides response","Handle owner responded to your flag"],["pushChallengeMode","Challenge mode updates","Live counter updates during your 48h challenge"],["pushChallengeResult","Challenge result","Final tally when your challenge ends"]].map(([key, label, sub]) => (
                    <div className="setting-row" key={key}>
                      <div><div className="setting-label">{label}</div><div className="setting-sub">{sub}</div></div>
                      <label className="toggle"><input type="checkbox" checked={Boolean(data.user.settings[key])} onChange={(e) => setData((current) => ({ ...current, user: { ...current.user, settings: { ...current.user.settings, [key]: e.target.checked } } }))} /><span className="toggle-track"></span></label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-title">Posting defaults</div>
                <div className="setting-row"><div><div className="setting-label">Post anonymously by default</div><div className="setting-sub">Change on any individual flag anytime</div></div><label className="toggle"><input type="checkbox" checked={Boolean(data.user.settings.anonymousDefault)} onChange={(e) => setData((current) => ({ ...current, user: { ...current.user, settings: { ...current.user.settings, anonymousDefault: e.target.checked } } }))} /><span className="toggle-track"></span></label></div>
              </div>

              <div className="card">
                <div className="card-title">Legal & privacy</div>
                <div className="setting-row"><div><div className="setting-label">Terms of Service</div><div className="setting-sub">Read our full terms</div></div><Link to="/terms" className="ghost-btn">View →</Link></div>
                <div className="setting-row"><div><div className="setting-label">Grievance & takedowns</div><div className="setting-sub">Request a flag removal or report an issue</div></div><Link to="/grievance" className="ghost-btn">View →</Link></div>
                <div className="setting-row"><div><div className="setting-label" style={{ color: "var(--red)" }}>Delete account</div><div className="setting-sub">Permanently delete account and all data.</div></div><button className="danger-btn">Delete</button></div>
              </div>
              <div style={{ textAlign: "center", padding: "1rem 0" }}><Link to="/auth" style={{ fontSize: ".82rem", color: "var(--gray-4)", textDecoration: "underline" }}>Log out</Link></div>
            </section>
          </main>
        </div>

        <footer className="site-footer">
          <span className="footer-copy">© 2025 Clocked. Community-powered receipts.</span>
          <div className="footer-links">
            <Link to="/terms" className="footer-link">Terms</Link>
            <Link to="/privacy" className="footer-link">Privacy</Link>
            <Link to="/guidelines" className="footer-link">Guidelines</Link>
            <Link to="/grievance" className="footer-report">🛡️ Report / Takedown</Link>
          </div>
        </footer>
      </div>

      <div className="mob-bar">
        <div className="mob-tabs">
          <button className={cx("mob-tab", section === "overview" && "active")} onClick={() => openSection("overview")}><span className="mob-icon">⚡</span><span className="mob-label">Home</span></button>
          <button className={cx("mob-tab", section === "notifications" && "active")} onClick={() => openSection("notifications")}><span className="mob-icon">🔔</span><span className="mob-label">Alerts</span>{unreadCount > 0 ? <span className="mob-badge">{unreadCount}</span> : null}</button>
          <button className={cx("mob-tab", section === "my-flags" && "active")} onClick={() => openSection("my-flags")}><span className="mob-icon">🚩</span><span className="mob-label">My flags</span></button>
          <button className={cx("mob-tab", section === "watching" && "active")} onClick={() => openSection("watching")}><span className="mob-icon">👁</span><span className="mob-label">Watching</span></button>
          <button className="mob-tab" onClick={() => setMobileMenuOpen(true)}><span className="mob-icon">☰</span><span className="mob-label">More</span></button>
        </div>
      </div>

      <div className={cx("sheet-overlay", mobileMenuOpen && "open")} onClick={() => setMobileMenuOpen(false)}></div>
      <div className={cx("more-sheet", mobileMenuOpen && "open")}>
        <div className="sheet-handle"></div>
        <div className="sheet-title">More</div>
        <button className="sheet-item" onClick={() => openSection("requests")}><div className="sheet-icon">🙋</div>Flag requests{data.requests.length ? <span className="sheet-badge" style={{ background: "var(--amber)", marginLeft: "auto" }}>{data.requests.length}</span> : null}</button>
        <button className="sheet-item" onClick={() => openSection("me-profile")}><div className="sheet-icon">👤</div>Me profile</button>
        <button className="sheet-item" onClick={() => openSection("unsent")}><div className="sheet-icon">💌</div>Unsent letter</button>
        <button className="sheet-item" onClick={() => openSection("contract")}><div className="sheet-icon">🧩</div>API contract</button>
        <button className="sheet-item" onClick={() => openSection("settings")}><div className="sheet-icon">⚙️</div>Settings</button>
        <button className="sheet-item" onClick={() => navigate("/")}><div className="sheet-icon">🏠</div>Back to home</button>
      </div>
    </div>
  );
}
