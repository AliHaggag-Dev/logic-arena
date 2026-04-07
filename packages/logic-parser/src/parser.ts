import { Token, TokenType, NodeType, Program, IfStatement, ComparisonExpression, ActionExpression, Identifier, NumberLiteral, StringLiteral } from "./types";

class Lexer {
    private input: string;
    private position: number = 0;
    private char: string | null = null;

    constructor(input: string) {
        this.input = input;
        this.readChar();
    }

    private readChar(): void {
        this.char = this.position < this.input.length ? this.input[this.position] : null;
        this.position++;
    }

    private peekChar(): string | null {
        return this.position < this.input.length ? this.input[this.position] : null;
    }

    private skipWhitespace(): void {
        while (this.char !== null && /\s/.test(this.char)) {
            this.readChar();
        }
    }

    private readIdentifier(): string {
        let start = this.position - 1;
        while (this.char !== null && /[a-zA-Z_]/.test(this.char)) {
            this.readChar();
        }
        return this.input.slice(start, this.position - 1);
    }

    private readNumber(): string {
        let start = this.position - 1;
        while (this.char !== null && /[0-9]/.test(this.char)) {
            this.readChar();
        }
        return this.input.slice(start, this.position - 1);
    }

    private readString(): string {
        let start = this.position;
        this.readChar(); // Consume opening quote
        while (this.char !== null && this.char !== '"') {
            this.readChar();
        }
        const str = this.input.slice(start, this.position - 1);
        this.readChar(); // Consume closing quote
        return str;
    }

    public nextToken(): Token {
        this.skipWhitespace();

        let token: Token;

        switch (this.char) {
            case '<':
            case '>':
            case '=':
                if (this.char === '=' && this.peekChar() === '=') {
                    this.readChar();
                    token = { type: TokenType.OPERATOR, value: "==" };
                } else {
                    token = { type: TokenType.OPERATOR, value: this.char };
                }
                break;
            case '"':
                token = { type: TokenType.STRING, value: this.readString() };
                return token; // Return early after reading string
            case null:
                token = { type: TokenType.EOF, value: "" };
                break;
            default:
                if (/[a-zA-Z_]/.test(this.char)) {
                    const value = this.readIdentifier();
                    switch (value.toUpperCase()) {
                        case "IF":
                        case "THEN":
                        case "FIRE":
                        case "MOVE":
                            token = { type: TokenType.KEYWORD, value: value.toUpperCase() };
                            break;
                        default:
                            token = { type: TokenType.IDENTIFIER, value: value };
                            break;
                    }
                    return token; // Return early after reading identifier/keyword
                } else if (/[0-9]/.test(this.char)) {
                    token = { type: TokenType.NUMBER, value: this.readNumber() };
                    return token; // Return early after reading number
                } else {
                    token = { type: TokenType.EOF, value: "" }; // Fallback for unexpected characters
                }
                break;
        }
        this.readChar();
        return token;
    }
}

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

    private parseStatement(): IfStatement | null {
        if (this.currentToken.type === TokenType.KEYWORD && this.currentToken.value === "IF") {
            return this.parseIfStatement();
        }
        return null;
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

    private parseComparisonExpression(): ComparisonExpression | null {
        const left = this.parseExpression();
        if (!left) return null;

        if (this.peekToken.type !== TokenType.OPERATOR) return null;
        this.nextToken(); // currentToken = operator
        const operator = this.currentToken.value;

        this.nextToken(); // Move to the right-hand side of the expression
        const right = this.parseExpression();
        if (!right) return null;

        return {
            type: NodeType.ComparisonExpression,
            left: left as (Identifier | NumberLiteral),
            operator,
            right: right as (Identifier | NumberLiteral),
        };
    }

    private parseActionExpression(): ActionExpression | null {
        if (this.currentToken.type === TokenType.KEYWORD && (this.currentToken.value === "FIRE" || this.currentToken.value === "MOVE")) {
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

    private parseExpression(): Identifier | NumberLiteral | StringLiteral | null {
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
