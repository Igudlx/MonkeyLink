'use client';
import { useState } from 'react';

export default function Home() {
  const [projectId, setProjectId] = useState('myproject');
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('');

  async function send(path, body) {
    const res = await fetch(`/api/v1/${projectId}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
    setStatus(JSON.stringify(await res.json(), null, 2));
  }

  return (
    <main style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1>MonkeyLink Dashboard</h1>
      <input placeholder="Project ID" value={projectId} onChange={e => setProjectId(e.target.value)} style={{ width: '100%', marginBottom: 12 }} />
      <input placeholder="API Key" value={apiKey} onChange={e => setApiKey(e.target.value)} style={{ width: '100%', marginBottom: 24 }} />
      <button onClick={() => send('set/event', { name: 'Rain', time: '10' })}>Send Test Event</button>
      <button onClick={() => send('set/text', { text: 'Hello players!' })} style={{ marginLeft: 12 }}>Send Test Text</button>
      <pre style={{ background: '#1a1a1a', padding: '1rem', borderRadius: 8, marginTop: 24 }}>{status}</pre>
    </main>
  );
}
