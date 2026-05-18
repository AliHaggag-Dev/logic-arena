import {
    BooleanLiteral,
    Expression,
    FunctionCallExpression,
    NodeType,
    TokenType,
} from "../../types";
import type { Parser } from "../parser";
import { currentTokenIs, peekTokenIs, consumeIfPeek } from "../token-guards";
import { BUILTIN_FUNCTION_NAMES } from "./expression.constants";
import { parseDelimitedExpressions, parseArrayLiteral, parseObjectLiteral } from "./literal-parser";

function parseGroupedExpression(
    parser: Parser,
    parseOrExpression: () => Expression | null,
): Expression | null {
    parser.nextToken();
    const innerExpression = parseOrExpression();
    if (!innerExpression) return null;

    consumeIfPeek(parser, TokenType.RPAREN);
    return innerExpression;
}

function parseIdentifierOrBuiltInCall(
    parser: Parser,
    name: string,
    parseOrExpression: () => Expression | null,
): Expression | null {
    const normalizedName = name.toUpperCase();

    if (BUILTIN_FUNCTION_NAMES.has(normalizedName) && peekTokenIs(parser, TokenType.LPAREN)) {
        return parseFunctionCallExpression(parser, normalizedName, parseOrExpression);
    }

    return { type: NodeType.Identifier, value: name };
}

export function parseFunctionCallExpression(
    parser: Parser,
    name: string,
    parseOrExpression: () => Expression | null,
): FunctionCallExpression {
    parser.nextToken();

    return {
        type: NodeType.FunctionCallExpression,
        name,
        args: parseDelimitedExpressions(parser, parseOrExpression, TokenType.RPAREN),
    };
}

export function parsePrimary(
    parser: Parser,
    parseOrExpression: () => Expression | null,
): Expression | null {
    const { currentToken } = parser;

    if (currentTokenIs(parser, TokenType.LPAREN)) return parseGroupedExpression(parser, parseOrExpression);
    if (currentTokenIs(parser, TokenType.LBRACE)) return parseObjectLiteral(parser, parseOrExpression);
    if (currentTokenIs(parser, TokenType.LBRACKET)) return parseArrayLiteral(parser, parseOrExpression);

    if (currentTokenIs(parser, TokenType.KEYWORD) && currentToken.value === "TRUE") {
        return { type: NodeType.BooleanLiteral, value: true } as BooleanLiteral;
    }

    if (currentTokenIs(parser, TokenType.KEYWORD) && currentToken.value === "FALSE") {
        return { type: NodeType.BooleanLiteral, value: false } as BooleanLiteral;
    }

    if (currentTokenIs(parser, TokenType.IDENTIFIER)) {
        return parseIdentifierOrBuiltInCall(parser, currentToken.value, parseOrExpression);
    }

    if (currentTokenIs(parser, TokenType.NUMBER)) {
        return { type: NodeType.NumberLiteral, value: parseFloat(currentToken.value) };
    }

    if (currentTokenIs(parser, TokenType.STRING)) {
        return { type: NodeType.StringLiteral, value: currentToken.value };
    }

    return null;
}
