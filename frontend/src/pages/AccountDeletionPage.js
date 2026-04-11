import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5004/api";

// Production API function with authentication
const apiFetch = async (path, options = {}) => {
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
};

export default function AccountDeletionPage() {
  const navigate = useNavigate();
  const [selectedReason, setSelectedReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const deletionReasons = [
    "Privacy concerns",
    "Too many notifications",
    "Found alternative service",
    "Account security concerns",
    "No longer need the service",
    "Other"
  ];

  const handleDeleteAccount = async () => {
    if (!selectedReason) {
      setError("Please select a reason for deletion");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiFetch("/auth/delete-account", {
        method: "DELETE",
        body: JSON.stringify({
          reason: selectedReason,
          confirmation: true,
          timestamp: new Date().toISOString()
        })
      });

      // Clear local storage and logout immediately
      localStorage.removeItem('clocked_token');
      
      // Force redirect to home page after successful deletion
      window.location.href = '/home';

    } catch (err) {
      console.error('Account deletion error:', err);
      setError(err.message || "Failed to delete account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.body}>
      {/* HEADER */}
      <header style={styles.topnav}>
        <a href="/home" style={styles.logo}>
          <div style={styles.flags}>
            <div style={{ ...styles.flag, background: "#E2353A" }} />
            <div style={{ ...styles.flag, background: "#1A9E5F" }} />
          </div>
          Clocked
        </a>
      </header>

      {/* MAIN */}
      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={styles.icon}>delete</div>
          <h1 style={styles.title}>Delete Account</h1>
          <p style={styles.sub}>
            This action cannot be undone. All your personal data will be permanently deleted.
          </p>

          {/* WARNING */}
          <div style={styles.warning}>
            <strong style={styles.warningTitle}>Before you delete your account:</strong>
            <ul style={styles.warningList}>
              <li>All personal information will be permanently deleted</li>
              <li>Your flags and activity will be removed</li>
              <li>Some anonymized data may be retained for legal compliance</li>
              <li>You'll need to create a new account to use Clocked again</li>
            </ul>
          </div>

          {/* REASON SELECTION */}
          <div style={{ marginBottom: 20 }}>
            <p style={styles.label}>Why are you leaving?</p>
            <div style={styles.reasons}>
              {deletionReasons.map((reason) => (
                <label key={reason} style={styles.reasonOption}>
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    style={{ marginRight: 8 }}
                  />
                  {reason}
                </label>
              ))}
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          {/* ACTIONS */}
          <div style={styles.actions}>
            <button
              onClick={handleDeleteAccount}
              disabled={loading || !selectedReason}
              style={{
                ...styles.danger,
                opacity: (loading || !selectedReason) ? 0.5 : 1,
                cursor: (loading || !selectedReason) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Deleting...' : 'Delete My Account'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              style={styles.cancel}
            >
              Cancel
            </button>
          </div>

          <p style={styles.note}>
            Need help? Email us at support@clocked.in
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <span> 2025 Clocked</span>
        <div>
          <a href="/terms">Terms</a> | <a href="/grievance">Grievance</a>
        </div>
      </footer>
    </div>
  );
}

// ================= STYLES =================
const styles = {
  body: { 
    fontFamily: "DM Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", 
    background: "linear-gradient(135deg, #F8F7F3 0%, #F0EFEB 100%)", 
    minHeight: "100vh", 
    display: "flex", 
    flexDirection: "column" 
  },
  topnav: { 
    height: 56, 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    background: "#fff", 
    borderBottom: "1px solid #eee" 
  },
  logo: { 
    display: "flex", 
    alignItems: "center", 
    gap: 8, 
    textDecoration: "none", 
    color: "#000", 
    fontWeight: 800 
  },
  flags: { display: "flex", gap: 4 },
  flag: { width: 9, height: 15 },
  wrap: { 
    flex: 1, 
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 20 
  },
  card: { 
    background: "#fff", 
    borderRadius: 12, 
    padding: 32, 
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)", 
    maxWidth: 480, 
    width: "100%",
    textAlign: "center"
  },
  icon: { 
    fontSize: 48, 
    marginBottom: 16, 
    color: "#E2353A"
  },
  title: { 
    fontSize: 24, 
    fontWeight: 700, 
    marginBottom: 8, 
    color: "#000"
  },
  sub: { 
    fontSize: 16, 
    color: "#666", 
    marginBottom: 24, 
    lineHeight: 1.4
  },
  warning: {
    background: "#FFF0F0",
    border: "1px solid #FFBDBE",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    textAlign: "left"
  },
  warningTitle: {
    color: "#E2353A",
    display: "block",
    marginBottom: 8
  },
  warningList: {
    margin: 0,
    paddingLeft: 20,
    color: "#666",
    fontSize: 14,
    lineHeight: 1.5
  },
  label: { 
    fontSize: 14, 
    fontWeight: 600, 
    marginBottom: 8, 
    color: "#333",
    textAlign: "left"
  },
  reasons: {
    textAlign: "left",
    marginBottom: 20
  },
  reasonOption: {
    display: "block",
    marginBottom: 8,
    fontSize: 14,
    color: "#333",
    cursor: "pointer"
  },
  error: {
    background: "#FFF0F0",
    border: "1px solid #FFBDBE",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    color: "#E2353A",
    fontSize: 14
  },
  actions: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    marginBottom: 20
  },
  danger: { 
    display: "inline-block", 
    padding: "12px 24px", 
    background: "#E2353A", 
    color: "#fff", 
    borderRadius: 8, 
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14
  },
  cancel: { 
    display: "inline-block", 
    padding: "12px 24px", 
    border: "1px solid #ccc", 
    borderRadius: 8, 
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    color: "#333"
  },
  note: { 
    fontSize: 12, 
    marginTop: 15, 
    color: "#777",
    lineHeight: 1.4
  },
  footer: {
    marginTop: "auto",
    padding: "16px 20px",
    borderTop: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 12,
    color: "#666"
  }
};
