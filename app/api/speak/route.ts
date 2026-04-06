import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const schema = z.object({ text: z.string().max(600) })

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const voiceId = process.env.ELEVENLABS_VOICE_ID
    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!voiceId || !apiKey) {
      return NextResponse.json({ error: 'TTS not configured' }, { status: 503 })
    }

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: parsed.data.text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    })

    if (!res.ok) return NextResponse.json({ error: 'TTS failed' }, { status: 502 })

    const audio = await res.arrayBuffer()
    return new NextResponse(audio, { headers: { 'Content-Type': 'audio/mpeg' } })
  } catch (err) {
    console.error('Speak error:', err)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
