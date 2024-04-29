import { CompiledLexer, ILexer } from "./lexer";
import SymbolTable, { FunctionDefinition, FunctionType, Token, TokenType } from "./symboltable";


const KEYWORD_WITH_END = new Set(['IF', 'FOR', 'WHILE', 'RULE', 'FUNCTION']);


// Define the parser
export default class Engine {
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
        result = (result as number) > (await this.expr(symbolTable) as number);
      } else if (token?.type === 'GREATER_THAN_OR_EQUAL') {
        this.eat('GREATER_THAN_OR_EQUAL');
        result = (result as number) >= (await this.expr(symbolTable) as number);
      } else if (token?.type === 'EQUALS') {
        this.eat('EQUALS');
        result = result === await this.expr(symbolTable);
      } else if (token?.type === 'NOT_EQUALS') {
        this.eat('NOT_EQUALS');
        result = result != await this.expr(symbolTable);
      } else if (token?.type === 'AND') {
        this.eat('AND');
        const other =  await this.expr(symbolTable);
        result = result && other;
      } else if (token?.type === 'OR') {
        this.eat('OR');
        const other = await this.expr(symbolTable);
        result = result || other;
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
    } else if (token?.type === 'RULE') {
      await this.ruleDefenition(symbolTable);
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
    const body: Token[] = this.getBody('DO');
    const engine = new Engine(new CompiledLexer(body));
    while (symbolTable.lookup(name) <= symbolTable.lookup(to)) {
      await engine.parse(symbolTable);
      engine.reset();
      symbolTable.define(name, symbolTable.lookup(name)+symbolTable.lookup(step));
    }
  }

  private async whileLoop(symbolTable: SymbolTable): Promise<void> {
    this.eat('WHILE');
    const condition = this.getCondition('DO');
    const body = this.getBody('DO');

    const engine = new Engine(new CompiledLexer(body));
    const condParser = new Engine(new CompiledLexer(condition));
    let cond = await condParser.expr(symbolTable);
    while (cond) {
      await engine.parse(symbolTable);
      engine.reset();
      condParser.reset();
      cond = await condParser.expr(symbolTable);
    }
  }

  private getCondition(end: 'DO' | 'THEN'): Token[] {
    const condition: Token[] = [];
    while (this.currentToken?.type! !== end) {
      condition.push(this.currentToken!);
      this.eat(this.currentToken?.type!);
    }
    return condition;
  }

  private getBody(start: 'DO' | 'THEN') {
    this.eat(start);
    const body: Token[] = [];
    let end = 1;
    if (KEYWORD_WITH_END.has(this.currentToken?.type!)) {
      end += 1;
    }
    while ((end>=1) || (this.currentToken?.type as string !== 'END')) {
      body.push(this.currentToken!);
      this.eat(this.currentToken?.type!);
      if (KEYWORD_WITH_END.has(this.currentToken?.type!)) {
        end += 1;
      } else if (this.currentToken?.type as string === 'END') {
        end -= 1;
      }
    }
    this.eat('END');
    return body;
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
      const engine = new Engine(new CompiledLexer((func as FunctionDefinition<Token[]>).body));
      await engine.parse(funcSymbolTable);
      return funcSymbolTable.lookup('@RETURN_VALUE');
    }
  }

  private ruleDefenition(symbolTable: SymbolTable): void {
    this.eat('RULE');
    const name = this.currentToken?.value as string;
    this.eat('STRING');
    this.eat('WHEN');
    const condition = this.getCondition('THEN');
    const body = this.getBody('THEN');
    symbolTable.addRule(name, { condition, body })
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
    const body = this.getBody('DO');
    symbolTable.declare(name, parameters, body);
  }

  public async parse(symbolTable: SymbolTable): Promise<void> {
    while (this.currentToken?.type !== 'EOF') {
      await this.statement(symbolTable);
    }
  }

  public reset(): void {
    this.lexer.reset();
    this.currentToken = this.lexer.getNextToken();
  }
}
