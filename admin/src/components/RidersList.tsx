import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Car, IndianRupee } from "lucide-react";
import { adminAPI } from "../services/api";
import { useSearchParams } from "react-router-dom";
import Pagination from "./Pagination";

type DriverItem = {
  _id: string;
  name?: string;
  mobile?: string;
  createdAt?: string;
  vehicleModel?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  rating?: number;
  totalTrips?: number;
  totalEarnings?: number;
  available?: boolean;
  online?: boolean;
};

const RidersList: React.FC = () => {
  const PAGE_SIZE = 10;
  const [searchParams] = useSearchParams();
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDrivers = useCallback(async () => {
    try {
      setError("");
      const response = await adminAPI.getDrivers();
      setDrivers(response.data?.drivers || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load drivers.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 15000);
    return () => clearInterval(interval);
  }, [fetchDrivers]);

  const filteredDrivers = useMemo(() => {
    const terms = [(searchParams.get("q") || "").trim().toLowerCase(), search.trim().toLowerCase()]
      .filter(Boolean)
      .flatMap((s) => s.split(/\s+/).filter(Boolean));
    if (terms.length === 0) return drivers;
    return drivers.filter((d) => {
      const haystack = [d.name, d.mobile, d.vehicleModel, d.vehicleNumber, d._id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [search, searchParams, drivers]);

  useEffect(() => {
    setPage(1);
  }, [search, searchParams]);

  const totalPages = Math.max(1, Math.ceil(filteredDrivers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedDrivers = useMemo(
    () => filteredDrivers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredDrivers, safePage]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {loading ? "Loading..." : `${filteredDrivers.length} drivers`}
          </p>
        </div>
        <button
          onClick={fetchDrivers}
          className="px-4 py-2 rounded-lg bg-yellow-100 border border-yellow-200 text-sm font-semibold text-gray-900"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, vehicle, number..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent shadow-sm placeholder-gray-400"
        />
      </div>

      <div className="space-y-4">
        {paginatedDrivers.map((driver) => {
          const status = driver.online ? (driver.available ? "Active" : "Busy") : "Offline";
          return (
            <div
              key={driver._id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start md:items-center space-x-4">
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-yellow-400">
                  <Car size={24} />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900">{driver.name || "Unknown Driver"}</h3>
                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded font-mono font-medium">
                      {driver._id.slice(-6).toUpperCase()}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        status === "Active"
                          ? "bg-green-100 text-green-700"
                          : status === "Busy"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-1 mt-1">
                    <span>{driver.mobile || "-"}</span>
                    <span>{driver.vehicleModel || "-"} ({driver.vehicleType || "5seater"})</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{driver.vehicleNumber || "-"}</span>
                    <span>Joined {driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : "-"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8 pl-16 md:pl-0 mt-4 md:mt-0">
                <div className="text-center md:text-right">
                  <div className="flex items-center gap-1 text-yellow-600 font-medium justify-end">
                    <Car size={16} />
                    <span>{driver.totalTrips || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500">Trips</p>
                </div>

                <div className="text-center md:text-right">
                  <div className="flex items-center gap-1 text-green-600 font-medium justify-end">
                    <IndianRupee size={16} />
                    <span>{Number(driver.totalEarnings || 0).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-500">Total Earnings</p>
                </div>
              </div>
            </div>
          );
        })}

        {!loading && filteredDrivers.length === 0 && (
          <div className="bg-white p-8 rounded-xl border border-gray-100 text-sm text-gray-500">
            No drivers found.
          </div>
        )}

        <Pagination
          page={safePage}
          totalPages={totalPages}
          totalItems={filteredDrivers.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default RidersList;
