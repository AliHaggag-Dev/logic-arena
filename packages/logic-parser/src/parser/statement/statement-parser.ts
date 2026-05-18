import {
    BreakStatement,
    ContinueStatement,
    NodeType,
    Statement,
    TokenType,
} from "../../types";
import type { Parser } from "../parser";
import { currentTokenIs } from "../token-guards";
import { ACTION_KEYWORDS } from "./statement.constants";

import { parseIfStatement, parseWhileStatement, parseForStatement } from "./control-flow-parser";
import { parseActionStatement, parseQueryStatement, parseReturnStatement } from "./action-command-parser";
import { parseFunctionDeclaration, parseCallStatement, parseAssignmentStatement, parseWaitStatement, parseScanStatement } from "./declaration-parser";

type StatementParserFn = () => Statement | null;

export class StatementParser {
    private readonly keywordParsers: ReadonlyMap<string, StatementParserFn>;

    constructor(private readonly parser: Parser) {
        this.keywordParsers = new Map<string, StatementParserFn>([
            ["IF", () => parseIfStatement(this.parser)],
            ["WHILE", () => parseWhileStatement(this.parser)],
            ["FOR", () => parseForStatement(this.parser)],
            ["FUNCTION", () => parseFunctionDeclaration(this.parser)],
            ["CALL", () => parseCallStatement(this.parser)],
            ["WAIT", () => parseWaitStatement(this.parser)],
            ["SCAN", () => parseScanStatement(this.parser)],
            ["SET", () => parseAssignmentStatement(this.parser)],
            ["BREAK", () => ({ type: NodeType.BreakStatement } as BreakStatement)],
            ["CONTINUE", () => ({ type: NodeType.ContinueStatement } as ContinueStatement)],
            ["RETURN", () => parseReturnStatement(this.parser)],
        ]);
    }

    public parseStatement(): Statement | null {
        if (currentTokenIs(this.parser, TokenType.QUERY_CALL)) return parseQueryStatement(this.parser);
        if (!currentTokenIs(this.parser, TokenType.KEYWORD)) return null;

        const keyword = this.parser.currentToken.value;
        const parser = this.keywordParsers.get(keyword);

        if (parser) return parser.call(this);
        if (ACTION_KEYWORDS.has(keyword)) return parseActionStatement(this.parser);

        return null;
    }
}
