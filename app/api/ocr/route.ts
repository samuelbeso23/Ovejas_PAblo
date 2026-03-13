import { NextRequest, NextResponse } from "next/server";

const OCR_SPACE_KEY = process.env.OCR_SPACE_API_KEY;

export async function POST(req: NextRequest) {
  if (!OCR_SPACE_KEY) {
    return NextResponse.json({ error: "OCR_SPACE_API_KEY no configurada" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const base64 = body.image as string;
    if (!base64) {
      return NextResponse.json({ error: "Falta imagen en base64" }, { status: 400 });
    }

    const formData = new URLSearchParams();
    formData.append("base64Image", base64.replace(/^data:image\/\w+;base64,/, ""));
    formData.append("apikey", OCR_SPACE_KEY);
    formData.append("language", "eng");
    formData.append("OCREngine", "2"); // Mejor para números y texto en fondos complejos
    formData.append("scale", "true");
    formData.append("detectOrientation", "true");

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const data = await res.json();
    if (data.ParsedResults?.[0]?.ParsedText) {
      return NextResponse.json({ text: data.ParsedResults[0].ParsedText });
    }
    return NextResponse.json({ text: "" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error en OCR" }, { status: 500 });
  }
}
