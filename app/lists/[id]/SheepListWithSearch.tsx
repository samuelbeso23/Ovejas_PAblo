"use client";

import { useState, useMemo } from "react";
import { SheepListItem } from "./SheepListItem";

interface Sheep {
  id: string;
  ear_tag_number: string;
  date_added: string;
  notes: string | null;
}

export function SheepListWithSearch({
  sheep,
}: {
  listId: string;
  sheep: Sheep[];
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return sheep;
    const q = search.trim().toLowerCase();
    return sheep.filter((s) => s.ear_tag_number.toLowerCase().includes(q));
  }, [sheep, search]);

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-slate-800">Ovejas en la lista</h2>
      <input
        type="search"
        placeholder="Buscar por número de crotal..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field"
      />
      <ul className="space-y-2">
        {filtered.map((s) => (
          <SheepListItem key={s.id} sheep={s} />
        ))}
      </ul>
      {filtered.length === 0 && (
        <p className="text-slate-500 text-center py-8">
          {search ? "No hay coincidencias." : "No hay ovejas en esta lista."}
        </p>
      )}
    </div>
  );
}
