"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Trash2 } from "lucide-react";

export default function ReportsPage() {
  const [wasteLogs, setWasteLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stock/transactions?type=WASTE")
      .then((res) => res.json())
      .then((data) => {
        setWasteLogs(data.transactions || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            Laporan Operasional & Monitoring Waste
          </h2>
          <p className="text-sm text-stone-500">
            Analisis bahan terbuang (waste), kedaluwarsa, dan ekspor riwayat pembukuan kafe.
          </p>
        </div>
        <a
          href="/api/reports/stock?format=csv"
          className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg shadow-sm transition text-sm w-fit"
        >
          <Download className="w-4 h-4" />
          <span>Unduh Laporan Lengkap (.CSV)</span>
        </a>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-stone-900 flex items-center gap-2 mb-4">
          <Trash2 className="w-4 h-4 text-rose-500" />
          <span>Catatan Bahan Terbuang (Waste Log)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-700">
            <thead className="bg-stone-50 text-stone-500 uppercase text-[11px] font-semibold border-b border-stone-200">
              <tr>
                <th className="px-5 py-3">Tanggal</th>
                <th className="px-5 py-3">Bahan Baku</th>
                <th className="px-5 py-3">Jumlah Terbuang</th>
                <th className="px-5 py-3">Alasan Kerusakan</th>
                <th className="px-5 py-3">Pencatat</th>
                <th className="px-5 py-3">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {wasteLogs.map((log) => (
                <tr key={log.id} className="hover:bg-stone-50/60">
                  <td className="px-5 py-3.5 text-xs text-stone-500">
                    {new Date(log.createdAt).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-stone-900">
                    {log.ingredient.name}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-rose-600">
                    {log.quantity} {log.ingredient.unit}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800">
                      {log.wasteReason || "EXPIRED"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-stone-600">
                    {log.user?.name || "-"}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-stone-400">
                    {log.note || "-"}
                  </td>
                </tr>
              ))}
              {wasteLogs.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-stone-400">
                    Belum ada catatan bahan terbuang (waste).
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

