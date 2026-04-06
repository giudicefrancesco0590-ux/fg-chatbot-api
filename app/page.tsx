export default function Home() {
  return (
    <div style={{ padding: 40, fontFamily: 'system-ui', color: '#fff', background: '#0a0a0a', minHeight: '100vh' }}>
      <h1>FG AI Chatbot API</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Backend läuft ✓</p>
      <ul style={{ marginTop: 24, color: 'rgba(255,255,255,0.4)', lineHeight: 2 }}>
        <li>POST /api/chat — Chat-Endpoint</li>
        <li>POST /api/speak — ElevenLabs TTS</li>
      </ul>
    </div>
  )
}
