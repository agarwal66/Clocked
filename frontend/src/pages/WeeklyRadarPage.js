import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

// ================= API =================
const api = async (url, options = {}) => {
  const token = localStorage.getItem('clocked_token');
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) throw new Error("Failed");
  return response.json();
};

export default function WeeklyRadarPage() {
  const { isAuthenticated, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api(`${process.env.REACT_APP_API_BASE_URL}/radar/weekly`);
        
        setData(res);
      } catch {
        alert("Failed to load radar");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!data) return <div style={styles.loading}>No data</div>;

  return (
    <div style={styles.body}>
      {/* HEADER */}
      <header style={styles.topnav}>
        <div style={styles.logoWrap}>
          <div style={styles.flagR}></div>
          <div style={styles.flagG}></div>
          <strong>Clocked</strong>
        </div>
        <a href="/dashboard" style={styles.link}>Dashboard →</a>
      </header>

      <div style={styles.page}>

        {/* HERO */}
        <div style={styles.hero}>
          <div style={{ fontSize: 28 }}>📡</div>
          <div>
            <div style={styles.heroTitle}>Your weekly radar</div>
            <div style={styles.heroSub}>{data.week}</div>
            <div style={styles.heroHandle}>@{user?.username || data.handle || "user"}</div>
            <div style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
              Current time: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* YOUR WEEK */}
        <Card title="Your handle this week">
          <div style={styles.statRow}>
            <Stat value={data.stats.searches} label="Handle searches" />
            <Stat value={data.stats.red} label="New red flags" red />
            <Stat value={data.stats.green} label="New green flags" green />
          </div>

          <div style={styles.scoreRow(data.score.to >= data.score.from)}>
            <span style={styles.scoreFrom}>{data.score.from}%</span>
            <span>→</span>
            <span style={styles.scoreTo(data.score.to >= data.score.from)}>
              {data.score.to}%
            </span>
            <div style={styles.scoreText}>
              Vibe score {data.score.to >= data.score.from ? "up" : "down"}
            </div>
          </div>

          {/* User's actual flags for this week */}
          {data.userFlags && data.userFlags.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#333' }}>
                Your flags this week ({data.userFlags.length})
              </div>
              {data.userFlags.map((flag, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  marginBottom: '6px',
                  backgroundColor: flag.flag_type === 'red' ? '#FFF0F0' : '#F0FFF8',
                  border: `1px solid ${flag.flag_type === 'red' ? '#FFBDBE' : '#A3E6C8'}`,
                  borderRadius: '6px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: flag.flag_type === 'red' ? '#E2353A' : '#1A9E5F',
                    marginRight: '10px'
                  }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {flag.flag_type === 'red' ? 'Red' : 'Green'} flag
                    </div>
                    <div style={{ fontSize: 11, color: '#999' }}>
                      {new Date(flag.created_at).toLocaleDateString()} at {new Date(flag.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                  {flag.relationship && (
                    <div style={{
                      fontSize: 11,
                      color: '#666',
                      backgroundColor: '#f0f0f0',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {flag.relationship}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* WATCHED */}
        <Card title="Handles you're watching">
          {data.watch.map((w, i) => (
            <div key={i} style={styles.watchItem}>
              <div style={styles.avatar}>{w.handle[0].toUpperCase()}</div>
              <div>
                <div>@{w.handle}</div>
                <div style={styles.meta}>{w.meta}</div>
              </div>
            </div>
          ))}
        </Card>

        {/* YOU ARE WATCHING */}
        {data.watch && data.watch.length > 0 && (
          <Card title="You are watching">
            {data.watch.map((item, i) => (
              <div key={i} style={styles.watchItem}>
                <div style={styles.watchAvatar}>@{item.handle[0]?.toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.watchHandle}>@{item.handle}</div>
                  <div style={styles.watchMeta}>{item.meta}</div>
                  <div style={styles.watchStats}>
                    {item.red > 0 && <span style={styles.watchRed}>{item.red} red</span>}
                    {item.green > 0 && <span style={styles.watchGreen}>{item.green} green</span>}
                    <span style={styles.watchLast}>Last flag {item.lastFlag}</span>
                  </div>
                </div>
                <div style={styles.watchScore}>
                  {item.red > item.green ? 'red' : 'green'} flag
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* COMMUNITY */}
        <Card title="Community this week">
          <div style={styles.grid2}>
            <Stat value={data.community.red} label="Red flags" red />
            <Stat value={data.community.green} label="Green flags" green />
            <Stat value={data.community.searches} label="Searches" />
            <Stat value={data.community.users} label="New users" />
          </div>
        </Card>

        {/* TOP FLAGS */}
        <Card title="Most-read flags">
          {data.topFlags.map((f, i) => (
            <div key={i} style={styles.flagItem}>
              <div style={styles.dot(f.category)}></div>
              <div>
                <div>@{f.handle}</div>
                <div style={styles.meta}>{f.category}</div>
              </div>
              <span style={styles.views}>{f.views} views</span>
            </div>
          ))}
        </Card>

        {/* CTA */}
        <div style={styles.cta}>
          <div>
            <div style={styles.ctaTitle}>Share your vibe card</div>
            <div style={styles.ctaSub}>Your score improved</div>
          </div>
          <a href="/vibecard" style={styles.ctaBtn}>Generate →</a>
        </div>

      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      {children}
    </div>
  );
}

function Stat({ value, label, red, green }) {
  return (
    <div style={styles.statBox}>
      <div style={{
        ...styles.statNum,
        color: red ? "#E2353A" : green ? "#1A9E5F" : "#000"
      }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

// ================= STYLES =================
const styles = {
  body: { fontFamily: "DM Sans", background: "#F8F7F3" },
  loading: { padding: 40 },
  topnav: { height: 56, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", background: "#fff" },
  logoWrap: { display: "flex", gap: 6, alignItems: "center" },
  flagR: { width: 9, height: 15, background: "#E2353A" },
  flagG: { width: 9, height: 15, background: "#1A9E5F" },
  link: { textDecoration: "none", fontSize: 13 },

  page: { maxWidth: 680, margin: "0 auto", padding: 20 },

  hero: { background: "#000", color: "#fff", padding: 20, borderRadius: 14, display: "flex", gap: 12, marginBottom: 15 },
  heroTitle: { fontSize: 20, fontWeight: 800 },
  heroSub: { fontSize: 12, opacity: 0.6 },
  heroHandle: { fontSize: 12, opacity: 0.7 },

  card: { background: "#fff", padding: 16, borderRadius: 14, marginBottom: 12 },
  cardTitle: { fontSize: 12, fontWeight: 700, marginBottom: 10, color: "#999" },

  statRow: { display: "flex", gap: 10 },
  statBox: { flex: 1, background: "#F2F1EC", padding: 10, borderRadius: 8, textAlign: "center" },
  statNum: { fontSize: 20, fontWeight: 800 },
  statLabel: { fontSize: 10, color: "#777" },

  scoreRow: (up) => ({ display: "flex", alignItems: "center", gap: 10, marginTop: 10, background: up ? "#F0FFF8" : "#FFF0F0", padding: 10, borderRadius: 8 }),
  scoreFrom: { opacity: 0.5, fontWeight: 800 },
  scoreTo: (up) => ({ fontWeight: 800, color: up ? "#1A9E5F" : "#E2353A" }),
  scoreText: { fontSize: 12 },

  watchItem: { display: "flex", gap: 10, padding: 8, borderBottom: "1px solid #eee" },
  watchAvatar: { width: 30, height: 30, borderRadius: "50%", background: "#ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 },
  watchHandle: { fontSize: 14, fontWeight: 600 },
  watchMeta: { fontSize: 12, color: "#888", marginBottom: 4 },
  watchStats: { display: "flex", gap: 8, fontSize: 11, color: "#666" },
  watchRed: { color: "#E2353A" },
  watchGreen: { color: "#1A9E5F" },
  watchLast: { color: "#999" },
  watchScore: { fontSize: 11, padding: "4px 8px", borderRadius: 4, background: "#f0f0f0" },
  avatar: { width: 30, height: 30, borderRadius: "50%", background: "#ccc", display: "flex", alignItems: "center", justifyContent: "center" },
  meta: { fontSize: 12, color: "#888" },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },

  flagItem: { display: "flex", gap: 10, alignItems: "center", padding: 8 },
  dot: (cat) => ({ width: 8, height: 8, borderRadius: "50%", background: cat.includes("Love") ? "#E2353A" : "#1A9E5F" }),
  views: { fontSize: 12, marginLeft: "auto" },

  cta: { background: "#000", color: "#fff", padding: 20, borderRadius: 14, display: "flex", justifyContent: "space-between", alignItems: "center" },
  ctaTitle: { fontWeight: 800 },
  ctaSub: { fontSize: 12, opacity: 0.6 },
  ctaBtn: { background: "#fff", padding: "8px 16px", borderRadius: 8, textDecoration: "none", color: "#000" }
};