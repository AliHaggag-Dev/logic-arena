import React from 'react';
import { BlockEditor } from './BlockEditor/BlockEditor';
import { WordLevelEditor } from '../WordLevelEditor';

interface MobileScriptSheetProps {
    scriptInput: string;
    setScriptInput: (val: string) => void;
    handleDeployBrain: (script: string) => void;
    onDeployDone?: () => void;
    isClassicMode?: boolean;
    classicTokensLeft?: number;
    classicMaxTokens?: number;
    onClassicEdit?: (script: string, tokensLeft: number) => void;
}

export const MobileScriptSheet: React.FC<MobileScriptSheetProps> = ({
    scriptInput, setScriptInput, handleDeployBrain, onDeployDone,
    isClassicMode = false, classicTokensLeft = 0, classicMaxTokens, onClassicEdit
}) => {
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
        <div className="mobile-zen-sheet flex min-h-0 w-full flex-1 flex-col overflow-hidden">
            <BlockEditor
                scriptInput={scriptInput}
                setScriptInput={setScriptInput}
                handleDeployBrain={handleDeployBrain}
                onDeployDone={onDeployDone}
            />
        </div>
    );
};
