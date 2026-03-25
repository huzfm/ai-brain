import pdf from "pdf-parse";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  const buffer = Buffer.from(await file.arrayBuffer());
  const data = await pdf(buffer);

  return Response.json({ text: data.text });
}