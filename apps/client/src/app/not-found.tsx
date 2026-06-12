import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg-primary font-mono p-6 selection:bg-accent/30 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(var(--accent-rgb),0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--accent-rgb),0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 w-full max-w-[500px] text-center flex flex-col items-center">
        <h1 className="text-accent text-[80px] font-black tracking-[0.2em] animate-pulse drop-shadow-[0_0_20px_rgba(var(--accent-rgb),0.6)]">404</h1>
        <h2 className="text-text-primary text-xl tracking-[0.3em] uppercase mb-8">System Sector Not Found</h2>
        <div className="bg-accent/10 border border-accent/40 p-4 rounded text-accent text-xs tracking-widest mb-10 shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]">
          [ERR] INVALID DIRECTORY ACCESSED
        </div>
        <Link href="/dashboard" className="px-6 py-3 border border-accent/40 text-accent hover:bg-accent/10 tracking-[0.2em] transition-all uppercase rounded text-sm hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
