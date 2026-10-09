"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Profile } from "@/types/database";

export interface DeliveryAddressData {
  street: string;
  landmark?: string;
  city: string;
  pincode?: string;
}

export interface SavedAddress {
  id: string;
  type: "Home" | "Work" | "Other";
  street: string;
  landmark?: string;
  city: string;
  pincode?: string;
}

const initialSavedAddresses: SavedAddress[] = [
  {
    id: "addr_home",
    type: "Home",
    street: "Near Ankit Internet Cafe And Janseva Kendra",
    landmark: "Sathigva Road",
    city: "Amauli - Fatehpur",
    pincode: "212631",
  },
  {
    id: "addr_work",
    type: "Work",
    street: "Main Market Commercial Plaza",
    landmark: "Amauli Road",
    city: "Amauli - Fatehpur",
    pincode: "212631",
  },
];

interface AuthUser {
  id: string;
  phone?: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  deliveryAddress: DeliveryAddressData | null;
  savedAddresses: SavedAddress[];
  selectedAddressId: string;
  setSelectedAddressId: (id: string) => void;
  addSavedAddress: (address: Omit<SavedAddress, "id">) => SavedAddress;
  sendOtp: (phone: string) => Promise<{ success: boolean; message?: string; mockOtp?: string }>;
  verifyOtp: (phone: string, token: string) => Promise<{ success: boolean; message?: string; isNewUser?: boolean }>;
  updateProfileName: (fullName: string) => Promise<{ success: boolean; message?: string }>;
  saveDeliveryAddress: (address: DeliveryAddressData) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddressData | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(initialSavedAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("addr_home");
  const [isLoading, setIsLoading] = useState(true);

  // Load user, profile and saved addresses on initial mount
  useEffect(() => {
    async function initAuth() {
      try {
        // 1. Check local cached session first
        const cachedUser = localStorage.getItem("nexora-user");
        const cachedProfile = localStorage.getItem("nexora-profile");
        const cachedAddress = localStorage.getItem("nexora-address");
        const cachedSavedAddresses = localStorage.getItem("nexora-saved-addresses");
        const cachedSelectedAddressId = localStorage.getItem("nexora-selected-address-id");

        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
          } catch {}
        }
        if (cachedProfile) {
          try {
            setProfile(JSON.parse(cachedProfile));
          } catch {}
        }
        if (cachedAddress) {
          try {
            setDeliveryAddress(JSON.parse(cachedAddress));
          } catch {}
        }
        if (cachedSavedAddresses) {
          try {
            const parsed = JSON.parse(cachedSavedAddresses);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSavedAddresses(parsed);
            }
          } catch {}
        }
        if (cachedSelectedAddressId) {
          setSelectedAddressId(cachedSelectedAddressId);
        }

        // 2. Synchronize with Supabase Auth session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const u: AuthUser = {
            id: session.user.id,
            phone: session.user.phone,
            email: session.user.email,
          };
          setUser(u);
          localStorage.setItem("nexora-user", JSON.stringify(u));

          // Fetch profile from database
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();

          if (profileData) {
            setProfile(profileData as Profile);
            localStorage.setItem("nexora-profile", JSON.stringify(profileData));
            if (profileData.address) {
              setDeliveryAddress(profileData.address as unknown as DeliveryAddressData);
            }
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase Auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u: AuthUser = {
          id: session.user.id,
          phone: session.user.phone,
          email: session.user.email,
        };
        setUser(u);
        localStorage.setItem("nexora-user", JSON.stringify(u));

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData as Profile);
          localStorage.setItem("nexora-profile", JSON.stringify(profileData));
        }
      } else {
        const cachedUser = localStorage.getItem("nexora-user");
        if (!cachedUser) {
          setUser(null);
          setProfile(null);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Update selected address ID
  const handleSelectAddressId = (id: string) => {
    setSelectedAddressId(id);
    localStorage.setItem("nexora-selected-address-id", id);
  };

  // Add new saved address
  const addSavedAddress = (address: Omit<SavedAddress, "id">): SavedAddress => {
    const newAddr: SavedAddress = {
      ...address,
      id: `addr_${Date.now()}`,
    };
    const updated = [...savedAddresses, newAddr];
    setSavedAddresses(updated);
    setSelectedAddressId(newAddr.id);
    localStorage.setItem("nexora-saved-addresses", JSON.stringify(updated));
    localStorage.setItem("nexora-selected-address-id", newAddr.id);
    return newAddr;
  };

  // Send OTP to phone
  const sendOtp = async (phoneNumber: string): Promise<{ success: boolean; message?: string; mockOtp?: string }> => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.length < 10) {
      return { success: false, message: "Please enter a valid 10-digit mobile number." };
    }

    const formattedPhone = cleaned.length === 10 ? `+91${cleaned}` : `+${cleaned}`;

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        console.warn("Supabase SMS provider notice:", error.message);
        return {
          success: true,
          message: "Verification code generated! (Use demo code 123456)",
          mockOtp: "123456",
        };
      }

      return {
        success: true,
        message: `OTP sent to ${formattedPhone}`,
      };
    } catch {
      return {
        success: true,
        message: "Verification code generated! (Use demo code 123456)",
        mockOtp: "123456",
      };
    }
  };

  // Verify OTP
  const verifyOtp = async (
    phoneNumber: string,
    token: string
  ): Promise<{ success: boolean; message?: string; isNewUser?: boolean }> => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    const formattedPhone = cleaned.length === 10 ? `+91${cleaned}` : `+${cleaned}`;

    try {
      // 1. Attempt Supabase Auth verify
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: token.trim(),
        type: "sms",
      });

      if (!error && data?.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          phone: formattedPhone,
        };
        setUser(authUser);
        localStorage.setItem("nexora-user", JSON.stringify(authUser));

        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();

        if (existingProfile && existingProfile.full_name && existingProfile.full_name !== "Guest") {
          setProfile(existingProfile as Profile);
          localStorage.setItem("nexora-profile", JSON.stringify(existingProfile));
          return { success: true, isNewUser: false };
        } else {
          const newProfile: Profile = {
            id: data.user.id,
            full_name: "",
            phone: formattedPhone,
            role: "customer",
            created_at: new Date().toISOString(),
          };
          setProfile(newProfile);
          localStorage.setItem("nexora-profile", JSON.stringify(newProfile));
          return { success: true, isNewUser: true };
        }
      }

      // 2. Demo OTP fallback verification for development
      if (token.trim() === "123456" || token.trim() === "000000") {
        const fallbackId = `user_${cleaned}`;
        const authUser: AuthUser = {
          id: fallbackId,
          phone: formattedPhone,
        };
        setUser(authUser);
        localStorage.setItem("nexora-user", JSON.stringify(authUser));

        const cachedProfile = localStorage.getItem(`nexora-profile-${cleaned}`);
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          setProfile(parsed);
          localStorage.setItem("nexora-profile", JSON.stringify(parsed));
          return { success: true, isNewUser: !parsed.full_name };
        }

        const newProfile: Profile = {
          id: fallbackId,
          full_name: "",
          phone: formattedPhone,
          role: "customer",
          created_at: new Date().toISOString(),
        };
        setProfile(newProfile);
        localStorage.setItem("nexora-profile", JSON.stringify(newProfile));
        return { success: true, isNewUser: true };
      }

      return {
        success: false,
        message: error?.message || "Invalid OTP entered. Please try again or use 123456.",
      };
    } catch (err: unknown) {
      if (token.trim() === "123456") {
        const fallbackId = `user_${cleaned}`;
        const authUser: AuthUser = { id: fallbackId, phone: formattedPhone };
        setUser(authUser);
        localStorage.setItem("nexora-user", JSON.stringify(authUser));

        const newProfile: Profile = {
          id: fallbackId,
          full_name: "",
          phone: formattedPhone,
          role: "customer",
          created_at: new Date().toISOString(),
        };
        setProfile(newProfile);
        localStorage.setItem("nexora-profile", JSON.stringify(newProfile));
        return { success: true, isNewUser: true };
      }

      const errorMessage = err instanceof Error ? err.message : "Verification failed.";
      return { success: false, message: errorMessage };
    }
  };

  // Update customer name in profile
  const updateProfileName = async (fullName: string): Promise<{ success: boolean; message?: string }> => {
    if (!user) {
      return { success: false, message: "No active user session found." };
    }

    const trimmed = fullName.trim();
    if (!trimmed) {
      return { success: false, message: "Please enter your name." };
    }

    try {
      const updatedProfile: Profile = {
        ...(profile || {
          id: user.id,
          role: "customer",
          created_at: new Date().toISOString(),
        }),
        full_name: trimmed,
        phone: user.phone || profile?.phone,
      };

      setProfile(updatedProfile);
      localStorage.setItem("nexora-profile", JSON.stringify(updatedProfile));
      if (user.phone) {
        const cleaned = user.phone.replace(/\D/g, "");
        localStorage.setItem(`nexora-profile-${cleaned}`, JSON.stringify(updatedProfile));
      }

      try {
        await supabase.from("profiles").upsert({
          id: user.id,
          full_name: trimmed,
          phone: user.phone,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("Supabase profile upsert warning:", e);
      }

      return { success: true };
    } catch {
      return { success: false, message: "Failed to update profile name." };
    }
  };

  // Save Delivery Address
  const saveDeliveryAddress = async (address: DeliveryAddressData) => {
    setDeliveryAddress(address);
    localStorage.setItem("nexora-address", JSON.stringify(address));

    if (user) {
      try {
        await supabase
          .from("profiles")
          .update({
            address: address as unknown as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      } catch (e) {
        console.warn("Supabase address update warning:", e);
      }
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setProfile(null);
    localStorage.removeItem("nexora-user");
    localStorage.removeItem("nexora-profile");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isLoggedIn: !!user && !!profile?.full_name,
        deliveryAddress,
        savedAddresses,
        selectedAddressId,
        setSelectedAddressId: handleSelectAddressId,
        addSavedAddress,
        sendOtp,
        verifyOtp,
        updateProfileName,
        saveDeliveryAddress,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
