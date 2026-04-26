import { Token, TokenType } from "../types";
import { isKeyword } from "./keywords";

const QUERY_FUNCTIONS = [
    "GET_HEALTH",
    "GET_ENERGY",
    "GET_ENERGY_PCT",
    "GET_DISTANCE",
    "GET_POSITION",
    "GET_ROTATION",
    "GET_FOV_DIR",
    "GET_VISIBLE_COUNT"
];

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
        let hasDot = false;
        while (this.char !== null) {
            if (/[0-9]/.test(this.char)) {
                this.readChar();
            } else if (this.char === '.' && !hasDot) {
                hasDot = true;
                this.readChar();
            } else {
                break;
            }
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

        if (this.char === null) {
            token = { type: TokenType.EOF, value: "" };
            this.readChar();
            return token;
        }

        switch (this.char) {
            case '<':
                if (this.peekChar() === '=') {
                    this.readChar();
                    token = { type: TokenType.OPERATOR, value: "<=" };
                } else {
                    token = { type: TokenType.OPERATOR, value: '<' };
                }
                break;
            case '>':
                if (this.peekChar() === '=') {
                    this.readChar();
                    token = { type: TokenType.OPERATOR, value: ">=" };
                } else {
                    token = { type: TokenType.OPERATOR, value: '>' };
                }
                break;
            case '!':
                if (this.peekChar() === '=') {
                    this.readChar();
                    token = { type: TokenType.OPERATOR, value: "!=" };
                } else {
                    token = { type: TokenType.EOF, value: "" };
                }
                break;
            case '*':
            case '/':
            case '%':
            case '+':
            case '-':
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
                return token;
            case '(':
                token = { type: TokenType.LPAREN, value: "(" };
                break;
            case ')':
                token = { type: TokenType.RPAREN, value: ")" };
                break;
            case ',':
                token = { type: TokenType.COMMA, value: "," };
                break;
            case ':':
                token = { type: TokenType.COLON, value: ":" };
                break;
            default:
                if (/[a-zA-Z_]/.test(this.char)) {
                    const value = this.readIdentifier();
                    if (isKeyword(value)) {
                        return { type: TokenType.KEYWORD, value: value.toUpperCase() };
                    }
                    if (QUERY_FUNCTIONS.includes(value.toUpperCase())) {
                        return { type: TokenType.QUERY_CALL, value: value.toUpperCase() };
                    }
                    return { type: TokenType.IDENTIFIER, value };
                } else if (/[0-9]/.test(this.char)) {
                    return { type: TokenType.NUMBER, value: this.readNumber() };
                }
                token = { type: TokenType.EOF, value: "" }; 
                break;
        }
        
        this.readChar();
        return token;
    }
}
