import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] font-mono p-6 selection:bg-[#ef4444]/30 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(239,68,68,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="relative z-10 w-full max-w-[500px] text-center flex flex-col items-center">
        <h1 className="text-[#ef4444] text-[80px] font-black tracking-[0.2em] animate-pulse drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]">404</h1>
        <h2 className="text-[#e2e8f0] text-xl tracking-[0.3em] uppercase mb-8">System Sector Not Found</h2>
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/40 p-4 rounded text-[#ef4444] text-xs tracking-widest mb-10 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          [ERR] INVALID DIRECTORY ACCESSED
        </div>
        <Link href="/" className="px-6 py-3 border border-[#22d3ee]/40 text-[#22d3ee] hover:bg-[#22d3ee]/10 tracking-[0.2em] transition-all uppercase rounded text-sm hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]">
          Return to Hangar
        </Link>
      </div>
    </div>
  );
}
