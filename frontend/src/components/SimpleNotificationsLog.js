import React, { useState, useEffect } from 'react';

export default function SimpleNotificationsLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const token = localStorage.getItem('clocked_admin_token');
        const response = await fetch('/api/notifications/admin/notifications-log', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        console.log('Notifications data:', data);
        setLogs(data.logs || []);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, []);

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading notifications...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>🔔 Notifications Log ({logs.length})</h2>
      {logs.length === 0 ? (
        <p>No notifications found</p>
      ) : (
        <div>
          {logs.map((log) => (
            <div key={log._id} style={{ 
              border: '1px solid #ddd', 
              padding: '10px', 
              margin: '10px 0',
              borderRadius: '5px' 
            }}>
              <strong>{log.title}</strong>
              <br />
              <small>{log.body}</small>
              <br />
              <small>Type: {log.type} | Status: {log.delivery_status}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
