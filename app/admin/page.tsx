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
  Crown,
  UserCog,
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
  Upload,
  Loader2,
  Globe,
  Mail,
  DollarSign,
  Percent,
  Radio,
  Store,
  Award,
  Calendar,
  CreditCard,
  Receipt,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { OrderStatus, MenuItem, Category, Offer, RestaurantSettings, Review } from "@/types/database";
import { fallbackMenuItems, fallbackCategories } from "@/lib/menuData";
import { uploadDishImage } from "@/lib/storage";

type AdminTab =
  | "dashboard"
  | "orders"
  | "menu"
  | "categories"
  | "team"
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

const initialAdminOffers: Offer[] = [];

const initialAdminReviews: Review[] = [];

const defaultAdminSettings: RestaurantSettings = {
  id: "default",
  name: "NEXORA Fine Dining",
  phone: "+91 83038 90056",
  phone_secondary: "+91 91204 89210",
  email: "vaibhavpatel8543@gmail.com",
  address: "Sathigva, Amauli-Fatehpur Road, Near Ankit Internet Cafe And Janseva Kendra",
  opening_hours: "11:00 AM – 11:30 PM (Mon – Sun)",
  delivery_radius: "15 km",
  minimum_order: 199,
  delivery_fee: 40,
  tax_percent: 5,
  social_links: {
    instagram: "https://instagram.com",
    whatsapp: "https://wa.me/918303890056",
    facebook: "https://facebook.com",
    google_maps: "https://maps.google.com",
  },
  logo_url: "/logo.png",
};

const defaultAdminAnalytics = {
  todaySales: 0,
  weeklySales: 0,
  monthlySales: 0,
  todayGrowth: 0,
  weeklyGrowth: 0,
  monthlyGrowth: 0,
  totalOrdersToday: 0,
  totalOrdersWeekly: 0,
  totalOrdersMonthly: 0,
  averageOrderValue: 0,
  deliveredCount: 0,
  pendingCount: 0,
  mostOrderedFood: [] as {
    rank: number;
    name: string;
    category: string;
    count: number;
    revenue: number;
    percentage: number;
  }[],
  categories: [] as { name: string; percentage: number; amount: number }[],
  payments: [] as { method: string; percentage: number; count: number }[],
};

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
      paymentMethod: "Online (PhonePe / UPI)",
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

  // Image Storage Upload State (Phase 21: Supabase Storage)
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">("upload");

  // Offers & Coupons Management State (Phase 22)
  const [offersList, setOffersList] = useState<Offer[]>(initialAdminOffers);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState<boolean>(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [offerForm, setOfferForm] = useState({
    code: "SAVE50",
    description: "Special 20% discount on gourmet fine-dining orders above ₹499 (Max ₹150)",
    discount_type: "percentage",
    discount_value: 20,
    minimum_order: 499,
    max_discount: 150,
    end_date: "",
    is_active: true,
  });

  // Restaurant Settings State (Phase 23)
  const [settingsForm, setSettingsForm] = useState<RestaurantSettings>(defaultAdminSettings);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);

  // Reviews Moderation State (Phase 25)
  const [reviewsList, setReviewsList] = useState<Review[]>(initialAdminReviews);
  const [reviewFilter, setReviewFilter] = useState<"all" | "pending" | "approved" | "hidden">("all");
  const [reviewActionFeedback, setReviewActionFeedback] = useState<string | null>(null);
  const [isReviewLoading, setIsReviewLoading] = useState<boolean>(false);

  // Analytics State (Phase 26)
  const [analyticsData, setAnalyticsData] = useState(defaultAdminAnalytics);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<"today" | "weekly" | "monthly" | "all">("today");

  // Team Management State (Phase 30: Super Admin Role-Based Access Control)
  const [teamMembers, setTeamMembers] = useState<any[]>([
    {
      id: "tm_admin_manager_1",
      name: "Vikram Singh (Manager)",
      email: "manager@nexora.com",
      role: "admin",
      roleType: "admin",
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      is_active: true,
    },
    {
      id: "tm_delivery_staff_1",
      name: "Ramesh Kumar (Delivery)",
      email: "delivery@nexora.com",
      role: "staff",
      roleType: "sub_admin",
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      is_active: true,
    },
  ]);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isSavingTeamMember, setIsSavingTeamMember] = useState(false);
  const [teamForm, setTeamForm] = useState<{
    name: string;
    email: string;
    password: string;
    role: "admin" | "sub_admin";
  }>({
    name: "",
    email: "",
    password: "",
    role: "admin",
  });
  const [teamFeedback, setTeamFeedback] = useState<string | null>(null);

  // Auth Verification & Menu/Category Initialization from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nexora_admin_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setAdminUser(parsed);
          setIsLoading(false);

          // Role-based active tab default
          const storedRole = localStorage.getItem("nexora_admin_role");
          const r = (storedRole || parsed?.role || "super_admin").toLowerCase();
          if (r === "admin" || r === "staff" || r === "sub_admin" || r === "delivery") {
            setActiveTab("orders");
          }
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
        // Load / Sync Admin Offers from localStorage & API (Phase 22)
        try {
          const storedOffers = localStorage.getItem("nexora_admin_offers");
          if (storedOffers) {
            const parsedOffers = JSON.parse(storedOffers);
            if (Array.isArray(parsedOffers) && parsedOffers.length > 0) {
              setOffersList(parsedOffers);
            } else {
              localStorage.setItem("nexora_admin_offers", JSON.stringify(initialAdminOffers));
            }
          } else {
            localStorage.setItem("nexora_admin_offers", JSON.stringify(initialAdminOffers));
          }

          // Background sync from /api/offers
          fetch("/api/offers")
            .then((res) => res.json())
            .then((json) => {
              if (json.success && Array.isArray(json.offers)) {
                setOffersList(json.offers);
                localStorage.setItem("nexora_admin_offers", JSON.stringify(json.offers));
              }
            })
            .catch(() => {});
        } catch (err) {
          console.warn("Error syncing admin offers from storage:", err);
        }

        // Load / Sync Restaurant Settings from localStorage & API (Phase 23)
        try {
          const storedSettings = localStorage.getItem("nexora_restaurant_settings");
          if (storedSettings) {
            const parsed = JSON.parse(storedSettings);
            setSettingsForm((prev) => ({
              ...prev,
              ...parsed,
              social_links: {
                ...prev.social_links,
                ...(parsed.social_links || {}),
              },
            }));
          } else {
            localStorage.setItem("nexora_restaurant_settings", JSON.stringify(defaultAdminSettings));
          }

          fetch("/api/settings")
            .then((res) => res.json())
            .then((json) => {
              if (json.success && json.settings) {
                setSettingsForm(json.settings);
                localStorage.setItem("nexora_restaurant_settings", JSON.stringify(json.settings));
              }
            })
            .catch(() => {});
        } catch (err) {
          console.warn("Error syncing restaurant settings:", err);
        }

        // Load / Sync Admin Reviews from localStorage & API (Phase 25)
        try {
          const storedReviews = localStorage.getItem("nexora_admin_reviews");
          if (storedReviews) {
            const parsed = JSON.parse(storedReviews);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setReviewsList(parsed);
            } else {
              localStorage.setItem("nexora_admin_reviews", JSON.stringify(initialAdminReviews));
            }
          } else {
            localStorage.setItem("nexora_admin_reviews", JSON.stringify(initialAdminReviews));
          }

          fetch("/api/reviews?all=true")
            .then((res) => res.json())
            .then((json) => {
              if (json.success && Array.isArray(json.reviews)) {
                setReviewsList(json.reviews);
                localStorage.setItem("nexora_admin_reviews", JSON.stringify(json.reviews));
              }
            })
            .catch(() => {});
        } catch (err) {
          console.warn("Error syncing admin reviews:", err);
        }

        // Load / Sync Analytics from API (Phase 26)
        fetch("/api/analytics")
          .then((res) => res.json())
          .then((json) => {
            if (json.success && json.analytics) {
              setAnalyticsData({
                todaySales: json.analytics.sales?.today ?? 0,
                weeklySales: json.analytics.sales?.weekly ?? 0,
                monthlySales: json.analytics.sales?.monthly ?? 0,
                todayGrowth: json.analytics.sales?.todayGrowth ?? 0,
                weeklyGrowth: json.analytics.sales?.weeklyGrowth ?? 0,
                monthlyGrowth: json.analytics.sales?.monthlyGrowth ?? 0,
                totalOrdersToday: json.analytics.orders?.totalToday ?? 0,
                totalOrdersWeekly: json.analytics.orders?.totalWeekly ?? 0,
                totalOrdersMonthly: json.analytics.orders?.totalMonthly ?? 0,
                averageOrderValue: json.analytics.orders?.averageOrderValue ?? 0,
                deliveredCount: json.analytics.orders?.deliveredCount ?? 0,
                pendingCount: json.analytics.orders?.pendingCount ?? 0,
                mostOrderedFood: json.analytics.mostOrderedFood ?? [],
                categories: json.analytics.categoryBreakdown ?? [],
                payments: json.analytics.paymentBreakdown ?? [],
              });
            }
          })
          .catch(() => {});
      } catch (err) {
        console.warn("Error syncing admin categories from storage:", err);
      }
    }
  }, [router]);

  // ==========================================================
  // PHASE 22: OFFERS & COUPONS MANAGEMENT HANDLERS
  // ==========================================================
  const saveOffersToStorage = (updated: Offer[]) => {
    setOffersList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("nexora_admin_offers", JSON.stringify(updated));
      window.dispatchEvent(new Event("nexora_offers_updated"));
    }
  };

  const handleOpenAddOfferModal = () => {
    setEditingOffer(null);
    setOfferForm({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 20,
      minimum_order: 499,
      max_discount: 150,
      end_date: "",
      is_active: true,
    });
    setIsOfferModalOpen(true);
  };

  const handleOpenEditOfferModal = (offer: Offer) => {
    setEditingOffer(offer);
    const discVal = Number(
      offer.discount_value ??
      (offer.discount_type === "percentage" ? offer.discount_percent : offer.discount_amount) ??
      0
    );
    setOfferForm({
      code: offer.code,
      description: offer.description || "",
      discount_type: offer.discount_type || "percentage",
      discount_value: discVal,
      minimum_order: Number(offer.minimum_order ?? offer.min_order_amount ?? 0),
      max_discount: offer.max_discount ? Number(offer.max_discount) : 0,
      end_date: offer.end_date || offer.valid_until ? (offer.end_date || offer.valid_until)!.split("T")[0] : "",
      is_active: offer.is_active,
    });
    setIsOfferModalOpen(true);
  };

  const handleToggleOfferStatus = async (offerCode: string) => {
    const updated = offersList.map((o) =>
      o.code === offerCode ? { ...o, is_active: !o.is_active } : o
    );
    saveOffersToStorage(updated);
    try {
      const target = updated.find((o) => o.code === offerCode);
      await fetch("/api/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: offerCode, is_active: target?.is_active }),
      });
    } catch (err) {
      console.warn("Could not patch offer to server:", err);
    }
  };

  const handleDeleteOffer = async (offerCode: string) => {
    if (!confirm(`Are you sure you want to delete coupon offer "${offerCode}"?`)) return;
    const updated = offersList.filter((o) => o.code !== offerCode);
    saveOffersToStorage(updated);
    try {
      await fetch(`/api/offers?code=${encodeURIComponent(offerCode)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Could not delete offer on server:", err);
    }
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerForm.code.trim()) return;

    const cleanCode = offerForm.code.trim().toUpperCase();
    const payload = {
      code: cleanCode,
      description: offerForm.description.trim() || `${cleanCode} Promo Offer`,
      discount_type: offerForm.discount_type,
      discount_value: Number(offerForm.discount_value) || 0,
      minimum_order: Number(offerForm.minimum_order) || 0,
      max_discount: offerForm.max_discount ? Number(offerForm.max_discount) : null,
      end_date: offerForm.end_date ? new Date(offerForm.end_date).toISOString() : null,
      is_active: offerForm.is_active,
    };

    let updated: Offer[];
    if (editingOffer) {
      updated = offersList.map((o) =>
        o.id === editingOffer.id || o.code === editingOffer.code
          ? {
              ...o,
              ...payload,
            }
          : o
      );
    } else {
      const newOffer: Offer = {
        id: `offer_${Date.now()}`,
        ...payload,
        created_at: new Date().toISOString(),
      };
      updated = [newOffer, ...offersList];
    }

    saveOffersToStorage(updated);
    setIsOfferModalOpen(false);
    setEditingOffer(null);

    // Sync to backend /api/offers
    try {
      await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingOffer?.id,
          ...payload,
        }),
      });
    } catch (err) {
      console.warn("Could not sync offer to server:", err);
    }
  };

  // ==========================================================
  // PHASE 23: RESTAURANT SETTINGS HANDLERS (No-Code System)
  // ==========================================================
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSavedMessage(null);

    const payload: RestaurantSettings = {
      ...settingsForm,
      minimum_order: Number(settingsForm.minimum_order) >= 0 ? Number(settingsForm.minimum_order) : 199,
      delivery_fee: Number(settingsForm.delivery_fee) >= 0 ? Number(settingsForm.delivery_fee) : 40,
      tax_percent: Number(settingsForm.tax_percent) >= 0 ? Number(settingsForm.tax_percent) : 5,
      updated_at: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("nexora_restaurant_settings", JSON.stringify(payload));
      window.dispatchEvent(new Event("nexora_settings_updated"));
    }

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSavedMessage("✓ Settings saved! All website pages (Header, Footer, Cart, Checkout) updated in real-time.");
      }
    } catch {
      setSettingsSavedMessage("✓ Settings saved locally! Website updated in real-time.");
    } finally {
      setIsSavingSettings(false);
      setTimeout(() => setSettingsSavedMessage(null), 5000);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const result = await uploadDishImage(file, "menu-images");
      if (result.url) {
        setSettingsForm((prev) => ({ ...prev, logo_url: result.url }));
      }
    } catch (err) {
      console.warn("Logo upload error:", err);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // ==========================================================
  // PHASE 25: REVIEWS MODERATION HANDLERS ([Approve], [Hide], [Delete])
  // "Public website par sirf approved reviews."
  // ==========================================================
  const handleApproveReview = async (reviewId: string) => {
    setIsReviewLoading(true);
    const updated = reviewsList.map((r) =>
      r.id === reviewId ? { ...r, is_approved: true } : r
    );
    setReviewsList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("nexora_admin_reviews", JSON.stringify(updated));
    }
    setReviewActionFeedback("Review approved! It is now live on the public website.");
    setTimeout(() => setReviewActionFeedback(null), 4000);

    try {
      await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reviewId, is_approved: true }),
      });
    } catch (err) {
      console.warn("Failed to sync review approval:", err);
    } finally {
      setIsReviewLoading(false);
    }
  };

  const handleHideReview = async (reviewId: string) => {
    setIsReviewLoading(true);
    const updated = reviewsList.map((r) =>
      r.id === reviewId ? { ...r, is_approved: false } : r
    );
    setReviewsList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("nexora_admin_reviews", JSON.stringify(updated));
    }
    setReviewActionFeedback("Review hidden from public website.");
    setTimeout(() => setReviewActionFeedback(null), 4000);

    try {
      await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reviewId, is_approved: false }),
      });
    } catch (err) {
      console.warn("Failed to sync review hide:", err);
    } finally {
      setIsReviewLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to permanently delete this review?")) return;
    setIsReviewLoading(true);
    const updated = reviewsList.filter((r) => r.id !== reviewId);
    setReviewsList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("nexora_admin_reviews", JSON.stringify(updated));
    }
    setReviewActionFeedback("Review deleted successfully.");
    setTimeout(() => setReviewActionFeedback(null), 4000);

    try {
      await fetch(`/api/reviews?id=${reviewId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Failed to sync review deletion:", err);
    } finally {
      setIsReviewLoading(false);
    }
  };

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
      category_id: categoriesList[0]?.id || "11111111-1111-1111-1111-111111111111",
      image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80",
      is_vegetarian: true,
      is_available: true,
      is_featured: false,
    });
    setUploadStatus(null);
    setIsUploadingImage(false);
    setImageInputMode("upload");
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
    setUploadStatus(null);
    setIsUploadingImage(false);
    setImageInputMode("upload");
    setIsMenuModalOpen(true);
  };

  // Phase 21: Upload file to Supabase Storage and set public CDN URL into form
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setUploadStatus("Uploading image to Supabase Storage (menu-images)...");

    try {
      const result = await uploadDishImage(file);
      setDishForm((prev) => ({
        ...prev,
        image: result.url,
      }));
      setUploadStatus("✓ Uploaded to Supabase Storage: " + (result.path || file.name));
    } catch (err: any) {
      console.error("Image upload failed:", err);
      setUploadStatus("Upload notice: Image linked");
    } finally {
      setIsUploadingImage(false);
    }
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

  const handleAdminLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}
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

  // Team Management Handlers (Phase 30)
  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim() || !teamForm.email.trim() || !teamForm.password.trim()) return;

    setIsSavingTeamMember(true);
    setTeamFeedback(null);

    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add team member.");
      }

      setTeamMembers((prev) => [data.member, ...prev.filter((m) => m.id !== data.member.id)]);
      setIsTeamModalOpen(false);
      setTeamForm({ name: "", email: "", password: "", role: "admin" });
      setTeamFeedback(data.message || "Team member added successfully!");
      setTimeout(() => setTeamFeedback(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to add team member.");
    } finally {
      setIsSavingTeamMember(false);
    }
  };

  const handleDeleteTeamMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove team member "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/team?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setTeamMembers((prev) => prev.filter((m) => m.id !== id));
        setTeamFeedback(`Member "${name}" removed successfully.`);
        setTimeout(() => setTeamFeedback(null), 4000);
      }
    } catch (err) {
      console.warn("Delete team member error:", err);
    }
  };

  // Sync team members from /api/admin/team
  useEffect(() => {
    const r = (adminUser?.role || (typeof window !== "undefined" ? localStorage.getItem("nexora_admin_role") : null) || "").toLowerCase();
    const isOwner = r === "owner" || r === "super_admin";
    if (isOwner) {
      fetch("/api/admin/team")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.team)) {
            setTeamMembers(data.team);
          }
        })
        .catch(() => {});
    }
  }, [adminUser]);

  const currentRole = (
    adminUser?.role ||
    (typeof window !== "undefined" ? localStorage.getItem("nexora_admin_role") : null) ||
    "owner"
  ).toLowerCase();

  const isSuperAdmin = currentRole === "owner" || currentRole === "super_admin";
  const isAdmin = currentRole === "admin";
  const isSubAdmin = currentRole === "staff" || currentRole === "sub_admin" || currentRole === "delivery";

  // Tab View Guard: Ensure Admins and Sub-Admins cannot access unauthorized views
  useEffect(() => {
    if (isAdmin && !["orders", "menu", "categories"].includes(activeTab)) {
      setActiveTab("orders");
    } else if (isSubAdmin && activeTab !== "orders") {
      setActiveTab("orders");
    }
  }, [isAdmin, isSubAdmin, activeTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-[#d4af37] text-sm">
        Verifying administrator authorization...
      </div>
    );
  }

  // Sidebar Items Matching Role Permissions Exactly
  let sidebarItems: { id: AdminTab; label: string; icon: any }[] = [];

  if (isSubAdmin) {
    // Sub-Admin (Delivery Boy): Orders only
    sidebarItems = [
      { id: "orders", label: "Deliveries", icon: Bike },
    ];
  } else if (isAdmin) {
    // Admin (Operations): Orders, Menu, Categories only
    sidebarItems = [
      { id: "orders", label: "Live Orders", icon: ShoppingBag },
      { id: "menu", label: "Menu Items", icon: UtensilsCrossed },
      { id: "categories", label: "Categories", icon: FolderTree },
    ];
  } else {
    // Super Admin (Owner): Complete Full Access + Team Management
    sidebarItems = [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "orders", label: "Orders", icon: ShoppingBag },
      { id: "menu", label: "Menu", icon: UtensilsCrossed },
      { id: "categories", label: "Categories", icon: FolderTree },
      { id: "team", label: "Team & Staff", icon: Users },
      { id: "customers", label: "Customers", icon: Users },
      { id: "offers", label: "Offers", icon: Tag },
      { id: "tables", label: "Tables", icon: Armchair },
      { id: "reviews", label: "Reviews", icon: Star },
      { id: "analytics", label: "Analytics", icon: BarChart3 },
      { id: "settings", label: "Settings", icon: Settings },
    ];
  }

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
              <div className="flex items-center gap-1.5 justify-end">
                <p className="text-xs font-semibold text-[var(--text-main)]">
                  {adminUser?.name || "NEXORA Admin"}
                </p>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    isSuperAdmin
                      ? "bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/40"
                      : isAdmin
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  }`}
                >
                  {isSuperAdmin ? "Super Admin" : isAdmin ? "Admin" : "Sub-Admin"}
                </span>
              </div>
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
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[var(--card-border)] bg-[var(--section-alt)] p-2.5 sm:p-3 md:p-4 flex flex-col md:justify-between shrink-0">
          <div className="md:space-y-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-sub-light)] px-2.5 py-1 md:px-3 md:py-2 block font-semibold">
              Management Menu
            </span>
            <nav className="flex flex-row overflow-x-auto no-scrollbar gap-1.5 pb-1 md:pb-0 md:flex-col md:space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`shrink-0 px-3 py-2 md:w-full md:px-3.5 md:py-2.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2.5 transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-gold-gradient text-black font-bold shadow-md"
                        : "text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-2 md:gap-3">
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
          </div>

          <div className="hidden md:block pt-6 border-t border-[var(--card-border)] text-[11px] text-[var(--text-sub)] space-y-1 px-2">
            <p className="font-semibold text-[var(--text-main)]">NEXORA Fine Dining</p>
            <p className="text-[10px]">Sathigva, Amauli-Fatehpur Road</p>
          </div>
        </aside>

        {/* ============================================================
            RIGHT MAIN CONTENT AREA
            ============================================================ */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 overflow-y-auto">
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
              TAB: TEAM & STAFF ROLES (SUPER ADMIN ONLY)
              ========================================================== */}
          {activeTab === "team" && isSuperAdmin && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header with Title and Add Member Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#d4af37] font-semibold">
                      Role-Based Access Control
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30">
                      Super Admin Supreme
                    </span>
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-[var(--text-main)] pt-1">
                    Team & Staff Management
                  </h2>
                  <p className="text-xs text-[var(--text-sub)]">
                    Create and manage authorized accounts for Operations Admins and Delivery Boys.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(true)}
                  className="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Member</span>
                </button>
              </div>

              {teamFeedback && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{teamFeedback}</span>
                </div>
              )}

              {/* Members Grid / Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Super Admin Card (Permanent) */}
                <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[#d4af37]/40 shadow-md space-y-4 relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37] flex items-center justify-center text-[#d4af37]">
                        <Crown className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[var(--text-main)]">
                          {adminUser?.name || "Vaibhav Patel (Owner)"}
                        </h3>
                        <p className="text-xs font-mono text-[var(--text-sub)]">
                          {adminUser?.email || "nexora67@gmail.com"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)] text-xs">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30">
                      Super Admin (Owner)
                    </span>
                    <span className="text-[11px] text-emerald-400 font-medium">Permanent</span>
                  </div>
                </div>

                {/* Team Members List */}
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-md space-y-4 hover:border-[#d4af37]/30 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                            member.roleType === "sub_admin" || member.role === "staff"
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                              : "bg-blue-500/15 border-blue-500/30 text-blue-400"
                          }`}
                        >
                          {member.roleType === "sub_admin" || member.role === "staff" ? (
                            <Bike className="w-5 h-5" />
                          ) : (
                            <UserCog className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[var(--text-main)]">
                            {member.name}
                          </h3>
                          <p className="text-xs font-mono text-[var(--text-sub)]">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTeamMember(member.id, member.name)}
                        className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)] text-xs">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          member.roleType === "sub_admin" || member.role === "staff"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                        }`}
                      >
                        {member.roleType === "sub_admin" || member.role === "staff"
                          ? "Sub-Admin (Delivery)"
                          : "Admin (Operations)"}
                      </span>
                      <span className="text-[10px] text-[var(--text-sub-light)]">
                        {member.created_at ? new Date(member.created_at).toLocaleDateString() : "Active"}
                      </span>
                    </div>
                  </div>
                ))}
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
          {/* ==========================================================
              TAB: OFFERS (PHASE 22 - Offers & Coupon Management)
              ========================================================== */}
          {activeTab === "offers" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
                    <Tag className="w-5 h-5 text-[#d4af37]" />
                    Promotions &amp; Coupon Offers
                  </h2>
                  <p className="text-xs text-[var(--text-sub)]">
                    Configure royal discount codes, minimum order value, maximum caps, and activation status.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddOfferModal}
                  className="px-4 py-2.5 rounded-xl bg-gold-gradient text-black font-semibold text-xs flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-all cursor-pointer font-mono"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>+ Add Offer</span>
                </button>
              </div>

              {/* Offers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {offersList.map((offer) => {
                  const isPct =
                    offer.discount_type === "percentage" ||
                    (!offer.discount_type && offer.discount_percent);
                  const discVal =
                    offer.discount_value ??
                    (isPct ? offer.discount_percent : offer.discount_amount) ??
                    0;
                  const minOrder =
                    offer.minimum_order ?? offer.min_order_amount ?? 0;

                  return (
                    <div
                      key={offer.id || offer.code}
                      className={`relative p-5 rounded-2xl bg-[var(--card-bg)] border transition-all space-y-4 ${
                        offer.is_active
                          ? "border-[#d4af37]/40 shadow-sm hover:border-[#d4af37]"
                          : "border-[var(--card-border)] opacity-75"
                      }`}
                    >
                      {/* Top Bar: Code & Discount Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-lg text-gold-gradient tracking-wider">
                            {offer.code}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
                            {isPct ? `${discVal}% OFF` : `₹${discVal} FLAT OFF`}
                          </span>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            offer.is_active
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-zinc-500/15 text-zinc-400 border border-zinc-500/30"
                          }`}
                        >
                          {offer.is_active ? "Active" : "Disabled"}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-[var(--text-sub)] line-clamp-2 min-h-[32px]">
                        {offer.description || "Special offer applicable on royal fine-dining orders."}
                      </p>

                      {/* Key Conditions (Min Order, Max Discount) */}
                      <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[11px]">
                        <div>
                          <span className="text-[var(--text-sub-light)] block text-[10px]">Min Order</span>
                          <span className="font-bold text-[var(--text-main)]">
                            Min ₹{minOrder}
                          </span>
                        </div>
                        <div>
                          <span className="text-[var(--text-sub-light)] block text-[10px]">Max Discount</span>
                          <span className="font-bold text-[var(--text-main)]">
                            {offer.max_discount ? `₹${offer.max_discount}` : "No Limit"}
                          </span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-[var(--card-border)]/50 text-[10px] text-[var(--text-sub)] flex items-center justify-between">
                          <span>Expiry:</span>
                          <span className="font-mono">
                            {offer.end_date || offer.valid_until
                              ? new Date(offer.end_date || offer.valid_until!).toLocaleDateString()
                              : "Ongoing (No Expiry)"}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons: [Edit] [Disable/Enable] [Delete] */}
                      <div className="flex items-center gap-2 pt-1 border-t border-[var(--card-border)]">
                        <button
                          type="button"
                          onClick={() => handleOpenEditOfferModal(offer)}
                          className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold bg-[var(--section-alt)] text-[var(--text-main)] hover:text-[#d4af37] border border-[var(--card-border)] hover:border-[#d4af37]/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleOfferStatus(offer.code)}
                          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            offer.is_active
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                          }`}
                        >
                          {offer.is_active ? (
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

                        <button
                          type="button"
                          onClick={() => handleDeleteOffer(offer.code)}
                          className="p-1.5 rounded-xl text-[var(--text-sub-light)] hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                          title="Delete Offer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
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
              TAB: REVIEWS (PHASE 25: Reviews Moderation System)
              "Public website par sirf approved reviews."
              ========================================================== */}
          {activeTab === "reviews" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
                    <Star className="w-5 h-5 text-[#d4af37]" />
                    <span>Guest Reviews &amp; Moderation</span>
                  </h2>
                  <p className="text-xs text-[var(--text-sub)]">
                    Patron feedback across all pure-veg gourmet dishes. Public website par sirf approved reviews display honge.
                  </p>
                </div>
              </div>

              {/* Action Feedback Banner */}
              {reviewActionFeedback && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{reviewActionFeedback}</span>
                </div>
              )}

              {/* Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-sub-light)] block font-semibold">
                    Total Reviews
                  </span>
                  <span className="text-2xl font-serif font-bold text-[var(--text-main)] mt-1 block">
                    {reviewsList.length}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                  <span className="text-[10px] uppercase tracking-wider text-amber-400 block font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Pending Moderation</span>
                  </span>
                  <span className="text-2xl font-serif font-bold text-amber-400 mt-1 block">
                    {reviewsList.filter((r) => !r.is_approved).length}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400 block font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Approved &amp; Live</span>
                  </span>
                  <span className="text-2xl font-serif font-bold text-emerald-400 mt-1 block">
                    {reviewsList.filter((r) => r.is_approved).length}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                  <span className="text-[10px] uppercase tracking-wider text-[#d4af37] block font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span>Average Rating</span>
                  </span>
                  <span className="text-2xl font-serif font-bold text-gold-gradient mt-1 block">
                    {reviewsList.length > 0
                      ? (
                          reviewsList.reduce((acc, r) => acc + (r.rating || 5), 0) /
                          reviewsList.length
                        ).toFixed(1)
                      : "5.0"}{" "}
                    <span className="text-xs text-[var(--text-sub)] font-normal font-sans">/ 5</span>
                  </span>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 border-b border-[var(--card-border)] pb-3">
                {[
                  { id: "all", label: `All (${reviewsList.length})` },
                  {
                    id: "pending",
                    label: `Pending Moderation (${reviewsList.filter((r) => !r.is_approved).length})`,
                    highlight: reviewsList.filter((r) => !r.is_approved).length > 0,
                  },
                  {
                    id: "approved",
                    label: `Approved (${reviewsList.filter((r) => r.is_approved).length})`,
                  },
                  {
                    id: "hidden",
                    label: `Hidden (${reviewsList.filter((r) => !r.is_approved).length})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setReviewFilter(tab.id as any)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      reviewFilter === tab.id
                        ? "bg-gold-gradient text-black shadow-md font-bold"
                        : tab.highlight
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                        : "bg-[var(--card-bg)] text-[var(--text-sub)] border border-[var(--card-border)] hover:border-[#d4af37]/40 hover:text-[var(--text-main)]"
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviewsList
                  .filter((rev) => {
                    if (reviewFilter === "pending" || reviewFilter === "hidden") return !rev.is_approved;
                    if (reviewFilter === "approved") return rev.is_approved;
                    return true;
                  })
                  .map((rev) => {
                    const formattedDate =
                      typeof rev.created_at === "string"
                        ? rev.created_at.split("T")[0]
                        : "Recent";

                    return (
                      <div
                        key={rev.id}
                        className="p-5 sm:p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-4 hover:border-[#d4af37]/30 transition-all shadow-sm"
                      >
                        {/* Top: Patron + Rating + Approval Status */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-[var(--text-main)]">
                              {rev.customer_name || "Valued Patron"}
                            </span>
                            {rev.dish_name && (
                              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 font-medium">
                                {rev.dish_name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Star Rating */}
                            <div className="flex items-center gap-0.5 text-[#d4af37]">
                              {[...Array(rev.rating || 5)].map((_, idx) => (
                                <Star key={idx} className="w-4 h-4 fill-current" />
                              ))}
                            </div>

                            {/* Approval Badge */}
                            {rev.is_approved ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>Approved</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Pending</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Comment Text */}
                        <blockquote className="p-3.5 rounded-xl bg-[var(--section-alt)] border-l-2 border-[#d4af37] text-xs sm:text-sm text-[var(--text-sub)] italic font-light leading-relaxed">
                          &ldquo;{rev.comment}&rdquo;
                        </blockquote>

                        {/* Bottom Row: Date + Action Buttons [Approve] [Hide] [Delete] */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[var(--card-border)] text-xs">
                          <span className="text-[11px] text-[var(--text-sub-light)] font-mono">
                            Submitted on {formattedDate}
                          </span>

                          <div className="flex items-center gap-2">
                            {!rev.is_approved ? (
                              <button
                                type="button"
                                disabled={isReviewLoading}
                                onClick={() => handleApproveReview(rev.id)}
                                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isReviewLoading}
                                onClick={() => handleHideReview(rev.id)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Hide</span>
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={isReviewLoading}
                              onClick={() => handleDeleteReview(rev.id)}
                              className="p-2 rounded-xl text-[var(--text-sub-light)] hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                              title="Delete Review"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {reviewsList.filter((rev) => {
                  if (reviewFilter === "pending" || reviewFilter === "hidden") return !rev.is_approved;
                  if (reviewFilter === "approved") return rev.is_approved;
                  return true;
                }).length === 0 && (
                  <div className="text-center py-12 border border-dashed border-[var(--card-border)] rounded-2xl space-y-2">
                    <Star className="w-8 h-8 text-[var(--text-sub-light)] mx-auto opacity-40" />
                    <p className="text-xs text-[var(--text-sub)]">No reviews found under this filter.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB: ANALYTICS
          {/* ==========================================================
              TAB: ANALYTICS (PHASE 26: Analytics System)
              Today's Sales, Weekly Sales, Monthly Sales
              Total Orders, Average Order Value
              Most Ordered Food: 1. Biryani, 2. Paneer Tikka, 3. Butter Chicken
              "Baad me graphs."
              ========================================================== */}
          {activeTab === "analytics" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header with Timeframe Selectors */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#d4af37]" />
                    <span>Restaurant Analytics</span>
                  </h2>
                  <p className="text-xs text-[var(--text-sub)]">
                    Sales velocity, ticket sizes, and top culinary delicacies. Baad me graphs.
                  </p>
                </div>

                {/* Timeframe Filter Buttons */}
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
                  {[
                    { id: "today", label: "Today" },
                    { id: "weekly", label: "This Week" },
                    { id: "monthly", label: "This Month" },
                    { id: "all", label: "All Time" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAnalyticsTimeframe(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        analyticsTimeframe === tab.id
                          ? "bg-gold-gradient text-black shadow-md font-bold"
                          : "text-[var(--text-sub)] hover:text-[var(--text-main)] hover:bg-white/5"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 1. SALES METRICS (Today's Sales, Weekly Sales, Monthly Sales) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Today's Sales */}
                <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[#d4af37]/40 shadow-xl space-y-3 relative overflow-hidden group hover:border-[#d4af37] transition-all gold-glow-sm">
                  <div className="flex items-center justify-between text-xs text-[var(--text-sub)]">
                    <span className="uppercase tracking-wider font-semibold flex items-center gap-1.5 text-[var(--text-main)]">
                      <DollarSign className="w-4 h-4 text-[#d4af37]" />
                      <span>Today&apos;s Sales</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{analyticsData.todayGrowth}%
                    </span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-serif font-bold text-gold-gradient">
                    {formatCurrency(analyticsData.todaySales)}
                  </p>
                  <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between text-[11px] text-[var(--text-sub-light)]">
                    <span>{analyticsData.totalOrdersToday} orders processed today</span>
                    <span className="text-emerald-400 font-medium">Daily target 100%</span>
                  </div>
                </div>

                {/* 2. Weekly Sales */}
                <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl space-y-3 relative overflow-hidden group hover:border-[#d4af37]/40 transition-all">
                  <div className="flex items-center justify-between text-xs text-[var(--text-sub)]">
                    <span className="uppercase tracking-wider font-semibold flex items-center gap-1.5 text-[var(--text-main)]">
                      <Calendar className="w-4 h-4 text-[#d4af37]" />
                      <span>Weekly Sales</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{analyticsData.weeklyGrowth}%
                    </span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-serif font-bold text-[var(--text-main)]">
                    {formatCurrency(analyticsData.weeklySales)}
                  </p>
                  <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between text-[11px] text-[var(--text-sub-light)]">
                    <span>{analyticsData.totalOrdersWeekly} orders in past 7 days</span>
                    <span className="text-emerald-400 font-medium">Robust demand</span>
                  </div>
                </div>

                {/* 3. Monthly Sales */}
                <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl space-y-3 relative overflow-hidden group hover:border-[#d4af37]/40 transition-all">
                  <div className="flex items-center justify-between text-xs text-[var(--text-sub)]">
                    <span className="uppercase tracking-wider font-semibold flex items-center gap-1.5 text-[var(--text-main)]">
                      <BarChart3 className="w-4 h-4 text-[#d4af37]" />
                      <span>Monthly Sales</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-gradient text-black font-mono">
                      +{analyticsData.monthlyGrowth}%
                    </span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-serif font-bold text-gold-gradient">
                    {formatCurrency(analyticsData.monthlySales)}
                  </p>
                  <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between text-[11px] text-[var(--text-sub-light)]">
                    <span>{analyticsData.totalOrdersMonthly} orders in past 30 days</span>
                    <span className="text-[#d4af37] font-medium">Month-to-Date</span>
                  </div>
                </div>
              </div>

              {/* 2. ORDER METRICS (Total Orders, Average Order Value) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Total Orders */}
                <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)] flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#d4af37]" />
                      <span>Total Orders</span>
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--section-alt)] text-[#d4af37] border border-[#d4af37]/30 font-medium font-mono">
                      {analyticsTimeframe === "today"
                        ? "Today: 48"
                        : analyticsTimeframe === "weekly"
                        ? "Past 7 Days: 318"
                        : "Past 30 Days: 1,290"}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-serif font-bold text-[var(--text-main)]">
                      {analyticsTimeframe === "today"
                        ? analyticsData.totalOrdersToday
                        : analyticsTimeframe === "weekly"
                        ? analyticsData.totalOrdersWeekly
                        : analyticsData.totalOrdersMonthly}
                    </span>
                    <span className="text-xs text-[var(--text-sub)]">Total confirmed orders</span>
                  </div>

                  {/* Volume Breakdown Pills */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="p-3 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] text-center">
                      <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-semibold">
                        Delivered
                      </span>
                      <span className="text-base font-bold text-[var(--text-main)] mt-0.5 block">
                        {analyticsData.deliveredCount}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] text-center">
                      <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-semibold">
                        In Kitchen
                      </span>
                      <span className="text-base font-bold text-[var(--text-main)] mt-0.5 block">
                        {analyticsData.pendingCount}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] text-center">
                      <span className="text-[10px] text-[#d4af37] uppercase tracking-wider block font-semibold">
                        Out for Delivery
                      </span>
                      <span className="text-base font-bold text-[var(--text-main)] mt-0.5 block">
                        4
                      </span>
                    </div>
                  </div>
                </div>

                {/* Average Order Value (AOV) */}
                <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)] flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-[#d4af37]" />
                      <span>Average Order Value</span>
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold font-mono">
                      +₹45 (6.1%) vs Last Month
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-serif font-bold text-gold-gradient">
                      {formatCurrency(analyticsData.averageOrderValue)}
                    </span>
                    <span className="text-xs text-[var(--text-sub)]">Average spend per patron ticket</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] space-y-2 text-xs">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[var(--text-sub)]">Basket Spend Efficiency</span>
                      <span className="font-semibold text-emerald-400">High Patron Retention</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-gold-gradient h-full rounded-full w-[78%]" />
                    </div>
                    <p className="text-[10px] text-[var(--text-sub-light)] pt-0.5">
                      Top combination driving ticket size: Biryani + Paneer Tikka.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. MOST ORDERED FOOD (LEADERBOARD) */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--card-border)]">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
                      <Award className="w-5 h-5 text-[#d4af37]" />
                      <span>Most Ordered Food</span>
                    </h3>
                    <p className="text-xs text-[var(--text-sub)]">
                      Top ranked dishes by ordering volume across NEXORA dining and delivery.
                    </p>
                  </div>
                  <span className="text-xs text-[#d4af37] font-semibold uppercase tracking-wider font-mono">
                    Ranked by Order Volume
                  </span>
                </div>

                {/* Top Podium Highlights Rendered from Real Order Analytics */}
                {analyticsData.mostOrderedFood.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analyticsData.mostOrderedFood.slice(0, 3).map((dish) => (
                      <div
                        key={dish.rank}
                        className={`p-5 rounded-2xl bg-[var(--section-alt)] space-y-3 relative overflow-hidden shadow-md ${
                          dish.rank === 1
                            ? "border-2 border-[#d4af37] gold-glow-sm"
                            : dish.rank === 2
                            ? "border border-zinc-500/50"
                            : "border border-amber-600/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`w-8 h-8 rounded-full font-extrabold text-sm flex items-center justify-center shadow-md ${
                              dish.rank === 1
                                ? "bg-gold-gradient text-black"
                                : dish.rank === 2
                                ? "bg-zinc-300 text-black"
                                : "bg-amber-600 text-white"
                            }`}
                          >
                            {dish.rank}
                          </span>
                          <span
                            className={`text-xs font-bold font-mono ${
                              dish.rank === 1
                                ? "text-[#d4af37]"
                                : dish.rank === 2
                                ? "text-zinc-300"
                                : "text-amber-400"
                            }`}
                          >
                            {dish.count} {dish.count === 1 ? "Order" : "Orders"}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-base font-serif font-bold text-[var(--text-main)] truncate">
                            {dish.rank}. {dish.name}
                          </h4>
                          <p className="text-[11px] text-[var(--text-sub)] truncate">
                            {dish.category}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between text-xs">
                          <span className="text-[var(--text-sub)]">Gross Revenue</span>
                          <span
                            className={`font-serif font-bold ${
                              dish.rank === 1 ? "text-gold-gradient" : "text-[var(--text-main)]"
                            }`}
                          >
                            {formatCurrency(dish.revenue)}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              dish.rank === 1
                                ? "bg-[#d4af37]"
                                : dish.rank === 2
                                ? "bg-zinc-400"
                                : "bg-amber-600"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  (dish.count /
                                    (analyticsData.mostOrderedFood[0]?.count || 1)) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] text-center space-y-2">
                    <p className="text-sm font-serif font-bold text-[var(--text-main)]">
                      No Dish Orders Recorded Yet
                    </p>
                    <p className="text-xs text-[var(--text-sub)] max-w-md mx-auto">
                      Ranked top dishes and revenue analytics will automatically appear here once patrons begin placing orders.
                    </p>
                  </div>
                )}

                {/* Full Leaderboard Rows */}
                <div className="space-y-2.5 pt-2">
                  {analyticsData.mostOrderedFood.map((dish) => (
                    <div
                      key={dish.rank}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-xs gap-3 hover:border-[#d4af37]/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center ${
                            dish.rank === 1
                              ? "bg-gold-gradient text-black"
                              : dish.rank === 2
                              ? "bg-zinc-300 text-black"
                              : dish.rank === 3
                              ? "bg-amber-600 text-white"
                              : "bg-zinc-800 text-[var(--text-sub)]"
                          }`}
                        >
                          {dish.rank}
                        </span>
                        <div>
                          <p className="font-semibold text-[var(--text-main)]">{dish.name}</p>
                          <p className="text-[10px] text-[var(--text-sub-light)]">{dish.category}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 sm:justify-end">
                        <div className="text-left sm:text-right">
                          <span className="font-mono font-medium text-[var(--text-sub)]">
                            {dish.count} orders
                          </span>
                          <div className="w-28 bg-zinc-800 rounded-full h-1.5 overflow-hidden mt-1">
                            <div
                              className="bg-gold-gradient h-full rounded-full"
                              style={{ width: `${dish.percentage * 2.8}%` }}
                            />
                          </div>
                        </div>
                        <span className="font-serif font-bold text-gold-gradient min-w-[75px] text-right">
                          {formatCurrency(dish.revenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. BREAKDOWNS (Category Share, Payment Modes & "Baad me graphs" Roadmap Notice) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Category Revenue Share */}
                <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#d4af37]" />
                    <span>Category Revenue Share</span>
                  </h4>
                  <div className="space-y-3">
                    {analyticsData.categories.length > 0 ? (
                      analyticsData.categories.map((cat, i) => (
                        <div key={i} className="space-y-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-[var(--text-main)] font-medium">{cat.name}</span>
                            <span className="text-[var(--text-sub)] font-mono">
                              {cat.percentage}% ({formatCurrency(cat.amount)})
                            </span>
                          </div>
                          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gold-gradient h-full rounded-full"
                              style={{ width: `${cat.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[var(--text-sub)] italic">No category revenue data recorded yet.</p>
                    )}
                  </div>
                </div>

                {/* Payment Breakdown & Roadmap Note */}
                <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#d4af37]" />
                      <span>Payment Modes Breakdown</span>
                    </h4>
                    <div className="space-y-3">
                      {analyticsData.payments.length > 0 ? (
                        analyticsData.payments.map((pm, i) => (
                          <div key={i} className="space-y-1 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-[var(--text-main)] font-medium">{pm.method}</span>
                              <span className="text-[var(--text-sub)] font-mono">
                                {pm.percentage}% ({pm.count} orders)
                              </span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${pm.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[var(--text-sub)] italic">No payment transactions recorded yet.</p>
                      )}
                    </div>
                  </div>

                  {/* "Baad me graphs" Roadmap Notice */}
                  <div className="p-3.5 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] flex items-center gap-2.5 text-[11px] text-[var(--text-sub-light)]">
                    <Sparkles className="w-4 h-4 text-[#d4af37] shrink-0" />
                    <span>
                      <strong className="text-[var(--text-main)]">Note:</strong> Baad me graphs &mdash; Numerical telemetry and leaderboards active. Interactive chart views queued for next release.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB: SETTINGS
              ========================================================== */}
          {/* ==========================================================
              TAB: SETTINGS (PHASE 23 - Restaurant Settings No-Code System)
              ========================================================== */}
          {activeTab === "settings" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
                    <Store className="w-5 h-5 text-[#d4af37]" />
                    Restaurant Settings
                  </h2>
                  <p className="text-xs text-[var(--text-sub)]">
                    Owner Control Center &mdash; Update restaurant details, delivery fees, taxes, and logo without editing code.
                  </p>
                </div>

                <button
                  type="submit"
                  form="restaurant-settings-form"
                  disabled={isSavingSettings}
                  className="px-5 py-2.5 rounded-xl bg-gold-gradient text-black font-semibold text-xs flex items-center justify-center gap-2 shadow-md hover:opacity-90 active:scale-98 disabled:opacity-40 transition-all cursor-pointer font-mono"
                >
                  {isSavingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>[ SAVE SETTINGS ]</span>
                    </>
                  )}
                </button>
              </div>

              {/* Success Notification Alert */}
              {settingsSavedMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{settingsSavedMessage}</span>
                </div>
              )}

              <form id="restaurant-settings-form" onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* CARD 1: Brand & Identity */}
                  <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-4">
                    <h3 className="text-sm font-serif font-bold text-[var(--text-main)] flex items-center gap-2 pb-2 border-b border-[var(--card-border)]">
                      <Sparkles className="w-4 h-4 text-[#d4af37]" />
                      <span>Branding &amp; Identity</span>
                    </h3>

                    {/* Restaurant Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                        Restaurant Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.name}
                        onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                        placeholder="NEXORA Fine Dining"
                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    {/* Official Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                        Official Email Address
                      </label>
                      <input
                        type="email"
                        value={settingsForm.email}
                        onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                        placeholder="vaibhavpatel8543@gmail.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    {/* Restaurant Logo */}
                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center justify-between">
                        <span>Restaurant Logo</span>
                        <span className="text-[10px] text-[var(--text-sub)] font-normal">Supabase Storage / URL</span>
                      </label>

                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-[#d4af37]/40 bg-black/40 shrink-0 shadow-md">
                          <Image
                            src={settingsForm.logo_url || "/logo.png"}
                            alt="Logo Preview"
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1 space-y-1.5">
                          <input
                            type="text"
                            value={settingsForm.logo_url}
                            onChange={(e) => setSettingsForm({ ...settingsForm, logo_url: e.target.value })}
                            placeholder="/logo.png or Supabase CDN URL"
                            className="w-full px-3.5 py-2 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                          />
                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1 rounded-lg text-[10px] font-semibold bg-[var(--section-alt)] text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/10 cursor-pointer flex items-center gap-1.5 transition-all">
                              <Upload className="w-3 h-3" />
                              <span>{isUploadingLogo ? "Uploading..." : "Upload New Logo"}</span>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleLogoUpload}
                                disabled={isUploadingLogo}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setSettingsForm({ ...settingsForm, logo_url: "/logo.png" })}
                              className="px-2.5 py-1 rounded-lg text-[10px] text-[var(--text-sub)] hover:text-white border border-[var(--card-border)] cursor-pointer"
                            >
                              Reset to Default
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Contact & Support (Two Dedicated Numbers) */}
                  <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-4">
                    <h3 className="text-sm font-serif font-bold text-[var(--text-main)] flex items-center gap-2 pb-2 border-b border-[var(--card-border)]">
                      <Phone className="w-4 h-4 text-[#d4af37]" />
                      <span>Dedicated Phone Numbers</span>
                    </h3>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center justify-between">
                        <span>Restaurant Worker / Staff Phone *</span>
                        <span className="text-[10px] text-emerald-400 font-normal">Kitchen &amp; Manager</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.phone}
                        onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                        placeholder="+91 83038 90056"
                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center justify-between">
                        <span>Delivery Boy / Dispatcher Phone</span>
                        <span className="text-[10px] text-amber-400 font-normal">Rider &amp; Order Delivery</span>
                      </label>
                      <input
                        type="text"
                        value={settingsForm.phone_secondary || ""}
                        onChange={(e) => setSettingsForm({ ...settingsForm, phone_secondary: e.target.value })}
                        placeholder="+91 91204 89210"
                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div className="p-3 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[11px] text-[var(--text-sub)]">
                      <p className="leading-relaxed">
                        <strong className="text-[var(--text-main)]">Auto-sync Note:</strong> Both numbers appear automatically on customer order tracking and instant support modal.
                      </p>
                    </div>
                  </div>

                  {/* CARD 3: Location & Operational Timings */}
                  <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-4">
                    <h3 className="text-sm font-serif font-bold text-[var(--text-main)] flex items-center gap-2 pb-2 border-b border-[var(--card-border)]">
                      <MapPin className="w-4 h-4 text-[#d4af37]" />
                      <span>Address &amp; Operating Timings</span>
                    </h3>

                    {/* Address */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                        Full Physical Address *
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={settingsForm.address}
                        onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                        placeholder="Sathigva, Amauli-Fatehpur Road..."
                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[#d4af37] resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Opening Hours */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                          Opening Hours *
                        </label>
                        <input
                          type="text"
                          required
                          value={settingsForm.opening_hours}
                          onChange={(e) => setSettingsForm({ ...settingsForm, opening_hours: e.target.value })}
                          placeholder="11:00 AM – 11:30 PM (Mon – Sun)"
                          className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      {/* Delivery Radius */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                          Delivery Radius *
                        </label>
                        <input
                          type="text"
                          required
                          value={settingsForm.delivery_radius}
                          onChange={(e) => setSettingsForm({ ...settingsForm, delivery_radius: e.target.value })}
                          placeholder="15 km"
                          className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: Order Economics & Taxation */}
                  <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-4">
                    <h3 className="text-sm font-serif font-bold text-[var(--text-main)] flex items-center gap-2 pb-2 border-b border-[var(--card-border)]">
                      <DollarSign className="w-4 h-4 text-[#d4af37]" />
                      <span>Order Economics &amp; Charges</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Minimum Order */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                          Min Order (₹) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={settingsForm.minimum_order}
                          onChange={(e) => setSettingsForm({ ...settingsForm, minimum_order: Number(e.target.value) })}
                          placeholder="199"
                          className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      {/* Delivery Fee */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                          Delivery Fee (₹) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={settingsForm.delivery_fee}
                          onChange={(e) => setSettingsForm({ ...settingsForm, delivery_fee: Number(e.target.value) })}
                          placeholder="40"
                          className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                        />
                        <span className="text-[10px] text-[var(--text-sub-light)] block">Set 0 for free delivery</span>
                      </div>

                      {/* Tax / GST Rate */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                          GST / Tax Rate (%) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="28"
                          required
                          value={settingsForm.tax_percent}
                          onChange={(e) => setSettingsForm({ ...settingsForm, tax_percent: Number(e.target.value) })}
                          placeholder="5"
                          className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                        />
                        <span className="text-[10px] text-[var(--text-sub-light)] block">Standard 5% restaurant GST</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[11px] text-[var(--text-sub)]">
                      <p>
                        Cart subtotal and checkout automatically calculate delivery charges and minimum order constraints using these exact figures.
                      </p>
                    </div>
                  </div>

                  {/* CARD 5: Social Media & Discovery Links */}
                  <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] space-y-4 lg:col-span-2">
                    <h3 className="text-sm font-serif font-bold text-[var(--text-main)] flex items-center gap-2 pb-2 border-b border-[var(--card-border)]">
                      <Globe className="w-4 h-4 text-[#d4af37]" />
                      <span>Social Media Profiles &amp; Direct Links</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Instagram */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                          Instagram URL
                        </label>
                        <input
                          type="url"
                          value={settingsForm.social_links?.instagram || ""}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              social_links: {
                                ...settingsForm.social_links,
                                instagram: e.target.value,
                              },
                            })
                          }
                          placeholder="https://instagram.com/nexora_restaurant"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      {/* WhatsApp */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                          WhatsApp Link
                        </label>
                        <input
                          type="text"
                          value={settingsForm.social_links?.whatsapp || ""}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              social_links: {
                                ...settingsForm.social_links,
                                whatsapp: e.target.value,
                              },
                            })
                          }
                          placeholder="https://wa.me/918303890056"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      {/* Facebook */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                          Facebook Page
                        </label>
                        <input
                          type="url"
                          value={settingsForm.social_links?.facebook || ""}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              social_links: {
                                ...settingsForm.social_links,
                                facebook: e.target.value,
                              },
                            })
                          }
                          placeholder="https://facebook.com/nexora"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>

                      {/* Google Maps */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                          Google Maps URL
                        </label>
                        <input
                          type="url"
                          value={settingsForm.social_links?.google_maps || ""}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              social_links: {
                                ...settingsForm.social_links,
                                google_maps: e.target.value,
                              },
                            })
                          }
                          placeholder="https://maps.google.com/..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: Live Customer View Preview */}
                  <div className="p-6 rounded-3xl bg-[var(--card-bg)] border border-[#d4af37]/40 space-y-4 lg:col-span-2 shadow-sm">
                    <h3 className="text-sm font-serif font-bold text-[#d4af37] flex items-center gap-2 pb-2 border-b border-[var(--card-border)]">
                      <Store className="w-4 h-4" />
                      <span>Live Website Brand Preview (How Customers See Your Restaurant)</span>
                    </h3>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--background)] border border-[var(--card-border)]">
                      <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-[#d4af37]/30 bg-black/40 shrink-0">
                          <Image
                            src={settingsForm.logo_url || "/logo.png"}
                            alt="Logo"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-base text-gold-gradient">
                            {settingsForm.name}
                          </h4>
                          <p className="text-xs text-[var(--text-sub)]">
                            {settingsForm.address}
                          </p>
                          <p className="text-[11px] font-mono text-[#d4af37] mt-0.5">
                            {settingsForm.phone} {settingsForm.phone_secondary && `• ${settingsForm.phone_secondary}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end gap-2 text-right">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {settingsForm.opening_hours}
                        </span>
                        <span className="text-[11px] text-[var(--text-sub)]">
                          Delivery: <strong className="text-[var(--text-main)]">₹{settingsForm.delivery_fee}</strong> &bull; Min: <strong className="text-[var(--text-main)]">₹{settingsForm.minimum_order}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Submit Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gold-gradient text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:opacity-90 active:scale-98 disabled:opacity-40 transition-all cursor-pointer font-mono"
                  >
                    {isSavingSettings ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Restaurant Settings...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>[ SAVE RESTAURANT SETTINGS ]</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
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

              {/* ==============================================================
                  PHASE 21: IMAGE STORAGE (Supabase Storage Flow)
                  Admin uploads image -> Supabase Storage -> URL -> menu_items.image
                  ============================================================== */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
                    <span>Food Image (Supabase Storage)</span>
                    <span className="text-rose-400">*</span>
                  </label>

                  {/* Mode Toggle: File Upload vs URL / Presets */}
                  <div className="flex items-center bg-[var(--section-alt)] p-0.5 rounded-lg border border-[var(--card-border)] text-[10px]">
                    <button
                      type="button"
                      onClick={() => setImageInputMode("upload")}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        imageInputMode === "upload"
                          ? "bg-gold-gradient text-black shadow-xs font-bold"
                          : "text-[var(--text-sub)] hover:text-white"
                      }`}
                    >
                      Supabase Storage
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode("url")}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        imageInputMode === "url"
                          ? "bg-gold-gradient text-black shadow-xs font-bold"
                          : "text-[var(--text-sub)] hover:text-white"
                      }`}
                    >
                      URL / Presets
                    </button>
                  </div>
                </div>

                {imageInputMode === "upload" ? (
                  /* 1. Supabase Storage Upload Dropzone */
                  <div className="space-y-2">
                    <label className="relative flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-[#d4af37]/40 hover:border-[#d4af37] rounded-2xl bg-[var(--background)] hover:bg-[#d4af37]/5 transition-all cursor-pointer group">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/jpg"
                        onChange={handleImageFileUpload}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        {isUploadingImage ? (
                          <div className="flex flex-col items-center gap-2 text-[#d4af37]">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="text-xs font-semibold">
                              Uploading to Supabase Storage (menu-images)...
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] mb-2 group-hover:scale-110 transition-transform">
                              <Upload className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-semibold text-[var(--text-main)]">
                              Click to choose image or drag &amp; drop
                            </p>
                            <p className="text-[10px] text-[var(--text-sub-light)] mt-0.5">
                              Uploads to Supabase Storage &bull; PNG, JPG, or WebP
                            </p>
                          </>
                        )}
                      </div>
                    </label>

                    {/* Supabase Storage Upload Status Banner */}
                    {uploadStatus && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-400 flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{uploadStatus}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 2. Manual URL / Quick Presets */
                  <div className="space-y-2">
                    <input
                      type="url"
                      required
                      value={dishForm.image}
                      onChange={(e) => setDishForm({ ...dishForm, image: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                    />

                    {/* Quick Presets */}
                    <div className="space-y-1">
                      <span className="text-[11px] text-[var(--text-sub)]">Quick High-Res Presets:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: "Paneer Starter", url: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80" },
                          { label: "Dal Bukhara", url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80" },
                          { label: "Chilli Paneer", url: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80" },
                          { label: "Hakka Noodles", url: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80" },
                          { label: "Woodfire Pizza", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80" },
                          { label: "Shahi Dessert", url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80" },
                          { label: "Kesar Beverage", url: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80" },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setDishForm({ ...dishForm, image: preset.url });
                              setUploadStatus(null);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[10px] bg-[var(--section-alt)] text-[var(--text-sub)] hover:text-[#d4af37] border border-[var(--card-border)] hover:border-[#d4af37]/40 cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Storage Result Preview & Public CDN URL (menu_items.image) */}
                {dishForm.image && (
                  <div className="space-y-1.5 pt-1">
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[var(--card-border)] bg-black/40">
                      <Image
                        src={dishForm.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Supabase Storage URL linked</span>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white/90">
                        Live Preview
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[11px] font-mono text-[var(--text-sub)] truncate">
                      <span className="text-[#d4af37] font-semibold shrink-0">image_url:</span>
                      <span className="truncate flex-1">{dishForm.image}</span>
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

      {/* ==========================================================
          MODAL: ADD / EDIT OFFER (PHASE 22)
          ========================================================== */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-[var(--card-bg)] border border-[#d4af37]/40 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)]">
              <div>
                <h3 className="text-lg font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#d4af37]" />
                  <span>{editingOffer ? "Edit Offer Code" : "Create New Coupon Offer"}</span>
                </h3>
                <p className="text-xs text-[var(--text-sub)]">
                  {editingOffer ? `Updating ${editingOffer.code} discount parameters` : "Add a promo code for customer discounts"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOfferModalOpen(false)}
                className="p-2 rounded-xl text-[var(--text-sub)] hover:text-white hover:bg-[var(--section-alt)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-4">
              {/* Field: Offer Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={offerForm.code}
                  onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value.toUpperCase().replace(/\s+/g, "") })}
                  placeholder="e.g. SAVE50"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-sm font-mono font-bold tracking-wider text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Field: Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                    Discount Type
                  </label>
                  <select
                    value={offerForm.discount_type}
                    onChange={(e) => setOfferForm({ ...offerForm, discount_type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="flat">Flat Amount Discount (₹)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                    {offerForm.discount_type === "percentage" ? "Discount Percentage (%) *" : "Flat Discount (₹) *"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={offerForm.discount_type === "percentage" ? "100" : "5000"}
                    required
                    value={offerForm.discount_value}
                    onChange={(e) => setOfferForm({ ...offerForm, discount_value: Number(e.target.value) })}
                    placeholder={offerForm.discount_type === "percentage" ? "20" : "50"}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-sm font-mono text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              {/* Field: Minimum Order & Maximum Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                    Min Order Value (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={offerForm.minimum_order}
                    onChange={(e) => setOfferForm({ ...offerForm, minimum_order: Number(e.target.value) })}
                    placeholder="499"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-sm font-mono text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={offerForm.max_discount || ""}
                    onChange={(e) => setOfferForm({ ...offerForm, max_discount: Number(e.target.value) || 0 })}
                    placeholder="e.g. 150 (Leave empty for no limit)"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-sm font-mono text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              {/* Field: Expiry Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center justify-between">
                  <span>Expiry Date</span>
                  <span className="text-[10px] text-[var(--text-sub)] font-normal">Optional (Leave blank for ongoing)</span>
                </label>
                <input
                  type="date"
                  value={offerForm.end_date}
                  onChange={(e) => setOfferForm({ ...offerForm, end_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Field: Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                  Description / Terms
                </label>
                <textarea
                  rows={2}
                  value={offerForm.description}
                  onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                  placeholder="Special 20% discount on gourmet fine-dining orders..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37] resize-none"
                />
              </div>

              {/* Field: Active Status */}
              <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--card-border)]">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-semibold text-[var(--text-main)]">
                      Active (Redeemable by guests at checkout)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={offerForm.is_active}
                    onChange={(e) => setOfferForm({ ...offerForm, is_active: e.target.checked })}
                    className="w-4 h-4 accent-[#d4af37] cursor-pointer"
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(false)}
                  className="w-1/3 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)] bg-[var(--section-alt)] hover:text-white border border-[var(--card-border)] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 active:scale-98 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>[ SAVE OFFER ]</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TEAM MEMBER */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl bg-[var(--card-bg)] border border-[#d4af37]/40 p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
              <div>
                <h3 className="text-lg font-serif font-bold text-[var(--text-main)]">
                  Add Team Member
                </h3>
                <p className="text-xs text-[var(--text-sub)]">
                  Create new Admin or Sub-Admin access.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="text-[var(--text-sub)] hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTeamMember} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]">
                  Role
                </label>
                <select
                  value={teamForm.role}
                  onChange={(e) =>
                    setTeamForm((prev) => ({
                      ...prev,
                      role: e.target.value as "admin" | "sub_admin",
                    }))
                  }
                  className="w-full text-xs px-3.5 py-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="admin">👔 Admin (Menu, Categories & Orders)</option>
                  <option value="sub_admin">🛵 Sub-Admin (Delivery Partner - Orders only)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={teamForm.name}
                  onChange={(e) => setTeamForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-xs px-3.5 py-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]">
                  Login Email
                </label>
                <input
                  type="email"
                  required
                  value={teamForm.email}
                  onChange={(e) => setTeamForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. delivery@nexora.com"
                  className="w-full text-xs px-3.5 py-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)]">
                  Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={teamForm.password}
                  onChange={(e) => setTeamForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full text-xs px-3.5 py-3 rounded-xl bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider text-[var(--text-sub)] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTeamMember}
                  className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingTeamMember ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Create Member</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
