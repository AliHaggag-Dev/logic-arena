import {
    Token,
    TokenType,
} from "./types";

export class Lexer {
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
                token = { type: TokenType.OPERATOR, value: this.char };
                break;
            case '>':
                token = { type: TokenType.OPERATOR, value: this.char };
                break;
            case '=':
                if (this.peekChar() === '=') {
                    this.readChar();
                    token = { type: TokenType.OPERATOR, value: "==" };
                } else {
                    token = { type: TokenType.ASSIGN, value: "=" };
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
                        case "STOP":
                        case "MOVE_FAST":
                        case "BACKUP":
                        case "BURST_FIRE":
                        case "PATHFIND":
                        case "SET": // Add SET as a keyword
                        case "NOT":
                        case "TRUE":
                        case "FALSE":
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
            case ",": // Handle comma for potential future use
                token = { type: TokenType.COMMA, value: "," };
                break;
            case ":": // Handle colon for potential future use
                token = { type: TokenType.COLON, value: ":" };
                break;
            case "+":
            case "-":
                token = { type: TokenType.OPERATOR, value: this.char };
                break;
        }
        this.readChar();
        return token;
    }
}