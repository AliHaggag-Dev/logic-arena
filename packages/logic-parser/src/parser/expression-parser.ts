import { 
    TokenType, NodeType, Expression, 
    BinaryExpression, UnaryExpression, BooleanLiteral,
    Identifier, NumberLiteral, StringLiteral,
    FunctionCallExpression, ArrayLiteral, IndexExpression,
    ObjectLiteral, ObjectProperty, MemberExpression,
} from "../types";
import type { Parser } from "./parser";

/** Built-in functions recognized as expression-level calls. */
const BUILTIN_FN_NAMES = new Set([
    "ABS", "SQRT", "POW", "SIN", "COS", "TAN",
    "ATAN2", "MIN", "MAX", "FLOOR", "CEIL", "ROUND",
    "LENGTH", "PUSH", "POP", "RANDOM", "LOG",
    // ── Phase 1: Advanced Sensory Arrays ──────────────────────────────────
    "GET_ALL_VISIBLE_ENEMIES", "RAYCAST",
    // ── Phase 3: Swarm Intelligence (Inter-Robot Communication) ───────────
    "BROADCAST", "RECEIVE",
]);

/** Helper to check peekToken type without TS narrowing side-effects. */
function peekIs(parser: Parser, type: TokenType): boolean {
    return (parser.peekToken.type as TokenType) === type;
}

/** Helper to check currentToken type without TS narrowing side-effects. */
function curIs(parser: Parser, type: TokenType): boolean {
    return (parser.currentToken.type as TokenType) === type;
}

export class ExpressionParser {
    constructor(private parser: Parser) {}

    // Precedence tower (low → high):
    //   OR → AND → comparison → binary (+−*/%) → unary(NOT/−) → postfix → primary
    public parseExpression(): Expression | null {
        return this.parseOrExpression();
    }

    // ── OR layer ────────────────────────────────────────────────────────────
    private parseOrExpression(): Expression | null {
        let left = this.parseAndExpression();
        if (!left) return null;

        while (
            peekIs(this.parser, TokenType.KEYWORD) &&
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
            peekIs(this.parser, TokenType.KEYWORD) &&
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
            peekIs(this.parser, TokenType.OPERATOR) &&
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
            peekIs(this.parser, TokenType.OPERATOR) &&
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
            peekIs(this.parser, TokenType.OPERATOR) &&
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
        if (curIs(this.parser, TokenType.KEYWORD) && this.parser.currentToken.value === "NOT") {
            this.parser.nextToken();
            const argument = this.parseUnaryExpression();
            if (!argument) return null;
            return { type: NodeType.UnaryExpression, operator: "NOT", argument } as UnaryExpression;
        }

        if (curIs(this.parser, TokenType.OPERATOR) && this.parser.currentToken.value === "-") {
            this.parser.nextToken();
            const argument = this.parseUnaryExpression();
            if (!argument) return null;
            return { type: NodeType.UnaryExpression, operator: "-", argument } as UnaryExpression;
        }

        return this.parsePostfix();
    }

    // ── Postfix: array indexing arr[0], dot access obj.prop ────────────────
    private parsePostfix(): Expression | null {
        let expr = this.parsePrimary();
        if (!expr) return null;

        // Handle chained postfix operators: arr[0], obj.prop, obj["key"], state.items[0].x
        while (
            peekIs(this.parser, TokenType.LBRACKET) ||
            peekIs(this.parser, TokenType.DOT)
        ) {
            if (peekIs(this.parser, TokenType.LBRACKET)) {
                this.parser.nextToken(); // consume '['
                this.parser.nextToken(); // move to index expression
                const index = this.parseOrExpression();
                if (!index) return null;
                if (peekIs(this.parser, TokenType.RBRACKET)) {
                    this.parser.nextToken(); // consume ']'
                }
                expr = {
                    type: NodeType.IndexExpression,
                    object: expr,
                    index,
                } as IndexExpression;
            } else {
                // DOT notation: obj.propName
                this.parser.nextToken(); // consume '.'
                if (!peekIs(this.parser, TokenType.IDENTIFIER)) return null;
                this.parser.nextToken(); // move to property identifier
                const property = this.parser.currentToken.value;
                expr = {
                    type: NodeType.MemberExpression,
                    object: expr,
                    property,
                } as MemberExpression;
            }
        }

        return expr;
    }

    // ── Primary: literals, identifiers, grouped expressions, fn calls, arrays
    private parsePrimary(): Expression | null {
        const { currentToken } = this.parser;

        // Grouped expression: ( expr )
        if (curIs(this.parser, TokenType.LPAREN)) {
            this.parser.nextToken(); // consume '('
            const inner = this.parseOrExpression(); // full precedence inside parens
            if (!inner) return null;
            // expect ')' as the next token
            if (peekIs(this.parser, TokenType.RPAREN)) {
                this.parser.nextToken(); // consume ')'
            }
            return inner;
        }

        // Object literal: { key: expr, ... }
        if (curIs(this.parser, TokenType.LBRACE)) {
            return this.parseObjectLiteral();
        }

        // Array literal: [ expr, expr, ... ]
        if (curIs(this.parser, TokenType.LBRACKET)) {
            return this.parseArrayLiteral();
        }

        if (curIs(this.parser, TokenType.KEYWORD) && currentToken.value === "TRUE") {
            return { type: NodeType.BooleanLiteral, value: true } as BooleanLiteral;
        }
        if (curIs(this.parser, TokenType.KEYWORD) && currentToken.value === "FALSE") {
            return { type: NodeType.BooleanLiteral, value: false } as BooleanLiteral;
        }

        // Identifier — could be a built-in function call like ABS(x) or a plain variable
        if (curIs(this.parser, TokenType.IDENTIFIER)) {
            const name = currentToken.value;

            // Check if this is a built-in function call: NAME(args...)
            if (BUILTIN_FN_NAMES.has(name.toUpperCase()) && peekIs(this.parser, TokenType.LPAREN)) {
                return this.parseFunctionCallExpression(name.toUpperCase());
            }

            return { type: NodeType.Identifier, value: name };
        }
        if (curIs(this.parser, TokenType.NUMBER)) {
            return { type: NodeType.NumberLiteral, value: parseFloat(currentToken.value) };
        }
        if (curIs(this.parser, TokenType.STRING)) {
            return { type: NodeType.StringLiteral, value: currentToken.value };
        }
        return null;
    }

    // ── Built-in function call: ABS(expr), POW(a, b) ────────────────────────
    private parseFunctionCallExpression(name: string): FunctionCallExpression | null {
        this.parser.nextToken(); // consume '('
        const args: Expression[] = [];

        // Handle empty args: FN()
        if (peekIs(this.parser, TokenType.RPAREN)) {
            this.parser.nextToken(); // consume ')'
            return { type: NodeType.FunctionCallExpression, name, args };
        }

        // Parse first argument
        this.parser.nextToken(); // move to first arg
        const firstArg = this.parseOrExpression();
        if (firstArg) args.push(firstArg);

        // Parse comma-separated additional args
        while (peekIs(this.parser, TokenType.COMMA)) {
            this.parser.nextToken(); // consume ','
            this.parser.nextToken(); // move to next arg
            const arg = this.parseOrExpression();
            if (arg) args.push(arg);
        }

        // expect ')'
        if (peekIs(this.parser, TokenType.RPAREN)) {
            this.parser.nextToken(); // consume ')'
        }

        return { type: NodeType.FunctionCallExpression, name, args };
    }

    // ── Array literal: [1, 2, 3] or [] ──────────────────────────────────────
    private parseArrayLiteral(): ArrayLiteral | null {
        const elements: Expression[] = [];

        // Handle empty array: []
        if (peekIs(this.parser, TokenType.RBRACKET)) {
            this.parser.nextToken(); // consume ']'
            return { type: NodeType.ArrayLiteral, elements };
        }

        // Parse first element
        this.parser.nextToken(); // move to first element
        const firstEl = this.parseOrExpression();
        if (firstEl) elements.push(firstEl);

        // Parse comma-separated additional elements
        while (peekIs(this.parser, TokenType.COMMA)) {
            this.parser.nextToken(); // consume ','
            this.parser.nextToken(); // move to next element
            const el = this.parseOrExpression();
            if (el) elements.push(el);
        }

        // expect ']'
        if (peekIs(this.parser, TokenType.RBRACKET)) {
            this.parser.nextToken(); // consume ']'
        }

        return { type: NodeType.ArrayLiteral, elements };
    }

    // ── Object literal: { key: expr, key2: expr2 } ──────────────────────────
    private parseObjectLiteral(): ObjectLiteral | null {
        const properties: ObjectProperty[] = [];

        // Handle empty object: {}
        if (peekIs(this.parser, TokenType.RBRACE)) {
            this.parser.nextToken(); // consume '}'
            return { type: NodeType.ObjectLiteral, properties };
        }

        // Parse first property
        const firstProp = this.parseObjectProperty();
        if (firstProp) properties.push(firstProp);

        // Parse comma-separated additional properties
        while (peekIs(this.parser, TokenType.COMMA)) {
            this.parser.nextToken(); // consume ','
            const prop = this.parseObjectProperty();
            if (prop) properties.push(prop);
        }

        // expect '}'
        if (peekIs(this.parser, TokenType.RBRACE)) {
            this.parser.nextToken(); // consume '}'
        }

        return { type: NodeType.ObjectLiteral, properties };
    }

    // ── Parse a single key: value pair ──────────────────────────────────────
    private parseObjectProperty(): ObjectProperty | null {
        this.parser.nextToken(); // move to key token

        let key: string;
        if (curIs(this.parser, TokenType.IDENTIFIER)) {
            key = this.parser.currentToken.value;
        } else if (curIs(this.parser, TokenType.STRING)) {
            key = this.parser.currentToken.value;
        } else {
            return null;
        }

        // expect ':'
        if (!peekIs(this.parser, TokenType.COLON)) return null;
        this.parser.nextToken(); // consume ':'

        this.parser.nextToken(); // move to value expression
        const value = this.parseOrExpression();
        if (!value) return null;

        return { key, value };
    }
}
