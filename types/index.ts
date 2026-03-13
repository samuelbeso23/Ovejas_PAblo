export interface SheepList {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Sheep {
  id: string;
  ear_tag_number: string;
  list_id: string;
  photo_url: string | null;
  date_added: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Expense {
  id: string;
  date: string;
  category_id: string;
  amount: number;
  description: string | null;
  receipt_photo: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

export interface SheepWithList extends Sheep {
  sheep_lists?: SheepList | null;
}

export interface ExpenseWithCategory extends Expense {
  expense_categories?: ExpenseCategory | null;
}
