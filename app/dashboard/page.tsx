import Link from "next/link";
import { Plus, ScanLine, Receipt } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

async function getSheepCountByList() {
  if (!isSupabaseConfigured) return [];
  const { data: lists } = await supabase.from("sheep_lists").select("id, name");
  if (!lists?.length) return [];

  const counts = await Promise.all(
    lists.map(async (list) => {
      const { count } = await supabase
        .from("sheep")
        .select("*", { count: "exact", head: true })
        .eq("list_id", list.id);
      return { ...list, count: count ?? 0 };
    })
  );
  return counts.filter((c) => c.count > 0);
}

async function getMonthlyExpenses() {
  if (!isSupabaseConfigured) return { total: 0, byCategory: [] as { name: string; amount: number }[] };
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  const { data: expenses } = await supabase
    .from("expenses")
    .select("amount, expense_categories(name)")
    .gte("date", start.toISOString().split("T")[0])
    .lte("date", end.toISOString().split("T")[0]);

  const byCategory: Record<string, number> = {};
  let total = 0;
  expenses?.forEach((e: { amount: number; expense_categories: { name: string } | { name: string }[] | null }) => {
    total += Number(e.amount);
    const catData = Array.isArray(e.expense_categories) ? e.expense_categories[0] : e.expense_categories;
    const cat = catData?.name ?? "Otros";
    byCategory[cat] = (byCategory[cat] ?? 0) + Number(e.amount);
  });

  return {
    total,
    byCategory: Object.entries(byCategory).map(([name, amount]) => ({ name, amount })),
  };
}

export default async function DashboardPage() {
  const [sheepCounts, expenses] = await Promise.all([
    getSheepCountByList(),
    getMonthlyExpenses(),
  ]);

  const currentMonth = format(new Date(), "MMMM yyyy", { locale: es });

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/scan-sheep"
          className="card flex flex-col items-center gap-2 py-6 active:bg-slate-50"
        >
          <ScanLine className="w-10 h-10 text-primary-600" />
          <span className="font-semibold text-slate-800">Escanear oveja</span>
        </Link>
        <Link
          href="/add-expense"
          className="card flex flex-col items-center gap-2 py-6 active:bg-slate-50"
        >
          <Receipt className="w-10 h-10 text-primary-600" />
          <span className="font-semibold text-slate-800">Añadir gasto</span>
        </Link>
      </div>

      {/* Animales */}
      <section className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Animales</h2>
        {sheepCounts.length === 0 ? (
          <p className="text-slate-500 text-sm">No hay listas con ovejas aún.</p>
        ) : (
          <ul className="space-y-2">
            {sheepCounts.map((item) => (
              <li key={item.id} className="flex justify-between items-center">
                <span className="text-slate-700">{item.name}</span>
                <span className="font-semibold text-slate-900">{item.count}</span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/lists"
          className="mt-3 inline-flex items-center gap-1 text-primary-600 font-medium text-sm"
        >
          Ver listas <Plus className="w-4 h-4" />
        </Link>
      </section>

      {/* Finanzas */}
      <section className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Finanzas — {currentMonth}
        </h2>
        {expenses.byCategory.length === 0 ? (
          <p className="text-slate-500 text-sm">No hay gastos este mes.</p>
        ) : (
          <>
            <ul className="space-y-2">
              {expenses.byCategory.map((item) => (
                <li key={item.name} className="flex justify-between items-center">
                  <span className="text-slate-700">{item.name}</span>
                  <span className="font-semibold text-slate-900">{item.amount.toFixed(2)}€</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 pt-3 border-t border-slate-200 font-bold text-slate-900">
              Total: {expenses.total.toFixed(2)}€
            </p>
          </>
        )}
        <Link
          href="/expenses"
          className="mt-3 inline-flex items-center gap-1 text-primary-600 font-medium text-sm"
        >
          Ver gastos <Plus className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
