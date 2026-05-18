import {
    AssignmentStatement,
    CallStatement,
    Expression,
    FunctionDeclaration,
    Identifier,
    NodeType,
    ScanStatement,
    Statement,
    TokenType,
    WaitStatement,
} from "../../types";
import type { Parser } from "../parser";
import { currentTokenIs, peekTokenIs, expectIdentifier } from "../token-guards";
import { parseBlockStatement } from "./control-flow-parser";

export function parseIdentifierList(parser: Parser): Identifier[] {
    parser.nextToken();
    const identifiers: Identifier[] = [];

    if (!peekTokenIs(parser, TokenType.RPAREN)) {
        const first = expectIdentifier(parser);
        if (first) identifiers.push(first);

        while (peekTokenIs(parser, TokenType.COMMA)) {
            parser.nextToken();
            const identifier = expectIdentifier(parser);
            if (identifier) identifiers.push(identifier);
        }
    }

    if (peekTokenIs(parser, TokenType.RPAREN)) parser.nextToken();
    return identifiers;
}

export function parseArgumentList(parser: Parser): Expression[] {
    parser.nextToken();
    const args: Expression[] = [];

    if (!peekTokenIs(parser, TokenType.RPAREN)) {
        parser.nextToken();
        const firstArg = parser.expressionParser.parseExpression();
        if (firstArg) args.push(firstArg);

        while (peekTokenIs(parser, TokenType.COMMA)) {
            parser.nextToken();
            parser.nextToken();
            const arg = parser.expressionParser.parseExpression();
            if (arg) args.push(arg);
        }
    }

    if (peekTokenIs(parser, TokenType.RPAREN)) parser.nextToken();
    return args;
}

export function parseFunctionDeclaration(parser: Parser): FunctionDeclaration | null {
    const name = expectIdentifier(parser);
    if (!name) return null;

    const params = peekTokenIs(parser, TokenType.LPAREN) ? parseIdentifierList(parser) : undefined;
    return { type: NodeType.FunctionDeclaration, name, params, body: parseBlockStatement(parser, ["END"]) };
}

export function parseCallStatement(parser: Parser): CallStatement | null {
    const functionName = expectIdentifier(parser);
    if (!functionName) return null;

    const args = peekTokenIs(parser, TokenType.LPAREN) ? parseArgumentList(parser) : undefined;
    return { type: NodeType.CallStatement, functionName, args };
}

export function parseWaitStatement(parser: Parser): WaitStatement | null {
    if (!parser.expectPeek(TokenType.NUMBER)) return null;

    return {
        type: NodeType.WaitStatement,
        ticks: { type: NodeType.NumberLiteral, value: parseFloat(parser.currentToken.value) },
    };
}

export function parseScanStatement(parser: Parser): ScanStatement {
    return { type: NodeType.ScanStatement };
}

function parseAssignmentTarget(parser: Parser): Pick<AssignmentStatement, "index" | "property"> {
    if (peekTokenIs(parser, TokenType.DOT)) {
        parser.nextToken();
        if (!peekTokenIs(parser, TokenType.IDENTIFIER)) return {};
        parser.nextToken();
        return { property: parser.currentToken.value };
    }

    if (peekTokenIs(parser, TokenType.LBRACKET)) {
        parser.nextToken();
        parser.nextToken();
        const index = parser.expressionParser.parseExpression() ?? undefined;
        if (peekTokenIs(parser, TokenType.RBRACKET)) parser.nextToken();
        return { index };
    }

    return {};
}

export function parseAssignmentStatement(parser: Parser): AssignmentStatement | null {
    const name = expectIdentifier(parser);
    if (!name) return null;

    const target = parseAssignmentTarget(parser);
    if (!parser.expectPeek(TokenType.ASSIGN)) return null;

    parser.nextToken();
    const value = parser.expressionParser.parseExpression();
    if (!value) return null;

    return { type: NodeType.AssignmentStatement, name, value, ...target };
}
