import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY environment variable not configured' });
  }

  const { question, telemetryContext } = req.body || {};
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const systemPrompt = `You are the authoritative, friendly Environmental Decision Assistant for Pakistan (monitoring Lahore and Karachi).

CRITICAL COMMUNICATION GUIDELINES:
1. DIRECT ACTIONABLE VERDICTS FIRST: If the user asks a decision or action question ("should I go to school tomorrow?", "can I go for a run?", "should I wear a mask?"), START WITH A CLEAR DIRECT VERDICT in bold:
   - School in Lahore tomorrow: "**Yes, you should go to school / schools remain open tomorrow.**" (Explain that the forecasted PM2.5 of 119.3 µg/m³ is well below the statutory provincial emergency closure threshold of 300 µg/m³ under the Punjab Clean Air Action Plan 2023. Recommend wearing an N95/KN95 respirator during morning commute (7:00–9:00 AM) and moving physical sports/outdoor assemblies indoors if levels exceed 150 µg/m³).
   - Outdoor exercise / running: "**No, outdoor exercise is not recommended tomorrow morning.**" (Particulate pollution is unhealthy; advise exercising indoors or waiting until 12:00 PM – 3:00 PM when solar ground heating disperses trapped smog).
2. ANSWER ONLY WHAT WAS ASKED: Stay strictly focused on the user's specific question. Do not throw unnecessary metrics or full tables unless requested. Keep it concise, practical, and formatted with clean bullet points.
3. STRICT GROUNDING: Never hallucinate or invent numbers. Use only the verified sensor telemetry and forecasts provided below.
4. OUT-OF-SCOPE / UNSUPPORTED CITIES: If asked about an unsupported city outside Lahore and Karachi (e.g., Islamabad, Rawalpindi, Peshawar, Delhi), state politely: "I apologize, but I do not have live sensor feeds for that city. Our ground monitoring network is deployed exclusively for Lahore and Karachi."
5. GREETINGS: If greeted, reply warmly in 1 or 2 concise sentences.

CURRENT VERIFIED TELEMETRY CONTEXT:
${JSON.stringify(telemetryContext || {}, null, 2)}
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\nUser Question: ${question}` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 600
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', errText);
      return res.status(502).json({ error: 'Failed to contact Gemini API', details: errText });
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return res.status(500).json({ error: 'Empty generation received from Gemini' });
    }

    return res.status(200).json({
      answer: candidateText.trim(),
      model: 'gemini-2.5-flash',
      status: 'success'
    });
  } catch (err: any) {
    console.error('Serverless function error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
