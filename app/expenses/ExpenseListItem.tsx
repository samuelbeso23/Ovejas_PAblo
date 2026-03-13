"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { Trash2, Pencil, X, Check } from "lucide-react";

interface Expense {
  id: string;
  date: string;
  category_id: string;
  amount: number;
  description: string | null;
  receipt_photo: string | null;
  payment_method: string | null;
  expense_categories: { name: string } | { name: string }[] | null;
}

interface ExpenseListItemProps {
  expense: Expense;
}

export function ExpenseListItem({ expense }: ExpenseListItemProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryId, setCategoryId] = useState(expense.category_id);
  const [amount, setAmount] = useState(String(expense.amount));
  const [date, setDate] = useState(expense.date);
  const [description, setDescription] = useState(expense.description ?? "");

  useEffect(() => {
    if (editing && isSupabaseConfigured) {
      supabase
        .from("expense_categories")
        .select("id, name")
        .order("sort_order")
        .then(({ data }) => setCategories(data ?? []));
    }
  }, [editing]);

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este gasto?")) return;
    if (!isSupabaseConfigured) return;
    setLoading(true);
    const { error } = await supabase.from("expenses").delete().eq("id", expense.id);
    if (!error) router.refresh();
    setLoading(false);
  };

  const handleSave = async () => {
    if (!amount || !date || !categoryId || !isSupabaseConfigured) return;
    setLoading(true);
    const { error } = await supabase
      .from("expenses")
      .update({
        category_id: categoryId,
        amount: parseFloat(amount.replace(",", ".")),
        date,
        description: description.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", expense.id);
    if (!error) {
      setEditing(false);
      router.refresh();
    }
    setLoading(false);
  };

  const catName = Array.isArray(expense.expense_categories)
    ? expense.expense_categories[0]?.name
    : expense.expense_categories?.name;

  return (
    <li className="card">
      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Categoría</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input-field"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Importe (€)</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="p-2 rounded-lg bg-slate-100">
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
            <p className="font-semibold text-slate-800">
              {catName ?? "Otros"} — {Number(expense.amount).toFixed(2)}€
            </p>
            <p className="text-sm text-slate-500">
              {format(new Date(expense.date), "d MMM yyyy", { locale: es })}
              {expense.description && ` · ${expense.description}`}
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
