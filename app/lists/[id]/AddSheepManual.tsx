"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { Plus, X } from "lucide-react";

interface AddSheepManualProps {
  listId: string;
}

export function AddSheepManual({ listId }: AddSheepManualProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [earTag, setEarTag] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!earTag.trim() || !isSupabaseConfigured) return;
    setLoading(true);
    const { error } = await supabase.from("sheep").insert({
      ear_tag_number: earTag.trim(),
      list_id: listId,
      date_added: new Date().toISOString().split("T")[0],
      notes: notes.trim() || null,
    });
    if (!error) {
      setEarTag("");
      setNotes("");
      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-secondary flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Añadir manual
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Añadir oveja manual</h3>
              <button onClick={() => setOpen(false)} className="p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Número crotal</label>
                <input
                  type="text"
                  value={earTag}
                  onChange={(e) => setEarTag(e.target.value)}
                  placeholder="ES121234512345"
                  className="input-field"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">ES + 2 díg. CCAA + 5 granja + 5 animal</p>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Notas (opcional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
