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
    try { const d = await response.json(); message = d.message || message; } catch {}
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
  background: rgba(248,247,243,0.92); backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--gray-2);
}
.nav-logo { font-family: 'Syne', sans-serif; font-size: 1.2rem; font-weight: 800; letter-spacing: -.5px; color: var(--black); text-decoration: none; display: flex; align-items: center; gap: 8px; }
.logo-flags { display: flex; gap: 4px; align-items: center; }
.flag-shape { width: 9px; height: 15px; clip-path: polygon(0 0,100% 15%,100% 85%,0 100%); display: block; }
.flag-r { background: var(--red); } .flag-g { background: var(--green); }
.nav-search { display: flex; align-items: center; background: var(--white); border: 1.5px solid var(--gray-3); border-radius: 30px; padding: 5px 5px 5px 16px; gap: 6px; flex: 1; max-width: 340px; margin: 0 2rem; transition: border-color .15s; position: relative; }
.nav-search:focus-within { border-color: var(--black); }
.nav-at { font-family: 'Syne', sans-serif; font-size: .85rem; font-weight: 700; color: var(--gray-4); }
.nav-search-input { flex: 1; border: none; outline: none; background: transparent; font-size: .88rem; color: var(--black); min-width: 0; }
.nav-search-input::placeholder { color: var(--gray-4); }
.nav-search-btn { background: var(--black); color: var(--white); border: none; border-radius: 20px; padding: 6px 14px; font-size: .75rem; font-weight: 700; cursor: pointer; font-family: 'Syne', sans-serif; white-space: nowrap; }
.nav-right { display: flex; gap: 8px; align-items: center; }
.btn-ghost { font-size: .8rem; font-weight: 500; color: var(--gray-5); background: none; border: 1px solid var(--gray-3); border-radius: 30px; padding: 5px 14px; cursor: pointer; text-decoration: none; transition: all .15s; }
.btn-ghost:hover { border-color: var(--black); color: var(--black); }
.btn-solid { font-size: .8rem; font-weight: 600; color: var(--white); background: var(--black); border: 1px solid var(--black); border-radius: 30px; padding: 5px 16px; cursor: pointer; text-decoration: none; }
.search-suggestions { position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: white; border: 1px solid var(--gray-2); border-radius: var(--radius); box-shadow: 0 12px 40px rgba(0,0,0,.12); overflow: hidden; z-index: 110; }
.suggest-btn { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: none; background: white; text-align: left; cursor: pointer; border-bottom: 1px solid var(--gray-1); }
.suggest-btn:last-child { border-bottom: none; }
.suggest-btn:hover { background: var(--gray-1); }
.suggest-avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-family: 'Syne', sans-serif; font-weight: 800; font-size: .82rem; flex-shrink: 0; }
.suggest-info { flex: 1; min-width: 0; }
.suggest-handle { font-size: .86rem; font-weight: 600; color: var(--black); }
.suggest-meta { font-size: .68rem; color: var(--gray-4); margin-top: 1px; }
.suggest-score { font-size: .68rem; font-weight: 700; border-radius: 20px; padding: 3px 9px; }
.why-banner { background: var(--black); color: var(--white); padding: .6rem 2rem; font-size: .78rem; display: flex; align-items: center; gap: 8px; justify-content: center; flex-wrap: wrap; }
.why-banner strong { font-weight: 600; }
.why-chip { background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2); border-radius: 20px; padding: 2px 10px; font-size: .72rem; font-weight: 500; }
.why-change { font-size: .72rem; color: rgba(255,255,255,.5); cursor: pointer; text-decoration: underline; margin-left: 4px; background: none; border: none; color: rgba(255,255,255,.5); }
.why-options { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; width: 100%; margin-top: 6px; }
.why-option { border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.08); color: white; border-radius: 20px; padding: 3px 10px; font-size: .7rem; cursor: pointer; }
.why-option.active { background: white; color: black; }
.page { max-width: 960px; margin: 0 auto; padding: 2rem 2rem 5rem; display: grid; grid-template-columns: 1fr 300px; gap: 2rem; align-items: start; }
.profile-card { background: var(--white); border: 1px solid var(--gray-2); border-radius: var(--radius); padding: 1.5rem; margin-bottom: 1.25rem; }
.profile-top { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 1.25rem; }
.profile-avatar { width: 64px; height: 64px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 800; color: var(--white); }
.profile-info { flex: 1; min-width: 0; }
.profile-handle { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 800; letter-spacing: -.5px; color: var(--black); margin-bottom: 3px; }
.profile-meta { font-size: .78rem; color: var(--gray-4); display: flex; gap: 10px; flex-wrap: wrap; }
.profile-meta span { display: flex; align-items: center; gap: 3px; }
.profile-actions { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.action-btn { font-size: .75rem; font-weight: 500; padding: 6px 14px; border-radius: 20px; cursor: pointer; transition: all .15s; border: 1px solid var(--gray-3); background: var(--gray-1); color: var(--gray-5); }
.action-btn:hover { border-color: var(--black); color: var(--black); background: var(--white); }
.action-btn.watching { background: var(--black); color: var(--white); border-color: var(--black); }
.action-btn.flag-red { background: var(--red-light); color: var(--red); border-color: var(--red-mid); }
.action-btn.flag-red:hover { background: var(--red); color: var(--white); }
.action-btn.flag-green { background: var(--green-light); color: var(--green); border-color: var(--green-mid); }
.action-btn.flag-green:hover { background: var(--green); color: var(--white); }
.vibe-row { display: grid; grid-template-columns: auto 1fr auto; gap: 1.25rem; align-items: center; padding: 1.25rem; background: var(--gray-1); border-radius: var(--radius-sm); margin-bottom: 1rem; }
.score-ring-wrap { position: relative; width: 72px; height: 72px; flex-shrink: 0; }
.score-ring { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.score-inner { width: 54px; height: 54px; border-radius: 50%; background: var(--gray-1); display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; }
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
.searched-card { background: var(--white); border: 1px solid var(--gray-2); border-radius: var(--radius-sm); padding: .9rem 1rem; margin-bottom: 1rem; display: flex; gap: 10px; align-items: flex-start; }
.searched-icon { font-size: 1rem; flex-shrink: 0; margin-top: 2px; }
.searched-text { font-size: .8rem; color: var(--gray-5); line-height: 1.4; }
.searched-text strong { color: var(--black); font-weight: 600; display: block; margin-bottom: 4px; }
.searched-strip { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
.searched-chip { font-size: .68rem; font-weight: 500; padding: 3px 9px; border-radius: 20px; background: var(--gray-1); border: 1px solid var(--gray-2); color: var(--gray-5); }
.tabs-row { display: flex; gap: 4px; margin-bottom: 1rem; background: var(--gray-1); border-radius: 30px; padding: 4px; flex-wrap: wrap; }
.tab-btn { flex: 1; font-size: .78rem; font-weight: 500; border: none; background: none; border-radius: 24px; padding: 7px 10px; cursor: pointer; color: var(--gray-5); transition: all .15s; text-align: center; min-width: 100px; }
.tab-btn.active { background: var(--white); color: var(--black); box-shadow: 0 1px 4px rgba(0,0,0,.08); }
.flag-card { background: var(--white); border: 1px solid var(--gray-2); border-radius: var(--radius); padding: 1rem 1.25rem; margin-bottom: 10px; transition: all .15s; }
.flag-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.06); transform: translateY(-1px); }
.flag-card.red-card { border-left: 3px solid var(--red); }
.flag-card.green-card { border-left: 3px solid var(--green); }
.flag-card.expired { opacity: .45; border-left-color: var(--gray-3); background: var(--gray-1); }
.flag-card.expired:hover { transform: none; box-shadow: none; }
.expired-badge { font-size: .62rem; font-weight: 600; padding: 2px 8px; border-radius: 20px; background: var(--gray-2); color: var(--gray-4); border: 1px solid var(--gray-3); }
.flag-card.disputed { border-left-color: #F59E0B; }
.disputed-badge { font-size: .62rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; display: flex; align-items: center; gap: 4px; }
.disputed-note { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: var(--radius-sm); padding: 8px 10px; font-size: .75rem; color: #92400E; line-height: 1.45; margin-bottom: 8px; }
.flag-top { display: flex; align-items: center; gap: 7px; margin-bottom: 6px; flex-wrap: wrap; }
.flag-type-badge { font-size: .7rem; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
.flag-type-badge.red { background: var(--red-light); color: var(--red); }
.flag-type-badge.green { background: var(--green-light); color: var(--green); }
.flag-cat { font-size: .72rem; font-weight: 500; color: var(--gray-5); background: var(--gray-1); border: 1px solid var(--gray-2); padding: 2px 8px; border-radius: 20px; }
.flag-anon { font-size: .68rem; color: var(--gray-4); background: var(--gray-1); border-radius: 20px; padding: 2px 8px; display: flex; align-items: center; gap: 3px; margin-left: auto; }
.flag-comment { font-size: .88rem; color: var(--black); line-height: 1.6; margin-bottom: 8px; }
.flag-meta-row { display: flex; gap: 10px; font-size: .7rem; color: var(--gray-4); flex-wrap: wrap; margin-bottom: 8px; }
/* Gossip */
.gossip-section { background: var(--gray-1); border-radius: var(--radius-sm); padding: .75rem 1rem; margin: 8px 0; border-left: 2px solid var(--gray-3); }
.gossip-label { font-size: .62rem; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--gray-4); margin-bottom: 6px; display: flex; align-items: center; gap: 5px; }
.gossip-unverified { font-size: .6rem; background: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; padding: 1px 6px; border-radius: 10px; font-weight: 600; }
.gossip-item { font-size: .78rem; color: var(--gray-5); line-height: 1.5; padding: 5px 0; border-bottom: 1px solid var(--gray-2); }
.gossip-item:last-child { border-bottom: none; padding-bottom: 0; }
.gossip-item-time { font-size: .65rem; color: var(--gray-4); margin-top: 2px; }
.gossip-add-btn { width: 100%; font-size: .72rem; color: var(--gray-4); background: none; border: 1px dashed var(--gray-3); border-radius: var(--radius-sm); padding: 5px 10px; cursor: pointer; transition: all .15s; text-align: left; margin-top: 6px; }
.gossip-add-btn:hover { border-color: var(--black); color: var(--black); }
.gossip-input-wrap { margin-top: 6px; }
.gossip-textarea { width: 100%; border: 1.5px solid var(--gray-3); border-radius: var(--radius-sm); padding: 7px 10px; font-size: .8rem; color: var(--black); outline: none; resize: none; min-height: 60px; background: var(--white); transition: border-color .15s; }
.gossip-textarea:focus { border-color: var(--black); }
.gossip-note { font-size: .65rem; color: var(--gray-4); line-height: 1.4; margin-top: 4px; }
.gossip-submit { font-family: 'Syne', sans-serif; font-size: .75rem; font-weight: 700; background: var(--black); color: var(--white); border: none; border-radius: var(--radius-sm); padding: 6px 14px; cursor: pointer; margin-top: 5px; transition: opacity .15s; }
.gossip-submit:hover { opacity: .85; }
/* Reply */
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
.reply-submit:hover { opacity: .85; }
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
.both-sides-card { background: var(--white); border: 1px solid var(--gray-2); border-radius: var(--radius); padding: 1.25rem; margin-bottom: 1rem; }
.both-sides-title { font-family: 'Syne', sans-serif; font-size: .85rem; font-weight: 700; color: var(--black); margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
.both-sides-sub { font-size: .75rem; color: var(--gray-5); margin-bottom: 1rem; line-height: 1.5; }
.their-perspective { background: var(--gray-1); border-radius: var(--radius-sm); padding: 10px 12px; font-size: .82rem; color: var(--black); line-height: 1.6; border-left: 3px solid var(--black); }
.their-perspective-meta { font-size: .68rem; color: var(--gray-4); margin-top: 6px; }
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
.share-vibe-btn:hover { opacity: .85; }
.report-link { font-size: .72rem; color: var(--gray-4); text-align: center; display: block; margin-top: 8px; cursor: pointer; text-decoration: underline; }
.report-link:hover { color: var(--red); }
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
.fsi-submit:hover { opacity: .85; }
.fsi-disclaimer { font-size: .68rem; color: var(--gray-4); margin-top: 8px; line-height: 1.4; }
.loading-bar { background: white; border: 1px solid var(--gray-2); border-radius: var(--radius); padding: 12px 14px; margin-bottom: 1rem; font-size: .82rem; color: var(--gray-5); }
.error-bar { background: #fff0f0; border: 1px solid var(--red-mid); color: var(--red); border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 1rem; font-size: .8rem; }
/* Claim card variants */
.claim-card-own { background: var(--green-light); border: 1px solid var(--green-mid); border-radius: var(--radius); padding: 1rem 1.25rem; }
.claim-card-own .sidebar-title { color: var(--green); }
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

// ── Static reason labels ──────────────────────────────────────
const REASON_LABELS = [
  "👀 Going on a date",
  "💍 Shaadi",
  "🔥 Friends with Benefits",
  "🛍️ Buying from them",
  "💼 Work collab",
  "🤝 Just curious",
];

// ── mapPayload — converts raw API response to component state ─
function mapPayload(payload, requestedHandle) {
  // Handle not found
  if (payload.not_found || !payload.handle) {
    return {
      auth:     payload.auth || { isAuthenticated: false, isOwnHandle: false, canClaim: false },
      profile:  {
        handle: requestedHandle,
        initial: (requestedHandle[0] || "U").toUpperCase(),
        avatarGradient: "linear-gradient(135deg,#9CA3AF,#6B7280)",
        location: "Unknown",
        // FIX 3
        searchesThisWeek: 0,
        searchesBreakdown: [],
        firstFlagged: "",
        watched: false,
        // FIX 1
        vibeScore: 0,
        verdict: "No data yet",
        scoreSub: "This handle hasn't been flagged yet.",
        redCount: 0,
        greenCount: 0,
        totalCount: 0,
      },
      perspective:        {},
      meProfile:          { misunderstood: "", pride: "" },
      reasons:            REASON_LABELS,
      flags:              [],
      // FIX 4
      peopleAlsoSearched: [],
      requests:           [],
      notFound:           true,
    };
  }

  const s = payload.stats || {};

  // FIX 1: vibeScore comes directly from backend weighted calculation
  const vibeScore = s.vibeScore ?? 0;

  return {
    auth: payload.auth || { isAuthenticated: false, isOwnHandle: false, canClaim: false },
    profile: {
      handle:           payload.handle?.instagram_handle || requestedHandle,
      initial:          (payload.handle?.instagram_handle || requestedHandle)[0]?.toUpperCase() || "U",
      avatarGradient:   "linear-gradient(135deg,#E2353A,#FF8A65)",
      location:         payload.handle?.city || "India",
      // FIX 3: real search data
      searchesThisWeek: s.searchesThisWeek  || 0,
      searchesBreakdown: (s.searchesBreakdown || []).map(
        b => `${b.reason} × ${b.count}`
      ),
      firstFlagged:     payload.handle?.created_at
        ? new Date(payload.handle.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
        : "",
      watched:    false,
      // FIX 1: use the backend-computed weighted score
      vibeScore,
      verdict:    s.verdict  || verdictFromScore(vibeScore),
      scoreSub:   s.scoreSub || "",
      redCount:   s.red_flag_count   || 0,
      greenCount: s.green_flag_count || 0,
      totalCount: s.total_flag_count || 0,
    },
    perspective: payload.perspective || {},
    meProfile: {
      misunderstood: payload.me_profile?.me_misunderstood || "",
      pride:         payload.me_profile?.me_pride         || "",
    },
    reasons: REASON_LABELS,
    flags:   payload.flags || [],
    // FIX 4: real people also searched
    peopleAlsoSearched: payload.peopleAlsoSearched || [],
    requests: payload.requests || [],
    notFound: false,
  };
}

// Fallback verdict if backend doesn't send one
function verdictFromScore(score) {
  if (score === 0)    return "Clean slate 🌱";
  if (score <= 20)    return "Serious concerns 🚩";
  if (score <= 40)    return "Worrying vibes 🚩";
  if (score <= 60)    return "Mixed signals ⚠️";
  if (score <= 80)    return "Looking good 🟢";
  return "Great vibes 🟢";
}

// ─────────────────────────────────────────────────────────────
export default function SearchPage() {
  const navigate         = useNavigate();
  const location         = useLocation();
  const query            = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const requestedHandle  = (query.get("handle") || "").replace(/^@/, "");
  const reasonParam      = query.get("reason") || REASON_LABELS[0];

  const [data,           setData]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [activeTab,      setActiveTab]      = useState("all");
  const [currentReason,  setCurrentReason]  = useState(reasonParam);
  const [showReasonPicker, setShowReasonPicker] = useState(false);
  const [watching,       setWatching]       = useState(false);
  const [shareToast,     setShareToast]     = useState("");
  const [navSearch,      setNavSearch]      = useState("");
  const [navFocused,     setNavFocused]     = useState(false);
  const [navSuggestions, setNavSuggestions] = useState([]);
  const [navSuggestionsLoading, setNavSuggestionsLoading] = useState(false);
  const [openFlagBox,    setOpenFlagBox]    = useState(false);
  const [flagType,       setFlagType]       = useState("red");
  const [flagForm,       setFlagForm]       = useState({ relation: "", timeframe: "", category_id: "", text: "", identity: true });
  const [submittingFlag, setSubmittingFlag] = useState(false);
  const [knownMap,       setKnownMap]       = useState({});
  const [replies,        setReplies]        = useState({});
  const [replyDrafts,    setReplyDrafts]    = useState({});
  const [openReplyFor,   setOpenReplyFor]   = useState(null);
  // FIX 7: gossip state
  const [gossipDrafts,   setGossipDrafts]   = useState({});
  const [openGossipFor,  setOpenGossipFor]  = useState(null);
  const [submittingGossip, setSubmittingGossip] = useState(false);

  const suggestTimerRef = useRef(null);
  const shareTimerRef   = useRef(null);

  // ── Load search data ────────────────────────────────────────
  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const payload = await apiFetch(`/search/${encodeURIComponent(requestedHandle)}?reason=${encodeURIComponent(currentReason)}`);
        if (ignore) return;

        // ── Handle not found → redirect to no-results page ───
        // This restores the original flow: user searched a handle
        // that doesn't exist yet → redirect to no-results page
        // which shows "Clean slate" + "Drop a flag" CTAs.
        // The backend has already auto-created the Handle document
        // so flagging will work immediately from no-results.
        if (payload?.not_found) {
          const params = new URLSearchParams({
            handle: requestedHandle,
            reason: currentReason,
          });
          // Pass the new_handle_id if backend sent it, so no-results
          // page can use it directly for flag submission
          if (payload.new_handle_id) {
            params.set("handle_id", payload.new_handle_id);
          }
          navigate(`/no-results?${params.toString()}`, { replace: true });
          return;
        }

        const mapped = mapPayload(payload || {}, requestedHandle);
        setData(mapped);
        setWatching(Boolean(mapped.profile?.watched));
      } catch (err) {
        if (!ignore) {
          setError(`Could not load profile for "@${requestedHandle}". Please try again.`);
          setLoading(false);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    if (requestedHandle) load();
    return () => { ignore = true; };
  }, [requestedHandle, currentReason]);

  // ── Nav suggestions debounce ────────────────────────────────
  useEffect(() => {
    const val = navSearch.trim().replace(/^@/, "");
    if (!val) { setNavSuggestions([]); return; }
    suggestTimerRef.current = window.setTimeout(async () => {
      setNavSuggestionsLoading(true);
      try {
        const res = await apiFetch(`/search/suggestions?q=${encodeURIComponent(val)}`);
        setNavSuggestions(res?.items || []);
      } catch { setNavSuggestions([]); }
      finally  { setNavSuggestionsLoading(false); }
    }, 220);
    return () => { if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current); };
  }, [navSearch]);

  // ── Share toast auto-dismiss ────────────────────────────────
  useEffect(() => {
    if (!shareToast) return;
    shareTimerRef.current = window.setTimeout(() => setShareToast(""), 1800);
    return () => { if (shareTimerRef.current) clearTimeout(shareTimerRef.current); };
  }, [shareToast]);

  const visibleFlags = useMemo(() => {
    if (!data?.flags) return [];
    if (activeTab === "all")   return data.flags;
    if (activeTab === "red")   return data.flags.filter(f => f.type === "red");
    if (activeTab === "green") return data.flags.filter(f => f.type === "green");
    return [];
  }, [activeTab, data?.flags]);

  // FIX 1: use actual vibeScore from data (backend-computed)
  const vibeScore = data?.profile?.vibeScore ?? 0;
  const greenPct  = Math.max(0, Math.min(100, vibeScore));
  const redPct    = 100 - greenPct;
  const ringStyle = {
    background: `conic-gradient(var(--green) 0% ${greenPct}%, var(--red) ${greenPct}% 100%)`,
  };

  // FIX 5: auth shortcuts
  const auth        = data?.auth || {};
  const isAuth      = auth.isAuthenticated;
  const isOwnHandle = auth.isOwnHandle;       // logged in AND this is their handle
  const canClaim    = auth.canClaim;          // logged in BUT hasn't claimed any handle
  const userHandle  = auth.userHandle;        // their own instagram_handle from DB

  function doNavSearch(override) {
    const next = (override || navSearch).trim().replace(/^@/, "");
    if (!next) return;
    navigate(`/search?handle=${encodeURIComponent(next)}&reason=${encodeURIComponent(currentReason)}`);
  }

  function toggleWatch() {
    const next = !watching;
    setWatching(next);
    const method = next ? "POST" : "DELETE";
    const path   = next ? "/watches" : `/watches/handle/${encodeURIComponent(data.profile.handle)}`;
    apiFetch(path, { method, body: next ? JSON.stringify({ handle_id: data.profile.handle }) : undefined })
      .catch(() => setWatching(!next));
  }

  function openFlag(type) {
    setFlagType(type);
    setOpenFlagBox(true);
    setFlagForm(c => ({ ...c, category_id: "" }));
    window.setTimeout(() => {
      const el = document.getElementById("flagSubmitInlineReact");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  async function submitFlag() {
    setSubmittingFlag(true);
    try {
      await apiFetch("/flags", {
        method: "POST",
        body: JSON.stringify({
          handle_id:    data.profile.handle,
          flag_type:    flagType,
          relationship: flagForm.relation,
          timeframe:    flagForm.timeframe,
          category_id:  flagForm.category_id,
          comment:      flagForm.text,
          identity:     flagForm.identity ? "anonymous" : "named",
        }),
      });
      setShareToast("✅ Flag posted! Thank you.");
      setOpenFlagBox(false);
      setFlagForm({ relation: "", timeframe: "", category_id: "", text: "", identity: true });
    } catch (err) {
      setError(err.message || "Could not post flag.");
    } finally {
      setSubmittingFlag(false);
    }
  }

  function toggleKnow(flagId) {
    setKnownMap(c => ({ ...c, [flagId]: !c[flagId] }));
    apiFetch(`/flags/${flagId}/know`, { method: "POST" }).catch(() => {});
  }

  function shareFlag(text) {
    if (navigator.share) navigator.share({ title: "Clocked", text }).catch(() => {});
    setShareToast("Link copied / shared");
  }

  function shareVibe() {
    window.open(`/vibe-card/${data.profile.handle}`, "_blank");
  }

  function submitReply(flagId) {
    const value = (replyDrafts[flagId] || "").trim();
    if (!value) return;
    setReplies(c => ({ ...c, [flagId]: value }));
    setOpenReplyFor(null);
    setReplyDrafts(c => ({ ...c, [flagId]: "" }));
    apiFetch(`/flags/${flagId}/reply`, {
      method: "POST",
      body: JSON.stringify({ text: value }),
    }).catch(() => {});
  }

  // FIX 7: Submit gossip
  async function submitGossip(flagId) {
    const value = (gossipDrafts[flagId] || "").trim();
    if (!value) return;
    setSubmittingGossip(true);
    try {
      await apiFetch(`/flags/${flagId}/gossip`, {
        method: "POST",
        body: JSON.stringify({ content: value }),
      });
      setGossipDrafts(c => ({ ...c, [flagId]: "" }));
      setOpenGossipFor(null);
      setShareToast("🗣️ Gossip added (unverified)");
    } catch (err) {
      setError(err.message || "Could not add gossip.");
    } finally {
      setSubmittingGossip(false);
    }
  }

  if (loading) {
    return (
      <div className="searchpage-shell">
        <style>{pageCss}</style>
        <div className="page"><div className="loading-bar">Loading @{requestedHandle}...</div></div>
      </div>
    );
  }

  if (!data) return null;

  const profile = data.profile;
  const navPrimaryAction   = isAuth ? { label: "Dashboard", to: "/dashboard" } : { label: "Sign up",   to: "/signup" };
  const navSecondaryAction = isAuth ? { label: "Open app",  to: "/dashboard" } : { label: "Log in",    to: "/auth"   };

  return (
    <div className="searchpage-shell">
      <style>{pageCss}</style>

      {/* ── NAV ─────────────────────────────────────────────── */}
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
            onChange={e => setNavSearch(e.target.value)}
            onFocus={() => setNavFocused(true)}
            onBlur={() => window.setTimeout(() => setNavFocused(false), 120)}
            onKeyDown={e => e.key === "Enter" && doNavSearch()}
          />
          <button className="nav-search-btn" onClick={() => doNavSearch()}>Search</button>

          {navFocused && (navSuggestionsLoading || navSuggestions.length > 0) && (
            <div className="search-suggestions">
              {navSuggestionsLoading ? (
                <div style={{ padding: "10px 14px", fontSize: ".8rem", color: "var(--gray-5)" }}>Loading...</div>
              ) : navSuggestions.map(item => {
                const good = (item.score ?? 0) > 55;
                return (
                  <button key={item.id || item.handle} className="suggest-btn" onMouseDown={() => doNavSearch(item.handle)}>
                    <div className="suggest-avatar" style={{ background: item.color || (good ? "#1A9E5F" : "#E2353A") }}>
                      {String(item.handle || "@")[0].toUpperCase()}
                    </div>
                    <div className="suggest-info">
                      <div className="suggest-handle">@{item.handle}</div>
                      <div className="suggest-meta">{item.red || 0} red · {item.green || 0} green</div>
                    </div>
                    <span className="suggest-score" style={{ background: good ? "#F0FFF8" : "#FFF0F0", color: good ? "#1A9E5F" : "#E2353A" }}>
                      {item.score ?? 0}%
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="nav-right">
          <Link to={navSecondaryAction.to} className="btn-ghost">{navSecondaryAction.label}</Link>
          <Link to={navPrimaryAction.to}   className="btn-solid">{navPrimaryAction.label}</Link>
        </div>
      </nav>

      {/* ── WHY BANNER ──────────────────────────────────────── */}
      <div className="why-banner">
        <span>You searched because:</span>
        <span className="why-chip">{currentReason}</span>
        <button className="why-change" onClick={() => setShowReasonPicker(v => !v)}>change</button>
        {showReasonPicker && (
          <div className="why-options">
            {REASON_LABELS.map(r => (
              <button
                key={r}
                className={`why-option ${currentReason === r ? "active" : ""}`}
                onClick={() => {
                  setCurrentReason(r);
                  setShowReasonPicker(false);
                  navigate(`/search?handle=${encodeURIComponent(profile.handle)}&reason=${encodeURIComponent(r)}`);
                }}
              >{r}</button>
            ))}
          </div>
        )}
      </div>

      <div className="page">
        <div className="main-col">
          {error && <div className="error-bar">{error}</div>}

          {/* ── PROFILE CARD ──────────────────────────────── */}
          <div className="profile-card">
            <div className="profile-top">
              <div className="profile-avatar" style={{ background: profile.avatarGradient }}>
                {profile.initial}
              </div>
              <div className="profile-info">
                <div className="profile-handle">@{profile.handle}</div>
                <div className="profile-meta">
                  {profile.location && <span>📍 {profile.location}</span>}
                  {/* FIX 3: real search count */}
                  <span>🔍 {profile.searchesThisWeek} searches this week</span>
                  {profile.firstFlagged && <span>📅 First flagged {profile.firstFlagged}</span>}
                </div>
                {!data.notFound && (
                  <div className="profile-actions">
                    <button className={`action-btn ${watching ? "watching" : ""}`} onClick={toggleWatch}>
                      {watching ? "👁 Watching" : "👁 Watch handle"}
                    </button>
                    <button className="action-btn flag-red"   onClick={() => openFlag("red")}>🚩 Drop a Red flag</button>
                    <button className="action-btn flag-green" onClick={() => openFlag("green")}>🟢 Drop a Green flag</button>
                  </div>
                )}
              </div>
            </div>

            {!data.notFound && (
              <>
                {/* FIX 1: Vibe score ring — uses real greenPct from weighted formula */}
                <div className="vibe-row">
                  <div className="score-ring-wrap">
                    <div className="score-ring" style={ringStyle}>
                      <div className="score-inner">
                        <span
                          className="score-num"
                          style={{ color: greenPct >= 50 ? "var(--green)" : "var(--red)" }}
                        >
                          {vibeScore}%
                        </span>
                        <span className="score-pct">vibe</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="score-label">Vibe score</div>
                    <div
                      className="score-verdict"
                      style={{ color: greenPct >= 50 ? "var(--green)" : "var(--red)" }}
                    >
                      {profile.verdict}
                    </div>
                    <div className="score-sub">{profile.scoreSub}</div>
                  </div>
                  <div className="flag-counts">
                    <div className="flag-count-item">
                      <span className="flag-count-label" style={{ color: "var(--red)" }}>🚩 Red</span>
                      <div className="flag-count-bar-wrap">
                        <div className="flag-count-bar red" style={{ width: `${redPct}%` }}></div>
                      </div>
                      <span className="flag-count-num" style={{ color: "var(--red)" }}>{profile.redCount}</span>
                    </div>
                    <div className="flag-count-item">
                      <span className="flag-count-label" style={{ color: "var(--green)" }}>🟢 Green</span>
                      <div className="flag-count-bar-wrap">
                        <div className="flag-count-bar green" style={{ width: `${greenPct}%` }}></div>
                      </div>
                      <span className="flag-count-num" style={{ color: "var(--green)" }}>{profile.greenCount}</span>
                    </div>
                  </div>
                </div>

                {/* FIX 2: Community pattern REMOVED */}

                {/* FIX 3: People searched this handle — real data */}
                {(profile.searchesThisWeek > 0 || profile.searchesBreakdown?.length > 0) && (
                  <div className="searched-card">
                    <span className="searched-icon">👀</span>
                    <div className="searched-text">
                      <strong>{profile.searchesThisWeek} people searched this handle this week</strong>
                      {profile.searchesBreakdown?.length > 0 && (
                        <div className="searched-strip">
                          {profile.searchesBreakdown.map((item, i) => (
                            <span key={i} className="searched-chip">{item}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── FLAG SUBMIT INLINE ────────────────────────── */}
          <div id="flagSubmitInlineReact" className={`flag-submit-inline ${openFlagBox ? "open" : ""}`}>
            <div className="fsi-title">{flagType === "red" ? "🚩 Drop a red flag" : "🟢 Drop a green flag"}</div>
            <div className="fsi-row">
              <select className="fsi-select" value={flagForm.relation} onChange={e => setFlagForm(c => ({ ...c, relation: e.target.value }))}>
                <option value="">How do you know them?</option>
                <option value="dated">💔 Dated</option>
                <option value="date">☕ Went on a date</option>
                <option value="shaadi">💍 Shaadi / arranged intro</option>
                <option value="fwb">🔥 Friends with Benefits</option>
                <option value="datingapp">📲 Dating app match</option>
                <option value="online">📱 Followed online</option>
                <option value="met">🤝 Met in person</option>
                <option value="event">🎉 Met at event</option>
                <option value="college">🏫 College / school</option>
                <option value="work">💼 Work / business</option>
                <option value="gym">🏋️ Gym / class</option>
                <option value="neighbourhood">🏘️ Neighbourhood</option>
                <option value="family">👨‍👩‍👧 Family</option>
                <option value="bought">🛍️ Bought / sold</option>
                <option value="heard">👂 Heard through people</option>
              </select>
              <select className="fsi-select" value={flagForm.timeframe} onChange={e => setFlagForm(c => ({ ...c, timeframe: e.target.value }))}>
                <option value="">When was this?</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="months">1–6 months ago</option>
                <option value="year">Over a year ago</option>
              </select>
            </div>
            <select className="fsi-select" style={{ width: "100%", marginBottom: 10 }} value={flagForm.category_id} onChange={e => setFlagForm(c => ({ ...c, category_id: e.target.value }))}>
              <option value="">Select a category...</option>
              <optgroup label="🚩 Red flags">
                {["Ghosting / went silent","Love bombing","Fake / catfish","Catfished with AI photos","Scammer / fraud","Narcissistic behaviour","Emotionally unavailable","Manipulative","Breadcrumbing","Verbal abuse","Stalking / obsessive behaviour","Fake social media presence","Unsolicited explicit content","Rude / toxic behaviour","Cheated / dishonest","Racist / discriminatory"].map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
              <optgroup label="🟢 Green flags">
                {["Genuine & kind","Great communicator","Legit & honest","Super helpful","Great seller / buyer","Trustworthy","Emotionally available","Emotionally mature","Consistent","Respectful of boundaries","Great listener","Financially responsible","Family oriented","Socially aware","Goes above and beyond"].map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
            </select>
            <textarea className="fsi-textarea" placeholder="Share your experience... (optional, max 300 chars)" maxLength={300} value={flagForm.text} onChange={e => setFlagForm(c => ({ ...c, text: e.target.value }))}></textarea>
            <div className="fsi-bottom">
              <label className="fsi-anon-toggle">
                <input type="checkbox" checked={flagForm.identity} onChange={e => setFlagForm(c => ({ ...c, identity: e.target.checked }))} />
                Post anonymously
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ background: "var(--gray-1)", color: "var(--gray-5)", border: "1px solid var(--gray-3)", borderRadius: "var(--radius-sm)", padding: "9px 16px", cursor: "pointer", fontSize: ".82rem" }} onClick={() => setOpenFlagBox(false)}>Cancel</button>
                <button className={`fsi-submit ${flagType}`} onClick={submitFlag}>{submittingFlag ? "Posting..." : flagType === "red" ? "Post red flag →" : "Post green flag →"}</button>
              </div>
            </div>
            <div className="fsi-disclaimer">⚖️ By posting you confirm this is your genuine personal experience and you take full legal responsibility.</div>
          </div>

          {/* ── TABS + FLAGS ──────────────────────────────── */}
          {!data.notFound && (
            <>
              <div className="tabs-row">
                <button className={`tab-btn ${activeTab === "all"         ? "active" : ""}`} onClick={() => setActiveTab("all")}>All ({data.flags.length})</button>
                <button className={`tab-btn ${activeTab === "red"         ? "active" : ""}`} onClick={() => setActiveTab("red")}>🚩 Red ({data.flags.filter(f => f.type === "red").length})</button>
                <button className={`tab-btn ${activeTab === "green"       ? "active" : ""}`} onClick={() => setActiveTab("green")}>🟢 Green ({data.flags.filter(f => f.type === "green").length})</button>
                <button className={`tab-btn ${activeTab === "perspective" ? "active" : ""}`} onClick={() => setActiveTab("perspective")}>⚖️ Both sides</button>
                <button className={`tab-btn ${activeTab === "me"          ? "active" : ""}`} onClick={() => setActiveTab("me")}>👤 Me profile</button>
              </div>

              {/* FLAGS LIST */}
              {(activeTab === "all" || activeTab === "red" || activeTab === "green") && (
                <div>
                  {visibleFlags.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">🫥</div>
                      <div className="empty-title">No flags here yet</div>
                      <div className="empty-sub">Be the first to share your experience.</div>
                    </div>
                  ) : visibleFlags.map(flag => (
                    <div key={flag.id} className={`flag-card ${flag.type === "red" ? "red-card" : "green-card"} ${flag.disputed ? "disputed" : ""} ${flag.expired ? "expired" : ""}`}>

                      <div className="flag-top">
                        <span className={`flag-type-badge ${flag.type}`}>{flag.type === "red" ? "🚩 Red flag" : "🟢 Green flag"}</span>
                        <span className="flag-cat">{flag.category}</span>
                        {flag.disputed && <span className="disputed-badge">⚠️ Disputed</span>}
                        {flag.expired  && <span className="expired-badge">Expired</span>}
                        {flag.anonymous && <span className="flag-anon">🎭 anonymous</span>}
                      </div>

                      {flag.disputed && (
                        <div className="disputed-note">⚠️ This flag exists between two people who have both flagged each other. Read with that context in mind.</div>
                      )}

                      <p className="flag-comment">{flag.comment}</p>

                      <div className="flag-meta-row">
                        <span>{flag.relationship}</span>
                        <span>{flag.timeframe}</span>
                        <span>{flag.credibility}</span>
                        <span>{flag.postedAt}</span>
                      </div>

                      {/* FIX 7: Gossip section */}
                      {(flag.gossip?.length > 0 || isAuth) && (
                        <div className="gossip-section">
                          <div className="gossip-label">
                            🗣️ Gossip
                            <span className="gossip-unverified">⚠️ Unverified — does not affect vibe score</span>
                          </div>

                          {flag.gossip?.map((g, gi) => (
                            <div key={g.id || gi} className="gossip-item">
                              {g.content}
                              <div className="gossip-item-time">{g.postedAt}</div>
                            </div>
                          ))}

                          {isAuth && (
                            openGossipFor === flag.id ? (
                              <div className="gossip-input-wrap">
                                <textarea
                                  className="gossip-textarea"
                                  placeholder="Add what you've heard — clearly marked as unverified (300 chars max)"
                                  maxLength={300}
                                  value={gossipDrafts[flag.id] || ""}
                                  onChange={e => setGossipDrafts(c => ({ ...c, [flag.id]: e.target.value }))}
                                />
                                <div className="gossip-note">⚠️ Gossip is labelled Unverified and never affects the vibe score.</div>
                                <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                                  <button className="gossip-submit" onClick={() => submitGossip(flag.id)} disabled={submittingGossip}>
                                    {submittingGossip ? "Adding..." : "Add gossip →"}
                                  </button>
                                  <button style={{ background: "none", border: "none", color: "var(--gray-4)", fontSize: ".75rem", cursor: "pointer" }} onClick={() => setOpenGossipFor(null)}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button className="gossip-add-btn" onClick={() => setOpenGossipFor(flag.id)}>
                                + Add what you've heard (gossip)
                              </button>
                            )
                          )}
                        </div>
                      )}

                      {/* FIX 6: Reply — only show "Add your reply" if it's their own handle */}
                      <div className="reply-wrap">
                        {replies[flag.id] ? (
                          <>
                            <div className="reply-label">Your reply</div>
                            <div className="reply-box their-side">{replies[flag.id]}</div>
                          </>
                        ) : (
                          <>
                            {/* FIX 6: Only show reply input if isOwnHandle */}
                            {isOwnHandle ? (
                              openReplyFor === flag.id ? (
                                <div className="reply-input-wrap open">
                                  <textarea
                                    className="reply-textarea"
                                    placeholder="Your one public reply to this flag... (300 chars max)"
                                    maxLength={300}
                                    value={replyDrafts[flag.id] || ""}
                                    onChange={e => setReplyDrafts(c => ({ ...c, [flag.id]: e.target.value }))}
                                  />
                                  <div className="reply-char">{(replyDrafts[flag.id] || "").length} / 300</div>
                                  <button className="reply-submit" onClick={() => submitReply(flag.id)}>Post reply →</button>
                                </div>
                              ) : (
                                <button className="add-reply-btn" onClick={() => setOpenReplyFor(flag.id)}>
                                  + Add your reply to this flag (you get one)
                                </button>
                              )
                            ) : null}
                          </>
                        )}
                      </div>

                      <div className="flag-footer">
                        <div className="flag-actions-left">
                          <button className={`know-btn ${knownMap[flag.id] ? "known" : ""}`} onClick={() => toggleKnow(flag.id)}>
                            👋 I know this person
                          </button>
                          <span className="know-count">{(flag.know_count || 0) + (knownMap[flag.id] ? 1 : 0)} people know them</span>
                        </div>
                        <button className="share-flag-btn" onClick={() => shareFlag(flag.shareText || `Flag on @${profile.handle}`)}>
                          ↗ Share
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* BOTH SIDES TAB */}
              {activeTab === "perspective" && (
                <div>
                  {data.perspective?.content ? (
                    <div className="both-sides-card">
                      <div className="both-sides-title">⚖️ Their perspective <span className="me-badge" style={{ background: "var(--black)" }}>Self submitted</span></div>
                      <div className="both-sides-sub">This person has submitted their own side. Read flags and this together to form your own view.</div>
                      <div className="their-perspective">{data.perspective.content}</div>
                      {data.perspective.created_at && (
                        <div className="their-perspective-meta">Submitted by @{profile.handle} · {new Date(data.perspective.created_at).toLocaleDateString("en-IN")}</div>
                      )}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">⚖️</div>
                      <div className="empty-title">No perspective yet</div>
                      <div className="empty-sub">@{profile.handle} hasn't added their side of the story.</div>
                    </div>
                  )}
                </div>
              )}

              {/* ME PROFILE TAB */}
              {activeTab === "me" && (
                <div>
                  {(data.meProfile?.misunderstood || data.meProfile?.pride) ? (
                    <div className="me-profile-card">
                      <div className="me-title">👤 @{profile.handle} says <span className="me-badge">Self aware</span></div>
                      {data.meProfile.misunderstood && (
                        <div className="me-item">
                          <div className="me-label">What people often misunderstand about me</div>
                          <div className="me-value">{data.meProfile.misunderstood}</div>
                        </div>
                      )}
                      {data.meProfile.pride && (
                        <div className="me-item">
                          <div className="me-label">What I genuinely pride myself on</div>
                          <div className="me-value">{data.meProfile.pride}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">👤</div>
                      <div className="empty-title">No profile yet</div>
                      <div className="empty-sub">@{profile.handle} hasn't added a me profile.</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── SIDEBAR ───────────────────────────────────────── */}
        <aside className="sidebar">

          <div className="sidebar-card">
            <p className="sidebar-title">📤 Share vibe card</p>
            <button className="share-vibe-btn" onClick={shareVibe}>🎴 Share @{profile.handle}'s card</button>
            <Link to="/grievance" className="report-link">🛡️ Report this handle</Link>
          </div>

          {/* FIX 4: People also searched — real data from search_logs */}
          {data.peopleAlsoSearched?.length > 0 && (
            <div className="sidebar-card">
              <p className="sidebar-title">👀 People also searched</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.peopleAlsoSearched.map(item => {
                  const good = item.vibe > 55;
                  return (
                    <button
                      key={item.handle}
                      style={{ fontSize: ".82rem", color: "var(--black)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", textAlign: "left" }}
                      onClick={() => navigate(`/search?handle=${encodeURIComponent(item.handle)}&reason=${encodeURIComponent(currentReason)}`)}
                    >
                      @{item.handle}
                      <span style={{ fontSize: ".68rem", background: good ? "var(--green-light)" : "var(--red-light)", color: good ? "var(--green)" : "var(--red)", padding: "2px 7px", borderRadius: "20px", fontWeight: 600 }}>
                        {good ? "🟢" : "🚩"} {item.vibe}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Flag requests */}
          {data.requests?.length > 0 && (
            <div className="sidebar-card">
              <p className="sidebar-title">🙋 Flag requests</p>
              {data.requests.map((item, idx) => (
                <div key={idx} className="flag-request-item">
                  <div className="req-why">{item.why}</div>
                  {item.text}
                </div>
              ))}
            </div>
          )}

          {/* FIX 5: Claim / own handle logic */}
          {isOwnHandle ? (
            // They ARE the owner of this handle
            <div className="sidebar-card claim-card-own">
              <p className="sidebar-title" style={{ color: "var(--green)" }}>✅ Your profile</p>
              <p style={{ fontSize: ".82rem", color: "var(--black)", lineHeight: 1.55, marginBottom: ".75rem", fontWeight: 500 }}>
                This is your handle <strong>@{userHandle}</strong>. You have {data.flags.length} flag{data.flags.length !== 1 ? "s" : ""} on your profile.
              </p>
              <Link to="/dashboard" style={{ display: "block", background: "var(--green)", color: "var(--white)", fontFamily: "Syne, sans-serif", fontSize: ".82rem", fontWeight: 700, padding: 9, borderRadius: "var(--radius-sm)", textAlign: "center", textDecoration: "none" }}>
                Go to dashboard →
              </Link>
            </div>
          ) : canClaim ? (
            // Logged in but hasn't claimed any handle — offer to claim
            <div className="sidebar-card" style={{ background: "var(--black)", borderColor: "var(--black)" }}>
              <p className="sidebar-title" style={{ color: "rgba(255,255,255,.4)" }}>🔔 Is this your handle?</p>
              <p style={{ fontSize: ".78rem", color: "rgba(255,255,255,.6)", lineHeight: 1.5, marginBottom: ".9rem" }}>
                There are {data.flags.length} flags on this profile. Claim it to see who searched you, add your perspective, and reply to flags.
              </p>
              <Link to="/dashboard?claim=true" style={{ display: "block", background: "var(--white)", color: "var(--black)", fontFamily: "Syne, sans-serif", fontSize: ".82rem", fontWeight: 700, padding: 9, borderRadius: "var(--radius-sm)", textAlign: "center", textDecoration: "none" }}>
                Claim your profile →
              </Link>
            </div>
          ) : !isAuth ? (
            // Logged out — invite them to sign up
            <div className="sidebar-card" style={{ background: "var(--black)", borderColor: "var(--black)" }}>
              <p className="sidebar-title" style={{ color: "rgba(255,255,255,.4)" }}>🔔 Is this your handle?</p>
              <p style={{ fontSize: ".78rem", color: "rgba(255,255,255,.6)", lineHeight: 1.5, marginBottom: ".9rem" }}>
                You have {data.flags.length} flags on your profile. Sign up to see who searched you, add your perspective, and post one reply to each flag.
              </p>
              <Link to="/signup" style={{ display: "block", background: "var(--white)", color: "var(--black)", fontFamily: "Syne, sans-serif", fontSize: ".82rem", fontWeight: 700, padding: 9, borderRadius: "var(--radius-sm)", textAlign: "center", textDecoration: "none" }}>
                Claim your profile →
              </Link>
            </div>
          ) : null
          // If logged in and already claimed a DIFFERENT handle — show nothing here
          }

        </aside>
      </div>

      <div className={`share-toast ${shareToast ? "show" : ""}`}>{shareToast}</div>
    </div>
  );
}
