export function CampaignLayoutStyles() {
  return (
    <style>{`
      .hide-scrollbar::-webkit-scrollbar { display: none; }
      .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      @keyframes shimmer {
        0%   { transform: translateX(-100%) skewX(-12deg); }
        100% { transform: translateX(300%)  skewX(-12deg); }
      }
      @keyframes scanLine {
        0%   { top: -2px; }
        100% { top: 100%; }
      }
    `}</style>
  );
}
