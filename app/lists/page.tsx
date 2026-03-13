import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { Plus, List, ChevronRight } from "lucide-react";

async function getListsWithCounts() {
  if (!isSupabaseConfigured) return [];
  const { data: lists } = await supabase
    .from("sheep_lists")
    .select("id, name, created_at")
    .order("name");

  if (!lists?.length) return [];

  const withCounts = await Promise.all(
    lists.map(async (list) => {
      const { count } = await supabase
        .from("sheep")
        .select("*", { count: "exact", head: true })
        .eq("list_id", list.id);
      return { ...list, count: count ?? 0 };
    })
  );
  return withCounts;
}

export default async function ListsPage() {
  const lists = await getListsWithCounts();

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Listas de ovejas</h1>

      <Link
        href="/lists/new"
        className="btn-primary flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Crear lista
      </Link>

      {lists.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 py-12">
          <List className="w-16 h-16 text-slate-300" />
          <p className="text-slate-500 text-center">No hay listas aún.</p>
          <p className="text-slate-400 text-sm text-center">
            Crea una lista para organizar tus ovejas.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {lists.map((list) => (
            <Link
              key={list.id}
              href={`/lists/${list.id}`}
              className="card flex items-center justify-between active:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <List className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="font-semibold text-slate-800">{list.name}</p>
                  <p className="text-sm text-slate-500">{list.count} animales</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </Link>
          ))}
        </ul>
      )}
    </div>
  );
}
