import { 
    TokenType, NodeType, Expression, 
    BinaryExpression, UnaryExpression, BooleanLiteral,
    Identifier, NumberLiteral, StringLiteral, ActionExpression 
} from "../types";
import type { Parser } from "./parser";

export class ExpressionParser {
    constructor(private parser: Parser) {}

    public parseExpression(): Expression | null {
        return this.parseComparisonExpression();
    }

    public parseComparisonExpression(): Expression | null {
        const left = this.parseBinaryExpression();
        if (!left) return null;

        if (
            this.parser.peekToken.type === TokenType.OPERATOR &&
            (this.parser.peekToken.value === "<" || 
             this.parser.peekToken.value === ">" || 
             this.parser.peekToken.value === "==")
        ) {
            this.parser.nextToken(); 
            const operator = this.parser.currentToken.value;

            this.parser.nextToken(); 
            const right = this.parseBinaryExpression();
            if (!right) return null;

            return {
                type: NodeType.ComparisonExpression,
                left,
                operator,
                right,
            };
        }

        return left;
    }

    public parseBinaryExpression(): Expression | null {
        let left = this.parseUnaryExpression();
        if (!left) return null;

        while (
            this.parser.peekToken.type === TokenType.OPERATOR && 
            ["+", "-", "*", "/", "%"].includes(this.parser.peekToken.value)
        ) {
            this.parser.nextToken();
            const operator = this.parser.currentToken.value;

            this.parser.nextToken();
            const right = this.parseUnaryExpression();
            if (!right) return null;

            left = {
                type: NodeType.BinaryExpression,
                left,
                operator,
                right,
            } as BinaryExpression;
        }

        return left;
    }

    private parseUnaryExpression(): Expression | null {
        if (this.parser.currentToken.type === TokenType.KEYWORD && this.parser.currentToken.value === "NOT") {
            this.parser.nextToken();
            const argument = this.parseUnaryExpression();
            if (!argument) return null;

            return {
                type: NodeType.UnaryExpression,
                operator: "NOT",
                argument,
            } as UnaryExpression;
        }

        if (this.parser.currentToken.type === TokenType.OPERATOR && this.parser.currentToken.value === "-") {
            this.parser.nextToken();
            const argument = this.parseUnaryExpression();
            if (!argument) return null;

            return {
                type: NodeType.UnaryExpression,
                operator: "-",
                argument,
            } as UnaryExpression;
        }

        return this.parsePrimary();
    }

    private parsePrimary(): Expression | null {
        const { currentToken } = this.parser;
        if (currentToken.type === TokenType.KEYWORD && currentToken.value === "TRUE") {
            return { type: NodeType.BooleanLiteral, value: true } as BooleanLiteral;
        }
        if (currentToken.type === TokenType.KEYWORD && currentToken.value === "FALSE") {
            return { type: NodeType.BooleanLiteral, value: false } as BooleanLiteral;
        }
        if (currentToken.type === TokenType.IDENTIFIER) {
            return { type: NodeType.Identifier, value: currentToken.value };
        }
        if (currentToken.type === TokenType.NUMBER) {
            return { type: NodeType.NumberLiteral, value: parseFloat(currentToken.value) };
        }
        if (currentToken.type === TokenType.STRING) {
            return { type: NodeType.StringLiteral, value: currentToken.value };
        }
        return null;
    }
}
