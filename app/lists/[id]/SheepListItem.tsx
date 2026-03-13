"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { Trash2 } from "lucide-react";

interface Sheep {
  id: string;
  ear_tag_number: string;
  date_added: string;
  notes: string | null;
}

export function SheepListItem({ sheep }: { sheep: Sheep }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("¿Eliminar esta oveja de la lista?")) return;
    if (!isSupabaseConfigured) return;
    setDeleting(true);
    const { error } = await supabase.from("sheep").delete().eq("id", sheep.id);
    if (!error) router.refresh();
    setDeleting(false);
  };

  return (
    <li className="card flex items-center justify-between">
      <div>
        <p className="font-medium text-slate-800">{sheep.ear_tag_number}</p>
        <p className="text-sm text-slate-500">
          {format(new Date(sheep.date_added), "d MMM yyyy", { locale: es })}
          {sheep.notes && ` · ${sheep.notes}`}
        </p>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}
