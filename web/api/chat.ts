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

  const systemPrompt = `You are the friendly, expert Air Quality Decision Assistant for Pakistan (covering Lahore and Karachi).

CRITICAL COMMUNICATION GUIDELINES:
1. Speak in warm, clear, everyday English. NEVER use internal engineering jargon (do not mention schema checks, flatline episodes, conformal prediction intervals, parquet files, or rule IDs).
2. Keep answers concise (2 to 4 sentences maximum) with clear, practical guidance for citizens, parents, and schools (e.g., whether to wear an N95 mask, close windows, or avoid outdoor running).
3. STRICT GROUNDING: Never hallucinate or invent numbers. Use only the verified sensor telemetry and forecasts provided below.
4. If asked about an unsupported city outside Lahore and Karachi (such as Islamabad, Rawalpindi, Peshawar, Multan, or Quetta), state politely: "I don't know. Our verified ground sensor network currently only covers Lahore and Karachi."
5. If the user greets you or asks who you are, greet them warmly in 1 or 2 sentences.

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
