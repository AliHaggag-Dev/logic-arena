export interface Command {
  name: string;
  args: string[];
}

export interface CommandResult {
  success: boolean;
  message: string;
}

export interface ConsoleEntry {
  type: "command" | "result" | "info" | "error";
  text: string;
}
