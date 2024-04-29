import { FunctionDefinition, Lexer, Parser, SymbolTable } from ".";

describe("Parser", () => {
  class TestClass {
    constructor(public field: number) {
    }

    method(x: number) {
      return x * this.field;
    }
  }

  it("should parse while-loop", async () => {
    const text = `
k = 0
While k<10 Do
  k = k + 2
End`;
    const symbolTable = new SymbolTable();
    const parser = new Parser(new Lexer(text, symbolTable));
    await parser.parse(symbolTable);
    expect(symbolTable.lookup('k')).toEqual(10);
  });

  it("should parse for-loop", async () => {
    const text = `
  k = 1
  For i From 1 To 10 Step 2 Do
    k = k * i
  End`;
    const symbolTable = new SymbolTable();
    const parser = new Parser(new Lexer(text, symbolTable));
    await parser.parse(symbolTable);
    expect(symbolTable.lookup('k')).toEqual(945);
    expect(symbolTable.lookup('i')).toEqual(11);
  });

  it("should parse if-then", async () => {
    const text = `
  k = 1234
  If k > 1000 Then
    k = 1000
  End`;
    const symbolTable = new SymbolTable();
    const parser = new Parser(new Lexer(text, symbolTable));
    await parser.parse(symbolTable);
    expect(symbolTable.lookup('k')).toEqual(1000);
  });

  it("should parse if-then-else", async () => {
    const text = `
  k = 1234
  If k < 1000 Then
    k = 1000
  Else
    k = 500
  End`;
    const symbolTable = new SymbolTable();
    const parser = new Parser(new Lexer(text, symbolTable));
    await parser.parse(symbolTable);
    expect(symbolTable.lookup('k')).toEqual(500);
  });

  it("should call instance method", async () => {
    const text = `k = method@testClass(15)`;
    const symbols: Map<string, any> = new Map();
    symbols.set('testClass', new TestClass(2));
    const symbolTable = new SymbolTable(new Map(), symbols);
    const parser = new Parser(new Lexer(text, symbolTable));
    await parser.parse(symbolTable);
    expect(symbolTable.lookup('k')).toEqual(30);
  });

  it("should call instance property", async () => {
    const text = `k = testClass.field`;
    const symbols: Map<string, any> = new Map();
    symbols.set('testClass', new TestClass(2));
    const symbolTable = new SymbolTable(new Map(), symbols);
    const parser = new Parser(new Lexer(text, symbolTable));
    await parser.parse(symbolTable);
    expect(symbolTable.lookup('k')).toEqual(2);
  });

  it("should calculate mathematical expression", async () => {
    const text = `
x = 5
y = 3
z = (x + y) / (x - y)
`;
    const symbols: Map<string, any> = new Map();
    const symbolTable = new SymbolTable(new Map(), symbols);
    const parser = new Parser(new Lexer(text, symbolTable));
    await parser.parse(symbolTable);
    expect(symbolTable.lookup('z')).toEqual(4);
  });

  it("should calculate logical expression - AND operator", async () => {
    const text = `
x = 5
y = 3
z = (x > y) And x < y
`;
    const symbols: Map<string, any> = new Map();
    const symbolTable = new SymbolTable(new Map(), symbols);
    const parser = new Parser(new Lexer(text, symbolTable));
    await parser.parse(symbolTable);
    expect(symbolTable.lookup('z')).toEqual(false);
  });  

  it("should calculate logical expression - OR operator", async () => {
    const text = `
x = 5
y = 3
z = (x > y) Or x < y
`;
    const symbols: Map<string, any> = new Map();
    const symbolTable = new SymbolTable(new Map(), symbols);
    const parser = new Parser(new Lexer(text, symbolTable));
    await parser.parse(symbolTable);
    expect(symbolTable.lookup('z')).toEqual(true);
  });

  it("should calculate logical expression - NOT operator", async () => {
    const text = `
x = 5
y = 3
z = Not (x > y)
`;
    const symbols: Map<string, any> = new Map();
    const symbolTable = new SymbolTable(new Map(), symbols);
    const parser = new Parser(new Lexer(text, symbolTable));
    await parser.parse(symbolTable);
    expect(symbolTable.lookup('z')).toEqual(false);
  });
  
/*
  it("should", async () => {
    const text = `
    k = 0
    While k<10 Do
      k = k + 2
    End
    For i From 1 To 10 Step 2 Do
      If k>10 Then
        log(k)
      End
      k = k + 1
    End
  
    x = 10.5
    y = 20
    z = (x + y) / 2
    If (z > 10) Then
      If Not (x < 10) Then
        z = z * 2
      End
    Else
        z = z / 2
    End
    method(myClass.field)
    method2@myClass()
    Function print(x) Do
      If (x * 2 > 10) Then
        Return -1
      Else
        Return x + 4
      End
      y = 1
    End
    
    w = print(z)
    log(w)
    method(w)
  `;
  / *
    Rule "My First Rule"
    When order.total > 10
    Then
      applyDicount@Order(10)
    End
  * /
  
    class MyClass {
      public field: string = '';
      public async method(param: number){
        console.log(`field: ${this.field}, param: ${param}`);
      }
      public async method2() {
        console.log('hello from method2');
      }
    }
    const myClass = new MyClass();
    myClass.field = 'my-field';
    const builtinFuncs = new Map<string, FunctionDefinition<Function>>();
    builtinFuncs.set('log', {
      parameters: ['message'],
      body: console.log,
      thisArg: null,
    });
    builtinFuncs.set('method', {
      parameters: ['param'],
      body: myClass.method,
      thisArg: myClass,
    });
    const symbols: Map<string, any> = new Map();
    symbols.set('myClass', myClass);
    const symbolTable = new SymbolTable(builtinFuncs, symbols);
    const parser = new Parser(new Lexer(text, symbolTable));
    try {
    await parser.parse(symbolTable);
    } catch (e) {
      console.log(e);
    }
    console.log(symbolTable);
  
  });*/
})

