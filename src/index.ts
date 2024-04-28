// Define token types
type TokenType =
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

export interface ILexer {
  reset(): void;
  getNextToken(): Token;
}

export class CompiledLexer implements ILexer {
  private idx: number = -1;
  constructor(private readonly tokens: Token[]){
  }

  getNextToken(): Token {
    if (this.idx<this.tokens.length-1) {
      this.idx += 1;
      return this.tokens[this.idx];
    }
    return { type: 'EOF', value: null };
  }

  reset(): void {
    this.idx = -1;
  }
}

const RESERVED_KEYWORD = new Set(['If', 'Then', 'Else', 'End', 'Function', 'Do', 'Return', 'While', 'For', 'From', 'To', 'Step']);

const KEYWORD_WITH_END = new Set(['IF', 'FOR', 'WHILE', 'RULE', 'FUNCTION']);

// Define the lexer
export class Lexer implements ILexer {
  private text: string;
  private pos: number = 0;
  private currentChar: string | null = null;

  constructor(text: string, private readonly symbolTable: SymbolTable = new SymbolTable()) {
    this.text = text;
    this.currentChar = text[this.pos];
  }

  private advance(): void {
    this.pos++;
    if (this.pos < this.text.length) {
      this.currentChar = this.text[this.pos];
    } else {
      this.currentChar = null;
    }
  }

  private peek(): string | null {
    const peekPos = this.pos + 1;
    if (peekPos < this.text.length) {
      return this.text[peekPos];
    } else {
      return null;
    }
  }

  private skipWhitespace(): void {
    while (this.currentChar !== null && /\s/.test(this.currentChar)) {
      this.advance();
    }
  }

  private isDigit(char: string | null): boolean {
    return char !== null && /[0-9]/.test(char);
  }

  private isAlpha(char: string | null): boolean {
    return char !== null && /[a-zA-Z_]/.test(char);
  }

  private isAlphaNumeric(char: string | null): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private number(): Token {
    let result = '';
    while (this.currentChar !== null && this.isDigit(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }
    if (this.currentChar === '.' && this.isDigit(this.peek())) {
      result += '.';
      this.advance();
      while (this.currentChar !== null && this.isDigit(this.currentChar)) {
        result += this.currentChar;
        this.advance();
      }
      return { type: 'FLOAT', value: parseFloat(result) };
    }
    return { type: 'NUMBER', value: parseInt(result) };
  }

  private identifier(): Token {
    let result = '';
    while ((this.currentChar !== null) && 
        (['.', '@'].includes(this.currentChar) || this.isAlphaNumeric(this.currentChar))) {
      result += this.currentChar;
      this.advance();
    }
    if (RESERVED_KEYWORD.has(result)) {
      return { type: result.toLocaleUpperCase(), value: result } as any;
    } else if (['True', 'False'].includes(result)) {
      return { type: 'BOOLEAN', value: (result.toLowerCase()==='true')};
    } else if (['And', 'Or', 'Not'].includes(result)) {
      return { type: result.toUpperCase(), value: null } as any;
    } else if ((this.symbolTable!==null) && 
        (this.symbolTable.functionType(result) !== FunctionType.UNDEFINED)) {
      return { type: 'CALL_FUNCTION', value: result };
    }
    return { type: 'IDENTIFIER', value: result };
  }

  public getNextToken(): Token {
    while (this.currentChar !== null) {
      if (/\s/.test(this.currentChar)) {
        this.skipWhitespace();
        continue;
      }

      if (this.isDigit(this.currentChar)) {
        return this.number();
      }

      if (this.currentChar === '"') {
        this.advance();
        let result = '';
        while (this.currentChar !== '"' && this.currentChar !== null) {
          result += this.currentChar;
          this.advance();
        }
        this.advance(); // Consume the closing quote
        return { type: 'STRING', value: result };
      }

      if (this.isAlpha(this.currentChar)) {
        return this.identifier();
      }

      if (this.currentChar === '+') {
        this.advance();
        return { type: 'PLUS', value: '+' };
      }

      if (this.currentChar === '-') {
        this.advance();
        return { type: 'MINUS', value: '-' };
      }

      if (this.currentChar === '*') {
        this.advance();
        return { type: 'MULTIPLY', value: '*' };
      }

      if (this.currentChar === '/') {
        this.advance();
        return { type: 'DIVIDE', value: '/' };
      }

      if (this.currentChar === '%') {
        this.advance();
        return { type: 'MODULO', value: '%' };
      }

      if (this.currentChar === '=') {
        if (this.peek() === '=') {
          this.advance();
          this.advance();
          return { type: 'EQUALS', value: '==' };
        }
        this.advance();
        return { type: 'ASSIGN', value: '=' };
      }

      if (this.currentChar === '!') {
        if (this.peek() === '=') {
          this.advance();
          this.advance();
          return { type: 'NOT_EQUALS', value: '!=' };
        }
        this.advance();
        return { type: 'NOT', value: '!' };
      }

      if (this.currentChar === '<') {
        if (this.peek() === '=') {
          this.advance();
          this.advance();
          return { type: 'LESS_THAN_OR_EQUAL', value: '<=' };
        }
        this.advance();
        return { type: 'LESS_THAN', value: '<' };
      }

      if (this.currentChar === '>') {
        if (this.peek() === '=') {
          this.advance();
          this.advance();
          return { type: 'GREATER_THAN_OR_EQUAL', value: '>=' };
        }
        this.advance();
        return { type: 'GREATER_THAN', value: '>' };
      }

      if (this.currentChar === '&') {
        if (this.peek() === '&') {
          this.advance();
          this.advance();
          return { type: 'AND', value: '&&' };
        }
      }

      if (this.currentChar === '|') {
        if (this.peek() === '|') {
          this.advance();
          this.advance();
          return { type: 'OR', value: '||' };
        }
      }

      if (this.currentChar === '(') {
        this.advance();
        return { type: 'LPAREN', value: '(' };
      }

      if (this.currentChar === ')') {
        this.advance();
        return { type: 'RPAREN', value: ')' };
      }

      if (this.currentChar === ',') {
        this.advance();
        return { type: 'COMMA', value: ',' };
      }

      if (this.currentChar === '\n') {
        this.advance();
        return { type: 'NEWLINE', value: '\n' };
      }

      throw new Error(`Invalid character: ${this.currentChar}`);
    }
    return { type: 'EOF', value: null };
  }

  reset(): void {
    this.pos = 0;
    this.currentChar = this.text[this.pos];
  }
}

enum FunctionType {
  BUILTIN,
  USER_DEFINED,
  CLASS_METHOD,
  UNDEFINED,
}

export type FunctionDefinition<T extends Token[] | Function> = {
  parameters?: string[];
  body: T;
  thisArg?: any;
}

// Define symbol table to store variables and functions
export class SymbolTable {
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

// Define the parser
export class Parser {
  private currentToken: Token | null = null;

  constructor(private readonly lexer: ILexer) {
    this.lexer = lexer;
    this.currentToken = this.lexer.getNextToken();
  }

  private eat(tokenType: TokenType): void {
    if (this.currentToken?.type === tokenType) {
      this.currentToken = this.lexer.getNextToken();
    } else {
      throw new Error(`Expected ${tokenType}, got ${this.currentToken?.type}`);
    }
  }

  private async factor(symbolTable: SymbolTable): Promise<number | string | boolean> {
    const token = this.currentToken;
    if (token?.type === 'CALL_FUNCTION') {
      const result = await this.callFunction(symbolTable);
      return (result === undefined) ? false: result;
    } else if (token?.type === 'NUMBER' || token?.type === 'FLOAT' || token?.type === 'BOOLEAN' || token?.type === 'STRING') {
      this.eat(token.type);
      return token.value as number | string | boolean;
    } else if (token?.type === 'IDENTIFIER') {
      const name = token.value as string;
      this.eat('IDENTIFIER');
      const value = symbolTable.lookup(name);
      if (value === undefined) {
        throw new Error(`Variable '${name}' is not defined`);
      }
      return value;
    } else if (token?.type === 'LPAREN') {
      this.eat('LPAREN');
      const result = await this.expr(symbolTable);
      this.eat('RPAREN');
      return result;
    } else if (token?.type === 'MINUS') {
      this.eat('MINUS');
      return - await this.factor(symbolTable);
    } else if (token?.type === 'NOT') {
      this.eat('NOT');
      return ! await this.factor(symbolTable);
    }
    throw new Error(`Unexpected token: ${token?.type}`);
  }

  private async term(symbolTable: SymbolTable): Promise<number> {
    let result = await this.factor(symbolTable) as number;
    while (this.currentToken?.type === 'MULTIPLY' || this.currentToken?.type === 'DIVIDE' || this.currentToken?.type === 'MODULO') {
      const token = this.currentToken;
      if (token?.type === 'MULTIPLY') {
        this.eat('MULTIPLY');
        result *= await this.factor(symbolTable) as number;
      } else if (token?.type === 'DIVIDE') {
        this.eat('DIVIDE');
        result /= await this.factor(symbolTable) as number;
      } else if (token?.type === 'MODULO') {
        this.eat('MODULO');
        result %= await this.factor(symbolTable) as number;
      }
    }
    return result;
  }

  private async expr(symbolTable: SymbolTable): Promise<number | string | boolean> {
    let result: string | boolean | number = await this.term(symbolTable) as number;
    while (
      this.currentToken?.type === 'PLUS' ||
      this.currentToken?.type === 'MINUS' ||
      this.currentToken?.type === 'LESS_THAN' ||
      this.currentToken?.type === 'LESS_THAN_OR_EQUAL' ||
      this.currentToken?.type === 'GREATER_THAN' ||
      this.currentToken?.type === 'GREATER_THAN_OR_EQUAL' ||
      this.currentToken?.type === 'EQUALS' ||
      this.currentToken?.type === 'NOT_EQUALS' ||
      this.currentToken?.type === 'AND' ||
      this.currentToken?.type === 'OR'
    ) {
      const token = this.currentToken;
      if (token?.type === 'PLUS') {
        this.eat('PLUS');
        result = (result as number) + await this.term(symbolTable) as number;
      } else if (token?.type === 'MINUS') {
        this.eat('MINUS');
        result = (result as number) - await this.term(symbolTable) as number;
      } else if (token?.type === 'LESS_THAN') {
        this.eat('LESS_THAN');
        result = (result as number) < (await this.term(symbolTable) as number);
      } else if (token?.type === 'LESS_THAN_OR_EQUAL') {
        this.eat('LESS_THAN_OR_EQUAL');
        result = (result as number) <= (await this.term(symbolTable) as number);
      } else if (token?.type === 'GREATER_THAN') {
        this.eat('GREATER_THAN');
        result = (result as number) > (await this.term(symbolTable) as number);
      } else if (token?.type === 'GREATER_THAN_OR_EQUAL') {
        this.eat('GREATER_THAN_OR_EQUAL');
        result = (result as number) >= (await this.term(symbolTable) as number);
      } else if (token?.type === 'EQUALS') {
        this.eat('EQUALS');
        result = result == (await this.term(symbolTable) as number);
      } else if (token?.type === 'NOT_EQUALS') {
        this.eat('NOT_EQUALS');
        result = result != (await this.term(symbolTable) as number);
      } else if (token?.type === 'AND') {
        this.eat('AND');
        result = result && (await this.term(symbolTable) as number);
      } else if (token?.type === 'OR') {
        this.eat('OR');
        result = result || (await this.term(symbolTable) as number);
      }
    }
    return result;
  }

  private async assignment(symbolTable: SymbolTable): Promise<void> {
    const name = this.currentToken?.value as string;
    this.eat('IDENTIFIER');
    this.eat('ASSIGN');
    const value = await this.expr(symbolTable);
    symbolTable.define(name, value);
  }

  private async statement(symbolTable: SymbolTable): Promise<void> {
    const token = this.currentToken;
    if (token?.type === 'IDENTIFIER') {
      await this.assignment(symbolTable);
    } else if (token?.type === 'IF') {
      await this.ifStatement(symbolTable);
    } else if (token?.type === 'WHILE') {
      await this.whileLoop(symbolTable);
    } else if (token?.type === 'FOR') {
      await this.forLoop(symbolTable);
    } else if (token?.type === 'FUNCTION') {
      this.functionDefinition(symbolTable);
    } else if (token?.type === 'CALL_FUNCTION') {
      await this.callFunction(symbolTable);
    } else if (token?.type === 'RETURN') {
      this.eat('RETURN');
      symbolTable.define('@RETURN_VALUE', await this.expr(symbolTable));
    } else {
      throw new Error(`Unexpected token: ${token?.type}`);
    }
  }

  private async ifStatement(symbolTable: SymbolTable): Promise<void> {
    this.eat('IF');
    const condition = await this.expr(symbolTable);
    this.eat('THEN');
    while (this.currentToken?.type !== 'ELSE' && this.currentToken?.type !== 'END') {
      if (condition) {
        await this.statement(symbolTable);
      } else {
        this.eat(this.currentToken?.type as any);
      }
    }
    if (this.currentToken?.type === 'ELSE') {
      this.eat('ELSE');
      while ((this.currentToken?.type as any) !== 'END') {
        if (!condition) {
          await this.statement(symbolTable);
        } else {
          this.eat(this.currentToken?.type);
        }
      }
    }
    this.eat('END');
  }

  private async forLoop(symbolTable: SymbolTable): Promise<void> {
    this.eat('FOR');
    const name = this.currentToken?.value as string;
    this.eat('IDENTIFIER');
    this.eat('FROM');
    symbolTable.define(name, await this.expr(symbolTable));
    this.eat('TO');
    const to = `@${name}_end`;
    symbolTable.define(to, await this.expr(symbolTable));
    const step = `@${name}_step`;
    if (this.currentToken?.type==='STEP') {
      this.eat('STEP');
      symbolTable.define(step, await this.expr(symbolTable));
    } else {
      symbolTable.define(step, 1);
    }
    this.eat('DO');
    const body: Token[] = [];
    let end = 1
    if (KEYWORD_WITH_END.has(this.currentToken?.type as any)) {
      end += 1;
    }
    while ((end>=1) || (this.currentToken?.type as any) !== 'END') {
      body.push(this.currentToken!);
      this.eat(this.currentToken!.type);
      if (this.currentToken?.type === 'END') {
        end -= 1;
      } else if (KEYWORD_WITH_END.has(this.currentToken?.type as any)) {
        end += 1;
      }
    }
    this.eat('END');
    const parser = new Parser(new CompiledLexer(body));
    while (symbolTable.lookup(name) <= symbolTable.lookup(to)) {
      await parser.parse(symbolTable);
      parser.reset();
      symbolTable.define(name, symbolTable.lookup(name)+symbolTable.lookup(step));
    }
  }

  private async whileLoop(symbolTable: SymbolTable): Promise<void> {
    this.eat('WHILE');
    const condition: Token[] = [];
    while (this.currentToken?.type! !=='DO') {
      condition.push(this.currentToken!);
      this.eat(this.currentToken?.type!);
    }
    this.eat('DO');
    const body: Token[] = [];
    let end = 1;
    if (KEYWORD_WITH_END.has(this.currentToken?.type!)) {
      end += 1;
    }
    while ((end>=1) && (this.currentToken?.type as string !== 'END')) {
      body.push(this.currentToken!);
      this.eat(this.currentToken?.type!);
      if (KEYWORD_WITH_END.has(this.currentToken?.type!)) {
        end += 1;
      } else if (this.currentToken?.type as string === 'END') {
        end -= 1;
      }
    }
    this.eat('END');

    const parser = new Parser(new CompiledLexer(body));
    const condParser = new Parser(new CompiledLexer(condition));
    let cond = await condParser.expr(symbolTable);
    while (cond) {
      await parser.parse(symbolTable);
      parser.reset();
      condParser.reset();
      cond = await condParser.expr(symbolTable);
    }
  }

  private async callFunction(symbolTable: SymbolTable): Promise<number | string | boolean | undefined> {
    const funcSymbolTable = new SymbolTable(symbolTable.builtinFunction);
    const funcName = this.currentToken?.value as string;
    const funcType = symbolTable.functionType(funcName)
    const func = symbolTable.getFunc(funcName);
    if (funcType === FunctionType.UNDEFINED || func === undefined) {
      throw new Error(`'${funcName}' is not declared!`);
    }
    this.eat('CALL_FUNCTION');
    this.eat('LPAREN');
    let idx = 0;
    const args: any[] = [];
    while (this.currentToken?.type !== 'RPAREN') {
      const param = await this.expr(symbolTable);
      if (func.parameters !== undefined) {
        funcSymbolTable.define(func.parameters[idx], param);
      }
      args.push(param);
      if (this.currentToken?.type === 'COMMA') {
        this.eat('COMMA');
      }
      idx += 1;
    }
    this.eat('RPAREN');
    if (funcType === FunctionType.BUILTIN || funcType === FunctionType.CLASS_METHOD) {
      return await (func as FunctionDefinition<Function>).body.apply(func.thisArg, args);
    } else {
      const parser = new Parser(new CompiledLexer((func as FunctionDefinition<Token[]>).body));
      await parser.parse(funcSymbolTable);
      return funcSymbolTable.lookup('@RETURN_VALUE');
    }
  }

  private functionDefinition(symbolTable: SymbolTable): void {
    this.eat('FUNCTION');
    const name = this.currentToken?.value as string;
    this.eat('IDENTIFIER');
    this.eat('LPAREN');
    const parameters: string[] = [];
    while (this.currentToken?.type !== 'RPAREN') {
      parameters.push(this.currentToken?.value as string);
      this.eat('IDENTIFIER');
      if (this.currentToken?.type === 'COMMA') {
        this.eat('COMMA');
      }
    }
    this.eat('RPAREN');
    this.eat('DO');
    const body: Token[] = [];
    let end = 1;
    if (KEYWORD_WITH_END.has(this.currentToken?.type)) {
      end += 1;
    }
    while ((end >= 1) || (this.currentToken?.type as any) !== 'END') {
      body.push(this.currentToken);
      this.eat(this.currentToken?.type);
      if (KEYWORD_WITH_END.has(this.currentToken?.type)) {
        end += 1;
      } else if ((this.currentToken?.type as any)==='END') {
        end -= 1;
      }
    }
    symbolTable.declare(name, parameters, body);
    this.eat('END');
  }

  public async parse(symbolTable?: SymbolTable): Promise<void> {
    while (this.currentToken?.type !== 'EOF') {
      await this.statement(symbolTable);
    }
  }

  public reset(): void {
    this.lexer.reset();
    this.currentToken = this.lexer.getNextToken();
  }
}
