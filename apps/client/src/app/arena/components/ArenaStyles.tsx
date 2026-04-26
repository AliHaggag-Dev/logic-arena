"use client";

import React from 'react';

export function ArenaStyles() {
  return (
    <style jsx global>{`
      @keyframes neural-pulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 10px rgba(34,211,238,0.1), inset 0 0 2px rgba(34,211,238,0.05); }
        50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(34,211,238,0.4), inset 0 0 8px rgba(34,211,238,0.2); border-color: rgba(34,211,238,0.7); }
      }
      .animate-neural-pulse { animation: neural-pulse 3s ease-in-out infinite; }
      .animate-neural-pulse-delayed { animation: neural-pulse 3s ease-in-out 1s infinite; }
      .animate-neural-pulse-more-delayed { animation: neural-pulse 3s ease-in-out 2s infinite; }
      @keyframes scanline {
        0% { transform: translateY(-100vh); }
        100% { transform: translateY(100vh); }
      }
      @keyframes rotate-phone {
        0%, 100% { transform: rotate(0deg); }
        40%, 60% { transform: rotate(-90deg); }
      }
      @keyframes sweep {
        0% { left: -100%; }
        100% { left: 200%; }
      }
      @keyframes float-up {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        100% { transform: translateY(-40px) scale(1.2); opacity: 0; }
      }
      .animate-float-up { animation: float-up 1s ease-out forwards; }
    `}</style>
  );
}
