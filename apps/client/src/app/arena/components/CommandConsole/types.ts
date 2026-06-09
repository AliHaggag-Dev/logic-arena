import { Dispatch, SetStateAction } from "react";
import { Socket } from "socket.io-client";

export interface CommandConsoleProps {
    socket: Socket | null;
    robotId: string;
    availableRobots: string[];
    onRobotChange: (id: string) => void;
    isMobile: boolean;
    isZenMode?: boolean;
    setIsZenMode?: Dispatch<SetStateAction<boolean>>;
    mobileSheet?: 'controls' | 'script';
    onDeployDone?: () => void;
    onInsertAndSwitch?: (snippet: string) => void;
    consumeSnippet?: () => string | null;
    snippetVersion?: number;
    isClassicMode?: boolean;
    classicTokensLeft?: number;
    classicMaxTokens?: number;
    onClassicEdit?: (script: string, tokensLeft: number) => void;
    initialScript?: string;
    displayMode?: string;
    matchPhase?: string;
    matchPhaseState?: any;
    currentUserId?: string | null;
}
