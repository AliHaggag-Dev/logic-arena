"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AuthModal } from "../../../components/AuthModal";
import { apiClient } from "../../../lib/api-client";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { useAuthState } from "../../../hooks/useAuthState";
import { useSafeTimeout } from "../../../hooks/useSafeTimeout";
import { RobotShowroom } from "../black-market/components/RobotShowroom";
import { MARKET_ITEMS, CATEGORY_LABELS, RARITY_STYLES } from "../black-market/constants";
import { MarketItem } from "../black-market/types";
import { Hexagon, PackageOpen, Target, Loader2, PaintBucket, CheckCircle, AlertTriangle, Zap } from "lucide-react";
import { MOBILE_BREAKPOINT, TOAST_DURATION_MS } from "./constants/robots.constants";

const CATEGORY_KEYS = ["chassis", "paint", "tracer"] as const;

// ── Toast ─────────────────────────────────────────────────────────────────────
interface ToastProps {
  message: string;
  type: "success" | "error";
}

function Toast({ message, type }: ToastProps) {
  return (
    <div
      className={`
        fixed bottom-8 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-2.5 px-5 py-3 rounded-xl
        border backdrop-blur-md font-mono text-[10px] tracking-[0.18em] font-bold
        shadow-[0_8px_32px_rgba(0,0,0,0.5)]
        animate-[toastIn_0.3s_ease]
        ${type === "success"
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          : "bg-red-500/10 border-red-500/30 text-red-400"
        }
      `}
    >
      {type === "success" ? (
        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      )}
      {message}
    </div>
  );
}



export default function GaragePage() {
  const { isGuest } = useAuthState();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);

  const [activeCategory, setActiveCategory] = useState<"chassis" | "paint" | "tracer">("chassis");

  // Vault Data
  const [unlockedItemIds, setUnlockedItemIds] = useState<Set<string>>(new Set());
  const [equippedChassis, setEquippedChassis] = useState<string>("chassis-unit-01");
  const [equippedPaint, setEquippedPaint] = useState<string>("paint-default");
  const [equippedTracer, setEquippedTracer] = useState<string>("tracer-pulse");

  const [isLoading, setIsLoading] = useState(true);
  const [equippingId, setEquippingId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const { clearAllSafeTimeouts, setSafeTimeout } = useSafeTimeout();

  const showToast = useCallback((message: string, type: "success" | "error") => {
    clearAllSafeTimeouts();
    setToast({ message, type });
    setSafeTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, [clearAllSafeTimeouts, setSafeTimeout]);

  // Fetch Loadout
  useEffect(() => {
    if (isGuest) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    apiClient.get("/users/black-market")
      .then((res) => {
        if (cancelled) return;
        const data = res.data;
        setUnlockedItemIds(new Set(data.unlockedItems || []));
        if (data.equippedChassis) setEquippedChassis(data.equippedChassis);
        if (data.equippedPaint) setEquippedPaint(data.equippedPaint);
        if (data.equippedTracer) setEquippedTracer(data.equippedTracer);
      })
      .catch(() => {
        /* 401s are handled globally by apiClient interceptor */
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isGuest]);

  // Derived state
  const vaultItems = useMemo(() => {
    return MARKET_ITEMS.filter((item) => unlockedItemIds.has(item.id) || item.price === 0);
  }, [unlockedItemIds]);

  const displayedItems = useMemo(() => {
    return vaultItems.filter((item) => item.category === activeCategory);
  }, [vaultItems, activeCategory]);

  const activePaintColor = useMemo(() => {
    const p = MARKET_ITEMS.find((i) => i.id === equippedPaint);
    return p?.color || "#ef4444";
  }, [equippedPaint]);

  const activeTracerColor = useMemo(() => {
    const t = MARKET_ITEMS.find((i) => i.id === equippedTracer);
    return t?.color || "#22d3ee";
  }, [equippedTracer]);

  const getEquippedIdForCategory = (category: string) => {
    switch (category) {
      case "chassis": return equippedChassis;
      case "paint": return equippedPaint;
      case "tracer": return equippedTracer;
      default: return "";
    }
  };

  const handleEquip = async (item: MarketItem) => {
    if (isGuest) return setShowAuthModal(true);

    try {
      setEquippingId(item.id);
      await apiClient.post("/users/black-market/equip", { itemId: item.id, category: item.category });

      if (item.category === "chassis") setEquippedChassis(item.id);
      if (item.category === "paint") setEquippedPaint(item.id);
      if (item.category === "tracer") setEquippedTracer(item.id);

      showToast(`EQUIPPED: ${item.name}`, "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "FAILED TO EQUIP ITEM", "error");
    } finally {
      setEquippingId(null);
    }
  };

  return (
    <>
      <style>{`
        @keyframes toastIn {
          0% { opacity: 0; transform: translate(-50%, 20px) scale(0.95); }
          100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
      `}</style>
      <div className={`min-h-[100dvh] bg-bg-primary font-mono text-accent/90 relative ${isMobile ? "pb-[env(safe-area-inset-bottom)]" : ""}`}>
        {/* Background Gradients */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] mix-blend-screen" style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.1)' }} />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[150px] mix-blend-screen" style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.05)' }} />
        </div>

        <div className={`max-w-[1400px] mx-auto h-[100dvh] flex flex-col ${isMobile ? "px-4 pt-6" : "p-6"}`}>
          {/* Header */}
          <div className="relative z-10 flex flex-col gap-2 mb-6">
            <div className="flex items-center gap-3">
              <PackageOpen className="w-8 h-8 text-accent" />
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-widest text-accent drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.8)]">
                  THE VAULT
                </h1>
                <p className="text-[10px] tracking-[0.2em] text-accent/60 uppercase font-bold">
                  Personal Hangar & Loadout Configuration
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row gap-6 relative z-10 min-h-0">
            {/* Left: 3D Showroom */}
            <div className="w-full lg:w-[45%] rounded-2xl bg-[rgba(var(--accent-rgb),0.02)] backdrop-blur-md border border-accent/20 shadow-[0_0_40px_rgba(var(--accent-rgb),0.05)] overflow-hidden flex flex-col relative min-h-[40vh] lg:min-h-0">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
              <div className="flex-1 w-full cursor-grab active:cursor-grabbing">
                <RobotShowroom
                  chassisId={equippedChassis}
                  paintColor={activePaintColor}
                  tracerColor={activeTracerColor}
                />
              </div>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-bg-primary/80 backdrop-blur px-6 py-2 rounded-full border border-accent/30">
                  <p className="text-[10px] tracking-widest text-accent font-bold uppercase animate-pulse">
                    [ ACTIVE LOADOUT ]
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Vault Inventory */}
            <div className="w-full lg:w-[55%] flex flex-col gap-4 min-h-0">
              {/* Category Tabs */}
              <div className="flex gap-2 p-1.5 bg-[rgba(var(--accent-rgb),0.02)] backdrop-blur-md rounded-xl border border-accent/20 overflow-x-auto no-scrollbar">
                {CATEGORY_KEYS.map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-xs sm:text-[11px] tracking-widest transition-all whitespace-nowrap ${activeCategory === cat
                        ? "bg-accent/20 text-accent border border-accent/50 shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]"
                        : "text-accent/50 border border-transparent hover:text-accent hover:bg-accent/5"
                      }`}
                  >
                    {cat === "chassis" && <Hexagon className="w-4 h-4" />}
                    {cat === "paint" && <PaintBucket className="w-4 h-4" />}
                    {cat === "tracer" && <Target className="w-4 h-4" />}
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>

              {/* Items Grid */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  </div>
                ) : displayedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 border border-dashed border-accent/20 rounded-xl bg-[rgba(var(--accent-rgb),0.02)]">
                    <p className="text-sm tracking-widest text-accent/50">NO ITEMS UNLOCKED</p>
                    <p className="text-[10px] tracking-wider text-accent/40 mt-2">Visit the Black Market to acquire {CATEGORY_LABELS[activeCategory].toLowerCase()}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12">
                    {displayedItems.map((item) => {
                      const isEquipped = getEquippedIdForCategory(item.category) === item.id;
                      const isEquipping = equippingId === item.id;
                      const styles = RARITY_STYLES[item.rarity];

                      return (
                        <div
                          key={item.id}
                          className={`relative flex flex-col p-4 rounded-xl backdrop-blur-sm transition-all duration-300 border ${styles.border} ${styles.glow} ${isEquipped
                              ? "bg-accent/10 ring-1 ring-accent shadow-[0_0_24px_rgba(var(--accent-rgb),0.15)]"
                              : "bg-[rgba(var(--accent-rgb),0.02)]"
                            }`}
                        >
                          {isEquipped && (
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" />
                          )}
                          {/* Top scanline accent */}
                          <div
                            className="absolute inset-0 pointer-events-none z-0 opacity-40"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(0deg,transparent,transparent 4px,rgba(var(--accent-rgb),0.012) 4px,rgba(var(--accent-rgb),0.012) 5px)",
                            }}
                          />

                          <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-7 h-7 rounded-md border border-white/10 flex-shrink-0"
                                  style={{
                                    background: item.color,
                                    boxShadow: `0 0 10px ${item.glowColor}60`,
                                  }}
                                />
                                <span
                                  className={`text-[8px] font-bold tracking-[0.22em] px-1.5 py-0.5 rounded border ${styles.badge}`}
                                >
                                  {item.rarity}
                                </span>
                              </div>
                              {isEquipped && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                            </div>

                            <h3 className="text-[11px] font-black tracking-[0.18em] text-accent/90 mb-1 leading-tight">
                              {item.name}
                            </h3>

                            <p className="text-[9px] text-accent/35 tracking-[0.08em] leading-relaxed mb-4 flex-1">
                              {item.description}
                            </p>

                            <div className="flex justify-end">
                              <button
                                onClick={() => !isEquipped && handleEquip(item)}
                                disabled={isEquipped || isEquipping}
                                className={`
                                  flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[9px] font-black tracking-[0.18em]
                                  transition-all duration-200 border font-mono w-full sm:w-auto
                                  ${isEquipped
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default"
                                    : "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20 hover:border-accent/60 hover:shadow-[0_0_12px_rgba(var(--accent-rgb),0.2)] cursor-pointer"
                                  }
                                `}
                              >
                                {isEquipping ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : isEquipped ? (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    EQUIPPED
                                  </>
                                ) : (
                                  <>
                                    <Zap className="w-3 h-3" />
                                    EQUIP
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="VAULT LOCKED"
        message="Your personal hangar is restricted to registered operators. Initialize an account to unlock, manage, and equip your customizations."
      />

      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}
