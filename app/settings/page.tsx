import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { SettingsForm } from "./SettingsForm";
import { Database, Key } from "lucide-react";

export default async function SettingsPage() {
  let categories: { id: string; name: string; sort_order: number }[] = [];
  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from("expense_categories")
      .select("id, name, sort_order")
      .order("sort_order");
    categories = data ?? [];
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Ajustes</h1>

      <section className="card">
        <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Conexión
        </h2>
        {isSupabaseConfigured ? (
          <p className="text-sm text-green-600">Supabase configurado correctamente.</p>
        ) : (
          <div className="text-sm text-amber-600 space-y-2">
            <p>Configura las variables en .env.local:</p>
            <code className="block bg-slate-100 p-2 rounded text-xs">
              NEXT_PUBLIC_SUPABASE_URL=<br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY=
            </code>
            <p className="mt-2">Copia .env.local.example a .env.local y rellena los valores.</p>
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          OCR (crotales)
        </h2>
        {process.env.OCR_SPACE_API_KEY ? (
          <p className="text-sm text-green-600">OCR.space configurado — mejor detección.</p>
        ) : (
          <div className="text-sm text-slate-600 space-y-2">
            <p>Para mejorar la detección de crotales, añade una API key gratuita de OCR.space:</p>
            <p className="text-xs">1. Regístrate en <a href="https://ocr.space/ocrapi/freekey" target="_blank" rel="noopener" className="text-primary-600 underline">ocr.space/ocrapi/freekey</a></p>
            <p className="text-xs">2. Añade en .env.local: <code>OCR_SPACE_API_KEY=tu-key</code></p>
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Key className="w-5 h-5" />
          Categorías de gasto
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Edita las categorías disponibles para los gastos.
        </p>
        <SettingsForm categories={categories} />
      </section>
    </div>
  );
}
