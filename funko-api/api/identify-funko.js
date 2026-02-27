module.exports = async function handler(req, res) {
  // CORS básico
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const { imageBase64 } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 ausente" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res
        .status(500)
        .json({ error: "OPENAI_API_KEY não configurada na Vercel" });
    }

    const prompt =
      'Você ajuda a catalogar Funko Pops.\n' +
      'Pela foto enviada, tente identificar:\n' +
      '- nome (ex: Ayrton Senna)\n' +
      '- numero (ex: 322)\n' +
      '- franquia (ex: Formula 1 / Motorsport / Icons) se conseguir\n\n' +
      'Responda SOMENTE em JSON no formato:\n' +
      '{"nome":"...","numero":"...","franquia":"...","confianca":0-100}\n' +
      'Se não souber algum campo, use null.';

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              {
                type: "input_image",
                image_url: `data:image/jpeg;base64,${imageBase64}`,
              },
            ],
          },
        ],
      }),
    });

    const raw = await r.text();

    if (!r.ok) {
      return res.status(500).json({ error: "Falha OpenAI", detail: raw });
    }

    let outText = "";
    try {
      const data = JSON.parse(raw);
      outText = (data.output_text || "").trim();
    } catch (e) {
      outText = "";
    }

    if (!outText) {
      return res
        .status(200)
        .json({ nome: null, numero: null, franquia: null, confianca: 0 });
    }

    let parsed = { nome: null, numero: null, franquia: null, confianca: 0 };
    try {
      parsed = JSON.parse(outText);
    } catch (e) {
      parsed = {
        nome: null,
        numero: null,
        franquia: null,
        confianca: 0,
        raw: outText,
      };
    }

    return res.status(200).json(parsed);
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ error: "Falha geral", detail: String(e?.message || e) });
  }
};