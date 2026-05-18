import { Identifier, NodeType, TokenType } from "../types";
import type { Parser } from "./parser";

export function currentTokenIs(parser: Parser, type: TokenType): boolean {
    return (parser.currentToken.type as TokenType) === type;
}

export function peekTokenIs(parser: Parser, type: TokenType): boolean {
    return (parser.peekToken.type as TokenType) === type;
}

export function consumeIfPeek(parser: Parser, type: TokenType): boolean {
    if (!peekTokenIs(parser, type)) return false;

    parser.nextToken();
    return true;
}

export function expectIdentifier(parser: Parser): Identifier | null {
    if (!parser.expectPeek(TokenType.IDENTIFIER)) return null;

    return { type: NodeType.Identifier, value: parser.currentToken.value };
}
