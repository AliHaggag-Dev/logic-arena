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
    "GET_VISIBLE_COUNT",
    "GET_OBSTACLE_DISTANCE",
    "GET_OBSTACLE_TYPE"
];

/** Built-in math/utility functions that return values inside expressions. */
const BUILTIN_FUNCTIONS = new Set([
    "ABS", "SQRT", "POW", "SIN", "COS", "TAN",
    "ATAN2", "MIN", "MAX", "FLOOR", "CEIL", "ROUND",
    "LENGTH", "PUSH", "POP", "RANDOM", "LOG",
    // ── Phase 1: Advanced Sensory Arrays ──────────────────────────────────
    "GET_ALL_VISIBLE_ENEMIES", "RAYCAST",
    // ── Phase 3: Swarm Intelligence (Inter-Robot Communication) ───────────
    "BROADCAST", "RECEIVE",
]);

const MAX_TOKEN_STRING_LENGTH = 255;

function isWhitespace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\n' || char === '\r' || char === '\f' || char === '\v';
}

function isAlpha(char: string): boolean {
    const code = char.charCodeAt(0);
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isDigit(char: string): boolean {
    const code = char.charCodeAt(0);
    return code >= 48 && code <= 57;
}

function isIdentifierStart(char: string): boolean {
    return isAlpha(char) || char === '_';
}

function isIdentifierPart(char: string): boolean {
    return isIdentifierStart(char) || isDigit(char);
}

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
        while (this.char !== null && isWhitespace(this.char)) {
            this.readChar();
        }
    }

    private skipComments(): void {
        while (this.char === '/' && this.peekChar() === '/') {
            // Skip until end of line or end of input
            while (this.char !== null) {
                const c: string = this.char;
                if (c === '\n' || c === '\r') break;
                this.readChar();
            }
            this.skipWhitespace();
        }
    }

    private readIdentifier(): string {
        let start = this.position - 1;
        while (this.char !== null && isIdentifierPart(this.char)) {
            this.readChar();
        }
        return this.input.slice(start, this.position - 1);
    }

    private readNumber(): string {
        let start = this.position - 1;
        let hasDot = false;
        while (this.char !== null) {
            if (isDigit(this.char)) {
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
            if ((this.position - 1) - start >= MAX_TOKEN_STRING_LENGTH) {
                throw new Error(`AliScript string literal exceeds ${MAX_TOKEN_STRING_LENGTH} characters`);
            }
            this.readChar();
        }
        const str = this.input.slice(start, this.position - 1);
        this.readChar(); // Consume closing quote
        return str;
    }

    public nextToken(): Token {
        this.skipWhitespace();

        // Skip single-line comments
        this.skipComments();
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
            case '[':
                token = { type: TokenType.LBRACKET, value: "[" };
                break;
            case ']':
                token = { type: TokenType.RBRACKET, value: "]" };
                break;
            case '{':
                token = { type: TokenType.LBRACE, value: "{" };
                break;
            case '}':
                token = { type: TokenType.RBRACE, value: "}" };
                break;
            case '.':
                token = { type: TokenType.DOT, value: "." };
                break;
            case ',':
                token = { type: TokenType.COMMA, value: "," };
                break;
            case ':':
                token = { type: TokenType.COLON, value: ":" };
                break;
            default:
                if (isIdentifierStart(this.char)) {
                    const value = this.readIdentifier();
                    const upper = value.toUpperCase();
                    if (isKeyword(value)) {
                        return { type: TokenType.KEYWORD, value: upper };
                    }
                    if (QUERY_FUNCTIONS.includes(upper)) {
                        return { type: TokenType.QUERY_CALL, value: upper };
                    }
                    if (BUILTIN_FUNCTIONS.has(upper)) {
                        return { type: TokenType.IDENTIFIER, value: upper };
                    }
                    return { type: TokenType.IDENTIFIER, value };
                } else if (isDigit(this.char)) {
                    return { type: TokenType.NUMBER, value: this.readNumber() };
                }
                token = { type: TokenType.EOF, value: "" };
                break;
        }

        this.readChar();
        return token;
    }
}
