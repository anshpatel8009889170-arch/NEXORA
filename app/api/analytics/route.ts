import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/security/requireAdmin";
import { getRuntimeOrders } from "@/lib/ordersStore";

export interface MostOrderedItem {
  rank: number;
  name: string;
  category: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface AnalyticsData {
  sales: {
    today: number;
    weekly: number;
    monthly: number;
    todayGrowth: number;
    weeklyGrowth: number;
    monthlyGrowth: number;
  };
  orders: {
    totalToday: number;
    totalWeekly: number;
    totalMonthly: number;
    averageOrderValue: number;
    deliveredCount: number;
    pendingCount: number;
  };
  mostOrderedFood: MostOrderedItem[];
  categoryBreakdown: { name: string; percentage: number; amount: number }[];
  paymentBreakdown: { method: string; percentage: number; count: number }[];
  peakHours: { time: string; label: string; percentage: number }[];
}

/**
 * Clean zero state when no orders have been placed yet.
 * In production, genuine zero numbers must always be returned rather than inventing sales.
 */
export const EMPTY_ANALYTICS: AnalyticsData = {
  sales: {
    today: 0,
    weekly: 0,
    monthly: 0,
    todayGrowth: 0,
    weeklyGrowth: 0,
    monthlyGrowth: 0,
  },
  orders: {
    totalToday: 0,
    totalWeekly: 0,
    totalMonthly: 0,
    averageOrderValue: 0,
    deliveredCount: 0,
    pendingCount: 0,
  },
  mostOrderedFood: [],
  categoryBreakdown: [],
  paymentBreakdown: [],
  peakHours: [],
};

/**
 * Isolated demo benchmark for preview testing ONLY when ?demo=true is explicitly set in development.
 */
export const DEMO_BENCHMARK_ANALYTICS: AnalyticsData = {
  sales: {
    today: 12450,
    weekly: 84200,
    monthly: 342800,
    todayGrowth: 14.2,
    weeklyGrowth: 8.6,
    monthlyGrowth: 18.4,
  },
  orders: {
    totalToday: 48,
    totalWeekly: 318,
    totalMonthly: 1290,
    averageOrderValue: 785,
    deliveredCount: 38,
    pendingCount: 6,
  },
  mostOrderedFood: [
    {
      rank: 1,
      name: "Awadhi Royal Dum Biryani",
      category: "Main Course",
      count: 214,
      revenue: 59920,
      percentage: 34,
    },
    {
      rank: 2,
      name: "Truffle Malai Chaap",
      category: "Starters",
      count: 186,
      revenue: 46314,
      percentage: 29,
    },
    {
      rank: 3,
      name: "Dal Bukhara Grand Cru",
      category: "Main Course",
      count: 152,
      revenue: 45448,
      percentage: 24,
    },
    {
      rank: 4,
      name: "Burrata & Truffle Funghi Pizza",
      category: "Woodfire Pizzas",
      count: 128,
      revenue: 38400,
      percentage: 20,
    },
    {
      rank: 5,
      name: "24K Gold Saffron Shahi Tukda",
      category: "Desserts",
      count: 94,
      revenue: 35720,
      percentage: 15,
    },
  ],
  categoryBreakdown: [
    { name: "Main Course", percentage: 42, amount: 143976 },
    { name: "Starters", percentage: 28, amount: 95984 },
    { name: "Woodfire Pizzas", percentage: 18, amount: 61704 },
    { name: "Desserts & Drinks", percentage: 12, amount: 41136 },
  ],
  paymentBreakdown: [
    { method: "Online (PhonePe / UPI)", percentage: 68, count: 877 },
    { method: "Cash on Delivery (COD)", percentage: 32, count: 413 },
  ],
  peakHours: [
    { time: "7:30 PM – 10:30 PM", label: "Dinner Rush", percentage: 64 },
    { time: "12:30 PM – 3:00 PM", label: "Executive Lunch", percentage: 36 },
  ],
};

/**
 * Computes strictly authentic analytics directly from actual orders and order items.
 */
function calculateAnalyticsFromOrders(orders: any[]): AnalyticsData {
  if (!orders || orders.length === 0) {
    return EMPTY_ANALYTICS;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysAgo = now.getTime() - 14 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const sixtyDaysAgo = now.getTime() - 60 * 24 * 60 * 60 * 1000;

  let todaySales = 0;
  let yesterdaySales = 0;
  let weeklySales = 0;
  let prevWeeklySales = 0;
  let monthlySales = 0;
  let prevMonthlySales = 0;

  let totalTodayOrders = 0;
  let totalWeeklyOrders = 0;
  let totalMonthlyOrders = 0;

  let deliveredCount = 0;
  let pendingCount = 0;

  let validOrdersForAov = 0;
  let totalRevenueForAov = 0;

  const dishTally: Record<
    string,
    { name: string; category: string; count: number; revenue: number }
  > = {};
  const categoryTally: Record<string, number> = {};
  const paymentTally: Record<string, number> = {};
  const hourlyTally: Record<number, number> = {};

  for (const ord of orders) {
    const orderTime = new Date(ord.created_at || Date.now()).getTime();
    const amount = Number(ord.total || ord.total_amount || 0);
    const isCancelled = ord.status === "cancelled";

    if (ord.status === "delivered") deliveredCount++;
    if (ord.status === "pending") pendingCount++;

    // Only count non-cancelled orders for revenue calculations
    if (!isCancelled) {
      validOrdersForAov++;
      totalRevenueForAov += amount;

      if (orderTime >= startOfToday) {
        todaySales += amount;
        totalTodayOrders++;
      } else if (orderTime >= startOfYesterday && orderTime < startOfToday) {
        yesterdaySales += amount;
      }

      if (orderTime >= sevenDaysAgo) {
        weeklySales += amount;
        totalWeeklyOrders++;
      } else if (orderTime >= fourteenDaysAgo && orderTime < sevenDaysAgo) {
        prevWeeklySales += amount;
      }

      if (orderTime >= thirtyDaysAgo) {
        monthlySales += amount;
        totalMonthlyOrders++;
      } else if (orderTime >= sixtyDaysAgo && orderTime < thirtyDaysAgo) {
        prevMonthlySales += amount;
      }

      // Dish breakdown from ordered items
      const items = Array.isArray(ord.items) ? ord.items : [];
      for (const it of items) {
        const dishName = it.name || "Signature Delicacy";
        const category = it.category || it.category_name || "Specialties";
        const qty = Number(it.quantity || 1);
        const itemPrice = Number(
          it.price || (qty > 0 ? Math.round(amount / items.length) : 0)
        );
        const itemRev = itemPrice * qty;

        if (!dishTally[dishName]) {
          dishTally[dishName] = { name: dishName, category, count: 0, revenue: 0 };
        }
        dishTally[dishName].count += qty;
        dishTally[dishName].revenue += itemRev;

        categoryTally[category] = (categoryTally[category] || 0) + itemRev;
      }

      // Payment method breakdown
      const pm = (ord.payment_method || "").toLowerCase();
      const cleanPm =
        pm.includes("cod") || pm.includes("cash")
          ? "Cash on Delivery (COD)"
          : "Online (PhonePe / UPI)";
      paymentTally[cleanPm] = (paymentTally[cleanPm] || 0) + 1;

      // Hourly rush breakdown
      const orderDate = new Date(orderTime);
      const hour = orderDate.getHours();
      hourlyTally[hour] = (hourlyTally[hour] || 0) + 1;
    }
  }

  // Calculate percentage growth rates
  const todayGrowth =
    yesterdaySales > 0
      ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100)
      : todaySales > 0
      ? 100
      : 0;
  const weeklyGrowth =
    prevWeeklySales > 0
      ? Math.round(((weeklySales - prevWeeklySales) / prevWeeklySales) * 100)
      : weeklySales > 0
      ? 100
      : 0;
  const monthlyGrowth =
    prevMonthlySales > 0
      ? Math.round(((monthlySales - prevMonthlySales) / prevMonthlySales) * 100)
      : monthlySales > 0
      ? 100
      : 0;

  const averageOrderValue =
    validOrdersForAov > 0 ? Math.round(totalRevenueForAov / validOrdersForAov) : 0;

  // Format most ordered dishes
  const sortedDishes = Object.values(dishTally).sort((a, b) => b.count - a.count);
  const totalItemCount = sortedDishes.reduce((acc, d) => acc + d.count, 0) || 1;
  const mostOrderedFood: MostOrderedItem[] = sortedDishes.slice(0, 5).map((d, index) => ({
    rank: index + 1,
    name: d.name,
    category: d.category,
    count: d.count,
    revenue: d.revenue,
    percentage: Math.round((d.count / totalItemCount) * 100),
  }));

  // Category breakdown
  const totalCatRevenue =
    Object.values(categoryTally).reduce((acc, val) => acc + val, 0) || 1;
  const categoryBreakdown = Object.entries(categoryTally).map(([name, amount]) => ({
    name,
    amount,
    percentage: Math.round((amount / totalCatRevenue) * 100),
  }));

  // Payment breakdown
  const totalPayments =
    Object.values(paymentTally).reduce((acc, val) => acc + val, 0) || 1;
  const paymentBreakdown = Object.entries(paymentTally).map(([method, count]) => ({
    method,
    count,
    percentage: Math.round((count / totalPayments) * 100),
  }));

  // Peak hours
  const lunchCount =
    (hourlyTally[12] || 0) +
    (hourlyTally[13] || 0) +
    (hourlyTally[14] || 0) +
    (hourlyTally[15] || 0);
  const dinnerCount =
    (hourlyTally[19] || 0) +
    (hourlyTally[20] || 0) +
    (hourlyTally[21] || 0) +
    (hourlyTally[22] || 0) +
    (hourlyTally[23] || 0);
  const totalRush = lunchCount + dinnerCount || 1;

  const peakHours =
    lunchCount > 0 || dinnerCount > 0
      ? [
          {
            time: "7:30 PM – 11:00 PM",
            label: "Dinner Rush",
            percentage: Math.round((dinnerCount / totalRush) * 100),
          },
          {
            time: "12:30 PM – 3:30 PM",
            label: "Executive Lunch",
            percentage: Math.round((lunchCount / totalRush) * 100),
          },
        ]
      : [];

  return {
    sales: {
      today: todaySales,
      weekly: weeklySales,
      monthly: monthlySales,
      todayGrowth,
      weeklyGrowth,
      monthlyGrowth,
    },
    orders: {
      totalToday: totalTodayOrders,
      totalWeekly: totalWeeklyOrders,
      totalMonthly: totalMonthlyOrders,
      averageOrderValue,
      deliveredCount,
      pendingCount,
    },
    mostOrderedFood,
    categoryBreakdown,
    paymentBreakdown,
    peakHours,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, ["owner", "admin"]);
    if (!auth.authorized) {
      return auth.response;
    }

    // Explicit demo benchmark mode is only permitted during local non-production previews
    const isDemoRequested = request.nextUrl.searchParams.get("demo") === "true";
    if (isDemoRequested && process.env.NODE_ENV !== "production") {
      return NextResponse.json({
        success: true,
        analytics: DEMO_BENCHMARK_ANALYTICS,
        isDemo: true,
      });
    }

    const supabase = createServerClient({ admin: true });

    // 1. Fetch real orders from database
    const { data: dbOrders, error } = await supabase
      .from("orders")
      .select("id, order_number, total, total_amount, subtotal, status, items, payment_method, created_at")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(dbOrders)) {
      const computed = calculateAnalyticsFromOrders(dbOrders);
      return NextResponse.json({
        success: true,
        analytics: computed,
      });
    }

    // 2. Fallback to active runtime orders (local development when remote DB is offline)
    const runtimeOrders = getRuntimeOrders();
    const computedRuntime = calculateAnalyticsFromOrders(runtimeOrders);

    return NextResponse.json({
      success: true,
      analytics: computedRuntime,
    });
  } catch (error: any) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json({
      success: true,
      analytics: EMPTY_ANALYTICS,
    });
  }
}
