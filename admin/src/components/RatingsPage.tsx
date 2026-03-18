import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { adminAPI } from "../services/api";
import { useSearchParams } from "react-router-dom";
import Pagination from "./Pagination";

type DriverItem = {
  _id: string;
  name?: string;
  rating?: number;
  totalTrips?: number;
  totalEarnings?: number;
};

const RatingsPage: React.FC = () => {
  const PAGE_SIZE = 10;
  const [searchParams] = useSearchParams();
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setError("");
      const res = await adminAPI.getDrivers();
      setDrivers(res.data?.drivers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch ratings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const sorted = useMemo(
    () => {
      const terms = ((searchParams.get("q") || "").trim().toLowerCase())
        .split(/\s+/)
        .filter(Boolean);
      const filtered = drivers.filter((d) => {
        if (terms.length === 0) return true;
        const haystack = [d._id, d.name].filter(Boolean).join(" ").toLowerCase();
        return terms.every((t) => haystack.includes(t));
      });
      return [...filtered].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    },
    [drivers, searchParams]
  );

  useEffect(() => {
    setPage(1);
  }, [searchParams]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedDrivers = useMemo(
    () => sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sorted, safePage]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ratings</h1>
          <p className="text-gray-500 mt-1 text-sm">{loading ? "Loading..." : `${sorted.length} drivers`}</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-yellow-100 border border-yellow-200 text-sm font-semibold text-gray-900">
          Refresh
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-5 gap-4 px-6 py-3 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
          <span>Name</span>
          <span>Rating</span>
          <span>Total Trips</span>
          <span>Total Earnings</span>
          <span>Tier</span>
        </div>
        {paginatedDrivers.map((d) => {
          const rating = Number(d.rating || 0);
          const tier = rating >= 4.8 ? "Top" : rating >= 4 ? "Good" : "Needs Review";
          return (
            <div key={d._id} className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-gray-50 text-sm">
              <span className="font-semibold text-gray-900">{d.name || "Unknown Driver"}</span>
              <span className="flex items-center gap-1 text-yellow-600 font-semibold"><Star size={14} /> {rating.toFixed(1)}</span>
              <span>{d.totalTrips || 0}</span>
              <span>Rs {Math.round(Number(d.totalEarnings || 0)).toLocaleString()}</span>
              <span>{tier}</span>
            </div>
          );
        })}
        {!loading && sorted.length === 0 && <div className="px-6 py-8 text-sm text-gray-500">No ratings data available.</div>}
      </div>
      <Pagination
        page={safePage}
        totalPages={totalPages}
        totalItems={sorted.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
};

export default RatingsPage;
