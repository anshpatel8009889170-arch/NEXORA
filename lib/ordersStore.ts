import { OrderStatus } from "@/types/database";

export interface StatusHistoryEntry {
  status: OrderStatus;
  previous_status: OrderStatus;
  changed_by: string;
  changed_by_role: string;
  timestamp: string;
}

export interface StoredOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  total?: number;
  total_amount?: number;
  status: OrderStatus;
  payment_method?: string;
  payment_status?: string;
  status_history: StatusHistoryEntry[];
  items?: Array<{ id: string; name: string; price: number; quantity: number }>;
  created_at: string;
  updated_at: string;
  notes?: string | null;
}

/**
 * Strict Allowed State Transitions (Finite State Machine):
 * pending          → accepted | cancelled
 * accepted         → preparing | cancelled
 * preparing        → ready | cancelled
 * ready            → out_for_delivery | delivered | cancelled
 * out_for_delivery → delivered | cancelled
 * delivered        → TERMINAL (no arbitrary transition without explicit policy)
 * cancelled        → TERMINAL (no arbitrary transition without explicit policy)
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["out_for_delivery", "delivered", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export const TERMINAL_STATUSES: OrderStatus[] = ["delivered", "cancelled"];

export interface ValidationTransitionResult {
  valid: boolean;
  isNoOp?: boolean;
  statusCode?: number;
  error?: string;
}

/**
 * Validates whether an order status transition is allowed based on:
 * 1. Current state in FSM
 * 2. User's administrative role (owner, admin, staff)
 * 3. Terminal state protection policy
 */
export function validateStatusTransition(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
  userRole: string = "staff",
  overridePolicy: boolean = false
): ValidationTransitionResult {
  // 1. Same status is idempotent / no-op
  if (currentStatus === targetStatus) {
    return { valid: true, isNoOp: true };
  }

  // 2. Terminal State Guard
  if (TERMINAL_STATUSES.includes(currentStatus)) {
    // Normal staff cannot alter terminal states under any condition
    if (userRole === "staff") {
      return {
        valid: false,
        statusCode: 409,
        error: `Order is in terminal state '${currentStatus}'. Staff members are not permitted to alter completed or cancelled orders.`,
      };
    }

    // Owner or Admin requires an explicit override policy to reopen a terminal order
    if (userRole === "owner" || userRole === "admin") {
      if (!overridePolicy) {
        return {
          valid: false,
          statusCode: 409,
          error: `Order is in terminal state '${currentStatus}'. Modification requires an explicit administrative override policy ('overridePolicy: true').`,
        };
      }
      // Explicit policy provided by Owner/Admin: allowed
      return { valid: true };
    }

    return {
      valid: false,
      statusCode: 409,
      error: `Order is in terminal state '${currentStatus}' and cannot be modified.`,
    };
  }

  // 3. Normal State Transition Validation
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    return {
      valid: false,
      statusCode: 400,
      error: `Invalid status transition: Cannot change order from '${currentStatus}' to '${targetStatus}'. Allowed next states: ${
        allowed.length > 0 ? allowed.join(", ") : "none (terminal state)"
      }.`,
    };
  }

  return { valid: true };
}

// Initial seeded runtime orders for resilient testing and fallback
const INITIAL_RUNTIME_ORDERS: StoredOrder[] = [
  {
    id: "ord_1048",
    order_number: "NEX-1048",
    customer_name: "Vaibhav Patel",
    customer_phone: "+91 83038 90056",
    total: 847,
    total_amount: 847,
    status: "pending",
    payment_method: "online",
    payment_status: "paid",
    status_history: [
      {
        status: "pending",
        previous_status: "pending",
        changed_by: "system@nexora.luxury",
        changed_by_role: "system",
        timestamp: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "ord_1049",
    order_number: "NEX-1049",
    customer_name: "Ansh Patel",
    customer_phone: "+91 91204 89210",
    total: 1250,
    total_amount: 1250,
    status: "pending",
    payment_method: "cod",
    payment_status: "pending",
    status_history: [
      {
        status: "pending",
        previous_status: "pending",
        changed_by: "system@nexora.luxury",
        changed_by_role: "system",
        timestamp: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "ord_demo_1046",
    order_number: "ORD-1046",
    customer_name: "Rohit Verma",
    customer_phone: "+91 98765 43210",
    total: 1140,
    total_amount: 1140,
    status: "ready",
    payment_method: "online",
    payment_status: "paid",
    status_history: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "ord_demo_1047",
    order_number: "ORD-1047",
    customer_name: "Aanya Singhania",
    customer_phone: "+91 91204 89210",
    total: 1250,
    total_amount: 1250,
    status: "preparing",
    payment_method: "cod",
    payment_status: "pending",
    status_history: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "ord_demo_1048",
    order_number: "ORD-1048",
    customer_name: "Vikram Malhotra",
    customer_phone: "+91 83038 90056",
    total: 999,
    total_amount: 999,
    status: "pending",
    payment_method: "online",
    payment_status: "paid",
    status_history: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Runtime singleton cache on globalThis
const globalForOrders = globalThis as unknown as {
  __nexora_runtime_orders__?: StoredOrder[];
};

if (!globalForOrders.__nexora_runtime_orders__) {
  globalForOrders.__nexora_runtime_orders__ = [...INITIAL_RUNTIME_ORDERS];
}

export function getRuntimeOrders(): StoredOrder[] {
  if (!globalForOrders.__nexora_runtime_orders__) {
    globalForOrders.__nexora_runtime_orders__ = [...INITIAL_RUNTIME_ORDERS];
  }
  return globalForOrders.__nexora_runtime_orders__;
}

export function findRuntimeOrder(orderNumber: string): StoredOrder | undefined {
  if (!orderNumber) return undefined;
  const list = getRuntimeOrders();
  const clean = orderNumber.trim().toUpperCase();
  return list.find((o) => o.order_number.toUpperCase() === clean);
}

export function saveRuntimeOrder(order: StoredOrder): void {
  const list = getRuntimeOrders();
  const clean = order.order_number.trim().toUpperCase();
  const idx = list.findIndex((o) => o.order_number.toUpperCase() === clean);
  if (idx !== -1) {
    list[idx] = { ...order, order_number: clean };
  } else {
    list.unshift({ ...order, order_number: clean });
  }
}

export function updateRuntimeOrderStatus(
  orderNumber: string,
  newStatus: OrderStatus,
  changedBy: string,
  changedByRole: string
): StoredOrder | undefined {
  const list = getRuntimeOrders();
  const clean = orderNumber.trim().toUpperCase();
  const order = list.find((o) => o.order_number.toUpperCase() === clean);
  if (order) {
    const previous = order.status;
    order.status = newStatus;
    order.updated_at = new Date().toISOString();
    if (!order.status_history) order.status_history = [];
    order.status_history.push({
      status: newStatus,
      previous_status: previous,
      changed_by: changedBy,
      changed_by_role: changedByRole,
      timestamp: new Date().toISOString(),
    });
    return order;
  }
  return undefined;
}
