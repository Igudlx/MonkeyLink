'use client';
import { useState } from 'react';

export default function Home() {
  const [projectId, setProjectId] = useState('myproject');
  const [apiKey, setApiKey] = useState('');
  const [eventName, setEventName] = useState('Rain');
  const [eventTime, setEventTime] = useState('10');
  const [text, setText] = useState('Hello players!');
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
    const data = await res.json();
    setStatus(JSON.stringify(data, null, 2));
  }

  return (
    <main style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1>MonkeyLink Dashboard</h1>
      <p>Use the same Project ID and API Key in Unity.</p>

      <label>Project ID</label><br />
      <input value={projectId} onChange={e => setProjectId(e.target.value)} style={{ width: '100%', marginBottom: 12 }} /><br />

      <label>API Key</label><br />
      <input value={apiKey} onChange={e => setApiKey(e.target.value)} style={{ width: '100%', marginBottom: 24 }} /><br />

      <h2>Trigger Event</h2>
      <input placeholder="Event Name" value={eventName} onChange={e => setEventName(e.target.value)} style={{ width: '100%', marginBottom: 12 }} />
      <input placeholder="Duration (seconds)" value={eventTime} onChange={e => setEventTime(e.target.value)} style={{ width: '100%', marginBottom: 12 }} />
      <button onClick={() => send('set/event', { name: eventName, time: eventTime })}>
        Send Event
      </button>

      <h2 style={{ marginTop: 32 }}>Global Text</h2>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={4} style={{ width: '100%', marginBottom: 12 }} />
      <button onClick={() => send('set/text', { text })}>
        Send Text
      </button>

      <pre style={{
        background: '#1a1a1a',
        padding: '1rem',
        borderRadius: 8,
        marginTop: 24,
        whiteSpace: 'pre-wrap'
      }}>{status}</pre>
    </main>
  );
}
