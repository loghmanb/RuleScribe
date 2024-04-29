export enum FunctionType {
    BUILTIN,
    USER_DEFINED,
    CLASS_METHOD,
    UNDEFINED,
}

// Define token types
export type TokenType =
  | 'NUMBER'
  | 'FLOAT'
  | 'STRING'
  | 'BOOLEAN'
  | 'IDENTIFIER'
  | 'PLUS'
  | 'MINUS'
  | 'MULTIPLY'
  | 'DIVIDE'
  | 'MODULO'
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'LESS_THAN'
  | 'GREATER_THAN'
  | 'LESS_THAN_OR_EQUAL'
  | 'GREATER_THAN_OR_EQUAL'
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'ASSIGN'
  | 'RULE'
  | 'WHEN'
  | 'IF'
  | 'THEN'
  | 'ELSE'
  | 'END'
  | 'WHILE'
  | 'DO'
  | 'FOR'
  | 'FROM'
  | 'TO'
  | 'STEP'
  | 'CALL_FUNCTION'
  | 'FUNCTION'
  | 'RETURN'
  | 'NEWLINE'
  | 'EOF';

// Define a token
export interface Token {
  type: TokenType;
  value: string | number | boolean | null;
}

export type FunctionDefinition<T extends Token[] | Function> = {
    parameters?: string[];
    body: T;
    thisArg?: any;
}

export type RuleDefenition = {
  condition: Token[];
  body: Token[];
}

export interface ILexer {
    reset(): void;
    getNextToken(): Token;
}