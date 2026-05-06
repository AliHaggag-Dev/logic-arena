"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

const SCROLL_THRESHOLD = 400;

/** Height of the mobile bottom nav bar in px (must match layout padding-bottom). */
const MOBILE_NAV_HEIGHT = 80;

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        .scroll-to-top-btn {
          position: fixed;
          /* Mobile: left side, sit above the 80px bottom nav */
          bottom: calc(${MOBILE_NAV_HEIGHT}px + 1rem + env(safe-area-inset-bottom));
          left: 1rem;
          right: auto;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 50%;
          background: rgba(var(--accent-rgb, 99 102 241) / 0.12);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(var(--accent-rgb, 99 102 241) / 0.35);
          box-shadow: 0 4px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.07);
          cursor: pointer;
          color: var(--accent);
        }
        /* Desktop: right side, standard 2rem from bottom */
        @media (min-width: 768px) {
          .scroll-to-top-btn {
            bottom: 2rem;
            right: 2rem;
            left: auto;
          }
        }
      `}</style>

      <AnimatePresence>
        {visible && (
          <motion.button
            type="button"
            aria-label="Scroll to top"
            onClick={scrollToTop}
            className="scroll-to-top-btn"
            initial={{ opacity: 0, y: 20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.85 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            whileHover={{ y: -3, scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowUp size={18} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
