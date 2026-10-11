import { createServerClient } from "@/lib/supabase/server";
import { fallbackMenuItems } from "@/lib/menuData";
import { sanitizeCouponCode } from "@/lib/security/validation";

export interface OrderItemInput {
  id: string;
  quantity: number;
}

export interface CalculatedOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  itemTotal: number;
}

export interface RecalculatedOrder {
  items: CalculatedOrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discountAmount: number;
  grandTotal: number;
  couponCode: string | null;
  couponApplied: boolean;
}

/**
 * Server-Side Order Recalculator:
 * Re-fetches prices directly from the authoritative database / catalogue.
 * Subtotal, delivery fee, tax and discount are recalculated strictly on the server.
 * Any client-supplied amount, subtotal, price, or discount is completely ignored.
 */
export async function recalculateOrderFromDatabase(
  items: OrderItemInput[],
  rawCouponCode?: string | null
): Promise<RecalculatedOrder> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Order must contain at least one item.");
  }

  // 1. Sanitize item inputs
  const cleanedItems: OrderItemInput[] = items.map((i) => ({
    id: String(i.id).trim(),
    quantity: Math.max(1, Math.floor(Number(i.quantity) || 1)),
  }));

  const itemIds = cleanedItems.map((i) => i.id);

  // 2. Query Supabase database for real prices
  const supabase = createServerClient({ admin: true });
  let dbItems: any[] = [];

  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, name, price, discount_price, is_available")
      .in("id", itemIds);

    if (!error && Array.isArray(data)) {
      dbItems = data;
    }
  } catch (err) {
    console.warn("Database menu_items lookup warning:", err);
  }

  // Map of authoritative items (DB first, fallback catalogue second)
  const resolvedItemsMap = new Map<string, { id: string; name: string; price: number; discount_price?: number | null; is_available?: boolean }>();

  for (const dbItem of dbItems) {
    resolvedItemsMap.set(dbItem.id, dbItem);
  }

  for (const fallback of fallbackMenuItems) {
    if (!resolvedItemsMap.has(fallback.id)) {
      resolvedItemsMap.set(fallback.id, fallback);
    }
    // Also index by slug in case client passed slug
    if (fallback.slug && !resolvedItemsMap.has(fallback.slug)) {
      resolvedItemsMap.set(fallback.slug, fallback);
    }
  }

  const calculatedItems: CalculatedOrderItem[] = [];
  let subtotal = 0;

  for (const input of cleanedItems) {
    const found = resolvedItemsMap.get(input.id);
    if (!found) {
      throw new Error(`Menu item '${input.id}' not found in restaurant catalogue.`);
    }

    if (found.is_available === false) {
      throw new Error(`Item '${found.name}' is currently unavailable.`);
    }

    const price = typeof found.price === "number" ? found.price : 0;
    const discountPrice = typeof found.discount_price === "number" && found.discount_price > 0 ? found.discount_price : null;
    const effectivePrice = discountPrice !== null ? discountPrice : price;

    if (effectivePrice <= 0) {
      throw new Error(`Invalid price configuration for item '${found.name}'.`);
    }

    const itemTotal = effectivePrice * input.quantity;
    subtotal += itemTotal;

    calculatedItems.push({
      id: found.id,
      name: found.name,
      price: effectivePrice,
      quantity: input.quantity,
      itemTotal,
    });
  }

  // 3. Recalculate Delivery Fee from settings table
  let deliveryFee = 40; // standard fallback
  try {
    const { data: settingsData } = await supabase
      .from("settings")
      .select("delivery_fee")
      .maybeSingle();

    if (settingsData && typeof settingsData.delivery_fee === "number") {
      deliveryFee = Math.max(0, settingsData.delivery_fee);
    }
  } catch {}

  // 4. Recalculate Coupon Discount from database
  let discountAmount = 0;
  let verifiedCouponCode: string | null = null;
  let couponApplied = false;

  const cleanCoupon = sanitizeCouponCode(rawCouponCode);
  if (cleanCoupon) {
    try {
      const { data: offerData } = await supabase
        .from("offers")
        .select("*")
        .eq("code", cleanCoupon)
        .eq("is_active", true)
        .maybeSingle();

      let offer = offerData;

      // Fallback check in case demo coupons exist in local runtime
      if (!offer) {
        const DEMO_OFFERS: any[] = [
          { code: "SAVE50", discount_type: "percentage", discount_value: 20, minimum_order: 499, max_discount: 150 },
          { code: "WELCOME50", discount_type: "flat", discount_value: 50, minimum_order: 299 },
          { code: "ROYAL100", discount_type: "flat", discount_value: 100, minimum_order: 599 },
        ];
        offer = DEMO_OFFERS.find((o) => o.code === cleanCoupon);
      }

      if (offer) {
        const minOrder = Number(offer.minimum_order) || 0;
        if (subtotal >= minOrder) {
          if (offer.discount_type === "percentage") {
            let calc = Math.round((subtotal * Number(offer.discount_value)) / 100);
            const maxDisc = Number(offer.max_discount);
            if (maxDisc && maxDisc > 0) {
              calc = Math.min(calc, maxDisc);
            }
            discountAmount = calc;
          } else {
            discountAmount = Number(offer.discount_value) || 0;
          }

          // Discount can never exceed subtotal
          discountAmount = Math.min(discountAmount, subtotal);
          verifiedCouponCode = offer.code;
          couponApplied = discountAmount > 0;
        }
      }
    } catch (offerErr) {
      console.warn("Offer verification warning:", offerErr);
    }
  }

  // 5. Final Grand Total Recalculation
  const tax = 0; // Pure-veg inclusive pricing model
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee + tax);

  return {
    items: calculatedItems,
    subtotal,
    deliveryFee,
    tax,
    discountAmount,
    grandTotal,
    couponCode: verifiedCouponCode,
    couponApplied,
  };
}
