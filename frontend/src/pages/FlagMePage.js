import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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
      // ignore parse issue
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

function clampText(value, limit) {
  return String(value || "").slice(0, limit);
}

function initials(handle = "") {
  const clean = handle.replace(/^@/, "").trim() || "u";
  return clean.slice(0, 2).toUpperCase();
}

const DEFAULT_COPY = {
  headline1: "Flag me up.",
  headline2: "I can take it.",
  subtext: "Drop a red or green flag. Be honest. I'm ready for it.",
};

const VARIANTS = {
  bold: {
    label: "Bold",
    icon: " ",
    copy: {
      headline1: "Flag me up.",
      headline2: "I can take it.",
      subtext: "Drop a red or green flag. Be honest. I'm ready for it.",
    },
  },
  playful: {
    label: "Playful",
    icon: " ",
    copy: {
      headline1: "Be honest.",
      headline2: "What's my vibe?",
      subtext: "No judgement. Just the truth. Red or green go on.",
    },
  },
  shaadi: {
    label: "Shaadi",
    icon: " ",
    copy: {
      headline1: "Shaadi ready?",
      headline2: "Check my vibe.",
      subtext: "Family looking? Friends vouching? Drop a flag and let them know.",
    },
  },
  creator: {
    label: "Creator",
    icon: " ",
    copy: {
      headline1: "Rate your",
      headline2: "experience with me.",
      subtext: "Worked with me? Bought from me? Leave a receipt for the community.",
    },
  },
  custom: {
    label: "Custom",
    icon: " ",
    copy: DEFAULT_COPY,
  },
};

const pageCss = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --red:#E2353A;--red-light:#FFF0F0;--red-mid:#FFBDBE;
  --green:#1A9E5F;--green-light:#F0FFF8;--green-mid:#A3E6C8;
  --amber:#F59E0B;--amber-light:#FFFBEB;
  --black:#0C0C0A;--off-white:#F8F7F3;
  --gray-1:#F2F1EC;--gray-2:#E5E4DE;--gray-3:#CCCBC4;
  --gray-4:#9E9D97;--gray-5:#5E5D58;--white:#FFFFFF;
  --font-display:'Syne',sans-serif;--font-body:'DM Sans',sans-serif;
  --radius:14px;--radius-sm:8px;
}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:var(--font-body);background:var(--off-white);color:var(--black);min-height:100vh;display:flex;flex-direction:column}
.flagme-shell{font-family:var(--font-body);background:var(--off-white);color:var(--black);min-height:100vh;display:flex;flex-direction:column}
.topnav{height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 2rem;background:var(--white);border-bottom:1px solid var(--gray-2);flex-shrink:0}
.nav-logo{font-family:var(--font-display);font-size:1.2rem;font-weight:800;letter-spacing:-.5px;color:var(--black);text-decoration:none;display:flex;align-items:center;gap:8px}
.logo-flags{display:flex;gap:4px;align-items:center}.flag-shape{width:9px;height:15px;clip-path:polygon(0 0,100% 15%,100% 85%,0 100%);display:block}.flag-r{background:var(--red)}.flag-g{background:var(--green)}
.nav-right{display:flex;gap:8px}.btn-ghost{font-family:var(--font-body);font-size:.8rem;font-weight:500;color:var(--gray-5);background:none;border:1px solid var(--gray-3);border-radius:30px;padding:5px 14px;cursor:pointer;text-decoration:none;transition:all .15s}.btn-ghost:hover{border-color:var(--black);color:var(--black)}.btn-solid{font-family:var(--font-body);font-size:.8rem;font-weight:600;color:var(--white);background:var(--black);border:1px solid var(--black);border-radius:30px;padding:5px 16px;cursor:pointer;text-decoration:none}
.page-wrap{flex:1;display:flex;flex-direction:column}.page{flex:1;max-width:940px;margin:0 auto;width:100%;padding:3rem 2rem;display:grid;grid-template-columns:1fr 320px;gap:3rem;align-items:start}
.story-stage{display:flex;flex-direction:column;align-items:center;gap:1.25rem}.story-card{width:100%;max-width:320px;border-radius:24px;padding:2rem 1.75rem;position:relative;overflow:hidden;background:var(--black);display:flex;flex-direction:column;gap:0;box-shadow:0 24px 60px rgba(0,0,0,.25)}
.story-card::before{content:'';position:absolute;width:200px;height:200px;border-radius:50%;background:rgba(226,53,58,.18);top:-60px;right:-60px;animation:blobFloat 6s ease-in-out infinite}.story-card::after{content:'';position:absolute;width:160px;height:160px;border-radius:50%;background:rgba(26,158,95,.15);bottom:-40px;left:-40px;animation:blobFloat 8s ease-in-out infinite reverse}@keyframes blobFloat{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(10px,-15px) scale(1.08)}}
.story-top{position:relative;z-index:1;margin-bottom:1.3rem}.story-brand{font-family:var(--font-display);font-size:.65rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.3);margin-bottom:.85rem}.story-headline{font-family:var(--font-display);font-size:1.6rem;font-weight:800;color:var(--white);line-height:1.15;letter-spacing:-.5px;margin-bottom:.5rem;word-break:break-word}.story-sub{font-size:.78rem;color:rgba(255,255,255,.5);line-height:1.5;word-break:break-word}
.story-handle-display{position:relative;z-index:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:var(--radius-sm);padding:.85rem 1rem;margin-bottom:.9rem;display:flex;align-items:center;gap:10px}.sha-at{font-family:var(--font-display);font-size:1rem;font-weight:700;color:rgba(255,255,255,.4)}.sha-name{font-family:var(--font-display);font-size:1rem;font-weight:800;color:var(--white);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.story-anon{position:relative;z-index:1;font-size:.68rem;color:rgba(255,255,255,.55);margin-bottom:1rem;text-align:center}
.story-flags{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1.5rem}.story-flag-btn{border-radius:var(--radius-sm);padding:1rem;text-align:center;font-family:var(--font-display);font-size:.82rem;font-weight:700;cursor:pointer;border:none;transition:all .15s;text-decoration:none;display:block}.story-flag-btn.red{background:rgba(226,53,58,.15);color:#ff8a8a;border:1px solid rgba(226,53,58,.3)}.story-flag-btn.red:hover{background:rgba(226,53,58,.25)}.story-flag-btn.green{background:rgba(26,158,95,.15);color:#4ade80;border:1px solid rgba(26,158,95,.3)}.story-flag-btn.green:hover{background:rgba(26,158,95,.25)}.sfb-icon{font-size:1.4rem;display:block;margin-bottom:4px}
.story-bottom{position:relative;z-index:1}.story-url{font-size:.65rem;color:rgba(255,255,255,.25);text-align:center;letter-spacing:.5px}
.challenge-strip{background:linear-gradient(135deg,var(--red),#FF6B35);border-radius:var(--radius-sm);padding:.85rem 1rem;display:flex;align-items:center;gap:10px;position:relative;z-index:1;margin-bottom:1rem}.challenge-strip.active-challenge{background:linear-gradient(135deg,#7C3AED,#4F46E5)}.challenge-icon{font-size:1.2rem;flex-shrink:0}.challenge-info{flex:1}.challenge-title{font-family:var(--font-display);font-size:.82rem;font-weight:700;color:var(--white);margin-bottom:1px}.challenge-sub{font-size:.68rem;color:rgba(255,255,255,.65)}.challenge-toggle{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:20px;padding:4px 12px;font-size:.68rem;font-weight:600;color:var(--white);cursor:pointer;font-family:var(--font-body);white-space:nowrap;flex-shrink:0;transition:all .15s}
.live-counter{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:var(--radius-sm);padding:.85rem 1rem;display:block;position:relative;z-index:1;margin-bottom:1.25rem}.lc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem}.lc-label{font-size:.68rem;font-weight:600;color:rgba(255,255,255,.4);letter-spacing:.5px;text-transform:uppercase;display:flex;align-items:center;gap:6px}.lc-dot{width:7px;height:7px;border-radius:50%;background:var(--green);animation:pulse 1.5s infinite}@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}.lc-timer{font-family:var(--font-display);font-size:.78rem;font-weight:700;color:rgba(255,255,255,.5)}.lc-counts{display:flex;gap:1rem}.lc-count{text-align:center}.lc-num{font-family:var(--font-display);font-size:1.4rem;font-weight:800;display:block;line-height:1}.lc-num.red{color:#ff8a8a}.lc-num.green{color:#4ade80}.lc-count-label{font-size:.6rem;color:rgba(255,255,255,.4);margin-top:1px}
.variant-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;max-width:320px}.variant-opt{border:1.5px solid var(--gray-2);border-radius:var(--radius-sm);padding:.85rem;cursor:pointer;text-align:center;transition:all .15s;background:var(--gray-1)}.variant-opt:hover{border-color:var(--gray-3)}.variant-opt.active{border-color:var(--black);background:var(--black)}.variant-icon{font-size:1.2rem;display:block;margin-bottom:3px}.variant-label{font-size:.72rem;font-weight:600;color:var(--gray-5)}.variant-opt.active .variant-label{color:var(--white)}
.ctrl-col{display:flex;flex-direction:column;gap:14px}.ctrl-card{background:var(--white);border:1px solid var(--gray-2);border-radius:var(--radius);padding:1.25rem}.ctrl-title{font-family:var(--font-display);font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-4);margin-bottom:.9rem}
.handle-input-wrap{position:relative;margin-bottom:.5rem}.handle-at{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-family:var(--font-display);font-size:.95rem;font-weight:700;color:var(--gray-4)}.text-input,.text-area{width:100%;font-family:var(--font-body);font-size:.95rem;border:1.5px solid var(--gray-3);border-radius:var(--radius-sm);padding:11px 14px;background:var(--white);color:var(--black);outline:none;transition:border-color .15s,box-shadow .15s}.text-input:focus,.text-area:focus{border-color:var(--black);box-shadow:0 0 0 3px rgba(0,0,0,.05)}.text-input::placeholder,.text-area::placeholder{color:var(--gray-4);font-size:.9rem}.text-area{resize:none;min-height:76px;line-height:1.5}
.copy-grid{display:grid;gap:8px}.field-note{font-size:.72rem;color:var(--gray-4);margin-top:4px}.char-note{font-size:.68rem;color:var(--gray-4);text-align:right}
.share-btn{width:100%;font-family:var(--font-display);font-size:.9rem;font-weight:700;color:var(--white);background:var(--black);border:none;border-radius:var(--radius-sm);padding:12px;cursor:pointer;transition:opacity .15s;display:flex;align-items:center;justify-content:center;gap:8px}.share-btn:hover{opacity:.85}.share-options{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.share-opt{font-family:var(--font-body);font-size:.78rem;font-weight:500;padding:9px;border-radius:var(--radius-sm);border:1px solid var(--gray-3);background:none;cursor:pointer;color:var(--gray-5);transition:all .15s;display:flex;align-items:center;justify-content:center;gap:6px}.share-opt:hover{border-color:var(--black);color:var(--black)}
.results-card{background:var(--white);border:1px solid var(--gray-2);border-radius:var(--radius);padding:1.25rem;display:block}.results-title{font-family:var(--font-display);font-size:.88rem;font-weight:700;color:var(--black);margin-bottom:.85rem}.result-bar{display:flex;align-items:center;gap:10px;margin-bottom:8px}.result-bar:last-child{margin-bottom:0}.result-label{font-size:.75rem;color:var(--gray-5);width:70px;flex-shrink:0}.result-track{flex:1;height:8px;background:var(--gray-1);border-radius:4px;overflow:hidden}.result-fill{height:100%;border-radius:4px;transition:width .5s ease}.result-fill.red{background:var(--red)}.result-fill.green{background:var(--green)}.result-num{font-family:var(--font-display);font-size:.82rem;font-weight:700;min-width:28px;text-align:right}
.inline-banner{font-size:.78rem;border-radius:var(--radius-sm);padding:.85rem 1rem}.inline-banner.error{background:var(--red-light);border:1px solid var(--red-mid);color:var(--red)}.inline-banner.info{background:var(--green-light);border:1px solid var(--green-mid);color:var(--black)}
.site-footer{border-top:1px solid var(--gray-2);padding:1.25rem 2rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;background:var(--white);flex-shrink:0}.footer-copy{font-size:.75rem;color:var(--gray-4)}.footer-links{display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap}.footer-link{font-size:.75rem;color:var(--gray-4);text-decoration:none;transition:color .15s}.footer-link:hover{color:var(--black)}.footer-report{font-size:.72rem;color:var(--red);font-weight:500;border:1px solid var(--red-mid);background:var(--red-light);padding:4px 12px;border-radius:20px;text-decoration:none;transition:all .15s}.footer-report:hover{background:var(--red);color:var(--white)}
@media(max-width:700px){.topnav{padding:0 1rem}.page{grid-template-columns:1fr;padding:2rem 1rem;gap:2rem}}
`;

export default function FlagMePageFinal() {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const pollRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const [variant, setVariant] = useState("bold");
  const [handle, setHandle] = useState("maverick");
  const [copy, setCopy] = useState(DEFAULT_COPY);
  const [stats, setStats] = useState({ red: 0, green: 0, searches: 0, total: 0 });
  const [challenge, setChallenge] = useState({ active: false, endsAt: null });
  const [shareData, setShareData] = useState({ url: "", imageUrl: "" });

  const loadPage = async (currentHandle) => {
    const clean = currentHandle.replace(/^@/, "").trim();
    if (!clean) return;
    setLoading(true);
    setError("");
    try {
      // Since profile lookup doesn't exist, use default stats
      // TODO: Implement backend endpoint for profile stats
      setStats({ red: 0, green: 0, searches: 0, total: 0 });
      setChallenge({ active: false, endsAt: null });
      setShareData({
        url: `${window.location.origin}/flagme/${clean}`,
        imageUrl: "",
      });
      setInfo("FlagMe page loaded. Backend profile lookup endpoint not implemented yet.");
    } catch (err) {
      setError(err.message || "Could not load flag-me page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(handle);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // No polling since profile lookup endpoint doesn't exist
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  const countdownLabel = useMemo(() => {
    if (!challenge.active || !challenge.endsAt) return "Off enable for 48hr window";
    const diff = new Date(challenge.endsAt).getTime() - Date.now();
    if (diff <= 0) return "Challenge ended";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `Active ${hours}h ${minutes}m remaining`;
  }, [challenge]);

  const ratioRed = stats.total > 0 ? Math.round((stats.red / stats.total) * 100) : 0;
  const ratioGreen = stats.total > 0 ? Math.round((stats.green / stats.total) * 100) : 0;

  async function persistCopy(nextVariant, nextCopy) {
    // For now, just store in local state
    // TODO: Implement backend API for persisting copy
    console.log("Copy would be persisted:", { nextVariant, nextCopy });
  }

  function onVariantChange(key) {
    setVariant(key);
    if (key !== "custom") {
      const nextCopy = { ...VARIANTS[key].copy };
      setCopy(nextCopy);
      persistCopy(key, nextCopy);
    } else {
      persistCopy("custom", copy);
    }
  }

  function onCopyChange(field, value, limit) {
    const nextCopy = { ...copy, [field]: clampText(value, limit) };
    setVariant("custom");
    setCopy(nextCopy);
    persistCopy("custom", nextCopy);
  }

  async function toggleChallenge() {
    try {
      if (challenge.active) {
        // For now, just disable locally
        setChallenge({ active: false, endsAt: null });
        setInfo("Challenge mode stopped.");
      } else {
        // For now, just enable locally for 48 hours
        const endsAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
        setChallenge({ active: true, endsAt });
        setInfo("Challenge mode enabled.");
      }
    } catch (err) {
      setError(err.message || "Could not update challenge mode.");
    }
  }

  async function generateShare() {
    setSharing(true);
    setError("");
    try {
      // Use vibe card generation instead of share API
      const next = {
        url: shareData.url || `${window.location.origin}/flagme/${handle}`,
        imageUrl: shareData.imageUrl || "",
      };
      setShareData(next);
      return next;
    } catch (err) {
      setError(err.message || "Could not generate share card.");
      throw err;
    } finally {
      setSharing(false);
    }
  }

  async function copyLink() {
    try {
      const current = shareData.url ? shareData : await generateShare();
      await navigator.clipboard.writeText(current.url);
      setInfo("Share link copied.");
    } catch {
      // handled above
    }
  }

  async function shareWhatsApp() {
    try {
      const current = shareData.url ? shareData : await generateShare();
      const text = `Be honest \nAm I a  or ?\n${current.url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    } catch {
      // handled above
    }
  }

  async function downloadCard() {
    setDownloading(true);
    setError("");
    try {
      // Open vibe card instead of downloading
      window.open(`/vibe-card/${handle}`, "_blank", "noopener,noreferrer");
      setInfo("Card generated.");
    } catch (err) {
      setError(err.message || "Could not generate downloadable card.");
    } finally {
      setDownloading(false);
    }
  }

  async function submitFlag(type) {
    try {
      // Navigate to flag page with pre-filled data
      navigate(`/flag?handle=${encodeURIComponent(handle)}&type=${encodeURIComponent(type)}`);
    } catch (err) {
      setError(err.message || "Could not open flag flow.");
    }
  }

  return (
    <div className="flagme-shell">
      <style>{pageCss}</style>

      <header className="topnav">
        <Link to="/" className="nav-logo">
          <div className="logo-flags"><div className="flag-shape flag-r" /><div className="flag-shape flag-g" /></div>
          Clocked
        </Link>
        <div className="nav-right">
          <Link to={`/vibe-card/${encodeURIComponent(handle)}`} className="btn-ghost">Vibe Card</Link>
          <Link to="/dashboard" className="btn-solid">Dashboard</Link>
        </div>
      </header>

      <div className="page-wrap">
        <div className="page">
          <div className="story-stage">
            <div className="story-card" ref={cardRef}>
              <div className={`challenge-strip ${challenge.active ? "active-challenge" : ""}`}>
                <span className="challenge-icon"> </span>
                <div className="challenge-info">
                  <div className="challenge-title">Challenge Mode</div>
                  <div className="challenge-sub">{countdownLabel}</div>
                </div>
                <button className="challenge-toggle" onClick={toggleChallenge}>{challenge.active ? "Disable" : "Enable"}</button>
              </div>

              <div className="live-counter">
                <div className="lc-top">
                  <div className="lc-label"><div className="lc-dot" /> Live</div>
                  <div className="lc-timer">{challenge.active ? countdownLabel.replace("Active ", "") : "Waiting"}</div>
                </div>
                <div className="lc-counts">
                  <div className="lc-count"><span className="lc-num red">{stats.red}</span><span className="lc-count-label">RED FLAGS</span></div>
                  <div className="lc-count"><span className="lc-num green">{stats.green}</span><span className="lc-count-label">GREEN FLAGS</span></div>
                  <div className="lc-count"><span className="lc-num" style={{ color: "rgba(255,255,255,.7)" }}>{stats.searches}</span><span className="lc-count-label">SEARCHES</span></div>
                </div>
              </div>

              <div className="story-top">
                <div className="story-brand">CLOCKED · FLAG ME UP</div>
                <div className="story-headline">{copy.headline1}<br />{copy.headline2}</div>
                <div className="story-sub">{copy.subtext}</div>
              </div>

              <div className="story-handle-display">
                <div className="sha-at">@</div>
                <div className="sha-name">{handle || "yourhandle"}</div>
              </div>

              <div className="story-anon">Tap to drop  or  anonymously · 100% anonymous · no names shown</div>

              <div className="story-flags">
                <button type="button" className="story-flag-btn red" onClick={() => submitFlag("red")}>
                  <span className="sfb-icon"> </span>
                  Red flag me
                </button>
                <button type="button" className="story-flag-btn green" onClick={() => submitFlag("green")}>
                  <span className="sfb-icon"> </span>
                  Green flag me
                </button>
              </div>

              <div className="story-bottom">
                <div className="story-url">clocked.in · know the vibe before you invest</div>
              </div>
            </div>

            <div className="variant-grid">
              {Object.entries(VARIANTS).map(([key, item]) => (
                <div key={key} className={`variant-opt ${variant === key ? "active" : ""}`} onClick={() => onVariantChange(key)}>
                  <span className="variant-icon">{item.icon}</span>
                  <span className="variant-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ctrl-col">
            {error ? <div className="inline-banner error">{error}</div> : null}
            {info ? <div className="inline-banner info">{info}</div> : null}

            <div className="ctrl-card">
              <div className="ctrl-title">Your handle</div>
              <div className="handle-input-wrap">
                <span className="handle-at">@</span>
                <input
                  className="text-input"
                  type="text"
                  value={handle}
                  placeholder="yourhandle"
                  style={{ paddingLeft: 30 }}
                  onChange={(e) => setHandle(e.target.value.replace(/^@/, ""))}
                  onBlur={() => loadPage(handle)}
                />
              </div>
              <div className="field-note">Your handle appears on the card so people know who to flag.</div>
            </div>

            <div className="ctrl-card">
              <div className="ctrl-title">Card text</div>
              <div className="copy-grid">
                <div>
                  <input className="text-input" value={copy.headline1} placeholder="Headline line 1" onChange={(e) => onCopyChange("headline1", e.target.value, 24)} />
                  <div className="char-note">{copy.headline1.length}/24</div>
                </div>
                <div>
                  <input className="text-input" value={copy.headline2} placeholder="Headline line 2" onChange={(e) => onCopyChange("headline2", e.target.value, 24)} />
                  <div className="char-note">{copy.headline2.length}/24</div>
                </div>
                <div>
                  <textarea className="text-area" value={copy.subtext} placeholder="Optional subtext" onChange={(e) => onCopyChange("subtext", e.target.value, 96)} />
                  <div className="char-note">{copy.subtext.length}/96</div>
                </div>
              </div>
              <div className="field-note">Personalize the card without breaking the layout.</div>
            </div>

            <div className="ctrl-card">
              <div className="ctrl-title">Share your card</div>
              <button className="share-btn" onClick={downloadCard} disabled={downloading || sharing}>
                {downloading ? "Generating..." : "Share & get real feedback"}
              </button>
              <div className="share-options">
                <button className="share-opt" onClick={copyLink} disabled={sharing}> Copy link</button>
                <button className="share-opt" onClick={shareWhatsApp} disabled={sharing}> WhatsApp</button>
                <button className="share-opt" onClick={downloadCard} disabled={downloading}> Save image</button>
                <button className="share-opt" onClick={copyLink}> Copy share link</button>
              </div>
            </div>

            <div className="ctrl-card">
              <div className="ctrl-title">Challenge mode</div>
              <div className="field-note" style={{ marginBottom: 12 }}>You might get harsh feedback but you'll know the truth.</div>
              <button className="share-btn" onClick={toggleChallenge}>{challenge.active ? "Disable challenge mode" : "Enable challenge mode"}</button>
            </div>

            <div className="results-card">
              <div className="results-title">Live results</div>
              <div className="result-bar">
                <div className="result-label" style={{ color: "var(--red)" }}> Red</div>
                <div className="result-track"><div className="result-fill red" style={{ width: `${ratioRed}%` }} /></div>
                <div className="result-num" style={{ color: "var(--red)" }}>{stats.red}</div>
              </div>
              <div className="result-bar">
                <div className="result-label" style={{ color: "var(--green)" }}> Green</div>
                <div className="result-track"><div className="result-fill green" style={{ width: `${ratioGreen}%` }} /></div>
                <div className="result-num" style={{ color: "var(--green)" }}>{stats.green}</div>
              </div>
              <p style={{ fontSize: ".72rem", color: "var(--gray-4)", marginTop: ".85rem", lineHeight: 1.5 }}>
                Based on <strong style={{ color: "var(--black)" }}>{stats.total}</strong> responses.
              </p>
            </div>
          </div>
        </div>

        {loading ? null : null}
      </div>

      <footer className="site-footer">
        <span className="footer-copy">© 2026 Clocked. Community-powered receipts.</span>
        <div className="footer-links">
          <Link to="/terms" className="footer-link">Terms</Link>
          <Link to="/privacy" className="footer-link">Privacy</Link>
          <Link to="/guidelines" className="footer-link">Guidelines</Link>
          <Link to="/grievance" className="footer-report"> Report / Takedown</Link>
        </div>
      </footer>
    </div>
  );
}
