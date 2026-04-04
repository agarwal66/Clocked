import React from 'react';

export default function TestNotifications() {
  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px', borderRadius: '10px' }}>
      <h2>🔔 Test Notifications Component</h2>
      <p>If you can see this, the component system is working!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  );
}
