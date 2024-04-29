import Engine from "./engine";
import { Lexer } from "./lexer";
import EngineScope from "./scope";

describe("Engine", () => {
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
    const engineScope = new EngineScope();
    const engine = new Engine(new Lexer(text, engineScope));
    await engine.parse(engineScope);
    expect(engineScope.lookup('k')).toEqual(10);
  });

  it("should parse for-loop", async () => {
    const text = `
  k = 1
  For i From 1 To 10 Step 2 Do
    k = k * i
  End`;
    const engineScope = new EngineScope();
    const engine = new Engine(new Lexer(text, engineScope));
    await engine.parse(engineScope);
    expect(engineScope.lookup('k')).toEqual(945);
    expect(engineScope.lookup('i')).toEqual(11);
  });

  it("should parse if-then", async () => {
    const text = `
  k = 1234
  If k > 1000 Then
    k = 1000
  End`;
    const engineScope = new EngineScope();
    const engine = new Engine(new Lexer(text, engineScope));
    await engine.parse(engineScope);
    expect(engineScope.lookup('k')).toEqual(1000);
  });

  it("should parse if-then-else", async () => {
    const text = `
  k = 1234
  If k < 1000 Then
    k = 1000
  Else
    k = 500
  End`;
    const engineScope = new EngineScope();
    const engine = new Engine(new Lexer(text, engineScope));
    await engine.parse(engineScope);
    expect(engineScope.lookup('k')).toEqual(500);
  });

  it("should call instance method", async () => {
    const text = `k = method@testClass(15)`;
    const symbols: Map<string, any> = new Map();
    symbols.set('testClass', new TestClass(2));
    const engineScope = new EngineScope(new Map(), symbols);
    const engine = new Engine(new Lexer(text, engineScope));
    await engine.parse(engineScope);
    expect(engineScope.lookup('k')).toEqual(30);
  });

  it("should call instance property", async () => {
    const text = `k = testClass.field`;
    const symbols: Map<string, any> = new Map();
    symbols.set('testClass', new TestClass(2));
    const engineScope = new EngineScope(new Map(), symbols);
    const engine = new Engine(new Lexer(text, engineScope));
    await engine.parse(engineScope);
    expect(engineScope.lookup('k')).toEqual(2);
  });

  it("should calculate mathematical expression", async () => {
    const text = `
x = 5
y = 3
z = (x + y) / (x - y)
`;
    const symbols: Map<string, any> = new Map();
    const engineScope = new EngineScope(new Map(), symbols);
    const engine = new Engine(new Lexer(text, engineScope));
    await engine.parse(engineScope);
    expect(engineScope.lookup('z')).toEqual(4);
  });

  it("should calculate logical expression - AND operator", async () => {
    const text = `
x = 5
y = 3
z = (x > y) And x < y
`;
    const symbols: Map<string, any> = new Map();
    const engineScope = new EngineScope(new Map(), symbols);
    const engine = new Engine(new Lexer(text, engineScope));
    await engine.parse(engineScope);
    expect(engineScope.lookup('z')).toEqual(false);
  });  

  it("should calculate logical expression - OR operator", async () => {
    const text = `
x = 5
y = 3
z = (x > y) Or x < y
`;
    const symbols: Map<string, any> = new Map();
    const engineScope = new EngineScope(new Map(), symbols);
    const engine = new Engine(new Lexer(text, engineScope));
    await engine.parse(engineScope);
    expect(engineScope.lookup('z')).toEqual(true);
  });

  it("should calculate logical expression - NOT operator", async () => {
    const text = `
x = 5
y = 3
z = Not (x > y)
`;
    const symbols: Map<string, any> = new Map();
    const engineScope = new EngineScope(new Map(), symbols);
    const engine = new Engine(new Lexer(text, engineScope));
    await engine.parse(engineScope);
    expect(engineScope.lookup('z')).toEqual(false);
  });

  it('should define and call function', async () => {
    const text = `
    Function print(x) Do
      If (x * 2 > 10) Then
        Return -1
      Else
        Return x + 4
      End
      y = 1
    End
    y = print(10)
    z = print(2)
    `;
    const symbols: Map<string, any> = new Map();
    const engineScope = new EngineScope(new Map(), symbols);
    const engine = new Engine(new Lexer(text, engineScope));
    await engine.parse(engineScope);
    expect(engineScope.lookup('y')).toEqual(-1);
    expect(engineScope.lookup('z')).toEqual(6);
  });

  it('should define and fire rules', async () => {
    const text = `
    x = 10
    Rule "Cut x on 5"
    When x > 5 Then
      x = 5
    End

    y = 15
    Rule "Cut y if more than 20"
    When y > 20 Then
      y = 20
    End
    `;
    const symbols: Map<string, any> = new Map();
    const engineScope = new EngineScope(new Map(), symbols);
    const engine = new Engine(new Lexer(text, engineScope));
    await engine.parse(engineScope);
    await engine.fire(engineScope);
    expect(engineScope.lookup('x')).toEqual(5);
    expect(engineScope.lookup('y')).toEqual(15);
  });
  
})

