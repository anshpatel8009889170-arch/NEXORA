"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin,
  Navigation,
  Search,
  X,
  Check,
  Home,
  Briefcase,
  Building,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface AddressMapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (address: {
    type: "Home" | "Work" | "Other";
    street: string;
    landmark?: string;
    city: string;
    pincode?: string;
    latitude: number;
    longitude: number;
  }) => void;
  initialCoords?: { lat: number; lng: number };
}

// Default Restaurant Center: Sathigva, Amauli-Fatehpur Road
const DEFAULT_LAT = 25.9284;
const DEFAULT_LNG = 80.4636;

export default function AddressMapPicker({
  isOpen,
  onClose,
  onSelectAddress,
  initialCoords,
}: AddressMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: initialCoords?.lat || DEFAULT_LAT,
    lng: initialCoords?.lng || DEFAULT_LNG,
  });

  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string>("Sathigva, Amauli-Fatehpur Road");
  const [detectedCity, setDetectedCity] = useState<string>("Amauli - Fatehpur");
  const [detectedPincode, setDetectedPincode] = useState<string>("212631");

  // Form Fields for Doorstep Accuracy
  const [houseNumber, setHouseNumber] = useState("");
  const [landmark, setLandmark] = useState("");
  const [addressType, setAddressType] = useState<"Home" | "Work" | "Other">("Home");
  const [formError, setFormError] = useState<string | null>(null);

  // Search Bar State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Reverse geocoding helper (Nominatim OpenStreetMap)
  const fetchAddressDetails = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            "Accept-Language": "en-IN,en;q=0.9",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const a = data.address;
          const road = a.road || a.pedestrian || a.suburb || a.neighbourhood || a.village || "";
          const city = a.city || a.town || a.county || a.district || "Amauli - Fatehpur";
          const state = a.state || "Uttar Pradesh";
          const post = a.postcode || "212631";

          const parts = [road, city, state].filter(Boolean);
          setDetectedAddress(parts.join(", ") || data.display_name.split(",").slice(0, 3).join(","));
          setDetectedCity(`${city} - ${state}`);
          setDetectedPincode(post);
        } else if (data.display_name) {
          setDetectedAddress(data.display_name.split(",").slice(0, 3).join(","));
        }
      }
    } catch (err) {
      console.warn("Reverse geocode network fallback:", err);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!isOpen || typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    // Dynamically load Leaflet
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean existing map instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [currentCoords.lat, currentCoords.lng],
        zoom: 16,
        zoomControl: false,
      });

      // OpenStreetMap Tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Add Zoom Control on Top-Left
      L.control.zoom({ position: "topleft" }).addTo(map);

      mapInstanceRef.current = map;

      // Listen to map pan/drag movement (Center pin drop experience)
      map.on("moveend", () => {
        const center = map.getCenter();
        const nextCoords = { lat: center.lat, lng: center.lng };
        setCurrentCoords(nextCoords);
        fetchAddressDetails(nextCoords.lat, nextCoords.lng);
      });

      // Initial address fetch
      fetchAddressDetails(currentCoords.lat, currentCoords.lng);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Handle "Use Current Location" GPS trigger
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setCurrentCoords({ lat: newLat, lng: newLng });

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([newLat, newLng], 17, {
            duration: 1.5,
          });
        }
        fetchAddressDetails(newLat, newLng);
        setIsLocating(false);
      },
      (err) => {
        console.warn("GPS error:", err);
        setIsLocating(false);
        alert("Unable to retrieve your current location. Please pan map to choose your spot.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Handle Search Location by name
  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&countrycodes=in&limit=4`
      );
      if (res.ok) {
        const results = await res.json();
        setSearchResults(results);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    const newLat = parseFloat(result.lat);
    const newLng = parseFloat(result.lon);
    setCurrentCoords({ lat: newLat, lng: newLng });

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([newLat, newLng], 17);
    }
    fetchAddressDetails(newLat, newLng);
    setSearchResults([]);
    setSearchQuery("");
  };

  // Submit and Confirm Address
  const handleSaveAndConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!houseNumber.trim()) {
      setFormError("Please enter your House / Flat / Building details.");
      return;
    }

    const fullStreetAddress = `${houseNumber.trim()}, ${detectedAddress}`;

    onSelectAddress({
      type: addressType,
      street: fullStreetAddress,
      landmark: landmark.trim() || undefined,
      city: detectedCity,
      pincode: detectedPincode,
      latitude: currentCoords.lat,
      longitude: currentCoords.lng,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-[var(--card-bg)] border border-[#d4af37]/40 shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--card-border)] bg-[var(--section-alt)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#d4af37] flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-sm sm:text-base text-[var(--text-main)]">
                Choose Delivery Location
              </h2>
              <p className="text-[10px] text-[var(--text-sub)]">
                Move the pin to your exact doorstep on map
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-sub)] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Overlay on Top of Map */}
        <div className="p-3 bg-[var(--section-alt)] border-b border-[var(--card-border)] shrink-0 relative z-20">
          <form onSubmit={handleSearchLocation} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#d4af37] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search area, landmark or colony (e.g. Amauli, Sathigva)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gold-gradient text-black hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
            </button>
          </form>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-[var(--card-bg)] border border-[#d4af37]/40 rounded-2xl shadow-2xl p-2 space-y-1 z-30 max-h-48 overflow-y-auto">
              {searchResults.map((res, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-white/5 transition-colors flex items-start gap-2 text-[var(--text-main)] cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{res.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map Container Area with Center Pin */}
        <div className="relative w-full h-56 sm:h-72 bg-[#181818] overflow-hidden shrink-0">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Luxury Center Gold Pin Indicator (Swiggy Style Center Pin) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[400] pointer-events-none flex flex-col items-center">
            <div className="px-3 py-1 rounded-full bg-black/90 border border-[#d4af37] text-[10px] font-bold text-[#d4af37] uppercase tracking-wider shadow-2xl mb-1 whitespace-nowrap animate-bounce flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Deliver Here</span>
            </div>
            <div className="relative">
              <MapPin className="w-10 h-10 text-[#d4af37] drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] fill-current" />
            </div>
            <div className="w-3 h-1.5 bg-black/60 rounded-full blur-[1px] -mt-1" />
          </div>

          {/* Floating "📍 Use Current Location" Button */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="absolute bottom-3 right-3 z-[400] px-3.5 py-2 rounded-full bg-[var(--card-bg)]/90 backdrop-blur-md border border-[#d4af37]/60 text-xs font-semibold text-[#d4af37] shadow-xl hover:bg-[#d4af37] hover:text-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5 fill-current" />
                <span>Locate Me</span>
              </>
            )}
          </button>
        </div>

        {/* Scrollable Form Section Below Map */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Detected Area Card */}
          <div className="p-3.5 rounded-2xl bg-[var(--section-alt)] border border-[var(--card-border)] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#d4af37] flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>Selected Pin Location</span>
              </span>
              {isGeocoding && (
                <span className="text-[10px] text-[var(--text-sub)] flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Detecting...
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-[var(--text-main)] line-clamp-2">
              {detectedAddress}
            </p>
            <p className="text-[10px] text-[var(--text-sub-light)]">
              {detectedCity} • {detectedPincode}
            </p>
          </div>

          {/* Doorstep Accuracy Form */}
          <form onSubmit={handleSaveAndConfirm} className="space-y-3.5">
            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Field: House / Flat / Building Name */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1">
                <span>House / Flat / Floor / Building Name</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                placeholder="e.g. Flat 302, Green Villa, House #14"
                className="w-full text-xs p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
                autoFocus
              />
            </div>

            {/* Field: Landmark */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                Landmark (Optional)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near Shiv Mandir / Behind Government Hospital"
                className="w-full text-xs p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-main)] placeholder-[var(--text-sub-light)] focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            {/* Address Tag Selector: Home, Work, Other */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                Save Address As
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "Home", icon: Home, label: "Home" },
                  { id: "Work", icon: Briefcase, label: "Work" },
                  { id: "Other", icon: Building, label: "Other" },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = addressType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAddressType(item.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-gold-gradient text-black shadow-md font-bold"
                          : "bg-[var(--section-alt)] border border-[var(--card-border)] text-[var(--text-sub)] hover:text-white"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-full text-xs font-bold uppercase tracking-widest bg-gold-gradient text-black hover:opacity-90 active:scale-95 shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save &amp; Deliver To This Spot</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
