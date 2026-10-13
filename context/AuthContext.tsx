"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Profile } from "@/types/database";

export interface DeliveryAddressData {
  street: string;
  landmark?: string;
  city: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
}

export interface SavedAddress {
  id: string;
  type: "Home" | "Work" | "Other";
  street: string;
  landmark?: string;
  city: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
}

const initialSavedAddresses: SavedAddress[] = [
  {
    id: "addr_home",
    type: "Home",
    street: "Near Ankit Internet Cafe And Janseva Kendra",
    landmark: "Sathigva Road",
    city: "Amauli - Fatehpur",
    pincode: "212631",
    latitude: 25.9284,
    longitude: 80.4636,
  },
  {
    id: "addr_work",
    type: "Work",
    street: "Main Market Commercial Plaza",
    landmark: "Amauli Road",
    city: "Amauli - Fatehpur",
    pincode: "212631",
    latitude: 25.9312,
    longitude: 80.4655,
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
  updateSavedAddress: (id: string, address: Partial<Omit<SavedAddress, "id">>) => void;
  deleteSavedAddress: (id: string) => void;
  sendOtp: (
    phone: string,
    options?: { mode?: "login" | "signup"; name?: string; email?: string }
  ) => Promise<{
    success: boolean;
    message?: string;
    mockOtp?: string;
    isRegistered?: boolean;
    registeredName?: string | null;
    code?: string;
  }>;
  verifyOtp: (
    phone: string,
    token: string,
    details?: { name?: string; email?: string }
  ) => Promise<{ success: boolean; message?: string; isNewUser?: boolean; userName?: string }>;
  updateProfileName: (fullName: string, email?: string) => Promise<{ success: boolean; message?: string }>;
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
            const p = JSON.parse(cachedProfile);
            if (p?.full_name && p.full_name !== "Guest" && p.full_name !== "Royal Guest") {
              setProfile(p);
            } else {
              setProfile(null);
              localStorage.removeItem("nexora-profile");
            }
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

        // 2. Synchronize with Server-Side Session Verification & Supabase Auth
        let serverAuthenticated = false;
        try {
          const sessionRes = await fetch("/api/auth/session");
          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            if (sessionData.authenticated && sessionData.user) {
              const u: AuthUser = {
                id: sessionData.user.id,
                phone: sessionData.user.phone,
              };
              setUser(u);
              localStorage.setItem("nexora-user", JSON.stringify(u));

              const hasAuthName = Boolean(
                sessionData.user.name &&
                sessionData.user.name.trim().length > 0 &&
                sessionData.user.name !== "Guest" &&
                sessionData.user.name !== "Royal Guest"
              );

              const serverProfile: Profile = {
                id: sessionData.user.id,
                full_name: hasAuthName ? sessionData.user.name : "",
                phone: sessionData.user.phone,
                role: "customer",
                created_at: new Date().toISOString(),
              };
              setProfile(serverProfile);
              if (hasAuthName) {
                localStorage.setItem("nexora-profile", JSON.stringify(serverProfile));
              } else {
                localStorage.removeItem("nexora-profile");
              }
              serverAuthenticated = true;
            }
          }
        } catch {}

        // 3. Fallback check with Supabase Auth session if server cookie wasn't set yet
        if (!serverAuthenticated) {
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
          } else if (cachedUser) {
            // Neither server session nor Supabase session exists — purge unverified local storage
            localStorage.removeItem("nexora-user");
            localStorage.removeItem("nexora-profile");
            setUser(null);
            setProfile(null);
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

  // Update saved address
  const updateSavedAddress = (id: string, updatedFields: Partial<Omit<SavedAddress, "id">>): void => {
    const updated = savedAddresses.map((addr) =>
      addr.id === id ? { ...addr, ...updatedFields } : addr
    );
    setSavedAddresses(updated);
    localStorage.setItem("nexora-saved-addresses", JSON.stringify(updated));
  };

  // Delete saved address
  const deleteSavedAddress = (id: string): void => {
    const updated = savedAddresses.filter((addr) => addr.id !== id);
    setSavedAddresses(updated);
    localStorage.setItem("nexora-saved-addresses", JSON.stringify(updated));
    if (selectedAddressId === id) {
      const nextId = updated.length > 0 ? updated[0].id : "";
      setSelectedAddressId(nextId);
      localStorage.setItem("nexora-selected-address-id", nextId);
    }
  };

  // Send OTP to phone via Server API & Supabase Auth
  const sendOtp = async (
    phoneNumber: string,
    options?: { mode?: "login" | "signup"; name?: string; email?: string }
  ): Promise<{
    success: boolean;
    message?: string;
    mockOtp?: string;
    isRegistered?: boolean;
    registeredName?: string | null;
    code?: string;
  }> => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.length < 10) {
      return { success: false, message: "Please enter a valid 10-digit mobile number." };
    }

    const formattedPhone = cleaned.length === 10 ? `+91${cleaned}` : `+${cleaned}`;

    try {
      // Call Server-Side OTP Endpoint
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formattedPhone,
          mode: options?.mode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message || `OTP sent to ${formattedPhone}`,
          mockOtp: data.isSandbox ? "123456" : undefined,
          isRegistered: data.isRegistered,
          registeredName: data.registeredName,
        };
      }

      return {
        success: false,
        message: data.error || "Failed to dispatch verification code.",
        code: data.code,
        isRegistered: data.isRegistered,
        registeredName: data.registeredName,
      };
    } catch {
      return {
        success: false,
        message: "Network error occurred. Please try again.",
      };
    }
  };

  // Verify OTP via Server API & Supabase Auth
  const verifyOtp = async (
    phoneNumber: string,
    token: string,
    details?: { name?: string; email?: string }
  ): Promise<{ success: boolean; message?: string; isNewUser?: boolean; userName?: string }> => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    const formattedPhone = cleaned.length === 10 ? `+91${cleaned}` : `+${cleaned}`;
    const cleanToken = token.trim();

    try {
      // 1. Call Server-Side OTP Verification Endpoint
      const verifyRes = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formattedPhone,
          token: cleanToken,
          name: details?.name,
          email: details?.email,
        }),
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.success) {
        const authUser: AuthUser = {
          id: verifyData.user.id,
          phone: verifyData.user.phone,
        };
        setUser(authUser);
        localStorage.setItem("nexora-user", JSON.stringify(authUser));

        const hasRealName = Boolean(
          verifyData.user?.name &&
          verifyData.user.name.trim().length > 0 &&
          verifyData.user.name !== "Guest" &&
          verifyData.user.name !== "Royal Guest"
        );

        const userProfile: Profile = {
          id: verifyData.user.id,
          full_name: hasRealName ? verifyData.user.name.trim() : "",
          phone: verifyData.user.phone,
          role: "customer",
          created_at: new Date().toISOString(),
        };
        setProfile(userProfile);
        if (hasRealName) {
          localStorage.setItem("nexora-profile", JSON.stringify(userProfile));
        } else {
          localStorage.removeItem("nexora-profile");
        }

        return {
          success: true,
          isNewUser: verifyData.isNewUser ?? !hasRealName,
          userName: userProfile.full_name,
        };
      }

      // If server returned an explicit error (e.g. invalid OTP)
      if (!verifyRes.ok && verifyData.error) {
        return { success: false, message: verifyData.error };
      }

      // 2. Direct Supabase Auth SDK fallback
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: cleanToken,
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

        const hasRealName = Boolean(
          existingProfile?.full_name &&
          existingProfile.full_name.trim().length > 0 &&
          existingProfile.full_name !== "Guest" &&
          existingProfile.full_name !== "Royal Guest"
        );
        const pName = hasRealName ? existingProfile.full_name.trim() : "";
        const fallbackProfile: Profile = {
          id: data.user.id,
          full_name: pName,
          phone: formattedPhone,
          role: "customer",
          created_at: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
        if (hasRealName) {
          localStorage.setItem("nexora-profile", JSON.stringify(fallbackProfile));
        } else {
          localStorage.removeItem("nexora-profile");
        }

        // Sync with server session
        try {
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: data.user.id, phone: formattedPhone, name: pName }),
          });
        } catch {}

        return { success: true, isNewUser: !hasRealName };
      }

      return {
        success: false,
        message: error?.message || "Invalid OTP entered. Please try again.",
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Verification failed.";
      return { success: false, message: errorMessage };
    }
  };

  // Update customer name and optional email in profile
  const updateProfileName = async (
    fullName: string,
    email?: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (!user) {
      return { success: false, message: "No active user session found." };
    }

    const trimmed = fullName.trim();
    if (!trimmed) {
      return { success: false, message: "Please enter your name." };
    }

    const cleanEmail = email ? email.trim() : (profile?.email || null);

    try {
      const updatedProfile: Profile = {
        ...(profile || {
          id: user.id,
          role: "customer",
          created_at: new Date().toISOString(),
        }),
        full_name: trimmed,
        phone: user.phone || profile?.phone,
        email: cleanEmail,
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
          email: cleanEmail,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("Supabase profile upsert warning:", e);
      }

      // Persist profile to authoritative server store & session cookie
      try {
        const profileRes = await fetch("/api/customer/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: user.id,
            phone: user.phone || profile?.phone,
            name: trimmed,
            email: cleanEmail,
          }),
        });
        const profileData = await profileRes.json();
        if (profileData.success && profileData.customer) {
          const freshProfile: Profile = {
            id: profileData.customer.id,
            full_name: profileData.customer.full_name,
            phone: profileData.customer.phone,
            email: profileData.customer.email,
            role: "customer",
            created_at: profileData.customer.created_at,
          };
          setProfile(freshProfile);
          localStorage.setItem("nexora-profile", JSON.stringify(freshProfile));
        }
      } catch (err) {
        console.warn("Notice: could not save profile via /api/customer/profile:", err);
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
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch {}
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
        updateSavedAddress,
        deleteSavedAddress,
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
