type FareLike = {
  fare?: number;
  baseFare?: number;
  nightSurcharge?: number;
  returnTripFare?: number;
  penaltyApplied?: number;
  tollFee?: number;
  totalFare?: number;
};

export const getOneWayFare = (b: FareLike): number => {
  const fare = Number(b.fare || 0);
  const baseFare = Number(b.baseFare || 0);
  const nightSurcharge = Number(b.nightSurcharge || 0);

  // Legacy guard: if base equals fare and night exists, fare already includes night surcharge.
  if (baseFare > 0 && nightSurcharge > 0 && Math.abs(baseFare - fare) <= 1) {
    return fare;
  }

  if (baseFare > 0) return baseFare + nightSurcharge;
  return fare;
};

export const getBookingTotalFare = (b: FareLike): number => {
  const computedTotal =
    getOneWayFare(b) +
    Number(b.returnTripFare || 0) +
    Number(b.penaltyApplied || 0) +
    Number(b.tollFee || 0);

  // Prefer computed breakdown when components exist; old stored totalFare can be stale.
  if (computedTotal > 0) return computedTotal;

  const explicitTotal = Number(b.totalFare || 0);
  if (explicitTotal > 0) return explicitTotal;
  return 0;
};

export const getAdminCommission = (b: FareLike): number =>
  Math.round(getBookingTotalFare(b) * 0.12);
