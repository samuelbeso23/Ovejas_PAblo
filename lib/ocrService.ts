import Tesseract from "tesseract.js";

type ImageSource = string | File | Blob;

/**
 * Ejecuta OCR sobre una imagen y extrae texto
 */
export async function recognizeText(imageSource: ImageSource): Promise<string> {
  const result = await Tesseract.recognize(imageSource, "spa+eng", {
    logger: (m) => {
      if (m.status === "recognizing text") {
        console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
      }
    },
  });
  return result.data.text;
}

/**
 * Formato crotal español:
 * Línea 1: ES (país) + 2 dígitos (comunidad autónoma)
 * Línea 2: 5 dígitos (código granja)
 * Línea 3: 5 dígitos (número animal)
 * Total: ES + 12 dígitos (ej: ES121234512345)
 */
export function extractEarTagCandidates(text: string): string[] {
  const candidates: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // 1. Combinar líneas: el OCR puede leer cada línea por separado
  const allDigits = lines
    .flatMap((l) => l.match(/\d+/g) ?? [])
    .join("");
  const allText = lines.join(" ").replace(/\s/g, "");

  // 2. Patrón exacto: ES + 2 + 5 + 5 = 12 dígitos
  const fullPattern = /ES\s*\d{2}\s*\d{5}\s*\d{5}/gi;
  const fullMatches = text.match(fullPattern);
  if (fullMatches) {
    candidates.push(...fullMatches.map((m) => m.replace(/\s/g, "").toUpperCase()));
  }

  // 3. Si tenemos ES y 12 dígitos seguidos
  const es12Pattern = /ES\s*(\d{12})/gi;
  let m;
  while ((m = es12Pattern.exec(text)) !== null) {
    candidates.push(`ES${m[1]}`);
  }

  // 4. Reconstruir desde líneas: ES en primera, 2+5+5 en siguientes
  if (lines.length >= 2) {
    const first = lines[0].replace(/\s/g, "").toUpperCase();
    if (first.startsWith("ES") || first === "ES") {
      const nums = lines.slice(1).flatMap((l) => l.match(/\d+/g) ?? []).join("");
      if (nums.length >= 12) {
        candidates.push(`ES${nums.slice(0, 12)}`);
      }
    }
  }

  // 5. Solo dígitos en orden: 2+5+5 (si hay ES en el texto)
  if (text.toUpperCase().includes("ES") && allDigits.length >= 12) {
    candidates.push(`ES${allDigits.slice(0, 12)}`);
  }

  // 6. Cualquier ES + números (fallback)
  const esAny = /ES\s*\d{8,14}/gi;
  const esAnyMatches = text.match(esAny);
  if (esAnyMatches) {
    candidates.push(...esAnyMatches.map((x) => x.replace(/\s/g, "").toUpperCase()));
  }

  // 7. Secuencia 12 dígitos (2+5+5) sin ES
  if (/\d{2}\s*\d{5}\s*\d{5}/.test(text)) {
    const match = text.match(/(\d{2})\s*(\d{5})\s*(\d{5})/);
    if (match) candidates.push(`ES${match[1]}${match[2]}${match[3]}`);
  }

  // Filtrar: formato válido ES + 12 dígitos
  let valid = candidates
    .map((c) => c.replace(/\s/g, "").toUpperCase())
    .filter((c) => /^ES\d{12}$/.test(c));

  // Fallback: ES + 10-14 dígitos si no hay exactos
  if (valid.length === 0) {
    valid = candidates
      .map((c) => c.replace(/\s/g, "").toUpperCase())
      .filter((c) => /^ES\d{10,14}$/.test(c));
  }

  return Array.from(new Set(valid));
}

/**
 * Procesa imagen y devuelve candidatos a número de crotal
 */
export async function extractEarTagFromImage(
  imageSource: ImageSource
): Promise<{ text: string; candidates: string[] }> {
  const text = await recognizeText(imageSource);
  const candidates = extractEarTagCandidates(text);
  return { text, candidates };
}

/**
 * OCR para tickets - intenta extraer fecha, importe y comercio
 */
export interface ReceiptOCRResult {
  date: string | null;
  amount: number | null;
  merchant: string | null;
  rawText: string;
}

export async function extractReceiptData(
  imageSource: ImageSource
): Promise<ReceiptOCRResult> {
  const text = await recognizeText(imageSource);
  const result: ReceiptOCRResult = {
    date: null,
    amount: null,
    merchant: null,
    rawText: text,
  };

  // Buscar importes (formato: 12,34 € o 12.34 EUR)
  const amountPatterns = [
    /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))\s*€/,
    /€\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/,
    /total[:\s]*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/i,
    /(\d{1,3}[.,]\d{2})\s*(?:eur|euro)/i,
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amountStr = match[1].replace(/\./g, "").replace(",", ".");
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        result.amount = amount;
        break;
      }
    }
  }

  // Buscar fechas (DD/MM/YYYY, DD-MM-YYYY, etc.)
  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const dateStr = match[1];
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length === 3) {
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        const month = parts[1].padStart(2, "0");
        const day = parts[0].padStart(2, "0");
        result.date = `${year}-${month}-${day}`;
        break;
      }
    }
  }

  // Primera línea no vacía suele ser el comercio
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 0 && lines[0].length > 2 && lines[0].length < 80) {
    result.merchant = lines[0];
  }

  return result;
}
