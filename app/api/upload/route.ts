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

    // ==============================
    // EXCEL / CSV
    // ==============================
    else if (
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls") ||
      fileName.endsWith(".csv")
    ) {
      const XLSX = require("xlsx");
      const workbook = XLSX.read(buffer, { type: "buffer" });

      let allText = "";

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        allText += `Sheet: ${sheetName}\n`;

        for (const row of rows) {
          const cleaned = row.filter(
            (cell) => cell !== null && cell !== undefined && cell !== ""
          );
          if (cleaned.length > 0) {
            allText += cleaned.join(" | ") + "\n";
          }
        }

        allText += "\n";
      }

      text = allText;
    }

    // ==============================
    // UNSUPPORTED
    // ==============================
    else {
      return Response.json({ error: "Unsupported file type" }, { status: 400 });
    }

    if (!text || text.trim().length === 0) {
      return Response.json(
        { error: "Could not extract text from file" },
        { status: 400 }
      );
    }

    return Response.json({ text });

  } catch (e: any) {
    console.error("UPLOAD ERROR:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}