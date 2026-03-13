"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CameraCapture } from "@/components/CameraCapture";
import { extractEarTagFromImage } from "@/lib/ocrService";
import { supabase, isSupabaseConfigured, STORAGE_BUCKETS } from "@/lib/supabaseClient";
import { Loader2, Check, ArrowLeft } from "lucide-react";

function ScanSheepContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listParam = searchParams.get("list");

  const [step, setStep] = useState<"camera" | "ocr" | "confirm" | "list" | "manual">("camera");
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [selectedEarTag, setSelectedEarTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  const [selectedListId, setSelectedListId] = useState(listParam ?? "");
  const [notes, setNotes] = useState("");

  const handleCapture = async (blob: Blob) => {
    setImageBlob(blob);
    setImagePreview(URL.createObjectURL(blob));
    setStep("ocr");
    setLoading(true);

    try {
      const { candidates: cands } = await extractEarTagFromImage(blob);
      setCandidates(cands);
      // No pre-rellenar: el OCR suele fallar. Mostrar como sugerencias para que el usuario pulse si es correcto
      setSelectedEarTag("");
    } catch (err) {
      console.error(err);
      setCandidates([]);
      setSelectedEarTag("");
    } finally {
      setStep("confirm");
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedEarTag.trim()) return;

    if (!isSupabaseConfigured) {
      alert("Configura Supabase en .env.local para guardar ovejas.");
      return;
    }

    setLoading(true);
    try {
      const { data: listsData, error } = await supabase.from("sheep_lists").select("id, name");
      if (error) throw error;
      const listsArr = listsData ?? [];
      setLists(listsArr);

      if (listsArr.length === 0) {
        alert("No hay listas. Crea una lista primero en la pestaña Listas.");
        setLoading(false);
        return;
      }

      const preSelect = listParam && listsArr.some((l) => l.id === listParam)
        ? listParam
        : listsArr[0]?.id ?? "";
      setSelectedListId(preSelect);
      setStep("list");
    } catch (err) {
      console.error(err);
      alert("Error al cargar listas. Comprueba la conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedEarTag.trim() || !selectedListId) return;

    setLoading(true);
    try {
      let photoUrl: string | null = null;
      if (imageBlob && isSupabaseConfigured) {
        const ext = imageBlob.type.includes("png") ? "png" : "jpg";
        const fileName = `ear-tag-${Date.now()}-${selectedEarTag}.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.EAR_TAG_PHOTOS)
          .upload(fileName, imageBlob, { contentType: imageBlob.type, upsert: true });
        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKETS.EAR_TAG_PHOTOS)
            .getPublicUrl(uploadData.path);
          photoUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from("sheep").insert({
        ear_tag_number: selectedEarTag.trim(),
        list_id: selectedListId,
        photo_url: photoUrl,
        date_added: new Date().toISOString().split("T")[0],
        notes: notes.trim() || null,
      });

      if (error) throw error;
      router.push(`/lists/${selectedListId}`);
    } catch (err: unknown) {
      console.error(err);
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Error al guardar";
      alert(`Error al guardar la oveja: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep("camera");
    setImageBlob(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setCandidates([]);
    setSelectedEarTag("");
    setLists([]);
    setSelectedListId(listParam ?? "");
    setNotes("");
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-lg hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Escanear oveja</h1>
      </div>

      {step === "camera" && (
        <div className="space-y-4">
          <CameraCapture onCapture={handleCapture} />
          <button
            type="button"
            onClick={() => {
              setSelectedEarTag("");
              setStep("manual");
            }}
            className="btn-secondary w-full"
          >
            Escribir número manualmente (sin foto)
          </button>
        </div>
      )}

      {step === "manual" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Número de crotal
            </label>
            <input
              type="text"
              value={selectedEarTag}
              onChange={(e) => setSelectedEarTag(e.target.value)}
              placeholder="ES121234512345"
              className="input-field text-lg"
              maxLength={14}
              autoFocus
            />
            <p className="mt-1 text-xs text-slate-400">
              ES + 2 díg. CCAA + 5 granja + 5 animal
            </p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep("camera")} className="btn-secondary flex-1">
              Volver
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedEarTag.trim() || loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Siguiente
            </button>
          </div>
        </div>
      )}

      {step === "ocr" && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
          <p className="text-slate-600">Analizando imagen...</p>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-4">
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Crotal"
              className="w-full aspect-[4/3] object-cover rounded-2xl"
            />
          )}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-sm text-amber-800 font-medium">
              Escribe el número del crotal (el OCR suele fallar, es mejor escribir a mano).
            </p>
          </div>
          {candidates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-slate-500">Sugerencias OCR (pulsa si es correcto):</span>
              {candidates.slice(0, 3).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedEarTag(c)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-mono"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Número de crotal (edita si es necesario)
            </label>
            <input
              type="text"
              value={selectedEarTag}
              onChange={(e) => setSelectedEarTag(e.target.value)}
              placeholder="ES121234512345"
              className="input-field text-lg"
              maxLength={14}
            />
            <p className="mt-1 text-xs text-slate-400">
              Formato: ES + 2 díg. CCAA + 5 granja + 5 animal (12 dígitos)
            </p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleReset} className="btn-secondary flex-1">
              Nueva foto
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedEarTag.trim() || loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Confirmar
            </button>
          </div>
        </div>
      )}

      {step === "list" && (
        <div className="space-y-4">
          <p className="text-slate-600">
            Añadir <strong>{selectedEarTag}</strong> a:
          </p>
          {lists.length === 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800 font-medium">No hay listas creadas.</p>
              <p className="text-sm text-red-700 mt-1">Crea una lista primero en la pestaña Listas.</p>
              <Link href="/lists/new" className="mt-3 inline-block btn-primary text-center">
                Crear lista
              </Link>
            </div>
          ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Lista</label>
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="input-field"
            >
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          )}
          {lists.length > 0 && (
            <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notas (opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas..."
              className="input-field"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep("confirm")} className="btn-secondary flex-1">
              Atrás
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || !selectedListId}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar"}
            </button>
          </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ScanSheepPage() {
  return (
    <Suspense fallback={<div className="p-4 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>}>
      <ScanSheepContent />
    </Suspense>
  );
}
