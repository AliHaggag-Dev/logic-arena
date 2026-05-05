"use client";
import React from "react";

interface Props { levelId: string; difficulty: string; }

const DC: Record<string, string> = {
  EASY: "#34d399", MEDIUM: "#eab308", HARD: "#f97316", EXTREME: "#ef4444",
};

/* ── Conditionals: branching decision tree with data flowing down ──────── */
function CondVis({ order, c }: { order: number; c: string }) {
  const depth = Math.min(order + 1, 6);
  const nodes: React.ReactElement[] = [];
  const lines: React.ReactElement[] = [];
  let idx = 0;

  function addNode(x: number, y: number, lvl: number, key: string) {
    if (lvl > depth) return;
    const r = 4.5 - lvl * 0.4;
    nodes.push(
      <circle key={`n${key}`} cx={x} cy={y} r={Math.max(r, 2)}
        fill={lvl === 1 ? c : `${c}50`} stroke={c} strokeWidth="0.5"
        style={{ animation: `nodePop 0.4s ${lvl * 0.12}s both` }} />
    );
    if (lvl < depth) {
      const spread = 48 / Math.pow(2, lvl);
      const ny = y + 16;
      const lx = x - spread, rx = x + spread;
      // Lines with flowing particle
      lines.push(
        <g key={`l${key}l`}>
          <line x1={x} y1={y} x2={lx} y2={ny} stroke={`${c}30`} strokeWidth="0.8" />
          <circle r="1.5" fill={c}>
            <animateMotion dur={`${1 + idx * 0.1}s`} repeatCount="indefinite"
              path={`M${x},${y} L${lx},${ny}`} />
          </circle>
        </g>
      );
      lines.push(
        <g key={`l${key}r`}>
          <line x1={x} y1={y} x2={rx} y2={ny} stroke={`${c}30`} strokeWidth="0.8" />
          <circle r="1.5" fill={c} opacity="0.6">
            <animateMotion dur={`${1.3 + idx * 0.1}s`} repeatCount="indefinite"
              path={`M${x},${y} L${rx},${ny}`} />
          </circle>
        </g>
      );
      idx++;
      addNode(lx, ny, lvl + 1, `${key}l`);
      addNode(rx, ny, lvl + 1, `${key}r`);
    }
  }
  addNode(75, 8, 1, "r");

  return (
    <svg viewBox="0 0 150 90" className="w-full h-full">
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {lines}{nodes}
      <text x="75" y="88" textAnchor="middle" fill={`${c}60`} fontSize="4.5" fontFamily="monospace">
        IF/ELSE DEPTH: {depth}
      </text>
    </svg>
  );
}

/* ── Loops: orbiting particles with trails ─────────────────────────────── */
function LoopVis({ order, c }: { order: number; c: string }) {
  const rings = Math.min(order + 1, 5);
  const dots = order + 2;
  return (
    <svg viewBox="0 0 150 90" className="w-full h-full">
      {/* Center hub */}
      <circle cx="75" cy="42" r="4" fill={c} opacity="0.8">
        <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="75" cy="42" r="8" fill="none" stroke={c} strokeWidth="0.3" opacity="0.3">
        <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* Orbital rings */}
      {Array.from({ length: rings }, (_, i) => {
        const rx = 16 + i * 9, ry = 9 + i * 5;
        return (
          <g key={`r${i}`}>
            <ellipse cx="75" cy="42" rx={rx} ry={ry}
              fill="none" stroke={`${c}20`} strokeWidth="0.6" />
            {/* Orbiting dot */}
            <circle r="2.5" fill={c} opacity={0.9 - i * 0.1} filter="url(#glow)">
              <animateMotion
                dur={`${2 + i * 0.8}s`} repeatCount="indefinite"
                path={`M${75 - rx},42 A${rx},${ry} 0 1,${i % 2} ${75 + rx},42 A${rx},${ry} 0 1,${i % 2} ${75 - rx},42`}
              />
            </circle>
            {/* Trail dot */}
            <circle r="1.5" fill={c} opacity="0.3">
              <animateMotion
                dur={`${2 + i * 0.8}s`} repeatCount="indefinite" begin={`-${0.3 + i * 0.1}s`}
                path={`M${75 - rx},42 A${rx},${ry} 0 1,${i % 2} ${75 + rx},42 A${rx},${ry} 0 1,${i % 2} ${75 - rx},42`}
              />
            </circle>
          </g>
        );
      })}
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <text x="75" y="86" textAnchor="middle" fill={`${c}60`} fontSize="4.5" fontFamily="monospace">
        ITERATIONS: {dots}
      </text>
    </svg>
  );
}

/* ── Arrays: grid with scanning beam sweeping across ───────────────────── */
function ArrVis({ order, c }: { order: number; c: string }) {
  const cols = Math.min(order + 3, 10);
  const cellW = Math.min(14, 120 / cols);
  const totalW = cols * cellW;
  const startX = 75 - totalW / 2;
  return (
    <svg viewBox="0 0 150 90" className="w-full h-full">
      <defs>
        {/* Scanning beam gradient */}
        <linearGradient id="scanBeam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={c} stopOpacity="0" />
          <stop offset="40%" stopColor={c} stopOpacity="0.5" />
          <stop offset="60%" stopColor={c} stopOpacity="0.5" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Cells */}
      {Array.from({ length: cols }, (_, i) => {
        const x = startX + i * cellW;
        const active = i < order;
        return (
          <g key={i}>
            <rect x={x + 1} y="25" width={cellW - 2} height={cellW - 2}
              rx="2" fill={active ? `${c}20` : `${c}06`}
              stroke={active ? `${c}70` : `${c}18`} strokeWidth="0.8">
              {active && (
                <animate attributeName="fill-opacity" values="0.3;0.8;0.3"
                  dur={`${1.2 + i * 0.15}s`} repeatCount="indefinite" begin={`${i * 0.1}s`} />
              )}
            </rect>
            <text x={x + cellW / 2} y={25 + cellW / 2 + 2}
              textAnchor="middle" fill={active ? c : `${c}25`}
              fontSize="6" fontFamily="monospace" fontWeight="bold">{i}</text>
          </g>
        );
      })}
      {/* Scanning beam that sweeps across */}
      <rect x={startX} y="24" width={cellW * 1.5} height={cellW} rx="1"
        fill="url(#scanBeam)" opacity="0.6">
        <animateTransform attributeName="transform" type="translate"
          values={`0,0;${totalW - cellW * 1.5},0;0,0`}
          dur={`${2 + order * 0.2}s`} repeatCount="indefinite" />
      </rect>
      {/* Pointer arrow */}
      <polygon points={`${startX + cellW / 2 - 3},${25 + cellW + 4} ${startX + cellW / 2 + 3},${25 + cellW + 4} ${startX + cellW / 2},${25 + cellW + 1}`}
        fill={c} opacity="0.7">
        <animateTransform attributeName="transform" type="translate"
          values={`0,0;${totalW - cellW},0;0,0`}
          dur={`${2 + order * 0.2}s`} repeatCount="indefinite" />
      </polygon>
      <text x="75" y="86" textAnchor="middle" fill={`${c}60`} fontSize="4.5" fontFamily="monospace">
        ARRAY[{cols}]
      </text>
    </svg>
  );
}

/* ── Data Structures: animated state machine with value changes ────────── */
function DsVis({ order, c }: { order: number; c: string }) {
  const pairs = Math.min(order + 1, 6);
  const labels = ["mode", "ammo", "shield", "threat", "pos", "kills"];
  const vals = ["1", "8", "3", "0", "2", "5"];
  const boxH = 11;
  const totalH = pairs * (boxH + 2);
  const startY = 44 - totalH / 2;
  return (
    <svg viewBox="0 0 150 90" className="w-full h-full">
      {/* Container box */}
      <rect x="30" y={startY - 6} width="90" height={totalH + 14}
        rx="4" fill={`${c}04`} stroke={`${c}20`} strokeWidth="0.8">
        <animate attributeName="stroke-opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
      </rect>
      <text x="75" y={startY - 0.5} textAnchor="middle" fill={`${c}40`} fontSize="5" fontFamily="monospace">
        {"{ state }"}
      </text>
      {Array.from({ length: pairs }, (_, i) => {
        const y = startY + 7 + i * (boxH + 2);
        return (
          <g key={i}>
            {/* Key box */}
            <rect x="38" y={y} width="30" height={boxH} rx="2"
              fill={`${c}12`} stroke={`${c}25`} strokeWidth="0.5">
              <animate attributeName="fill-opacity" values="0.12;0.25;0.12"
                dur="2.5s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
            </rect>
            <text x="53" y={y + 7.5} textAnchor="middle" fill={`${c}70`}
              fontSize="5" fontFamily="monospace">{labels[i]}</text>
            <text x="72" y={y + 7.5} textAnchor="middle" fill={`${c}30`}
              fontSize="5" fontFamily="monospace">:</text>
            {/* Value box — animated value change */}
            <rect x="78" y={y} width="16" height={boxH} rx="2"
              fill={`${c}08`} stroke={`${c}20`} strokeWidth="0.5" />
            <text x="86" y={y + 7.8} textAnchor="middle" fill={c}
              fontSize="6" fontFamily="monospace" fontWeight="bold">
              {vals[i]}
              <animate attributeName="opacity" values="1;0.3;1" dur={`${1.5 + i * 0.2}s`} repeatCount="indefinite" />
            </text>
            {/* Data flow arrow */}
            <line x1="96" y1={y + boxH / 2} x2="104" y2={y + boxH / 2}
              stroke={`${c}30`} strokeWidth="0.5" strokeDasharray="2 1">
              <animate attributeName="stroke-dashoffset" values="0;-6" dur="1s" repeatCount="indefinite" />
            </line>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Recursion: expanding/contracting nested shapes ────────────────────── */
function RecVis({ order, c }: { order: number; c: string }) {
  const depth = Math.min(order + 1, 7);
  const rects: React.ReactElement[] = [];
  function nest(cx: number, cy: number, size: number, lvl: number) {
    if (lvl > depth || size < 4) return;
    const opacity = 0.15 + (lvl / depth) * 0.6;
    const dur = 3 - lvl * 0.2;
    rects.push(
      <rect key={`${cx}-${cy}-${lvl}`}
        x={cx - size / 2} y={cy - size / 2} width={size} height={size}
        rx="2" fill="none" stroke={c} strokeWidth="0.7" opacity={opacity}>
        <animateTransform attributeName="transform" type="rotate"
          values={`0,${cx},${cy};${lvl % 2 === 0 ? 5 : -5},${cx},${cy};0,${cx},${cy}`}
          dur={`${dur}s`} repeatCount="indefinite" />
        <animate attributeName="opacity" values={`${opacity};${opacity + 0.2};${opacity}`}
          dur={`${dur}s`} repeatCount="indefinite" />
      </rect>
    );
    nest(cx, cy, size * 0.58, lvl + 1);
  }
  nest(75, 42, 62, 1);
  return (
    <svg viewBox="0 0 150 90" className="w-full h-full">
      {rects}
      {/* Center pulsing core */}
      <circle cx="75" cy="42" r="3" fill={c} opacity="0.8">
        <animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <text x="75" y="86" textAnchor="middle" fill={`${c}60`} fontSize="4.5" fontFamily="monospace">
        DEPTH: {depth}
      </text>
    </svg>
  );
}

/* ── Graph Theory: node network with traversal animation ───────────────── */
function GfxVis({ order, c }: { order: number; c: string }) {
  const nodeCount = Math.min(order + 3, 10);
  const positions = Array.from({ length: nodeCount }, (_, i) => {
    const angle = (i / nodeCount) * Math.PI * 2 - Math.PI / 2;
    const r = 26 + (i % 3) * 5;
    return { x: 75 + Math.cos(angle) * r, y: 44 + Math.sin(angle) * r };
  });
  // Build edges
  const edges: React.ReactElement[] = [];
  for (let i = 0; i < nodeCount; i++) {
    const j = (i + 1) % nodeCount;
    const pi = positions[i], pj = positions[j];
    edges.push(
      <g key={`e${i}`}>
        <line x1={pi.x} y1={pi.y} x2={pj.x} y2={pj.y}
          stroke={`${c}20`} strokeWidth="0.8" />
        {/* Traversal particle moving along edge */}
        <circle r="1.8" fill={c} opacity="0.8">
          <animateMotion dur={`${1.5 + i * 0.15}s`} repeatCount="indefinite"
            begin={`${i * 0.3}s`}
            path={`M${pi.x},${pi.y} L${pj.x},${pj.y}`} />
        </circle>
      </g>
    );
    // Cross edges for complexity
    if (i + 2 < nodeCount && i % 2 === 0) {
      const pk = positions[i + 2];
      edges.push(
        <line key={`x${i}`} x1={pi.x} y1={pi.y} x2={pk.x} y2={pk.y}
          stroke={`${c}10`} strokeWidth="0.5" strokeDasharray="2 2">
          <animate attributeName="stroke-dashoffset" values="0;-8" dur="2s" repeatCount="indefinite" />
        </line>
      );
    }
  }
  return (
    <svg viewBox="0 0 150 90" className="w-full h-full">
      {edges}
      {positions.map((p, i) => (
        <g key={`n${i}`}>
          {/* Pulse ring */}
          <circle cx={p.x} cy={p.y} r={i === 0 ? 6 : 5} fill="none" stroke={c} strokeWidth="0.4" opacity="0.3">
            <animate attributeName="r" values={`${i === 0 ? 5 : 4};${i === 0 ? 8 : 7};${i === 0 ? 5 : 4}`}
              dur={`${2 + i * 0.1}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0;0.3" dur={`${2 + i * 0.1}s`} repeatCount="indefinite" />
          </circle>
          {/* Node */}
          <circle cx={p.x} cy={p.y} r={i === 0 ? 4 : 3} fill={i === 0 ? c : `${c}50`}
            stroke={c} strokeWidth="0.4" />
          <text x={p.x} y={p.y + 1.5} textAnchor="middle"
            fill={i === 0 ? "#000" : `${c}90`}
            fontSize="4" fontFamily="monospace" fontWeight="bold">{i}</text>
        </g>
      ))}
      <text x="75" y="86" textAnchor="middle" fill={`${c}60`} fontSize="4.5" fontFamily="monospace">
        NODES: {nodeCount}
      </text>
    </svg>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────── */
const VIS_MAP: Record<string, React.ComponentType<{ order: number; c: string }>> = {
  cond: CondVis, loop: LoopVis, arr: ArrVis,
  ds: DsVis, rec: RecVis, gfx: GfxVis,
};

export function LevelVisual({ levelId, difficulty }: Props) {
  const [prefix, num] = levelId.split("-");
  const order = parseInt(num, 10) || 1;
  const c = DC[difficulty] ?? DC.EASY;
  const Comp = VIS_MAP[prefix];

  if (!Comp) return null;

  return (
    <div className="w-full h-[110px] rounded-xl border border-accent/10 overflow-hidden relative"
      style={{ background: `${c}06` }}>
      <Comp order={order} c={c} />
      <style>{`
        @keyframes nodePop {
          from { r: 0; opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
