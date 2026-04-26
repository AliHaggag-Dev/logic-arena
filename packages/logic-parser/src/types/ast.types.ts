export enum NodeType {
  Program = "Program",
  IfStatement = "IfStatement",
  WhileStatement = "WhileStatement",
  FunctionDeclaration = "FunctionDeclaration",
  CallStatement = "CallStatement",
  WaitStatement = "WaitStatement",
  ScanStatement = "ScanStatement",
  AssignmentStatement = "AssignmentStatement",
  ActionStatement = "ActionStatement",
  ComparisonExpression = "ComparisonExpression",
  ActionExpression = "ActionExpression",
  Identifier = "Identifier",
  NumberLiteral = "NumberLiteral",
  StringLiteral = "StringLiteral",
  BooleanLiteral = "BooleanLiteral",
  BinaryExpression = "BinaryExpression",
  UnaryExpression = "UnaryExpression",
  QueryStatement = "QueryStatement",
}

export interface BaseNode {
  type: NodeType;
}

export interface Statement extends BaseNode {}

export type Expression = 
  | Identifier 
  | NumberLiteral 
  | StringLiteral 
  | BooleanLiteral 
  | BinaryExpression 
  | UnaryExpression 
  | ComparisonExpression 
  | ActionExpression;

export interface Program extends Statement {
  type: NodeType.Program;
  body: Statement[];
}

export interface IfStatement extends Statement {
  type: NodeType.IfStatement;
  condition: Expression;
  consequence: Statement[];
  alternate?: Statement[];
}

export interface WhileStatement extends Statement {
  type: NodeType.WhileStatement;
  condition: Expression;
  body: Statement[];
}

export interface FunctionDeclaration extends Statement {
  type: NodeType.FunctionDeclaration;
  name: Identifier;
  body: Statement[];
}

export interface CallStatement extends Statement {
  type: NodeType.CallStatement;
  functionName: Identifier;
}

export interface WaitStatement extends Statement {
  type: NodeType.WaitStatement;
  ticks: NumberLiteral;
}

export interface ScanStatement extends Statement {
  type: NodeType.ScanStatement;
}

export interface QueryStatement extends Statement {
  type: NodeType.QueryStatement;
  query: string;
}

export interface AssignmentStatement extends Statement {
  type: NodeType.AssignmentStatement;
  name: Identifier;
  value: Expression;
}

export interface ActionStatement extends Statement {
  type: NodeType.ActionStatement;
  consequence: ActionExpression;
}

export interface ComparisonExpression extends BaseNode {
  type: NodeType.ComparisonExpression;
  left: Expression;
  operator: string;
  right: Expression;
}

export interface ActionExpression extends BaseNode {
  type: NodeType.ActionExpression;
  command: string;
  args?: (Identifier | NumberLiteral | StringLiteral)[];
}

export interface BinaryExpression extends BaseNode {
  type: NodeType.BinaryExpression;
  left: Expression;
  operator: string;
  right: Expression;
}

export interface UnaryExpression extends BaseNode {
  type: NodeType.UnaryExpression;
  operator: string;
  argument: Expression;
}

export interface Identifier extends BaseNode {
  type: NodeType.Identifier;
  value: string;
}

export interface NumberLiteral extends BaseNode {
  type: NodeType.NumberLiteral;
  value: number;
}

export interface StringLiteral extends BaseNode {
  type: NodeType.StringLiteral;
  value: string;
}

export interface BooleanLiteral extends BaseNode {
  type: NodeType.BooleanLiteral;
  value: boolean;
}
