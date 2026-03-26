export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();

    let text = "";

    // ==============================
    // PDF
    // ==============================
    if (fileName.endsWith(".pdf")) {
      const pdfParse = require("@cyber2024/pdf-parse-fixed");
      const data = await pdfParse(buffer);
      text = data.text;
    }

    // ==============================
    // WORD
    // ==============================
    else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    }

    // ==============================
    // TXT
    // ==============================
    else if (fileName.endsWith(".txt")) {
      text = buffer.toString("utf-8");
    }

    else {
      return Response.json({ error: "Unsupported file type" }, { status: 400 });
    }

    if (!text || text.trim().length === 0) {
      return Response.json({ error: "Could not extract text from file" }, { status: 400 });
    }

    return Response.json({ text });

  } catch (e: any) {
    console.error("UPLOAD ERROR:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}