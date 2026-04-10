import { useState, useRef, useEffect } from "react";

/**
 * Manages command history and navigation for the command console.
 */
export const useCommandHistory = (initialHistory: string[] = []) => {
  const [history, setHistory] = useState<string[]>(initialHistory);
  const [historyIndex, setHistoryIndex] = useState<number>(initialHistory.length);
  const [currentCommand, setCurrentCommand] = useState<string>("");

  const tempCommandRef = useRef<string>("");

  useEffect(() => {
    setHistoryIndex(history.length);
  }, [history]);

  const addCommand = (command: string) => {
    setHistory(prev => [...prev, command]);
    setCurrentCommand("");
    setHistoryIndex(history.length + 1); // Reset index to end of history + 1 for new input
  };

  const navigateHistory = (direction: "up" | "down") => {
    if (direction === "up") {
      if (historyIndex > 0) {
        if (historyIndex === history.length) {
          tempCommandRef.current = currentCommand; // Save current incomplete command
        }
        setHistoryIndex(prev => prev - 1);
        setCurrentCommand(history[historyIndex - 1]);
      } else if (history.length > 0) {
        // If at the very beginning, cycle to the last command
        if (historyIndex === 0) {
          tempCommandRef.current = currentCommand;
        }
        setHistoryIndex(history.length - 1);
        setCurrentCommand(history[history.length - 1]);
      }
    } else { // direction === "down"
      if (historyIndex < history.length - 1) {
        setHistoryIndex(prev => prev + 1);
        setCurrentCommand(history[historyIndex + 1]);
      } else if (historyIndex === history.length - 1) {
        // If navigating down from the last history item, restore incomplete command
        setHistoryIndex(history.length);
        setCurrentCommand(tempCommandRef.current);
        tempCommandRef.current = "";
      }
    }
  };

  return { history, currentCommand, setCurrentCommand, addCommand, navigateHistory };
};
