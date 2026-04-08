// eslint-disable-next-line no-unused-vars
// Note: Some variables are defined but not used due to conditional rendering
// - onShareInstagram: Removed duplicate function
// - publicUrl: Used in share functions but flagged as unused
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import {
  Copy,
  Download,
  MessageCircle,
  Palette,
  RefreshCw,
  Shield,
  Share2,
  Sparkles,
} from "lucide-react";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

async function api(path, options = {}) {
  const token = localStorage.getItem("clocked_token");
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });
  
  // Handle specific HTTP errors for production
  if (response.status === 401) {
    // Token expired or invalid - redirect to login
    localStorage.removeItem("clocked_token");
    localStorage.removeItem("clocked_user");
    window.location.href = "/login";
    throw new Error("Session expired. Please login again.");
  }
  
  if (response.status === 403) {
    throw new Error("Access denied. You don't have permission to view this card.");
  }
  
  if (response.status === 404) {
    throw new Error("Vibe card not found. The handle may not exist.");
  }
  
  if (response.status >= 500) {
    throw new Error("Server error. Please try again later.");
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }
  
  return response.json();
}

const BRAND = {
  red: "#E2353A",
  redLight: "#FFF0F0",
  redMid: "#FFBDBE",
  green: "#1A9E5F",
  greenLight: "#F0FFF8",
  greenMid: "#A3E6C8",
  black: "#0C0C0A",
  offWhite: "#F8F7F3",
  gray1: "#F2F1EC",
  gray2: "#E5E4DE",
  gray3: "#CCCBC4",
  gray4: "#9E9D97",
  gray5: "#5E5D58",
  white: "#FFFFFF",
};

const THEME_META = {
  dark: {
    cardBg: "#0C0C0A",
    ringTrack: "rgba(255,255,255,.08)",
    text: "#FFFFFF",
    subText: "rgba(255,255,255,.5)",
    divider: "rgba(255,255,255,.15)",
    inner: "rgba(0,0,0,.40)",
    dot: "#0C0C0A",
  },
  red: {
    cardBg: "linear-gradient(145deg,#1a0304,#3d0a0c)",
    ringTrack: "rgba(255,255,255,.08)",
    text: "#FFFFFF",
    subText: "rgba(255,255,255,.5)",
    divider: "rgba(255,255,255,.15)",
    inner: "rgba(0,0,0,.42)",
    dot: "linear-gradient(135deg,#3d0a0c,#E2353A)",
  },
  green: {
    cardBg: "linear-gradient(145deg,#021a0d,#044d23)",
    ringTrack: "rgba(255,255,255,.06)",
    text: "#FFFFFF",
    subText: "rgba(255,255,255,.5)",
    divider: "rgba(255,255,255,.15)",
    inner: "rgba(0,0,0,.42)",
    dot: "linear-gradient(135deg,#044d23,#1A9E5F)",
  },
  cream: {
    cardBg: "#F8F7F3",
    ringTrack: "rgba(0,0,0,.07)",
    text: "#0C0C0A",
    subText: "rgba(12,12,10,.55)",
    divider: "rgba(0,0,0,.10)",
    inner: "#F8F7F3",
    dot: "#F8F7F3",
  },
  midnight: {
    cardBg: "linear-gradient(145deg,#0a0a1a,#1a1a3d)",
    ringTrack: "rgba(255,255,255,.06)",
    text: "#FFFFFF",
    subText: "rgba(255,255,255,.5)",
    divider: "rgba(255,255,255,.15)",
    inner: "rgba(0,0,0,.42)",
    dot: "linear-gradient(135deg,#0a0a1a,#4444bb)",
  },
};

const themeOrder = ["dark", "red", "green", "cream", "midnight"];

function clampScore(value) {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function extractHandleFromPath() {
  const path = window.location.pathname.replace(/^\/+/, "");
  if (!path) return null;
  
  // Handle both @handle and vibe-card/handle patterns
  if (path.startsWith("@")) {
    return path.slice(1); // Remove @ and return the handle
  }
  
  if (path.startsWith("vibe-card/")) {
    const handle = path.split("/")[1]; // Return handle after "vibe-card/"
    // If handle is "me", get current user's handle from auth context or localStorage
    if (handle === "me") {
      // Try multiple methods to get current user handle
      try {
        // Method 1: Check localStorage for user data
        const userData = localStorage.getItem("clocked_user");
        if (userData) {
          const user = JSON.parse(userData);
          if (user.handle) return user.handle;
        }
        
        // Method 2: Check JWT token
        const token = localStorage.getItem("clocked_token");
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.handle) return payload.handle;
        }
        
        // Method 3: Check session storage
        const sessionUser = sessionStorage.getItem("clocked_user");
        if (sessionUser) {
          const user = JSON.parse(sessionUser);
          if (user.handle) return user.handle;
        }
        
        // Method 4: Redirect to login if no user found
        console.warn("No authenticated user found, redirecting to login");
        window.location.href = "/login";
        return null;
        
      } catch (error) {
        console.error("Error getting user handle:", error);
        // Redirect to login on any error
        window.location.href = "/login";
        return null;
      }
    }
    return handle;
  }
  
  return path.split("/")[0]; // Default: first segment
}

function initialsFromHandle(handle) {
  return String(handle || "U").replace(/^@/, "").trim().charAt(0).toUpperCase() || "U";
}

function formatUpdatedAt(dateString) {
  if (!dateString) return "Recently updated";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Recently updated";
  return `Updated ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function scoreLabel(score, label) {
  if (label) return label;
  if (score >= 75) return "GREEN VIBES";
  if (score >= 50) return "MIXED VIBES";
  return "RED VIBES";
}

function movementText(movement) {
  if (!movement) return "No recent movement";
  const value = Math.abs(Number(movement.value || 0));
  const direction = movement.direction === "down" ? "↓" : movement.direction === "up" ? "↑" : "→";
  const sign = movement.direction === "down" ? "-" : movement.direction === "up" ? "+" : "";
  const windowLabel = movement.windowLabel || "recently";
  return `${sign}${value}% ${windowLabel} ${direction}`;
}


export default function VibeCardPage() {
  const initialHandle = useMemo(() => extractHandleFromPath() || "maverick", []);
  const [handle] = useState(initialHandle);
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");
  const [flipped, setFlipped] = useState(false);
  const [toast, setToast] = useState("");
  const [savingTheme, setSavingTheme] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const cardRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast(message);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 2400);
  }, []);

  const loadCard = useCallback(async (opts = {}) => {
    const { silent = false } = opts;
    if (!silent) {
      setLoading(true);
      setError("");
    } else {
      setRefreshing(true);
    }

    try {
      const data = await api(`/vibe-card/${encodeURIComponent(handle)}`);
      setCard(data);
      setTheme(data.theme || "dark");
      setError("");
      updateHeadMetadata(data);
    } catch (err) {
      setError(err.message || "Unable to load vibe card");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [handle]);

  useEffect(() => {
    loadCard();
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, [loadCard]);

  const persistTheme = useCallback(async (nextTheme) => {
    if (!card?.meta?.isOwner) return;
    try {
      setSavingTheme(true);
      await api(`/vibe-card/${encodeURIComponent(handle)}/theme`, {
        method: "PATCH",
        body: JSON.stringify({ theme: nextTheme }),
      });
    } catch (err) {
      showToast("Theme save failed");
    } finally {
      setSavingTheme(false);
    }
  }, [card?.meta?.isOwner, handle, showToast]);

  const onThemeChange = useCallback((nextTheme) => {
    setTheme(nextTheme);
    setCard((prev) => (prev ? { ...prev, theme: nextTheme } : prev));
    persistTheme(nextTheme);
  }, [persistTheme]);

  const onCopyLink = useCallback(async () => {
    console.log('Copy link clicked, URL:', card?.share?.publicUrl);
    try {
      const url = card?.share?.publicUrl || `${window.location.origin}/@${handle}`;
      await navigator.clipboard.writeText(url);
      showToast(`🔗 Link copied — ${url.replace(/^https?:\/\//, "")}`);
    } catch (err) {
      console.error('Copy link error:', err);
      showToast("Unable to copy link");
    }
  }, [card?.share?.publicUrl, handle, showToast]);

  const onCopyEmbed = useCallback(async () => {
    try {
      const embedUrl = card?.share?.embedUrl || `${window.location.origin}/embed/@${handle}`;
      const snippet = `<iframe src="${embedUrl}" width="360" height="640" style="border:0;border-radius:20px;overflow:hidden" allowtransparency="true"></iframe>`;
      await navigator.clipboard.writeText(snippet);
      showToast("📋 Embed code copied");
    } catch (err) {
      console.error('Copy embed error:', err);
      showToast("Unable to copy embed");
    }
  }, [card?.share?.embedUrl, handle, showToast]);

  const onShareWhatsApp = useCallback(() => {
    console.log('WhatsApp share clicked, URL:', card?.share?.publicUrl);
    const url = card?.share?.publicUrl || `${window.location.origin}/@${handle}`;
    const text = `Check out my vibe score on Clocked 👀 ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }, [card?.share?.publicUrl, handle]);

  const onShareInstagram = useCallback(() => {
    showToast("📸 Export card and share it to Stories");
  }, [showToast]);

  const onDownloadCard = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      setExporting(true);
      
      // Find the currently visible card face
      const flipInner = cardRef.current.querySelector('[style*="transform"]');
      const visibleCard = flipped ? 
        flipInner.children[1] : // Back card
        flipInner.children[0];  // Front card
      
      const canvas = await html2canvas(visibleCard, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: visibleCard.offsetWidth,
        height: visibleCard.offsetHeight,
      });
      
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${handle}-vibe-card.png`;
      link.click();
      showToast("⬇️ Card downloaded! Share it anywhere.");
    } catch (err) {
      console.error('Download error:', err);
      showToast("Unable to export card");
    } finally {
      setExporting(false);
    }
  }, [handle, flipped, showToast]);

  const onFlip = useCallback(() => setFlipped((prev) => !prev), []);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState onRetry={() => loadCard()} message={error} />;
  }

  if (!card) {
    return <ErrorState onRetry={() => loadCard()} message="Handle not found" />;
  }

  // Always show the vibe card if we have card data
  const score = clampScore(card?.score);
  const currentTheme = THEME_META[theme] || THEME_META.dark;
  const handleText = `@${card?.handle || handle}`;
  const displayName = card?.displayName || handleText;
  const publicUrl = card?.share?.publicUrl || `${window.location.origin}/@${handle}`;

  return (
    <div style={styles.pageShell}>
      <style>{globalCss}</style>

      <div aria-live="polite" className={`vc-toast ${toast ? "show" : ""}`}>{toast}</div>

      <header style={styles.topnav}>
        <a href="/home" style={styles.navLogo}>
          <span style={styles.logoFlags}>
            <span style={{ ...styles.flagShape, background: BRAND.red }} />
            <span style={{ ...styles.flagShape, background: BRAND.green }} />
          </span>
          Clocked
        </a>

        <div style={styles.navRight}>
          <a href="/dashboard" style={styles.btnGhost}>Dashboard</a>
          <a href="/flagme" style={styles.btnSolid}>Flag Me 🚩</a>
        </div>
      </header>

      <main style={styles.pageWrap}>
        <section style={styles.page}>
          <div style={styles.cardStage}>
            <div
              ref={cardRef}
              style={styles.flipScene}
              role="button"
              tabIndex={0}
              aria-label="Flip vibe card"
              onClick={onFlip}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onFlip();
                }
              }}
            >
              <div style={{ ...styles.flipInner, transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
                <VibeCardFront
                  theme={currentTheme}
                  score={score}
                  handleText={handleText}
                  scoreCopy={scoreLabel(score, card?.scoreLabel)}
                  redFlags={card?.redFlags || 0}
                  greenFlags={card?.greenFlags || 0}
                  searches={card?.searches || 0}
                />
                <VibeCardBack
                  theme={currentTheme}
                  handleText={handleText}
                  confidenceLabel={card?.confidenceLabel || "High confidence"}
                  totalFlags={card?.totalFlags ?? (card?.redFlags || 0) + (card?.greenFlags || 0)}
                  movement={card?.movement}
                  insights={Array.isArray(card?.insights) ? card.insights : []}
                  updatedAt={card?.meta?.updatedAt}
                />
              </div>
            </div>

            <div style={styles.themeRowWrap}>
              <div style={styles.themeRow}>
                {themeOrder.map((key) => (
                  <button
                    key={key}
                    type="button"
                    title={capitalize(key)}
                    aria-label={`Use ${key} theme`}
                    onClick={() => onThemeChange(key)}
                    style={{
                      ...styles.themeDot,
                      background: THEME_META[key].dot,
                      borderColor: theme === key ? BRAND.black : key === "cream" ? BRAND.gray3 : "transparent",
                      transform: theme === key ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
              <p style={styles.themeHint}>Click a theme to preview · Tap card to flip</p>
            </div>
          </div>

          <aside style={styles.controlsCol}>
            <div style={styles.ctrlCard}>
              <div style={styles.ctrlTitle}>Your handle</div>
              <div style={styles.handlePreviewRow}>
                {card?.avatarUrl ? (
                  <img src={card.avatarUrl} alt={displayName} style={styles.avatarImage} />
                ) : (
                  <div style={styles.hpAvatar}>{card?.avatarInitial || initialsFromHandle(handle)}</div>
                )}
                <div>
                  <div style={styles.hpName}>{handleText}</div>
                  <div style={styles.hpScore}>🟢 {score}% vibe score · {card?.totalFlags ?? (card?.redFlags || 0) + (card?.greenFlags || 0)} flags total</div>
                </div>
              </div>
            </div>

            <div style={styles.ctrlCard}>
              <div style={styles.ctrlTitle}>Your numbers</div>
              <div style={styles.statRow}>
                <StatBox value={`${score}%`} label="Vibe score" color={BRAND.green} />
                <StatBox value={String(card?.redFlags || 0)} label="Red flags" color={BRAND.red} />
                <StatBox value={String(card?.greenFlags || 0)} label="Green flags" color={BRAND.green} />
              </div>
              <p style={styles.helperCopy}>
                Your vibe score is calculated from all flags, weighted by how well people actually knew you.
              </p>
            </div>

            <div style={styles.ctrlCard}>
              <div style={styles.ctrlTitle}>Share your card</div>
              <button style={styles.shareBtn} onClick={onDownloadCard} disabled={exporting}>
                {exporting ? <RefreshCw size={16} className="spin" /> : <Download size={16} />}
                {exporting ? "Preparing image..." : "Download card image"}
              </button>
              <div style={styles.shareOptions}>
                <button style={styles.shareOpt} onClick={onCopyLink}><Copy size={15} /> Copy link</button>
                <button style={styles.shareOpt} onClick={onShareWhatsApp}><MessageCircle size={15} /> WhatsApp</button>
                <button style={styles.shareOpt} onClick={onCopyEmbed}><Share2 size={15} /> Copy embed</button>
              </div>
            </div>

            <div style={styles.ctrlCard}>
              <div style={styles.ctrlTitle}>Trust & movement</div>
              <div style={styles.trustRow}>
                <div style={styles.trustItem}><Sparkles size={16} /> {movementText(card?.movement)}</div>
                <div style={styles.trustItem}><Shield size={16} /> {card?.confidenceLabel || "High confidence"}</div>
                <div style={styles.trustItem}><Palette size={16} /> {savingTheme ? "Saving theme..." : "Theme sync active"}</div>
              </div>
            </div>

            <div style={styles.flagmeCta}>
              <div style={styles.flagmeTitle}>Want more flags? 🚩🟢</div>
              <div style={styles.flagmeSub}>Share your Flag Me card and invite the community to rate you. The more flags, the more accurate your score.</div>
              <a href="/flagme" style={styles.flagmeLink}>Generate Flag Me card →</a>
            </div>

            <button style={styles.refreshButton} onClick={() => loadCard({ silent: true })} disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? "spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh live data"}
            </button>
          </aside>
        </section>
      </main>

      <footer style={styles.siteFooter}>
        <span style={styles.footerCopy}>© 2026 Clocked. Community-powered receipts.</span>
        <div style={styles.footerLinks}>
          <a href="/tos" style={styles.footerLink}>Terms</a>
          <a href="/privacy" style={styles.footerLink}>Privacy</a>
          <a href="/guidelines" style={styles.footerLink}>Guidelines</a>
          <a href="/grievance" style={styles.footerReport}>🛡️ Report / Takedown</a>
        </div>
      </footer>
    </div>
  );
}

function VibeCardFront({ theme, score, handleText, scoreCopy, redFlags, greenFlags, searches }) {
  const ringColor = score >= 65 ? BRAND.green : score >= 45 ? "#EAB308" : BRAND.red;
  const ringBackground = `conic-gradient(${ringColor} 0% ${score}%, ${theme.ringTrack} ${score}% 100%)`;

  return (
    <div style={{ ...styles.vibeCard, background: theme.cardBg, color: theme.text }}>
      <Noise />
      <div style={styles.cardTop}>
        <div style={{ ...styles.cardBrand, color: theme.subText }}>CLOCKED</div>
        <div style={{ ...styles.cardHandle, color: theme.text }}>{handleText}</div>
        <div style={{ ...styles.cardSub, color: theme.subText }}>Community vibe score</div>
      </div>

      <div style={styles.cardMiddle}>
        <div style={{ ...styles.scoreRingOuter, background: ringBackground }}>
          <div style={{ ...styles.scoreRingInner, background: theme.inner }}>
            <span style={{ ...styles.scoreBig, color: theme.text }}>{score}%</span>
            <span style={{ ...styles.scorePctLabel, color: theme.subText }}>{scoreCopy}</span>
          </div>
        </div>
      </div>

      <div style={styles.cardBottom}>
        <div style={styles.cardCounts}>
          <CountItem value={redFlags} label="RED FLAGS" color="#ff5a5f" textColor={theme.text} subColor={theme.subText} />
          <div style={{ ...styles.countDivider, background: theme.divider }} />
          <CountItem value={greenFlags} label="GREEN FLAGS" color="#4ade80" textColor={theme.text} subColor={theme.subText} />
          <div style={{ ...styles.countDivider, background: theme.divider }} />
          <CountItem value={searches} label="SEARCHES" color={theme.text} textColor={theme.text} subColor={theme.subText} />
        </div>
        <div style={{ ...styles.cardCta, color: theme.subText }}>clocked.in · Know the vibe before you invest</div>
      </div>
    </div>
  );
}

function VibeCardBack({ theme, handleText, confidenceLabel, totalFlags, movement, insights, updatedAt }) {
  return (
    <div style={{ ...styles.vibeCard, background: theme.cardBg, color: theme.text, transform: "rotateY(180deg)" }}>
      <Noise />
      <div style={styles.cardTop}>
        <div style={{ ...styles.cardBrand, color: theme.subText }}>CLOCKED</div>
        <div style={{ ...styles.cardHandle, color: theme.text }}>{handleText}</div>
        <div style={{ ...styles.cardSub, color: theme.subText }}>Trust breakdown</div>
      </div>

      <div style={{ ...styles.backPanel, borderColor: theme.divider }}>
        <BackRow label="Confidence" value={confidenceLabel} />
        <BackRow label="Total flags" value={String(totalFlags)} />
        <BackRow label="Movement" value={movementText(movement)} />
        <BackRow label="Status" value={formatUpdatedAt(updatedAt)} />
      </div>

      <div style={styles.backInsightsWrap}>
        <div style={{ ...styles.backInsightsTitle, color: theme.subText }}>Highlights</div>
        {insights.length ? insights.map((item, idx) => (
          <div key={`${item}-${idx}`} style={{ ...styles.backInsight, borderColor: theme.divider }}>
            <span style={styles.backInsightDot} />
            <span>{item}</span>
          </div>
        )) : (
          <div style={{ ...styles.backInsight, borderColor: theme.divider }}>
            <span style={styles.backInsightDot} />
            <span>No additional insights yet</span>
          </div>
        )}
      </div>

      <div style={{ ...styles.cardCta, color: theme.subText }}>Tap again to flip back</div>
    </div>
  );
}

function BackRow({ label, value }) {
  return (
    <div style={styles.backRow}>
      <span style={styles.backRowLabel}>{label}</span>
      <span style={styles.backRowValue}>{value}</span>
    </div>
  );
}

function CountItem({ value, label, color, textColor, subColor }) {
  return (
    <div style={styles.countItem}>
      <span style={{ ...styles.countNum, color }}>{value}</span>
      <span style={{ ...styles.countLabel, color: subColor || textColor }}>{label}</span>
    </div>
  );
}

function StatBox({ value, label, color }) {
  return (
    <div style={styles.statBox}>
      <span style={{ ...styles.statBoxNum, color }}>{value}</span>
      <span style={styles.statBoxLabel}>{label}</span>
    </div>
  );
}

function Noise() {
  return <div style={styles.noiseOverlay} />;
}

function LoadingState() {
  return (
    <div style={styles.centerState}>
      <div style={styles.loaderCard}>Loading vibe card…</div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div style={styles.centerState}>
      <div style={styles.stateCard}>
        <h2 style={styles.stateTitle}>Couldn&apos;t load this vibe card</h2>
        <p style={styles.stateText}>{message}</p>
        <button style={styles.stateButton} onClick={onRetry}>Retry</button>
      </div>
    </div>
  );
}

function PrivateState() {
  return (
    <div style={styles.centerState}>
      <div style={styles.stateCard}>
        <h2 style={styles.stateTitle}>This vibe card isn&apos;t public</h2>
        <p style={styles.stateText}>The owner has disabled public sharing or you don&apos;t have access.</p>
      </div>
    </div>
  );
}

function updateHeadMetadata(data) {
  const title = `@${data.handle} • Vibe Card • Clocked`;
  document.title = title;

  const tags = [
    ["property", "og:title", title],
    ["property", "og:description", `${clampScore(data.score)}% ${scoreLabel(data.score, data.scoreLabel)}`],
    ["property", "og:image", data?.share?.ogImageUrl || ""],
    ["property", "og:type", "website"],
    ["name", "twitter:card", "summary_large_image"],
    ["name", "twitter:title", title],
    ["name", "twitter:description", `${clampScore(data.score)}% ${scoreLabel(data.score, data.scoreLabel)}`],
    ["name", "twitter:image", data?.share?.ogImageUrl || ""],
  ];

  tags.forEach(([attr, key, value]) => {
    if (!value) return;
    let node = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute(attr, key);
      document.head.appendChild(node);
    }
    node.setAttribute("content", value);
  });
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = {
  pageShell: {
    minHeight: "100vh",
    background: BRAND.offWhite,
    color: BRAND.black,
    fontFamily: '"DM Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    display: "flex",
    flexDirection: "column",
  },
  topnav: {
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 2rem",
    background: BRAND.white,
    borderBottom: `1px solid ${BRAND.gray2}`,
    flexShrink: 0,
  },
  navLogo: {
    fontFamily: '"Syne", ui-sans-serif, system-ui, sans-serif',
    fontSize: "1.2rem",
    fontWeight: 800,
    letterSpacing: "-.5px",
    color: BRAND.black,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  logoFlags: { display: "flex", gap: 4, alignItems: "center" },
  flagShape: { width: 9, height: 15, clipPath: "polygon(0 0,100% 15%,100% 85%,0 100%)", display: "block" },
  navRight: { display: "flex", gap: 8 },
  btnGhost: {
    fontSize: ".8rem",
    fontWeight: 500,
    color: BRAND.gray5,
    background: "none",
    border: `1px solid ${BRAND.gray3}`,
    borderRadius: 30,
    padding: "5px 14px",
    cursor: "pointer",
    textDecoration: "none",
  },
  btnSolid: {
    fontSize: ".8rem",
    fontWeight: 600,
    color: BRAND.white,
    background: BRAND.black,
    border: `1px solid ${BRAND.black}`,
    borderRadius: 30,
    padding: "5px 16px",
    cursor: "pointer",
    textDecoration: "none",
  },
  pageWrap: { flex: 1, display: "flex", flexDirection: "column" },
  page: {
    flex: 1,
    maxWidth: 900,
    margin: "0 auto",
    width: "100%",
    padding: "3rem 2rem",
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: "3rem",
    alignItems: "start",
  },
  cardStage: { display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" },
  flipScene: {
    width: "100%",
    maxWidth: 360,
    aspectRatio: "9 / 16",
    perspective: 1200,
    cursor: "pointer",
    outline: "none",
  },
  flipInner: {
    width: "100%",
    height: "100%",
    position: "relative",
    transformStyle: "preserve-3d",
    transition: "transform .6s ease",
  },
  vibeCard: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    padding: "2rem",
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    backfaceVisibility: "hidden",
    boxShadow: "0 14px 40px rgba(12,12,10,.12)",
  },
  noiseOverlay: {
    position: "absolute",
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
    pointerEvents: "none",
    zIndex: 0,
  },
  cardTop: { position: "relative", zIndex: 1 },
  cardBrand: { fontFamily: '"Syne", sans-serif', fontSize: ".72rem", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: "1.5rem" },
  cardHandle: { fontFamily: '"Syne", sans-serif', fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-.5px", marginBottom: ".25rem" },
  cardSub: { fontSize: ".75rem", marginBottom: "2rem" },
  cardMiddle: { position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", flex: 1 },
  scoreRingOuter: { width: 140, height: 140, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
  scoreRingInner: { width: 106, height: 106, borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: '"Syne", sans-serif' },
  scoreBig: { fontSize: "2rem", fontWeight: 800, lineHeight: 1 },
  scorePctLabel: { fontSize: ".6rem", marginTop: 2, fontWeight: 500 },
  cardBottom: { position: "relative", zIndex: 1 },
  cardCounts: { display: "flex", gap: "1rem", marginBottom: "1.25rem", alignItems: "stretch" },
  countItem: { flex: 1, textAlign: "center" },
  countNum: { fontFamily: '"Syne", sans-serif', fontSize: "1.5rem", fontWeight: 800, display: "block", lineHeight: 1, marginBottom: 2 },
  countLabel: { fontSize: ".62rem", fontWeight: 500 },
  countDivider: { width: 1, margin: "4px 0" },
  cardCta: { fontSize: ".7rem", textAlign: "center", fontWeight: 500, letterSpacing: ".5px" },
  backPanel: {
    position: "relative",
    zIndex: 1,
    border: "1px solid",
    borderRadius: 16,
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: ".8rem",
    background: "rgba(255,255,255,.02)",
  },
  backRow: { display: "flex", justifyContent: "space-between", gap: 12 },
  backRowLabel: { fontSize: ".72rem", opacity: .65, fontWeight: 500 },
  backRowValue: { fontSize: ".82rem", fontWeight: 700, textAlign: "right" },
  backInsightsWrap: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: ".65rem", marginTop: "1rem", flex: 1 },
  backInsightsTitle: { fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" },
  backInsight: { border: "1px solid", borderRadius: 12, padding: ".8rem .9rem", display: "flex", alignItems: "center", gap: ".65rem", fontSize: ".78rem", lineHeight: 1.5 },
  backInsightDot: { width: 8, height: 8, borderRadius: 999, background: BRAND.green, flexShrink: 0 },
  themeRowWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  themeRow: { display: "flex", gap: 8, justifyContent: "center" },
  themeDot: { width: 28, height: 28, borderRadius: "50%", cursor: "pointer", border: "2px solid transparent", transition: "all .15s", flexShrink: 0 },
  themeHint: { fontSize: ".72rem", color: BRAND.gray4, textAlign: "center" },
  controlsCol: { display: "flex", flexDirection: "column", gap: 14 },
  ctrlCard: { background: BRAND.white, border: `1px solid ${BRAND.gray2}`, borderRadius: 14, padding: "1.25rem" },
  ctrlTitle: { fontFamily: '"Syne", sans-serif', fontSize: ".7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: BRAND.gray4, marginBottom: ".9rem" },
  handlePreviewRow: { display: "flex", alignItems: "center", gap: 10, background: BRAND.gray1, borderRadius: 8, padding: ".75rem" },
  hpAvatar: { width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${BRAND.red}, #FF8A65)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: '"Syne", sans-serif', fontSize: ".85rem", fontWeight: 800, color: BRAND.white, flexShrink: 0 },
  avatarImage: { width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 },
  hpName: { fontFamily: '"Syne", sans-serif', fontSize: ".88rem", fontWeight: 700, color: BRAND.black },
  hpScore: { fontSize: ".68rem", color: BRAND.green, fontWeight: 600, marginTop: 1 },
  statRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: ".5rem" },
  statBox: { background: BRAND.gray1, borderRadius: 8, padding: ".75rem", textAlign: "center" },
  statBoxNum: { fontFamily: '"Syne", sans-serif', fontSize: "1.2rem", fontWeight: 800, display: "block", lineHeight: 1, marginBottom: 2 },
  statBoxLabel: { fontSize: ".6rem", color: BRAND.gray4 },
  helperCopy: { fontSize: ".72rem", color: BRAND.gray4, lineHeight: 1.5 },
  shareBtn: { width: "100%", fontFamily: '"Syne", sans-serif', fontSize: ".9rem", fontWeight: 700, color: BRAND.white, background: BRAND.black, border: "none", borderRadius: 8, padding: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  shareOptions: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 },
  shareOpt: { fontSize: ".78rem", fontWeight: 500, padding: 9, borderRadius: 8, border: `1px solid ${BRAND.gray3}`, background: "none", cursor: "pointer", color: BRAND.gray5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },
  publicUrlWrap: { marginTop: 12, display: "flex", flexDirection: "column", gap: 6 },
  publicUrlLabel: { fontSize: ".65rem", textTransform: "uppercase", letterSpacing: ".4px", color: BRAND.gray4, fontWeight: 700 },
  publicUrlCode: { background: BRAND.gray1, padding: "10px 12px", borderRadius: 8, fontSize: ".72rem", color: BRAND.gray5, overflowX: "auto" },
  infoCopy: { fontSize: ".78rem", color: BRAND.gray5, lineHeight: 1.6 },
  trustRow: { display: "flex", flexDirection: "column", gap: 8 },
  trustItem: { background: BRAND.gray1, borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, fontSize: ".78rem", color: BRAND.gray5, fontWeight: 600 },
  flagmeCta: { background: BRAND.black, borderRadius: 14, padding: "1.1rem 1.25rem", textAlign: "center" },
  flagmeTitle: { fontFamily: '"Syne", sans-serif', fontSize: ".9rem", fontWeight: 800, color: BRAND.white, marginBottom: 4 },
  flagmeSub: { fontSize: ".72rem", color: "rgba(255,255,255,.5)", marginBottom: ".85rem", lineHeight: 1.45 },
  flagmeLink: { display: "inline-block", background: BRAND.white, color: BRAND.black, fontFamily: '"Syne", sans-serif', fontSize: ".78rem", fontWeight: 700, padding: "8px 18px", borderRadius: 8, textDecoration: "none" },
  refreshButton: { border: `1px solid ${BRAND.gray3}`, background: BRAND.white, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", fontWeight: 700, color: BRAND.gray5 },
  siteFooter: { borderTop: `1px solid ${BRAND.gray2}`, padding: "1.25rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", background: BRAND.white, flexShrink: 0 },
  footerCopy: { fontSize: ".75rem", color: BRAND.gray4 },
  footerLinks: { display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" },
  footerLink: { fontSize: ".75rem", color: BRAND.gray4, textDecoration: "none" },
  footerReport: { fontSize: ".72rem", color: BRAND.red, fontWeight: 500, border: `1px solid ${BRAND.redMid}`, background: BRAND.redLight, padding: "4px 12px", borderRadius: 20, textDecoration: "none" },
  centerState: { minHeight: "100vh", display: "grid", placeItems: "center", background: BRAND.offWhite, padding: 24 },
  loaderCard: { background: BRAND.white, border: `1px solid ${BRAND.gray2}`, borderRadius: 16, padding: "20px 24px", fontWeight: 700 },
  stateCard: { background: BRAND.white, border: `1px solid ${BRAND.gray2}`, borderRadius: 16, padding: 28, maxWidth: 420, width: "100%" },
  stateTitle: { fontFamily: '"Syne", sans-serif', fontSize: "1.2rem", fontWeight: 800, marginBottom: 8 },
  stateText: { color: BRAND.gray5, lineHeight: 1.6 },
  stateButton: { marginTop: 16, background: BRAND.black, color: BRAND.white, border: 0, borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" },
};

const globalCss = `
  * { box-sizing: border-box; }
  html, body, #root { margin: 0; min-height: 100%; }
  button { font: inherit; }
  a { color: inherit; }
  .vc-toast {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%) translateY(80px);
    background: #0C0C0A;
    color: #fff;
    font-size: .82rem;
    font-weight: 500;
    padding: 10px 22px;
    border-radius: 30px;
    z-index: 999;
    transition: transform .3s ease;
    white-space: nowrap;
    pointer-events: none;
  }
  .vc-toast.show { transform: translateX(-50%) translateY(0); }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @media (max-width: 700px) {
    .vc-toast { max-width: calc(100vw - 32px); overflow: hidden; text-overflow: ellipsis; }
  }
  @media (max-width: 920px) {
    [style*="grid-template-columns: 1fr 340px"] {
      grid-template-columns: 1fr !important;
      padding: 2rem 1rem !important;
      gap: 2rem !important;
    }
  }
  @media (max-width: 700px) {
    [style*="height: 56px"] { padding: 0 1rem !important; }
    [style*="padding: 1.25rem 2rem"] {
      padding: 1.25rem 1rem !important;
    }
  }
`;
