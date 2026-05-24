import React from 'react';
import { BlockEditor } from './BlockEditor/BlockEditor';

interface MobileScriptSheetProps {
    scriptInput: string;
    setScriptInput: (val: string) => void;
    handleDeployBrain: (script: string) => void;
    onDeployDone?: () => void;
}

export const MobileScriptSheet: React.FC<MobileScriptSheetProps> = ({
    scriptInput, setScriptInput, handleDeployBrain, onDeployDone
}) => {
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
