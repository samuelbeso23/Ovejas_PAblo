"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CameraCapture } from "@/components/CameraCapture";
import { extractReceiptData } from "@/lib/ocrService";
import { supabase, isSupabaseConfigured, STORAGE_BUCKETS } from "@/lib/supabaseClient";
import { Loader2, ArrowLeft, Receipt, Edit3 } from "lucide-react";

type Mode = "choose" | "camera" | "ocr" | "manual" | "confirm";

export default function AddExpensePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);

  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  useEffect(() => {
    if (isSupabaseConfigured && (mode === "manual" || mode === "confirm")) {
      supabase
        .from("expense_categories")
        .select("id, name")
        .order("sort_order")
        .then(({ data }) => {
          setCategories(data ?? []);
          if (data?.length && !categoryId) setCategoryId(data[0].id);
        });
    }
  }, [mode, categoryId]);

  const handleCapture = async (blob: Blob) => {
    setImageBlob(blob);
    setMode("ocr");
    setLoading(true);
    try {
      const result = await extractReceiptData(blob);
      setAmount(result.amount?.toString() ?? "");
      setDate(result.date ?? new Date().toISOString().split("T")[0]);
      setDescription(result.merchant ?? "");
      setMode("confirm");
    } catch (err) {
      console.error(err);
      setMode("confirm");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!amount || !date || !categoryId) {
      alert("Completa categoría, importe y fecha.");
      return;
    }

    if (!isSupabaseConfigured) {
      alert("Configura Supabase en .env.local.");
      return;
    }

    setLoading(true);
    try {
      let receiptUrl: string | null = null;
      if (imageBlob) {
        const fileName = `receipt-${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.RECEIPT_PHOTOS)
          .upload(fileName, imageBlob, { contentType: "image/jpeg", upsert: true });
        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKETS.RECEIPT_PHOTOS)
            .getPublicUrl(uploadData.path);
          receiptUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from("expenses").insert({
        date,
        category_id: categoryId,
        amount: parseFloat(amount.replace(",", ".")),
        description: description.trim() || null,
        receipt_photo: receiptUrl,
        payment_method: paymentMethod.trim() || null,
      });

      if (error) throw error;
      router.push("/expenses");
    } catch (err: unknown) {
      console.error(err);
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Error al guardar";
      alert(`Error al guardar el gasto: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/expenses" className="p-2 -ml-2 rounded-lg hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Añadir gasto</h1>
      </div>

      {mode === "choose" && (
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => setMode("camera")}
            className="card flex flex-col items-center gap-3 py-8 active:bg-slate-50"
          >
            <Receipt className="w-12 h-12 text-primary-600" />
            <span className="font-semibold text-slate-800">Foto del ticket</span>
            <span className="text-sm text-slate-500">OCR detectará fecha e importe</span>
          </button>
          <button
            onClick={() => {
              setAmount("");
              setDate(new Date().toISOString().split("T")[0]);
              setDescription("");
              setMode("manual");
            }}
            className="card flex flex-col items-center gap-3 py-8 active:bg-slate-50"
          >
            <Edit3 className="w-12 h-12 text-primary-600" />
            <span className="font-semibold text-slate-800">Entrada manual</span>
            <span className="text-sm text-slate-500">Formulario simple</span>
          </button>
        </div>
      )}

      {mode === "camera" && (
        <div className="space-y-4">
          <CameraCapture onCapture={handleCapture} />
          <button onClick={() => setMode("choose")} className="btn-secondary">
            Cancelar
          </button>
        </div>
      )}

      {mode === "ocr" && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
          <p className="text-slate-600">Analizando ticket...</p>
        </div>
      )}

      {(mode === "confirm" || mode === "manual") && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Categoría</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input-field"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Importe (€)</label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Descripción / Comercio
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Forma de pago
            </label>
            <input
              type="text"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              placeholder="Opcional"
              className="input-field"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !amount}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
