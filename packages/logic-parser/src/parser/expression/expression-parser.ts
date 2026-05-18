import {
    BinaryExpression,
    Expression,
    IndexExpression,
    MemberExpression,
    NodeType,
    TokenType,
    UnaryExpression,
} from "../../types";
import type { Parser } from "../parser";
import { currentTokenIs, peekTokenIs } from "../token-guards";
import {
    ADDITIVE_OPERATORS,
    COMPARISON_OPERATORS,
    MULTIPLICATIVE_OPERATORS,
} from "./expression.constants";
import { parsePrimary } from "./primary-parser";

type ExpressionReader = () => Expression | null;

export class ExpressionParser {
    constructor(private readonly parser: Parser) { }

    public parseExpression(): Expression | null {
        return this.parseOrExpression();
    }

    public parseComparisonExpression(): Expression | null {
        const left = this.parseAddition();
        if (!left || !this.peekOperatorIs(COMPARISON_OPERATORS)) return left;

        this.parser.nextToken();
        const operator = this.parser.currentToken.value;
        this.parser.nextToken();

        const right = this.parseAddition();
        return right ? { type: NodeType.ComparisonExpression, left, operator, right } : null;
    }

    public parseAddition(): Expression | null {
        return this.parseLeftAssociative(this.parseMultiply, ADDITIVE_OPERATORS);
    }

    public parseMultiply(): Expression | null {
        return this.parseLeftAssociative(this.parseUnaryExpression, MULTIPLICATIVE_OPERATORS);
    }

    private parseOrExpression(): Expression | null {
        return this.parseKeywordBinary(this.parseAndExpression, "OR");
    }

    private parseAndExpression(): Expression | null {
        return this.parseKeywordBinary(this.parseComparisonExpression, "AND");
    }

    private parseKeywordBinary(readOperand: ExpressionReader, operator: string): Expression | null {
        let left = readOperand.call(this);
        if (!left) return null;

        while (peekTokenIs(this.parser, TokenType.KEYWORD) && this.parser.peekToken.value === operator) {
            this.parser.nextToken();
            this.parser.nextToken();

            const right = readOperand.call(this);
            if (!right) return null;

            left = { type: NodeType.BinaryExpression, left, operator, right } as BinaryExpression;
        }

        return left;
    }

    private parseLeftAssociative(readOperand: ExpressionReader, operators: ReadonlySet<string>): Expression | null {
        let left = readOperand.call(this);
        if (!left) return null;

        while (this.peekOperatorIs(operators)) {
            this.parser.nextToken();
            const operator = this.parser.currentToken.value;
            this.parser.nextToken();

            const right = readOperand.call(this);
            if (!right) return null;

            left = { type: NodeType.BinaryExpression, left, operator, right } as BinaryExpression;
        }

        return left;
    }

    private parseUnaryExpression(): Expression | null {
        const token = this.parser.currentToken;

        if (currentTokenIs(this.parser, TokenType.KEYWORD) && token.value === "NOT") {
            return this.parseUnary("NOT");
        }

        if (currentTokenIs(this.parser, TokenType.OPERATOR) && token.value === "-") {
            return this.parseUnary("-");
        }

        return this.parsePostfix();
    }

    private parseUnary(operator: string): UnaryExpression | null {
        this.parser.nextToken();
        const argument = this.parseUnaryExpression();
        return argument ? { type: NodeType.UnaryExpression, operator, argument } : null;
    }

    private parsePostfix(): Expression | null {
        const parseOrExpression = () => this.parseOrExpression();
        let expression = parsePrimary(this.parser, parseOrExpression);
        if (!expression) return null;

        while (peekTokenIs(this.parser, TokenType.LBRACKET) || peekTokenIs(this.parser, TokenType.DOT)) {
            expression = peekTokenIs(this.parser, TokenType.LBRACKET)
                ? this.parseIndexExpression(expression)
                : this.parseMemberExpression(expression);

            if (!expression) return null;
        }

        return expression;
    }

    private parseIndexExpression(object: Expression): IndexExpression | null {
        this.parser.nextToken();
        this.parser.nextToken();

        const index = this.parseOrExpression();
        if (!index) return null;

        this.consumeIfPeek(TokenType.RBRACKET);
        return { type: NodeType.IndexExpression, object, index };
    }

    private parseMemberExpression(object: Expression): MemberExpression | null {
        this.parser.nextToken();
        if (!peekTokenIs(this.parser, TokenType.IDENTIFIER)) return null;

        this.parser.nextToken();
        return { type: NodeType.MemberExpression, object, property: this.parser.currentToken.value };
    }

    private peekOperatorIs(operators: ReadonlySet<string>): boolean {
        return peekTokenIs(this.parser, TokenType.OPERATOR) && operators.has(this.parser.peekToken.value);
    }

    private consumeIfPeek(type: TokenType): boolean {
        if (!peekTokenIs(this.parser, type)) return false;

        this.parser.nextToken();
        return true;
    }
}
