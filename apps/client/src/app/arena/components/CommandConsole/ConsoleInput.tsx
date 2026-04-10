import React, { useRef, useEffect } from "react";
import { Command, CommandResult } from "../../types";
import { useCommandHistory } from "../../hooks/useCommandHistory";

interface ConsoleInputProps {
  onCommand: (command: string) => Promise<CommandResult>;
  socket: any; // Temporarily any, will be typed properly later
  robotId: string;
}

/**
 * Renders the command input field and handles user input, history navigation, and command submission.
 */
export const ConsoleInput = ({ onCommand, socket, robotId }: ConsoleInputProps) => {
  const { currentCommand, setCurrentCommand, addCommand, navigateHistory } = useCommandHistory();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [robotId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentCommand(e.target.value);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const commandText = currentCommand.trim();
      if (commandText) {
        addCommand(commandText);
        const result = await onCommand(commandText);
        // Handle result display in ConsoleOutput
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      navigateHistory("up");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      navigateHistory("down");
    }
  };

  return (
    <div className="flex items-center border-t border-blue-500/50 py-2 px-4">
      <span className="text-blue-400 mr-2">{`cmd@${robotId}>`}</span>
      <input
        aria-label="Command Input"
        title="Command Input"
        ref={inputRef}
        type="text"
        className="flex-grow bg-transparent text-green-400 outline-none font-mono text-sm caret-green-400"
        value={currentCommand}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        spellCheck="false"
        autoComplete="off"
      />
    </div>
  );
};
