/**
 * NEXORA - In-Memory Runtime Offers Store
 * Ensures synchronized coupon availability between Admin Offer Management
 * and Customer Offer Verification endpoints.
 */

export interface StoredOffer {
  id: string;
  code: string;
  description: string;
  discount_type: "percentage" | "flat";
  discount_value: number;
  discount_percent?: number | null;
  discount_amount?: number | null;
  minimum_order: number;
  max_discount: number | null;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  valid_until?: string | null;
}

export const INITIAL_OFFERS: StoredOffer[] = [
  {
    id: "offer_save50",
    code: "SAVE50",
    description: "Special 20% discount on gourmet fine-dining orders above ₹499 (Max ₹150)",
    discount_type: "percentage",
    discount_value: 20,
    discount_percent: 20,
    discount_amount: null,
    minimum_order: 499,
    max_discount: 150,
    is_active: true,
    end_date: null,
  },
  {
    id: "offer_welcome50",
    code: "WELCOME50",
    description: "Flat ₹50 savings on your royal order above ₹299",
    discount_type: "flat",
    discount_value: 50,
    discount_percent: null,
    discount_amount: 50,
    minimum_order: 299,
    max_discount: null,
    is_active: true,
    end_date: null,
  },
  {
    id: "offer_royal100",
    code: "ROYAL100",
    description: "Flat ₹100 savings on royal dining and party orders above ₹599",
    discount_type: "flat",
    discount_value: 100,
    discount_percent: null,
    discount_amount: 100,
    minimum_order: 599,
    max_discount: null,
    is_active: true,
    end_date: null,
  },
  {
    id: "offer_festive20",
    code: "FESTIVE20",
    description: "Festive celebration 20% discount up to ₹200 on luxury orders above ₹499",
    discount_type: "percentage",
    discount_value: 20,
    discount_percent: 20,
    discount_amount: null,
    minimum_order: 499,
    max_discount: 200,
    is_active: true,
    end_date: null,
  },
];

// Runtime singleton cache on globalThis (persists across Next.js route bundles)
const globalForOffers = globalThis as unknown as {
  __nexora_runtime_offers__?: StoredOffer[];
};

if (!globalForOffers.__nexora_runtime_offers__) {
  globalForOffers.__nexora_runtime_offers__ = [...INITIAL_OFFERS];
}

export function getRuntimeOffers(): StoredOffer[] {
  if (!globalForOffers.__nexora_runtime_offers__) {
    globalForOffers.__nexora_runtime_offers__ = [...INITIAL_OFFERS];
  }
  return globalForOffers.__nexora_runtime_offers__;
}

export function saveRuntimeOffer(offer: StoredOffer): void {
  const list = getRuntimeOffers();
  const cleanCode = offer.code.trim().toUpperCase();
  const idx = list.findIndex((o) => o.code.toUpperCase() === cleanCode);
  const normalized: StoredOffer = {
    ...offer,
    code: cleanCode,
  };
  if (idx !== -1) {
    list[idx] = normalized;
  } else {
    list.unshift(normalized);
  }
}

export function toggleRuntimeOffer(code: string, isActive: boolean): void {
  const list = getRuntimeOffers();
  const cleanCode = code.trim().toUpperCase();
  const offer = list.find((o) => o.code.toUpperCase() === cleanCode);
  if (offer) {
    offer.is_active = isActive;
  }
}

export function deleteRuntimeOffer(code: string): void {
  const list = getRuntimeOffers();
  const cleanCode = code.trim().toUpperCase();
  const idx = list.findIndex((o) => o.code.toUpperCase() === cleanCode);
  if (idx !== -1) {
    list.splice(idx, 1);
  }
}

export function findRuntimeOffer(code: string): StoredOffer | undefined {
  if (!code) return undefined;
  const list = getRuntimeOffers();
  const cleanCode = code.trim().toUpperCase();
  return list.find((o) => o.code.toUpperCase() === cleanCode);
}
