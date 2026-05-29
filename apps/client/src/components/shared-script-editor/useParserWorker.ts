import { useState, useEffect, useRef, useCallback } from 'react';
import type { SemanticWarning, DiagnosticMarker } from '../../workers/parser.worker.types';

export const useParserWorker = () => {
    const workerRef = useRef<Worker | null>(null);
    const [syntaxValid, setSyntaxValid] = useState<boolean | null>(null);
    const [warnings, setWarnings] = useState<SemanticWarning[]>([]);
    const [diagnostics, setDiagnostics] = useState<DiagnosticMarker[]>([]);

    useEffect(() => {
        workerRef.current = new Worker(new URL('../../workers/parser.worker.ts', import.meta.url));
        workerRef.current.onmessage = (e: MessageEvent<{ status: string; warnings?: SemanticWarning[]; diagnostics?: DiagnosticMarker[] }>) => {
            // Diagnostics are sent in both success and error responses
            setDiagnostics(e.data.diagnostics ?? []);

            if (e.data.status === "success") {
                setSyntaxValid(true);
                setWarnings(e.data.warnings ?? []);
            } else {
                setSyntaxValid(false);
                setWarnings([]);
            }
        };
        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const validateSyntax = useCallback((code: string) => {
        workerRef.current?.postMessage({ code, id: Date.now() });
    }, []);

    return { syntaxValid, validateSyntax, warnings, diagnostics };
};

