"use client";

import { useEffect, useState } from "react";
import { UtensilsCrossed, Plus, Search } from "lucide-react";

export default function MenusPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadMenus() {
    setLoading(true);
    try {
      const res = await fetch("/api/menus");
      if (res.ok) {
        const json = await res.json();
        setMenus(json.menus || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMenus();
  }, []);

  const filtered = menus.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase()) ||
      m.aliases?.some((a: any) => a.alias.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            Master Menu & Pengetahuan Asisten AI
          </h2>
          <p className="text-sm text-stone-500">
            Basis data menu resmi Nays Kopi beserta alias/istilah informal pelanggan.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
        <Search className="w-5 h-5 text-stone-400" />
        <input
          type="text"
          placeholder="Cari menu atau istilah (misal: kopi aren, matcha)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm outline-none bg-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((menu) => (
          <div
            key={menu.id}
            className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-base text-stone-900">{menu.name}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                  {menu.category}
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed mb-4">
                {menu.description}
              </p>

              {menu.aliases && menu.aliases.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                    Istilah / Alias AI
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {menu.aliases.map((a: any) => (
                      <span
                        key={a.id}
                        className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/60 rounded text-[11px]"
                      >
                        {a.alias}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-sm font-bold text-stone-900">
                {menu.price !== null
                  ? `Rp${menu.price.toLocaleString("id-ID")}`
                  : "Harga belum diverifikasi"}
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                  menu.isAvailable
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-stone-100 text-stone-500"
                }`}
              >
                {menu.isAvailable ? "Tersedia" : "Tidak Tersedia"}
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 text-stone-400">
            Tidak ada menu yang sesuai dengan kata kunci pencarian.
          </div>
        )}
      </div>
    </div>
  );
}

