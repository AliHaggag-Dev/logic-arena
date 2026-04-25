import { useState, useEffect, useRef } from 'react';

export const useParserWorker = () => {
    const workerRef = useRef<Worker | null>(null);
    const [syntaxValid, setSyntaxValid] = useState<boolean | null>(null);

    useEffect(() => {
        workerRef.current = new Worker(new URL('../../../../../workers/parser.worker.ts', import.meta.url));
        workerRef.current.onmessage = (e: MessageEvent<{ status: string }>) => {
            if (e.data.status === "success") {
                setSyntaxValid(true);
            } else {
                setSyntaxValid(false);
            }
        };
        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const validateSyntax = (code: string) => {
        workerRef.current?.postMessage({ code, id: Date.now() });
    };

    return { syntaxValid, validateSyntax };
};
