export function BlackMarketStyles() {
  return (
    <style>{`
      @keyframes toastIn {
        from { opacity: 0; transform: translateX(-50%) translateY(12px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes marketFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes headerGlow {
        0%, 100% { text-shadow: 0 0 20px rgba(var(--accent-rgb),0.7), 0 0 60px rgba(var(--accent-rgb),0.3); }
        50%       { text-shadow: 0 0 30px rgba(var(--accent-rgb),1),   0 0 90px rgba(var(--accent-rgb),0.5); }
      }
      @keyframes pedestalPulse {
        0%, 100% { box-shadow: 0 0 20px rgba(var(--accent-rgb),0.2); }
        50%       { box-shadow: 0 0 40px rgba(var(--accent-rgb),0.4); }
      }
    `}</style>
  );
}
