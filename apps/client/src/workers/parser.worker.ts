import { Parser, SemanticAnalyzer, SemanticWarning } from "../../../../packages/logic-parser/src";
import { computeDiagnostics } from "../components/shared-script-editor/diagnostics";
import type { DiagnosticMarker } from "./parser.worker.types";

interface WorkerRequest {
  code: string;
  id: number;
}

interface WorkerSuccessResponse {
  id: number;
  status: "success";
  warnings: SemanticWarning[];
  diagnostics: DiagnosticMarker[];
}

interface WorkerErrorResponse {
  id: number;
  status: "error";
  error: string;
  diagnostics: DiagnosticMarker[];
}

const analyzer = new SemanticAnalyzer();

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { code, id } = e.data;

  // Always compute inline diagnostics (works on raw text, doesn't need a valid AST)
  const diagnostics = computeDiagnostics(code);

  try {
    const parser = new Parser(code);
    const ast = parser.parse();

    // Run semantic analysis after parsing
    const warnings = analyzer.analyze(ast);

    self.postMessage({ id, status: "success", warnings, diagnostics } satisfies WorkerSuccessResponse);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ id, status: "error", error: message, diagnostics } satisfies WorkerErrorResponse);
  }
};

