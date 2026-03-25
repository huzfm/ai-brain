import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// ==============================
// 🧠 MAIN AI CALL
// ==============================
export async function askAI(messages: any[]) {
  const res = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages,
  });

  return res.choices[0].message.content || "";
}

// ==============================
// 🛡️ SAFE JSON PARSER
// ==============================
function safeJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ==============================
// 🎯 INTENT DETECTION
// ==============================
export async function detectIntent(input: string) {
  const prompt = `
Classify this input:

"${input}"

Rules:
- If asking something → "question"
- If asking to perform task → "action"

Return ONLY JSON:
{
  "type": "question" | "action"
}
`;

  const res = await askAI([{ role: "user", content: prompt }]);

  const parsed = safeJSON(res);

  if (!parsed || !parsed.type) {
    return { type: "question" };
  }

  return parsed;
}

// ==============================
// ⚡ MULTI-ACTION EXTRACTION
// ==============================
export async function extractAction(input: string) {
  const today = new Date().toISOString().split("T")[0];

  const prompt = `
You are an AI agent.

Today's date is ${today}.

Convert this into structured actions:

"${input}"

Rules:
- You can return MULTIPLE actions
- Supported:
  - email
  - calendar
- Convert date → YYYY-MM-DD
- Convert time → HH:MM (24-hour)
- NO explanation

Return ONLY JSON:

{
  "actions": [
    {
      "type": "email",
      "to": "",
      "subject": "",
      "message": ""
    },
    {
      "type": "calendar",
      "title": "",
      "date": "",
      "time": ""
    }
  ]
}
`;

  const res = await askAI([{ role: "user", content: prompt }]);

  console.log("RAW ACTION:", res);

  const parsed = safeJSON(res);

  if (!parsed || !parsed.actions) {
    throw new Error("Invalid actions JSON");
  }

  return parsed.actions;
}