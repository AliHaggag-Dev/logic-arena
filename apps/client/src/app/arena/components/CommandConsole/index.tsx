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
    isClassicMode = false, classicTokensLeft = 0, classicMaxTokens,
    onClassicEdit, initialScript, displayMode, matchPhase, matchPhaseState, currentUserId
}) => {
    const consoleState = useConsole(socket, robotId, currentUserId);
    const [isZenModeLocal, setIsZenModeLocal] = useState(false);
    const isZenMode = isZenModeProp ?? isZenModeLocal;
    const setIsZenMode = setIsZenModeProp ?? setIsZenModeLocal;
    const [isLogsOpen, setIsLogsOpen] = useState(false);
    const [hubTab, setHubTab] = useState<'logs' | 'handbook' | 'generate'>('logs');

    const lastSnippetVersion = useRef(snippetVersion ?? 0);
    const initialScriptSet = useRef(false);
    useEffect(() => {
        if (initialScript && consoleState.scriptInput.length === 0 && !initialScriptSet.current) {
            consoleState.setScriptInput(initialScript);
            initialScriptSet.current = true;
        }
    }, [initialScript, consoleState.scriptInput, consoleState.setScriptInput]);

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
        return <MobileScriptSheet socket={socket} scriptInput={consoleState.scriptInput} setScriptInput={consoleState.setScriptInput} editorBlocks={consoleState.editorBlocks} setEditorBlocks={consoleState.setEditorBlocks} handleDeployBrain={consoleState.handleDeployBrain} onDeployDone={onDeployDone} isClassicMode={isClassicMode} classicTokensLeft={classicTokensLeft} classicMaxTokens={classicMaxTokens} onClassicEdit={onClassicEdit} displayMode={displayMode} matchPhase={matchPhase} matchPhaseState={matchPhaseState} currentUserId={currentUserId} />;
    }

    const handleSubmitReady = () => {
        if (socket) {
            socket.emit('match:submit-ready', { script: consoleState.scriptInput });
        }
    };

    return <DesktopConsole isMobile={isMobile} isZenMode={isZenMode} setIsZenMode={setIsZenMode} commandInput={consoleState.commandInput} setCommandInput={consoleState.setCommandInput} handleCommandSubmit={consoleState.handleCommandSubmit} output={consoleState.output} isLogsOpen={isLogsOpen} setIsLogsOpen={setIsLogsOpen} availableRobots={availableRobots} robotId={robotId} onRobotChange={onRobotChange} scriptInput={consoleState.scriptInput} setScriptInput={consoleState.setScriptInput} handleDeployBrain={consoleState.handleDeployBrain} isLibraryOpen={consoleState.isLibraryOpen} setIsLibraryOpen={consoleState.setIsLibraryOpen} setActivePrebuilt={consoleState.setActivePrebuilt} appendScriptLine={consoleState.appendScriptLine} isClassicMode={isClassicMode} classicTokensLeft={classicTokensLeft} classicMaxTokens={classicMaxTokens} onClassicEdit={onClassicEdit} displayMode={displayMode} matchPhase={matchPhase} handleSubmitReady={handleSubmitReady} matchPhaseState={matchPhaseState} currentUserId={currentUserId} />;
};

export const CommandConsole = memo(CommandConsoleComponent);
export default CommandConsole;
