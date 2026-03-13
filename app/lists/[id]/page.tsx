import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { SheepListActions } from "./SheepListActions";
import { SheepListItem } from "./SheepListItem";
import { SheepListWithSearch } from "./SheepListWithSearch";

async function getList(id: string) {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase
    .from("sheep_lists")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

async function getSheepInList(listId: string) {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase
    .from("sheep")
    .select("*")
    .eq("list_id", listId)
    .order("date_added", { ascending: false });
  return data ?? [];
}

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [list, sheep] = await Promise.all([getList(id), getSheepInList(id)]);

  if (!list) notFound();

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/lists" className="p-2 -ml-2 rounded-lg hover:bg-slate-100">
          ← Listas
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{list.name}</h1>
          <p className="text-slate-500">{sheep.length} animales</p>
        </div>
        <SheepListActions listId={id} listName={list.name} />
      </div>

      <div className="flex gap-2">
        <Link href={`/scan-sheep?list=${id}`} className="btn-primary flex-1 text-center">
          Añadir oveja
        </Link>
      </div>

      <SheepListWithSearch listId={id} sheep={sheep} />
    </div>
  );
}
