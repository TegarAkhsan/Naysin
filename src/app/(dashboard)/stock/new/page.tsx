"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, CheckCircle2, ShieldAlert } from "lucide-react";

export default function NewStockMutationPage() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [form, setForm] = useState({
    ingredientId: "",
    type: "IN",
    quantity: "",
    note: "",
    wasteReason: "EXPIRED",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetch("/api/ingredients")
      .then((res) => res.json())
      .then((data) => {
        setIngredients(data.ingredients || []);
        if (data.ingredients && data.ingredients.length > 0) {
          setForm((prev) => ({ ...prev, ingredientId: data.ingredients[0].id }));
        }
      });
  }, []);

  const selectedIngredient = ingredients.find((i) => i.id === form.ingredientId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const idempotencyKey = "web-" + crypto.randomUUID();

    try {
      const res = await fetch("/api/stock/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientId: form.ingredientId,
          type: form.type,
          quantity: Number(form.quantity),
          note: form.note || undefined,
          wasteReason: form.type === "WASTE" ? form.wasteReason : undefined,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal mencatat mutasi stok");
      } else {
        setSuccessMsg(
          `Mutasi ${form.type} berhasil dicatat. Saldo terbaru: ${data.result.afterQty} ${selectedIngredient?.unit || ""}`
        );
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch {
      setErrorMsg("Terjadi kegagalan jaringan saat mengirim mutasi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">
          Catat Transaksi Stok
        </h2>
        <p className="text-sm text-stone-500">
          Input mutasi stok masuk, keluar operasional, opname, atau pencatatan waste/rusak.
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        {errorMsg && (
          <div className="mb-5 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tipe Mutasi */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { type: "IN", label: "Masuk (IN)" },
                { type: "OUT", label: "Keluar (OUT)" },
                { type: "ADJUSTMENT", label: "Opname" },
                { type: "WASTE", label: "Waste (Terbuang)" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setForm({ ...form, type: item.type })}
                  className={`py-2 px-1 text-xs font-semibold rounded-lg border text-center transition ${
                    form.type === item.type
                      ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pilih Bahan */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Bahan Baku
            </label>
            <select
              value={form.ingredientId}
              onChange={(e) => setForm({ ...form, ingredientId: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg outline-none focus:border-amber-600 bg-white"
            >
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} (Saldo: {ing.currentStock} {ing.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Kuantitas */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {form.type === "ADJUSTMENT"
                ? "Hasil Hitung Fisik (Saldo Baru)"
                : `Jumlah Kuantitas (${selectedIngredient?.unit || ""})`}
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              placeholder="Contoh: 500"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg outline-none focus:border-amber-600"
            />
          </div>

          {/* Waste Reason if WASTE */}
          {form.type === "WASTE" && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Penyebab Pembuangan (Waste Reason)
              </label>
              <select
                value={form.wasteReason}
                onChange={(e) => setForm({ ...form, wasteReason: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg outline-none focus:border-amber-600 bg-white"
              >
                <option value="EXPIRED">Kedaluwarsa (Expired)</option>
                <option value="SPOILED">Basi / Rusak Penyimpanan</option>
                <option value="DAMAGED">Kemasan Bocor / Pecah</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>
          )}

          {/* Catatan */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Keterangan / Nomor Referensi (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Penerimaan supplier #PO-902 atau pemakaian shift sore"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg outline-none focus:border-amber-600"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-400 text-white font-semibold rounded-xl transition shadow-md flex items-center justify-center gap-2"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>{loading ? "Menyimpan Transaksi..." : "Simpan Mutasi Stok"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

