"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { RestaurantSettings } from "@/types/database";

export const DEFAULT_SETTINGS: RestaurantSettings = {
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

interface SettingsContextType {
  settings: RestaurantSettings;
  updateSettings: (newSettings: Partial<RestaurantSettings>) => Promise<boolean>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: async () => false,
  isLoading: false,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<RestaurantSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load settings on mount from localStorage and /api/settings
  useEffect(() => {
    // 1. Initial local load
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("nexora_restaurant_settings");
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings((prev) => ({
            ...prev,
            ...parsed,
            social_links: {
              ...prev.social_links,
              ...(parsed.social_links || {}),
            },
          }));
        }
      } catch (err) {
        console.warn("Local settings read notice:", err);
      }
    }

    // 2. Fetch server settings
    async function fetchServerSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.settings) {
            setSettings(data.settings);
            if (typeof window !== "undefined") {
              localStorage.setItem("nexora_restaurant_settings", JSON.stringify(data.settings));
            }
          }
        }
      } catch (err) {
        console.warn("Server settings fetch notice:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchServerSettings();

    // 3. Listen to live sync events from Admin
    const handleSettingsUpdated = () => {
      try {
        const stored = localStorage.getItem("nexora_restaurant_settings");
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings(parsed);
        }
      } catch {}
    };

    window.addEventListener("nexora_settings_updated", handleSettingsUpdated);
    return () => {
      window.removeEventListener("nexora_settings_updated", handleSettingsUpdated);
    };
  }, []);

  // Update Settings Handler
  const updateSettings = async (newSettings: Partial<RestaurantSettings>): Promise<boolean> => {
    const merged: RestaurantSettings = {
      ...settings,
      ...newSettings,
      social_links: {
        ...settings.social_links,
        ...(newSettings.social_links || {}),
      },
      updated_at: new Date().toISOString(),
    };

    setSettings(merged);

    if (typeof window !== "undefined") {
      localStorage.setItem("nexora_restaurant_settings", JSON.stringify(merged));
      window.dispatchEvent(new Event("nexora_settings_updated"));
    }

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(merged),
      });
      return res.ok;
    } catch (err) {
      console.warn("Settings API update error:", err);
      return false;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useRestaurantSettings() {
  const context = useContext(SettingsContext);
  return context;
}
