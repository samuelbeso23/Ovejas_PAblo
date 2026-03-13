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
 * Filtra cadenas numéricas largas del texto OCR (posibles números de crotal)
 * Formato esperado: ES012345678901 (letras + números, longitud ~14)
 */
export function extractEarTagCandidates(text: string): string[] {
  const candidates: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Buscar patrones como ES + números
    const esPattern = /ES\s*\d{10,14}/gi;
    const esMatches = line.match(esPattern);
    if (esMatches) {
      candidates.push(...esMatches.map((m) => m.replace(/\s/g, "")));
    }

    // Buscar secuencias numéricas largas (10+ dígitos)
    const longNumbers = line.match(/\d{10,14}/g);
    if (longNumbers) {
      candidates.push(...longNumbers);
    }

    // Si la línea completa parece un crotal (solo letras/números, longitud 12-16)
    const cleaned = line.replace(/[\s\-\.]/g, "");
    if (/^[A-Za-z0-9]{12,16}$/.test(cleaned)) {
      candidates.push(cleaned);
    }
  }

  // Eliminar duplicados y ordenar por longitud (preferir más largos)
  return Array.from(new Set(candidates)).sort((a, b) => b.length - a.length);
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
