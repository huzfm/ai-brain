import { askAI, detectIntent, extractAction } from "@/lib/ai";
import { sendEmail } from "../actions/gmail";
import { createEvent } from "../actions/calendar";

export async function POST(req: Request) {
  try {
    const { message, notes } = await req.json();

    const intent = await detectIntent(message);

    // 🟢 QUESTION FLOW
    if (intent.type === "question") {
      const prompt = `
Answer ONLY using these notes:

${notes}

If not found, say "I don't know".

Question:
${message}
`;

      const answer = await askAI([
        { role: "user", content: prompt },
      ]);

      return Response.json({ answer });
    }

    // 🔵 MULTI-ACTION FLOW
    if (intent.type === "action") {
      const actions = await extractAction(message);

      let results: string[] = [];
      let meetLink = "";

      for (const action of actions) {
        // 📅 Calendar
        if (action.type === "calendar") {
          const link = await createEvent(action);
          meetLink = link;
          results.push("Meeting created ✅");
        }

        // ✉️ Email
        if (action.type === "email") {
          let msg = action.message || "Hello";

          // attach meet link if exists
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

    return Response.json({ answer: "I couldn't understand that." });

  } catch (e: any) {
    console.error("API ERROR:", e);

    return Response.json(
      { error: e.message || "Server crashed" },
      { status: 500 }
    );
  }
}