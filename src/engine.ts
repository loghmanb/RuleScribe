import { CompiledLexer } from "./lexer";
import EngineScope from "./scope";
import { FunctionDefinition, FunctionType, ILexer, Token, TokenType } from "./types";

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

  private async factor(engineScope: EngineScope): Promise<number | string | boolean> {
    const token = this.currentToken;
    if (token?.type === 'CALL_FUNCTION') {
      const result = await this.callFunction(engineScope);
      return (result === undefined) ? false: result;
    } else if (token?.type === 'NUMBER' || token?.type === 'FLOAT' || token?.type === 'BOOLEAN' || token?.type === 'STRING') {
      this.eat(token.type);
      return token.value as number | string | boolean;
    } else if (token?.type === 'IDENTIFIER') {
      const name = token.value as string;
      this.eat('IDENTIFIER');
      const value = engineScope.lookup(name);
      if (value === undefined) {
        throw new Error(`Variable '${name}' is not defined`);
      }
      return value;
    } else if (token?.type === 'LPAREN') {
      this.eat('LPAREN');
      const result = await this.expr(engineScope);
      this.eat('RPAREN');
      return result;
    } else if (token?.type === 'MINUS') {
      this.eat('MINUS');
      return - await this.factor(engineScope);
    } else if (token?.type === 'NOT') {
      this.eat('NOT');
      return ! await this.factor(engineScope);
    }
    throw new Error(`Unexpected token: ${token?.type}`);
  }

  private async term(engineScop: EngineScope): Promise<number> {
    let result = await this.factor(engineScop) as number;
    while (this.currentToken?.type === 'MULTIPLY' || this.currentToken?.type === 'DIVIDE' || this.currentToken?.type === 'MODULO') {
      const token = this.currentToken;
      if (token?.type === 'MULTIPLY') {
        this.eat('MULTIPLY');
        result *= await this.factor(engineScop) as number;
      } else if (token?.type === 'DIVIDE') {
        this.eat('DIVIDE');
        result /= await this.factor(engineScop) as number;
      } else if (token?.type === 'MODULO') {
        this.eat('MODULO');
        result %= await this.factor(engineScop) as number;
      }
    }
    return result;
  }

  private async expr(engineScop: EngineScope): Promise<number | string | boolean> {
    let result: string | boolean | number = await this.term(engineScop) as number;
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
        result = (result as number) + await this.term(engineScop) as number;
      } else if (token?.type === 'MINUS') {
        this.eat('MINUS');
        result = (result as number) - await this.term(engineScop) as number;
      } else if (token?.type === 'LESS_THAN') {
        this.eat('LESS_THAN');
        result = (result as number) < (await this.term(engineScop) as number);
      } else if (token?.type === 'LESS_THAN_OR_EQUAL') {
        this.eat('LESS_THAN_OR_EQUAL');
        result = (result as number) <= (await this.term(engineScop) as number);
      } else if (token?.type === 'GREATER_THAN') {
        this.eat('GREATER_THAN');
        result = (result as number) > (await this.expr(engineScop) as number);
      } else if (token?.type === 'GREATER_THAN_OR_EQUAL') {
        this.eat('GREATER_THAN_OR_EQUAL');
        result = (result as number) >= (await this.expr(engineScop) as number);
      } else if (token?.type === 'EQUALS') {
        this.eat('EQUALS');
        result = result === await this.expr(engineScop);
      } else if (token?.type === 'NOT_EQUALS') {
        this.eat('NOT_EQUALS');
        result = result != await this.expr(engineScop);
      } else if (token?.type === 'AND') {
        this.eat('AND');
        const other =  await this.expr(engineScop);
        result = result && other;
      } else if (token?.type === 'OR') {
        this.eat('OR');
        const other = await this.expr(engineScop);
        result = result || other;
      }
    }
    return result;
  }

  private async assignment(engineScope: EngineScope): Promise<void> {
    const name = this.currentToken?.value as string;
    this.eat('IDENTIFIER');
    this.eat('ASSIGN');
    const value = await this.expr(engineScope);
    engineScope.define(name, value);
  }

  private async statement(engineScope: EngineScope): Promise<void> {
    const token = this.currentToken;
    if (token?.type === 'IDENTIFIER') {
      await this.assignment(engineScope);
    } else if (token?.type === 'IF') {
      await this.ifStatement(engineScope);
    } else if (token?.type === 'WHILE') {
      await this.whileLoop(engineScope);
    } else if (token?.type === 'FOR') {
      await this.forLoop(engineScope);
    } else if (token?.type === 'RULE') {
      await this.ruleDefenition(engineScope);
    } else if (token?.type === 'FUNCTION') {
      this.functionDefinition(engineScope);
    } else if (token?.type === 'CALL_FUNCTION') {
      await this.callFunction(engineScope);
    } else if (token?.type === 'RETURN') {
      this.eat('RETURN');
      engineScope.define('@RETURN_VALUE', await this.expr(engineScope));
    } else {
      throw new Error(`Unexpected token: ${token?.type}`);
    }
  }

  private async ifStatement(engineScop: EngineScope): Promise<void> {
    this.eat('IF');
    const condition = await this.expr(engineScop);
    this.eat('THEN');
    while (this.currentToken?.type !== 'ELSE' && this.currentToken?.type !== 'END') {
      if (condition) {
        await this.statement(engineScop);
      } else {
        this.eat(this.currentToken?.type as any);
      }
    }
    if (this.currentToken?.type === 'ELSE') {
      this.eat('ELSE');
      while ((this.currentToken?.type as any) !== 'END') {
        if (!condition) {
          await this.statement(engineScop);
        } else {
          this.eat(this.currentToken?.type);
        }
      }
    }
    this.eat('END');
  }

  private async forLoop(engineScope: EngineScope): Promise<void> {
    this.eat('FOR');
    const name = this.currentToken?.value as string;
    this.eat('IDENTIFIER');
    this.eat('FROM');
    engineScope.define(name, await this.expr(engineScope));
    this.eat('TO');
    const to = `@${name}_end`;
    engineScope.define(to, await this.expr(engineScope));
    const step = `@${name}_step`;
    if (this.currentToken?.type==='STEP') {
      this.eat('STEP');
      engineScope.define(step, await this.expr(engineScope));
    } else {
      engineScope.define(step, 1);
    }
    const body: Token[] = this.getBody('DO');
    const engine = new Engine(new CompiledLexer(body));
    while (engineScope.lookup(name) <= engineScope.lookup(to)) {
      await engine.parse(engineScope);
      engine.reset();
      engineScope.define(name, engineScope.lookup(name)+engineScope.lookup(step));
    }
  }

  private async whileLoop(engineScop: EngineScope): Promise<void> {
    this.eat('WHILE');
    const condition = this.getCondition('DO');
    const body = this.getBody('DO');

    const engine = new Engine(new CompiledLexer(body));
    const condParser = new Engine(new CompiledLexer(condition));
    let cond = await condParser.expr(engineScop);
    while (cond) {
      await engine.parse(engineScop);
      engine.reset();
      condParser.reset();
      cond = await condParser.expr(engineScop);
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

  private async callFunction(engineScope: EngineScope): Promise<number | string | boolean | undefined> {
    const funcEngineScope = new EngineScope(engineScope.builtinFunction);
    const funcName = this.currentToken?.value as string;
    const funcType = engineScope.functionType(funcName)
    const func = engineScope.getFunc(funcName);
    if (funcType === FunctionType.UNDEFINED || func === undefined) {
      throw new Error(`'${funcName}' is not declared!`);
    }
    this.eat('CALL_FUNCTION');
    this.eat('LPAREN');
    let idx = 0;
    const args: any[] = [];
    while (this.currentToken?.type !== 'RPAREN') {
      const param = await this.expr(engineScope);
      if (func.parameters !== undefined) {
        funcEngineScope.define(func.parameters[idx], param);
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
      await engine.parse(funcEngineScope);
      return funcEngineScope.lookup('@RETURN_VALUE');
    }
  }

  private ruleDefenition(engineScope: EngineScope): void {
    this.eat('RULE');
    const name = this.currentToken?.value as string;
    this.eat('STRING');
    this.eat('WHEN');
    const condition = this.getCondition('THEN');
    const body = this.getBody('THEN');
    engineScope.addRule(name, { condition, body })
  }

  private functionDefinition(engineScope: EngineScope): void {
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
    engineScope.declare(name, parameters, body);
  }

  public async parse(engineScop: EngineScope): Promise<void> {
    while (this.currentToken?.type !== 'EOF') {
      await this.statement(engineScop);
    }
  }

  public async fire(engineScope: EngineScope): Promise<void> {
    const rules = engineScope.getRuleNames().map(async (name) => {
      const rule = engineScope.getRule(name);
      if (rule !== undefined) {
        const condEngine = new Engine(new CompiledLexer(rule.condition));
        const cond = await condEngine.expr(engineScope) as boolean;
        if (cond) {
          const bodyEngine = new Engine(new CompiledLexer(rule.body));
          await bodyEngine.parse(engineScope);
        }
      }
    });
    await Promise.all(rules);
  }

  public reset(): void {
    this.lexer.reset();
    this.currentToken = this.lexer.getNextToken();
  }
}
