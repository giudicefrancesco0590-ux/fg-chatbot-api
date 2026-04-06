import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

export const runtime = 'nodejs'

const schema = z.object({
  message: z.string().max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(30).default([]),
  leadData: z.object({
    name: z.string().optional(),
    company: z.string().optional(),
    industry: z.string().optional(),
    challenge: z.string().optional(),
  }).optional(),
})

const SYSTEM_PROMPT = `Du bist der KI-Assistent von FG AI Agentur — einer spezialisierten Digitalagentur, die KI-Lösungen für kleine und mittlere Unternehmen entwickelt.

ÜBER FG AI AGENTUR:
- Gründer: Francesco Giudice
- Spezialisierung: KI-Chatbots, Voice Agents, Website-Erstellung, Lead-Generierung
- Zielkunden: Gastronomie, Handwerksbetriebe, Dienstleister, Coaches, Immobilienmakler
- Kontakt: info@master-closing.de | Tel: 0175 1538745
- Kostenloses Erstgespräch: https://calendly.com/giudicefrancesco0590/30min

LEISTUNGEN:
1. KI-Chatbot — Individuell kalkuliert
   - 24/7 automatische Antworten auf Ihrer Website
   - Auf Ihr Unternehmen trainiert (Speisekarte, FAQs, Services)
   - Lead-Erfassung & Weiterleitung
   - Reservierungen & Terminbuchungen

2. Voice Agent + Website — Beliebteste Wahl
   - Moderne, mobil-optimierte Website
   - KI-Voice-Agent am Telefon 24/7
   - Nimmt Anrufe entgegen, beantwortet Fragen, trägt Reservierungen ein
   - Ideal für Gastronomie & Handwerker

3. Komplett-System
   - Website + Chatbot + Voice Agent + Lead-Generierung
   - Vollständig automatisiert & vernetzt
   - Kalender-Integration
   - Persönliche Betreuung

4. KI Lead-Generierung
   - KI spricht Besucher aktiv an, sammelt Kontaktdaten
   - Übergibt warme Leads direkt

5. Website-Erstellung
   - Professionelle, blitzschnelle, mobil-optimierte Websites

ALLEINSTELLUNGSMERKMALE:
- Alles aus einer Hand — Entwicklung, Training, Einbindung, Support
- Schnelle Umsetzung (1-2 Wochen für einfache Projekte)
- Individuelle Lösungen, keine Baukastensysteme
- 24/7 verfügbar nach Einrichtung — kein Personal nötig

LEAD-QUALIFIZIERUNG — deine wichtigste Aufgabe:
Sammle im Gesprächsverlauf natürlich:
1. Name des Gesprächspartners
2. Branche / Art des Unternehmens
3. Größte Herausforderung (Anfragen, Telefon, Website, etc.)
4. Zeitrahmen (wann soll gestartet werden?)

Wenn du Name + Branche + Herausforderung kennst → empfiehl das passende Paket und lade zum kostenlosen Erstgespräch ein.

REGELN:
- Antworte IMMER auf Deutsch
- Kurz & direkt (2-4 Sätze), außer bei komplexen Fragen
- Max. 1 Qualifizierungsfrage pro Antwort
- Bei Preisfragen: individuell kalkuliert → kostenloses Erstgespräch empfehlen
- Bei Buchungswunsch: Calendly-Link direkt nennen
- Kein Verkäufer-Ton — helfen zuerst, qualifizieren dabei`

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })
    }

    const { message, history, leadData } = parsed.data
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    let system = SYSTEM_PROMPT
    if (leadData && Object.keys(leadData).some(k => (leadData as Record<string, string | undefined>)[k])) {
      const known = Object.entries(leadData)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
      system += `\n\nBEREITS BEKANNTE LEAD-DATEN: ${known} — diese nicht nochmal fragen.`
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system,
      messages: [...history, { role: 'user', content: message }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ text })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Chat error:', msg)
    return NextResponse.json({ error: 'Interner Fehler', detail: msg }, { status: 500 })
  }
}
