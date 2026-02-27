module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const body = await readBody(req);
    const imageBase64 = body?.imageBase64;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ error: "imageBase64 ausente" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY não configurada na Vercel" });
    }

    const prompt =
      "Você ajuda a catalogar Funko Pops.\n" +
      "Pela foto enviada, tente identificar:\n" +
      "- nome (ex: Ayrton Senna)\n" +
      "- numero (ex: 322)\n" +
      "- franquia (ex: Formula 1 / Motorsport / Icons) se conseguir\n\n" +
      "Responda SOMENTE em JSON no formato:\n" +
      '{"nome":"...","numero":"...","franquia":"...","confianca":0-100}\n' +
      "Se não souber algum campo, use null.";

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: `data:image/jpeg;base64,${imageBase64}` },
            ],
          },
        ],
      }),
    });

    const raw = await r.text();

    if (!r.ok) {
      return res.status(502).json({
        error: "Falha OpenAI",
        status: r.status,
        detail: raw?.slice(0, 1500),
      });
    }

    let outText = "";
    try {
      const data = JSON.parse(raw);
      outText = (data.output_text || "").trim();
    } catch {
      outText = "";
    }

    const safeEmpty = { nome: null, numero: null, franquia: null, confianca: 0 };

    if (!outText) return res.status(200).json(safeEmpty);

    // Tenta parse direto
    let parsed = null;
    try {
      parsed = JSON.parse(outText);
    } catch {
      // Se vier com texto junto, tenta “pescar” o primeiro JSON válido
      const extracted = extractFirstJsonObject(outText);
      if (extracted) {
        try {
          parsed = JSON.parse(extracted);
        } catch {
          parsed = null;
        }
      }
    }

    if (!parsed || typeof parsed !== "object") {
      return res.status(200).json({ ...safeEmpty, raw: outText });
    }

    // Normaliza campos
    return res.status(200).json({
      nome: parsed.nome ?? null,
      numero: parsed.numero ?? null,
      franquia: parsed.franquia ?? null,
      confianca: typeof parsed.confianca === "number" ? parsed.confianca : 0,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: "Falha geral",
      detail: String(e?.message || e),
    });
  }
};

// Lê body cru (funciona em Vercel functions)
async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// Extrai algo entre o primeiro "{" e o último "}" como tentativa de JSON
function extractFirstJsonObject(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}