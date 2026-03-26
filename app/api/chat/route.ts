import { askAI, detectIntent, extractAction } from "@/lib/ai";
import { sendEmail } from "@/app/api/actions/gmail";
import { createEvent } from "@/app/api/actions/calendar";

// ==============================
// ✂️ CHUNK TEXT
// ==============================
function chunkText(text: string, size = 2000) {
  if (!text) return [];

  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

// ==============================
// 🧠 MAIN API
// ==============================
export async function POST(req: Request) {
  try {
    const { message, notes } = await req.json();

    if (!message) {
      return Response.json({ error: "No message" }, { status: 400 });
    }

    const intent = await detectIntent(message);

    // ==============================
    // 🟢 QUESTION FLOW
    // ==============================
    if (intent.type === "question") {
      const chunks = chunkText(notes);

      // 🔥 improved context size
      const context = chunks.slice(0, 8).join("\n");

      const prompt = `
You are an AI assistant.

Answer ONLY using the provided context.
If answer is not in context, say "I don't know".

Context:
${context}

Question:
${message}
`;

      const answer = await askAI([
        { role: "user", content: prompt },
      ]);

      return Response.json({ answer });
    }

    // ==============================
    // 🔵 ACTION FLOW
    // ==============================
    if (intent.type === "action") {
      const actions = await extractAction(message);

      let results: string[] = [];
      let meetLink = "";

      for (const action of actions) {
        if (action.type === "calendar") {
          const link = await createEvent(action);
          meetLink = link;
          results.push("Meeting created ✅");
        }

        if (action.type === "email") {
          if (!action.to) {
            results.push("Email failed ❌");
            continue;
          }

          let msg = action.message || "Hello";

          if (meetLink) {
            msg += `\n\nJoin meeting: ${meetLink}`;
          }

          await sendEmail(
            action.to,
            action.subject || "AI Message",
            msg
          );

          results.push("Email sent ✅");
        }
      }

      return Response.json({
        result: results.join(" + "),
        meetLink,
      });
    }

    return Response.json({
      answer: "I couldn't understand that.",
    });

  } catch (e: any) {
    console.error("CHAT ERROR:", e);
    return Response.json(
      { error: e.message },
      { status: 500 }
    );
  }
}