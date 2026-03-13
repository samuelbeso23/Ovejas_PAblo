"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { Trash2, Pencil, X, Check } from "lucide-react";

interface Sheep {
  id: string;
  ear_tag_number: string;
  date_added: string;
  notes: string | null;
}

export function SheepListItem({ sheep }: { sheep: Sheep }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [earTag, setEarTag] = useState(sheep.ear_tag_number);
  const [notes, setNotes] = useState(sheep.notes ?? "");

  const handleDelete = async () => {
    if (!confirm("¿Eliminar esta oveja de la lista?")) return;
    if (!isSupabaseConfigured) return;
    setLoading(true);
    const { error } = await supabase.from("sheep").delete().eq("id", sheep.id);
    if (!error) router.refresh();
    setLoading(false);
  };

  const handleSave = async () => {
    if (!earTag.trim() || !isSupabaseConfigured) return;
    setLoading(true);
    const { error } = await supabase
      .from("sheep")
      .update({
        ear_tag_number: earTag.trim(),
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sheep.id);
    if (!error) {
      setEditing(false);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <li className="card">
      {editing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={earTag}
            onChange={(e) => setEarTag(e.target.value)}
            placeholder="Número crotal (ES + 12 dígitos)"
            className="input-field"
          />
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas"
            className="input-field"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="p-2 rounded-lg bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="p-2 rounded-lg bg-primary-100 text-primary-600"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-800">{sheep.ear_tag_number}</p>
            <p className="text-sm text-slate-500">
              {format(new Date(sheep.date_added), "d MMM yyyy", { locale: es })}
              {sheep.notes && ` · ${sheep.notes}`}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setEditing(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
