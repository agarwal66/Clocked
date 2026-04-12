import React, { useEffect, useState } from "react";

// ================= API =================
const api = async (url) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed");
  return res.json();
};

export default function HandleClaimedPage() {
  const [handle, setHandle] = useState("");
  const [flags, setFlags] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const h = urlParams.get("handle");

        // fetch real data
        const data = await api(`/api/handles/${h}`);

        setHandle(data.handle);
        setFlags(data.flagsCount);
      } catch {
        setHandle("unknown");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <div style={styles.body}>
      {/* HEADER */}
      <div style={styles.topnav}>
        <a href="/home" style={styles.logo}>Clocked</a>
      </div>

      {/* MAIN */}
      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={styles.confetti}>??</div>

          <div style={styles.handleBox}>
            @{handle} <span style={styles.tick}>?</span>
          </div>

          <h1 style={styles.title}>Handle claimed.</h1>
          <p style={styles.sub}>
            You've linked @{handle} to your account.
          </p>

          {flags > 0 && (
            <div style={styles.notice}>
              <strong>?? There are {flags} flags</strong>
              <p>Check your profile to respond.</p>
            </div>
          )}

          <div style={styles.grid}>
            <Feature icon="?" title="Notifications" desc="Know when searched" />
            <Feature icon="?" title="Vibe Score" desc="Live score" />
            <Feature icon="?" title="Respond" desc="Add your side" />
            <Feature icon="?" title="Vibe Card" desc="Share profile" />
          </div>

          <div style={styles.actions}>
            <a href={`/@${handle}`} style={styles.primary}>View profile ?</a>
            <a href="/dashboard" style={styles.secondary}>Dashboard</a>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={styles.footer}>
        © Clocked
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div style={styles.feature}>
      <div>{icon}</div>
      <div>
        <strong>{title}</strong>
        <div style={{ fontSize: 12 }}>{desc}</div>
      </div>
    </div>
  );
}

// ================= STYLES =================
const styles = {
  body: { fontFamily: "DM Sans", background: "#F8F7F3", minHeight: "100vh" },
  topnav: { height: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" },
  logo: { fontWeight: "bold", textDecoration: "none", color: "#000" },
  wrap: { display: "flex", justifyContent: "center", padding: 40 },
  card: { background: "#fff", padding: 30, borderRadius: 14, width: 420, textAlign: "center" },
  confetti: { fontSize: 30 },
  handleBox: { background: "#000", color: "#fff", padding: "6px 14px", borderRadius: 20, display: "inline-block", marginBottom: 10 },
  tick: { marginLeft: 6, color: "#1A9E5F" },
  title: { fontSize: 22, fontWeight: 800 },
  sub: { fontSize: 14, color: "#666" },
  notice: { background: "#E8FFF1", padding: 10, borderRadius: 8, marginTop: 15 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20 },
  feature: { background: "#f2f2f2", padding: 10, borderRadius: 8, textAlign: "left" },
  actions: { marginTop: 20 },
  primary: { padding: "10px 20px", background: "#1A9E5F", color: "#fff", borderRadius: 8, marginRight: 10, textDecoration: "none" },
  secondary: { padding: "10px 20px", border: "1px solid #ccc", borderRadius: 8, textDecoration: "none" },
  footer: { textAlign: "center", padding: 20 }
};