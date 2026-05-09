export interface Suggestion {
    label: string;
    detail: 'command' | 'control' | 'identifier' | 'flag' | string;
    hint: string;
}

export interface CaretPosition {
    bottom?: number | 'auto';
    top?: number | 'auto';
    left: number;
}

export interface ScriptEditorProps {
    scriptInput: string;
    setScriptInput: (val: string) => void;
    handleDeployBrain: () => void;
    toggleLibrary: () => void;
    clearPrebuilt: () => void;
}
