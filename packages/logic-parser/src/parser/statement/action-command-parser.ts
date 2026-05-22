import {
    ActionStatement,
    Expression,
    NodeType,
    ReturnStatement,
    QueryStatement,
    TokenType,
} from "../../types";
import type { Parser } from "../parser";
import { peekTokenIs, consumeIfPeek } from "../token-guards";

export function peekCanStartActionArgument(parser: Parser): boolean {
    return peekTokenIs(parser, TokenType.NUMBER)
        || peekTokenIs(parser, TokenType.IDENTIFIER)
        || peekTokenIs(parser, TokenType.STRING);
}

export function peekCanStartExpression(parser: Parser): boolean {
    return peekCanStartActionArgument(parser)
        || peekTokenIs(parser, TokenType.LPAREN)
        || peekTokenIs(parser, TokenType.LBRACKET)
        || peekTokenIs(parser, TokenType.LBRACE)
        || (peekTokenIs(parser, TokenType.KEYWORD) && ["TRUE", "FALSE", "NOT"].includes(parser.peekToken.value));
}

export function isActionArgument(expression: Expression): expression is NonNullable<ActionStatement["consequence"]["args"]>[number] {
    return expression.type === NodeType.Identifier
        || expression.type === NodeType.NumberLiteral
        || expression.type === NodeType.StringLiteral;
}

export function parseActionStatement(parser: Parser): ActionStatement {
    const command = parser.currentToken.value;
    const args: ActionStatement["consequence"]["args"] = [];

    if (peekTokenIs(parser, TokenType.LPAREN)) {
        parser.nextToken();
        if (!consumeIfPeek(parser, TokenType.RPAREN)) {
            parser.nextToken();
            const firstArg = parser.expressionParser.parseExpression();
            if (firstArg && isActionArgument(firstArg)) args.push(firstArg);

            while (peekTokenIs(parser, TokenType.COMMA)) {
                parser.nextToken();
                parser.nextToken();
                const arg = parser.expressionParser.parseExpression();
                if (arg && isActionArgument(arg)) args.push(arg);
            }

            consumeIfPeek(parser, TokenType.RPAREN);
        }

        return { type: NodeType.ActionStatement, consequence: { type: NodeType.ActionExpression, command, args } };
    }

    while (peekCanStartActionArgument(parser)) {
        parser.nextToken();
        const arg = parser.expressionParser.parseExpression();
        if (arg && isActionArgument(arg)) args.push(arg);
    }

    return { type: NodeType.ActionStatement, consequence: { type: NodeType.ActionExpression, command, args } };
}

export function parseQueryStatement(parser: Parser): QueryStatement {
    const query = parser.currentToken.value;

    if (peekTokenIs(parser, TokenType.LPAREN)) {
        parser.nextToken();
        if (peekTokenIs(parser, TokenType.RPAREN)) parser.nextToken();
    }

    return { type: NodeType.QueryStatement, query };
}

export function parseReturnStatement(parser: Parser): ReturnStatement {
    if (!peekCanStartExpression(parser)) return { type: NodeType.ReturnStatement };

    parser.nextToken();
    return {
        type: NodeType.ReturnStatement,
        value: parser.expressionParser.parseExpression() ?? undefined,
    };
}
