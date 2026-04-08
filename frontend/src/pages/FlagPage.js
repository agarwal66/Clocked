import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

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

const RED_CATS = [
  "Ghosting / went silent",
  "Love bombing",
  "Fake / catfish",
  "Catfished with AI photos",
  "Scammer / fraud",
  "Narcissistic behaviour",
  "Emotionally unavailable",
  "Manipulative",
  "Breadcrumbing",
  "Verbal abuse",
  "Stalking / obsessive behaviour",
  "Fake social media presence",
  "Unsolicited explicit content",
  "Rude / toxic behaviour",
  "Cheated / dishonest",
  "Racist / discriminatory",
];

const GREEN_CATS = [
  "Genuine & kind",
  "Great communicator",
  "Legit & honest",
  "Super helpful",
  "Great seller / buyer",
  "Trustworthy",
  "Emotionally available",
  "Emotionally mature",
  "Consistent",
  "Respectful of boundaries",
  "Great listener",
  "Financially responsible",
  "Family oriented",
  "Socially aware",
  "Goes above and beyond",
];

const relLabels = {
  dated: "💔 Dated",
  date: "☕ Went on a date",
  shaadi: "💍 Shaadi / arranged intro",
  fwb: "🔥 Friends with Benefits",
  datingapp: "📲 Dating app match",
  online: "📱 Followed online",
  met: "🤝 Met in person",
  event: "🎉 Met at event / party",
  college: "🏫 College / school",
  work: "💼 Work / business",
  gym: "🏋️ Gym / class / activity",
  neighbourhood: "🏘️ Neighbourhood / locality",
  family: "👨‍👩‍👧 Family connection",
  bought: "🛍️ Bought / sold",
  heard: "👂 Heard through people",
};

const timeLabels = {
  week: "This week",
  month: "This month",
  months: "1–6 months ago",
  year: "Over a year ago",
};

const emptyProfileLookup = {
  exists: false,
  handle: "",
  red: 0,
  green: 0,
  score: null,
  avatarColor: "#9E9D97",
};

const pageCss = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--red:#E2353A;--red-light:#FFF0F0;--red-mid:#FFBDBE;--green:#1A9E5F;--green-light:#F0FFF8;--green-mid:#A3E6C8;--black:#0C0C0A;--off-white:#F8F7F3;--gray-1:#F2F1EC;--gray-2:#E5E4DE;--gray-3:#CCCBC4;--gray-4:#9E9D97;--gray-5:#5E5D58;--white:#FFFFFF;--font-display:'Syne',sans-serif;--font-body:'DM Sans',sans-serif;--radius:14px;--radius-sm:8px;}
html{font-size:16px;scroll-behavior:smooth}body{font-family:var(--font-body);background:var(--off-white);color:var(--black);min-height:100vh;display:flex;flex-direction:column}
.flag-shell{font-family:var(--font-body);background:var(--off-white);color:var(--black);min-height:100vh;display:flex;flex-direction:column}.topnav{height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 2rem;background:var(--white);border-bottom:1px solid var(--gray-2);flex-shrink:0;position:sticky;top:0;z-index:100}.nav-logo{font-family:var(--font-display);font-size:1.2rem;font-weight:800;letter-spacing:-.5px;color:var(--black);text-decoration:none;display:flex;align-items:center;gap:8px}.logo-flags{display:flex;gap:4px;align-items:center}.flag-shape{width:9px;height:15px;clip-path:polygon(0 0,100% 15%,100% 85%,0 100%);display:block}.flag-r{background:var(--red)}.flag-g{background:var(--green)}.nav-back{font-size:.82rem;color:var(--gray-5);background:none;border:none;cursor:pointer;font-family:var(--font-body);display:flex;align-items:center;gap:5px;padding:0;text-decoration:none}.nav-back:hover{color:var(--black)}
.page-wrap{flex:1;display:flex;flex-direction:column}.page{flex:1;max-width:860px;margin:0 auto;width:100%;padding:2.5rem 2rem 3rem;display:grid;grid-template-columns:1fr 300px;gap:2rem;align-items:start}.steps-bar{display:flex;align-items:center;margin-bottom:2rem;position:relative;padding-bottom:1.5rem}.step-dot{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:.72rem;font-weight:700;border:1.5px solid var(--gray-3);color:var(--gray-4);background:var(--white);flex-shrink:0;transition:all .2s;position:relative;z-index:1}.step-dot.active{background:var(--black);border-color:var(--black);color:var(--white)}.step-dot.done{background:var(--green);border-color:var(--green);color:var(--white)}.step-label{position:absolute;top:38px;left:50%;transform:translateX(-50%);font-size:.62rem;color:var(--gray-4);white-space:nowrap;font-weight:500}.step-dot.active .step-label{color:var(--black);font-weight:600}.step-dot.done .step-label{color:var(--green)}.step-line{flex:1;height:1.5px;background:var(--gray-2);transition:background .3s}.step-line.done{background:var(--green)}
.card{background:var(--white);border:1px solid var(--gray-2);border-radius:var(--radius);padding:1.5rem;margin-bottom:1rem}.card-title{font-family:var(--font-display);font-size:.95rem;font-weight:700;color:var(--black);margin-bottom:1.25rem;display:flex;align-items:center;gap:8px}.card-icon{width:28px;height:28px;border-radius:8px;background:var(--gray-1);display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0}.step-screen{display:none}.step-screen.active{display:block}
.flag-type-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.flag-type-opt{border:2px solid var(--gray-2);border-radius:var(--radius);padding:1.25rem;cursor:pointer;transition:all .2s;text-align:center;background:var(--gray-1);user-select:none;position:relative}.flag-type-opt:hover{border-color:var(--gray-3)}.flag-type-opt.sel-red{border-color:var(--red);background:var(--red-light)}.flag-type-opt.sel-green{border-color:var(--green);background:var(--green-light)}.flag-type-icon{font-size:2rem;display:block;margin-bottom:.5rem}.flag-type-label{font-family:var(--font-display);font-size:1rem;font-weight:800;display:block;margin-bottom:4px;color:var(--black)}.flag-type-opt.sel-red .flag-type-label{color:var(--red)}.flag-type-opt.sel-green .flag-type-label{color:var(--green)}.flag-type-desc{font-size:.75rem;color:var(--gray-5);line-height:1.4}.flag-type-check{position:absolute;top:10px;right:12px;width:20px;height:20px;border-radius:50%;border:1.5px solid var(--gray-3);background:var(--white);display:flex;align-items:center;justify-content:center;font-size:.7rem;color:transparent;transition:all .2s}.flag-type-opt.sel-red .flag-type-check{background:var(--red);border-color:var(--red);color:var(--white)}.flag-type-opt.sel-green .flag-type-check{background:var(--green);border-color:var(--green);color:var(--white)}
.handle-input-wrap{position:relative;margin-bottom:.5rem}.handle-at{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-family:var(--font-display);font-size:.95rem;font-weight:700;color:var(--gray-4)}.text-input,.comment-input,.select-input{width:100%;font-family:var(--font-body);font-size:.95rem;border:1.5px solid var(--gray-3);border-radius:var(--radius-sm);padding:11px 14px;background:var(--white);color:var(--black);outline:none;transition:border-color .15s,box-shadow .15s}.text-input:focus,.comment-input:focus,.select-input:focus{border-color:var(--black);box-shadow:0 0 0 3px rgba(0,0,0,.05)}.text-input::placeholder,.comment-input::placeholder{color:var(--gray-4);font-size:.9rem}.text-input.err,.select-input.err{border-color:var(--red)}.text-input.ok{border-color:var(--green)}.field-err{font-size:.72rem;color:var(--red);margin-top:4px}.field-hint{font-size:.72rem;color:var(--gray-4);margin-top:4px}.handle-preview{display:flex;align-items:center;gap:10px;background:var(--gray-1);border:1px solid var(--gray-2);border-radius:var(--radius-sm);padding:10px 12px;margin-top:8px}.handle-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:.82rem;font-weight:700;color:var(--white);flex-shrink:0}.handle-info{flex:1;min-width:0}.handle-name{font-size:.85rem;font-weight:600;color:var(--black)}.handle-flags{font-size:.7rem;color:var(--gray-4);margin-top:1px}.handle-score{font-size:.7rem;font-weight:700;padding:2px 8px;border-radius:20px;white-space:nowrap}.handle-score.red{background:var(--red-light);color:var(--red)}.handle-score.green{background:var(--green-light);color:var(--green)}
.select-input{font-size:.92rem;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239E9D97' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px}.field{margin-bottom:1rem}.field:last-child{margin-bottom:0}.field-label{display:block;font-size:.78rem;font-weight:500;color:var(--gray-5);margin-bottom:5px}.field-label .optional{color:var(--gray-4);font-weight:400}.comment-input{font-size:.9rem;resize:none;min-height:110px;line-height:1.6}.char-count{font-size:.7rem;color:var(--gray-4);text-align:right;margin-top:4px}
.identity-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.identity-opt{border:1.5px solid var(--gray-3);border-radius:var(--radius-sm);padding:12px;cursor:pointer;transition:all .15s;text-align:center;background:var(--gray-1);user-select:none}.identity-opt:hover{border-color:var(--gray-4)}.identity-opt.sel-anon{border-color:var(--black);background:var(--black)}.identity-opt.sel-named{border-color:var(--green);background:var(--green-light)}.id-icon{font-size:1.3rem;display:block;margin-bottom:4px}.id-label{font-family:var(--font-display);font-size:.8rem;font-weight:700;display:block;margin-bottom:2px;color:var(--black)}.identity-opt.sel-anon .id-label{color:var(--white)}.identity-opt.sel-anon .id-desc{color:rgba(255,255,255,.5)}.identity-opt.sel-named .id-label{color:var(--green)}.id-desc{font-size:.67rem;color:var(--gray-5);line-height:1.3}
.disclaimer-box{background:var(--red-light);border:1px solid var(--red-mid);border-radius:var(--radius-sm);padding:1rem 1.1rem;margin-bottom:1rem}.disclaimer-title{font-size:.78rem;font-weight:600;color:var(--black);margin-bottom:.5rem;display:flex;align-items:center;gap:6px}.check-item{display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid rgba(226,53,58,.1);cursor:pointer;user-select:none}.check-item:last-child{border-bottom:none;padding-bottom:0}.check-item:first-child{padding-top:0}.check-box{width:18px;height:18px;border-radius:4px;border:1.5px solid var(--red-mid);background:var(--white);flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;font-size:.68rem;color:transparent;transition:all .15s}.check-item.ticked .check-box{background:var(--green);border-color:var(--green);color:var(--white)}.check-text{font-size:.76rem;color:var(--gray-5);line-height:1.4}.check-text strong{color:var(--black);font-weight:500}
.preview-card{background:var(--gray-1);border:1px solid var(--gray-2);border-radius:var(--radius);padding:1.25rem;margin-bottom:1rem}.preview-label{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-4);margin-bottom:.85rem}.preview-flag{border-radius:var(--radius-sm);padding:1rem;border-left:3px solid var(--gray-3)}.preview-flag.red{background:var(--red-light);border-left-color:var(--red)}.preview-flag.green{background:var(--green-light);border-left-color:var(--green)}.preview-top{display:flex;align-items:center;gap:7px;margin-bottom:6px;flex-wrap:wrap}.preview-badge{font-size:.7rem;font-weight:700;padding:3px 10px;border-radius:20px}.preview-badge.red{background:var(--red);color:var(--white)}.preview-badge.green{background:var(--green);color:var(--white)}.preview-cat{font-size:.7rem;font-weight:500;padding:2px 8px;border-radius:20px;background:rgba(0,0,0,.07);color:var(--black)}.preview-anon{font-size:.68rem;color:var(--gray-4);background:rgba(0,0,0,.05);border-radius:20px;padding:2px 8px;margin-left:auto}.preview-comment{font-size:.84rem;color:var(--black);line-height:1.55;margin-bottom:6px}.preview-meta{display:flex;gap:8px;font-size:.68rem;color:var(--gray-4);flex-wrap:wrap}
.btn-row{display:flex;gap:10px}.back-btn-form{font-family:var(--font-display);font-size:.88rem;font-weight:700;background:var(--gray-1);color:var(--black);border:1px solid var(--gray-3);border-radius:var(--radius-sm);padding:13px 20px;cursor:pointer;flex-shrink:0}.back-btn-form:hover{background:var(--gray-2)}.submit-btn{flex:1;font-family:var(--font-display);font-size:.95rem;font-weight:700;color:var(--white);border:none;border-radius:var(--radius-sm);padding:13px;cursor:pointer;transition:all .15s;letter-spacing:-.3px;opacity:.4;pointer-events:none}.submit-btn.ready{opacity:1;pointer-events:all}.submit-btn.ready:hover{opacity:.88}.submit-btn.red-btn{background:var(--red)}.submit-btn.green-btn{background:var(--green)}.submit-btn.black-btn{background:var(--black)}
.success-wrap{text-align:center;padding:2rem 1rem}.success-icon-big{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 1.25rem}.success-icon-big.red{background:var(--red-light);border:2px solid var(--red-mid)}.success-icon-big.green{background:var(--green-light);border:2px solid var(--green-mid)}.success-title{font-family:var(--font-display);font-size:1.5rem;font-weight:800;color:var(--black);margin-bottom:.5rem;letter-spacing:-.5px}.success-sub{font-size:.88rem;color:var(--gray-5);line-height:1.55;margin-bottom:1.75rem}.success-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.action-link{font-family:var(--font-display);font-size:.85rem;font-weight:700;padding:10px 22px;border-radius:var(--radius-sm);text-decoration:none;transition:opacity .15s;cursor:pointer;border:none}.action-link:hover{opacity:.85}.action-link.black{background:var(--black);color:var(--white)}.action-link.outline{background:none;color:var(--black);border:1.5px solid var(--gray-3);font-family:var(--font-body)}.action-link.outline:hover{border-color:var(--black)}
.sidebar{display:flex;flex-direction:column;gap:14px;position:sticky;top:72px}.sidebar-card{background:var(--white);border:1px solid var(--gray-2);border-radius:var(--radius);padding:1.1rem 1.25rem}.sidebar-title{font-family:var(--font-display);font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-4);margin-bottom:.85rem}.tip-item{display:flex;gap:10px;align-items:flex-start;margin-bottom:10px}.tip-item:last-child{margin-bottom:0}.tip-bullet{width:24px;height:24px;border-radius:7px;background:var(--gray-1);display:flex;align-items:center;justify-content:center;font-size:.8rem;flex-shrink:0}.tip-text{font-size:.78rem;color:var(--gray-5);line-height:1.45}.tip-text strong{color:var(--black);display:block;font-weight:500;margin-bottom:1px}
.inline-banner{margin-bottom:1rem;padding:.9rem 1rem;border-radius:var(--radius-sm);font-size:.78rem}.inline-banner.error{background:var(--red-light);border:1px solid var(--red-mid);color:var(--red)}.inline-banner.info{background:var(--green-light);border:1px solid var(--green-mid);color:var(--black)}
.site-footer{border-top:1px solid var(--gray-2);padding:1.25rem 2rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;background:var(--white);flex-shrink:0}.footer-copy{font-size:.75rem;color:var(--gray-4)}.footer-links{display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap}.footer-link{font-size:.75rem;color:var(--gray-4);text-decoration:none}.footer-link:hover{color:var(--black)}.footer-report{font-size:.72rem;color:var(--red);font-weight:500;border:1px solid var(--red-mid);background:var(--red-light);padding:4px 12px;border-radius:20px;text-decoration:none}.footer-report:hover{background:var(--red);color:var(--white)}
@media(max-width:680px){.topnav{padding:0 1rem}.page{grid-template-columns:1fr;padding:1.5rem 1rem 3rem}.sidebar{display:none}}
`;

export default function FlagPageFinal() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [step, setStep] = useState(1);
  const [type, setType] = useState(params.get("type") === "green" ? "green" : params.get("type") === "red" ? "red" : "");
  const [handle, setHandle] = useState((params.get("handle") || "").replace(/^@/, ""));
  const [lookup, setLookup] = useState(emptyProfileLookup);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [relationship, setRelationship] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [category_id, setCategoryId] = useState("");
  const [comment, setComment] = useState("");
  const [gossip, setGossip] = useState("");
  const [identity, setIdentity] = useState("anon");
  const [discTicked, setDiscTicked] = useState([false, false, false]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [success, setSuccess] = useState(null);

  const categories = type === "red" ? RED_CATS : type === "green" ? GREEN_CATS : [];

  useEffect(() => {
    let ignore = false;
    const clean = handle.trim().replace(/^@/, "");
    if (clean.length < 2) {
      setLookup(emptyProfileLookup);
      setLookupError("");
      return;
    }

    const timer = window.setTimeout(async () => {
      setLookupLoading(true);
      setLookupError("");
      try {
        // Production: Use real search endpoint to get handle info
        const payload = await apiFetch(`/search/${encodeURIComponent(clean)}`);
        if (ignore) return;
        
        // Extract flag counts from search results
        const redCount = payload.flags?.filter(f => f.type === 'red').length || 0;
        const greenCount = payload.flags?.filter(f => f.type === 'green').length || 0;
        const vibeScore = payload.handle?.stats?.vibeScore || 50;
        
        setLookup({
          exists: Boolean(payload?.handle),
          handle: payload?.handle?.instagram_handle || clean,
          red: redCount,
          green: greenCount,
          score: vibeScore,
          avatarColor: vibeScore > 55 ? "#1A9E5F" : "#E2353A",
        });
      } catch (err) {
        if (!ignore) {
          setLookup({
            exists: false,
            handle: clean,
            red: 0,
            green: 0,
            score: null,
            avatarColor: "#9E9D97",
          });
          setLookupError(err.message || "Could not verify handle right now.");
        }
      } finally {
        if (!ignore) setLookupLoading(false);
      }
    }, 350);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [handle]);

  useEffect(() => {
    setCategoryId("");
  }, [type]);

  const step1Ready = type && handle.trim().replace(/^@/, "").length >= 2;
  const step2Ready = type && handle.trim().replace(/^@/, "").length >= 2 && relationship && timeframe && category_id && comment.trim().length > 0;

  const detailsReady = relationship && timeframe && category_id && comment.trim().length > 0;

  useEffect(() => {
    setCategoryId("");
  }, [type]);

  const reviewReady = relationship && timeframe && category_id && comment.trim().length > 0;

  const preview = useMemo(() => ({
    handle: handle.trim().replace(/^@/, ""),
    badge: type === "green" ? "🟢 Green flag" : "🚩 Red flag",
    rel: relLabels[relationship] || relationship,
    time: timeLabels[timeframe] || timeframe,
    anon: identity === "anon" ? "🎭 anonymous" : "✋ @me",
    comment: comment.trim() || "(No comment added)",
    gossip: gossip.trim(),
  }), [handle, type, relationship, timeframe, identity, comment, gossip]);

  function goStep(next) {
    setError("");
    if (next === 2 && !step1Ready) {
      setError("Select flag type and enter a valid handle.");
      return;
    }
    if (next === 3 && !detailsReady) {
      setError("Please fill in all required fields.");
      return;
    }
    if (next === 4 && !reviewReady) {
      setError("Please review your flag before posting.");
      return;
    }
    if (next === 5 && !identity) {
      setError("Please choose your identity preference.");
      return;
    }
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function postFlag() {
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        handle_id: preview.handle,
        flag_type: type,
        relationship,
        timeframe,
        category_id: category_id,
        comment: comment.trim(),
        identity: identity === "anon" ? "anonymous" : "named",
      };
      
      console.log(" FlagPage: Sending payload:", JSON.stringify(payload, null, 2));
      console.log(" FlagPage: API_BASE:", API_BASE);
      
      const response = await apiFetch("/flags", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      console.log(" FlagPage: Response status:", response.status);
      console.log(" FlagPage: Response data:", response);
      
      setSuccess({
        handle: payload?.handle || preview.handle,
        profileUrl: payload?.profileUrl || `/search?handle=${encodeURIComponent(preview.handle)}`,
        type,
      });
      setInfo("Flag posted successfully.");
      setStep(5);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(" FlagPage: Error posting flag:", err);
      setError(err.message || "Could not post flag.");
    } finally {
      setSubmitting(false);
    }
  }

  const stepClasses = (n) => `step-dot ${step === n ? "active" : step > n || step === 5 ? "done" : ""}`;
  const lineClasses = (n) => `step-line ${step > n || step === 5 ? "done" : ""}`;

  return (
    <div className="flag-shell">
      <style>{pageCss}</style>

      <header className="topnav">
        <Link to="/" className="nav-logo">
          <div className="logo-flags"><div className="flag-shape flag-r" /><div className="flag-shape flag-g" /></div>
          Clocked
        </Link>
        <Link to={handle ? `/search?handle=${encodeURIComponent(handle)}` : "/search"} className="nav-back">← Back to search</Link>
      </header>

      <div className="page-wrap">
        <div className="page">
          <div className="form-col">
            <div className="steps-bar">
              <div className={stepClasses(1)}>1<span className="step-label">Flag type</span></div>
              <div className={lineClasses(1)} />
              <div className={stepClasses(2)}>2<span className="step-label">Details</span></div>
              <div className={lineClasses(2)} />
              <div className={stepClasses(3)}>3<span className="step-label">Identity</span></div>
              <div className={lineClasses(3)} />
              <div className={stepClasses(4)}>4<span className="step-label">Review</span></div>
            </div>

            {error ? <div className="inline-banner error">{error}</div> : null}
            {info && step !== 5 ? <div className="inline-banner info">{info}</div> : null}

            <div className={`step-screen ${step === 1 ? "active" : ""}`}>
              <div className="card">
                <div className="card-title"><div className="card-icon">🎯</div> What kind of flag?</div>
                <div className="flag-type-grid">
                  <div className={`flag-type-opt ${type === "red" ? "sel-red" : ""}`} onClick={() => setType("red")}>
                    <span className="flag-type-check">✓</span>
                    <span className="flag-type-icon">🚩</span>
                    <span className="flag-type-label">Red flag</span>
                    <span className="flag-type-desc">Warning the community about a negative experience</span>
                  </div>
                  <div className={`flag-type-opt ${type === "green" ? "sel-green" : ""}`} onClick={() => setType("green")}>
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
                    <input className={`text-input ${handle.trim().length >= 2 ? "ok" : ""}`} type="text" value={handle} placeholder="theirhandle" style={{ paddingLeft: 30 }} onChange={(e) => setHandle(e.target.value.replace(/^@/, ""))} />
                  </div>
                  <div className="field-hint">Enter their Instagram username without the @</div>
                  {lookupError ? <div className="field-err">{lookupError}</div> : null}
                </div>
                {handle.trim().length >= 2 ? (
                  <div className="handle-preview">
                    <div className="handle-avatar" style={{ background: lookup.avatarColor }}>{(lookup.handle || handle)[0]?.toUpperCase() || "?"}</div>
                    <div className="handle-info">
                      <div className="handle-name">@{lookup.handle || handle}</div>
                      <div className="handle-flags">
                        {lookupLoading ? "Checking handle..." : lookup.exists ? `${lookup.red} red · ${lookup.green} green flags` : "No flags yet on Clocked"}
                      </div>
                    </div>
                    {lookup.score !== null ? <span className={`handle-score ${lookup.score > 55 ? "green" : "red"}`}>{lookup.score > 55 ? "🟢" : "🚩"} {lookup.score}%</span> : null}
                  </div>
                ) : null}
              </div>

              <button className={`submit-btn black-btn ${step1Ready ? "ready" : ""}`} onClick={() => goStep(2)}>Continue →</button>
            </div>

            <div className={`step-screen ${step === 2 ? "active" : ""}`}>
              <div className="card">
                <div className="card-title"><div className="card-icon">📋</div> Tell us more</div>
                <div className="field">
                  <label className="field-label">How do you know them?</label>
                  <select className={`select-input ${!relationship && error ? "err" : ""}`} value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                    <option value="">Select relationship...</option>
                    {Object.entries(relLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">When was this?</label>
                  <select className={`select-input ${!timeframe && error ? "err" : ""}`} value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                    <option value="">Select timeframe...</option>
                    {Object.entries(timeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Category</label>
                  <select className={`select-input ${!category_id && error ? "err" : ""}`} value={category_id} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">Select a category...</option>
                    {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Your experience <span className="optional">(optional · max 300 chars)</span></label>
                  <textarea className="comment-input" value={comment} maxLength={300} placeholder="Share what happened. The more specific, the more useful it is for the community..." onChange={(e) => setComment(e.target.value)} />
                  <div className="char-count">{comment.length} / 300</div>
                </div>
                <div className="field" style={{ marginTop: ".5rem" }}>
                  <div style={{ background: "var(--gray-1)", border: "1px solid var(--gray-2)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: ".5rem" }}>
                      <span style={{ fontSize: "1rem" }}>💬</span>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: ".82rem", fontWeight: 700, color: "var(--black)" }}>Gossip <span style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "var(--gray-4)", fontSize: ".72rem" }}>— optional, unverified, never affects vibe score</span></span>
                    </div>
                    <p style={{ fontSize: ".74rem", color: "var(--gray-5)", lineHeight: 1.5, marginBottom: ".75rem" }}>Heard something through the grapevine? Add it here — clearly labelled as unverified gossip so the community can judge it accordingly.</p>
                    <textarea className="comment-input" value={gossip} maxLength={300} placeholder="E.g. Heard from a friend that he's been doing this to multiple girls at the same time..." style={{ minHeight: 80, background: "var(--white)" }} onChange={(e) => setGossip(e.target.value)} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: ".68rem", color: "var(--gray-4)" }}>⚠️ Gossip is always shown with an unverified label and does not affect the vibe score.</span>
                      <span className="char-count" style={{ marginTop: 0 }}>{gossip.length} / 300</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="btn-row">
                <button className="back-btn-form" onClick={() => goStep(1)}>← Back</button>
                <button className={`submit-btn black-btn ${detailsReady ? "ready" : ""}`} onClick={() => goStep(3)}>Continue →</button>
              </div>
            </div>

            <div className={`step-screen ${step === 3 ? "active" : ""}`}>
              <div className="card">
                <div className="card-title"><div className="card-icon">🎭</div> How do you want to post?</div>
                <p style={{ fontSize: ".8rem", color: "var(--gray-5)", marginBottom: "1rem", lineHeight: 1.5 }}>This overrides your default setting for this specific flag.</p>
                <div className="identity-row">
                  <div className={`identity-opt ${identity === "anon" ? "sel-anon" : ""}`} onClick={() => setIdentity("anon")}>
                    <span className="id-icon">🎭</span>
                    <span className="id-label">Anonymous</span>
                    <span className="id-desc">Your @handle is never shown</span>
                  </div>
                  <div className={`identity-opt ${identity === "named" ? "sel-named" : ""}`} onClick={() => setIdentity("named")}>
                    <span className="id-icon">✋</span>
                    <span className="id-label">With my handle</span>
                    <span className="id-desc">Your account is shown on this flag</span>
                  </div>
                </div>
              </div>
              <div className="disclaimer-box">
                <div className="disclaimer-title">⚖️ Before you post — confirm each of these</div>
                {[
                  "This is based on my genuine personal experience with this person — not hearsay or assumption.",
                  "I take full legal responsibility for the content of this flag. Clocked is not liable for what I post.",
                  "I am not posting this to harass, stalk, or target this person out of spite or malicious intent.",
                ].map((text, idx) => (
                  <div key={idx} className={`check-item ${discTicked[idx] ? "ticked" : ""}`} onClick={() => setDiscTicked((prev) => prev.map((v, i) => i === idx ? !v : v))}>
                    <div className="check-box">✓</div>
                    <div className="check-text"><strong>{text.split(" ").slice(0, 6).join(" ")}</strong> {text}</div>
                  </div>
                ))}
              </div>
              <div className="btn-row">
                <button className="back-btn-form" onClick={() => goStep(2)}>← Back</button>
                <button className={`submit-btn ${reviewReady ? "ready" : ""} ${type === "green" ? "green-btn" : "red-btn"}`} onClick={() => goStep(4)}>Preview flag →</button>
              </div>
            </div>

            <div className={`step-screen ${step === 4 ? "active" : ""}`}>
              <div className="preview-card">
                <div className="preview-label">Preview — this is how your flag will appear</div>
                <div className={`preview-flag ${type}`}>
                  <div className="preview-top">
                    <span className={`preview-badge ${type}`}>{preview.badge}</span>
                    <span className="preview-cat">{category_id || "Category"}</span>
                    <span className="preview-anon">{preview.anon}</span>
                  </div>
                  <p className="preview-comment">{preview.comment}</p>
                  {preview.gossip ? (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed var(--gray-2)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: ".68rem", fontWeight: 700, background: "var(--gray-2)", color: "var(--gray-5)", padding: "2px 8px", borderRadius: 20 }}>💬 Gossip · Unverified</span>
                      </div>
                      <p style={{ fontSize: ".8rem", color: "var(--gray-5)", lineHeight: 1.5, fontStyle: "italic" }}>{preview.gossip}</p>
                    </div>
                  ) : null}
                  <div className="preview-meta">
                    <span>{preview.rel || "Relationship"}</span>
                    <span>{preview.time || "Timeframe"}</span>
                    <span>→ @{preview.handle || "handle"}</span>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-title"><div className="card-icon">✅</div> Ready to post?</div>
                <p style={{ fontSize: ".82rem", color: "var(--gray-5)", lineHeight: 1.6, marginBottom: "1rem" }}>Once posted this flag is public immediately. The handle owner may be notified. You can reply later but cannot edit this flag.</p>
                <div style={{ background: "var(--gray-1)", borderRadius: "var(--radius-sm)", padding: ".85rem 1rem", marginBottom: "1rem", fontSize: ".78rem", color: "var(--gray-5)", lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--black)", display: "block", marginBottom: 4 }}>⚠️ Final reminder</strong>
                  By posting you confirm this is your genuine experience and you take full personal legal responsibility for this content.
                </div>
                <div className="btn-row">
                  <button className="back-btn-form" onClick={() => goStep(3)}>← Edit</button>
                  <button className={`submit-btn ready ${type === "green" ? "green-btn" : "red-btn"}`} onClick={postFlag} disabled={submitting}>{submitting ? "Posting..." : `Post ${type === "green" ? "green" : "red"} flag →`}</button>
                </div>
              </div>
            </div>

            <div className={`step-screen ${step === 5 ? "active" : ""}`}>
              <div className="card">
                <div className="success-wrap">
                  <div className={`success-icon-big ${success?.type === "green" ? "green" : "red"}`}>{success?.type === "green" ? "🟢" : "🚩"}</div>
                  <div className="success-title">{success?.type === "green" ? "Green flag posted." : "Red flag posted."}</div>
                  <p className="success-sub">Your flag on @{success?.handle} is now live.</p>
                  <div className="success-actions">
                    <Link to={success?.profileUrl || "/search"} className="action-link black">View on @{success?.handle}'s profile →</Link>
                    <Link to="/" className="action-link outline">Back to home</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="sidebar">
            <div className="sidebar-card">
              <div className="sidebar-title">💡 Tips for a good flag</div>
              <div className="tip-item"><div className="tip-bullet">📍</div><div className="tip-text"><strong>Be specific</strong>Vague flags carry less weight. Specific context is more useful.</div></div>
              <div className="tip-item"><div className="tip-bullet">🎭</div><div className="tip-text"><strong>Anonymous by default</strong>Nobody sees who posted this unless you choose to show your handle.</div></div>
              <div className="tip-item"><div className="tip-bullet">⚖️</div><div className="tip-text"><strong>Stick to your experience</strong>Only flag based on direct interaction.</div></div>
              <div className="tip-item"><div className="tip-bullet">🟢</div><div className="tip-text"><strong>Green flags matter too</strong>Good people deserve receipts too.</div></div>
            </div>
            <div className="sidebar-card" style={{ background: "var(--black)", borderColor: "var(--black)" }}>
              <div className="sidebar-title" style={{ color: "rgba(255,255,255,.35)" }}>🛡️ Legal note</div>
              <p style={{ fontSize: ".78rem", color: "rgba(255,255,255,.55)", lineHeight: 1.55 }}>Clocked acts as an intermediary. Responsibility for flag content lies with the poster. Post honestly and specifically.</p>
            </div>
          </aside>
        </div>

        <footer className="site-footer">
          <span className="footer-copy">© 2026 Clocked. Community-powered receipts.</span>
          <div className="footer-links">
            <Link to="/terms" className="footer-link">Terms</Link>
            <Link to="/privacy" className="footer-link">Privacy</Link>
            <Link to="/guidelines" className="footer-link">Guidelines</Link>
            <Link to="/grievance" className="footer-report">🛡️ Report / Takedown</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
