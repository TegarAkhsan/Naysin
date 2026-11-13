"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  AlertTriangle,
  CalendarClock,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  PlusCircle,
  MinusCircle,
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function fetchSummary() {
    setLoading(true);
    try {
      const res = await fetch("/api/stock/summary");
      if (res.ok) {
        const json = await res.json();
        setData(json.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            Dashboard Posisi Stok
          </h2>
          <p className="text-sm text-stone-500">
            Monitoring inventaris bahan baku & peringatan Nays Kopi secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSummary}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg shadow-sm hover:bg-stone-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Perbarui</span>
          </button>
          <Link
            href="/stock/new"
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Catat Mutasi</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-stone-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Total Bahan Baku
            </span>
            <Boxes className="w-5 h-5 text-stone-400" />
          </div>
          <p className="text-3xl font-bold text-stone-900 mt-2">
            {data ? data.totalIngredients : "..."}
          </p>
          <p className="text-xs text-stone-500 mt-1">Bahan aktif terdaftar</p>
        </div>

        <div className="p-5 bg-white border border-stone-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Stok Menipis
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-amber-600 mt-2">
            {data ? data.lowStockCount : "..."}
          </p>
          <p className="text-xs text-stone-500 mt-1">Di bawah batas minimum</p>
        </div>

        <div className="p-5 bg-white border border-stone-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Mendekati Kedaluwarsa
            </span>
            <CalendarClock className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {data ? data.expiringBatchesCount : "..."}
          </p>
          <p className="text-xs text-stone-500 mt-1">Kadaluwarsa dalam 3 hari</p>
        </div>

        <div className="p-5 bg-white border border-stone-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Sudah Kedaluwarsa
            </span>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-3xl font-bold text-rose-600 mt-2">
            {data ? data.expiredBatchesCount : "..."}
          </p>
          <p className="text-xs text-stone-500 mt-1">Perlu pembuangan (waste)</p>
        </div>
      </div>

      {/* Alert Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-stone-900 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Peringatan Bahan Baku Menipis</span>
          </h3>
          {data && data.lowStockItems.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {data.lowStockItems.map((item: any) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-stone-900">{item.name}</p>
                    <p className="text-xs text-stone-500">
                      Minimum ambang: {item.minimumStock} {item.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 py-6 text-center">
              Semua bahan baku dalam posisi aman di atas batas minimum.
            </p>
          )}
        </div>

        {/* Expiring Batches */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-stone-900 flex items-center gap-2 mb-4">
            <CalendarClock className="w-4 h-4 text-orange-500" />
            <span>Peringatan Tanggal Kedaluwarsa (Batch)</span>
          </h3>
          {data && data.expiringBatches.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {data.expiringBatches.map((b: any) => (
                <div key={b.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-stone-900">{b.ingredientName}</p>
                    <p className="text-xs text-stone-500">
                      Lot: {b.lotCode || "-"} | Exp: {new Date(b.expiresAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${
                        b.isExpired
                          ? "bg-rose-100 text-rose-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {b.isExpired ? "Kedaluwarsa" : "Mendekati"} ({b.quantityRemaining} {b.unit})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 py-6 text-center">
              Tidak ada batch bahan yang terancam kedaluwarsa dalam 3 hari ke depan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

