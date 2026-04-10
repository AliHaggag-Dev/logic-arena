import React, { useRef, useEffect } from "react";
import { ConsoleEntry } from "../../types";

interface ConsoleOutputProps {
  logs: ConsoleEntry[];
}

/**
 * Displays the command console output, including commands, results, and errors.
 */
export const ConsoleOutput = ({ logs }: ConsoleOutputProps) => {
  const endOfLogsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfLogsRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="flex-grow overflow-y-auto p-4 font-mono text-sm space-y-1 custom-scrollbar">
      {logs.map((entry, index) => (
        <div
          key={index}
          className={{
            command: "text-blue-300",
            result: "text-green-300",
            info: "text-gray-400",
            error: "text-red-400",
          }[entry.type]}
        >
          {entry.text}
        </div>
      ))}
      <div ref={endOfLogsRef} />
    </div>
  );
};
