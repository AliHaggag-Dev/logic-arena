import React from "react";
import { SectionLabel } from "./SectionLabel";

interface InteractivePlaygroundProps {
  script: string;
  setScript: (s: string) => void;
  parsed: string[];
  onParse: () => void;
  isMobile: boolean;
}

export function InteractivePlayground({ script, setScript, parsed, onParse, isMobile }: InteractivePlaygroundProps) {
  return (
    <section className={isMobile ? "mb-10" : "mb-[60px]"}>
      <SectionLabel text="LIVE EDITOR" isMobile={isMobile} />
      <div className={`grid grid-cols-1 ${isMobile ? "gap-6" : "md:grid-cols-2 gap-5"} mt-5`}>
        {/* Left: editor */}
        <div>
          <div className="flex justify-between items-center mb-2.5 px-1">
            <span className="text-[10px] tracking-[0.22em] text-accent/30 uppercase font-bold">
              SCRIPT EDITOR
            </span>
            <span className="text-[9px] tracking-[0.15em] text-accent/20 font-bold uppercase">
              {script.split("\n").filter(Boolean).length} LINES
            </span>
          </div>
          <textarea
            className={`docs-textarea docs-scrollbar bg-card/50 border border-accent/20 text-accent outline-none rounded-xl ${isMobile ? "min-h-[180px] p-4 text-[11px]" : "min-h-[200px]"}`}
            value={script}
            onChange={(e) => setScript(e.target.value)}
            spellCheck={false}
            id="aliscript-editor"
            aria-label="AliScript editor"
          />
          <button
            type="button"
            id="parse-script-btn"
            onClick={onParse}
            className={`mt-3 w-full ${isMobile ? "py-4 text-[11px]" : "py-3 px-6 text-[10px]"} rounded-xl font-black tracking-[0.28em] font-mono bg-accent/10 border border-accent/20 text-accent/70 hover:bg-accent/20 hover:text-accent hover:border-accent/50 hover:drop-shadow-[0_0_12px_rgba(var(--accent-rgb),0.4)] transition-all duration-200 active:scale-[0.98]`}
          >
            ▶ RUN PARSER
          </button>
        </div>

        {/* Right: output */}
        <div>
          <div className="mb-2.5 px-1">
            <span className="text-[10px] tracking-[0.22em] text-accent/30 uppercase font-bold">
              COMMAND LIST
            </span>
          </div>
          <div className={`docs-scrollbar overflow-y-auto bg-card/70 border border-accent/10 rounded-xl p-4 flex flex-col gap-2 ${isMobile ? "min-h-[140px] max-h-[250px]" : "min-h-[200px] max-h-[360px]"}`}>
            {parsed.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-accent/20 text-[10px] tracking-[0.2em] text-center p-8 uppercase font-bold">
                Waiting for script…
              </div>
            ) : (
              parsed.map((cmd, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 animate-[fadeIn_0.2s_ease_both]"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  <span className="text-[9px] text-accent/20 min-w-[20px] text-right font-bold font-mono">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="inline-block px-3 py-1.5 rounded-lg bg-accent/5 border border-accent/20 text-accent text-[11px] font-bold tracking-[0.05em] font-mono shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                    {cmd}
                  </span>
                </div>
              ))
            )}
          </div>

          {parsed.length > 0 && (
            <div className="mt-2.5 text-[9px] text-accent/20 tracking-[0.15em] text-right font-bold uppercase">
              {parsed.length} LINE{parsed.length !== 1 ? "S" : ""} PARSED
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
