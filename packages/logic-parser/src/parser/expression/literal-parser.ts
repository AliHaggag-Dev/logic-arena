import {
    ArrayLiteral,
    Expression,
    NodeType,
    ObjectLiteral,
    ObjectProperty,
    TokenType,
} from "../../types";
import type { Parser } from "../parser";
import { currentTokenIs, peekTokenIs, consumeIfPeek } from "../token-guards";
import { FORBIDDEN_OBJECT_KEYS, MAX_LITERAL_COLLECTION_ELEMENTS } from "./expression.constants";

function assertCollectionSize(size: number, label: string): void {
    if (size > MAX_LITERAL_COLLECTION_ELEMENTS) {
        throw new Error(`AliScript ${label} are capped at ${MAX_LITERAL_COLLECTION_ELEMENTS} elements`);
    }
}

function parseObjectProperty(
    parser: Parser,
    parseOrExpression: () => Expression | null,
): ObjectProperty | null {
    parser.nextToken();

    if (!currentTokenIs(parser, TokenType.IDENTIFIER) && !currentTokenIs(parser, TokenType.STRING)) {
        return null;
    }

    const key = parser.currentToken.value;
    if (FORBIDDEN_OBJECT_KEYS.has(key)) {
        throw new Error(`Forbidden AliScript dictionary key: ${key}`);
    }

    if (!peekTokenIs(parser, TokenType.COLON)) return null;

    parser.nextToken();
    parser.nextToken();

    const value = parseOrExpression();
    return value ? { key, value } : null;
}

export function parseDelimitedExpressions(
    parser: Parser,
    parseOrExpression: () => Expression | null,
    closeToken: TokenType,
    label = "argument lists",
): Expression[] {
    const expressions: Expression[] = [];

    if (consumeIfPeek(parser, closeToken)) return expressions;

    parser.nextToken();
    const firstExpression = parseOrExpression();
    if (firstExpression) expressions.push(firstExpression);

    while (peekTokenIs(parser, TokenType.COMMA)) {
        parser.nextToken();
        parser.nextToken();

        const expression = parseOrExpression();
        if (expression) expressions.push(expression);

        assertCollectionSize(expressions.length, label);
    }

    consumeIfPeek(parser, closeToken);
    return expressions;
}

export function parseArrayLiteral(
    parser: Parser,
    parseOrExpression: () => Expression | null,
): ArrayLiteral {
    return {
        type: NodeType.ArrayLiteral,
        elements: parseDelimitedExpressions(parser, parseOrExpression, TokenType.RBRACKET, "array literals"),
    };
}

export function parseObjectLiteral(
    parser: Parser,
    parseOrExpression: () => Expression | null,
): ObjectLiteral {
    const properties: ObjectProperty[] = [];
    if (consumeIfPeek(parser, TokenType.RBRACE)) return { type: NodeType.ObjectLiteral, properties };

    const firstProperty = parseObjectProperty(parser, parseOrExpression);
    if (firstProperty) properties.push(firstProperty);

    while (peekTokenIs(parser, TokenType.COMMA)) {
        parser.nextToken();
        const property = parseObjectProperty(parser, parseOrExpression);
        if (property) properties.push(property);

        assertCollectionSize(properties.length, "dictionary literals");
    }

    consumeIfPeek(parser, TokenType.RBRACE);
    return { type: NodeType.ObjectLiteral, properties };
}
