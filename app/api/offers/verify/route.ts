import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// Fallback royal offers for local resilience & seeded defaults
const DEFAULT_FALLBACK_OFFERS = [
  {
    id: "offer_save50",
    code: "SAVE50",
    description: "Special 20% discount on gourmet fine-dining orders above ₹499 (Max ₹150)",
    discount_type: "percentage",
    discount_value: 20,
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
    minimum_order: 499,
    max_discount: 200,
    is_active: true,
    end_date: null,
  },
];

/**
 * Backend Verification Endpoint for Coupons:
 * Verifies:
 *  1. valid? (code exists & active)
 *  2. expired? (current time within validity range)
 *  3. minimum order? (subtotal meets minimum requirement)
 *  4. maximum discount? (percentage discount capped at max_discount limit)
 *  5. already used? (prevents multiple uses per customer)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawCode = body?.code;
    const subtotal = Number(body?.subtotal) || 0;
    const userId = body?.userId ? String(body.userId).trim() : null;
    const phone = body?.phone ? String(body.phone).trim() : null;

    if (!rawCode || typeof rawCode !== "string") {
      return NextResponse.json(
        { valid: false, error: "Please enter a valid coupon code." },
        { status: 400 }
      );
    }

    const code = rawCode.trim().toUpperCase();

    // 1. Fetch offer from Supabase database
    const supabase = createServerClient();
    let offer: any = null;

    try {
      const { data: dbOffers, error: dbError } = await supabase
        .from("offers")
        .select("*")
        .ilike("code", code)
        .limit(1);

      if (!dbError && dbOffers && dbOffers.length > 0) {
        offer = dbOffers[0];
      }
    } catch (err) {
      console.warn("Supabase offer lookup notice:", err);
    }

    // Fallback to built-in offers if database record is missing
    if (!offer) {
      offer = DEFAULT_FALLBACK_OFFERS.find(
        (o) => o.code.toUpperCase() === code
      );
    }

    // 1. CHECK: valid? (exists & active)
    if (!offer) {
      return NextResponse.json(
        {
          valid: false,
          error: `"${code}" is not a valid coupon code. Please check and try again.`,
        },
        { status: 200 }
      );
    }

    if (offer.is_active === false) {
      return NextResponse.json(
        {
          valid: false,
          error: `Coupon "${code}" is currently disabled or inactive.`,
        },
        { status: 200 }
      );
    }

    // 2. CHECK: expired?
    const now = new Date();
    const expiry = offer.end_date || offer.valid_until;
    if (expiry) {
      const expiryDate = new Date(expiry);
      if (now > expiryDate) {
        return NextResponse.json(
          {
            valid: false,
            error: `Coupon "${code}" has expired on ${expiryDate.toLocaleDateString()}.`,
          },
          { status: 200 }
        );
      }
    }

    if (offer.start_date) {
      const startDate = new Date(offer.start_date);
      if (now < startDate) {
        return NextResponse.json(
          {
            valid: false,
            error: `Coupon "${code}" will be active from ${startDate.toLocaleDateString()}.`,
          },
          { status: 200 }
        );
      }
    }

    // 3. CHECK: minimum order?
    const minOrder = Number(offer.minimum_order ?? offer.min_order_amount ?? 0);
    if (subtotal < minOrder) {
      const diff = Math.max(0, minOrder - subtotal);
      return NextResponse.json(
        {
          valid: false,
          error: `Coupon "${code}" requires a minimum order of ₹${minOrder}. Add ₹${diff} more to your cart.`,
          minOrder,
          currentSubtotal: subtotal,
        },
        { status: 200 }
      );
    }

    // 4. CHECK: calculate discount & maximum discount?
    const discountType =
      offer.discount_type === "percentage" ||
      (offer.discount_percent && Number(offer.discount_percent) > 0)
        ? "percentage"
        : "flat";

    const discountValue = Number(
      discountType === "percentage"
        ? offer.discount_value ?? offer.discount_percent ?? 0
        : offer.discount_value ?? offer.discount_amount ?? 0
    );

    let calculatedDiscount = 0;
    const maxDiscount = offer.max_discount ? Number(offer.max_discount) : null;

    if (discountType === "percentage") {
      const rawPctDiscount = Math.round((subtotal * discountValue) / 100);
      if (maxDiscount && maxDiscount > 0) {
        calculatedDiscount = Math.min(rawPctDiscount, maxDiscount);
      } else {
        calculatedDiscount = rawPctDiscount;
      }
    } else {
      calculatedDiscount = discountValue;
    }

    // Ensure discount does not exceed subtotal
    calculatedDiscount = Math.min(calculatedDiscount, subtotal);

    // 5. CHECK: already used?
    if (userId || phone) {
      try {
        let orderQuery = supabase
          .from("orders")
          .select("id, order_number, coupon_code, notes, status");

        if (userId && !userId.startsWith("user_")) {
          orderQuery = orderQuery.eq("user_id", userId);
        } else if (phone) {
          orderQuery = orderQuery.eq("customer_phone", phone);
        }

        const { data: pastOrders, error: orderErr } = await orderQuery;

        if (!orderErr && pastOrders && pastOrders.length > 0) {
          const alreadyUsed = pastOrders.some((order) => {
            const hasMatchingCode =
              order.coupon_code &&
              order.coupon_code.trim().toUpperCase() === code;
            const hasMatchingNotes =
              order.notes &&
              order.notes.toUpperCase().includes(`COUPON: ${code}`);
            return hasMatchingCode || hasMatchingNotes;
          });

          if (alreadyUsed) {
            return NextResponse.json(
              {
                valid: false,
                error: `You have already used coupon "${code}". This offer is limited to 1 use per customer.`,
              },
              { status: 200 }
            );
          }
        }
      } catch (checkErr) {
        console.warn("Usage limit check notice:", checkErr);
      }
    }

    // All 5 backend checks passed!
    const descriptionText =
      discountType === "percentage"
        ? `${discountValue}% OFF${maxDiscount ? ` (up to ₹${maxDiscount})` : ""}`
        : `Flat ₹${discountValue} OFF`;

    return NextResponse.json({
      success: true,
      valid: true,
      code: offer.code,
      discountType,
      discountValue,
      discountAmount: calculatedDiscount,
      minOrder,
      maxDiscount,
      message: `Coupon "${offer.code}" applied! ${descriptionText} (₹${calculatedDiscount} saved).`,
    });
  } catch (error: any) {
    console.error("Coupon verification API error:", error);
    return NextResponse.json(
      {
        valid: false,
        error: error?.message || "Failed to verify coupon code on server.",
      },
      { status: 500 }
    );
  }
}
