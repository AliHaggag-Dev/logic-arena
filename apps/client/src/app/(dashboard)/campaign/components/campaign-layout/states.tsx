import { Lock } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-accent/10" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent animate-spin" />
      </div>
      <p className="text-[10px] tracking-[0.4em] text-accent/50 uppercase font-black animate-pulse">
        Loading Campaign Data...
      </p>
    </div>
  );
}

export function GuestState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-6 text-center">
      <div className="w-20 h-20 bg-accent/5 border border-accent/15 rounded-2xl flex items-center justify-center">
        <Lock className="w-10 h-10 text-accent/30" />
      </div>
      <div>
        <h2 className="text-[18px] font-black tracking-[0.2em] text-accent uppercase mb-2">
          Access Restricted
        </h2>
        <p className="text-[11px] text-accent/40 tracking-wider max-w-sm uppercase leading-relaxed">
          Log in to access the coding challenges.
        </p>
      </div>
    </div>
  );
}
