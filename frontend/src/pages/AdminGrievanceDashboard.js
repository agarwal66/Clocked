import React, { useEffect, useState } from "react";

// ================= API =================
const api = async (url, options = {}) => {
  console.log('API call being made:', url);
  console.log('API options:', options);
  
  const token = localStorage.getItem('clocked_token');
  console.log('Token available:', !!token);
  
  const res = await fetch(url, {
    credentials: "include",
    headers: { 
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` })
    },
    ...options,
  });
  
  console.log('API response status:', res.status);
  console.log('API response ok:', res.ok);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('API error response:', errorText);
    throw new Error(`Request failed: ${res.status} ${errorText}`);
  }
  
  const data = await res.json();
  console.log('API response data:', data);
  return data;
};

export default function AdminGrievanceDashboard() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchData = async () => {
    console.log('Fetching grievances data...');
    setLoading(true);
    try {
      const res = await api(`${process.env.REACT_APP_API_BASE_URL}/admin/grievances`);
      console.log('Grievances data received:', res);
      setData(res.data || []);
      setLastUpdate(new Date());
      console.log('Data set successfully, grievances count:', (res.data || []).length);
    } catch (error) {
      console.error('Error fetching grievances:', error);
      alert("Failed to load grievances");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let result = [...data];

    // filter
    if (filter !== "all") {
      result = result.filter((g) => g.status === filter);
    }

    // search
    if (search) {
      result = result.filter((g) =>
        g.handle.toLowerCase().includes(search.toLowerCase()) ||
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.type.toLowerCase().includes(search.toLowerCase())
      );
    }

    // sort (pending first, then by date)
    result.sort((a, b) => {
      const order = { pending: 0, reviewed: 1, resolved: 2 };
      const statusDiff = order[a.status] - order[b.status];
      if (statusDiff !== 0) return statusDiff;
      
      // If same status, sort by date (newest first)
      return new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt);
    });

    setFiltered(result);
  }, [data, filter, search]);

  const updateStatus = async (id, status) => {
    try {
      console.log('Updating grievance:', { id, status });
      console.log('API URL:', `${process.env.REACT_APP_API_BASE_URL}/admin/grievances/${id}`);
      
      const response = await api(`${process.env.REACT_APP_API_BASE_URL}/admin/grievances/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      
      console.log('Update response:', response);
      
      // Update local state immediately for real-time feel
      setData(prev => prev.map(g => 
        g._id === id || g.id === id 
          ? { ...g, status, updatedAt: new Date() }
          : g
      ));
      
      // Clear selection if updating the currently selected item
      if (selected && (selected._id === id || selected.id === id)) {
        setSelected(null);
      }
      
      alert(`Grievance marked as ${status}`);
    } catch (error) {
      console.error('Error updating grievance:', error);
      alert(`Failed to update status: ${error.message}`);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff4444';
      case 'reviewed': return '#ff8800';
      case 'resolved': return '#00aa00';
      default: return '#666666';
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2>Moderation Dashboard</h2>
        <div style={styles.lastUpdate}>
          Last updated: {formatTime(lastUpdate)}
        </div>
      </div>

      <div style={styles.toolbar}>
        <input
          placeholder="Search by handle, name, or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />

        <select onChange={(e) => setFilter(e.target.value)} style={styles.select}>
          <option value="all">All ({data.length})</option>
          <option value="pending">Pending ({data.filter(g => g.status === 'pending').length})</option>
          <option value="reviewed">Reviewed ({data.filter(g => g.status === 'reviewed').length})</option>
          <option value="resolved">Resolved ({data.filter(g => g.status === 'resolved').length})</option>
        </select>

        <button onClick={fetchData} style={styles.refreshBtn}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <p style={{ padding: 20 }}>Loading grievances...</p>
      ) : (
        <div style={styles.grid}>
          {/* LIST */}
          <div style={styles.list}>
            {filtered.map((g) => (
              <div key={g._id || g.id} style={styles.item} onClick={() => setSelected(g)}>
                <div style={styles.rowTop}>
                  <strong>@{g.handle}</strong>
                  <span style={{...styles.status, color: getStatusColor(g.status)}}>
                    {g.status}
                  </span>
                </div>
                <div style={styles.meta}>
                  {g.type} • {formatTime(g.createdAt || g.updatedAt)}
                </div>
                {g.updatedAt && g.updatedAt !== g.createdAt && (
                  <div style={styles.updatedBadge}>
                    Updated {formatTime(g.updatedAt)}
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={styles.emptyState}>
                No grievances found matching your criteria.
              </div>
            )}
          </div>

          {/* DETAIL */}
          <div style={styles.detail}>
            {selected ? (
              <>
                <h3>@{selected.handle}</h3>

                <div style={styles.card}>
                  <p><strong>Name:</strong> {selected.name}</p>
                  <p><strong>Email:</strong> {selected.email}</p>
                  <p><strong>Type:</strong> {selected.type}</p>
                  <p><strong>Subject:</strong> {selected.isSubject}</p>
                  <p><strong>Status:</strong> 
                    <span style={{ color: getStatusColor(selected.status), fontWeight: 'bold' }}>
                      {selected.status}
                    </span>
                  </p>
                  <p><strong>Submitted:</strong> {formatTime(selected.createdAt)}</p>
                  {selected.updatedAt && (
                    <p><strong>Last Updated:</strong> {formatTime(selected.updatedAt)}</p>
                  )}
                </div>

                <div style={styles.card}>
                  <strong>Description</strong>
                  <div style={styles.desc}>{selected.description}</div>
                </div>

                <div style={styles.actions}>
                  {selected.status === 'pending' && (
                    <button onClick={() => updateStatus(selected._id || selected.id, "reviewed")} style={styles.btnYellow}>
                      Mark Reviewed
                    </button>
                  )}
                  {(selected.status === 'pending' || selected.status === 'reviewed') && (
                    <button onClick={() => updateStatus(selected._id || selected.id, "resolved")} style={styles.btnGreen}>
                      Resolve
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div style={styles.emptyDetail}>
                <div style={styles.emptyIcon}>📋</div>
                <p>Select a grievance to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ================= STYLES =================
const styles = {
  page: { fontFamily: "DM Sans", height: "100vh", display: "flex", flexDirection: "column" },
  header: { padding: "1rem", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" },
  lastUpdate: { fontSize: "12px", color: "#666" },
  toolbar: { display: "flex", gap: 10, padding: "1rem", borderBottom: "1px solid #eee", alignItems: "center" },
  search: { flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #ddd" },
  select: { padding: "10px", borderRadius: 8, border: "1px solid #ddd" },
  refreshBtn: { padding: "10px 15px", borderRadius: 8, border: "1px solid #ddd", background: "#f0f0f0", cursor: "pointer" },
  grid: { display: "flex", flex: 1 },
  list: { width: "35%", borderRight: "1px solid #eee", overflowY: "auto" },
  item: { padding: "1rem", borderBottom: "1px solid #eee", cursor: "pointer", position: "relative" },
  rowTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  meta: { fontSize: 12, color: "#666", marginTop: "4px" },
  status: { fontSize: 12, fontWeight: "bold", padding: "2px 8px", borderRadius: 4, textTransform: "uppercase" },
  updatedBadge: { fontSize: 10, color: "#ff8800", marginTop: "4px", fontStyle: "italic" },
  emptyState: { padding: "2rem", textAlign: "center", color: "#666" },
  detail: { flex: 1, padding: "1rem", overflowY: "auto" },
  card: { background: "#f9f9f9", padding: "1rem", borderRadius: 8, marginBottom: "1rem" },
  desc: { marginTop: 8, lineHeight: 1.5 },
  actions: { display: "flex", gap: 10, marginTop: "1rem" },
  btnYellow: { padding: "10px", background: "#ff8800", border: "none", color: "#fff", borderRadius: 6, cursor: "pointer" },
  btnGreen: { padding: "10px", background: "#00aa00", border: "none", color: "#fff", borderRadius: 6, cursor: "pointer" },
  emptyDetail: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#666" },
  emptyIcon: { fontSize: "48px", marginBottom: "1rem" }
};
