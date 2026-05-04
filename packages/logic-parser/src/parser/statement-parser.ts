import { 
    TokenType, NodeType, Statement, IfStatement, WhileStatement, ForStatement,
    FunctionDeclaration, CallStatement, WaitStatement, ScanStatement,
    AssignmentStatement, ActionStatement, Identifier,
    QueryStatement, BreakStatement, ContinueStatement, ReturnStatement, Expression
} from "../types";
import type { Parser } from "./parser";

const ACTIONS = new Set(["FIRE", "MOVE", "STOP", "MOVE_FAST", "BACKUP", "BURST_FIRE", "PATHFIND"]);

/** Helper to check peekToken type without TS narrowing side-effects. */
function peekIs(parser: Parser, type: TokenType): boolean {
    return (parser.peekToken.type as TokenType) === type;
}

/** Helper to check currentToken type without TS narrowing side-effects. */
function curIs(parser: Parser, type: TokenType): boolean {
    return (parser.currentToken.type as TokenType) === type;
}

export class StatementParser {
    constructor(private parser: Parser) {}

    public parseStatement(): Statement | null {
        if (curIs(this.parser, TokenType.QUERY_CALL)) {
            return this.parseQueryStatement();
        }

        if (curIs(this.parser, TokenType.KEYWORD)) {
            switch (this.parser.currentToken.value) {
                case "IF": return this.parseIfStatement();
                case "WHILE": return this.parseWhileStatement();
                case "FOR": return this.parseForStatement();
                case "FUNCTION": return this.parseFunctionDeclaration();
                case "CALL": return this.parseCallStatement();
                case "WAIT": return this.parseWaitStatement();
                case "SCAN": return this.parseScanStatement();
                case "SET": return this.parseAssignmentStatement();
                case "BREAK": return { type: NodeType.BreakStatement } as BreakStatement;
                case "CONTINUE": return { type: NodeType.ContinueStatement } as ContinueStatement;
                case "RETURN": return this.parseReturnStatement();
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
            !curIs(this.parser, TokenType.EOF) &&
            !(curIs(this.parser, TokenType.KEYWORD) && endTokens.includes(this.parser.currentToken.value))
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

    // FOR i = 0 TO 10 DO ... END
    private parseForStatement(): ForStatement | null {
        if (!this.parser.expectPeek(TokenType.IDENTIFIER)) return null;
        const variable: Identifier = { type: NodeType.Identifier, value: this.parser.currentToken.value };

        if (!this.parser.expectPeek(TokenType.ASSIGN)) return null;

        this.parser.nextToken(); // Move to start expression
        const start = this.parser.expressionParser.parseExpression();
        if (!start) return null;

        // Expect TO keyword
        if (!peekIs(this.parser, TokenType.KEYWORD)) return null;
        this.parser.nextToken();
        if (this.parser.currentToken.value !== "TO") return null;

        this.parser.nextToken(); // Move to end expression
        const end = this.parser.expressionParser.parseExpression();
        if (!end) return null;

        // Expect DO keyword
        if (!peekIs(this.parser, TokenType.KEYWORD)) return null;
        this.parser.nextToken();
        if (String(this.parser.currentToken.value) !== "DO") return null;

        const body = this.parseBlockStatement(["END"]);
        return { type: NodeType.ForStatement, variable, start, end, body };
    }

    // FUNCTION name(param1, param2) ... END
    private parseFunctionDeclaration(): FunctionDeclaration | null {
        if (!this.parser.expectPeek(TokenType.IDENTIFIER)) return null;
        const name: Identifier = { type: NodeType.Identifier, value: this.parser.currentToken.value };
        
        let params: Identifier[] | undefined;

        // Check for parameter list: FUNCTION name(a, b, c)
        if (peekIs(this.parser, TokenType.LPAREN)) {
            this.parser.nextToken(); // consume '('
            params = [];
            
            if (!peekIs(this.parser, TokenType.RPAREN)) {
                // Parse first param
                if (this.parser.expectPeek(TokenType.IDENTIFIER)) {
                    params.push({ type: NodeType.Identifier, value: this.parser.currentToken.value });
                }
                // Parse additional comma-separated params
                while (peekIs(this.parser, TokenType.COMMA)) {
                    this.parser.nextToken(); // consume ','
                    if (this.parser.expectPeek(TokenType.IDENTIFIER)) {
                        params.push({ type: NodeType.Identifier, value: this.parser.currentToken.value });
                    }
                }
            }

            // consume ')'
            if (peekIs(this.parser, TokenType.RPAREN)) {
                this.parser.nextToken();
            }
        }

        const body = this.parseBlockStatement(["END"]);
        return { type: NodeType.FunctionDeclaration, name, params, body };
    }

    // CALL name or CALL name(arg1, arg2)
    private parseCallStatement(): CallStatement | null {
        if (!this.parser.expectPeek(TokenType.IDENTIFIER)) return null;
        const functionName: Identifier = { type: NodeType.Identifier, value: this.parser.currentToken.value };
        
        let args: Expression[] | undefined;

        // Check for argument list: CALL name(expr, expr)
        if (peekIs(this.parser, TokenType.LPAREN)) {
            this.parser.nextToken(); // consume '('
            args = [];

            if (!peekIs(this.parser, TokenType.RPAREN)) {
                this.parser.nextToken(); // move to first arg
                const firstArg = this.parser.expressionParser.parseExpression();
                if (firstArg) args.push(firstArg);

                while (peekIs(this.parser, TokenType.COMMA)) {
                    this.parser.nextToken(); // consume ','
                    this.parser.nextToken(); // move to next arg
                    const arg = this.parser.expressionParser.parseExpression();
                    if (arg) args.push(arg);
                }
            }

            // consume ')'
            if (peekIs(this.parser, TokenType.RPAREN)) {
                this.parser.nextToken();
            }
        }

        return { type: NodeType.CallStatement, functionName, args };
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

    // SET var = expr  OR  SET var[index] = expr
    private parseAssignmentStatement(): AssignmentStatement | null {
        if (!this.parser.expectPeek(TokenType.IDENTIFIER)) return null;
        const name: Identifier = { type: NodeType.Identifier, value: this.parser.currentToken.value };

        // Check for indexed assignment: SET arr[i] = value
        let index: Expression | undefined;
        if (peekIs(this.parser, TokenType.LBRACKET)) {
            this.parser.nextToken(); // consume '['
            this.parser.nextToken(); // move to index expression
            index = this.parser.expressionParser.parseExpression() ?? undefined;
            // consume ']'
            if (peekIs(this.parser, TokenType.RBRACKET)) {
                this.parser.nextToken();
            }
        }

        if (!this.parser.expectPeek(TokenType.ASSIGN)) return null;

        this.parser.nextToken(); // Move to the assigned value
        const value = this.parser.expressionParser.parseExpression();
        if (!value) return null;

        return { type: NodeType.AssignmentStatement, name, value, index };
    }

    private parseActionStatement(): ActionStatement | null {
        const command = this.parser.currentToken.value;
        const args: (Identifier)[] = [];

        while (
            peekIs(this.parser, TokenType.NUMBER) || 
            peekIs(this.parser, TokenType.IDENTIFIER) || 
            peekIs(this.parser, TokenType.STRING)
        ) {
            this.parser.nextToken();
            const arg = this.parser.expressionParser.parseExpression();
            if (arg && (arg.type === NodeType.Identifier || arg.type === NodeType.NumberLiteral || arg.type === NodeType.StringLiteral)) {
                args.push(arg as Identifier);
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
        if (peekIs(this.parser, TokenType.LPAREN)) {
            this.parser.nextToken(); // consume LPAREN
            if (peekIs(this.parser, TokenType.RPAREN)) {
                this.parser.nextToken(); // consume RPAREN
            }
        }
        return { type: NodeType.QueryStatement, query };
    }

    // RETURN or RETURN expr
    private parseReturnStatement(): ReturnStatement {
        // Check if the next token could be an expression
        if (
            peekIs(this.parser, TokenType.NUMBER) ||
            peekIs(this.parser, TokenType.IDENTIFIER) ||
            peekIs(this.parser, TokenType.STRING) ||
            peekIs(this.parser, TokenType.LPAREN) ||
            peekIs(this.parser, TokenType.LBRACKET) ||
            (peekIs(this.parser, TokenType.KEYWORD) && 
                (this.parser.peekToken.value === "TRUE" || this.parser.peekToken.value === "FALSE" || this.parser.peekToken.value === "NOT"))
        ) {
            this.parser.nextToken();
            const value = this.parser.expressionParser.parseExpression() ?? undefined;
            return { type: NodeType.ReturnStatement, value };
        }
        return { type: NodeType.ReturnStatement };
    }
}
