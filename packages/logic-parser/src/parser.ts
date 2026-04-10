import {
    Token,
    TokenType,
    NodeType,
    Program,
    IfStatement,
    ComparisonExpression,
    ActionExpression,
    Identifier,
    NumberLiteral,
    StringLiteral,
    AssignmentStatement,
    ActionStatement,
    Expression,
    Statement,
    BinaryExpression,
    UnaryExpression,
    BooleanLiteral
} from "./types";
import { Lexer } from "./lexer";

export class Parser {
    private lexer: Lexer;
    private currentToken: Token;
    private peekToken: Token;

    constructor(input: string) {
        this.lexer = new Lexer(input);
        this.currentToken = this.lexer.nextToken();
        this.peekToken = this.lexer.nextToken();
    }

    private nextToken(): void {
        this.currentToken = this.peekToken;
        this.peekToken = this.lexer.nextToken();
    }

    private expectPeek(type: TokenType): boolean {
        if (this.peekToken.type === type) {
            this.nextToken();
            return true;
        }
        return false;
    }

    private parseProgram(): Program {
        const program: Program = { type: NodeType.Program, body: [] };

        while (this.currentToken.type !== TokenType.EOF) {
            const statement = this.parseStatement();
            if (statement) {
                program.body.push(statement);
            }
            this.nextToken(); // Advance to the next token after parsing a statement
        }
        return program;
    }

    private parseStatement(): Statement | null {
        if (this.currentToken.type === TokenType.KEYWORD && this.currentToken.value === "IF") {
            return this.parseIfStatement();
        }
        if (this.currentToken.type === TokenType.KEYWORD && this.currentToken.value === "SET") {
            return this.parseAssignmentStatement();
        }
        if (this.currentToken.type === TokenType.KEYWORD) {
            const actionStatement = this.parseActionStatement();
            if (actionStatement) {
                return actionStatement;
            }
        }
        return null;
    }

    private parseAssignmentStatement(): AssignmentStatement | null {
        if (!this.expectPeek(TokenType.IDENTIFIER)) return null;
        const name: Identifier = { type: NodeType.Identifier, value: this.currentToken.value };

        if (!this.expectPeek(TokenType.ASSIGN)) return null;

        this.nextToken(); // Move to the assigned value
        const value = this.parseExpression();
        if (!value) return null;

        return {
            type: NodeType.AssignmentStatement,
            name,
            value
        };
    }

    private parseIfStatement(): IfStatement | null {
        this.nextToken(); // Consume IF

        const condition = this.parseComparisonExpression();
        if (!condition) return null;

        if (!this.expectPeek(TokenType.KEYWORD) || this.currentToken.value !== "THEN") {
            return null;
        }

        this.nextToken(); // Consume THEN

        const consequence = this.parseActionExpression();
        if (!consequence) return null;

        return {
            type: NodeType.IfStatement,
            condition,
            consequence,
        };
    }

    private parseComparisonExpression(): Expression | null {
        const left = this.parseBinaryExpression();
        if (!left) return null;

        if (
            this.peekToken.type === TokenType.OPERATOR &&
            (this.peekToken.value === "<" || this.peekToken.value === ">" || this.peekToken.value === "==")
        ) {
            this.nextToken(); // currentToken = operator
            const operator = this.currentToken.value;

            this.nextToken(); // Move to the right-hand side of the expression
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

    private parseActionExpression(): ActionExpression | null {
        if (this.currentToken.type === TokenType.KEYWORD && (
            this.currentToken.value === "FIRE" ||
            this.currentToken.value === "MOVE" ||
            this.currentToken.value === "STOP" ||
            this.currentToken.value === "MOVE_FAST" ||
            this.currentToken.value === "BACKUP" ||
            this.currentToken.value === "BURST_FIRE" ||
            this.currentToken.value === "PATHFIND"
        )) {
            const command = this.currentToken.value;
            const args: (Identifier | NumberLiteral | StringLiteral)[] = [];

            // Simple argument parsing for MOVE (e.g., MOVE 100 200 or MOVE "north")
            while (this.peekToken.type === TokenType.NUMBER || this.peekToken.type === TokenType.IDENTIFIER || this.peekToken.type === TokenType.STRING) {
                this.nextToken();
                const arg = this.parseExpression();
                if (arg) {
                    if (arg.type === NodeType.Identifier || arg.type === NodeType.NumberLiteral || arg.type === NodeType.StringLiteral) {
                        args.push(arg);
                    }
                }
            }

            return {
                type: NodeType.ActionExpression,
                command,
                args,
            };
        }
        return null;
    }

    private parseActionStatement(): ActionStatement | null {
        const action = this.parseActionExpression();
        if (!action) {
            return null;
        }
        return {
            type: NodeType.ActionStatement,
            consequence: action,
        };
    }

    private parseExpression(): Expression | null {
        return this.parseComparisonExpression();
    }

    private parseBinaryExpression(): Expression | null {
        let left = this.parseUnaryExpression();
        if (!left) return null;

        while (this.peekToken.type === TokenType.OPERATOR && (this.peekToken.value === "+" || this.peekToken.value === "-")) {
            this.nextToken(); // currentToken = operator
            const operator = this.currentToken.value;

            this.nextToken(); // Move to the right-hand side of the expression
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
        if (this.currentToken.type === TokenType.KEYWORD && this.currentToken.value === "NOT") {
            this.nextToken();
            const argument = this.parseUnaryExpression();
            if (!argument) return null;

            return {
                type: NodeType.UnaryExpression,
                operator: "NOT",
                argument,
            } as UnaryExpression;
        }

        return this.parsePrimary();
    }

    private parsePrimary(): Expression | null {
        if (this.currentToken.type === TokenType.KEYWORD && this.currentToken.value === "TRUE") {
            return { type: NodeType.BooleanLiteral, value: true } as BooleanLiteral;
        }
        if (this.currentToken.type === TokenType.KEYWORD && this.currentToken.value === "FALSE") {
            return { type: NodeType.BooleanLiteral, value: false } as BooleanLiteral;
        }
        if (this.currentToken.type === TokenType.IDENTIFIER) {
            return { type: NodeType.Identifier, value: this.currentToken.value };
        }
        if (this.currentToken.type === TokenType.NUMBER) {
            return { type: NodeType.NumberLiteral, value: parseFloat(this.currentToken.value) };
        }
        if (this.currentToken.type === TokenType.STRING) {
            return { type: NodeType.StringLiteral, value: this.currentToken.value };
        }
        return null;
    }

    public parse(): Program {
        return this.parseProgram();
    }
}
