"use client";

import { useEffect, useRef, useState } from "react";

export function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState<string>(ids[0] ?? "");
  const visibleSections = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (ids.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibleSections.current[entry.target.id] = entry.isIntersecting;
        });

        // Find the first section in the original order that is currently visible
        const firstVisible = ids.find((id) => visibleSections.current[id]);
        if (firstVisible) {
          setActive(firstVisible);
        }
      },
      // -120px top margin perfectly offsets the 80px global header + some breathing room.
      // -40% bottom margin ensures we don't prematurely highlight the next section.
      { rootMargin: "-120px 0px -40% 0px", threshold: 0 }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [ids]);

  return active;
}
