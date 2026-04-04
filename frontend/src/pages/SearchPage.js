import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5004/api";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('clocked_token');
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
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
  --red: #E2353A; --red-light: #FFF0F0; --red-mid: #FFBDBE;
  --green: #1A9E5F; --green-light: #F0FFF8; --green-mid: #A3E6C8;
  --black: #0C0C0A; --off-white: #F8F7F3;
  --gray-1: #F2F1EC; --gray-2: #E5E4DE; --gray-3: #CCCBC4;
  --gray-4: #9E9D97; --gray-5: #5E5D58; --white: #FFFFFF;
  --radius: 14px; --radius-sm: 8px;
}
.searchpage-shell { font-family: 'DM Sans', sans-serif; background: var(--off-white); color: var(--black); min-height: 100vh; }
.searchpage-shell button, .searchpage-shell input, .searchpage-shell textarea, .searchpage-shell select { font-family: inherit; }
.searchpage-shell nav {
  position: sticky; top: 0; z-index: 100;
  height: 56px; display: flex; align-items: center;
  justify-content: space-between; padding: 0 2rem;
  background: rgba(248,247,243,0.92);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--gray-2);
}
.nav-logo { font-family: 'Syne', sans-serif; font-size: 1.2rem; font-weight: 800; letter-spacing: -.5px; color: var(--black); text-decoration: none; display: flex; align-items: center; gap: 8px; }
.logo-flags { display: flex; gap: 4px; align-items: center; }
.flag-shape { width: 9px; height: 15px; clip-path: polygon(0 0,100% 15%,100% 85%,0 100%); display: block; }
.flag-r { background: var(--red); } .flag-g { background: var(--green); }
.nav-search {
  display: flex; align-items: center;
  background: var(--white); border: 1.5px solid var(--gray-3);
  border-radius: 30px; padding: 5px 5px 5px 16px;
  gap: 6px; flex: 1; max-width: 340px; margin: 0 2rem;
  transition: border-color .15s; position: relative;
}
.nav-search:focus-within { border-color: var(--black); }
.nav-at { font-family: 'Syne', sans-serif; font-size: .85rem; font-weight: 700; color: var(--gray-4); }
.nav-search-input { flex: 1; border: none; outline: none; background: transparent; font-size: .88rem; color: var(--black); min-width: 0; }
.nav-search-input::placeholder { color: var(--gray-4); }
.nav-search-btn { background: var(--black); color: var(--white); border: none; border-radius: 20px; padding: 6px 14px; font-size: .75rem; font-weight: 700; cursor: pointer; font-family: 'Syne', sans-serif; white-space: nowrap; }
.nav-right { display: flex; gap: 8px; align-items: center; }
.btn-ghost { font-size: .8rem; font-weight: 500; color: var(--gray-5); background: none; border: 1px solid var(--gray-3); border-radius: 30px; padding: 5px 14px; cursor: pointer; text-decoration: none; transition: all .15s; }
.btn-ghost:hover { border-color: var(--black); color: var(--black); }
.btn-solid { font-size: .8rem; font-weight: 600; color: var(--white); background: var(--black); border: 1px solid var(--black); border-radius: 30px; padding: 5px 16px; cursor: pointer; text-decoration: none; }
.search-suggestions {
  position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: white; border: 1px solid var(--gray-2); border-radius: var(--radius); box-shadow: 0 12px 40px rgba(0,0,0,.12); overflow: hidden; z-index: 110;
}
.suggest-btn { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: none; background: white; text-align: left; cursor: pointer; border-bottom: 1px solid var(--gray-1); }
.suggest-btn:last-child { border-bottom: none; }
.suggest-btn:hover { background: var(--gray-1); }
.suggest-avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-family: 'Syne', sans-serif; font-weight: 800; font-size: .82rem; flex-shrink: 0; }
.suggest-info { flex: 1; min-width: 0; }
.suggest-handle { font-size: .86rem; font-weight: 600; color: var(--black); }
.suggest-meta { font-size: .68rem; color: var(--gray-4); margin-top: 1px; }
.suggest-score { font-size: .68rem; font-weight: 700; border-radius: 20px; padding: 3px 9px; }
.why-banner {
  background: var(--black); color: var(--white);
  padding: .6rem 2rem; font-size: .78rem;
  display: flex; align-items: center; gap: 8px;
  justify-content: center; flex-wrap: wrap;
}
.why-banner strong { font-weight: 600; }
.why-chip {
  background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
  border-radius: 20px; padding: 2px 10px; font-size: .72rem; font-weight: 500;
}
.why-change { font-size: .72rem; color: rgba(255,255,255,.5); cursor: pointer; text-decoration: underline; margin-left: 4px; background: none; border: none; }
.why-options { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; width: 100%; margin-top: 6px; }
.why-option { border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.08); color: white; border-radius: 20px; padding: 3px 10px; font-size: .7rem; cursor: pointer; }
.why-option.active { background: white; color: black; }
.page { max-width: 960px; margin: 0 auto; padding: 2rem 2rem 5rem; display: grid; grid-template-columns: 1fr 300px; gap: 2rem; align-items: start; }
.profile-card {
  background: var(--white); border: 1px solid var(--gray-2);
  border-radius: var(--radius); padding: 1.5rem;
  margin-bottom: 1.25rem;
}
.profile-top { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 1.25rem; }
.profile-avatar {
  width: 64px; height: 64px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 800;
  color: var(--white);
}
.profile-info { flex: 1; min-width: 0; }
.profile-handle { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 800; letter-spacing: -.5px; color: var(--black); margin-bottom: 3px; }
.profile-meta { font-size: .78rem; color: var(--gray-4); display: flex; gap: 10px; flex-wrap: wrap; }
.profile-meta span { display: flex; align-items: center; gap: 3px; }
.profile-actions { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.action-btn {
  font-size: .75rem; font-weight: 500;
  padding: 6px 14px; border-radius: 20px; cursor: pointer; transition: all .15s; border: 1px solid var(--gray-3); background: var(--gray-1); color: var(--gray-5);
}
.action-btn:hover { border-color: var(--black); color: var(--black); background: var(--white); }
.action-btn.watching { background: var(--black); color: var(--white); border-color: var(--black); }
.action-btn.flag-red { background: var(--red-light); color: var(--red); border-color: var(--red-mid); }
.action-btn.flag-red:hover { background: var(--red); color: var(--white); }
.action-btn.flag-green { background: var(--green-light); color: var(--green); border-color: var(--green-mid); }
.action-btn.flag-green:hover { background: var(--green); color: var(--white); }
.vibe-row {
  display: grid; grid-template-columns: auto 1fr auto; gap: 1.25rem;
  align-items: center; padding: 1.25rem;
  background: var(--gray-1); border-radius: var(--radius-sm);
  margin-bottom: 1rem;
}
.score-ring-wrap { position: relative; width: 72px; height: 72px; flex-shrink: 0; }
.score-ring {
  width: 72px; height: 72px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.score-inner {
  width: 54px; height: 54px; border-radius: 50%;
  background: var(--gray-1);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-family: 'Syne', sans-serif;
}
.score-num { font-size: 1rem; font-weight: 800; line-height: 1; }
.score-pct { font-size: .55rem; color: var(--gray-4); font-weight: 500; }
.score-label { font-family: 'Syne', sans-serif; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--gray-4); margin-bottom: 4px; }
.score-verdict { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 800; margin-bottom: 3px; }
.score-sub { font-size: .75rem; color: var(--gray-5); line-height: 1.4; }
.flag-counts { display: flex; flex-direction: column; gap: 6px; }
.flag-count-item { display: flex; align-items: center; gap: 8px; }
.flag-count-bar-wrap { flex: 1; height: 5px; background: var(--gray-2); border-radius: 3px; overflow: hidden; }
.flag-count-bar { height: 100%; border-radius: 3px; }
.flag-count-bar.red { background: var(--red); }
.flag-count-bar.green { background: var(--green); }
.flag-count-num { font-family: 'Syne', sans-serif; font-size: .8rem; font-weight: 700; min-width: 20px; text-align: right; }
.flag-count-label { font-size: .68rem; color: var(--gray-4); min-width: 56px; }
.pattern-alert {
  background: var(--red-light); border: 1px solid var(--red-mid);
  border-radius: var(--radius-sm); padding: .9rem 1rem;
  margin-bottom: 1rem; display: flex; gap: 10px; align-items: flex-start;
}
.pattern-icon { font-size: 1.1rem; flex-shrink: 0; }
.pattern-text { font-size: .8rem; color: var(--black); line-height: 1.5; }
.pattern-text strong { display: block; font-weight: 600; margin-bottom: 2px; }
.searched-card {
  background: var(--white); border: 1px solid var(--gray-2);
  border-radius: var(--radius-sm); padding: .9rem 1rem;
  margin-bottom: 1rem; display: flex; gap: 10px; align-items: center;
}
.searched-icon { font-size: 1rem; flex-shrink: 0; }
.searched-text { font-size: .8rem; color: var(--gray-5); line-height: 1.4; }
.searched-text strong { color: var(--black); font-weight: 500; }
.tabs-row { display: flex; gap: 4px; margin-bottom: 1rem; background: var(--gray-1); border-radius: 30px; padding: 4px; flex-wrap: wrap; }
.tab-btn { flex: 1; font-size: .78rem; font-weight: 500; border: none; background: none; border-radius: 24px; padding: 7px 10px; cursor: pointer; color: var(--gray-5); transition: all .15s; text-align: center; min-width: 120px; }
.tab-btn.active { background: var(--white); color: var(--black); box-shadow: 0 1px 4px rgba(0,0,0,.08); }
.flag-card {
  background: var(--white); border: 1px solid var(--gray-2);
  border-radius: var(--radius); padding: 1rem 1.25rem;
  margin-bottom: 10px; transition: all .15s;
}
.flag-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.06); transform: translateY(-1px); }
.flag-card.red-card { border-left: 3px solid var(--red); }
.flag-card.green-card { border-left: 3px solid var(--green); }
.flag-card.expired { opacity: .45; border-left-color: var(--gray-3); background: var(--gray-1); }
.flag-card.expired:hover { transform: none; box-shadow: none; }
.expired-badge { font-size: .62rem; font-weight: 600; padding: 2px 8px; border-radius: 20px; background: var(--gray-2); color: var(--gray-4); border: 1px solid var(--gray-3); }
.flag-card.disputed { border-left-color: #F59E0B; border-left-width: 3px; }
.disputed-badge { font-size: .62rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; display: flex; align-items: center; gap: 4px; }
.disputed-note { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: var(--radius-sm); padding: 8px 10px; font-size: .75rem; color: #92400E; line-height: 1.45; margin-bottom: 8px; }
.flag-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--gray-1); flex-wrap: wrap; }
.flag-actions-left { display: flex; align-items: center; gap: 6px; }
.know-btn { font-size: .7rem; font-weight: 500; color: var(--gray-5); background: var(--gray-1); border: 1px solid var(--gray-2); border-radius: 20px; padding: 4px 10px; cursor: pointer; transition: all .15s; display: flex; align-items: center; gap: 4px; }
.know-btn:hover { border-color: var(--black); color: var(--black); background: var(--white); }
.know-btn.known { background: var(--black); color: var(--white); border-color: var(--black); }
.know-count { font-size: .68rem; color: var(--gray-4); font-weight: 500; }
.share-flag-btn { font-size: .7rem; font-weight: 500; color: var(--gray-4); background: none; border: none; cursor: pointer; transition: color .15s; display: flex; align-items: center; gap: 4px; padding: 4px 6px; border-radius: 20px; }
.share-flag-btn:hover { color: var(--black); background: var(--gray-1); }
.share-toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%) translateY(80px); background: var(--black); color: var(--white); font-size: .82rem; font-weight: 500; padding: 10px 20px; border-radius: 30px; z-index: 999; transition: transform .3s ease; white-space: nowrap; pointer-events: none; }
.share-toast.show { transform: translateX(-50%) translateY(0); }
.flag-top { display: flex; align-items: center; gap: 7px; margin-bottom: 6px; flex-wrap: wrap; }
.flag-type-badge { font-size: .7rem; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
.flag-type-badge.red { background: var(--red-light); color: var(--red); }
.flag-type-badge.green { background: var(--green-light); color: var(--green); }
.flag-cat { font-size: .72rem; font-weight: 500; color: var(--gray-5); background: var(--gray-1); border: 1px solid var(--gray-2); padding: 2px 8px; border-radius: 20px; }
.flag-anon { font-size: .68rem; color: var(--gray-4); background: var(--gray-1); border-radius: 20px; padding: 2px 8px; display: flex; align-items: center; gap: 3px; margin-left: auto; }
.flag-weight { font-size: .65rem; color: var(--gray-4); display: flex; align-items: center; gap: 3px; }
.weight-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--green); }
.weight-dot.med { background: #F59E0B; }
.weight-dot.low { background: var(--gray-3); }
.flag-comment { font-size: .88rem; color: var(--black); line-height: 1.6; margin-bottom: 8px; }
.flag-meta-row { display: flex; gap: 10px; font-size: .7rem; color: var(--gray-4); flex-wrap: wrap; margin-bottom: 8px; }
.reply-wrap { border-top: 1px solid var(--gray-1); padding-top: 10px; margin-top: 4px; }
.reply-label { font-size: .68rem; font-weight: 600; color: var(--gray-4); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
.reply-box { background: var(--gray-1); border-radius: var(--radius-sm); padding: 8px 10px; font-size: .8rem; color: var(--gray-5); line-height: 1.5; border-left: 2px solid var(--gray-3); }
.reply-box.their-side { border-left-color: var(--black); background: var(--off-white); }
.add-reply-btn { font-size: .72rem; color: var(--gray-4); background: none; border: 1px dashed var(--gray-3); border-radius: var(--radius-sm); padding: 6px 12px; cursor: pointer; transition: all .15s; width: 100%; text-align: left; margin-top: 6px; }
.add-reply-btn:hover { border-color: var(--black); color: var(--black); }
.reply-input-wrap { margin-top: 8px; display: none; }
.reply-input-wrap.open { display: block; }
.reply-textarea { width: 100%; border: 1.5px solid var(--gray-3); border-radius: var(--radius-sm); padding: 8px 10px; font-size: .82rem; color: var(--black); outline: none; resize: none; min-height: 70px; background: var(--white); transition: border-color .15s; }
.reply-textarea:focus { border-color: var(--black); }
.reply-char { font-size: .68rem; color: var(--gray-4); text-align: right; margin-top: 3px; }
.reply-submit { font-family: 'Syne', sans-serif; font-size: .78rem; font-weight: 700; background: var(--black); color: var(--white); border: none; border-radius: var(--radius-sm); padding: 7px 16px; cursor: pointer; margin-top: 6px; transition: opacity .15s; }
.reply-submit:hover { opacity .85; }
.both-sides-card { background: var(--white); border: 1px solid var(--gray-2); border-radius: var(--radius); padding: 1.25rem; margin-bottom: 1rem; }
.both-sides-title { font-family: 'Syne', sans-serif; font-size: .85rem; font-weight: 700; color: var(--black); margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
.both-sides-sub { font-size: .75rem; color: var(--gray-5); margin-bottom: 1rem; line-height: 1.5; }
.their-perspective { background: var(--gray-1); border-radius: var(--radius-sm); padding: 10px 12px; font-size: .82rem; color: var(--black); line-height: 1.6; border-left: 3px solid var(--black); }
.their-perspective-meta { font-size: .68rem; color: var(--gray-4); margin-top: 6px; }
.add-perspective-btn { width: 100%; font-size: .8rem; font-weight: 500; background: var(--gray-1); border: 1.5px dashed var(--gray-3); border-radius: var(--radius-sm); padding: 10px; cursor: pointer; color: var(--gray-5); transition: all .15s; text-align: center; }
.add-perspective-btn:hover { border-color: var(--black); color: var(--black); background: var(--white); }
.me-profile-card { background: var(--green-light); border: 1px solid var(--green-mid); border-radius: var(--radius); padding: 1.25rem; margin-bottom: 1rem; }
.me-title { font-family: 'Syne', sans-serif; font-size: .85rem; font-weight: 700; color: var(--black); margin-bottom: .85rem; display: flex; align-items: center; gap: 8px; }
.me-badge { font-size: .62rem; font-weight: 700; background: var(--green); color: var(--white); padding: 2px 8px; border-radius: 10px; }
.me-item { margin-bottom: 10px; }
.me-item:last-child { margin-bottom: 0; }
.me-label { font-size: .68rem; font-weight: 600; color: var(--green); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 2px; }
.me-value { font-size: .82rem; color: var(--black); line-height: 1.5; }
.sidebar { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 72px; }
.sidebar-card { background: var(--white); border: 1px solid var(--gray-2); border-radius: var(--radius); padding: 1.1rem 1.25rem; }
.sidebar-title { font-family: 'Syne', sans-serif; font-size: .72rem; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: var(--gray-4); margin-bottom: .85rem; }
.flag-request-item { border-bottom: 1px solid var(--gray-1); padding: 8px 0; font-size: .78rem; color: var(--gray-5); line-height: 1.4; }
.flag-request-item:last-child { border-bottom: none; padding-bottom: 0; }
.flag-request-item:first-child { padding-top: 0; }
.req-why { font-size: .68rem; font-weight: 600; color: var(--black); margin-bottom: 2px; }
.share-vibe-btn { width: 100%; font-family: 'Syne', sans-serif; font-size: .85rem; font-weight: 700; background: var(--black); color: var(--white); border: none; border-radius: var(--radius-sm); padding: 11px; cursor: pointer; transition: opacity .15s; display: flex; align-items: center; justify-content: center; gap: 6px; }
.share-vibe-btn:hover { opacity .85; }
.report-link { font-size: .72rem; color: var(--gray-4); text-align: center; display: block; margin-top: 8px; cursor: pointer; text-decoration: underline; }
.report-link:hover { color: var(--red); }
.searched-strip { display: flex; gap: 8px; flex-wrap: wrap; }
.searched-chip { font-size: .68rem; font-weight: 500; padding: 3px 9px; border-radius: 20px; background: var(--gray-1); border: 1px solid var(--gray-2); color: var(--gray-5); }
.empty-state { text-align: center; padding: 2.5rem 1rem; color: var(--gray-4); }
.empty-icon { font-size: 2rem; margin-bottom: .75rem; }
.empty-title { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; color: var(--black); margin-bottom: 4px; }
.empty-sub { font-size: .8rem; line-height: 1.5; }
.flag-submit-inline { background: var(--white); border: 1.5px solid var(--gray-2); border-radius: var(--radius); padding: 1.25rem; margin-bottom: 1rem; display: none; }
.flag-submit-inline.open { display: block; }
.fsi-title { font-family: 'Syne', sans-serif; font-size: .9rem; font-weight: 700; color: var(--black); margin-bottom: 1rem; }
.fsi-row { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.fsi-select { flex: 1; min-width: 130px; font-size: .82rem; border: 1.5px solid var(--gray-3); border-radius: var(--radius-sm); padding: 8px 10px; background: var(--white); color: var(--black); outline: none; cursor: pointer; }
.fsi-select:focus { border-color: var(--black); }
.fsi-textarea { width: 100%; font-size: .85rem; border: 1.5px solid var(--gray-3); border-radius: var(--radius-sm); padding: 10px 12px; color: var(--black); outline: none; resize: none; min-height: 80px; transition: border-color .15s; background: var(--white); }
.fsi-textarea:focus { border-color: var(--black); }
.fsi-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; flex-wrap: wrap; gap: 8px; }
.fsi-anon-toggle { display: flex; align-items: center; gap: 6px; font-size: .78rem; color: var(--gray-5); cursor: pointer; }
.fsi-anon-toggle input { accent-color: var(--black); width: 14px; height: 14px; }
.fsi-submit { font-family: 'Syne', sans-serif; font-size: .82rem; font-weight: 700; padding: 9px 22px; border-radius: var(--radius-sm); border: none; cursor: pointer; transition: all .15s; color: var(--white); }
.fsi-submit.red { background: var(--red); }
.fsi-submit.green { background: var(--green); }
.fsi-submit:hover { opacity .85; }
.fsi-disclaimer { font-size: .68rem; color: var(--gray-4); margin-top: 8px; line-height: 1.4; }
.loading-bar { background: white; border: 1px solid var(--gray-2); border-radius: var(--radius); padding: 12px 14px; margin-bottom: 1rem; font-size: .82rem; color: var(--gray-5); }
.error-bar { background: #fff0f0; border: 1px solid var(--red-mid); color: var(--red); border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 1rem; font-size: .8rem; }
@media (max-width: 700px) {
  .page { grid-template-columns: 1fr; }
  .sidebar { position: static; }
  .searchpage-shell nav { padding: 0 1rem; }
  .nav-search { display: none; }
  .why-banner { font-size: .72rem; }
  .vibe-row { grid-template-columns: auto 1fr; }
  .flag-counts { display: none; }
}
`;

const fallbackData = {
  auth: { isAuthenticated: false },
  profile: {
    handle: "rohanverma__",
    initial: "R",
    avatarGradient: "linear-gradient(135deg,#E2353A,#FF8A65)",
    location: "Mumbai",
    searchesThisWeek: 47,
    firstFlagged: "3 months ago",
    watched: false,
    vibeScore: 18,
    verdict: "Proceed with caution 🚩",
    scoreSub: "17 flags from people who've interacted with this handle. Weighted by relationship depth.",
    redCount: 14,
    greenCount: 3,
    communityPattern: "6 independent accounts have flagged \"Love bombing\" for this handle. This is a recurring pattern, not an isolated incident.",
    searchesBreakdown: [
      "💍 Shaadi × 2",
      "👀 Going on a date × 28",
      "🔥 FWB × 9",
      "🤝 Just curious × 8",
    ],
  },
  reasons: ["👀 Going on a date", "💍 Shaadi", "🔥 Friends with Benefits", "🛍️ Buying from them", "💼 Work collab", "🤝 Just curious"],
  flags: [
    {
      id: 1,
      type: "red",
      category: "Love bombing",
      anonymous: true,
      comment: "Came on incredibly strong the first two weeks. Texting all day, making future plans, talking about meeting my parents. Then disappeared completely. No explanation. Classic love bombing pattern.",
      relation: "💔 Dated",
      timeframe: "📅 1–6 months ago",
      credibility: "⚖️ High credibility",
      postedAt: "2h ago",
      knowCount: 12,
      shareText: "Love bombing flag on @rohanverma__",
      theirReply: "I never made any promises. We were just talking. People move on, that's life.",
    },
    {
      id: 2,
      type: "red",
      category: "Ghosting",
      anonymous: true,
      disputed: true,
      disputedNote: "⚠️ This flag exists between two people who have both flagged each other. Read with that context in mind.",
      comment: "After 3 months of talking daily, just stopped replying. Left on read. No explanation, no closure, nothing. Found out he was seeing someone else the whole time.",
      relation: "💔 Dated",
      timeframe: "📅 Over a year ago",
      credibility: "⚖️ High credibility",
      postedAt: "5h ago",
      knowCount: 8,
      shareText: "Ghosting flag on @rohanverma__",
    },
    {
      id: 3,
      type: "green",
      category: "Great communicator",
      anonymous: false,
      comment: "Worked with him on a college project. Super reliable, always on time, communicated clearly. Zero drama. In a professional context he's great.",
      relation: "🏫 College / school",
      timeframe: "📅 This month",
      credibility: "⚖️ Medium credibility",
      postedAt: "8h ago",
      knowCount: 5,
      shareText: "Green flag on @rohanverma__",
    },
    {
      id: 4,
      type: "red",
      category: "Love bombing",
      anonymous: true,
      comment: "The intense texting at the start felt amazing. Then he just switched off after I said I wasn't ready to be exclusive. Complete personality change overnight.",
      relation: "☕ Went on a date",
      timeframe: "📅 This month",
      credibility: "⚖️ High credibility",
      postedAt: "1d ago",
      knowCount: 0,
      shareText: "Love bombing flag on @rohanverma__",
    },
    {
      id: 5,
      type: "red",
      category: "Emotionally unavailable",
      anonymous: true,
      comment: "Hot and cold constantly. One day super attentive, next day barely replies. Exhausting to deal with. When I brought it up he said I was being \"too intense.\"",
      relation: "💔 Dated",
      timeframe: "📅 1–6 months ago",
      credibility: "⚖️ High credibility",
      postedAt: "2d ago",
      knowCount: 0,
      shareText: "Emotionally unavailable flag on @rohanverma__",
    },
    {
      id: 6,
      type: "green",
      category: "Legit & honest",
      anonymous: false,
      comment: "Bought a camera lens from him. Condition was exactly as described, packed carefully, responded fast. Clean transaction, no issues.",
      relation: "🛍️ Bought / sold",
      timeframe: "📅 This week",
      credibility: "⚖️ Medium credibility",
      postedAt: "3d ago",
      knowCount: 0,
      shareText: "Legit & honest flag on @rohanverma__",
    },
  ],
  perspective: {
    text: "I know I've hurt people and I'm not proud of it. I was going through a really difficult period personally. I'm working on it. The love bombing accusation is fair — I was too intense early on because I genuinely liked these people. I should have communicated better when I needed space instead of disappearing. I'm trying to do better.",
    meta: "Submitted by @rohanverma__ · 2 weeks ago",
  },
  meProfile: {
    misunderstood: "I come on strong because I genuinely get excited about people. It's not calculated — I'm just an intense person. I know that's not for everyone.",
    pride: "I'm honest when I'm ready. I've never lied about my feelings — I just sometimes shut down when I don't know how to handle them.",
  },
  peopleAlsoSearched: [
    { handle: "aarav.k", vibe: 39 },
    { handle: "the.samarth", vibe: 10 },
    { handle: "mehak.designs", vibe: 90 },
  ],
  requests: [
    { why: "👀 Going on a date", text: "Has anyone met him in person recently? Going on a date this weekend and want to know more." },
    { why: "💍 Shaadi", text: "Family is considering this person for a shaadi proposal. Any info would help." },
    { why: "🤝 Just curious", text: "He DMed me out of nowhere. Any experiences?" },
  ],
  searchSuggestions: [
    { id: 1, handle: "rohanverma__", red: 14, green: 3, score: 18, color: "#E2353A" },
    { id: 2, handle: "priyasingh.art", red: 0, green: 22, score: 100, color: "#1A9E5F" },
    { id: 3, handle: "aarav.k", red: 11, green: 7, score: 39, color: "#E2353A" },
    { id: 4, handle: "mehak.designs", red: 2, green: 19, score: 90, color: "#1A9E5F" },
  ],
};

function mapPayload(payload) {
  // Check if this is a real API response (has more than just handle)
  const isRealApiResponse = payload.handle && Object.keys(payload).length > 1;
  
  if (isRealApiResponse) {
    return {
      // Start with empty object, not fallbackData
      auth: payload.auth || { isAuthenticated: false },
      //profile: payload.profile || payload.handle || {}, // Use actual profile/handle data
      profile: {
  handle: payload.profile?.handle || payload.handle?.instagram_handle || "",
  initial: (payload.profile?.handle || payload.handle?.instagram_handle || "U")[0].toUpperCase(),
  avatarGradient: "linear-gradient(135deg,#E2353A,#FF8A65)",
  location: payload.profile?.city || "Unknown",
  searchesThisWeek: payload.profile?.searchesThisWeek || 0,
  firstFlagged: payload.profile?.created_at || "",
  watched: false,
  vibeScore: payload.stats?.total ? Math.round((payload.stats.green_flag_count / payload.stats.total) * 100) : 0,
  verdict: "Proceed with caution 🚩",
  scoreSub: "",
  redCount: payload.stats?.red_flag_count || 0,
  greenCount: payload.stats?.green_flag_count || 0,
  communityPattern: "",
  searchesBreakdown: [],
},
      perspective: payload.perspective || {},
      // meProfile: payload.meProfile || {},
   meProfile: {
  misunderstood: payload.me_profile?.me_misunderstood || "",
  pride: payload.me_profile?.me_pride || "",
},
      reasons: payload.reasons?.length ? payload.reasons : fallbackData.reasons,
      flags: payload.flags?.length ? payload.flags : [],
      peopleAlsoSearched: payload.peopleAlsoSearched?.length ? payload.peopleAlsoSearched : [],
      requests: payload.requests?.length ? payload.requests : [],
      searchSuggestions: payload.searchSuggestions?.length ? payload.searchSuggestions : [],
      // Don't use fallbackData for real API responses
    };
  }
  
  // Fallback case or error case
  return fallbackData;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const requestedHandle = (query.get("handle") || fallbackData.profile.handle).replace(/^@/, "");
  const reasonParam = query.get("reason") || fallbackData.reasons[0];

  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [currentReason, setCurrentReason] = useState(reasonParam);
  const [showReasonPicker, setShowReasonPicker] = useState(false);
  const [watching, setWatching] = useState(false);
  const [shareToast, setShareToast] = useState("");
  const [navSearch, setNavSearch] = useState("");
  const [navFocused, setNavFocused] = useState(false);
  const [navSuggestions, setNavSuggestions] = useState([]);
  const [navSuggestionsLoading, setNavSuggestionsLoading] = useState(false);
  const [openFlagBox, setOpenFlagBox] = useState(false);
  const [flagType, setFlagType] = useState("red");
  const [flagForm, setFlagForm] = useState({
    relation: "",
    timeframe: "",
    category: "",
    text: "",
    anonymous: true,
  });
  const [submittingFlag, setSubmittingFlag] = useState(false);
  const [knownMap, setKnownMap] = useState({});
  const [replies, setReplies] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [openReplyFor, setOpenReplyFor] = useState(null);
  const suggestTimerRef = useRef(null);
  const shareTimerRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    async function loadSearch() {
      setLoading(true);
      setError("");
      try {
        // api bhi likhskte search ke aage 
        const payload = await apiFetch(`/search/${encodeURIComponent(requestedHandle)}?reason=${encodeURIComponent(currentReason)}`);
        if (ignore) return;
        
        console.log('API Response:', payload);
        console.log('Requested handle:', requestedHandle);
        
        const mapped = mapPayload(payload || {});
        console.log('Mapped data:', mapped);
        
        setData(mapped);
        setWatching(Boolean(mapped.profile.watched));
      } catch (err) {
        if (!ignore) {
          console.error('Search API Error:', err);
          console.error('Error details:', err.message);
          console.error('Requested handle:', requestedHandle);
          
          // Show error state instead of fallback data
         setData({
  ...fallbackData,
  profile: {
    ...fallbackData.profile,
    handle: requestedHandle,
  },
});
          setWatching(false);
          setError(`Failed to load profile for "${requestedHandle}". Please try again.`);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadSearch();
    return () => { ignore = true; };
  }, [requestedHandle, currentReason]);

  useEffect(() => {
    const val = navSearch.trim().replace(/^@/, "");
    if (!val) {
      setNavSuggestions([]);
      setNavSuggestionsLoading(false);
      return undefined;
    }
    suggestTimerRef.current = window.setTimeout(async () => {
      setNavSuggestionsLoading(true);
      try {
        const payload = await apiFetch(`/search/suggestions?q=${encodeURIComponent(val)}`);
        setNavSuggestions(payload?.items || []);
      } catch {
        const fallback = data.searchSuggestions.filter((item) => item.handle.toLowerCase().includes(val.toLowerCase()));
        setNavSuggestions(fallback);
      } finally {
        setNavSuggestionsLoading(false);
      }
    }, 220);
    return () => {
      if (suggestTimerRef.current) window.clearTimeout(suggestTimerRef.current);
    };
  }, [navSearch, data.searchSuggestions]);

  useEffect(() => {
    if (!shareToast) return undefined;
    shareTimerRef.current = window.setTimeout(() => setShareToast(""), 1800);
    return () => {
      if (shareTimerRef.current) window.clearTimeout(shareTimerRef.current);
    };
  }, [shareToast]);

  const visibleFlags = useMemo(() => {
    if (activeTab === "all") return data.flags;
    if (activeTab === "red") return data.flags.filter((item) => item.type === "red");
    if (activeTab === "green") return data.flags.filter((item) => item.type === "green");
    return [];
  }, [activeTab, data.flags]);

  const redPct = Math.max(0, Math.min(100, 100 - Number(data.profile.vibeScore || 0)));
  const greenPct = Math.max(0, Math.min(100, Number(data.profile.vibeScore || 0)));
  const ringStyle = {
    background: `conic-gradient(var(--green) 0% ${greenPct}%, var(--red) ${greenPct}% 100%)`,
  };

  const navPrimaryAction = data.auth.isAuthenticated ? { label: "Dashboard", to: "/dashboard" } : { label: "Sign up", to: "/signup" };
  const navSecondaryAction = data.auth.isAuthenticated ? { label: "Open app", to: "/dashboard" } : { label: "Log in", to: "/auth" };

  async function doNavSearch(handleOverride) {
    const next = (handleOverride || navSearch).trim().replace(/^@/, "");
    if (!next) return;
    navigate(`/search?handle=${encodeURIComponent(next)}&reason=${encodeURIComponent(currentReason)}`);
  }

  function toggleWatch() {
    const next = !watching;
    setWatching(next);
    if (next) {
      // POST to add watch - use handle string directly
      apiFetch("/watches", {
        method: "POST",
        body: JSON.stringify({ handle_id: data.profile.handle }),
      }).catch(() => {
        setWatching(!next);
      });
    } else {
      // DELETE to remove watch - use handle string directly  
      apiFetch(`/watches/handle/${encodeURIComponent(data.profile.handle)}`, {
        method: "DELETE",
      }).catch(() => {
        setWatching(!next);
      });
    }
  }

  function openFlag(type) {
    setFlagType(type);
    setOpenFlagBox(true);
    setFlagForm((current) => ({
      ...current,
      category: "",
    }));
    window.setTimeout(() => {
      const el = document.getElementById("flagSubmitInlineReact");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  function closeFlag() {
    setOpenFlagBox(false);
  }

  async function submitFlag() {
    setSubmittingFlag(true);
    try {
      const payload = {
        handle: data.profile.handle,
        type: flagType,
        relation: flagForm.relation,
        timeframe: flagForm.timeframe,
        category: flagForm.category,
        text: flagForm.text,
        anonymous: flagForm.anonymous,
      };
      await apiFetch("/flags", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setShareToast("Flag posted! Thank you for your contribution to the community.");
      setOpenFlagBox(false);
      setFlagForm({ relation: "", timeframe: "", category: "", text: "", anonymous: true });
    } catch (err) {
      setError(err.message || "Could not post flag.");
    } finally {
      setSubmittingFlag(false);
    }
  }

  function toggleKnow(flagId) {
    setKnownMap((current) => ({ ...current, [flagId]: !current[flagId] }));
  }

  function shareFlag(text) {
    if (navigator.share) {
      navigator.share({ title: "Clocked", text }).catch(() => {});
    }
    setShareToast("Link copied / shared");
  }

  function shareVibe() {
    setShareToast("Vibe card generated! In the real app this would open a shareable card image.");
  }

  function submitReply(flagId) {
    const value = (replyDrafts[flagId] || "").trim();
    if (!value) return;
    setReplies((current) => ({ ...current, [flagId]: value }));
    setOpenReplyFor(null);
    setReplyDrafts((current) => ({ ...current, [flagId]: "" }));
    apiFetch(`/flags/${flagId}/reply`, {
      method: "POST",
      body: JSON.stringify({ text: value }),
    }).catch(() => {});
  }

  if (loading) {
    return (
      <div className="searchpage-shell">
        <style>{pageCss}</style>
        <div className="page"><div className="loading-bar">Loading handle...</div></div>
      </div>
    );
  }

  return (
    <div className="searchpage-shell">
      <style>{pageCss}</style>

      <nav>
        <Link to="/" className="nav-logo">
          <div className="logo-flags">
            <div className="flag-shape flag-r"></div>
            <div className="flag-shape flag-g"></div>
          </div>
          Clocked
        </Link>

        <div className="nav-search">
          <span className="nav-at">@</span>
          <input
            className="nav-search-input"
            type="text"
            placeholder="search another handle..."
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            onFocus={() => setNavFocused(true)}
            onBlur={() => window.setTimeout(() => setNavFocused(false), 120)}
            onKeyDown={(e) => e.key === "Enter" && doNavSearch()}
          />
          <button className="nav-search-btn" onClick={() => doNavSearch()}>Search</button>

          {navFocused && (navSuggestionsLoading || navSuggestions.length > 0) && (
            <div className="search-suggestions">
              {navSuggestionsLoading ? (
                <div style={{ padding: "10px 14px", fontSize: ".8rem", color: "var(--gray-5)" }}>Loading suggestions...</div>
              ) : (
                navSuggestions.map((item) => {
                  const score = item.score ?? Math.round(((item.green || 0) / Math.max((item.green || 0) + (item.red || 0), 1)) * 100);
                  const good = score > 55;
                  return (
                    <button key={item.id || item.handle} className="suggest-btn" onMouseDown={() => doNavSearch(item.handle)}>
                      <div className="suggest-avatar" style={{ background: item.color || (good ? "#1A9E5F" : "#E2353A") }}>{String(item.handle || "@")[0].toUpperCase()}</div>
                      <div className="suggest-info">
                        <div className="suggest-handle">@{item.handle}</div>
                        <div className="suggest-meta">{item.red || 0} red · {item.green || 0} green flags</div>
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
          <Link to={navSecondaryAction.to} className="btn-ghost">{navSecondaryAction.label}</Link>
          <Link to={navPrimaryAction.to} className="btn-solid">{navPrimaryAction.label}</Link>
        </div>
      </nav>

      <div className="why-banner">
        <span>You searched because:</span>
        <span className="why-chip">{currentReason}</span>
        <button className="why-change" onClick={() => setShowReasonPicker((v) => !v)}>change</button>
        {showReasonPicker ? (
          <div className="why-options">
            {data.reasons?.map((reason) => (
              <button
                key={reason}
                className={`why-option ${currentReason === reason ? "active" : ""}`}
                onClick={() => {
                  setCurrentReason(reason);
                  setShowReasonPicker(false);
                  navigate(`/search?handle=${encodeURIComponent(data.profile.handle)}&reason=${encodeURIComponent(reason)}`);
                }}
              >
                {reason}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="page">
        <div className="main-col">
          {error ? <div className="error-bar">{error}</div> : null}

          <div className="profile-card">
            <div className="profile-top">
              <div className="profile-avatar" style={{ background: data.profile.avatarGradient }}>{data.profile.initial || String(data.profile.handle || "@")[0].toUpperCase()}</div>
              <div className="profile-info">
                <div className="profile-handle">@{data.profile.handle}</div>
                <div className="profile-meta">
                  <span>📍 {data.profile.location}</span>
                  <span>🔍 {data.profile.searchesThisWeek} searches this week</span>
                  <span>📅 First flagged {data.profile.firstFlagged}</span>
                </div>
                <div className="profile-actions">
                  <button className={`action-btn ${watching ? "watching" : ""}`} onClick={toggleWatch}>{watching ? "👁 Watching" : "👁 Watch handle"}</button>
                  <button className="action-btn flag-red" onClick={() => openFlag("red")}>🚩 Red flag</button>
                  <button className="action-btn flag-green" onClick={() => openFlag("green")}>🟢 Green flag</button>
                </div>
              </div>
            </div>

            <div className="vibe-row">
              <div className="score-ring-wrap">
                <div className="score-ring" style={ringStyle}>
                  <div className="score-inner">
                    <span className="score-num" style={{ color: greenPct > redPct ? "var(--green)" : "var(--red)" }}>{data.profile.vibeScore}%</span>
                    <span className="score-pct">green</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="score-label">Vibe score</div>
                <div className="score-verdict" style={{ color: greenPct > redPct ? "var(--green)" : "var(--red)" }}>{data.profile.verdict}</div>
                <div className="score-sub">{data.profile.scoreSub}</div>
              </div>
              <div className="flag-counts">
                <div className="flag-count-item">
                  <span className="flag-count-label" style={{ color: "var(--red)" }}>🚩 Red</span>
                  <div className="flag-count-bar-wrap"><div className="flag-count-bar red" style={{ width: `${Math.min(100, redPct)}%` }}></div></div>
                  <span className="flag-count-num" style={{ color: "var(--red)" }}>{data.profile.redCount}</span>
                </div>
                <div className="flag-count-item">
                  <span className="flag-count-label" style={{ color: "var(--green)" }}>🟢 Green</span>
                  <div className="flag-count-bar-wrap"><div className="flag-count-bar green" style={{ width: `${Math.min(100, greenPct)}%` }}></div></div>
                  <span className="flag-count-num" style={{ color: "var(--green)" }}>{data.profile.greenCount}</span>
                </div>
              </div>
            </div>

            <div className="pattern-alert">
              <span className="pattern-icon">⚠️</span>
              <div className="pattern-text">
                <strong>Community pattern detected</strong>
                {data.profile.communityPattern}
              </div>
            </div>

            <div className="searched-card">
              <span className="searched-icon">👀</span>
              <div className="searched-text">
                <strong>{data.profile.searchesThisWeek} people searched this handle</strong> this week —
                <div className="searched-strip" style={{ marginTop: 6 }}>
                  {data.profile.searchesBreakdown?.map((item) => <span key={item} className="searched-chip">{item}</span>)}
                </div>
              </div>
            </div>
          </div>

          <div id="flagSubmitInlineReact" className={`flag-submit-inline ${openFlagBox ? "open" : ""}`}>
            <div className="fsi-title">{flagType === "red" ? "🚩 Drop a red flag" : "🟢 Drop a green flag"}</div>
            <div className="fsi-row">
              <select className="fsi-select" value={flagForm.relation} onChange={(e) => setFlagForm((c) => ({ ...c, relation: e.target.value }))}>
                <option value="">How do you know them?</option>
                <option>💔 Dated</option>
                <option>☕ Went on a date</option>
                <option>📱 Followed online</option>
                <option>🤝 Met in person</option>
                <option>🏫 College / school</option>
                <option>💼 Work / business</option>
                <option>🛍️ Bought / sold</option>
                <option>👂 Heard through people</option>
              </select>
              <select className="fsi-select" value={flagForm.timeframe} onChange={(e) => setFlagForm((c) => ({ ...c, timeframe: e.target.value }))}>
                <option value="">When was this?</option>
                <option>This week</option>
                <option>This month</option>
                <option>1–6 months ago</option>
                <option>Over a year ago</option>
              </select>
            </div>
            <select className="fsi-select" style={{ width: "100%", marginBottom: 10 }} value={flagForm.category} onChange={(e) => setFlagForm((c) => ({ ...c, category: e.target.value }))}>
              <option value="">Select a category...</option>
              <optgroup label="🚩 Red flag categories">
                <option>Ghosting / went silent</option>
                <option>Love bombing</option>
                <option>Fake / catfish</option>
                <option>Scammer / fraud</option>
                <option>Emotionally unavailable</option>
                <option>Rude / toxic behaviour</option>
                <option>Cheated / dishonest</option>
              </optgroup>
              <optgroup label="🟢 Green flag categories">
                <option>Genuine & kind</option>
                <option>Great communicator</option>
                <option>Legit & honest</option>
                <option>Super helpful</option>
                <option>Great seller / buyer</option>
                <option>Trustworthy</option>
              </optgroup>
            </select>
            <textarea className="fsi-textarea" placeholder="Share your experience... what happened? (optional, max 300 chars)" maxLength={300} value={flagForm.text} onChange={(e) => setFlagForm((c) => ({ ...c, text: e.target.value }))}></textarea>
            <div className="fsi-bottom">
              <label className="fsi-anon-toggle">
                <input type="checkbox" checked={flagForm.anonymous} onChange={(e) => setFlagForm((c) => ({ ...c, anonymous: e.target.checked }))} />
                Post anonymously
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ background: "var(--gray-1)", color: "var(--gray-5)", border: "1px solid var(--gray-3)", borderRadius: "var(--radius-sm)", padding: "9px 16px", cursor: "pointer", fontSize: ".82rem" }} onClick={closeFlag}>Cancel</button>
                <button className={`fsi-submit ${flagType}`} onClick={submitFlag}>{submittingFlag ? "Posting..." : flagType === "red" ? "Post red flag →" : "Post green flag →"}</button>
              </div>
            </div>
            <div className="fsi-disclaimer">⚖️ By posting you confirm this is your genuine personal experience and you take full legal responsibility for this content.</div>
          </div>

          <div className="tabs-row">
            <button className={`tab-btn ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>All flags ({data.flags.length})</button>
            <button className={`tab-btn ${activeTab === "red" ? "active" : ""}`} onClick={() => setActiveTab("red")}>🚩 Red ({data.flags.filter((f) => f.type === "red").length})</button>
            <button className={`tab-btn ${activeTab === "green" ? "active" : ""}`} onClick={() => setActiveTab("green")}>🟢 Green ({data.flags.filter((f) => f.type === "green").length})</button>
            <button className={`tab-btn ${activeTab === "perspective" ? "active" : ""}`} onClick={() => setActiveTab("perspective")}>⚖️ Both sides</button>
            <button className={`tab-btn ${activeTab === "me" ? "active" : ""}`} onClick={() => setActiveTab("me")}>👤 Me profile</button>
          </div>

          {(activeTab === "all" || activeTab === "red" || activeTab === "green") && (
            <div>
              {visibleFlags.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🫥</div>
                  <div className="empty-title">No flags here yet</div>
                  <div className="empty-sub">Try another tab or be the first to contribute your experience.</div>
                </div>
              ) : visibleFlags?.map((flag) => (
                <div key={flag.id} className={`flag-card ${flag.type === "red" ? "red-card" : "green-card"} ${flag.disputed ? "disputed" : ""} ${flag.expired ? "expired" : ""}`}>
                  <div className="flag-top">
                    <span className={`flag-type-badge ${flag.type === "red" ? "red" : "green"}`}>{flag.type === "red" ? "🚩 Red flag" : "🟢 Green flag"}</span>
                    <span className="flag-cat">{flag.category}</span>
                    {flag.disputed ? <span className="disputed-badge">⚠️ Disputed</span> : null}
                    {flag.expired ? <span className="expired-badge">Expired</span> : null}
                    {flag.anonymous ? <span className="flag-anon">🎭 anonymous</span> : null}
                  </div>
                  {flag.disputedNote ? <div className="disputed-note">{flag.disputedNote}</div> : null}
                  <p className="flag-comment">{flag.comment}</p>
                  <div className="flag-meta-row">
                    <span>{flag.relation}</span>
                    <span>{flag.timeframe}</span>
                    <span>{flag.credibility}</span>
                    <span>{flag.postedAt}</span>
                  </div>

                  <div className="reply-wrap">
                    {flag.theirReply ? (
                      <>
                        <div className="reply-label">Their reply</div>
                        <div className="reply-box their-side">{flag.theirReply}</div>
                      </>
                    ) : replies[flag.id] ? (
                      <>
                        <div className="reply-label">Your reply</div>
                        <div className="reply-box their-side">{replies[flag.id]}</div>
                      </>
                    ) : (
                      <>
                        {openReplyFor === flag.id ? (
                          <div className="reply-input-wrap open">
                            <textarea className="reply-textarea" placeholder="Your one public reply to this flag... (300 chars max)" maxLength={300} value={replyDrafts[flag.id] || ""} onChange={(e) => setReplyDrafts((c) => ({ ...c, [flag.id]: e.target.value }))}></textarea>
                            <div className="reply-char">{(replyDrafts[flag.id] || "").length} / 300</div>
                            <button className="reply-submit" onClick={() => submitReply(flag.id)}>Post reply →</button>
                          </div>
                        ) : (
                          <button className="add-reply-btn" onClick={() => setOpenReplyFor(flag.id)}>+ Add your reply to this flag{flag.theirReply ? " (you get one)" : ""}</button>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flag-footer">
                    <div className="flag-actions-left">
                      <button className={`know-btn ${knownMap[flag.id] ? "known" : ""}`} onClick={() => toggleKnow(flag.id)}>👋 I know this person</button>
                      <span className="know-count">{flag.knowCount || 0} people know them</span>
                    </div>
                    <button className="share-flag-btn" onClick={() => shareFlag(flag.shareText || `Flag on @${data.profile.handle}`)}>↗ Share this flag</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "perspective" && (
            <div id="perspectiveSection">
              <div className="both-sides-card">
                <div className="both-sides-title">⚖️ Their perspective <span className="me-badge" style={{ background: "var(--black)" }}>Self submitted</span></div>
                <div className="both-sides-sub">This person has submitted their own side of the story. Read flags and this together to form your own view.</div>
                <div className="their-perspective">{data.perspective.text}</div>
                <div className="their-perspective-meta">{data.perspective.meta}</div>
              </div>
            </div>
          )}

          {activeTab === "me" && (
            <div id="meProfileSection">
              <div className="me-profile-card">
                <div className="me-title">👤 @{data.profile.handle} says <span className="me-badge">Self aware</span></div>
                <div className="me-item">
                  <div className="me-label">What people often misunderstand about me</div>
                  <div className="me-value">{data.meProfile.misunderstood}</div>
                </div>
                <div className="me-item">
                  <div className="me-label">What I genuinely pride myself on</div>
                  <div className="me-value">{data.meProfile.pride}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="sidebar">
          <div className="sidebar-card">
            <p className="sidebar-title">📤 Share vibe card</p>
            <button className="share-vibe-btn" onClick={shareVibe}>🎴 Share @{data.profile.handle}'s card</button>
            <Link to="/grievance" className="report-link">🛡️ Report this handle</Link>
          </div>

          <div className="sidebar-card">
            <p className="sidebar-title">👀 People also searched</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.peopleAlsoSearched?.map((item) => {
                const good = item.vibe > 55;
                return (
                  <button key={item.handle} style={{ fontSize: ".82rem", color: "var(--black)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", textAlign: "left" }} onClick={() => navigate(`/search?handle=${encodeURIComponent(item.handle)}&reason=${encodeURIComponent(currentReason)}`)}>
                    @{item.handle}
                    <span style={{ fontSize: ".68rem", background: good ? "var(--green-light)" : "var(--red-light)", color: good ? "var(--green)" : "var(--red)", padding: "2px 7px", borderRadius: "20px", fontWeight: 600 }}>{good ? "🟢" : "🚩"} {item.vibe}%</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sidebar-card">
            <p className="sidebar-title">🙋 Flag requests</p>
            {data.requests?.map((item, idx) => (
              <div key={`${item.why}-${idx}`} className="flag-request-item">
                <div className="req-why">{item.why}</div>
                {item.text}
              </div>
            ))}
            <button style={{ width: "100%", marginTop: 10, fontSize: ".75rem", fontWeight: 500, background: "none", border: "1px dashed var(--gray-3)", borderRadius: "var(--radius-sm)", padding: 7, cursor: "pointer", color: "var(--gray-5)", transition: "all .15s" }}>+ Post a flag request</button>
          </div>

          <div className="sidebar-card" style={{ background: "var(--black)", borderColor: "var(--black)" }}>
            <p className="sidebar-title" style={{ color: "rgba(255,255,255,.4)" }}>🔔 Is this your handle?</p>
            <p style={{ fontSize: ".78rem", color: "rgba(255,255,255,.6)", lineHeight: 1.5, marginBottom: ".9rem" }}>You have {data.flags.length} flags on your profile. Sign up to see who searched you, add your perspective, and post one reply to each flag.</p>
            <Link to="/signup" style={{ display: "block", background: "var(--white)", color: "var(--black)", fontFamily: "Syne, sans-serif", fontSize: ".82rem", fontWeight: 700, padding: 9, borderRadius: "var(--radius-sm)", textAlign: "center", textDecoration: "none", transition: "opacity .15s" }}>Claim your profile →</Link>
          </div>
        </aside>
      </div>

      <div className={`share-toast ${shareToast ? "show" : ""}`}>{shareToast}</div>
    </div>
  );
}