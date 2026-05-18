import {
    Expression,
    ForStatement,
    IfStatement,
    NodeType,
    Statement,
    TokenType,
    WhileStatement,
} from "../../types";
import type { Parser } from "../parser";
import { currentTokenIs, peekTokenIs, expectIdentifier } from "../token-guards";

function isCurrentBlockTerminator(parser: Parser, endTokens: readonly string[]): boolean {
    return currentTokenIs(parser, TokenType.KEYWORD) && endTokens.includes(parser.currentToken.value);
}

function expectCurrentKeywordAfterPeek(parser: Parser, keyword: string): boolean {
    return parser.expectPeek(TokenType.KEYWORD) && parser.currentToken.value === keyword;
}

export function parseBlockStatement(parser: Parser, endTokens: readonly string[]): Statement[] {
    const body: Statement[] = [];
    parser.nextToken();

    while (!currentTokenIs(parser, TokenType.EOF) && !isCurrentBlockTerminator(parser, endTokens)) {
        const statement = parser.statementParser.parseStatement();
        if (statement) body.push(statement);
        parser.nextToken();
    }

    return body;
}

export function parseIfStatement(parser: Parser): IfStatement | null {
    parser.nextToken();
    const condition = parser.expressionParser.parseExpression();
    if (!condition || !expectCurrentKeywordAfterPeek(parser, "THEN")) return null;

    const consequence = parseBlockStatement(parser, ["ELSE", "END"]);
    const alternate = parser.currentToken.value === "ELSE"
        ? parseBlockStatement(parser, ["END"])
        : undefined;

    return { type: NodeType.IfStatement, condition, consequence, alternate };
}

export function parseWhileStatement(parser: Parser): WhileStatement | null {
    parser.nextToken();
    const condition = parser.expressionParser.parseExpression();
    if (!condition || !expectCurrentKeywordAfterPeek(parser, "DO")) return null;

    return { type: NodeType.WhileStatement, condition, body: parseBlockStatement(parser, ["END"]) };
}

export function parseForStatement(parser: Parser): ForStatement | null {
    const variable = expectIdentifier(parser);
    if (!variable || !parser.expectPeek(TokenType.ASSIGN)) return null;

    parser.nextToken();
    const start = parser.expressionParser.parseExpression();
    if (!start || !expectCurrentKeywordAfterPeek(parser, "TO")) return null;

    parser.nextToken();
    const end = parser.expressionParser.parseExpression();
    if (!end || !expectCurrentKeywordAfterPeek(parser, "DO")) return null;

    return { type: NodeType.ForStatement, variable, start, end, body: parseBlockStatement(parser, ["END"]) };
}
