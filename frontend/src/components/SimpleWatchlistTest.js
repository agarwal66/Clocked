import React, { useEffect, useState } from "react";

export default function SimpleWatchlistTest() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  console.log('SimpleWatchlistTest component rendering...');

  useEffect(() => {
    console.log('SimpleWatchlistTest useEffect running...');
    async function fetchData() {
      try {
        const token = localStorage.getItem('clocked_admin_token');
        console.log('Token found:', !!token);
        
        const response = await fetch('/api/watchlists/admin', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData?.message || 'Request failed');
        }
        
        const result = await response.json();
        console.log('API Response:', result);
        setData(result);
      } catch (error) {
        console.error('API Error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading watchlist data...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>👁️ Simple Watchlist Test</h2>
      
      {data ? (
        <div>
          <h3>API Response:</h3>
          <p>Watchlists found: {data.watchlists?.length || 0}</p>
          
          {data.watchlists?.map((watchlist, index) => (
            <div key={watchlist._id} style={{ 
              border: '1px solid #ddd', 
              padding: '10px', 
              margin: '10px 0',
              borderRadius: '5px' 
            }}>
              <h4>Watchlist #{index + 1}</h4>
              <p><strong>User ID:</strong> {watchlist.user_id}</p>
              <p><strong>Handle ID:</strong> {watchlist.handle_id}</p>
              <p><strong>Source:</strong> {watchlist.source}</p>
              <p><strong>Active:</strong> {watchlist.active ? 'Yes' : 'No'}</p>
              <p><strong>Muted:</strong> {watchlist.muted ? 'Yes' : 'No'}</p>
              <p><strong>Notifications:</strong> 
                Flag: {watchlist.notify_new_flag ? '✅' : '❌'}, 
                Reply: {watchlist.notify_reply ? '✅' : '❌'}, 
                Report: {watchlist.notify_report ? '✅' : '❌'}
              </p>
              <p><strong>Created:</strong> {new Date(watchlist.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No data received</p>
      )}
    </div>
  );
}
