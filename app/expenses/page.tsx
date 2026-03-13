import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Receipt } from "lucide-react";

async function getExpenses() {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase
    .from("expenses")
    .select(`
      *,
      expense_categories(name)
    `)
    .order("date", { ascending: false })
    .limit(100);
  return data ?? [];
}

export default async function ExpensesPage() {
  const expenses = await getExpenses();

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Gastos</h1>

      <Link
        href="/add-expense"
        className="btn-primary flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Añadir gasto
      </Link>

      {expenses.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 py-12">
          <Receipt className="w-16 h-16 text-slate-300" />
          <p className="text-slate-500 text-center">No hay gastos registrados.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {expenses.map((e: { id: string; date: string; amount: number; description: string | null; expense_categories: { name: string } | null }) => (
            <li key={e.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">
                  {e.expense_categories?.name ?? "Otros"} — {Number(e.amount).toFixed(2)}€
                </p>
                <p className="text-sm text-slate-500">
                  {format(new Date(e.date), "d MMM yyyy", { locale: es })}
                  {e.description && ` · ${e.description}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
