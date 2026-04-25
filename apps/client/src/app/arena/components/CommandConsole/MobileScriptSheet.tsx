import React from 'react';
import { ScriptEditor } from './ScriptEditor';

interface MobileScriptSheetProps {
    scriptInput: string;
    setScriptInput: (val: string) => void;
    handleDeployBrain: (script: string) => void;
    onDeployDone?: () => void;
    setIsLibraryOpen: (val: boolean) => void;
    setActivePrebuilt: (val: string | null) => void;
}

export const MobileScriptSheet: React.FC<MobileScriptSheetProps> = ({
    scriptInput, setScriptInput, handleDeployBrain, onDeployDone, setIsLibraryOpen, setActivePrebuilt
}) => {
    return (
        <div className="flex flex-col gap-3 w-full flex-1 min-h-0 mobile-zen-sheet">
            {/* Zen header */}
            <div className="flex items-center gap-2 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                <span className="text-purple-300 text-[9px] font-black tracking-[0.3em] uppercase">AliScript_V2 // Zen Core</span>
            </div>

            {/* Editor fills all space */}
            <div className="flex flex-col flex-1 min-h-0 overflow-visible">
                <ScriptEditor
                    scriptInput={scriptInput}
                    setScriptInput={setScriptInput}
                    handleDeployBrain={() => {
                        handleDeployBrain(scriptInput);
                        onDeployDone?.();
                    }}
                    toggleLibrary={() => setIsLibraryOpen(true)}
                    clearPrebuilt={() => setActivePrebuilt(null)}
                />
            </div>
        </div>
    );
};
