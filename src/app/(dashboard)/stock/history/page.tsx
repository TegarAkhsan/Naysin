"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, Download, Filter } from "lucide-react";

export default function StockHistoryPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTransactions() {
    setLoading(true);
    try {
      const res = await fetch("/api/stock/transactions");
      if (res.ok) {
        const json = await res.json();
        setTransactions(json.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            Riwayat Mutasi & Audit Stok
          </h2>
          <p className="text-sm text-stone-500">
            Catatan transaksi immutable: saldo sebelum/sesudah, waktu, jenis mutasi, dan pencatat.
          </p>
        </div>
        <a
          href="/api/reports/stock?format=csv"
          className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg shadow-sm transition text-sm w-fit"
        >
          <Download className="w-4 h-4" />
          <span>Ekspor CSV</span>
        </a>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-700">
            <thead className="bg-stone-50 text-stone-500 uppercase text-[11px] font-semibold border-b border-stone-200">
              <tr>
                <th className="px-5 py-3.5">Waktu</th>
                <th className="px-5 py-3.5">Bahan Baku</th>
                <th className="px-5 py-3.5">Jenis</th>
                <th className="px-5 py-3.5">Kuantitas</th>
                <th className="px-5 py-3.5">Sebelum & Sesudah</th>
                <th className="px-5 py-3.5">Petugas</th>
                <th className="px-5 py-3.5">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-stone-50/60 transition">
                  <td className="px-5 py-4 text-xs text-stone-500 whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-5 py-4 font-medium text-stone-900">
                    {tx.ingredient.name}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        tx.type === "IN"
                          ? "bg-emerald-100 text-emerald-800"
                          : tx.type === "OUT"
                          ? "bg-sky-100 text-sky-800"
                          : tx.type === "WASTE"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-stone-900">
                    {tx.quantity} {tx.ingredient.unit}
                  </td>
                  <td className="px-5 py-4 text-xs font-mono text-stone-500">
                    {tx.beforeQty} &rarr; <span className="font-bold text-stone-900">{tx.afterQty}</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-stone-600">
                    {tx.user?.name || "Sistem"}
                  </td>
                  <td className="px-5 py-4 text-xs text-stone-500">
                    {tx.note || (tx.wasteReason ? `Alasan: ${tx.wasteReason}` : "-")}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-stone-400">
                    Belum ada riwayat mutasi stok yang tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

