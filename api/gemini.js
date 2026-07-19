export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel.' });
  }

  const { prompt, contents, generationConfig } = req.body;
  
  let body;
  if (contents) {
    // If client sends the full contents structure, use it directly (e.g. for vision requests)
    body = {
      contents,
      generationConfig: generationConfig || { temperature: 0.2 }
    };
  } else if (prompt) {
    // Fallback for simple text prompts
    body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: generationConfig || { temperature: 0.2, responseMimeType: "application/json" }
    };
  } else {
    return res.status(400).json({ error: 'Either prompt or contents is required' });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'Gemini API Error', details: errText });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
