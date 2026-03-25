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
You are an AI classifier.

Classify this:

"${input}"

Rules:
- Question → "question"
- Action request → "action"

Return ONLY JSON:
{
  "type": "question" | "action"
}
`;

  const res = await askAI([{ role: "user", content: prompt }]);

  console.log("RAW INTENT:", res);

  const parsed = safeJSON(res);

  if (!parsed || !parsed.type) {
    return { type: "question" }; // fallback
  }

  return parsed;
}

// ==============================
// ⚡ ACTION EXTRACTION
// ==============================
export async function extractAction(input: string) {
  const prompt = `
You are an AI agent.

Extract structured data from this:

"${input}"

Rules:
- Email → action = "email"
- Meeting → action = "calendar"
- ALWAYS return valid JSON
- NO explanation

Return ONLY JSON:
{
  "action": "email" | "calendar",
  "to": "email if present",
  "subject": "short subject",
  "message": "email content",
  "date": "YYYY-MM-DD or 'tomorrow'",
  "time": "HH:MM (24-hour format)"
}
`;

  const res = await askAI([{ role: "user", content: prompt }]);

  console.log("RAW ACTION:", res);

  const parsed = safeJSON(res);

  if (!parsed || !parsed.action) {
    throw new Error("Invalid action JSON");
  }

  return parsed;
}

// ==============================
// 📅 DATE PARSER
// ==============================
export function parseDate(dateStr: string) {
  if (!dateStr) return "";

  if (dateStr.toLowerCase() === "tomorrow") {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }

  return dateStr;
}

// ==============================
// ⏰ TIME PARSER
// ==============================
export function parseTime(timeStr: string) {
  if (!timeStr) return "10:00";

  const t = timeStr.toLowerCase().trim();

  // "12" → "12:00"
  if (/^\d{1,2}$/.test(t)) {
    return `${t.padStart(2, "0")}:00`;
  }

  // "5pm"
  if (t.includes("pm")) {
    const hour = parseInt(t);
    return `${(hour % 12) + 12}:00`;
  }

  // "5am"
  if (t.includes("am")) {
    const hour = parseInt(t);
    return `${hour.toString().padStart(2, "0")}:00`;
  }

  // already valid "HH:MM"
  if (/^\d{2}:\d{2}$/.test(t)) {
    return t;
  }

  return "10:00"; // fallback
}