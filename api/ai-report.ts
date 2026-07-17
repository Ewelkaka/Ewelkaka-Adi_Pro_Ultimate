export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authToken =
    process.env.AI_GATEWAY_API_KEY ||
    process.env.VERCEL_OIDC_TOKEN ||
    req.headers['x-vercel-oidc-token'];

  if (!authToken) {
    return res.status(503).json({ error: 'AI Gateway is not configured for this deployment.' });
  }

  try {
    const body = req.body || {};
    const fleetSize = body.fleetSize || '450 hulajnóg 36–48V Li-ion';
    const city = body.city || 'Warszawa / Kraków';
    const challenge = body.challenge || 'wysokie koszty serwisu, spadek SoH i nieplanowane awarie baterii';

    const models = ['openai/gpt-5.4', 'anthropic/claude-sonnet-4.6', 'xai/grok-4.3'];
    let lastError = 'AI Gateway request failed.';

    for (const model of models) {
      const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                'Jesteś asystentem sprzedażowym ADI PRO Ultimate 2026. Pisz krótko, konkretnie, po polsku. Nie udawaj prawdziwych wyników klienta; oznacz dane jako scenariusz modelowy.',
            },
            {
              role: 'user',
              content: `Wygeneruj krótki raport pilotażu dla floty mikro mobilności. Flota: ${fleetSize}. Region: ${city}. Wyzwanie: ${challenge}. Zwróć 4 sekcje: diagnoza, ryzyka, rekomendacje, następny krok.`,
            },
          ],
          stream: false,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const report = result?.choices?.[0]?.message?.content || 'Brak treści raportu.';
        return res.status(200).json({ report, model });
      }

      lastError = result?.error?.message || `AI Gateway request failed for ${model}.`;
    }

    return res.status(502).json({ error: lastError });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Unexpected AI report error.' });
  }
}
