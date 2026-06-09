import React from 'react';
import { BlockEditor } from './BlockEditor/BlockEditor';
import { WordLevelEditor } from '../WordLevelEditor';
import { EditorCombatOverlay } from '../Tactical/EditorCombatOverlay';
import { BreakControls } from '../Tactical/BreakControls';

interface MobileScriptSheetProps {
    scriptInput: string;
    setScriptInput: (val: string) => void;
    handleDeployBrain: (script: string) => void;
    onDeployDone?: () => void;
    isClassicMode?: boolean;
    classicTokensLeft?: number;
    classicMaxTokens?: number;
    onClassicEdit?: (script: string, tokensLeft: number) => void;
    displayMode?: string;
    matchPhase?: string;
    socket?: any;
    matchPhaseState?: any;
    currentUserId?: string | null;
}

export const MobileScriptSheet: React.FC<MobileScriptSheetProps> = ({
    scriptInput, setScriptInput, handleDeployBrain, onDeployDone,
    isClassicMode = false, classicTokensLeft = 0, classicMaxTokens, onClassicEdit,
    displayMode, matchPhase, socket, matchPhaseState, currentUserId
}) => {
    const isReady = matchPhaseState && currentUserId ? matchPhaseState.readyUserIds?.includes(currentUserId) : false;

    const handleToggleReady = () => {
        if (!isReady && socket) {
            socket.emit('match:submit-ready', { script: scriptInput });
        }
    };

    if (isClassicMode && onClassicEdit) {
        return (
            <div className="mobile-zen-sheet flex min-h-0 w-full flex-1 flex-col overflow-hidden">
                <WordLevelEditor
                    script={scriptInput}
                    tokensLeft={classicTokensLeft}
                    maxTokens={classicMaxTokens}
                    onChange={(nextScript, nextTokensLeft) => {
                        setScriptInput(nextScript);
                        onClassicEdit(nextScript, nextTokensLeft);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="mobile-zen-sheet flex min-h-0 w-full flex-1 flex-col overflow-hidden relative">
            {displayMode === 'TACTICAL' && (
                <EditorCombatOverlay isActive={matchPhase === 'ROUND_ACTIVE'} />
            )}
            <BlockEditor
                scriptInput={scriptInput}
                setScriptInput={setScriptInput}
                handleDeployBrain={handleDeployBrain}
                onDeployDone={onDeployDone}
            />
            {displayMode === 'TACTICAL' && (
                <div className="shrink-0 p-2 border-t border-cyan-900/50 bg-black/80">
                    <BreakControls 
                        isActive={matchPhase === 'BREAK'}
                        isReady={isReady}
                        opponentReady={false} // Backend wiring placeholder
                        onToggleReady={handleToggleReady}
                    />
                </div>
            )}
        </div>
    );
};
