"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageCardProps {
  src: string;
  name: string;
  description: string;
  className?: string;
}

export function ImageCard({
  src,
  name,
  description,
  className = "h-48",
}: ImageCardProps): React.JSX.Element {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl glass-card-strong flex flex-col items-center justify-center ${className} p-5`}
      >
        <span className="text-accent font-black text-xs sm:text-sm tracking-widest text-center uppercase mb-2">
          {name}
        </span>
        <span className="text-text-secondary text-[10px] sm:text-xs text-center leading-relaxed">
          {description}
        </span>
      </div>
    );
  }

  return (
    <div 
      className="relative overflow-hidden rounded-xl border border-accent/20 group hover:border-accent/50 focus:border-accent/50 active:border-accent/50 transition-all duration-300 outline-none"
      tabIndex={0}
    >
      <div className="overflow-hidden">
        <Image
          src={src}
          alt={name}
          width={400}
          height={300}
          className={`object-cover w-full ${className} transition-transform duration-500 ease-out group-hover:scale-[1.08] group-focus:scale-[1.08] group-active:scale-[1.08]`}
          style={{ width: "auto", height: "auto" }}
          loading="lazy"
          onError={() => setErrored(true)}
        />
      </div>

      {/* Glass overlay gradient */}
      <div className="absolute inset-x-0 bottom-0 h-3/4 pointer-events-none landing-image-card-gradient" />

      {/* Info panel */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
        <h3 className="text-accent font-black text-sm sm:text-base tracking-widest uppercase mb-1">
          {name}
        </h3>
        <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Hover glow border effect */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-active:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: "inset 0 0 30px rgba(var(--accent-rgb), 0.1), 0 0 20px rgba(var(--accent-rgb), 0.05)",
        }}
        aria-hidden="true"
      />
    </div>
  );
}
