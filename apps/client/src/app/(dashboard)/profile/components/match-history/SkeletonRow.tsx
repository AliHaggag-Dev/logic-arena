"use client";

import React from "react";
import { Shimmer } from "../ui/Shimmer";

export function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, j) => (
        <td key={j} className="p-[12px_16px]">
          <Shimmer className="h-5" />
        </td>
      ))}
    </tr>
  );
}
