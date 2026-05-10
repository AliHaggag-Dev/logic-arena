import { Parser, SemanticAnalyzer, SemanticWarning } from "../../../../packages/logic-parser/src";

interface WorkerRequest {
  code: string;
  id: number;
}

interface WorkerSuccessResponse {
  id: number;
  status: "success";
  warnings: SemanticWarning[];
}

interface WorkerErrorResponse {
  id: number;
  status: "error";
  error: string;
}

const analyzer = new SemanticAnalyzer();

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { code, id } = e.data;

  try {
    const parser = new Parser(code);
    const ast = parser.parse();

    // Run semantic analysis after parsing
    const warnings = analyzer.analyze(ast);

    self.postMessage({ id, status: "success", warnings } satisfies WorkerSuccessResponse);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ id, status: "error", error: message } satisfies WorkerErrorResponse);
  }
};
