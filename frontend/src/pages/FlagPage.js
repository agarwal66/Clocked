import React, { useEffect, useMemo, useState } from "react";
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
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --red:#E2353A;--red-light:#FFF0F0;--red-mid:#FFBDBE;
  --green:#1A9E5F;--green-light:#F0FFF8;--green-mid:#A3E6C8;
  --black:#0C0C0A;--off-white:#F8F7F3;
  --gray-1:#F2F1EC;--gray-2:#E5E4DE;--gray-3:#CCCBC4;
  --gray-4:#9E9D97;--gray-5:#5E5D58;--white:#FFFFFF;
  --radius:14px;--radius-sm:8px;
}
.flagpage-shell{font-family:'DM Sans',sans-serif;background:var(--off-white);color:var(--black);min-height:100vh;display:flex;flex-direction:column}
.flagpage-shell button,.flagpage-shell input,.flagpage-shell textarea,.flagpage-shell select{font-family:inherit}
.topnav{height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 2rem;background:var(--white);border-bottom:1px solid var(--gray-2);flex-shrink:0;position:sticky;top:0;z-index:100}
.nav-logo{font-family:'Syne',sans-serif;font-size:1.2rem;font-weight:800;letter-spacing:-.5px;color:var(--black);text-decoration:none;display:flex;align-items:center;gap:8px}
.logo-flags{display:flex;gap:4px;align-items:center}.flag-shape{width:9px;height:15px;clip-path:polygon(0 0,100% 15%,100% 85%,0 100%);display:block}.flag-r{background:var(--red)}.flag-g{background:var(--green)}
.nav-back{font-size:.82rem;color:var(--gray-5);background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:5px;padding:0;transition:color .15s}.nav-back:hover{color:var(--black)}
.page-wrap{flex:1;display:flex;flex-direction:column}.page{flex:1;max-width:860px;margin:0 auto;width:100%;padding:2.5rem 2rem 3rem;display:grid;grid-template-columns:1fr 300px;gap:2rem;align-items:start}
.steps-bar{display:flex;align-items:center;margin-bottom:2rem;position:relative;padding-bottom:1.5rem}.step-dot{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:.72rem;font-weight:700;border:1.5px solid var(--gray-3);color:var(--gray-4);background:var(--white);flex-shrink:0;transition:all .2s;position:relative;z-index:1}.step-dot.active{background:var(--black);border-color:var(--black);color:var(--white)}.step-dot.done{background:var(--green);border-color:var(--green);color:var(--white)}.step-label{position:absolute;top:38px;left:50%;transform:translateX(-50%);font-size:.62rem;color:var(--gray-4);white-space:nowrap;font-weight:500}.step-dot.active .step-label{color:var(--black);font-weight:600}.step-dot.done .step-label{color:var(--green)}.step-line{flex:1;height:1.5px;background:var(--gray-2);transition:background .3s}.step-line.done{background:var(--green)}
.card{background:var(--white);border:1px solid var(--gray-2);border-radius:var(--radius);padding:1.5rem;margin-bottom:1rem}.card-title{font-family:'Syne',sans-serif;font-size:.95rem;font-weight:700;color:var(--black);margin-bottom:1.25rem;display:flex;align-items:center;gap:8px}.card-icon{width:28px;height:28px;border-radius:8px;background:var(--gray-1);display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0}
.step-screen{display:none}.step-screen.active{display:block}
.flag-type-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.flag-type-opt{border:2px solid var(--gray-2);border-radius:var(--radius);padding:1.25rem;cursor:pointer;transition:all .2s;text-align:center;background:var(--gray-1);user-select:none;position:relative}.flag-type-opt:hover{border-color:var(--gray-3)}.flag-type-opt.sel-red{border-color:var(--red);background:var(--red-light)}.flag-type-opt.sel-green{border-color:var(--green);background:var(--green-light)}.flag-type-icon{font-size:2rem;display:block;margin-bottom:.5rem}.flag-type-label{font-family:'Syne',sans-serif;font-size:1rem;font-weight:800;display:block;margin-bottom:4px;color:var(--black)}.flag-type-opt.sel-red .flag-type-label{color:var(--red)}.flag-type-opt.sel-green .flag-type-label{color:var(--green)}.flag-type-desc{font-size:.75rem;color:var(--gray-5);line-height:1.4}.flag-type-check{position:absolute;top:10px;right:12px;width:20px;height:20px;border-radius:50%;border:1.5px solid var(--gray-3);background:var(--white);display:flex;align-items:center;justify-content:center;font-size:.7rem;color:transparent;transition:all .2s}.flag-type-opt.sel-red .flag-type-check{background:var(--red);border-color:var(--red);color:var(--white)}.flag-type-opt.sel-green .flag-type-check{background:var(--green);border-color:var(--green);color:var(--white)}
.handle-input-wrap{position:relative;margin-bottom:.5rem}.handle-at{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-family:'Syne',sans-serif;font-size:.95rem;font-weight:700;color:var(--gray-4)}.text-input{width:100%;font-size:.95rem;border:1.5px solid var(--gray-3);border-radius:var(--radius-sm);padding:11px 14px;background:var(--white);color:var(--black);outline:none;transition:border-color .15s,box-shadow .15s}.text-input:focus{border-color:var(--black);box-shadow:0 0 0 3px rgba(0,0,0,.05)}.text-input::placeholder{color:var(--gray-4);font-size:.9rem}.text-input.err{border-color:var(--red)}.text-input.ok{border-color:var(--green)}.field-err{font-size:.72rem;color:var(--red);margin-top:4px;display:block}.field-hint{font-size:.72rem;color:var(--gray-4);margin-top:4px}
.handle-preview{display:none;align-items:center;gap:10px;background:var(--gray-1);border:1px solid var(--gray-2);border-radius:var(--radius-sm);padding:10px 12px;margin-top:8px}.handle-preview.show{display:flex}.handle-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:.82rem;font-weight:700;color:var(--white);flex-shrink:0}.handle-info{flex:1;min-width:0}.handle-name{font-size:.85rem;font-weight:600;color:var(--black)}.handle-flags{font-size:.7rem;color:var(--gray-4);margin-top:1px}.handle-score{font-size:.7rem;font-weight:700;padding:2px 8px;border-radius:20px;white-space:nowrap}.handle-score.red{background:var(--red-light);color:var(--red)}.handle-score.green{background:var(--green-light);color:var(--green)}
.select-input{width:100%;font-size:.92rem;border:1.5px solid var(--gray-3);border-radius:var(--radius-sm);padding:11px 14px;background:var(--white);color:var(--black);outline:none;cursor:pointer;transition:border-color .15s;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239E9D97' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px}.select-input:focus{border-color:var(--black);box-shadow:0 0 0 3px rgba(0,0,0,.05)}.select-input.err{border-color:var(--red)}
.field{margin-bottom:1rem}.field:last-child{margin-bottom:0}.field-label{display:block;font-size:.78rem;font-weight:500;color:var(--gray-5);margin-bottom:5px}.field-label .optional{color:var(--gray-4);font-weight:400}
.comment-input{width:100%;font-size:.9rem;border:1.5px solid var(--gray-3);border-radius:var(--radius-sm);padding:11px 14px;color:var(--black);background:var(--white);outline:none;resize:none;min-height:110px;line-height:1.6;transition:border-color .15s}.comment-input:focus{border-color:var(--black);box-shadow:0 0 0 3px rgba(0,0,0,.05)}.comment-input::placeholder{color:var(--gray-4)}.char-count{font-size:.7rem;color:var(--gray-4);text-align:right;margin-top:4px}
.identity-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.identity-opt{border:1.5px solid var(--gray-3);border-radius:var(--radius-sm);padding:12px;cursor:pointer;transition:all .15s;text-align:center;background:var(--gray-1);user-select:none}.identity-opt:hover{border-color:var(--gray-4)}.identity-opt.sel-anon{border-color:var(--black);background:var(--black)}.identity-opt.sel-named{border-color:var(--green);background:var(--green-light)}.id-icon{font-size:1.3rem;display:block;margin-bottom:4px}.id-label{font-family:'Syne',sans-serif;font-size:.8rem;font-weight:700;display:block;margin-bottom:2px;color:var(--black)}.identity-opt.sel-anon .id-label{color:var(--white)}.identity-opt.sel-anon .id-desc{color:rgba(255,255,255,.5)}.identity-opt.sel-named .id-label{color:var(--green)}.id-desc{font-size:.67rem;color:var(--gray-5);line-height:1.3}
.disclaimer-box{background:var(--red-light);border:1px solid var(--red-mid);border-radius:var(--radius-sm);padding:1rem 1.1rem;margin-bottom:1rem}.disclaimer-title{font-size:.78rem;font-weight:600;color:var(--black);margin-bottom:.5rem;display:flex;align-items:center;gap:6px}.check-item{display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid rgba(226,53,58,.1);cursor:pointer;user-select:none}.check-item:last-child{border-bottom:none;padding-bottom:0}.check-item:first-child{padding-top:0}.check-box{width:18px;height:18px;border-radius:4px;border:1.5px solid var(--red-mid);background:var(--white);flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;font-size:.68rem;color:transparent;transition:all .15s}.check-item.ticked .check-box{background:var(--green);border-color:var(--green);color:var(--white)}.check-text{font-size:.76rem;color:var(--gray-5);line-height:1.4}.check-text strong{color:var(--black);font-weight:500}
.preview-card{background:var(--gray-1);border:1px solid var(--gray-2);border-radius:var(--radius);padding:1.25rem;margin-bottom:1rem}.preview-label{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-4);margin-bottom:.85rem}.preview-flag{border-radius:var(--radius-sm);padding:1rem;border-left:3px solid var(--gray-3)}.preview-flag.red{background:var(--red-light);border-left-color:var(--red)}.preview-flag.green{background:var(--green-light);border-left-color:var(--green)}.preview-top{display:flex;align-items:center;gap:7px;margin-bottom:6px;flex-wrap:wrap}.preview-badge{font-size:.7rem;font-weight:700;padding:3px 10px;border-radius:20px}.preview-badge.red{background:var(--red);color:var(--white)}.preview-badge.green{background:var(--green);color:var(--white)}.preview-cat{font-size:.7rem;font-weight:500;padding:2px 8px;border-radius:20px;background:rgba(0,0,0,.07);color:var(--black)}.preview-anon{font-size:.68rem;color:var(--gray-4);background:rgba(0,0,0,.05);border-radius:20px;padding:2px 8px;margin-left:auto}.preview-comment{font-size:.84rem;color:var(--black);line-height:1.55;margin-bottom:6px}.preview-meta{display:flex;gap:8px;font-size:.68rem;color:var(--gray-4);flex-wrap:wrap}
.btn-row{display:flex;gap:10px}.back-btn-form{font-family:'Syne',sans-serif;font-size:.88rem;font-weight:700;background:var(--gray-1);color:var(--black);border:1px solid var(--gray-3);border-radius:var(--radius-sm);padding:13px 20px;cursor:pointer;flex-shrink:0;transition:background .15s}.back-btn-form:hover{background:var(--gray-2)}.submit-btn{flex:1;font-family:'Syne',sans-serif;font-size:.95rem;font-weight:700;color:var(--white);border:none;border-radius:var(--radius-sm);padding:13px;cursor:pointer;transition:all .15s;letter-spacing:-.3px;opacity:.4;pointer-events:none}.submit-btn.ready{opacity:1;pointer-events:all}.submit-btn.ready:hover{opacity:.88}.submit-btn.ready:active{transform:scale(.99)}.submit-btn.red-btn{background:var(--red)}.submit-btn.green-btn{background:var(--green)}.submit-btn.black-btn{background:var(--black)}
.success-wrap{text-align:center;padding:2rem 1rem}.success-icon-big{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 1.25rem}.success-icon-big.red{background:var(--red-light);border:2px solid var(--red-mid)}.success-icon-big.green{background:var(--green-light);border:2px solid var(--green-mid)}.success-title{font-family:'Syne',sans-serif;font-size:1.5rem;font-weight:800;color:var(--black);margin-bottom:.5rem;letter-spacing:-.5px}.success-sub{font-size:.88rem;color:var(--gray-5);line-height:1.55;margin-bottom:1.75rem}.success-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.action-link{font-family:'Syne',sans-serif;font-size:.85rem;font-weight:700;padding:10px 22px;border-radius:var(--radius-sm);text-decoration:none;transition:opacity .15s;cursor:pointer;border:none}.action-link:hover{opacity:.85}.action-link.black{background:var(--black);color:var(--white)}.action-link.outline{background:none;color:var(--black);border:1.5px solid var(--gray-3);font-family:'DM Sans',sans-serif}.action-link.outline:hover{border-color:var(--black)}
.sidebar{display:flex;flex-direction:column;gap:14px;position:sticky;top:72px}.sidebar-card{background:var(--white);border:1px solid var(--gray-2);border-radius:var(--radius);padding:1.1rem 1.25rem}.sidebar-title{font-family:'Syne',sans-serif;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-4);margin-bottom:.85rem}
.tip-item{display:flex;gap:10px;align-items:flex-start;margin-bottom:10px}.tip-item:last-child{margin-bottom:0}.tip-bullet{width:24px;height:24px;border-radius:7px;background:var(--gray-1);display:flex;align-items:center;justify-content:center;font-size:.8rem;flex-shrink:0}.tip-text{font-size:.78rem;color:var(--gray-5);line-height:1.45}.tip-text strong{color:var(--black);display:block;font-weight:500;margin-bottom:1px}
.weight-item{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--gray-1)}.weight-item:last-child{border-bottom:none;padding-bottom:0}.weight-item:first-child{padding-top:0}.weight-label{flex:1;font-size:.78rem;color:var(--gray-5)}.weight-dots{display:flex;gap:3px}.wd{width:7px;height:7px;border-radius:50%;background:var(--gray-2)}.wd.on{background:var(--green)}
.site-footer{border-top:1px solid var(--gray-2);padding:1.25rem 2rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;background:var(--white);flex-shrink:0}.footer-copy{font-size:.75rem;color:var(--gray-4)}.footer-links{display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap}.footer-link{font-size:.75rem;color:var(--gray-4);text-decoration:none;transition:color .15s}.footer-link:hover{color:var(--black)}.footer-report{font-size:.72rem;color:var(--red);font-weight:500;border:1px solid var(--red-mid);background:var(--red-light);padding:4px 12px;border-radius:20px;text-decoration:none;transition:all .15s}.footer-report:hover{background:var(--red);color:var(--white)}
@media(max-width:680px){.topnav{padding:0 1rem}.page{grid-template-columns:1fr;padding:1.5rem 1rem 3rem}.sidebar{display:none}.flag-type-grid{grid-template-columns:1fr 1fr}.identity-row{grid-template-columns:1fr 1fr}}
`;

const RED_CATS = ['Ghosting / went silent','Love bombing','Fake / catfish','Catfished with AI photos','Scammer / fraud','Narcissistic behaviour','Emotionally unavailable','Manipulative','Breadcrumbing','Verbal abuse','Stalking / obsessive behaviour','Fake social media presence','Unsolicited explicit content','Rude / toxic behaviour','Cheated / dishonest','Racist / discriminatory'];
const GREEN_CATS = ['Genuine & kind','Great communicator','Legit & honest','Super helpful','Great seller / buyer','Trustworthy','Emotionally available','Emotionally mature','Consistent','Respectful of boundaries','Great listener','Financially responsible','Family oriented','Socially aware','Goes above and beyond'];

const relLabels = {dated:'💔 Dated',date:'☕ Went on a date',shaadi:'💍 Shaadi / arranged intro',fwb:'🔥 Friends with Benefits',datingapp:'📲 Dating app match',online:'📱 Followed online',met:'🤝 Met in person',event:'🎉 Met at event / party',college:'🏫 College / school',work:'💼 Work / business',gym:'🏋️ Gym / class / activity',neighbourhood:'🏘️ Neighbourhood / locality',family:'👨‍👩‍👧 Family connection',bought:'🛍️ Bought / sold',heard:'👂 Heard through people'};
const timeLabels = {week:'This week',month:'This month',months:'1–6 months ago',year:'Over a year ago'};

const ENDPOINTS = {
  session: '/api/auth/session',
  searchSuggestions: '/api/search/suggestions',
  profileLookup: '/api/profile/lookup',
  createFlag: '/api/flags',
};

function buildUrl(base, params = {}) {
  const url = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  return `${url.pathname}${url.search}`;
}

function normalizeSuggestion(item, fallbackHandle = '') {
  const handle = (item.handle || item.username || fallbackHandle || '').replace(/^@/, '');
  const red = Number(item.red ?? item.redCount ?? item.red_flags ?? 0);
  const green = Number(item.green ?? item.greenCount ?? item.green_flags ?? 0);
  const score = item.score ?? item.vibeScore ?? item.greenScore ?? Math.round((green / Math.max(green + red, 1)) * 100);
  return {
    handle,
    red,
    green,
    score,
    color: item.color || (Number(score) > 55 ? '#1A9E5F' : '#E2353A'),
  };
}

function normalizeProfileLookup(payload, fallbackHandle = '') {
  const source = payload?.profile || payload?.data || payload || {};
  return normalizeSuggestion(source, fallbackHandle);
}

function buildCreateFlagPayload({ handle, flagType, relationship, timeframe, category, comment, gossip, identityChoice }) {
  return {
    handle,
    type: flagType,
    relationship,
    timeframe,
    category,
    comment: comment.trim(),
    gossip: gossip.trim(),
    isAnonymous: identityChoice === 'anon',
    visibility: identityChoice === 'anon' ? 'anonymous' : 'named',
    source: 'web',
  };
}

const fallbackSuggestions = {
  rohanverma__: { red: 14, green: 3, score: 18, color: '#E2353A' },
  priyasingh: { red: 0, green: 22, score: 100, color: '#1A9E5F' },
  aarav: { red: 11, green: 7, score: 39, color: '#7C3AED' },
  mehak: { red: 2, green: 19, score: 90, color: '#1A9E5F' },
  neel: { red: 0, green: 14, score: 100, color: '#0C0C0A' },
};

export default function FlagPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const prefillHandle = (query.get('handle') || '').replace(/^@/, '');
  const prefillType = query.get('type');

  const [step, setStep] = useState(1);
  const [flagType, setFlagType] = useState(prefillType === 'red' || prefillType === 'green' ? prefillType : '');
  const [identityChoice, setIdentityChoice] = useState('anon');
  const [discTicked, setDiscTicked] = useState([false, false, false]);
  const [handle, setHandle] = useState(prefillHandle);
  const [handleInfo, setHandleInfo] = useState(null);
  const [handleLoading, setHandleLoading] = useState(false);
  const [relationship, setRelationship] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [category, setCategory] = useState('');
  const [comment, setComment] = useState('');
  const [gossip, setGossip] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState({ checked: false, isAuthenticated: false, user: null });
  const [saveDrafting, setSaveDrafting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    async function checkSession() {
      try {
        const payload = await apiFetch(ENDPOINTS.session);
        if (!ignore) setSession({ checked: true, isAuthenticated: Boolean(payload?.isAuthenticated), user: payload?.user || null });
      } catch {
        if (!ignore) setSession({ checked: true, isAuthenticated: false, user: null });
      }
    }
    checkSession();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!handle || handle.trim().replace(/^@/, '').length < 2) {
      setHandleInfo(null);
      setHandleLoading(false);
      return;
    }
    let ignore = false;
    const timer = window.setTimeout(async () => {
      const cleaned = handle.trim().toLowerCase().replace(/^@/, '');
      setHandleLoading(true);
      try {
        let normalized = null;
        try {
          const profilePayload = await apiFetch(buildUrl(ENDPOINTS.profileLookup, { handle: cleaned }));
          normalized = normalizeProfileLookup(profilePayload, cleaned);
        } catch {
          const suggestPayload = await apiFetch(buildUrl(ENDPOINTS.searchSuggestions, { q: cleaned }));
          const exact = (suggestPayload?.items || []).find((item) => (item.handle || item.username || '').toLowerCase() === cleaned);
          normalized = exact ? normalizeSuggestion(exact, cleaned) : normalizeSuggestion({}, cleaned);
        }
        if (!ignore) setHandleInfo(normalized);
      } catch {
        if (!ignore) {
          const fallback = fallbackSuggestions[cleaned];
          if (fallback) setHandleInfo({ handle: cleaned, ...fallback });
          else setHandleInfo({ handle: cleaned, red: 0, green: 0, score: null, color: '#9E9D97' });
        }
      } finally {
        if (!ignore) setHandleLoading(false);
      }
    }, 400);
    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [handle]);

  const cats = flagType === 'red' ? RED_CATS : flagType === 'green' ? GREEN_CATS : [];
  const cleanedHandle = handle.trim().replace(/^@/, '');
  const step1Ready = Boolean(flagType && cleanedHandle.length >= 2);
  const commentValid = comment.length <= 300;
  const gossipValid = gossip.length <= 300;
  const step2Valid = Boolean(relationship && timeframe && category);
  const disclaimersReady = discTicked.every(Boolean);
  const submitReady = step2Valid && step1Ready && disclaimersReady;

  const previewComment = comment.trim() || '(No comment added)';
  const previewHandle = handle.trim().replace(/^@/, '');

  function goStep(next) {
    if (next === 2 && !step1Ready) return;
    if (next === 3 && !step2Valid) return;
    if (next === 4 && !disclaimersReady) return;
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function postFlag() {
    if (!submitReady || submitting || !commentValid || !gossipValid) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = buildCreateFlagPayload({
        handle: previewHandle,
        flagType,
        relationship,
        timeframe,
        category,
        comment,
        gossip,
        identityChoice,
      });
      await apiFetch(ENDPOINTS.createFlag, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setPosted(true);
      setStep(5);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Could not post flag.');
    } finally {
      setSubmitting(false);
    }
  }

  async function saveDraft() {
    setSaveDrafting(true);
    try {
      localStorage.setItem('clocked_flag_draft', JSON.stringify({
        handle,
        flagType,
        relationship,
        timeframe,
        category,
        comment,
        gossip,
        identityChoice,
        discTicked,
      }));
    } finally {
      setSaveDrafting(false);
    }
  }

  return (
    <div className="flagpage-shell">
      <style>{pageCss}</style>

      <header className="topnav">
        <Link to="/" className="nav-logo">
          <div className="logo-flags"><div className="flag-shape flag-r"></div><div className="flag-shape flag-g"></div></div>
          Clocked
        </Link>
        <button className="nav-back" onClick={() => navigate(-1)}>← Back to search</button>
      </header>

      <div className="page-wrap">
        <div className="page">
          {!session.checked ? <div className="card" style={{ fontSize: '.8rem', color: 'var(--gray-5)' }}>Checking session...</div> : null}
          <div className="form-col">
            <div className="steps-bar">
              <div className={`step-dot ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>1<span className="step-label">Flag type</span></div>
              <div className={`step-line ${step > 1 ? 'done' : ''}`}></div>
              <div className={`step-dot ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>2<span className="step-label">Details</span></div>
              <div className={`step-line ${step > 2 ? 'done' : ''}`}></div>
              <div className={`step-dot ${step === 3 ? 'active' : step > 3 ? 'done' : ''}`}>3<span className="step-label">Identity</span></div>
              <div className={`step-line ${step > 3 ? 'done' : ''}`}></div>
              <div className={`step-dot ${step === 4 ? 'active' : step > 4 ? 'done' : ''}`}>4<span className="step-label">Review</span></div>
            </div>

            {error ? <div className="card" style={{ borderColor: 'var(--red-mid)', background: 'var(--red-light)', color: 'var(--red)', fontSize: '.8rem' }}>{error}</div> : null}

            <div className={`step-screen ${step === 1 ? 'active' : ''}`}>
              <div className="card">
                <div className="card-title"><div className="card-icon">🎯</div> What kind of flag?</div>
                <div className="flag-type-grid">
                  <div className={`flag-type-opt ${flagType === 'red' ? 'sel-red' : ''}`} onClick={() => setFlagType('red')}>
                    <span className="flag-type-check">✓</span>
                    <span className="flag-type-icon">🚩</span>
                    <span className="flag-type-label">Red flag</span>
                    <span className="flag-type-desc">Warning the community about a negative experience</span>
                  </div>
                  <div className={`flag-type-opt ${flagType === 'green' ? 'sel-green' : ''}`} onClick={() => setFlagType('green')}>
                    <span className="flag-type-check">✓</span>
                    <span className="flag-type-icon">🟢</span>
                    <span className="flag-type-label">Green flag</span>
                    <span className="flag-type-desc">Vouching for someone based on a positive experience</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-title"><div className="card-icon">🔍</div> Who are you flagging?</div>
                <div className="field">
                  <label className="field-label">Instagram handle</label>
                  <div className="handle-input-wrap">
                    <span className="handle-at">@</span>
                    <input className={`text-input ${handle.trim().replace(/^@/, '').length >= 2 ? 'ok' : ''}`} type="text" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="theirhandle" style={{ paddingLeft: 30 }} />
                  </div>
                  {!step1Ready && handle.length > 0 && handle.trim().replace(/^@/, '').length < 2 ? <div className="field-err">Please enter a valid Instagram handle.</div> : null}
                  <div className="field-hint">Enter their Instagram username without the @</div>
                </div>
                <div className={`handle-preview ${handleInfo ? 'show' : ''}`}>
                  <div className="handle-avatar" style={{ background: handleInfo?.color || '#9E9D97' }}>{(handleInfo?.handle || '?')[0]?.toUpperCase()}</div>
                  <div className="handle-info">
                    <div className="handle-name">@{handleInfo?.handle || 'handle'}</div>
                    <div className="handle-flags">{handleLoading ? 'Checking...' : handleInfo && handleInfo.score != null ? `${handleInfo.red} red · ${handleInfo.green} green flags` : 'No flags yet on Clocked'}</div>
                  </div>
                  {handleInfo?.score != null ? <span className={`handle-score ${handleInfo.score > 55 ? 'green' : 'red'}`}>{handleInfo.score > 55 ? '🟢' : '🚩'} {handleInfo.score}%</span> : null}
                </div>
              </div>

              <button className={`submit-btn black-btn ${step1Ready ? 'ready' : ''}`} onClick={() => goStep(2)}>Continue →</button>
            </div>

            <div className={`step-screen ${step === 2 ? 'active' : ''}`}>
              <div className="card">
                <div className="card-title"><div className="card-icon">📋</div> Tell us more</div>

                <div className="field">
                  <label className="field-label">How do you know them?</label>
                  <select className={`select-input ${!relationship && step > 2 ? 'err' : ''}`} value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                    <option value="">Select relationship...</option>
                    {Object.entries(relLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  {!relationship && step > 2 ? <div className="field-err">Please select how you know them.</div> : null}
                </div>

                <div className="field">
                  <label className="field-label">When was this?</label>
                  <select className={`select-input ${!timeframe && step > 2 ? 'err' : ''}`} value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                    <option value="">Select timeframe...</option>
                    <option value="week">This week</option>
                    <option value="month">This month</option>
                    <option value="months">1–6 months ago</option>
                    <option value="year">Over a year ago</option>
                  </select>
                  {!timeframe && step > 2 ? <div className="field-err">Please select a timeframe.</div> : null}
                </div>

                <div className="field">
                  <label className="field-label">Category</label>
                  <select className={`select-input ${!category && step > 2 ? 'err' : ''}`} value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Select a category...</option>
                    {cats.map((cat) => <option key={cat} value={cat}>{cat}</option>}
                  </select>
                  {!category && step > 2 ? <div className="field-err">Please select a category.</div> : null}
                </div>

                <div className="field">
                  <label className="field-label">Your experience <span className="optional">(optional · max 300 chars)</span></label>
                  <textarea className="comment-input" maxLength={300} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share what happened. The more specific, the more useful it is for the community..."></textarea>
                  <div className="char-count">{comment.length} / 300</div>
                  {!commentValid ? <div className="field-err">Comment is too long.</div> : null}
                </div>

                <div className="field" style={{ marginTop: '.5rem' }}>
                  <div style={{ background: 'var(--gray-1)', border: '1px solid var(--gray-2)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '.5rem' }}>
                      <span style={{ fontSize: '1rem' }}>💬</span>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '.82rem', fontWeight: 700, color: 'var(--black)' }}>Gossip <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 400, color: 'var(--gray-4)', fontSize: '.72rem' }}>— optional, unverified, never affects vibe score</span></span>
                    </div>
                    <p style={{ fontSize: '.74rem', color: 'var(--gray-5)', lineHeight: 1.5, marginBottom: '.75rem' }}>Heard something through the grapevine? Add it here — clearly labelled as unverified gossip so the community can judge it accordingly. Always posted anonymously regardless of your identity choice above.</p>
                    <textarea className="comment-input" style={{ minHeight: 80, background: 'var(--white)' }} maxLength={300} value={gossip} onChange={(e) => setGossip(e.target.value)} placeholder="E.g. &quot;Heard from a friend that he's been doing this to multiple girls at the same time...&quot;"></textarea>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: '.68rem', color: 'var(--gray-4)' }}>⚠️ Gossip is always shown with an "unverified" label and does not affect the vibe score.</span>
                      <span className="char-count" style={{ marginTop: 0 }}>{gossip.length} / 300</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="btn-row">
                <button className="back-btn-form" onClick={() => goStep(1)}>← Back</button>
                <button className="submit-btn black-btn ready" onClick={() => goStep(3)}>Continue →</button>
              </div>
              <div style={{ marginTop: 10, textAlign: 'right' }}>
                <button type="button" onClick={saveDraft} style={{ background: 'none', border: 'none', color: 'var(--gray-4)', fontSize: '.74rem', cursor: 'pointer' }}>{saveDrafting ? 'Saving...' : 'Save draft locally'}</button>
              </div>
            </div>

            <div className={`step-screen ${step === 3 ? 'active' : ''}`}>
              <div className="card">
                <div className="card-title"><div className="card-icon">🎭</div> How do you want to post?</div>
                <p style={{ fontSize: '.8rem', color: 'var(--gray-5)', marginBottom: '1rem', lineHeight: 1.5 }}>This overrides your default setting for this specific flag. Your choice is final once posted.</p>
                <div className="identity-row">
                  <div className={`identity-opt ${identityChoice === 'anon' ? 'sel-anon' : ''}`} onClick={() => setIdentityChoice('anon')}>
                    <span className="id-icon">🎭</span>
                    <span className="id-label">Anonymous</span>
                    <span className="id-desc">Your @handle is never shown</span>
                  </div>
                  <div className={`identity-opt ${identityChoice === 'named' ? 'sel-named' : ''}`} onClick={() => setIdentityChoice('named')}>
                    <span className="id-icon">✋</span>
                    <span className="id-label">With my handle</span>
                    <span className="id-desc">@maverick shown on this flag</span>
                  </div>
                </div>
              </div>

              <div className="disclaimer-box">
                <div className="disclaimer-title">⚖️ Before you post — confirm each of these</div>
                {[
                  { title: 'This is based on my genuine personal experience', text: 'with this person — not hearsay or assumption.' },
                  { title: 'I take full legal responsibility', text: 'for the content of this flag. Clocked is not liable for what I post.' },
                  { title: 'I am not posting this to harass, stalk, or target', text: 'this person out of spite or malicious intent.' },
                ].map((item, idx) => (
                  <div key={idx} className={`check-item ${discTicked[idx] ? 'ticked' : ''}`} onClick={() => setDiscTicked((current) => current.map((v, i) => i === idx ? !v : v))}>
                    <div className="check-box">✓</div>
                    <div className="check-text"><strong>{item.title}</strong> {item.text}</div>
                  </div>
                ))}
              </div>

              <div className="btn-row">
                <button className="back-btn-form" onClick={() => goStep(2)}>← Back</button>
                <button className={`submit-btn ${disclaimersReady ? 'ready' : ''} ${flagType === 'green' ? 'green-btn' : flagType === 'red' ? 'red-btn' : 'black-btn'}`} onClick={() => goStep(4)}>Preview flag →</button>
              </div>
            </div>

            <div className={`step-screen ${step === 4 ? 'active' : ''}`}>
              <div className="preview-card">
                <div className="preview-label">Preview — this is how your flag will appear</div>
                <div className={`preview-flag ${flagType}`}>
                  <div className="preview-top">
                    <span className={`preview-badge ${flagType}`}>{flagType === 'red' ? '🚩 Red flag' : '🟢 Green flag'}</span>
                    <span className="preview-cat">{category || 'Category'}</span>
                    <span className="preview-anon">{identityChoice === 'anon' ? '🎭 anonymous' : '✋ @maverick'}</span>
                  </div>
                  <p className="preview-comment">{previewComment}</p>
                  {gossip.trim() ? (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--gray-2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: '.68rem', fontWeight: 700, background: 'var(--gray-2)', color: 'var(--gray-5)', padding: '2px 8px', borderRadius: 20 }}>💬 Gossip · Unverified · Anonymous</span>
                      </div>
                      <p style={{ fontSize: '.8rem', color: 'var(--gray-5)', lineHeight: 1.5, fontStyle: 'italic' }}>{gossip}</p>
                    </div>
                  ) : null}
                  <div className="preview-meta">
                    <span>{relLabels[relationship] || 'Relationship'}</span>
                    <span>{timeLabels[timeframe] || 'Timeframe'}</span>
                    <span>→ @{previewHandle || 'handle'}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-title"><div className="card-icon">✅</div> Ready to post?</div>
                <p style={{ fontSize: '.82rem', color: 'var(--gray-5)', lineHeight: 1.6, marginBottom: '1rem' }}>Once posted this flag is public immediately. The handle owner will be notified. You can reply to their response but cannot edit or delete this flag.</p>
                <div style={{ background: 'var(--gray-1)', borderRadius: 'var(--radius-sm)', padding: '.85rem 1rem', marginBottom: '1rem', fontSize: '.78rem', color: 'var(--gray-5)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--black)', display: 'block', marginBottom: 4 }}>⚠️ Final reminder</strong>
                  By posting you confirm this is your genuine experience and you take full personal legal responsibility for this content.
                </div>
                <div className="btn-row">
                  <button className="back-btn-form" onClick={() => goStep(3)}>← Edit</button>
                  <button className={`submit-btn ready ${flagType === 'green' ? 'green-btn' : 'red-btn'}`} onClick={postFlag}>{submitting ? 'Posting...' : flagType === 'red' ? 'Post red flag 🚩' : 'Post green flag 🟢'}</button>
                </div>
              </div>
            </div>

            <div className={`step-screen ${step === 5 && posted ? 'active' : ''}`}>
              <div className="card">
                <div className="success-wrap">
                  <div className={`success-icon-big ${flagType}`}>
                    {flagType === 'red' ? '🚩' : '🟢'}
                  </div>
                  <div className="success-title">{flagType === 'red' ? 'Red flag posted.' : 'Green flag posted.'}</div>
                  <p className="success-sub">Your {flagType} flag on @{previewHandle} is now live. The community can see it and @{previewHandle} has been notified.</p>
                  <div className="success-actions">
                    <button className="action-link black" onClick={() => navigate(`/search?handle=${encodeURIComponent(previewHandle)}`)}>View @{previewHandle}'s profile →</button>
                    {session.isAuthenticated ? <Link to="/dashboard" className="action-link outline">Go to dashboard</Link> : <Link to="/" className="action-link outline">Back to home</Link>}
                  </div>
                </div>
              </div>

              <div className="card" style={{ background: 'var(--gray-1)', borderColor: 'var(--gray-2)', textAlign: 'center' }}>
                <p style={{ fontSize: '.82rem', color: 'var(--gray-5)', lineHeight: 1.6, marginBottom: '.85rem' }}>
                  <strong style={{ color: 'var(--black)', display: 'block', marginBottom: 3 }}>Want to share your flag?</strong>
                  Let others know — share the handle's vibe card to your Instagram stories.
                </p>
                <button onClick={() => alert('Vibe card sharing coming soon!')} style={{ fontFamily: 'Syne, sans-serif', fontSize: '.82rem', fontWeight: 700, background: 'var(--black)', color: 'var(--white)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px 20px', cursor: 'pointer' }}>🎴 Share vibe card</button>
              </div>
            </div>
          </div>

          <aside className="sidebar">
            <div className="sidebar-card">
              <div className="sidebar-title">💡 Tips for a good flag</div>
              {[
                ['📍', 'Be specific', 'Vague flags carry less weight. "He ghosted after 3 months" is more useful than "bad experience."'],
                ['🎭', 'Anonymous by default', 'Nobody sees who posted this unless you choose "with my handle."'],
                ['⚖️', 'Stick to your experience', 'Only flag based on direct interaction. Second-hand claims carry low credibility weight.'],
                ['🟢', 'Green flags matter too', 'Good people deserve receipts. A well-written green flag is just as valuable.'],
              ].map(([icon, title, text]) => (
                <div className="tip-item" key={title}>
                  <div className="tip-bullet">{icon}</div>
                  <div className="tip-text"><strong>{title}</strong>{text}</div>
                </div>
              ))}
            </div>

            <div className="sidebar-card">
              <div className="sidebar-title">⚖️ Credibility weights</div>
              {[
                ['💔 Dated',5],['💍 Shaadi / arranged intro',5],['🔥 Friends with Benefits',4],['☕ Went on a date',4],['👨‍👩‍👧 Family connection',4],['🏫 College / school',4],['🎉 Met at event / party',3],['🤝 Met in person',3],['💼 Work / business',3],['🛍️ Bought / sold',3],['🏋️ Gym / class / activity',3],['🏘️ Neighbourhood / locality',2],['📲 Dating app match',2],['📱 Followed online',2],['👂 Heard through people',1],
              ].map(([label, on]) => (
                <div className="weight-item" key={label}>
                  <span className="weight-label">{label}</span>
                  <div className="weight-dots">{[1,2,3,4,5].map((i) => <div key={i} className={`wd ${i <= on ? 'on' : ''}`}></div>)}</div>
                </div>
              ))}
            </div>

            <div className="sidebar-card" style={{ background: 'var(--black)', borderColor: 'var(--black)' }}>
              <div className="sidebar-title" style={{ color: 'rgba(255,255,255,.35)' }}>🛡️ Your legal protection</div>
              <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.55 }}>Under IT Act Section 79, Clocked is an intermediary. Legal responsibility for flag content lies with the poster — that's you. Post honestly and you have nothing to worry about.</p>
            </div>
          </aside>
        </div>

        <footer className="site-footer">
          <span className="footer-copy">© 2025 Clocked. Community-powered receipts.</span>
          <div className="footer-links">
            <Link to="/tos" className="footer-link">Terms</Link>
            <Link to="/privacy" className="footer-link">Privacy</Link>
            <Link to="/guidelines" className="footer-link">Guidelines</Link>
            <Link to="/grievance" className="footer-report">🛡️ Report / Takedown</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
