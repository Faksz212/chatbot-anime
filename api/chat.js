// Vercel Serverless Function – Node.js 18+
// Pastikan set ENV: GEMINI_API_KEY pada Project Settings Vercel

export default async function handler(req, res) {
  // CORS (boleh dihapus jika domain sama – tapi ini aman)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
  }

  try {
    const { messages = [], system = "" } = req.body || {};

    // Map ke format Gemini: contents[]
    // role: "user" | "model"
    const contents = [];
    if (system) {
      contents.push({
        role: "user",
        parts: [{ text: `SYSTEM:\n${system}` }]
      });
    }
    for (const m of messages) {
      contents.push({
        role: m.role === "model" ? "model" : "user",
        parts: [{ text: m.content }]
      });
    }

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents })
    });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(r.status).json({ error: "Gemini error", details: txt });
    }

    const data = await r.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ||
      "Maaf, aku nggak yakin jawabannya.";

    return res.status(200).json({ reply });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error", details: String(e) });
  }
    }

  
      
