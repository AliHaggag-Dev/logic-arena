import React, { useState } from "react";
import { SectionLabel } from "./SectionLabel";

interface InteractivePlaygroundProps {
  script: string;
  setScript: (s: string) => void;
  parsed: string[];
  onParse: () => void;
}

export function InteractivePlayground({ script, setScript, parsed, onParse }: InteractivePlaygroundProps) {
  const [parseBtnHovered, setParseBtnHovered] = useState(false);

  return (
    <section className="mb-[60px]">
      <SectionLabel text="INTERACTIVE_PLAYGROUND" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
        {/* Left: editor */}
        <div>
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[10px] tracking-[0.22em] text-accent/30 uppercase">
              // script_editor
            </span>
            <span className="text-[10px] tracking-[0.15em] text-accent/20">
              {script.split("\n").filter(Boolean).length} LINES
            </span>
          </div>
          <textarea
            className="docs-textarea docs-scrollbar bg-card/50 border border-accent/20 text-accent outline-none"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            spellCheck={false}
            id="aliscript-editor"
          />
          <button
            id="parse-script-btn"
            onMouseEnter={() => setParseBtnHovered(true)}
            onMouseLeave={() => setParseBtnHovered(false)}
            onClick={onParse}
            className={`mt-3 w-full py-3 px-6 rounded-lg text-[10px] font-black tracking-[0.28em] font-mono transition-all duration-200 ${parseBtnHovered
              ? "bg-accent/20 text-accent border-accent/70 drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.6)] shadow-[0_0_20px_rgba(var(--accent-rgb),0.15),inset_0_0_20px_rgba(var(--accent-rgb),0.05)] animate-[pulse-glow_1.5s_infinite]"
              : "bg-accent/10 border border-accent/30 text-accent/70"
              }`}
          >
            ▶ PARSE SCRIPT
          </button>
        </div>

        {/* Right: output */}
        <div>
          <div className="mb-2.5">
            <span className="text-[10px] tracking-[0.22em] text-accent/30 uppercase">
              // parsed_commands
            </span>
          </div>
          <div className="docs-scrollbar min-h-[200px] max-h-[360px] overflow-y-auto bg-card/70 border border-accent/15 rounded-lg p-4 flex flex-col gap-2">
            {parsed.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-accent/20 text-[10px] tracking-[0.2em] text-center p-12">
                AWAITING PARSE COMMAND...
              </div>
            ) : (
              parsed.map((cmd, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 animate-[fadeIn_0.2s_ease_both]"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  <span className="text-[9px] text-accent/20 min-w-[24px] text-right font-bold">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="inline-block px-3.5 py-1.5 rounded-md bg-accent/10 border border-accent/30 text-accent text-[11px] font-bold tracking-[0.08em] font-mono drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.4)] shadow-[0_0_12px_rgba(var(--accent-rgb),0.08),inset_0_0_12px_rgba(var(--accent-rgb),0.04)]">
                    {cmd}
                  </span>
                </div>
              ))
            )}
          </div>

          {parsed.length > 0 && (
            <div className="mt-2.5 text-[10px] text-accent/25 tracking-[0.15em] text-right">
              {parsed.length} COMMAND{parsed.length !== 1 ? "S" : ""} PARSED
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
