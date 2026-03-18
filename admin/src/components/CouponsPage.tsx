import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Ticket } from "lucide-react";
import { adminAPI } from "../services/api";
import { useSearchParams } from "react-router-dom";

type BookingItem = {
  _id: string;
  status: string;
  discount?: number;
  hasReturnTrip?: boolean;
  user?: { name?: string };
  fare?: number;
  returnTripFare?: number;
  createdAt: string;
};

const CouponsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setError("");
      const res = await adminAPI.getBookings();
      setBookings(res.data?.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch discount data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const discounted = useMemo(
    () => {
      const terms = ((searchParams.get("q") || "").trim().toLowerCase())
        .split(/\s+/)
        .filter(Boolean);
      return bookings.filter((b) => {
        if (!(Number(b.discount || 0) > 0 || b.hasReturnTrip)) return false;
        if (terms.length === 0) return true;
        const haystack = [b._id, b.status, b.user?.name].filter(Boolean).join(" ").toLowerCase();
        return terms.every((t) => haystack.includes(t));
      });
    },
    [bookings, searchParams]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coupons / Discounts</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {loading ? "Loading..." : `${discounted.length} discounted bookings`}
          </p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-yellow-100 border border-yellow-200 text-sm font-semibold text-gray-900">
          Refresh
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      <div className="space-y-4">
        {discounted.map((b) => (
          <div key={b._id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                <Ticket size={16} className="text-yellow-600" />
                {b.user?.name || "Unknown User"}
              </p>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold">
                {b.discount ? `${b.discount}% OFF` : "Return Offer"}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2 uppercase">Status: {b.status}</p>
            <p className="text-sm text-gray-700 mt-1">
              Fare: Rs {Math.round(Number(b.fare || 0)).toLocaleString()} • Return Fare: Rs {Math.round(Number(b.returnTripFare || 0)).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">{new Date(b.createdAt).toLocaleString()}</p>
          </div>
        ))}
        {!loading && discounted.length === 0 && (
          <div className="bg-white p-8 rounded-xl border border-gray-100 text-sm text-gray-500">
            No discount/coupon usage found in database.
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponsPage;
