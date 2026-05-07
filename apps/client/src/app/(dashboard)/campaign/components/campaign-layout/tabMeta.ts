import type React from "react";
import { ArrowUpDown, Database, GitBranch, Layers, List, Network, RefreshCw, Repeat } from "lucide-react";

export type IconComp = React.ComponentType<{ className?: string }>;

export const TAB_ICONS: Record<string, IconComp> = {
  "conditionals":        GitBranch,
  "loops":               RefreshCw,
  "arrays":              List,
  "data-structures":     Database,
  "recursion":           Repeat,
  "graph-theory":        Network,
  "sorting":             ArrowUpDown,
  "dynamic-programming": Layers,
};

export const TAB_SHORT: Record<string, string> = {
  "conditionals":        "IF",
  "loops":               "LOOP",
  "arrays":              "ARR",
  "data-structures":     "DS",
  "recursion":           "REC",
  "graph-theory":        "GFX",
  "sorting":             "SORT",
  "dynamic-programming": "DP",
};
