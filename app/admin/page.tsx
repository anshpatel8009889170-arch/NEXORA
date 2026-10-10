"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  FolderTree,
  Users,
  Tag,
  Armchair,
  Star,
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChefHat,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Bike,
  Phone,
  MapPin,
  Flame,
  ArrowRight,
  Check,
  X,
  ArrowDown,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Filter,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  Layers,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { OrderStatus, MenuItem, Category } from "@/types/database";
import { fallbackMenuItems, fallbackCategories } from "@/lib/menuData";

type AdminTab =
  | "dashboard"
  | "orders"
  | "menu"
  | "categories"
  | "customers"
  | "offers"
  | "tables"
  | "reviews"
  | "analytics"
  | "settings";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  name: string;
  loggedInAt: string;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  items: string[];
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: "paid" | "pending";
  time: string;
  address: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  const [orderFilter, setOrderFilter] = useState<string>("all");

  // Sample Live Orders for Management (Matching Phase 18 specifications)
  const [ordersList, setOrdersList] = useState<AdminOrder[]>([
    {
      id: "ord_1048",
      orderNumber: "ORD-1048",
      customerName: "Ansh Patel",
      phone: "+91 83038 90056",
      items: ["2 × Biryani", "1 × Paneer Tikka"],
      total: 847,
      status: "pending",
      paymentMethod: "Online (Razorpay)",
      paymentStatus: "paid",
      time: "Just now",
      address: "Sathigva, Amauli-Fatehpur Road, Near Ankit Internet Cafe",
    },
    {
      id: "ord_2",
      orderNumber: "ORD-1047",
      customerName: "Vaibhav Patel",
      phone: "+91 91204 89210",
      items: ["Burrata & Truffle Funghi Pizza × 1", "24K Gold Saffron Shahi Tukda × 2"],
      total: 1250,
      status: "preparing",
      paymentMethod: "Cash on Delivery",
      paymentStatus: "pending",
      time: "8 mins ago",
      address: "Main Market Commercial Plaza, Amauli Road",
    },
    {
      id: "ord_3",
      orderNumber: "ORD-1046",
      customerName: "Rohit Verma",
      phone: "+91 98765 43210",
      items: ["NEXORA Royal Dal Bukhara × 2", "Garlic Naan × 4"],
      total: 1140,
      status: "ready",
      paymentMethod: "Online (UPI)",
      paymentStatus: "paid",
      time: "18 mins ago",
      address: "Station Road, Amauli",
    },
    {
      id: "ord_4",
      orderNumber: "ORD-1045",
      customerName: "Aanya Singhania",
      phone: "+91 99182 34567",
      items: ["24K Gold Saffron Shahi Tukda × 1"],
      total: 380,
      status: "delivered",
      paymentMethod: "Online (Card)",
      paymentStatus: "paid",
      time: "42 mins ago",
      address: "Civil Lines, Fatehpur",
    },
  ]);

  // ==========================================================
  // PHASE 19 & 20: ADMIN MENU & CATEGORY MANAGEMENT STATE & PERSISTENCE
  // ==========================================================
  const [menuItems, setMenuItems] = useState<MenuItem[]>(fallbackMenuItems);
  const [menuSearch, setMenuSearch] = useState<string>("" );
  const [menuFilterCategory, setMenuFilterCategory] = useState<string>("all");
  const [isMenuModalOpen, setIsMenuModalOpen] = useState<boolean>(false);
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);

  // Category Management State (Phase 20)
  const [categoriesList, setCategoriesList] = useState<Category[]>(fallbackCategories);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Category Form State (Add / Edit)
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
    display_order: 1,
    is_active: true,
  });

  // Modal Form State (Matching Phase 19 fields: Name, Description, Price, Category, Image, Vegetarian, Available, Featured)
  const [dishForm, setDishForm] = useState({
    name: "",
    description: "",
    price: "",
    category_id: fallbackCategories[0]?.id || "11111111-1111-1111-1111-111111111111",
    image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80",
    is_vegetarian: true,
    is_available: true,
    is_featured: false,
  });

  // Auth Verification & Menu/Category Initialization from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nexora_admin_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setAdminUser(parsed);
          setIsLoading(false);
        } catch {}
      } else {
        // Not authenticated -> redirect to /admin/login
        router.push("/admin/login");
        return;
      }

      // Load / Sync Admin Menu from localStorage
      try {
        const storedMenu = localStorage.getItem("nexora_admin_menu");
        if (storedMenu) {
          const parsedMenu = JSON.parse(storedMenu);
          if (Array.isArray(parsedMenu) && parsedMenu.length > 0) {
            setMenuItems(parsedMenu);
          } else {
            localStorage.setItem("nexora_admin_menu", JSON.stringify(fallbackMenuItems));
          }
        } else {
          localStorage.setItem("nexora_admin_menu", JSON.stringify(fallbackMenuItems));
        }
      } catch (err) {
        console.warn("Error syncing admin menu from storage:", err);
      }

      // Load / Sync Admin Categories from localStorage (Phase 20)
      try {
        const storedCats = localStorage.getItem("nexora_admin_categories");
        if (storedCats) {
          const parsedCats = JSON.parse(storedCats);
          if (Array.isArray(parsedCats) && parsedCats.length > 0) {
            setCategoriesList(
              parsedCats.sort((a: Category, b: Category) => a.display_order - b.display_order)
            );
          } else {
            localStorage.setItem("nexora_admin_categories", JSON.stringify(fallbackCategories));
          }
        } else {
          localStorage.setItem("nexora_admin_categories", JSON.stringify(fallbackCategories));
        }
      } catch (err) {
        console.warn("Error syncing admin categories from storage:", err);
      }
    }
  }, [router]);

  // ==========================================================
  // PHASE 20: CATEGORY MANAGEMENT HANDLERS (Add, Edit, Delete, Reorder, Enable/Disable)
  // ==========================================================
  const saveCategoriesToStorage = (updated: Category[]) => {
    const sorted = [...updated].sort((a, b) => a.display_order - b.display_order);
    setCategoriesList(sorted);
    if (typeof window !== "undefined") {
      localStorage.setItem("nexora_admin_categories", JSON.stringify(sorted));
      window.dispatchEvent(new Event("nexora_categories_updated"));
    }
  };

  const handleOpenAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      slug: "",
      description: "",
      display_order: categoriesList.length + 1,
      is_active: true,
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      slug: cat.slug || "",
      description: cat.description || "",
      display_order: cat.display_order,
      is_active: cat.is_active,
    });
    setIsCategoryModalOpen(true);
  };

  const handleToggleCategoryActive = (catId: string) => {
    const updated = categoriesList.map((c) =>
      c.id === catId ? { ...c, is_active: !c.is_active } : c
    );
    saveCategoriesToStorage(updated);
  };

  const handleReorderCategory = (catId: string, direction: "up" | "down") => {
    const sorted = [...categoriesList].sort((a, b) => a.display_order - b.display_order);
    const index = sorted.findIndex((c) => c.id === catId);
    if (index === -1) return;

    if (direction === "up" && index > 0) {
      const prev = sorted[index - 1];
      const curr = sorted[index];
      const tempOrder = prev.display_order;
      prev.display_order = curr.display_order;
      curr.display_order = tempOrder;
      if (prev.display_order === curr.display_order) {
        curr.display_order = index;
        prev.display_order = index + 1;
      }
      saveCategoriesToStorage(sorted);
    } else if (direction === "down" && index < sorted.length - 1) {
      const next = sorted[index + 1];
      const curr = sorted[index];
      const tempOrder = next.display_order;
      next.display_order = curr.display_order;
      curr.display_order = tempOrder;
      if (next.display_order === curr.display_order) {
        curr.display_order = index + 2;
        next.display_order = index + 1;
      }
      saveCategoriesToStorage(sorted);
    }
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    const cleanName = categoryForm.name.trim();
    const cleanSlug = (categoryForm.slug.trim() || cleanName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let updated: Category[];
    if (editingCategory) {
      updated = categoriesList.map((c) =>
        c.id === editingCategory.id
          ? {
              ...c,
              name: cleanName,
              slug: cleanSlug,
              description: categoryForm.description.trim(),
              display_order: Number(categoryForm.display_order) || c.display_order,
              is_active: categoryForm.is_active,
            }
          : c
      );
    } else {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: cleanName,
        slug: cleanSlug,
        description: categoryForm.description.trim(),
        display_order: Number(categoryForm.display_order) || categoriesList.length + 1,
        is_active: categoryForm.is_active,
        created_at: new Date().toISOString(),
      };
      updated = [...categoriesList, newCat];
    }

    saveCategoriesToStorage(updated);
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    const dishCount = menuItems.filter((m) => m.category_id === catId).length;
    let confirmMsg = `Remove category "${catName}"?`;
    if (dishCount > 0) {
      confirmMsg = `Warning: "${catName}" contains ${dishCount} dish(es). Deleting this category will remove it from the menu. Do you wish to continue?`;
    }

    if (confirm(confirmMsg)) {
      const remaining = categoriesList.filter((c) => c.id !== catId);
      const reindexed = remaining.map((c, i) => ({ ...c, display_order: i + 1 }));
      saveCategoriesToStorage(reindexed);
    }
  };

  // Save Menu Changes to State & localStorage (Dispatches custom event for live customer sync)
  const saveMenuToStorage = (updatedList: MenuItem[]) => {
    setMenuItems(updatedList);
    if (typeof window !== "undefined") {
      localStorage.setItem("nexora_admin_menu", JSON.stringify(updatedList));
      window.dispatchEvent(new Event("nexora_menu_updated"));
    }
  };

  const handleOpenAddModal = () => {
    setEditingDish(null);
    setDishForm({
      name: "",
      description: "",
      price: "",
      category_id: fallbackCategories[0]?.id || "11111111-1111-1111-1111-111111111111",
      image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80",
      is_vegetarian: true,
      is_available: true,
      is_featured: false,
    });
    setIsMenuModalOpen(true);
  };

  const handleOpenEditModal = (dish: MenuItem) => {
    setEditingDish(dish);
    setDishForm({
      name: dish.name,
      description: dish.description,
      price: dish.price.toString(),
      category_id: dish.category_id,
      image: dish.image || dish.image_url,
      is_vegetarian: dish.is_vegetarian ?? dish.is_veg ?? true,
      is_available: dish.is_available,
      is_featured: dish.is_featured,
    });
    setIsMenuModalOpen(true);
  };

  const handleToggleAvailability = (dishId: string) => {
    const updated = menuItems.map((item) =>
      item.id === dishId ? { ...item, is_available: !item.is_available } : item
    );
    saveMenuToStorage(updated);
  };

  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishForm.name.trim()) return;
    const priceNum = parseFloat(dishForm.price) || 0;

    let updated: MenuItem[];
    if (editingDish) {
      updated = menuItems.map((item) =>
        item.id === editingDish.id
          ? {
              ...item,
              name: dishForm.name.trim(),
              description: dishForm.description.trim(),
              price: priceNum,
              category_id: dishForm.category_id,
              image: dishForm.image.trim(),
              image_url: dishForm.image.trim(),
              is_vegetarian: dishForm.is_vegetarian,
              is_veg: dishForm.is_vegetarian,
              is_available: dishForm.is_available,
              is_featured: dishForm.is_featured,
              updated_at: new Date().toISOString(),
            }
          : item
      );
    } else {
      const newId = `item-${Date.now()}`;
      const newSlug = dishForm.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const newDish: MenuItem = {
        id: newId,
        slug: newSlug,
        name: dishForm.name.trim(),
        description: dishForm.description.trim(),
        price: priceNum,
        category_id: dishForm.category_id,
        image: dishForm.image.trim(),
        image_url: dishForm.image.trim(),
        is_vegetarian: dishForm.is_vegetarian,
        is_veg: dishForm.is_vegetarian,
        is_available: dishForm.is_available,
        is_featured: dishForm.is_featured,
        spice_level: "medium",
        prep_time_minutes: 20,
        calories: 350,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      updated = [newDish, ...menuItems];
    }

    saveMenuToStorage(updated);
    setIsMenuModalOpen(false);
    setEditingDish(null);
  };

  const handleDeleteDish = (dishId: string, dishName: string) => {
    if (confirm(`Remove "${dishName}" from NEXORA menu?`)) {
      const updated = menuItems.filter((item) => item.id !== dishId);
      saveMenuToStorage(updated);
    }
  };

  const handleAdminLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("nexora_admin_user");
      localStorage.removeItem("nexora_admin_role");
    }
    router.push("/admin/login");
  };

  // Status Change Handler
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setOrdersList((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    const targetOrder = ordersList.find((o) => o.id === orderId);
    if (targetOrder) {
      try {
        await fetch("/api/orders/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: targetOrder.orderNumber,
            status: newStatus,
          }),
        });
      } catch (err) {
        console.warn("Status sync notice:", err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-[#d4af37] text-sm">
        Verifying administrator authorization...
      </div>
    );
  }

  // Sidebar Items Matching User Specification Exactly
  const sidebarItems: { id: AdminTab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "menu", label: "Menu", icon: UtensilsCrossed },
    { id: "categories", label: "Categories", icon: FolderTree },
    { id: "customers", label: "Customers", icon: Users },
    { id: "offers", label: "Offers", icon: Tag },
    { id: "tables", label: "Tables", icon: Armchair },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)] flex flex-col selection:bg-[#d4af37]/30 selection:text-white">
      {/* ==============================================================
          TOP HEADER: Dashboard Bar
          ============================================================== */}
      <header className="border-b border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 border border-[#d4af37] text-[#d4af37] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-base tracking-wide text-[var(--text-main)]">
                Dashboard
              </h1>
              <p className="text-[10px] uppercase tracking-wider text-[#d4af37] font-semibold">
                NEXORA Restaurant Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-[var(--text-main)]">
                {adminUser?.name || "NEXORA Admin"}
              </p>
              <p className="text-[10px] text-[var(--text-sub)] font-mono">
                {adminUser?.email || "nexora67@gmail.com"}
              </p>
            </div>

            <Link
              href="/"
              target="_blank"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-sub)] hover:text-[#d4af37] hover:bg-white/5 border border-[var(--card-border)] transition-all flex items-center gap-1.5 hidden md:flex"
            >
              <span>Customer View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={handleAdminLogout}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ==============================================================
          MAIN CONTAINER: 2-COLUMN LAYOUT (Sidebar + Content)
          ============================================================== */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto flex flex-col md:flex-row">
        {/* ============================================================
            LEFT SIDEBAR
            Orders, Menu, Categories, Customers, Offers, Tables, Reviews, Analytics, Settings
            ============================================================ */}
        <aside className="w-full md:w-64 border-r border-[var(--card-border)] bg-[var(--section-alt)] p-4 flex flex-col justify-between shrink-0">
          <nav className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-sub-light)] px-3 py-2 block font-semibold">
              Management Menu
            </span>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                    isActive
                      ? "bg-gold-gradient text-black font-bold shadow-md"
                      : "text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </span>
                  {item.id === "orders" && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                        isActive
                          ? "bg-black text-[#d4af37]"
                          : "bg-[#d4af37]/20 text-[#d4af37]"
                      }`}
                    >
                      6
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-[var(--card-border)] text-[11px] text-[var(--text-sub)] space-y-1 px-2">
            <p className="font-semibold text-[var(--text-main)]">NEXORA Fine Dining</p>
            <p className="text-[10px]">Sathigva, Amauli-Fatehpur Road</p>
          </div>
        </aside>

        {/* ============================================================
            RIGHT MAIN CONTENT AREA
            ============================================================ */}
        <main className="flex-1 p-6 sm:p-8 space-y-8 overflow-y-auto">
          {/* ==========================================================
              TAB: DASHBOARD (MAIN SCREEN MATCHING USER SPECIFICATION)
              Today's Revenue: ₹12,450
              Orders: 48
              Pending: 6
              ========================================================== */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* 3 Core Metric Cards Specified by User */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* 1. Today's Revenue: ₹12,450 */}
                <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[#d4af37]/30 shadow-xl space-y-3 gold-glow-sm">
                  <div className="flex items-center justify-between text-xs text-[var(--text-sub)]">
                    <span className="uppercase tracking-wider font-semibold">
                      Today&apos;s Revenue
                    </span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-3xl sm:text-4xl font-serif font-bold text-gold-gradient">
                    ₹12,450
                  </p>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    +14.2% higher than yesterday
                  </p>
                </div>

                {/* 2. Orders: 48 */}
                <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl space-y-3">
                  <div className="flex items-center justify-between text-xs text-[var(--text-sub)]">
                    <span className="uppercase tracking-wider font-semibold">
                      Orders
                    </span>
                    <ShoppingBag className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <p className="text-3xl sm:text-4xl font-serif font-bold text-[var(--text-main)]">
                    48
                  </p>
                  <p className="text-[11px] text-[var(--text-sub)]">
                    42 Delivered &bull; 6 In Progress
                  </p>
                </div>

                {/* 3. Pending: 6 */}
                <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-amber-500/30 shadow-xl space-y-3">
                  <div className="flex items-center justify-between text-xs text-[var(--text-sub)]">
                    <span className="uppercase tracking-wider font-semibold text-amber-400">
                      Pending
                    </span>
                    <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                  </div>
                  <p className="text-3xl sm:text-4xl font-serif font-bold text-amber-400">
                    6
                  </p>
                  <p className="text-[11px] text-[var(--text-sub)]">
                    Requires immediate kitchen attention
                  </p>
                </div>
              </div>

              {/* ==============================================================
                  PHASE 18 — DASHBOARD NEW ORDERS SECTION
                  ============================================================== */}
              <div className="space-y-6">
                <div className="p-6 sm:p-7 rounded-3xl bg-[var(--card-bg)] border border-[#d4af37]/40 shadow-xl space-y-6 gold-glow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                        <Flame className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.25em] text-amber-400 font-bold block">
                          Incoming Queue
                        </span>
                        <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">
                          NEW ORDERS
                        </h2>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("orders")}
                      className="text-xs text-[#d4af37] hover:underline flex items-center gap-1 font-semibold uppercase tracking-wider"
                    >
                      <span>Pipeline Management</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Filter only new/pending orders, or show empty notice */}
                  {ordersList.filter((o) => o.status === "pending").length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ordersList
                        .filter((o) => o.status === "pending")
                        .map((ord) => (
                          <div
                            key={ord.id}
                            className="p-5 rounded-2xl bg-[var(--section-alt)] border-2 border-[#d4af37]/50 shadow-md space-y-4 hover:border-[#d4af37] transition-all"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-mono font-bold text-lg text-[var(--text-main)] block">
                                  #{ord.orderNumber.replace(/^ORD-/, "")}
                                </span>
                                <span className="text-[11px] text-[var(--text-sub)]">
                                  {ord.customerName} &bull; {ord.time}
                                </span>
                              </div>
                              <span className="text-xl font-serif font-bold text-gold-gradient">
                                {formatCurrency(ord.total)}
                              </span>
                            </div>

                            {/* Dishes List (Matches user specification: 2 x Biryani, 1 x Paneer Tikka) */}
                            <div className="py-2.5 px-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-1">
                              {ord.items.map((item, idx) => (
                                <p
                                  key={idx}
                                  className="text-xs font-semibold text-[var(--text-main)]"
                                >
                                  {item}
                                </p>
                              ))}
                            </div>

                            <p className="text-[11px] text-[var(--text-sub-light)] flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#d4af37] shrink-0" />
                              <span className="line-clamp-1">{ord.address}</span>
                            </p>

                            {/* Two Primary Action Buttons: [ ACCEPT ] & [ REJECT ] */}
                            <div className="grid grid-cols-2 gap-2.5 pt-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.id, "accepted")}
                                className="py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>ACCEPT</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.id, "cancelled")}
                                className="py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-[var(--card-bg)] text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                              >
                                <X className="w-4 h-4" />
                                <span>REJECT</span>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-2">
                      <p className="text-xs text-[var(--text-sub)]">
                        No pending new orders. All orders have been accepted!
                      </p>
                      <button
                        type="button"
                        onClick={() => handleUpdateOrderStatus("ord_1048", "pending")}
                        className="text-xs text-[#d4af37] hover:underline"
                      >
                        Reset Demo #1048 to New
                      </button>
                    </div>
                  )}
                </div>

                {/* Live In-Progress Orders (Accepted, Preparing, Ready) */}
                <div className="p-6 sm:p-7 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
                    <h2 className="text-base font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-[#d4af37]" />
                      <span>In-Progress Kitchen Orders</span>
                    </h2>
                    <span className="text-xs text-[#d4af37] font-semibold uppercase tracking-wider">
                      Live Kitchen
                    </span>
                  </div>

                  <div className="space-y-3">
                    {ordersList
                      .filter((o) => o.status !== "pending" && o.status !== "cancelled")
                      .map((ord) => (
                        <div
                          key={ord.id}
                          className="p-4 sm:p-5 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono font-bold text-sm text-[var(--text-main)]">
                                #{ord.orderNumber.replace(/^ORD-/, "")}
                              </span>
                              <span className="text-xs text-[var(--text-sub)]">
                                &bull; {ord.time}
                              </span>

                              {/* Current Stage Badge */}
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  ord.status === "accepted"
                                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                    : ord.status === "preparing"
                                    ? "bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/40"
                                    : ord.status === "ready"
                                    ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                    : ord.status === "out_for_delivery"
                                    ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                                    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                }`}
                              >
                                {ord.status.replace(/_/g, " ")}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-[var(--text-main)]">
                              {ord.items.join(", ")}
                            </p>
                            <p className="text-[11px] text-[var(--text-sub)]">
                              {ord.customerName} ({ord.phone}) &bull;{" "}
                              <span className="text-[#d4af37] font-semibold">
                                {formatCurrency(ord.total)}
                              </span>
                            </p>
                          </div>

                          {/* Next Transition Action Button */}
                          <div className="flex items-center gap-2">
                            {ord.status === "accepted" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.id, "preparing")}
                                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 shadow-md flex items-center gap-1.5"
                              >
                                <ChefHat className="w-3.5 h-3.5" />
                                <span>PREPARING</span>
                              </button>
                            )}

                            {ord.status === "preparing" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.id, "ready")}
                                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-500 text-white hover:bg-blue-600 shadow-md flex items-center gap-1.5"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>READY</span>
                              </button>
                            )}

                            {ord.status === "ready" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.id, "out_for_delivery")}
                                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-purple-500 text-white hover:bg-purple-600 shadow-md flex items-center gap-1.5"
                              >
                                <Bike className="w-3.5 h-3.5" />
                                <span>OUT FOR DELIVERY</span>
                              </button>
                            )}

                            {ord.status === "out_for_delivery" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.id, "delivered")}
                                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500 text-black hover:bg-emerald-400 shadow-md flex items-center gap-1.5"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>DELIVERED</span>
                              </button>
                            )}

                            {ord.status === "delivered" && (
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Fulfilled
                              </span>
                            )}

                            <Link
                              href={`/track-order?orderId=${ord.orderNumber}`}
                              className="p-2 rounded-xl bg-[var(--card-bg)] text-[var(--text-sub)] hover:text-[#d4af37] border border-[var(--card-border)]"
                              title="Customer live view"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB: ORDERS (FULL KITCHEN LIFECYCLE MANAGEMENT)
              ========================================================== */}
          {activeTab === "orders" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Lifecycle Breadcrumb Overview */}
              <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="font-bold text-amber-400">NEW</span>
                <span className="text-[var(--text-sub-light)]">&rarr;</span>
                <span className="font-bold text-amber-300">ACCEPTED</span>
                <span className="text-[var(--text-sub-light)]">&rarr;</span>
                <span className="font-bold text-[#d4af37]">PREPARING</span>
                <span className="text-[var(--text-sub-light)]">&rarr;</span>
                <span className="font-bold text-blue-400">READY</span>
                <span className="text-[var(--text-sub-light)]">&rarr;</span>
                <span className="font-bold text-purple-400">OUT FOR DELIVERY</span>
                <span className="text-[var(--text-sub-light)]">&rarr;</span>
                <span className="font-bold text-emerald-400">DELIVERED</span>
              </div>

              {/* Stage Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: "all", label: "All Orders" },
                  { key: "pending", label: "New Orders" },
                  { key: "accepted", label: "Accepted" },
                  { key: "preparing", label: "Preparing" },
                  { key: "ready", label: "Ready" },
                  { key: "out_for_delivery", label: "Out for Delivery" },
                  { key: "delivered", label: "Delivered" },
                ].map((f) => {
                  const count =
                    f.key === "all"
                      ? ordersList.length
                      : ordersList.filter((o) => o.status === f.key).length;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setOrderFilter(f.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                        orderFilter === f.key
                          ? "bg-gold-gradient text-black font-bold shadow-sm"
                          : "bg-[var(--card-bg)] text-[var(--text-sub)] border border-[var(--card-border)] hover:border-[#d4af37]"
                      }`}
                    >
                      {f.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Filtered Orders List */}
              <div className="space-y-3">
                {ordersList
                  .filter((o) => orderFilter === "all" || o.status === orderFilter)
                  .map((ord) => (
                    <div
                      key={ord.id}
                      className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm hover:border-[#d4af37]/40 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-base text-[var(--text-main)]">
                            #{ord.orderNumber.replace(/^ORD-/, "")}
                          </span>
                          <span className="text-xs text-[var(--text-sub)]">&bull; {ord.time}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              ord.status === "pending"
                                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                : ord.status === "accepted"
                                ? "bg-amber-400/15 text-amber-300 border-amber-400/30"
                                : ord.status === "preparing"
                                ? "bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/40"
                                : ord.status === "ready"
                                ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                : ord.status === "out_for_delivery"
                                ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                                : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            {ord.status.replace(/_/g, " ")}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-[var(--text-main)]">
                          {ord.items.join(" &bull; ")}
                        </p>
                        <p className="text-xs text-[var(--text-sub)]">
                          Customer: {ord.customerName} ({ord.phone}) &bull; {ord.paymentMethod}
                        </p>
                        <p className="text-[11px] text-[var(--text-sub-light)] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#d4af37] shrink-0" />
                          <span>{ord.address}</span>
                        </p>
                      </div>

                      {/* Right Lifecycle Advancement Controls */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-serif font-bold text-gold-gradient text-lg block">
                            {formatCurrency(ord.total)}
                          </span>
                          <span className="text-[10px] text-[var(--text-sub)] uppercase">
                            {ord.paymentStatus}
                          </span>
                        </div>

                        {/* Interactive Transition Buttons */}
                        {ord.status === "pending" && (
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(ord.id, "accepted")}
                              className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 shadow-sm"
                            >
                              ACCEPT
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(ord.id, "cancelled")}
                              className="px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                            >
                              REJECT
                            </button>
                          </div>
                        )}

                        {ord.status === "accepted" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(ord.id, "preparing")}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 shadow-sm flex items-center gap-1.5"
                          >
                            <ChefHat className="w-3.5 h-3.5" />
                            <span>PREPARING</span>
                          </button>
                        )}

                        {ord.status === "preparing" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(ord.id, "ready")}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-500 text-white hover:bg-blue-600 shadow-sm flex items-center gap-1.5"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>READY</span>
                          </button>
                        )}

                        {ord.status === "ready" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(ord.id, "out_for_delivery")}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-purple-500 text-white hover:bg-purple-600 shadow-sm flex items-center gap-1.5"
                          >
                            <Bike className="w-3.5 h-3.5" />
                            <span>OUT FOR DELIVERY</span>
                          </button>
                        )}

                        {ord.status === "out_for_delivery" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(ord.id, "delivered")}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500 text-black hover:bg-emerald-400 shadow-sm flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>DELIVERED</span>
                          </button>
                        )}

                        {ord.status === "delivered" && (
                          <span className="text-xs font-bold text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completed</span>
                          </span>
                        )}

                        <Link
                          href={`/track-order?orderId=${ord.orderNumber}`}
                          className="px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-sub)] hover:text-[#d4af37] bg-[var(--section-alt)] border border-[var(--card-border)]"
                          title="View customer tracking"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB: MENU (PHASE 19: 100% PURE VEG GOURMET MANAGEMENT)
              ========================================================== */}
          {activeTab === "menu" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header Bar matching prompt: MENU MANAGEMENT + Add Item */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-[var(--text-main)] tracking-wide">
                    MENU MANAGEMENT
                  </h2>
                  <p className="text-xs text-[var(--text-sub)]">
                    Owner Direct Control &bull; Live dish pricing, real-time availability & pure-veg catalogue. Owner ko code touch nahi karna pade.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>+ Add Item</span>
                </button>
              </div>

              {/* Quick Summary KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                  <span className="text-[11px] text-[var(--text-sub)] uppercase tracking-wider block">Total Dishes</span>
                  <span className="text-xl font-serif font-bold text-[var(--text-main)]">{menuItems.length}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                  <span className="text-[11px] text-[var(--text-sub)] uppercase tracking-wider block">Available</span>
                  <span className="text-xl font-serif font-bold text-emerald-400">
                    {menuItems.filter((i) => i.is_available).length}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                  <span className="text-[11px] text-[var(--text-sub)] uppercase tracking-wider block">Disabled</span>
                  <span className="text-xl font-serif font-bold text-rose-400">
                    {menuItems.filter((i) => !i.is_available).length}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                  <span className="text-[11px] text-[var(--text-sub)] uppercase tracking-wider block">Featured</span>
                  <span className="text-xl font-serif font-bold text-[#d4af37]">
                    {menuItems.filter((i) => i.is_featured).length}
                  </span>
                </div>
              </div>

              {/* Filters & Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[var(--text-sub)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    placeholder="Search dish by name or description..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-xs text-[var(--text-main)] placeholder-[var(--text-sub)] focus:outline-none focus:border-[#d4af37]"
                  />
                  {menuSearch && (
                    <button
                      type="button"
                      onClick={() => setMenuSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-sub)] hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Filter Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  <button
                    type="button"
                    onClick={() => setMenuFilterCategory("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shrink-0 ${
                      menuFilterCategory === "all"
                        ? "bg-gold-gradient text-black font-bold shadow-sm"
                        : "bg-[var(--card-bg)] text-[var(--text-sub)] border border-[var(--card-border)] hover:border-[#d4af37]"
                    }`}
                  >
                    All ({menuItems.length})
                  </button>
                  {categoriesList.map((c) => {
                    const count = menuItems.filter((i) => i.category_id === c.id).length;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setMenuFilterCategory(c.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shrink-0 ${
                          menuFilterCategory === c.id
                            ? "bg-gold-gradient text-black font-bold shadow-sm"
                            : "bg-[var(--card-bg)] text-[var(--text-sub)] border border-[var(--card-border)] hover:border-[#d4af37]"
                        }`}
                      >
                        {c.name.replace("Royal ", "").replace("Woodfire ", "")} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dish Cards Grid (Matching: Paneer Tikka / ₹249 / Available ✓ / [Edit] [Disable]) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems
                  .filter((dish) => {
                    if (menuFilterCategory !== "all" && dish.category_id !== menuFilterCategory) {
                      return false;
                    }
                    if (menuSearch.trim()) {
                      const q = menuSearch.toLowerCase().trim();
                      return (
                        dish.name.toLowerCase().includes(q) ||
                        dish.description.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .map((dish) => {
                    const categoryName =
                      categoriesList.find((c) => c.id === dish.category_id)?.name ||
                      "Signature Dish";
                    const isAvailable = dish.is_available;

                    return (
                      <div
                        key={dish.id}
                        className={`p-5 rounded-2xl bg-[var(--card-bg)] border transition-all duration-200 flex flex-col justify-between gap-4 shadow-sm hover:border-[#d4af37]/60 ${
                          isAvailable
                            ? "border-[var(--card-border)]"
                            : "border-rose-500/25 opacity-80 bg-rose-950/5"
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Image & Badges */}
                          <div className="relative w-full h-44 rounded-xl overflow-hidden bg-black/40 border border-white/5">
                            <Image
                              src={dish.image || dish.image_url}
                              alt={dish.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />

                            {/* 100% Pure Veg Badge */}
                            <div className="absolute top-2.5 left-2.5 bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1.5 shadow-md">
                              <div className="w-3 h-3 rounded-sm border border-green-500 flex items-center justify-center p-[2px]">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              </div>
                              <span className="text-[10px] uppercase font-bold text-green-400">Pure Veg</span>
                            </div>

                            {/* Chef Special Highlight */}
                            {dish.is_featured && (
                              <div className="absolute top-2.5 right-2.5 bg-gold-gradient text-black text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                <span>Featured</span>
                              </div>
                            )}

                            {/* Category Badge on Bottom Left */}
                            <div className="absolute bottom-2 left-2.5 text-[10px] text-white/90 font-medium bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-white/10">
                              {categoryName}
                            </div>
                          </div>

                          {/* Dish Name & Price (Phase 19 specification: Paneer Tikka / ₹249) */}
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-serif font-bold text-base text-[var(--text-main)] leading-snug">
                                {dish.name}
                              </h3>
                              <span className="font-serif font-bold text-gold-gradient text-lg shrink-0">
                                {formatCurrency(dish.price)}
                              </span>
                            </div>

                            <p className="text-xs text-[var(--text-sub)] line-clamp-2 leading-relaxed">
                              {dish.description}
                            </p>
                          </div>

                          {/* Availability Status (Phase 19 specification: Available ✓) */}
                          <div className="flex items-center justify-between pt-1">
                            {isAvailable ? (
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Available ✓</span>
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/30">
                                <X className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Disabled</span>
                              </span>
                            )}

                            <span className="text-[10px] text-[var(--text-sub-light)] font-mono">
                              ID: #{dish.id.slice(-6)}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons (Phase 19 specification: [Edit] [Disable]) */}
                        <div className="pt-3 border-t border-[var(--card-border)] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {/* [Edit] Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(dish)}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-main)] bg-[var(--section-alt)] hover:bg-[#d4af37]/15 hover:text-[#d4af37] border border-[var(--card-border)] hover:border-[#d4af37]/40 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            {/* [Disable] / [Enable] Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleAvailability(dish.id)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                                isAvailable
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                                  : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25"
                              }`}
                            >
                              {isAvailable ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Disable</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Enable</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <Link
                              href={`/menu/${dish.slug || dish.id}`}
                              target="_blank"
                              className="p-2 rounded-xl text-[var(--text-sub)] hover:text-[#d4af37] hover:bg-[var(--section-alt)] transition-colors"
                              title="Customer live preview"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleDeleteDish(dish.id, dish.name)}
                              className="p-2 rounded-xl text-[var(--text-sub-light)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete dish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB: CATEGORIES (PHASE 20: CATEGORY MANAGEMENT)
              ========================================================== */}
          {activeTab === "categories" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header Bar matching prompt: Categories + Add */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-[var(--text-main)] tracking-wide">
                    CATEGORY MANAGEMENT
                  </h2>
                  <p className="text-xs text-[var(--text-sub)]">
                    Curate courses (Starters, Main Course, Chinese, Pizza, Desserts, Drinks), reorder, edit, and toggle visibility.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddCategoryModal}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>+ Add Category</span>
                </button>
              </div>

              {/* Quick Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                  <span className="text-[11px] text-[var(--text-sub)] uppercase tracking-wider block">Total Categories</span>
                  <span className="text-xl font-serif font-bold text-[var(--text-main)]">{categoriesList.length}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                  <span className="text-[11px] text-[var(--text-sub)] uppercase tracking-wider block">Active Courses</span>
                  <span className="text-xl font-serif font-bold text-emerald-400">
                    {categoriesList.filter((c) => c.is_active).length}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                  <span className="text-[11px] text-[var(--text-sub)] uppercase tracking-wider block">Disabled</span>
                  <span className="text-xl font-serif font-bold text-rose-400">
                    {categoriesList.filter((c) => !c.is_active).length}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                  <span className="text-[11px] text-[var(--text-sub)] uppercase tracking-wider block">Mapped Dishes</span>
                  <span className="text-xl font-serif font-bold text-[#d4af37]">{menuItems.length}</span>
                </div>
              </div>

              {/* Category Cards List (Sorted by display_order) */}
              <div className="space-y-3">
                {categoriesList
                  .slice()
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((cat, idx, arr) => {
                    const dishCount = menuItems.filter((i) => i.category_id === cat.id).length;
                    const isFirst = idx === 0;
                    const isLast = idx === arr.length - 1;

                    return (
                      <div
                        key={cat.id}
                        className={`p-5 rounded-2xl bg-[var(--card-bg)] border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-[#d4af37]/60 ${
                          cat.is_active
                            ? "border-[var(--card-border)]"
                            : "border-rose-500/25 opacity-75 bg-rose-950/5"
                        }`}
                      >
                        {/* Left: Reorder Controls, Sequence & Details */}
                        <div className="flex items-start sm:items-center gap-4">
                          {/* Reorder Buttons (Up / Down) */}
                          <div className="flex sm:flex-col items-center gap-1 shrink-0 bg-[var(--section-alt)] p-1 rounded-xl border border-[var(--card-border)]">
                            <button
                              type="button"
                              onClick={() => handleReorderCategory(cat.id, "up")}
                              disabled={isFirst}
                              title="Move Up"
                              className="p-1 rounded-lg text-[var(--text-sub)] hover:text-[#d4af37] hover:bg-[#d4af37]/15 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-[var(--text-sub)] cursor-pointer disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <span className="font-mono font-bold text-xs text-[#d4af37] px-1 min-w-[20px] text-center">
                              #{cat.display_order}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleReorderCategory(cat.id, "down")}
                              disabled={isLast}
                              title="Move Down"
                              className="p-1 rounded-lg text-[var(--text-sub)] hover:text-[#d4af37] hover:bg-[#d4af37]/15 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-[var(--text-sub)] cursor-pointer disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Category Details */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h3 className="font-serif font-bold text-lg text-[var(--text-main)]">
                                {cat.name}
                              </h3>
                              <span className="font-mono text-[11px] text-[var(--text-sub-light)] bg-[var(--section-alt)] px-2 py-0.5 rounded border border-[var(--card-border)]">
                                slug: /{cat.slug || cat.id}
                              </span>
                              <span className="text-[11px] font-semibold text-[#d4af37] bg-[#d4af37]/10 px-2.5 py-0.5 rounded-full border border-[#d4af37]/30">
                                {dishCount} {dishCount === 1 ? "dish" : "dishes"}
                              </span>
                            </div>

                            {cat.description && (
                              <p className="text-xs text-[var(--text-sub)] font-light leading-relaxed max-w-2xl">
                                {cat.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Status Badge & Actions (Edit, Enable/Disable, Delete) */}
                        <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--card-border)]">
                          {/* Status Badge */}
                          {cat.is_active ? (
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Enabled ✓</span>
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30">
                              <X className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Disabled</span>
                            </span>
                          )}

                          {/* Action Buttons: [Edit] [Disable/Enable] [Delete] */}
                          <div className="flex items-center gap-2">
                            {/* [Edit] */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditCategoryModal(cat)}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-main)] bg-[var(--section-alt)] hover:bg-[#d4af37]/15 hover:text-[#d4af37] border border-[var(--card-border)] hover:border-[#d4af37]/40 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            {/* [Enable / Disable] */}
                            <button
                              type="button"
                              onClick={() => handleToggleCategoryActive(cat.id)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                                cat.is_active
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                                  : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25"
                              }`}
                            >
                              {cat.is_active ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Disable</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Enable</span>
                                </>
                              )}
                            </button>

                            {/* [Delete] */}
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="p-2 rounded-xl text-[var(--text-sub-light)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB: CUSTOMERS
              ========================================================== */}
          {activeTab === "customers" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-[var(--card-border)]">
                <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">
                  Registered Customers
                </h2>
                <p className="text-xs text-[var(--text-sub)]">
                  Verified customer directory and dining profiles.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { name: "Ansh Patel", phone: "+91 83038 90056", orders: 12, tier: "Gold Guest" },
                  { name: "Vaibhav Patel", phone: "+91 91204 89210", orders: 8, tier: "Gold Guest" },
                  { name: "Aanya Singhania", phone: "+91 99182 34567", orders: 4, tier: "Regular" },
                ].map((cust, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--text-main)]">
                        {cust.name}
                      </h4>
                      <p className="text-xs text-[var(--text-sub)] font-mono">
                        {cust.phone} &bull; {cust.orders} Orders placed
                      </p>
                    </div>
                    <span className="text-xs text-[#d4af37] font-semibold">
                      {cust.tier}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB: OFFERS
              ========================================================== */}
          {activeTab === "offers" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-[var(--card-border)]">
                <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">
                  Promotions & Coupon Offers
                </h2>
                <p className="text-xs text-[var(--text-sub)]">
                  Active discounts applicable on checkout and cart.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[#d4af37]/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-base text-[#d4af37]">
                      WELCOME50
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-sub)]">
                    Flat ₹50 OFF on first order above ₹300.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-base text-[var(--text-main)]">
                      ROYAL100
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-sub)]">
                    Flat ₹100 OFF on banquet and luxury party orders above ₹999.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB: TABLES
              ========================================================== */}
          {activeTab === "tables" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-[var(--card-border)]">
                <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">
                  Dine-In Table Status
                </h2>
                <p className="text-xs text-[var(--text-sub)]">
                  12 Restaurant tables reservation and seating map.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => {
                  const isOccupied = num === 3 || num === 7;
                  const isReserved = num === 5;
                  return (
                    <div
                      key={num}
                      className={`p-4 rounded-2xl border text-center space-y-1.5 ${
                        isOccupied
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                          : isReserved
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                          : "bg-[var(--card-bg)] border-[var(--card-border)] text-emerald-400"
                      }`}
                    >
                      <Armchair className="w-5 h-5 mx-auto" />
                      <p className="text-xs font-bold text-[var(--text-main)]">
                        Table {num}
                      </p>
                      <span className="text-[10px] font-semibold uppercase tracking-wider block">
                        {isOccupied ? "Occupied" : isReserved ? "Reserved" : "Available"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB: REVIEWS
              ========================================================== */}
          {activeTab === "reviews" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-[var(--card-border)]">
                <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">
                  Guest Reviews & Ratings
                </h2>
                <p className="text-xs text-[var(--text-sub)]">
                  Verified patron feedback across all dishes.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    name: "Aanya Singhania",
                    dish: "24K Gold Saffron Shahi Tukda",
                    comment: "Finest dessert in North India. Truly authentic royal gastronomy.",
                    rating: 5,
                  },
                  {
                    name: "Rohit Verma",
                    dish: "Burrata & Truffle Funghi Pizza",
                    comment: "Thermal express delivery arrived steaming hot. Sourdough crust is world-class.",
                    rating: 5,
                  },
                ].map((rev, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-main)]">
                        {rev.name} &bull; <span className="text-[#d4af37]">{rev.dish}</span>
                      </span>
                      <div className="flex items-center text-[#d4af37]">
                        {[...Array(rev.rating)].map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-sub)] italic font-light">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB: ANALYTICS
              ========================================================== */}
          {activeTab === "analytics" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-[var(--card-border)]">
                <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">
                  Restaurant Analytics & Insights
                </h2>
                <p className="text-xs text-[var(--text-sub)]">
                  Daily revenue, orders volume, and popular dish metrics.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-4">
                <h3 className="text-sm font-semibold text-[var(--text-main)]">
                  Top Selling Dishes
                </h3>
                <div className="space-y-3">
                  {[
                    { name: "Truffle Malai Paneer Tikka", count: "142 orders", revenue: "₹62,480" },
                    { name: "NEXORA Royal Dal Bukhara", count: "128 orders", revenue: "₹60,160" },
                    { name: "Burrata & Truffle Funghi Pizza", count: "89 orders", revenue: "₹54,290" },
                    { name: "24K Gold Saffron Shahi Tukda", count: "76 orders", revenue: "₹24,320" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--section-alt)] text-xs"
                    >
                      <span className="font-medium text-[var(--text-main)]">{item.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-[var(--text-sub)]">{item.count}</span>
                        <span className="font-serif font-bold text-gold-gradient">
                          {item.revenue}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB: SETTINGS
              ========================================================== */}
          {activeTab === "settings" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-[var(--card-border)]">
                <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">
                  Restaurant Settings
                </h2>
                <p className="text-xs text-[var(--text-sub)]">
                  Official contact, landmark address, and business hours.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-4 text-xs">
                <div>
                  <span className="text-[var(--text-sub)] block">Official Address:</span>
                  <p className="font-semibold text-[var(--text-main)] pt-0.5">
                    Sathigva, Amauli-Fatehpur Road, Near Ankit Internet Cafe And Janseva Kendra
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-sub)] block">Support Phone Numbers:</span>
                  <p className="font-mono text-[var(--text-main)] pt-0.5">
                    Restaurant Staff: +91 83038 90056 &bull; Delivery Boy: +91 91204 89210
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-sub)] block">Official Email:</span>
                  <p className="font-mono text-[var(--text-main)] pt-0.5">
                    vaibhavpatel8543@gmail.com
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==============================================================
          PHASE 19 MODAL: ADD / EDIT MENU ITEM (Owner No-Code System)
          ============================================================== */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--card-bg)] border border-[#d4af37]/40 shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)]">
              <div>
                <h3 className="text-xl font-serif font-bold text-[var(--text-main)]">
                  {editingDish ? `Edit Item: ${editingDish.name}` : "Add New Menu Item"}
                </h3>
                <p className="text-xs text-[var(--text-sub)]">
                  Changes update immediately on the customer menu without touching code.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuModalOpen(false)}
                className="p-2 rounded-xl text-[var(--text-sub)] hover:text-white hover:bg-[var(--section-alt)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields: Name, Description, Price, Category, Image, Vegetarian, Available, Featured */}
            <form onSubmit={handleSaveDish} className="space-y-4">
              {/* Field: Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
                  <span>Name</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={dishForm.name}
                  onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                  placeholder="e.g. Paneer Tikka"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-sm text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Field: Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
                  <span>Description</span>
                  <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={dishForm.description}
                  onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                  placeholder="Grilled cottage cheese marinated in aromatic royal spices, roasted bell peppers, served hot..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-sm text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37] resize-none"
                />
              </div>

              {/* Row: Price & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Field: Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
                    <span>Price (₹)</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#d4af37] font-serif font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={dishForm.price}
                      onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                      placeholder="249"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-sm text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37] font-semibold"
                    />
                  </div>
                </div>

                {/* Field: Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
                    <span>Category</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={dishForm.category_id}
                    onChange={(e) => setDishForm({ ...dishForm, category_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-sm text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                  >
                    {categoriesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field: Image URL with Presets and Live Preview */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
                  <span>Image URL</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={dishForm.image}
                  onChange={(e) => setDishForm({ ...dishForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                />

                {/* Quick High-Res Image Presets */}
                <div className="space-y-1">
                  <span className="text-[11px] text-[var(--text-sub)]">Quick Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "Paneer Starter", url: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80" },
                      { label: "Dal Bukhara", url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80" },
                      { label: "Royal Biryani", url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80" },
                      { label: "Woodfire Pizza", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80" },
                      { label: "Shahi Dessert", url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80" },
                      { label: "Kesar Beverage", url: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80" },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setDishForm({ ...dishForm, image: preset.url })}
                        className="px-2.5 py-1 rounded-lg text-[10px] bg-[var(--section-alt)] text-[var(--text-sub)] hover:text-[#d4af37] border border-[var(--card-border)] hover:border-[#d4af37]/40 cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview Thumbnail */}
                {dishForm.image && (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden border border-[var(--card-border)] mt-2 bg-black/40">
                    <Image
                      src={dishForm.image}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-1 right-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white">
                      Live Image Preview
                    </div>
                  </div>
                )}
              </div>

              {/* Toggles: Vegetarian, Available, Featured */}
              <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--card-border)] space-y-3">
                {/* Field: Vegetarian */}
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-sm border border-green-500 flex items-center justify-center p-[2px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs font-semibold text-[var(--text-main)]">
                      Vegetarian (100% Pure Veg)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={dishForm.is_vegetarian}
                    onChange={(e) => setDishForm({ ...dishForm, is_vegetarian: e.target.checked })}
                    className="w-4 h-4 accent-[#d4af37] cursor-pointer"
                  />
                </label>

                {/* Field: Available */}
                <label className="flex items-center justify-between cursor-pointer border-t border-[var(--card-border)] pt-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-semibold text-[var(--text-main)]">
                      Available (In Stock & Orderable)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={dishForm.is_available}
                    onChange={(e) => setDishForm({ ...dishForm, is_available: e.target.checked })}
                    className="w-4 h-4 accent-[#d4af37] cursor-pointer"
                  />
                </label>

                {/* Field: Featured */}
                <label className="flex items-center justify-between cursor-pointer border-t border-[var(--card-border)] pt-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span className="text-xs font-semibold text-[var(--text-main)]">
                      Featured (Chef&apos;s Special Highlight)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={dishForm.is_featured}
                    onChange={(e) => setDishForm({ ...dishForm, is_featured: e.target.checked })}
                    className="w-4 h-4 accent-[#d4af37] cursor-pointer"
                  />
                </label>
              </div>

              {/* Action Buttons: [ SAVE ] */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="w-1/3 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)] bg-[var(--section-alt)] hover:text-white border border-[var(--card-border)] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 active:scale-98 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>[ SAVE ]</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          PHASE 20 MODAL: ADD / EDIT CATEGORY
          ============================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-[var(--card-bg)] border border-[#d4af37]/40 shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)]">
              <div>
                <h3 className="text-xl font-serif font-bold text-[var(--text-main)]">
                  {editingCategory ? `Edit Category: ${editingCategory.name}` : "Add New Category"}
                </h3>
                <p className="text-xs text-[var(--text-sub)]">
                  Category changes update live on customer menu and order filters.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-2 rounded-xl text-[var(--text-sub)] hover:text-white hover:bg-[var(--section-alt)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCategory} className="space-y-4">
              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
                  <span>Category Name</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    const autoSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                    setCategoryForm({
                      ...categoryForm,
                      name: newName,
                      slug: editingCategory ? categoryForm.slug : autoSlug,
                    });
                  }}
                  placeholder="e.g. Chinese"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-sm text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Slug & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
                    <span>Slug (URL Key)</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                    placeholder="e.g. chinese"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-sm font-mono text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
                    <span>Display Sequence</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={categoryForm.display_order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, display_order: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-sm font-mono text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
                  <span>Description</span>
                </label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Gourmet course introduction, preparation highlights..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-sm text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37] resize-none"
                />
              </div>

              {/* Status: Active */}
              <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--card-border)]">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-semibold text-[var(--text-main)]">
                      Enabled (Visible to guests on menu)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={categoryForm.is_active}
                    onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                    className="w-4 h-4 accent-[#d4af37] cursor-pointer"
                  />
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="w-1/3 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)] bg-[var(--section-alt)] hover:text-white border border-[var(--card-border)] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 active:scale-98 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>[ SAVE CATEGORY ]</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
