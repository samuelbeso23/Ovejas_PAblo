import { createWorker, PSM } from "tesseract.js";

type ImageSource = string | File | Blob;

/**
 * Rota imagen 180° (para crotales que salen invertidos)
 */
async function rotateImage180(dataUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.translate(canvas.width, canvas.height);
      ctx.rotate(Math.PI);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

/**
 * Genera variantes de imagen para OCR (cada una puede funcionar mejor según la foto)
 */
async function preprocessVariants(blob: Blob): Promise<string[]> {
  const results: string[] = [];
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = 3; // 3x para texto más grande
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      // 1. Original escalada (sin tocar)
      results.push(canvas.toDataURL("image/png"));

      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      // 2. Binarización suave (umbral 130 - más texto negro)
      for (let i = 0; i < data.length; i += 4) {
        const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const v = g < 130 ? 0 : 255;
        data[i] = data[i + 1] = data[i + 2] = v;
      }
      ctx.putImageData(imageData, 0, 0);
      results.push(canvas.toDataURL("image/png"));

      resolve(results);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Error al cargar imagen"));
    };
    img.src = url;
  });
}

/**
 * OCR para crotales: múltiples pasadas y variantes para máxima detección
 */
export async function recognizeEarTagText(imageSource: ImageSource): Promise<string> {
  let variants: string[] = [];

  if (typeof imageSource === "string") {
    variants = [imageSource];
  } else {
    variants = await preprocessVariants(imageSource as Blob);
  }

  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text") {
        console.log(`OCR: ${Math.round(m.progress * 100)}%`);
      }
    },
  });

  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
    let bestText = "";
    let bestCands: string[] = [];

    for (const img of variants) {
      // Pasada 1: rotación automática
      const { data: d1 } = await worker.recognize(img, { rotateAuto: true });
      const c1 = extractEarTagCandidates(d1.text);
      if (c1.length > bestCands.length) {
        bestCands = c1;
        bestText = d1.text;
      }
      // Pasada 2: girado 180° (crotales a menudo invertidos)
      const rotated = await rotateImage180(img);
      if (rotated) {
        const { data: d2 } = await worker.recognize(rotated, { rotateAuto: false });
        const c2 = extractEarTagCandidates(d2.text);
        if (c2.length > bestCands.length) {
          bestCands = c2;
          bestText = d2.text;
        }
      }
    }

    // Si nada, probar con whitelist (último recurso)
    if (bestCands.length === 0 && variants[0]) {
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789ES",
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      });
      const { data: d } = await worker.recognize(variants[0], { rotateAuto: true });
      const c = extractEarTagCandidates(d.text);
      if (c.length > 0) return d.text;
    }

    return bestText;
  } finally {
    await worker.terminate();
  }
}

/**
 * Formato crotal: ES + 2 (CCAA) + 5 (granja) + 5 (animal) = 12 dígitos
 * Extracción muy permisiva para capturar lo que el OCR lea
 */
export function extractEarTagCandidates(text: string): string[] {
  const candidates: string[] = [];
  const clean = (s: string) => s.replace(/[\s\-\.]/g, "").toUpperCase();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Normalizar E5/ES/3S etc. que el OCR puede confundir
  const norm = text.replace(/\bE5\b/gi, "ES").replace(/\b3S\b/gi, "ES");

  // 1. ES + 12 dígitos (con espacios)
  const es12 = /E[S5]\s*(\d{2})\s*(\d{5})\s*(\d{5})/gi;
  let m;
  while ((m = es12.exec(norm)) !== null) {
    candidates.push(`ES${m[1]}${m[2]}${m[3]}`);
  }

  // 2. ES + 12 dígitos seguidos
  const es12flat = /E[S5]\s*(\d{12})/gi;
  while ((m = es12flat.exec(norm)) !== null) {
    candidates.push(`ES${m[1]}`);
  }

  // 3. Solo 12 dígitos en el texto (2+5+5) - añadir ES
  const block = /(\d{2})\s*(\d{5})\s*(\d{5})/g;
  while ((m = block.exec(text)) !== null) {
    candidates.push(`ES${m[1]}${m[2]}${m[3]}`);
  }

  // 4. Todos los dígitos en orden (si hay 12+)
  const allDigits = text.replace(/\D/g, "");
  if (allDigits.length >= 12) {
    candidates.push(`ES${allDigits.slice(0, 12)}`);
  }

  // 5. Por líneas: línea 1 = ES+2, líneas 2-3 = 5+5
  if (lines.length >= 3) {
    const l1 = clean(lines[0]);
    const l2 = (lines[1].match(/\d+/g) ?? []).join("");
    const l3 = (lines[2].match(/\d+/g) ?? []).join("");
    if ((l1.startsWith("ES") || l1.startsWith("E5")) && l2.length >= 5 && l3.length >= 5) {
      const n2 = l2.slice(0, 5);
      const n3 = l3.slice(0, 5);
      const n1 = l1.replace(/\D/g, "").slice(0, 2);
      if (n1.length === 2) candidates.push(`ES${n1}${n2}${n3}`);
    }
  }

  // Filtrar: solo ES + 12 dígitos (o 10-14 como fallback)
  let valid = Array.from(new Set(candidates))
    .map((c) => clean(c))
    .filter((c) => /^ES\d{12}$/.test(c));

  if (valid.length === 0) {
    valid = Array.from(new Set(candidates))
      .map((c) => clean(c))
      .filter((c) => /^ES\d{10,14}$/.test(c));
  }

  return valid;
}

/**
 * Intenta OCR.space API (más preciso para crotales) - requiere OCR_SPACE_API_KEY
 */
async function recognizeViaOCRSpace(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      })
        .then((r) => r.json())
        .then((data) => resolve(data.text ?? null))
        .catch(() => resolve(null));
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

/**
 * Procesa imagen y devuelve candidatos a número de crotal
 * Usa OCR.space si está configurado, si no Tesseract
 */
export async function extractEarTagFromImage(
  imageSource: ImageSource
): Promise<{ text: string; candidates: string[] }> {
  let text = "";

  if (typeof imageSource !== "string" && imageSource instanceof Blob) {
    const apiText = await recognizeViaOCRSpace(imageSource);
    if (apiText) {
      text = apiText;
      const cands = extractEarTagCandidates(text);
      if (cands.length > 0) return { text, candidates: cands };
    }
  }

  text = await recognizeEarTagText(imageSource);
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
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("spa+eng", 1);
  const { data } = await worker.recognize(imageSource);
  await worker.terminate();
  const text = data.text;
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
