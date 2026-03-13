"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export function SettingsForm({ categories: initial }: { categories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (id: string) => {
    if (!editName.trim() || !isSupabaseConfigured) return;
    setLoading(true);
    const { error } = await supabase
      .from("expense_categories")
      .update({ name: editName.trim() })
      .eq("id", id);
    if (!error) {
      setCategories((c) => c.map((x) => (x.id === id ? { ...x, name: editName.trim() } : x)));
      setEditingId(null);
    }
    setLoading(false);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    if (!isSupabaseConfigured) return;
    setLoading(true);
    const { error } = await supabase.from("expense_categories").delete().eq("id", id);
    if (!error) setCategories((c) => c.filter((x) => x.id !== id));
    setLoading(false);
    router.refresh();
  };

  const handleAdd = async () => {
    if (!newName.trim() || !isSupabaseConfigured) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("expense_categories")
      .insert({ name: newName.trim(), sort_order: 99 })
      .select()
      .single();
    if (!error && data) {
      setCategories((c) => [...c, data]);
      setNewName("");
    }
    setLoading(false);
    router.refresh();
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setEditName(c.name);
  };

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            {editingId === c.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-field flex-1 text-sm"
                  autoFocus
                />
                <button
                  onClick={() => handleUpdate(c.id)}
                  disabled={loading}
                  className="p-2 text-primary-600"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                </button>
                <button onClick={() => setEditingId(null)} className="p-2 text-slate-500">
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 font-medium">{c.name}</span>
                <button
                  onClick={() => startEdit(c)}
                  className="p-2 text-slate-500 hover:text-slate-700"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={loading}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="flex gap-2 pt-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nueva categoría"
          className="input-field flex-1"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !newName.trim()}
          className="btn-primary px-6 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Añadir
        </button>
      </div>
    </div>
  );
}
