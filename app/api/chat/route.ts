import { askAI, detectIntent, extractAction } from "@/lib/ai";
import { sendEmail } from "../actions/gmail";
import { createEvent } from "../actions/calendar";

export async function POST(req: Request) {
  try {
    const { message, notes } = await req.json();

    console.log("Incoming:", message);

    const intent = await detectIntent(message);

    console.log("Intent:", intent);

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

    // 🔵 ACTION FLOW
    if (intent.type === "action") {
      const action = await extractAction(message);

      console.log("Action:", action);

      if (action.action === "email") {
        await sendEmail(action.to, action.subject, action.message);
        return Response.json({ result: "Email sent ✅" });
      }

      if (action.action === "calendar") {
const link = await createEvent(action);
        return Response.json({
          result: "Meeting created ✅",
          meetLink: link,
        });
      }

      return Response.json({ result: "Unknown action" });
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