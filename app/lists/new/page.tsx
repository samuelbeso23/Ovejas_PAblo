"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewListPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (!isSupabaseConfigured) {
      alert("Configura Supabase en .env.local.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sheep_lists")
        .insert({ name: name.trim() })
        .select("id")
        .single();

      if (error) throw error;
      router.push(`/lists/${data.id}`);
    } catch (err: unknown) {
      console.error(err);
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Error al crear";
      alert(`Error al crear la lista: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/lists" className="p-2 -ml-2 rounded-lg hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Nueva lista</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Corderas para vida"
            className="input-field"
            autoFocus
          />
        </div>
        <button type="submit" disabled={loading || !name.trim()} className="btn-primary flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Crear lista"}
        </button>
      </form>
    </div>
  );
}
