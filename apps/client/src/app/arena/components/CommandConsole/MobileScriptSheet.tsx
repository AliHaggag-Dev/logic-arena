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
        <div className="flex flex-col gap-2 w-full flex-1 min-h-0 mobile-zen-sheet overflow-hidden">
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <BlockEditor
                    scriptInput={scriptInput}
                    setScriptInput={setScriptInput}
                    handleDeployBrain={handleDeployBrain}
                    onDeployDone={onDeployDone}
                />
            </div>
        </div>
    );
};
