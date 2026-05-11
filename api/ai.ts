import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server API key not configured' });
  }

  const { model, messages, max_tokens, temperature } = req.body;

  try {
    const upstream = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'deepseek-chat',
        messages,
        max_tokens: max_tokens || 400,
        temperature: temperature ?? 0.8,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      return res.status(upstream.status).json({ error: `Upstream error [${upstream.status}]: ${errText.slice(0, 200)}` });
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to fetch AI' });
  }
}
