import { 
    TokenType, NodeType, Statement, IfStatement, WhileStatement, 
    FunctionDeclaration, CallStatement, WaitStatement, ScanStatement,
    AssignmentStatement, ActionStatement, Identifier, ActionExpression,
    QueryStatement
} from "../types";
import type { Parser } from "./parser";

const ACTIONS = new Set(["FIRE", "MOVE", "STOP", "MOVE_FAST", "BACKUP", "BURST_FIRE", "PATHFIND"]);

export class StatementParser {
    constructor(private parser: Parser) {}

    public parseStatement(): Statement | null {
        if (this.parser.currentToken.type === TokenType.QUERY_CALL) {
            return this.parseQueryStatement();
        }

        if (this.parser.currentToken.type === TokenType.KEYWORD) {
            switch (this.parser.currentToken.value) {
                case "IF": return this.parseIfStatement();
                case "WHILE": return this.parseWhileStatement();
                case "FUNCTION": return this.parseFunctionDeclaration();
                case "CALL": return this.parseCallStatement();
                case "WAIT": return this.parseWaitStatement();
                case "SCAN": return this.parseScanStatement();
                case "SET": return this.parseAssignmentStatement();
                default:
                    if (ACTIONS.has(this.parser.currentToken.value)) {
                        return this.parseActionStatement();
                    }
            }
        }
        return null;
    }

    private parseBlockStatement(endTokens: string[]): Statement[] {
        const body: Statement[] = [];
        this.parser.nextToken(); // Move into body
        while (
            this.parser.currentToken.type !== TokenType.EOF &&
            !(this.parser.currentToken.type === TokenType.KEYWORD && endTokens.includes(this.parser.currentToken.value))
        ) {
            const statement = this.parseStatement();
            if (statement) body.push(statement);
            this.parser.nextToken();
        }
        return body;
    }

    private parseIfStatement(): IfStatement | null {
        this.parser.nextToken(); // Consume IF
        const condition = this.parser.expressionParser.parseExpression();
        if (!condition) return null;

        if (!this.parser.expectPeek(TokenType.KEYWORD) || this.parser.currentToken.value !== "THEN") return null;

        const consequence = this.parseBlockStatement(["ELSE", "END"]);
        let alternate: Statement[] | undefined;

        if (String(this.parser.currentToken.value) === "ELSE") {
            alternate = this.parseBlockStatement(["END"]);
        }

        return { type: NodeType.IfStatement, condition, consequence, alternate };
    }

    private parseWhileStatement(): WhileStatement | null {
        this.parser.nextToken(); // Consume WHILE
        const condition = this.parser.expressionParser.parseExpression();
        if (!condition) return null;

        if (!this.parser.expectPeek(TokenType.KEYWORD) || this.parser.currentToken.value !== "DO") return null;

        const body = this.parseBlockStatement(["END"]);
        return { type: NodeType.WhileStatement, condition, body };
    }

    private parseFunctionDeclaration(): FunctionDeclaration | null {
        if (!this.parser.expectPeek(TokenType.IDENTIFIER)) return null;
        const name: Identifier = { type: NodeType.Identifier, value: this.parser.currentToken.value };
        const body = this.parseBlockStatement(["END"]);
        return { type: NodeType.FunctionDeclaration, name, body };
    }

    private parseCallStatement(): CallStatement | null {
        if (!this.parser.expectPeek(TokenType.IDENTIFIER)) return null;
        return {
            type: NodeType.CallStatement,
            functionName: { type: NodeType.Identifier, value: this.parser.currentToken.value }
        };
    }

    private parseWaitStatement(): WaitStatement | null {
        if (!this.parser.expectPeek(TokenType.NUMBER)) return null;
        return {
            type: NodeType.WaitStatement,
            ticks: { type: NodeType.NumberLiteral, value: parseFloat(this.parser.currentToken.value) }
        };
    }

    private parseScanStatement(): ScanStatement | null {
        return { type: NodeType.ScanStatement };
    }

    private parseAssignmentStatement(): AssignmentStatement | null {
        if (!this.parser.expectPeek(TokenType.IDENTIFIER)) return null;
        const name: Identifier = { type: NodeType.Identifier, value: this.parser.currentToken.value };

        if (!this.parser.expectPeek(TokenType.ASSIGN)) return null;

        this.parser.nextToken(); // Move to the assigned value
        const value = this.parser.expressionParser.parseExpression();
        if (!value) return null;

        return { type: NodeType.AssignmentStatement, name, value };
    }

    private parseActionStatement(): ActionStatement | null {
        const command = this.parser.currentToken.value;
        const args: any[] = [];

        while (
            this.parser.peekToken.type === TokenType.NUMBER || 
            this.parser.peekToken.type === TokenType.IDENTIFIER || 
            this.parser.peekToken.type === TokenType.STRING
        ) {
            this.parser.nextToken();
            const arg = this.parser.expressionParser.parseExpression();
            if (arg && (arg.type === NodeType.Identifier || arg.type === NodeType.NumberLiteral || arg.type === NodeType.StringLiteral)) {
                args.push(arg);
            }
        }

        return {
            type: NodeType.ActionStatement,
            consequence: { type: NodeType.ActionExpression, command, args }
        };
    }

    private parseQueryStatement(): QueryStatement | null {
        const query = this.parser.currentToken.value;
        // Optionally consume ()
        if (this.parser.peekToken.type === TokenType.LPAREN) {
            this.parser.nextToken(); // consume LPAREN
            if ((this.parser.peekToken.type as TokenType) === TokenType.RPAREN) {
                this.parser.nextToken(); // consume RPAREN
            }
        }
        return { type: NodeType.QueryStatement, query };
    }
}
