import { 
    TokenType, NodeType, Expression, 
    BinaryExpression, UnaryExpression, BooleanLiteral,
    Identifier, NumberLiteral, StringLiteral, ActionExpression 
} from "../types";
import type { Parser } from "./parser";

export class ExpressionParser {
    constructor(private parser: Parser) {}

    // Precedence tower (low → high):
    //   OR → AND → comparison → binary (+−*/%) → unary(NOT/−) → primary
    public parseExpression(): Expression | null {
        return this.parseOrExpression();
    }

    // ── OR layer ────────────────────────────────────────────────────────────
    private parseOrExpression(): Expression | null {
        let left = this.parseAndExpression();
        if (!left) return null;

        while (
            this.parser.peekToken.type === TokenType.KEYWORD &&
            this.parser.peekToken.value === "OR"
        ) {
            this.parser.nextToken(); // consume OR keyword
            this.parser.nextToken(); // move to right-hand operand
            const right = this.parseAndExpression();
            if (!right) return null;
            left = {
                type: NodeType.BinaryExpression,
                left,
                operator: "OR",
                right,
            } as BinaryExpression;
        }

        return left;
    }

    // ── AND layer ───────────────────────────────────────────────────────────
    private parseAndExpression(): Expression | null {
        let left = this.parseComparisonExpression();
        if (!left) return null;

        while (
            this.parser.peekToken.type === TokenType.KEYWORD &&
            this.parser.peekToken.value === "AND"
        ) {
            this.parser.nextToken(); // consume AND keyword
            this.parser.nextToken(); // move to right-hand operand
            const right = this.parseComparisonExpression();
            if (!right) return null;
            left = {
                type: NodeType.BinaryExpression,
                left,
                operator: "AND",
                right,
            } as BinaryExpression;
        }

        return left;
    }

    // ── Comparison layer: <  >  ==  !=  <=  >= ─────────────────────────────
    public parseComparisonExpression(): Expression | null {
        const left = this.parseAddition();
        if (!left) return null;

        const COMPARISON_OPS = ["<", ">", "==", "!=", "<=", ">="];
        if (
            this.parser.peekToken.type === TokenType.OPERATOR &&
            COMPARISON_OPS.includes(this.parser.peekToken.value)
        ) {
            this.parser.nextToken();
            const operator = this.parser.currentToken.value;

            this.parser.nextToken();
            const right = this.parseAddition();
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

    // ── Addition: + − ───────────────────────────────────────────────────────
    public parseAddition(): Expression | null {
        let left = this.parseMultiply();
        if (!left) return null;

        while (
            this.parser.peekToken.type === TokenType.OPERATOR &&
            ["+", "-"].includes(this.parser.peekToken.value)
        ) {
            this.parser.nextToken();
            const operator = this.parser.currentToken.value;

            this.parser.nextToken();
            const right = this.parseMultiply();
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

    // ── Multiplication: * / % ───────────────────────────────────────────────
    public parseMultiply(): Expression | null {
        let left = this.parseUnaryExpression();
        if (!left) return null;

        while (
            this.parser.peekToken.type === TokenType.OPERATOR &&
            ["*", "/", "%"].includes(this.parser.peekToken.value)
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

    // ── Unary: NOT  − ───────────────────────────────────────────────────────
    private parseUnaryExpression(): Expression | null {
        if (this.parser.currentToken.type === TokenType.KEYWORD && this.parser.currentToken.value === "NOT") {
            this.parser.nextToken();
            const argument = this.parseUnaryExpression();
            if (!argument) return null;
            return { type: NodeType.UnaryExpression, operator: "NOT", argument } as UnaryExpression;
        }

        if (this.parser.currentToken.type === TokenType.OPERATOR && this.parser.currentToken.value === "-") {
            this.parser.nextToken();
            const argument = this.parseUnaryExpression();
            if (!argument) return null;
            return { type: NodeType.UnaryExpression, operator: "-", argument } as UnaryExpression;
        }

        return this.parsePrimary();
    }

    // ── Primary: literals, identifiers, grouped expressions ─────────────────
    private parsePrimary(): Expression | null {
        const { currentToken } = this.parser;

        // Grouped expression: ( expr )
        if (currentToken.type === TokenType.LPAREN) {
            this.parser.nextToken(); // consume '('
            const inner = this.parseOrExpression(); // full precedence inside parens
            if (!inner) return null;
            // expect ')' as the next token
            if (this.parser.peekToken.type === TokenType.RPAREN) {
                this.parser.nextToken(); // consume ')'
            }
            return inner;
        }

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
