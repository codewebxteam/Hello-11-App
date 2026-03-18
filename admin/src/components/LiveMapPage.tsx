import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { adminAPI } from "../services/api";
import { useSearchParams } from "react-router-dom";
import Pagination from "./Pagination";

type BookingItem = {
  _id: string;
  status: string;
  pickupLocation?: string;
  dropLocation?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropLatitude?: number;
  dropLongitude?: number;
  user?: { name?: string };
  driver?: { name?: string };
};

const ACTIVE_STATUSES = ["accepted", "driver_assigned", "arrived", "started", "waiting", "return_ride_started"];

const LiveMapPage: React.FC = () => {
  const PAGE_SIZE = 10;
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setError("");
      const res = await adminAPI.getBookings();
      setBookings(res.data?.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch live trip data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const liveBookings = useMemo(
    () => {
      const terms = ((searchParams.get("q") || "").trim().toLowerCase())
        .split(/\s+/)
        .filter(Boolean);
      return bookings.filter((b) => {
        if (!ACTIVE_STATUSES.includes(b.status)) return false;
        if (terms.length === 0) return true;
        const haystack = [b._id, b.status, b.user?.name, b.driver?.name, b.pickupLocation, b.dropLocation]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return terms.every((t) => haystack.includes(t));
      });
    },
    [bookings, searchParams]
  );

  useEffect(() => {
    setPage(1);
  }, [searchParams]);

  const totalPages = Math.max(1, Math.ceil(liveBookings.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedLiveBookings = useMemo(
    () => liveBookings.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [liveBookings, safePage]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Map</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {loading ? "Loading..." : `${liveBookings.length} active rides`}
          </p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-yellow-100 border border-yellow-200 text-sm font-semibold text-gray-900">
          Refresh
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      <div className="space-y-4">
        {paginatedLiveBookings.map((b) => {
          const lat = Number(b.pickupLatitude || 0);
          const lon = Number(b.pickupLongitude || 0);
          const hasCoords = lat !== 0 && lon !== 0 && !Number.isNaN(lat) && !Number.isNaN(lon);
          const mapUrl = hasCoords ? `https://maps.google.com/?q=${lat},${lon}` : "";
          return (
            <div key={b._id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{b.user?.name || "Unknown User"} • {b.driver?.name || "Driver N/A"}</p>
                  <p className="text-xs text-gray-500 uppercase mt-1">Status: {b.status}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">{b._id.slice(-8)}</span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-gray-700">
                <p className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 text-green-600" /> {b.pickupLocation || "-"}</p>
                <p className="flex items-start gap-2"><Navigation size={14} className="mt-0.5 text-red-600" /> {b.dropLocation || "-"}</p>
              </div>
              {hasCoords && (
                <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-block mt-4 text-sm text-yellow-700 font-semibold hover:underline">
                  Open pickup on Google Maps
                </a>
              )}
            </div>
          );
        })}
        {!loading && liveBookings.length === 0 && (
          <div className="bg-white p-8 rounded-xl border border-gray-100 text-sm text-gray-500">No active rides right now.</div>
        )}

        <Pagination
          page={safePage}
          totalPages={totalPages}
          totalItems={liveBookings.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default LiveMapPage;
