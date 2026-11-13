"use client";

import { useEffect, useState } from "react";
import { Plus, Search, AlertCircle, ShieldAlert } from "lucide-react";

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", unit: "gram", minimumStock: 0, notes: "" });
  const [errorMsg, setErrorMsg] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/ingredients");
      if (res.ok) {
        const json = await res.json();
        setIngredients(json.ingredients || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    const res = await fetch("/api/ingredients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || "Gagal menambahkan bahan baku");
      return;
    }

    setShowModal(false);
    setForm({ name: "", unit: "gram", minimumStock: 0, notes: "" });
    loadData();
  }

  const filtered = ingredients.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            Master Bahan Baku
          </h2>
          <p className="text-sm text-stone-500">
            Daftar seluruh bahan baku aktif, batas minimum stok, dan unit operasional.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Bahan</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
        <Search className="w-5 h-5 text-stone-400" />
        <input
          type="text"
          placeholder="Cari bahan baku (misal: Kopi, Susu, Gula)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm outline-none bg-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-700">
            <thead className="bg-stone-50 text-stone-500 uppercase text-[11px] font-semibold border-b border-stone-200">
              <tr>
                <th className="px-5 py-3.5">Nama Bahan</th>
                <th className="px-5 py-3.5">Saldo Saat Ini</th>
                <th className="px-5 py-3.5">Ambang Min.</th>
                <th className="px-5 py-3.5">Satuan</th>
                <th className="px-5 py-3.5">Status Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((item) => {
                const isLow = item.currentStock <= item.minimumStock;
                return (
                  <tr key={item.id} className="hover:bg-stone-50/60 transition">
                    <td className="px-5 py-4 font-medium text-stone-900">
                      {item.name}
                      {item.notes && (
                        <p className="text-xs text-stone-400 font-normal">{item.notes}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold text-stone-900">
                      {item.currentStock.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-4 text-stone-500">
                      {item.minimumStock.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-stone-600">
                      {item.unit}
                    </td>
                    <td className="px-5 py-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <AlertCircle className="w-3 h-3" />
                          Menipis
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          Aman
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-stone-400">
                    Tidak ada bahan baku yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Bahan */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200">
            <h3 className="text-lg font-bold text-stone-900 mb-1">Tambah Bahan Baku Baru</h3>
            <p className="text-xs text-stone-500 mb-4">
              Khusus akun Owner. Masukkan nama bahan baku dan satuan dasar operasional.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Bahan Baku
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bubuk Cokelat Murni"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Satuan Operasional
                  </label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg outline-none focus:border-amber-600"
                  >
                    <option value="gram">gram (g)</option>
                    <option value="ml">mililiter (ml)</option>
                    <option value="pcs">pcs / buah</option>
                    <option value="sachet">sachet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Ambang Minimum
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.minimumStock}
                    onChange={(e) => setForm({ ...form, minimumStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Catatan / Cara Simpan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Simpan di freezer suhu -18C"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg outline-none focus:border-amber-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition shadow-sm"
                >
                  Simpan Bahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

