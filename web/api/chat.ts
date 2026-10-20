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

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const systemPrompt = `You are the HackInsight Environmental Decision-Support AI Assistant for Pakistan Air Quality Initiative (PAQI) and provincial Environmental Protection Departments (EPD Punjab & Sindh).

CRITICAL GROUNDING RULES:
1. NEVER INVENT OR HALLUCINATE NUMBERS. All PM2.5 measurements, forecast values, and statistics MUST be taken directly from the verified telemetry context below.
2. If asked about an unsupported city (like Islamabad, Peshawar, Multan, Quetta), clearly state: "I don't know. [City] is not currently covered by our ground sensor network. Our verified forecasting is strictly deployed for Lahore and Karachi."
3. When giving health or regulatory advisories, cite the official benchmarks:
   - Pak-EPA NEQS 2010 (S.R.O. 1062(I)/2010): 24h limit is 35 ug/m3.
   - WHO 2021 Global Air Quality Guidelines: 24h limit is 15 ug/m3.
   - Punjab Smog Emergency Protocol (2023): School outdoor activity curbs and transport rationing trigger at 150 ug/m3.
4. If the user just says hello or asks how this works, greet them warmly and explain what you do.

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
      return res.status(500).json({ error: 'Gemini API Error', details: errText });
    }

    const data = await response.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to formulate response.";

    return res.status(200).json({
      answer,
      status: 'success',
      model: 'gemini-2.5-flash'
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
