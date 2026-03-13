"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

interface Props {
  listId: string;
  listName: string;
}

export function SheepListActions({ listId, listName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(listName);

  const handleRename = async () => {
    if (!newName.trim() || !isSupabaseConfigured) return;
    const { error } = await supabase
      .from("sheep_lists")
      .update({ name: newName.trim(), updated_at: new Date().toISOString() })
      .eq("id", listId);
    if (!error) {
      setEditing(false);
      setOpen(false);
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar esta lista y todas sus ovejas?")) return;
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from("sheep_lists").delete().eq("id", listId);
    if (!error) router.push("/lists");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-slate-100"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20 min-w-[160px]">
            {editing ? (
              <div className="px-4 py-2 space-y-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="input-field text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="text-sm text-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRename}
                    className="text-sm text-primary-600 font-medium"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50"
                >
                  <Pencil className="w-4 h-4" /> Cambiar nombre
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar lista
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
