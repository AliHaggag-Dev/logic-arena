import React, { memo, useState, useEffect, useRef } from "react";
import { useConsole } from "../../hooks/useConsole";
import { CommandConsoleProps } from "./types";
import { MobileHubSheet } from "./MobileHubSheet";
import { MobileScriptSheet } from "./MobileScriptSheet";
import { DesktopConsole } from "./DesktopConsole";

const CommandConsoleComponent: React.FC<CommandConsoleProps> = ({
    socket, robotId, availableRobots, onRobotChange, isMobile, mobileSheet,
    onDeployDone, onInsertAndSwitch, consumeSnippet, snippetVersion,
    isZenMode: isZenModeProp, setIsZenMode: setIsZenModeProp,
}) => {
    const consoleState = useConsole(socket, robotId);
    const [isZenModeLocal, setIsZenModeLocal] = useState(false);
    const isZenMode = isZenModeProp ?? isZenModeLocal;
    const setIsZenMode = setIsZenModeProp ?? setIsZenModeLocal;
    const [isLogsOpen, setIsLogsOpen] = useState(false);
    const [hubTab, setHubTab] = useState<'controls' | 'bots' | 'handbook' | 'generate'>('controls');

    const lastSnippetVersion = useRef(snippetVersion ?? 0);
    useEffect(() => {
        if (mobileSheet === 'script' && consumeSnippet && snippetVersion !== undefined && snippetVersion > lastSnippetVersion.current) {
            lastSnippetVersion.current = snippetVersion;
            const snippet = consumeSnippet();
            if (snippet) consoleState.appendScriptLine(snippet);
        }
    }, [mobileSheet, snippetVersion, consumeSnippet, consoleState.appendScriptLine]);

    if (isMobile && mobileSheet === 'controls') {
        return <MobileHubSheet isMobile={isMobile} hubTab={hubTab} setHubTab={setHubTab} commandInput={consoleState.commandInput} setCommandInput={consoleState.setCommandInput} handleCommandSubmit={consoleState.handleCommandSubmit} output={consoleState.output} isLogsOpen={isLogsOpen} setIsLogsOpen={setIsLogsOpen} availableRobots={availableRobots} robotId={robotId} onRobotChange={onRobotChange} onInsertAndSwitch={onInsertAndSwitch} />;
    }

    if (isMobile && mobileSheet === 'script') {
        return <MobileScriptSheet scriptInput={consoleState.scriptInput} setScriptInput={consoleState.setScriptInput} handleDeployBrain={consoleState.handleDeployBrain} onDeployDone={onDeployDone} />;
    }

    return <DesktopConsole isMobile={isMobile} isZenMode={isZenMode} setIsZenMode={setIsZenMode} commandInput={consoleState.commandInput} setCommandInput={consoleState.setCommandInput} handleCommandSubmit={consoleState.handleCommandSubmit} output={consoleState.output} isLogsOpen={isLogsOpen} setIsLogsOpen={setIsLogsOpen} availableRobots={availableRobots} robotId={robotId} onRobotChange={onRobotChange} scriptInput={consoleState.scriptInput} setScriptInput={consoleState.setScriptInput} handleDeployBrain={consoleState.handleDeployBrain} isLibraryOpen={consoleState.isLibraryOpen} setIsLibraryOpen={consoleState.setIsLibraryOpen} setActivePrebuilt={consoleState.setActivePrebuilt} appendScriptLine={consoleState.appendScriptLine} />;
};

export const CommandConsole = memo(CommandConsoleComponent);
export default CommandConsole;
