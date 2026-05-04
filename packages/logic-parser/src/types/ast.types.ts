export enum NodeType {
  Program = "Program",
  IfStatement = "IfStatement",
  WhileStatement = "WhileStatement",
  ForStatement = "ForStatement",
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
  FunctionCallExpression = "FunctionCallExpression",
  ArrayLiteral = "ArrayLiteral",
  IndexExpression = "IndexExpression",
  BreakStatement = "BreakStatement",
  ContinueStatement = "ContinueStatement",
  ReturnStatement = "ReturnStatement",
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
  | ActionExpression
  | FunctionCallExpression
  | ArrayLiteral
  | IndexExpression;

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

export interface ForStatement extends Statement {
  type: NodeType.ForStatement;
  variable: Identifier;
  start: Expression;
  end: Expression;
  body: Statement[];
}

export interface FunctionDeclaration extends Statement {
  type: NodeType.FunctionDeclaration;
  name: Identifier;
  params?: Identifier[];
  body: Statement[];
}

export interface CallStatement extends Statement {
  type: NodeType.CallStatement;
  functionName: Identifier;
  args?: Expression[];
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
  index?: Expression;
}

export interface ActionStatement extends Statement {
  type: NodeType.ActionStatement;
  consequence: ActionExpression;
}

export interface BreakStatement extends Statement {
  type: NodeType.BreakStatement;
}

export interface ContinueStatement extends Statement {
  type: NodeType.ContinueStatement;
}

export interface ReturnStatement extends Statement {
  type: NodeType.ReturnStatement;
  value?: Expression;
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

export interface FunctionCallExpression extends BaseNode {
  type: NodeType.FunctionCallExpression;
  name: string;
  args: Expression[];
}

export interface ArrayLiteral extends BaseNode {
  type: NodeType.ArrayLiteral;
  elements: Expression[];
}

export interface IndexExpression extends BaseNode {
  type: NodeType.IndexExpression;
  object: Expression;
  index: Expression;
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
