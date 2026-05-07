export function ShowroomSkeleton() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 opacity-40">
      <div className="w-24 h-24 border-2 border-accent/30 rounded-xl animate-pulse bg-accent/5" />
      <p className="text-[9px] tracking-[0.3em] text-accent/40 uppercase animate-pulse">
        LOADING SHOWROOM…
      </p>
    </div>
  );
}
