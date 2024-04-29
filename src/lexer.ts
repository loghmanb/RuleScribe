import EngineScope from "./scope";
import { FunctionType, ILexer, Token } from "./types";

const RESERVED_KEYWORD = new Set(['If', 'Then', 'Else', 'End', 'Function', 'Do', 'Return', 'While', 'For', 'From', 'To', 'Step', 'Rule', 'When']);

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

// Define the lexer
export class Lexer implements ILexer {
    private text: string;
    private pos: number = 0;
    private currentChar: string | null = null;
  
    constructor(text: string, private readonly engineScope: EngineScope = new EngineScope()) {
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
      } else if ((this.engineScope!==null) && 
          (this.engineScope.functionType(result) !== FunctionType.UNDEFINED)) {
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
