import { Socket } from "socket.io-client";

export interface CommandConsoleProps {
    socket: Socket | null;
    robotId: string;
    scriptId?: string | null;
    availableRobots: string[];
    onRobotChange: (id: string) => void;
    isMobile: boolean;
    mobileSheet?: 'controls' | 'script';
    onDeployDone?: () => void;
    onInsertAndSwitch?: (snippet: string) => void;
    consumeSnippet?: () => string | null;
    snippetVersion?: number;
}
