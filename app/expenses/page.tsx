import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { Plus, Receipt } from "lucide-react";
import { ExpenseListItem } from "./ExpenseListItem";

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
          {expenses.map((e) => (
            <ExpenseListItem key={e.id} expense={e} />
          ))}
        </ul>
      )}
    </div>
  );
}
