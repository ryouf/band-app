import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf");

    if (!file) {
      return NextResponse.json({ error: "لم يتم رفع ملف" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const PDFParser = (await import("pdf2json")).default;
    
    const text = await new Promise((resolve, reject) => {
      const parser = new PDFParser();
      parser.on("pdfParser_dataReady", (data) => {
        const text = data.Pages.map(page =>
          page.Texts.map(t => decodeURIComponent(t.R.map(r => r.T).join(""))).join(" ")
        ).join("\n");
        resolve(text);
      });
      parser.on("pdfParser_dataError", reject);
      parser.parseBuffer(buffer);
    });

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "لم يتم العثور على نص في الملف" }, { status: 400 });
    }

    return NextResponse.json({ text, pages: 0 });
  } catch (error) {
    console.error("PDF Error:", error.message);
    return NextResponse.json({ error: "خطأ في قراءة الملف" }, { status: 500 });
  }
}