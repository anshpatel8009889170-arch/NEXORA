import { supabase } from "@/lib/supabase/client";
import { MenuItem, Category } from "@/types/database";

export const fallbackCategories: Category[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Royal Starters",
    slug: "starters",
    description: "Handcrafted royal appetizers and charcoal-smoked delicacies",
    display_order: 1,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Main Course",
    slug: "main-course",
    description: "Curated master chef special gravies, aromatic biryanis & grills",
    display_order: 2,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Woodfire Pizzas",
    slug: "pizza",
    description: "San Marzano tomatoes, fresh buffalo mozzarella & Italian crust",
    display_order: 3,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Desserts",
    slug: "desserts",
    description: "Exquisite golden confectionery and velvet culinary finales",
    display_order: 4,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    name: "Drinks & Elixirs",
    slug: "drinks",
    description: "Infused luxury elixirs, chilled botanicals & royal shakes",
    display_order: 5,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
];

export const fallbackMenuItems: (MenuItem & { rating?: number; reviewCount?: number })[] = [
  // Starters
  {
    id: "item-1",
    category_id: "11111111-1111-1111-1111-111111111111",
    name: "Paneer Tikka",
    slug: "paneer-tikka",
    description:
      "Grilled cottage cheese marinated in aromatic royal spices, roasted bell peppers, served hot with zesty mint chutney.",
    price: 249,
    image_url:
      "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80",
    is_veg: true,
    is_vegetarian: true,
    is_available: true,
    is_featured: true,
    spice_level: "medium",
    prep_time_minutes: 18,
    calories: 380,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    rating: 4.8,
    reviewCount: 142,
  },
  {
    id: "item-2",
    category_id: "11111111-1111-1111-1111-111111111111",
    name: "Zafrani Murgh Seekh Kebab",
    slug: "zafrani-murgh-seekh-kebab",
    description:
      "Hand-minced tender chicken infused with saffron threads, crushed pepper, melted ghee, served with fresh mint emulsion.",
    price: 560,
    image_url:
      "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
    is_veg: false,
    is_vegetarian: false,
    is_available: true,
    is_featured: true,
    spice_level: "medium",
    prep_time_minutes: 20,
    calories: 420,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    rating: 4.9,
    reviewCount: 98,
  },
  {
    id: "item-3",
    category_id: "11111111-1111-1111-1111-111111111111",
    name: "Crispy Lotus Stem Honey Chilli",
    slug: "crispy-lotus-stem-honey-chilli",
    description:
      "Thinly sliced lotus root crisp tossed in mountain honey, kashmiri chilli glaze and toasted white sesame.",
    price: 420,
    image_url:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    is_veg: true,
    is_vegetarian: true,
    is_available: true,
    is_featured: false,
    spice_level: "spicy",
    prep_time_minutes: 15,
    calories: 310,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    rating: 4.7,
    reviewCount: 64,
  },

  // Main Course
  {
    id: "item-4",
    category_id: "22222222-2222-2222-2222-222222222222",
    name: "NEXORA Royal Dal Bukhara",
    slug: "nexora-royal-dal-bukhara",
    description:
      "Black lentils slow-cooked overnight over gentle charcoal embers with fresh cream, churned butter & sun-ripened tomatoes.",
    price: 520,
    discount_price: 470,
    image_url:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80",
    is_veg: true,
    is_vegetarian: true,
    is_available: true,
    is_featured: true,
    spice_level: "mild",
    prep_time_minutes: 25,
    calories: 460,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    rating: 4.9,
    reviewCount: 215,
  },
  {
    id: "item-5",
    category_id: "22222222-2222-2222-2222-222222222222",
    name: "Old Delhi Butter Chicken Grand Cru",
    slug: "butter-chicken-grand-cru",
    description:
      "Smoked succulent tandoori chicken simmered in a velvety makhani gravy finished with dried fenugreek and raw honey.",
    price: 640,
    discount_price: 580,
    image_url:
      "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80",
    is_veg: false,
    is_vegetarian: false,
    is_available: true,
    is_featured: true,
    spice_level: "mild",
    prep_time_minutes: 25,
    calories: 590,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    rating: 4.9,
    reviewCount: 310,
  },
  {
    id: "item-6",
    category_id: "22222222-2222-2222-2222-222222222222",
    name: "Dum Gosht Awadhi Biryani",
    slug: "dum-gosht-awadhi-biryani",
    description:
      "Aged long-grain basmati rice layered with tender mutton cuts, saffron milk, sealed in earthen pot and slow cooked on dum.",
    price: 720,
    image_url:
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    is_veg: false,
    is_vegetarian: false,
    is_available: true,
    is_featured: true,
    spice_level: "spicy",
    prep_time_minutes: 30,
    calories: 680,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    rating: 4.8,
    reviewCount: 178,
  },
  {
    id: "item-7",
    category_id: "22222222-2222-2222-2222-222222222222",
    name: "Paneer Lababdar Aur Khoya",
    slug: "paneer-lababdar-aur-khoya",
    description:
      "Diced cottage cheese steeped in rich onion-tomato gravy with grated fresh khoya, churned butter and artisanal spices.",
    price: 510,
    image_url:
      "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",
    is_veg: true,
    is_vegetarian: true,
    is_available: true,
    is_featured: false,
    spice_level: "medium",
    prep_time_minutes: 20,
    calories: 490,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    rating: 4.7,
    reviewCount: 89,
  },

  // Woodfire Pizzas
  {
    id: "item-8",
    category_id: "33333333-3333-3333-3333-333333333333",
    name: "Burrata & Truffle Funghi Pizza",
    slug: "burrata-truffle-funghi-pizza",
    description:
      "Handcrafted 48h fermented sourdough crust, San Marzano marinara, wild forest mushrooms, crowned with fresh creamy burrata.",
    price: 680,
    discount_price: 610,
    image_url:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    is_veg: true,
    is_vegetarian: true,
    is_available: true,
    is_featured: true,
    spice_level: "mild",
    prep_time_minutes: 20,
    calories: 720,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    rating: 4.9,
    reviewCount: 156,
  },
  {
    id: "item-9",
    category_id: "33333333-3333-3333-3333-333333333333",
    name: "Woodfire Pepperoni & Hot Honey",
    slug: "woodfire-pepperoni-hot-honey",
    description:
      "Thin crispy crust with spiced artisan pepperoni, crushed San Marzano tomatoes, fresh mozzarella, finished with chili-infused hot honey.",
    price: 740,
    image_url:
      "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80",
    is_veg: false,
    is_vegetarian: false,
    is_available: true,
    is_featured: true,
    spice_level: "spicy",
    prep_time_minutes: 20,
    calories: 790,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    rating: 4.8,
    reviewCount: 122,
  },

  // Desserts
  {
    id: "item-10",
    category_id: "44444444-4444-4444-4444-444444444444",
    name: "24K Gold Leaf Saffron Shahi Tukda",
    slug: "24k-gold-saffron-shahi-tukda",
    description:
      "Royal ghee-fried brioche steeped in saffron rabdi, garnished with slivered pistachios, crushed almonds and pure 24-karat edible gold foil.",
    price: 380,
    discount_price: 320,
    image_url:
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    is_veg: true,
    is_vegetarian: true,
    is_available: true,
    is_featured: true,
    spice_level: "mild",
    prep_time_minutes: 12,
    calories: 340,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    rating: 5.0,
    reviewCount: 284,
  },
  {
    id: "item-11",
    category_id: "44444444-4444-4444-4444-444444444444",
    name: "Belgian Dark Truffle Fondant",
    slug: "belgian-dark-truffle-fondant",
    description:
      "Molten 70% Single Origin chocolate cake with a warm flowing cocoa core, served with handcrafted Madagascar vanilla bean gelato.",
    price: 420,
    image_url:
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
    is_veg: true,
    is_vegetarian: true,
    is_available: true,
    is_featured: false,
    spice_level: "mild",
    prep_time_minutes: 15,
    calories: 480,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    rating: 4.8,
    reviewCount: 95,
  },

  // Drinks
  {
    id: "item-12",
    category_id: "55555555-5555-5555-5555-555555555555",
    name: "Smoked Rose & Berry Royale",
    slug: "smoked-rose-berry-royale",
    description:
      "Wild forest berries muddled with organic Damascus rose reduction, sparkling artisanal tonic, served over crystal clear ice with fragrant applewood smoke.",
    price: 290,
    discount_price: 250,
    image_url:
      "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
    is_veg: true,
    is_vegetarian: true,
    is_available: true,
    is_featured: true,
    spice_level: "mild",
    prep_time_minutes: 8,
    calories: 160,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    rating: 4.7,
    reviewCount: 77,
  },
  {
    id: "item-13",
    category_id: "55555555-5555-5555-5555-555555555555",
    name: "Saffron Cardamom Cold Brew Latte",
    slug: "saffron-cardamom-cold-brew",
    description:
      "Monsooned Malabar Arabica slow-steeped for 20 hours with crushed green cardamom pods, topped with saffron cold cream foam.",
    price: 310,
    image_url:
      "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
    is_veg: true,
    is_vegetarian: true,
    is_available: true,
    is_featured: false,
    spice_level: "mild",
    prep_time_minutes: 8,
    calories: 180,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    rating: 4.8,
    reviewCount: 68,
  },
];

export function getMenuItemBySlug(slug: string) {
  if (!slug) return undefined;
  const decoded = decodeURIComponent(slug).toLowerCase().trim();
  return fallbackMenuItems.find(
    (item) =>
      item.slug?.toLowerCase() === decoded ||
      item.id === decoded ||
      item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === decoded
  );
}

export function getAllMenuItems() {
  return fallbackMenuItems;
}

export function getAllCategories() {
  return fallbackCategories;
}

export function getRelatedMenuItems(categoryId: string, currentId: string) {
  return fallbackMenuItems
    .filter((item) => item.category_id === categoryId && item.id !== currentId)
    .slice(0, 3);
}
