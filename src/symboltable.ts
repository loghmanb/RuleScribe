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

// Define symbol table to store variables and functions
export default class SymbolTable {
    private funcs: Map<string, FunctionDefinition<Token[]>> = new Map();
  
    constructor(
      public readonly builtinFunction: Map<string, FunctionDefinition<CallableFunction>> = new Map(),
      private symbols: Map<string, any> = new Map()) {
    }
  
    public define(name: string, value: any): void {
      this.symbols.set(name, value);
    }
  
    public lookup(name: string): any {
      if (name.indexOf('.') !== -1) {
        const namePath = name.split('.');
        let obj = this.symbols.get(namePath[0]);
        for (let i=1; i<namePath.length; i+=1) {
          obj = obj[namePath[i]];
        }
        return obj;
      }
      return this.symbols.get(name);
    }
  
    public declare(name: string, parameters: string[], body: Token[]) {
      this.funcs.set(name,  { parameters, body });
    }
  
    public functionType(name: string): FunctionType {
      if (this.funcs.has(name)) {
        return FunctionType.USER_DEFINED;
      }
      if (this.builtinFunction.has(name)) {
        return FunctionType.BUILTIN;
      }
      if (name.indexOf('@')!==-1) {
        return FunctionType.CLASS_METHOD;
      }
      return FunctionType.UNDEFINED;
    }
  
    public getFunc(name: string): FunctionDefinition<Token[] | Function> | undefined {
      if (name.indexOf('@')!==-1) {
        const methodPath = name.split('@');
        let method = this.symbols.get(methodPath.pop() as string);
        let thisArg;
        while (methodPath.length>0) {
          thisArg = method;
          method = thisArg[methodPath.pop() as string];
        }
        return {body: method, thisArg};
      }
      return this.funcs.get(name) || this.builtinFunction.get(name);
    }
  
}
  