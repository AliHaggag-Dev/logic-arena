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
}: ImageCardProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={`relative overflow-hidden rounded border border-accent/40 bg-accent/10 flex flex-col items-center justify-center ${className} p-4`}
      >
        <span className="text-accent font-black text-xs sm:text-sm tracking-widest text-center uppercase">
          {name}
        </span>
        <span className="text-text-secondary text-[10px] sm:text-xs mt-2 text-center leading-relaxed">
          {description}
        </span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded border border-accent/40 group hover:border-accent/80 hover:scale-[1.02] transition-all duration-300 cursor-default">
      <Image
        src={src}
        alt={name}
        width={400}
        height={300}
        className={`object-cover w-full ${className}`}
        loading="lazy"
        onError={() => setErrored(true)}
      />
      <div className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none landing-image-card-gradient" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-accent font-black text-sm tracking-widest uppercase">
          {name}
        </h3>
        <p className="text-xs mt-1 text-white/85">
          {description}
        </p>
      </div>
    </div>
  );
}
