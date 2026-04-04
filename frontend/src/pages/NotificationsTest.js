import React, { useState, useEffect } from 'react';

export default function NotificationsTest() {
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
      <h1>🔔 NOTIFICATIONS TEST PAGE</h1>
      <p>Direct test page - if you see this, routing works!</p>
      
      <h2>📊 Total Notifications: {logs.length}</h2>
      
      {logs.length === 0 ? (
        <p>No notifications found</p>
      ) : (
        <div>
          {logs.map((log) => (
            <div key={log._id} style={{ 
              border: '1px solid #ddd', 
              padding: '15px', 
              margin: '10px 0',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9'
            }}>
              <h3>{log.title}</h3>
              <p>{log.body}</p>
              <div style={{ fontSize: '12px', color: '#666' }}>
                <strong>Type:</strong> {log.type} | 
                <strong> Channel:</strong> {log.channel} | 
                <strong> Status:</strong> {log.delivery_status}
              </div>
              <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
                Created: {new Date(log.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
